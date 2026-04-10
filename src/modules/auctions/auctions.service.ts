import { calculateAuctionPrize } from "@/lib/auctions";
import { getInstallmentMetrics } from "@/lib/installments";
import { toNumber } from "@/lib/utils";
import { auctionsRepository } from "@/modules/auctions/auctions.repository";
import { notificationsService } from "@/modules/notifications/notifications.service";
import type {
  CreateAuctionCycleInput,
  FinalizeAuctionInput,
  RecordBidInput,
} from "@/modules/auctions/auctions.validation";

function formatMoney(value: number) {
  return value.toFixed(2);
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

function fullName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ");
}

const lockedAuctionStatuses = ["SETTLED", "CLOSED", "CANCELLED"] as const;

export const auctionsService = {
  listAuctionCycles() {
    return auctionsRepository.listAuctionCycles();
  },

  listGroupsForCycleCreation() {
    return auctionsRepository.listGroupsForCycleCreation();
  },

  async getAuctionCycleDetail(auctionCycleId: string) {
    const detail = await auctionsRepository.getAuctionCycleDetail(auctionCycleId);

    if (!detail) {
      return null;
    }

    const cycle = detail.cycle;
    const previousWinnerIds = new Set(
      detail.previousWinningCycles
        .filter((winnerCycle) => winnerCycle.id !== cycle.id)
        .map((winnerCycle) => winnerCycle.winningEnrollmentId)
        .filter(Boolean),
    );
    const enrollmentIdsWithBid = new Set(
      cycle.bids.map((bid) => bid.chitEnrollmentId),
    );

    const eligibility = detail.enrollments.map((enrollment) => {
      const reasons: string[] = [];
      const previousInstallments = enrollment.installments.filter(
        (installment) => installment.cycleNumber < cycle.cycleNumber,
      );
      const overduePreviousInstallments = previousInstallments
        .map((installment) => ({
          installment,
          metrics: getInstallmentMetrics(installment),
        }))
        .filter(
          ({ metrics }) =>
            metrics.isOverdue && metrics.outstandingAmount > 0,
        );
      const overdueAmount = overduePreviousInstallments.reduce(
        (sum, { metrics }) => sum + metrics.outstandingAmount,
        0,
      );
      const alreadyWon = previousWinnerIds.has(enrollment.id);
      const hasBid = enrollmentIdsWithBid.has(enrollment.id);

      if (!enrollment.isActive) {
        reasons.push("Enrollment is inactive.");
      }

      if (!["ACTIVE", "PENDING_KYC"].includes(enrollment.member.status)) {
        reasons.push(`Member status is ${enrollment.member.status}.`);
      }

      if (alreadyWon) {
        reasons.push("This ticket already won an earlier cycle.");
      }

      if (overduePreviousInstallments.length > 0) {
        reasons.push(
          `${overduePreviousInstallments.length} previous installment(s) overdue.`,
        );
      }

      return {
        enrollment,
        memberName: fullName(enrollment.member.firstName, enrollment.member.lastName),
        reasons,
        isEligible: reasons.length === 0,
        hasBid,
        overdueAmount,
      };
    });

    const isLocked = lockedAuctionStatuses.includes(
      cycle.status as (typeof lockedAuctionStatuses)[number],
    );
    const eligibleEnrollments = eligibility.filter((item) => item.isEligible);
    const bidEntryEnrollments = eligibleEnrollments.filter((item) => !item.hasBid);
    const ineligibleEnrollments = eligibility.filter((item) => !item.isEligible);
    const winningBid =
      cycle.winningEnrollmentId
        ? cycle.bids.find(
            (bid) => bid.chitEnrollmentId === cycle.winningEnrollmentId,
          )
        : null;

    return {
      cycle,
      eligibleEnrollments,
      bidEntryEnrollments,
      ineligibleEnrollments,
      bids: cycle.bids,
      payout: cycle.payout,
      winningBid,
      auditLogs: detail.auditLogs,
      isLocked,
      result:
        cycle.status === "SETTLED"
          ? {
              grossPrizeAmount: toNumber(cycle.grossPrizeAmount ?? 0),
              discountAmount: toNumber(cycle.discountAmount ?? cycle.winningBidAmount ?? 0),
              netPrizeAmount: toNumber(cycle.netPrizeAmount ?? 0),
              dividendAmount: toNumber(cycle.dividendAmount ?? 0),
            }
          : null,
    };
  },

  async createAuctionCycle(input: CreateAuctionCycleInput, actorUserId?: string) {
    const group = await auctionsRepository.getGroupCycleSeed(input.chitGroupId);

    if (!group) {
      throw new Error("Selected chit group was not found.");
    }

    if (!["OPEN", "ACTIVE"].includes(group.status)) {
      throw new Error("Only open or active chit groups can receive new cycles.");
    }

    const latestCycleNumber = group.auctionCycles[0]?.cycleNumber ?? 0;
    const cycleNumber = latestCycleNumber + 1;

    if (cycleNumber > group.durationMonths) {
      throw new Error("All auction cycles already exist for this chit group.");
    }

    try {
      return await auctionsRepository.createAuctionCycle({
        chitGroupId: input.chitGroupId,
        cycleNumber,
        scheduledAt: input.scheduledAt,
        notes: input.notes,
        actorUserId,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new Error("That auction cycle already exists.");
      }

      throw error;
    }
  },

  async recordBid(input: RecordBidInput, actorUserId?: string) {
    const detail = await this.getAuctionCycleDetail(input.auctionCycleId);

    if (!detail) {
      throw new Error("Auction cycle was not found.");
    }

    if (detail.isLocked) {
      throw new Error("This auction cycle is locked and cannot accept bids.");
    }

    if (!["SCHEDULED", "OPEN"].includes(detail.cycle.status)) {
      throw new Error("Only scheduled or open auction cycles can accept bids.");
    }

    if (!["OPEN", "ACTIVE"].includes(detail.cycle.chitGroup.status)) {
      throw new Error("Only open or active chit groups can run auctions.");
    }

    const eligibility = [
      ...detail.eligibleEnrollments,
      ...detail.ineligibleEnrollments,
    ].find((item) => item.enrollment.id === input.chitEnrollmentId);

    if (!eligibility) {
      throw new Error("Selected enrollment is not part of this chit group.");
    }

    if (!eligibility.isEligible) {
      throw new Error(eligibility.reasons[0] ?? "Selected enrollment is not eligible.");
    }

    if (eligibility.hasBid) {
      throw new Error("A bid has already been recorded for this ticket in this cycle.");
    }

    const grossPrizeAmount = toNumber(detail.cycle.chitGroup.prizeAmount);

    if (input.amount >= grossPrizeAmount) {
      throw new Error("Bid discount must be less than the gross prize amount.");
    }

    try {
      return await auctionsRepository.recordBid({
        auctionCycleId: input.auctionCycleId,
        chitEnrollmentId: input.chitEnrollmentId,
        amount: formatMoney(input.amount),
        remarks: input.remarks,
        actorUserId,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new Error("A bid has already been recorded for this ticket in this cycle.");
      }

      throw error;
    }
  },

  async finalizeAuction(input: FinalizeAuctionInput, actorUserId?: string) {
    const detail = await this.getAuctionCycleDetail(input.auctionCycleId);

    if (!detail) {
      throw new Error("Auction cycle was not found.");
    }

    if (detail.isLocked || detail.payout) {
      throw new Error("This auction has already been finalized.");
    }

    if (detail.bids.length === 0) {
      throw new Error("Record at least one bid before finalizing the auction.");
    }

    const winningBid = detail.bids.find((bid) => bid.id === input.winningBidId);

    if (!winningBid) {
      throw new Error("Selected winning bid was not found for this cycle.");
    }

    const winnerEligibility = detail.eligibleEnrollments.find(
      (item) => item.enrollment.id === winningBid.chitEnrollmentId,
    );

    if (!winnerEligibility) {
      throw new Error("Winning ticket is no longer eligible for auction finalization.");
    }

    const calculation = calculateAuctionPrize(
      toNumber(detail.cycle.chitGroup.prizeAmount),
      toNumber(winningBid.amount),
      detail.cycle.chitGroup.ticketCount,
    );

    const finalizedAuction = await auctionsRepository.finalizeAuction({
      auctionCycleId: input.auctionCycleId,
      winningBidId: input.winningBidId,
      notes: input.notes,
      grossPrizeAmount: formatMoney(calculation.grossPrizeAmount),
      discountAmount: formatMoney(calculation.discountAmount),
      netPrizeAmount: formatMoney(calculation.netPrizeAmount),
      dividendAmount: formatMoney(calculation.dividendAmount),
      actorUserId,
    });

    await notificationsService.notifyAuctionResult({
      cycleId: detail.cycle.id,
      cycleNumber: detail.cycle.cycleNumber,
      chitGroupCode: detail.cycle.chitGroup.code,
      winnerMemberId: winningBid.chitEnrollment.member.id,
      winnerName: fullName(
        winningBid.chitEnrollment.member.firstName,
        winningBid.chitEnrollment.member.lastName,
      ),
      netPrizeAmount: calculation.netPrizeAmount,
    });

    return finalizedAuction;
  },
};
