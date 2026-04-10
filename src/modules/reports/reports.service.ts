import { getUtcMonthRange, startOfUtcDay } from "@/lib/dates";
import { getInstallmentMetrics } from "@/lib/installments";
import { toNumber } from "@/lib/utils";
import { reportsRepository } from "@/modules/reports/reports.repository";
import { reportFiltersSchema } from "@/modules/reports/reports.validation";

type ReportsSearchParams = Record<string, string | string[] | undefined>;

function addUtcDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function dateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getFullName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ");
}

export const reportsService = {
  async getReports(searchParams: ReportsSearchParams) {
    const now = new Date();
    const monthRange = getUtcMonthRange(now);
    const parsedFilters = reportFiltersSchema.safeParse(searchParams);
    const parsedData = parsedFilters.success ? parsedFilters.data : {};
    let dateFrom = startOfUtcDay(parsedData.dateFrom ?? monthRange.start);
    let dateTo = startOfUtcDay(parsedData.dateTo ?? addUtcDays(monthRange.end, -1));
    let filterError =
      parsedFilters.success
        ? undefined
        : parsedFilters.error.issues[0]?.message ?? "Report filters are invalid.";

    if (dateFrom > dateTo) {
      dateFrom = monthRange.start;
      dateTo = addUtcDays(monthRange.end, -1);
      filterError = "From date cannot be after to date. Showing the current month instead.";
    }

    const dateToExclusive = addUtcDays(dateTo, 1);
    const [overdueRows, collectionRows, memberRows, groupRows, organizerCounts] =
      await Promise.all([
        reportsRepository.listOverdueInstallments(startOfUtcDay(now)),
        reportsRepository.listCollections({ dateFrom, dateToExclusive }),
        reportsRepository.listMemberLedgerRows(),
        reportsRepository.listGroupPerformanceRows(),
        reportsRepository.getOrganizerCounts(),
      ]);

    const overdueInstallments = overdueRows
      .map((installment) => ({
        ...installment,
        metrics: getInstallmentMetrics(installment, now),
      }))
      .filter((installment) => installment.metrics.isOverdue)
      .sort(
        (left, right) =>
          right.metrics.outstandingAmount - left.metrics.outstandingAmount,
      );

    const collectionTotal = collectionRows.reduce(
      (sum, payment) => sum + toNumber(payment.amount),
      0,
    );

    const memberLedger = memberRows.map((member) => {
      const installments = member.enrollments.flatMap(
        (enrollment) => enrollment.installments,
      );
      const payouts = member.enrollments.flatMap(
        (enrollment) => enrollment.payouts,
      );
      const installmentMetrics = installments.map((installment) =>
        getInstallmentMetrics(installment, now),
      );
      const totalDue = installmentMetrics.reduce(
        (sum, metrics) => sum + metrics.dueAmount,
        0,
      );
      const totalPaid = installmentMetrics.reduce(
        (sum, metrics) => sum + metrics.paidAmount,
        0,
      );
      const overdueAmount = installmentMetrics
        .filter((metrics) => metrics.isOverdue)
        .reduce((sum, metrics) => sum + metrics.outstandingAmount, 0);
      const paidPayouts = payouts
        .filter((payout) => ["PAID", "DISBURSED"].includes(payout.status))
        .reduce((sum, payout) => sum + toNumber(payout.netAmount), 0);
      const pendingPayouts = payouts
        .filter((payout) => ["PENDING", "APPROVED", "ON_HOLD"].includes(payout.status))
        .reduce((sum, payout) => sum + toNumber(payout.netAmount), 0);

      return {
        id: member.id,
        memberCode: member.memberCode,
        name: getFullName(member.firstName, member.lastName),
        status: member.status,
        enrollmentsCount: member.enrollments.length,
        totalDue,
        totalPaid,
        outstandingAmount: Math.max(0, totalDue - totalPaid),
        overdueAmount,
        paidPayouts,
        pendingPayouts,
      };
    });

    const groupPerformance = groupRows.map((group) => {
      const installmentMetrics = group.installments.map((installment) =>
        getInstallmentMetrics(installment, now),
      );
      const totalDue = installmentMetrics.reduce(
        (sum, metrics) => sum + metrics.dueAmount,
        0,
      );
      const totalPaid = installmentMetrics.reduce(
        (sum, metrics) => sum + metrics.paidAmount,
        0,
      );
      const overdueCount = installmentMetrics.filter(
        (metrics) => metrics.isOverdue,
      ).length;
      const overdueAmount = installmentMetrics
        .filter((metrics) => metrics.isOverdue)
        .reduce((sum, metrics) => sum + metrics.outstandingAmount, 0);
      const settledCycles = group.auctionCycles.filter(
        (cycle) => cycle.status === "SETTLED",
      ).length;
      const pendingPayouts = group.payouts
        .filter((payout) => ["PENDING", "APPROVED", "ON_HOLD"].includes(payout.status))
        .reduce((sum, payout) => sum + toNumber(payout.netAmount), 0);

      return {
        id: group.id,
        code: group.code,
        name: group.name,
        status: group.status,
        enrolledTickets: group.enrollments.length,
        ticketCount: group.ticketCount,
        totalDue,
        totalPaid,
        outstandingAmount: Math.max(0, totalDue - totalPaid),
        overdueCount,
        overdueAmount,
        settledCycles,
        generatedCycles: group.auctionCycles.length,
        pendingPayouts,
      };
    });

    return {
      filterError,
      filters: {
        dateFrom,
        dateTo,
        dateFromInput: dateInputValue(dateFrom),
        dateToInput: dateInputValue(dateTo),
      },
      overdueInstallments,
      collections: collectionRows,
      memberLedger,
      groupPerformance,
      organizerSummary: {
        activeMembers: organizerCounts[0],
        activeGroups: organizerCounts[1],
        collectionsTotal: collectionTotal,
        collectionsCount: collectionRows.length,
        overdueInstallmentsCount: overdueInstallments.length,
        overdueAmount: overdueInstallments.reduce(
          (sum, installment) => sum + installment.metrics.outstandingAmount,
          0,
        ),
        paidPayouts: memberLedger.reduce(
          (sum, member) => sum + member.paidPayouts,
          0,
        ),
        pendingPayouts: memberLedger.reduce(
          (sum, member) => sum + member.pendingPayouts,
          0,
        ),
      },
    };
  },
};
