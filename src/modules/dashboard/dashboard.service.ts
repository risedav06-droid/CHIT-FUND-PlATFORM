import { getUtcMonthRange, startOfUtcDay } from "@/lib/dates";
import { getInstallmentMetrics } from "@/lib/installments";
import { toNumber } from "@/lib/utils";
import type { AuthenticatedSession } from "@/modules/auth/auth.service";
import { dashboardRepository } from "@/modules/dashboard/dashboard.repository";
import { membersService } from "@/modules/members/members.service";
import { notificationsService } from "@/modules/notifications/notifications.service";

function addUtcDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

export const dashboardService = {
  async getDashboard(session: AuthenticatedSession) {
    if (session.user.role === "MEMBER" && session.user.member) {
      return {
        kind: "member" as const,
        ...(await this.getMemberDashboard(session)),
      };
    }

    return {
      kind: "staff" as const,
      ...(await this.getStaffDashboard()),
    };
  },

  async getStaffDashboard() {
    const today = startOfUtcDay(new Date());
    const tomorrow = addUtcDays(today, 1);
    const { start, end } = getUtcMonthRange(today);
    const upcomingAuctionCutoff = addUtcDays(today, 7);
    const [
      activeGroups,
      activeMembersCount,
      dueTodayRows,
      overdueRows,
      pendingPayouts,
      upcomingAuctions,
      recentActivity,
      recentPayments,
    ] = await dashboardRepository.getStaffDashboardSnapshot({
      todayStart: today,
      tomorrowStart: tomorrow,
      monthStart: start,
      monthEnd: end,
      upcomingAuctionCutoff,
    });

    const dueToday = dueTodayRows
      .map((installment) => ({
        ...installment,
        metrics: getInstallmentMetrics(installment, today),
      }))
      .filter((installment) => installment.metrics.outstandingAmount > 0);
    const overdueToday = overdueRows
      .map((installment) => ({
        ...installment,
        metrics: getInstallmentMetrics(installment, today),
      }))
      .filter((installment) => installment.metrics.isOverdue);

    const riskyGroupMap = new Map<
      string,
      {
        chitId: string;
        code: string;
        name: string;
        overdueCount: number;
        overdueAmount: number;
        pendingPayouts: number;
      }
    >();

    for (const installment of overdueToday) {
      const existing = riskyGroupMap.get(installment.chitGroupId);

      if (existing) {
        existing.overdueCount += 1;
        existing.overdueAmount += installment.metrics.outstandingAmount;
      } else {
        riskyGroupMap.set(installment.chitGroupId, {
          chitId: installment.chitGroup.id,
          code: installment.chitGroup.code,
          name: installment.chitGroup.name,
          overdueCount: 1,
          overdueAmount: installment.metrics.outstandingAmount,
          pendingPayouts: 0,
        });
      }
    }

    for (const payout of pendingPayouts) {
      const existing = riskyGroupMap.get(payout.chitGroupId);

      if (existing) {
        existing.pendingPayouts += toNumber(payout.netAmount);
      } else {
        riskyGroupMap.set(payout.chitGroupId, {
          chitId: payout.chitGroup.id,
          code: payout.chitGroup.code,
          name: payout.chitGroup.name,
          overdueCount: 0,
          overdueAmount: 0,
          pendingPayouts: toNumber(payout.netAmount),
        });
      }
    }

    const recentPartialCollections = recentPayments.filter(
      (payment) =>
        payment.installment.status === "PARTIALLY_PAID" ||
        toNumber(payment.installment.paidAmount) < toNumber(payment.installment.dueAmount),
    );
    const recentFailedCollections = overdueToday
      .filter((installment) => installment.payments.length === 0)
      .slice(0, 8);

    return {
      activeGroups,
      activeMembersCount,
      dueToday,
      overdueToday,
      pendingPayouts,
      upcomingAuctions,
      riskyGroups: Array.from(riskyGroupMap.values())
        .sort((left, right) => {
          if (right.overdueCount !== left.overdueCount) {
            return right.overdueCount - left.overdueCount;
          }

          if (right.overdueAmount !== left.overdueAmount) {
            return right.overdueAmount - left.overdueAmount;
          }

          return right.pendingPayouts - left.pendingPayouts;
        })
        .slice(0, 8),
      recentActivity,
      recentPartialCollections,
      recentFailedCollections,
      totals: {
        dueTodayAmount: dueToday.reduce(
          (sum, installment) => sum + installment.metrics.outstandingAmount,
          0,
        ),
        overdueTodayAmount: overdueToday.reduce(
          (sum, installment) => sum + installment.metrics.outstandingAmount,
          0,
        ),
        pendingPayoutAmount: pendingPayouts.reduce(
          (sum, payout) => sum + toNumber(payout.netAmount),
          0,
        ),
      },
    };
  },

  async getMemberDashboard(session: AuthenticatedSession) {
    const detail = await membersService.getMemberDetail(session.user.member!.id);
    const notificationCenter = await notificationsService.getNotificationCenter(session);
    const today = startOfUtcDay(new Date());

    if (!detail) {
      return {
        detail: null,
        dueToday: [],
        overdue: [],
        pendingPayouts: [],
        recentNotifications: notificationCenter.notifications.slice(0, 6),
      };
    }

    const dueToday = detail.installments.filter((installment) => {
      const dueDate = startOfUtcDay(installment.dueDate);
      return (
        dueDate.getTime() === today.getTime() &&
        installment.metrics.outstandingAmount > 0
      );
    });
    const overdue = detail.installments.filter(
      (installment) => installment.metrics.isOverdue,
    );
    const pendingPayouts = detail.payouts.filter((payout) =>
      ["PENDING", "APPROVED", "ON_HOLD"].includes(payout.status),
    );

    return {
      detail,
      dueToday,
      overdue,
      pendingPayouts,
      recentNotifications: notificationCenter.notifications.slice(0, 6),
      recentPayments: detail.payments.slice(0, 6),
      upcomingEnrollments: detail.enrollmentSummaries.map((enrollment) => ({
        id: enrollment.id,
        groupName: enrollment.chitGroup.name,
        groupCode: enrollment.chitGroup.code,
        ticketNumber: enrollment.ticketNumber,
        outstandingAmount: enrollment.outstandingAmount,
        overdueAmount: enrollment.overdueAmount,
      })),
    };
  },
};
