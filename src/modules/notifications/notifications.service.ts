import type { Prisma } from "@/generated/prisma/client";
import { differenceInUtcDays, formatDate, startOfUtcDay } from "@/lib/dates";
import { getInstallmentMetrics } from "@/lib/installments";
import { formatCurrency } from "@/lib/utils";
import { createNotificationEventKey } from "@/modules/auth/auth.password";
import { canAccessPermission, isStaffRole, type AuthRole } from "@/modules/auth/auth.permissions";
import type { AuthenticatedSession } from "@/modules/auth/auth.service";
import { notificationProviders } from "@/modules/notifications/notifications.providers";
import { notificationsRepository } from "@/modules/notifications/notifications.repository";

type NotificationInput = {
  userId: string;
  title: string;
  message: string;
  type: "DUE_REMINDER" | "OVERDUE_REMINDER" | "AUCTION_REMINDER" | "AUCTION_RESULT" | "PAYOUT_STATUS" | "SYSTEM";
  linkHref?: string;
  eventKey?: string;
  metadata?: Prisma.InputJsonValue;
};

function addUtcDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

async function createInAppNotification(input: NotificationInput) {
  const deliveryResult = await notificationProviders.inApp.deliver({
    title: input.title,
    message: input.message,
    recipientLabel: input.userId,
  });

  return notificationsRepository.createNotification({
    ...input,
    delivery: {
      channel: "IN_APP",
      providerKey: notificationProviders.inApp.key,
      status: deliveryResult.status,
      deliveredAt: deliveryResult.deliveredAt,
      responseCode: deliveryResult.responseCode,
      errorMessage: deliveryResult.errorMessage,
      responseBody: deliveryResult.responseBody,
    },
  });
}

async function getStaffRecipients() {
  return notificationsRepository.listActiveUsersByRoles([
    "SUPER_ADMIN",
    "ORGANIZER",
    "AGENT",
  ]);
}

async function getMemberUserByMemberId(memberId: string) {
  const memberUsers = await notificationsRepository.listActiveUsersByRoles(["MEMBER"]);
  return memberUsers.find((user) => user.member?.id === memberId);
}

