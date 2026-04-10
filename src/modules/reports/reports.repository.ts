import { db } from "@/server/db/client";

type CollectionsReportRange = {
  dateFrom: Date;
  dateToExclusive: Date;
};

export const reportsRepository = {
  listOverdueInstallments(asOf: Date) {
    return db.installment.findMany({
      where: {
        dueDate: {
          lt: asOf,
        },
        status: {
          notIn: ["PAID", "WAIVED"],
        },
      },
      orderBy: [{ dueDate: "asc" }, { cycleNumber: "asc" }],
      take: 100,
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
                primaryPhone: true,
              },
            },
          },
        },
      },
    });
  },

  listCollections(range: CollectionsReportRange) {
    return db.payment.findMany({
      where: {
        receivedOn: {
          gte: range.dateFrom,
          lt: range.dateToExclusive,
        },
      },
      orderBy: [{ receivedOn: "desc" }, { createdAt: "desc" }],
      take: 150,
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
            cycleNumber: true,
          },
        },
      },
    });
  },

  listMemberLedgerRows() {
    return db.member.findMany({
      orderBy: [{ memberCode: "asc" }],
      take: 120,
      include: {
        enrollments: {
          select: {
            id: true,
            installments: {
              select: {
                dueDate: true,
                dueAmount: true,
                paidAmount: true,
                status: true,
              },
            },
            payouts: {
              select: {
                netAmount: true,
                status: true,
              },
            },
          },
        },
      },
    });
  },

  listGroupPerformanceRows() {
    return db.chitGroup.findMany({
      orderBy: [{ startDate: "desc" }, { code: "asc" }],
      take: 80,
      include: {
        enrollments: {
          select: {
            id: true,
          },
        },
        installments: {
          select: {
            dueDate: true,
            dueAmount: true,
            paidAmount: true,
            status: true,
          },
        },
        auctionCycles: {
          select: {
            id: true,
            status: true,
            winningEnrollmentId: true,
          },
        },
        payouts: {
          select: {
            netAmount: true,
            status: true,
          },
        },
      },
    });
  },

  getOrganizerCounts() {
    return Promise.all([
      db.member.count({
        where: {
          status: "ACTIVE",
        },
      }),
      db.chitGroup.count({
        where: {
          status: {
            in: ["OPEN", "ACTIVE"],
          },
        },
      }),
    ]);
  },
};
