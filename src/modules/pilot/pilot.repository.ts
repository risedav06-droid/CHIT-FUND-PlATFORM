import { db } from "@/server/db/client";

const criticalAuditActions = [
  "payment.recorded",
  "auction-cycle.finalized",
  "payout.created",
  "payout.status-updated",
] as const;

export const pilotRepository = {
  listDemoUsers(emails: string[]) {
    const now = new Date();

    return db.user.findMany({
      where: {
        email: {
          in: emails,
        },
      },
      include: {
        profile: true,
        member: {
          select: {
            id: true,
            memberCode: true,
            status: true,
          },
        },
        notifications: {
          where: {
            eventKey: {
              startsWith: "seed-welcome:",
            },
          },
          orderBy: [{ createdAt: "desc" }],
          take: 1,
          select: {
            id: true,
            createdAt: true,
          },
        },
        sessions: {
          where: {
            expiresAt: {
              gt: now,
            },
          },
          select: {
            id: true,
            expiresAt: true,
          },
        },
      },
    });
  },

  listInstallmentsForIntegrityCheck() {
    return db.installment.findMany({
      include: {
        chitGroup: {
          select: {
            id: true,
            code: true,
          },
        },
        chitEnrollment: {
          select: {
            id: true,
            ticketNumber: true,
            member: {
              select: {
                id: true,
                memberCode: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        payments: {
          orderBy: [{ receivedOn: "asc" }, { createdAt: "asc" }],
          select: {
            id: true,
            amount: true,
            memberId: true,
            chitGroupId: true,
            chitEnrollmentId: true,
            referenceNo: true,
            receivedOn: true,
          },
        },
      },
    });
  },

  listSettledAuctionsForIntegrityCheck() {
    return db.auctionCycle.findMany({
      where: {
        status: {
          in: ["SETTLED", "CLOSED"],
        },
      },
      orderBy: [{ scheduledAt: "desc" }],
      include: {
        chitGroup: {
          select: {
            id: true,
            code: true,
            ticketCount: true,
            prizeAmount: true,
          },
        },
        winningEnrollment: {
          select: {
            id: true,
            ticketNumber: true,
            member: {
              select: {
                id: true,
                memberCode: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        bids: {
          orderBy: [{ amount: "desc" }, { createdAt: "asc" }],
          select: {
            id: true,
            amount: true,
            chitEnrollmentId: true,
            chitEnrollment: {
              select: {
                id: true,
                ticketNumber: true,
                member: {
                  select: {
                    id: true,
                    memberCode: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        payout: {
          select: {
            id: true,
            status: true,
            grossAmount: true,
            deductionsAmount: true,
            netAmount: true,
            memberId: true,
            chitEnrollmentId: true,
            method: true,
            referenceNo: true,
            approvedAt: true,
            paidAt: true,
            rejectedAt: true,
            rejectionReason: true,
          },
        },
      },
    });
  },

  listPayoutsForIntegrityCheck() {
    return db.payout.findMany({
      orderBy: [{ createdAt: "desc" }],
      include: {
        chitGroup: {
          select: {
            id: true,
            code: true,
          },
        },
        member: {
          select: {
            id: true,
            memberCode: true,
            firstName: true,
            lastName: true,
          },
        },
        chitEnrollment: {
          select: {
            id: true,
            ticketNumber: true,
          },
        },
        auctionCycle: {
          select: {
            id: true,
            cycleNumber: true,
            status: true,
          },
        },
      },
    });
  },

  async getCriticalAuditSnapshot() {
    return Promise.all([
      db.auditLog.findMany({
        where: {
          action: {
            in: [...criticalAuditActions],
          },
        },
        select: {
          action: true,
          entityId: true,
        },
      }),
      db.payment.findMany({
        select: {
          id: true,
        },
      }),
      db.auctionCycle.findMany({
        where: {
          status: {
            in: ["SETTLED", "CLOSED"],
          },
        },
        select: {
          id: true,
        },
      }),
      db.payout.findMany({
        select: {
          id: true,
          status: true,
        },
      }),
    ]);
  },

  async getNotificationSnapshot() {
    return Promise.all([
      db.notification.count(),
      db.notification.count({
        where: {
          readAt: null,
        },
      }),
      db.notificationDelivery.count(),
      db.notificationDelivery.count({
        where: {
          status: "FAILED",
        },
      }),
      db.notificationDelivery.findMany({
        where: {
          status: "FAILED",
        },
        orderBy: [{ attemptedAt: "desc" }],
        take: 8,
        include: {
          notification: {
            select: {
              title: true,
              type: true,
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      }),
    ]);
  },
};

export const pilotCriticalAuditActions = criticalAuditActions;
