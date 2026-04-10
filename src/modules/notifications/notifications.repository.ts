import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db/client";

type CreateNotificationRecord = {
  userId: string;
  type: "DUE_REMINDER" | "OVERDUE_REMINDER" | "AUCTION_REMINDER" | "AUCTION_RESULT" | "PAYOUT_STATUS" | "SYSTEM";
  title: string;
  message: string;
  linkHref?: string;
  eventKey?: string;
  metadata?: Prisma.InputJsonValue;
  delivery: {
    channel: "IN_APP" | "WHATSAPP" | "SMS" | "EMAIL";
    providerKey: string;
    status: "PENDING" | "SENT" | "FAILED" | "SKIPPED";
    deliveredAt?: Date;
    responseCode?: string;
    errorMessage?: string;
    responseBody?: Prisma.InputJsonValue;
  };
};

export const notificationsRepository = {
  listUserNotifications(userId: string) {
    return db.notification.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }],
      include: {
        deliveries: {
          orderBy: [{ attemptedAt: "desc" }],
          take: 4,
        },
      },
      take: 80,
    });
  },

  listRecentDeliveryLog() {
    return db.notificationDelivery.findMany({
      orderBy: [{ attemptedAt: "desc" }],
      take: 50,
      include: {
        notification: {
          select: {
            id: true,
            title: true,
            type: true,
            user: {
              select: {
                email: true,
                role: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
                member: {
                  select: {
                    memberCode: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  },

  markNotificationRead(notificationId: string, userId: string) {
    return db.notification.updateMany({
      where: {
        id: notificationId,
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  },

  markAllNotificationsRead(userId: string) {
    return db.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  },

  listActiveUsersByRoles(roles: Array<"SUPER_ADMIN" | "ORGANIZER" | "AGENT" | "MEMBER">) {
    return db.user.findMany({
      where: {
        role: {
          in: roles,
        },
        isActive: true,
      },
      include: {
        profile: true,
        member: {
          select: {
            id: true,
            memberCode: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  },

  listDueReminderCandidates(today: Date, tomorrow: Date) {
    return db.installment.findMany({
      where: {
        dueDate: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          in: ["PENDING", "PARTIALLY_PAID", "OVERDUE"],
        },
      },
      include: {
        chitGroup: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        chitEnrollment: {
          include: {
            member: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    isActive: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  },

  listOverdueReminderCandidates(asOf: Date) {
    return db.installment.findMany({
      where: {
        dueDate: {
          lt: asOf,
        },
        status: {
          in: ["PENDING", "PARTIALLY_PAID", "OVERDUE"],
        },
      },
      include: {
        chitGroup: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        chitEnrollment: {
          include: {
            member: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    isActive: true,
                  },
                },
              },
            },
          },
        },
      },
      take: 120,
    });
  },

  listAuctionReminderCandidates(fromDate: Date, toDate: Date) {
    return db.auctionCycle.findMany({
      where: {
        scheduledAt: {
          gte: fromDate,
          lt: toDate,
        },
        status: {
          in: ["SCHEDULED", "OPEN"],
        },
      },
      include: {
        chitGroup: {
          include: {
            enrollments: {
              include: {
                member: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        email: true,
                        isActive: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      take: 80,
    });
  },

  async createNotification(data: CreateNotificationRecord) {
    return db.$transaction(async (tx) => {
      if (data.eventKey) {
        const existingNotification = await tx.notification.findUnique({
          where: {
            userId_eventKey: {
              userId: data.userId,
              eventKey: data.eventKey,
            },
          },
        });

        if (existingNotification) {
          return existingNotification;
        }
      }

      const notification = await tx.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          linkHref: data.linkHref,
          eventKey: data.eventKey,
          metadata: data.metadata,
        },
      });

      await tx.notificationDelivery.create({
        data: {
          notificationId: notification.id,
          channel: data.delivery.channel,
          providerKey: data.delivery.providerKey,
          status: data.delivery.status,
          deliveredAt: data.delivery.deliveredAt,
          responseCode: data.delivery.responseCode,
          errorMessage: data.delivery.errorMessage,
          responseBody: data.delivery.responseBody,
        },
      });

      return notification;
    });
  },
};
