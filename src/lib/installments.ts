import { differenceInUtcDays, startOfUtcDay } from "@/lib/dates";
import { toNumber } from "@/lib/utils";

export type InstallmentStatusValue =
  | "PENDING"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "WAIVED";

type InstallmentSnapshot = {
  dueDate: Date | string;
  dueAmount: number | string | { toString(): string };
  paidAmount: number | string | { toString(): string };
  status?: InstallmentStatusValue | null;
};

export function deriveInstallmentStatus(
  installment: InstallmentSnapshot,
  asOf = new Date(),
): InstallmentStatusValue {
  if (installment.status === "WAIVED") {
    return "WAIVED";
  }

  const dueAmount = toNumber(installment.dueAmount);
  const paidAmount = toNumber(installment.paidAmount);
  const dueDate = startOfUtcDay(installment.dueDate);
  const effectiveDate = startOfUtcDay(asOf);
  const outstandingAmount = Math.max(0, dueAmount - paidAmount);

  if (outstandingAmount <= 0) {
    return "PAID";
  }

  if (dueDate < effectiveDate) {
    return "OVERDUE";
  }

  if (paidAmount > 0) {
    return "PARTIALLY_PAID";
  }

  return "PENDING";
}

export function getInstallmentMetrics(
  installment: InstallmentSnapshot,
  asOf = new Date(),
) {
  const dueAmount = toNumber(installment.dueAmount);
  const paidAmount = toNumber(installment.paidAmount);
  const outstandingAmount = Math.max(0, dueAmount - paidAmount);
  const derivedStatus = deriveInstallmentStatus(installment, asOf);
  const isPaid = derivedStatus === "PAID";
  const isPartiallyPaid = paidAmount > 0 && !isPaid;
  const isOverdue = derivedStatus === "OVERDUE";
  const daysOverdue = isOverdue
    ? differenceInUtcDays(installment.dueDate, asOf)
    : 0;
  const paidRatio = dueAmount > 0 ? Math.min(1, paidAmount / dueAmount) : 0;

  return {
    dueAmount,
    paidAmount,
    outstandingAmount,
    derivedStatus,
    isPaid,
    isPartiallyPaid,
    isOverdue,
    daysOverdue,
    paidRatio,
  };
}
