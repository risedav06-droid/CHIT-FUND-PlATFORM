import { getUtcMonthRange, startOfUtcDay } from "@/lib/dates";
import { getInstallmentMetrics } from "@/lib/installments";
import { toNumber } from "@/lib/utils";
import type { RecordInstallmentPaymentInput } from "@/modules/collections/payments.validation";

import { paymentsRepository } from "@/modules/collections/payments.repository";

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

export const paymentsService = {
  async listPendingInstallments() {
    const installments = await paymentsRepository.listPendingInstallments();

    return installments
      .map((installment) => ({
        ...installment,
        metrics: getInstallmentMetrics(installment),
      }))
      .filter((installment) => installment.metrics.outstandingAmount > 0);
  },

  listRecentPayments() {
    return paymentsRepository.listRecentPayments();
  },

  async getDashboardSummary() {
    const today = startOfUtcDay(new Date());
    const { start, end } = getUtcMonthRange(today);
    const snapshot = await paymentsRepository.getDashboardMetrics({
      monthStart: start,
      monthEnd: end,
      asOf: today,
    });

    const overdueInstallments = snapshot.overdueInstallments.filter((installment) => {
      const metrics = getInstallmentMetrics(installment, today);
      return metrics.isOverdue && metrics.outstandingAmount > 0;
    });

    const overdueGroupMap = new Map<
      string,
      {
        chitId: string;
        code: string;
        name: string;
        overdueCount: number;
        overdueAmount: number;
      }
    >();

    for (const installment of overdueInstallments) {
      const metrics = getInstallmentMetrics(installment, today);
      const existingEntry = overdueGroupMap.get(installment.chitGroupId);

      if (existingEntry) {
        existingEntry.overdueCount += 1;
        existingEntry.overdueAmount += metrics.outstandingAmount;
      } else {
        overdueGroupMap.set(installment.chitGroupId, {
          chitId: installment.chitGroup.id,
          code: installment.chitGroup.code,
          name: installment.chitGroup.name,
          overdueCount: 1,
          overdueAmount: metrics.outstandingAmount,
        });
      }
    }

    return {
      dueThisMonth: toNumber(snapshot.dueThisMonth ?? 0),
      overdueInstallmentsCount: overdueInstallments.length,
      collectionsThisMonth: toNumber(snapshot.collectionsThisMonth ?? 0),
      groupsWithHighestOverdueCount: Array.from(overdueGroupMap.values())
        .sort((left, right) => {
          if (right.overdueCount !== left.overdueCount) {
            return right.overdueCount - left.overdueCount;
          }

          return right.overdueAmount - left.overdueAmount;
        })
        .slice(0, 5),
    };
  },

  async recordInstallmentPayment(
    input: RecordInstallmentPaymentInput,
    actorUserId?: string,
  ) {
    const installment = await paymentsRepository.findInstallmentById(
      input.installmentId,
    );

    if (!installment) {
      throw new Error("Selected installment was not found.");
    }

    if (!installment.chitEnrollment.isActive) {
      throw new Error("Payments cannot be recorded for an inactive enrollment.");
    }

    if (!["OPEN", "ACTIVE"].includes(installment.chitGroup.status)) {
      throw new Error("Payments can only be recorded for open or active groups.");
    }

    if (!["ACTIVE", "PENDING_KYC"].includes(installment.chitEnrollment.member.status)) {
      throw new Error("Payments cannot be recorded for an inactive member.");
    }

    const metrics = getInstallmentMetrics(installment);

    if (metrics.isPaid) {
      throw new Error("This installment has already been fully paid.");
    }

    if (input.amount > metrics.outstandingAmount) {
      throw new Error("Payment amount cannot exceed the outstanding balance.");
    }

    if (input.referenceNo) {
      const duplicateReference = await paymentsRepository.findPaymentByGroupReference(
        installment.chitGroup.id,
        input.referenceNo,
      );

      if (duplicateReference) {
        throw new Error("Reference number already exists in this chit group.");
      }
    }

    const nextPaidAmount = metrics.paidAmount + input.amount;
    const derivedStatus = getInstallmentMetrics(
      {
        dueDate: installment.dueDate,
        dueAmount: installment.dueAmount,
        paidAmount: nextPaidAmount,
      },
      new Date(),
    ).derivedStatus;
    const nextStatus =
      derivedStatus === "PAID"
        ? "PAID"
        : derivedStatus === "OVERDUE"
          ? "OVERDUE"
          : "PARTIALLY_PAID";

    const paidAt = nextStatus === "PAID" ? input.receivedOn : undefined;

    try {
      return await paymentsRepository.recordPayment({
        installmentId: input.installmentId,
        amount: formatMoney(input.amount),
        paymentMode: input.paymentMode,
        referenceNo: input.referenceNo,
        receivedOn: input.receivedOn,
        remarks: input.remarks,
        nextPaidAmount: formatMoney(nextPaidAmount),
        nextStatus,
        paidAt,
        actorUserId,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new Error("Reference number already exists in this chit group.");
      }

      throw error;
    }
  },
};
