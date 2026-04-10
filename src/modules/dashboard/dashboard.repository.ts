import { db } from "@/server/db/client";

type StaffDashboardInput = {
  todayStart: Date;
  tomorrowStart: Date;
  monthStart: Date;
  monthEnd: Date;
  upcomingAuctionCutoff: Date;
};

export const dashboardRepository = {
  async getStaffDashboardSnapshot({
    todayStart,
    tomorrowStart,
    monthStart,
    monthEnd,
    upcomingAuctionCutoff,
  }: StaffDashboardInput) {
    return Promise.all([
      db.chitGroup.findMany({
        where: {
          status: {
            in: ["OPEN", "ACTIVE"],
          },
        },
        orderBy: [{ startDate: "desc" }],
        include: {
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
        take: 12,
      }),
      db.member.count({
        where: {
          status: "ACTIVE",
        },
      }),
      db.installment.findMany({
        where: {
          dueDate: {
            gte: todayStart,
            lt: tomorrowStart,
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
      }),
      db.installment.findMany({
        where: {
          dueDate: {
            lt: todayStart,
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
            orderBy: [{ receivedOn: "desc" }],
            take: 1,
            select: {
              id: true,
              receivedOn: true,
            },
          },
        },
        take: 120,
      }),
      db.payout.findMany({
        where: {
          status: {
            in: ["PENDING", "APPROVED", "ON_HOLD"],
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
          member: {
            select: {
              id: true,
              memberCode: true,
              firstName: true,
              lastName: true,
            },
          },
          auctionCycle: {
            select: {
              id: true,
              cycleNumber: true,
              scheduledAt: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 30,
      }),
      db.auctionCycle.findMany({
        where: {
          scheduledAt: {
            gte: todayStart,
            lt: upcomingAuctionCutoff,
          },
          status: {
            in: ["SCHEDULED", "OPEN"],
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
        },
        orderBy: [{ scheduledAt: "asc" }],
        take: 20,
      }),
      db.auditLog.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 20,
      }),
      db.payment.findMany({
        where: {
          receivedOn: {
            gte: monthStart,
            lt: monthEnd,
          },
        },
        orderBy: [{ receivedOn: "desc" }, { createdAt: "desc" }],
        include: {
          member: {
            select: {
              id: true,
              memberCode: true,
              firstName: true,
              lastName: true,
            },
          },
          chitGroup: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          installment: {
            select: {
              id: true,
              cycleNumber: true,
              dueAmount: true,
              paidAmount: true,
              status: true,
            },
          },
        },
        take: 25,
      }),
    ]);
  },
};
