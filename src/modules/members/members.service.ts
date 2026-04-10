import { getInstallmentMetrics } from "@/lib/installments";
import type { CreateMemberInput } from "@/modules/members/members.validation";

import { membersRepository } from "@/modules/members/members.repository";

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export const membersService = {
  listMembers() {
    return membersRepository.listMembers();
  },

  countActiveMembers() {
    return membersRepository.countActiveMembers();
  },

  listMemberOptions() {
    return membersRepository.listMemberOptions();
  },

  findMemberById(memberId: string) {
    return membersRepository.findMemberById(memberId);
  },

  async getMemberDetail(memberId: string) {
    const detail = await membersRepository.getMemberDetail(memberId);

    if (!detail) {
      return null;
    }

    const installments = detail.installments.map((installment) => ({
      ...installment,
      metrics: getInstallmentMetrics(installment),
    }));

    const enrollmentSummaries = detail.member.enrollments.map((enrollment) => {
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
      const overdueAmount = relatedInstallments
        .filter((installment) => installment.metrics.isOverdue)
        .reduce(
          (sum, installment) => sum + installment.metrics.outstandingAmount,
          0,
        );

      return {
        ...enrollment,
        totalDue,
        totalPaid,
        outstandingAmount: Math.max(0, totalDue - totalPaid),
        overdueAmount,
      };
    });

    const overdueInstallments = installments.filter(
      (installment) => installment.metrics.isOverdue,
    );

    return {
      member: detail.member,
      enrollmentSummaries,
      installments,
      payments: detail.payments,
      auctionResults: detail.auctionResults,
      payouts: detail.payouts,
      auditLogs: detail.auditLogs,
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
        overdueAmount: overdueInstallments.reduce(
          (sum, installment) => sum + installment.metrics.outstandingAmount,
          0,
        ),
        overdueInstallmentsCount: overdueInstallments.length,
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

  async createMember(input: CreateMemberInput, actorUserId?: string) {
    try {
      return await membersRepository.createMember({
        ...input,
        actorUserId,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new Error("Member code already exists.");
      }

      throw error;
    }
  },
};
