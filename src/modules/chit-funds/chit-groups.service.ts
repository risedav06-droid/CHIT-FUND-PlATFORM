import type {
  CreateChitGroupInput,
  CreateEnrollmentInput,
} from "@/modules/chit-funds/chit-groups.validation";

import { addMonthsAtUtcDay } from "@/lib/dates";
import { getInstallmentMetrics } from "@/lib/installments";
import { chitGroupsRepository } from "@/modules/chit-funds/chit-groups.repository";
import { membersRepository } from "@/modules/members/members.repository";

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

function formatMoney(value: number) {
  return value.toFixed(2);
}

export const chitGroupsService = {
  listChitGroups() {
    return chitGroupsRepository.listChitGroups();
  },

  countActiveGroups() {
    return chitGroupsRepository.countActiveGroups();
  },

  async listOpenGroupsForEnrollment() {
    const groups = await chitGroupsRepository.listEnrollmentTargetGroups();

    return groups.filter(
      (group) => group._count.enrollments < group.ticketCount,
    );
  },

  async getChitGroupDetail(chitId: string) {
    const detail = await chitGroupsRepository.getChitGroupDetail(chitId);

    if (!detail) {
      return null;
    }

    const installments = detail.installments.map((installment) => ({
      ...installment,
      metrics: getInstallmentMetrics(installment),
    }));

    const enrollmentSummaries = detail.group.enrollments.map((enrollment) => {
      const relatedInstallments = installments.filter(
        (installment) => installment.chitEnrollment.id === enrollment.id,
      );
      const totalDue = relatedInstallments.reduce(
        (sum, installment) => sum + installment.metrics.dueAmount,
        0,
      );
      const totalPaid = relatedInstallments.reduce(
        (sum, installment) => sum + installment.metrics.paidAmount,
        0,
      );
      const overdueInstallments = relatedInstallments.filter(
        (installment) => installment.metrics.isOverdue,
      );
      const overdueAmount = overdueInstallments.reduce(
        (sum, installment) => sum + installment.metrics.outstandingAmount,
        0,
      );

      return {
        ...enrollment,
        totalDue,
        totalPaid,
        outstandingAmount: Math.max(0, totalDue - totalPaid),
        overdueAmount,
        overdueInstallmentsCount: overdueInstallments.length,
      };
    });

    const overdueEnrollments = enrollmentSummaries
      .filter((enrollment) => enrollment.overdueInstallmentsCount > 0)
      .sort((left, right) => {
        if (right.overdueInstallmentsCount !== left.overdueInstallmentsCount) {
          return right.overdueInstallmentsCount - left.overdueInstallmentsCount;
        }

        return right.overdueAmount - left.overdueAmount;
      });

    const upcomingCycles = detail.group.auctionCycles
      .filter((cycle) => cycle.status === "SCHEDULED" && cycle.scheduledAt >= new Date())
      .slice(0, 6);

    return {
      group: detail.group,
      enrollmentSummaries,
      overdueEnrollments,
      installments,
      payments: detail.payments,
      auctionResults: detail.auctionResults,
      payouts: detail.payouts,
      auditLogs: detail.auditLogs,
      upcomingCycles,
      totals: {
        totalDue: installments.reduce(
          (sum, installment) => sum + installment.metrics.dueAmount,
          0,
        ),
        totalPaid: installments.reduce(
          (sum, installment) => sum + installment.metrics.paidAmount,
          0,
        ),
        totalOutstanding: installments.reduce(
          (sum, installment) => sum + installment.metrics.outstandingAmount,
          0,
        ),
        overdueAmount: installments
          .filter((installment) => installment.metrics.isOverdue)
          .reduce(
            (sum, installment) => sum + installment.metrics.outstandingAmount,
            0,
          ),
        paidPayouts: detail.payouts
          .filter((payout) => ["PAID", "DISBURSED"].includes(payout.status))
          .reduce((sum, payout) => sum + Number(payout.netAmount), 0),
        pendingPayouts: detail.payouts
          .filter((payout) =>
            ["PENDING", "APPROVED", "ON_HOLD"].includes(payout.status),
          )
          .reduce((sum, payout) => sum + Number(payout.netAmount), 0),
      },
    };
  },

  async createChitGroup(input: CreateChitGroupInput, actorUserId?: string) {
    const auctionDay = input.auctionDay ?? input.startDate.getUTCDate();
    const prizeAmount = input.installmentAmount * input.ticketCount;

    const auctionCycles = Array.from(
      { length: input.durationMonths },
      (_, index) => ({
        cycleNumber: index + 1,
        scheduledAt: addMonthsAtUtcDay(input.startDate, index, auctionDay),
      }),
    );

    try {
      return await chitGroupsRepository.createChitGroup({
        code: input.code,
        name: input.name,
        description: input.description,
        ticketCount: input.ticketCount,
        installmentAmount: formatMoney(input.installmentAmount),
        prizeAmount: formatMoney(prizeAmount),
        durationMonths: input.durationMonths,
        startDate: input.startDate,
        auctionDay,
        status: "OPEN",
        auctionCycles,
        actorUserId,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new Error("Group code already exists.");
      }

      throw error;
    }
  },

  async enrollMember(input: CreateEnrollmentInput, actorUserId?: string) {
    const [group, member] = await Promise.all([
      chitGroupsRepository.findGroupById(input.chitGroupId),
      membersRepository.findMemberById(input.memberId),
    ]);

    if (!group) {
      throw new Error("Selected chit group was not found.");
    }

    if (!member) {
      throw new Error("Selected member was not found.");
    }

    if (!["OPEN", "ACTIVE"].includes(group.status)) {
      throw new Error("Only open or active groups can accept enrollments.");
    }

    if (!["ACTIVE", "PENDING_KYC"].includes(member.status)) {
      throw new Error("Only active members can be enrolled into a chit group.");
    }

    if (input.ticketNumber > group.ticketCount) {
      throw new Error("Ticket number exceeds the group ticket capacity.");
    }

    const now = new Date();
    const preferredDay = group.startDate.getUTCDate();

    const installments = Array.from({ length: group.durationMonths }, (_, index) => {
      const dueDate = addMonthsAtUtcDay(group.startDate, index, preferredDay);
      const status = dueDate < now ? ("OVERDUE" as const) : ("PENDING" as const);

      return {
        cycleNumber: index + 1,
        dueDate,
        dueAmount: group.installmentAmount.toString(),
        status,
      };
    });

    try {
      return await chitGroupsRepository.createEnrollment({
        chitGroupId: input.chitGroupId,
        memberId: input.memberId,
        ticketNumber: input.ticketNumber,
        isActive: true,
        installments,
        actorUserId,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new Error("That ticket number is already assigned in this group.");
      }

      throw error;
    }
  },
};
