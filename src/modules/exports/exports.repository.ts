import { db } from "@/server/db/client";

type ExportRangeInput = {
  dateFrom: Date;
  dateToExclusive: Date;
};

export const exportsRepository = {
  listAuctionSummary({ dateFrom, dateToExclusive }: ExportRangeInput) {
    return db.auctionCycle.findMany({
      where: {
        scheduledAt: {
          gte: dateFrom,
          lt: dateToExclusive,
        },
      },
      orderBy: [{ scheduledAt: "desc" }],
      include: {
        chitGroup: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        winningEnrollment: {
          select: {
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
        payout: {
          select: {
            id: true,
            status: true,
            netAmount: true,
          },
        },
      },
      take: 120,
    });
  },

  listPayoutRegister({ dateFrom, dateToExclusive }: ExportRangeInput) {
    return db.payout.findMany({
      where: {
        createdAt: {
          gte: dateFrom,
          lt: dateToExclusive,
        },
      },
      orderBy: [{ createdAt: "desc" }],
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
      take: 150,
    });
  },
};