export const notificationsService = {
  async getNotificationCenter(session: AuthenticatedSession) {
    const [notifications, deliveryLog] = await Promise.all([
      notificationsRepository.listUserNotifications(session.user.id),
      isStaffRole(session.user.role)
        ? notificationsRepository.listRecentDeliveryLog()
        : Promise.resolve([]),
    ]);

    return {
      notifications,
      deliveryLog,
      unreadCount: notifications.filter((notification) => !notification.readAt).length,
    };
  },

  markNotificationRead(notificationId: string, userId: string) {
    return notificationsRepository.markNotificationRead(notificationId, userId);
  },

  markAllNotificationsRead(userId: string) {
    return notificationsRepository.markAllNotificationsRead(userId);
  },

  async generateOperationalNotifications(session: AuthenticatedSession) {
    if (!canAccessPermission(session.user.role, "manage_notifications")) {
      throw new Error("You are not allowed to generate reminder notifications.");
    }

    const today = startOfUtcDay(new Date());
    const tomorrow = addUtcDays(today, 1);
    const auctionReminderCutoff = addUtcDays(today, 3);

    const [staffRecipients, dueCandidates, overdueCandidates, auctionCandidates] =
      await Promise.all([
        getStaffRecipients(),
        notificationsRepository.listDueReminderCandidates(today, tomorrow),
        notificationsRepository.listOverdueReminderCandidates(today),
        notificationsRepository.listAuctionReminderCandidates(today, auctionReminderCutoff),
      ]);

    let createdCount = 0;

    for (const installment of dueCandidates) {
      const metrics = getInstallmentMetrics(installment, today);

      if (metrics.outstandingAmount <= 0) {
        continue;
      }

      const eventKey = createNotificationEventKey([
        "due-reminder",
        installment.id,
        today.toISOString(),
      ]);
      const title = `${installment.chitGroup.code} installment due today`;
      const message = `Cycle ${installment.cycleNumber} is due today for ${formatCurrency(
        metrics.outstandingAmount,
      )}.`;

      if (installment.chitEnrollment.member.user?.id) {
        await createInAppNotification({
          userId: installment.chitEnrollment.member.user.id,
          type: "DUE_REMINDER",
          title,
          message,
          linkHref: `/members/${installment.chitEnrollment.member.id}`,
          eventKey,
          metadata: {
            installmentId: installment.id,
          },
        });
        createdCount += 1;
      }

      for (const staffUser of staffRecipients) {
        await createInAppNotification({
          userId: staffUser.id,
          type: "DUE_REMINDER",
          title,
          message: `${installment.chitEnrollment.member.memberCode} / ticket ${installment.chitEnrollment.ticketNumber} is due today.`,
          linkHref: "/collections",
          eventKey: createNotificationEventKey([eventKey, staffUser.id]),
          metadata: {
            installmentId: installment.id,
          },
        });
        createdCount += 1;
      }
    }

    for (const installment of overdueCandidates) {
      const metrics = getInstallmentMetrics(installment, today);

      if (!metrics.isOverdue || metrics.outstandingAmount <= 0) {
        continue;
      }

      const overdueDays = differenceInUtcDays(installment.dueDate, today);
      const title = `${installment.chitGroup.code} installment overdue`;
      const eventKey = createNotificationEventKey([
        "overdue-reminder",
        installment.id,
        today.toISOString(),
      ]);

      if (installment.chitEnrollment.member.user?.id) {
        await createInAppNotification({
          userId: installment.chitEnrollment.member.user.id,
          type: "OVERDUE_REMINDER",
          title,
          message: `Cycle ${installment.cycleNumber} is overdue by ${overdueDays} day(s) with ${formatCurrency(
            metrics.outstandingAmount,
          )} outstanding.`,
          linkHref: `/members/${installment.chitEnrollment.member.id}`,
          eventKey,
        });
        createdCount += 1;
      }

      for (const staffUser of staffRecipients) {
        await createInAppNotification({
          userId: staffUser.id,
          type: "OVERDUE_REMINDER",
          title,
          message: `${installment.chitEnrollment.member.memberCode} remains overdue by ${overdueDays} day(s).`,
          linkHref: `/members/${installment.chitEnrollment.member.id}`,
          eventKey: createNotificationEventKey([eventKey, staffUser.id]),
        });
        createdCount += 1;
      }
    }

    for (const cycle of auctionCandidates) {
      const title = `${cycle.chitGroup.code} auction reminder`;
      const eventKey = createNotificationEventKey([
        "auction-reminder",
        cycle.id,
        today.toISOString(),
      ]);

      for (const staffUser of staffRecipients) {
        await createInAppNotification({
          userId: staffUser.id,
          type: "AUCTION_REMINDER",
          title,
          message: `Cycle ${cycle.cycleNumber} is scheduled for ${formatDate(cycle.scheduledAt)}.`,
          linkHref: `/auctions/${cycle.id}`,
          eventKey: createNotificationEventKey([eventKey, staffUser.id]),
        });
        createdCount += 1;
      }

      for (const enrollment of cycle.chitGroup.enrollments) {
        if (!enrollment.member.user?.id) {
          continue;
        }

        await createInAppNotification({
          userId: enrollment.member.user.id,
          type: "AUCTION_REMINDER",
          title,
          message: `Your chit group auction cycle ${cycle.cycleNumber} is scheduled for ${formatDate(
            cycle.scheduledAt,
          )}.`,
          linkHref: `/members/${enrollment.member.id}`,
          eventKey: createNotificationEventKey([eventKey, enrollment.member.user.id]),
        });
        createdCount += 1;
      }
    }

    return {
      createdCount,
      dueCandidates: dueCandidates.length,
      overdueCandidates: overdueCandidates.length,
      auctionCandidates: auctionCandidates.length,
    };
  },

  async notifyAuctionResult(args: {
    cycleId: string;
    cycleNumber: number;
    chitGroupCode: string;
    winnerMemberId: string;
    winnerName: string;
    netPrizeAmount: number;
  }) {
    const [staffRecipients, winnerUser] = await Promise.all([
      getStaffRecipients(),
      getMemberUserByMemberId(args.winnerMemberId),
    ]);

    if (winnerUser) {
      await createInAppNotification({
        userId: winnerUser.id,
        type: "AUCTION_RESULT",
        title: `${args.chitGroupCode} auction result`,
        message: `You won cycle ${args.cycleNumber}. Net payout ${formatCurrency(args.netPrizeAmount)} is now under processing.`,
        linkHref: `/members/${args.winnerMemberId}`,
        eventKey: createNotificationEventKey([
          "auction-result",
          args.cycleId,
          winnerUser.id,
        ]),
      });
    }

    for (const staffUser of staffRecipients) {
      await createInAppNotification({
        userId: staffUser.id,
        type: "AUCTION_RESULT",
        title: `${args.chitGroupCode} auction finalized`,
        message: `${args.winnerName} won cycle ${args.cycleNumber}. Net payout ${formatCurrency(
          args.netPrizeAmount,
        )}.`,
        linkHref: `/auctions/${args.cycleId}`,
        eventKey: createNotificationEventKey([
          "auction-result",
          args.cycleId,
          staffUser.id,
        ]),
      });
    }
  },

  async notifyPayoutStatusChange(args: {
    payoutId: string;
    cycleId: string;
    cycleNumber: number;
    chitGroupCode: string;
    memberId: string;
    status: string;
    netAmount: number;
    actorRole: AuthRole;
  }) {
    const [staffRecipients, winnerUser] = await Promise.all([
      getStaffRecipients(),
      getMemberUserByMemberId(args.memberId),
    ]);

    if (winnerUser) {
      await createInAppNotification({
        userId: winnerUser.id,
        type: "PAYOUT_STATUS",
        title: `${args.chitGroupCode} payout update`,
        message: `Your payout for cycle ${args.cycleNumber} is now ${args.status.replaceAll(
          "_",
          " ",
        ).toLowerCase()}.`,
        linkHref: `/members/${args.memberId}`,
        eventKey: createNotificationEventKey([
          "payout-status",
          args.payoutId,
          winnerUser.id,
          args.status,
        ]),
      });
    }

    for (const staffUser of staffRecipients) {
      await createInAppNotification({
        userId: staffUser.id,
        type: "PAYOUT_STATUS",
        title: `${args.chitGroupCode} payout ${args.status.replaceAll("_", " ")}`,
        message: `Cycle ${args.cycleNumber} payout is ${args.status.replaceAll(
          "_",
          " ",
        ).toLowerCase()} for ${formatCurrency(args.netAmount)} by ${args.actorRole.replaceAll(
          "_",
          " ",
        ).toLowerCase()}.`,
        linkHref: `/auctions/${args.cycleId}`,
        eventKey: createNotificationEventKey([
          "payout-status",
          args.payoutId,
          staffUser.id,
          args.status,
        ]),
      });
    }
  },
};
