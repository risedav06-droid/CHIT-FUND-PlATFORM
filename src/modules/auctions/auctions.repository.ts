import { db } from "@/server/db/client";

type CreateAuctionCycleRecord = {
  chitGroupId: string;
  cycleNumber: number;
  scheduledAt: Date;
  notes?: string;
  actorUserId?: string;
};

type RecordBidRecord = {
  auctionCycleId: string;
  chitEnrollmentId: string;
  amount: string;
  remarks?: string;
  actorUserId?: string;
};

type FinalizeAuctionRecord = {
  auctionCycleId: string;
  winningBidId: string;
  notes?: string;
  grossPrizeAmount: string;
  discountAmount: string;
  netPrizeAmount: string;
  dividendAmount: string;
  actorUserId?: string;
};

export const auctionsRepository = {
  listAuctionCycles() {
    return db.auctionCycle.findMany({
      orderBy: [{ scheduledAt: "desc" }, { cycleNumber: "desc" }],
      take: 80,
      include: {
        chitGroup: {
          select: {
            id: true,
            code: true,
            name: true,
            prizeAmount: true,
            ticketCount: true,
            status: true,
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
        payout: {
          select: {
            id: true,
            status: true,
            netAmount: true,
          },
        },
        _count: {
          select: {
            bids: true,
          },
        },
      },
    });
  },

  listGroupsForCycleCreation() {
    return db.chitGroup.findMany({
      where: {
        status: {
          in: ["OPEN", "ACTIVE"],
        },
      },
      orderBy: [{ startDate: "desc" }, { code: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
        durationMonths: true,
      },
    });
  },

  getGroupCycleSeed(chitGroupId: string) {
    return db.chitGroup.findUnique({
      where: { id: chitGroupId },
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        durationMonths: true,
        auctionCycles: {
          orderBy: [{ cycleNumber: "desc" }],
          take: 1,
          select: {
            cycleNumber: true,
          },
        },
      },
    });
  },

  async getAuctionCycleDetail(auctionCycleId: string) {
    const cycle = await db.auctionCycle.findUnique({
      where: { id: auctionCycleId },
      include: {
        chitGroup: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
            ticketCount: true,
            prizeAmount: true,
            installmentAmount: true,
            durationMonths: true,
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
          include: {
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
                    status: true,
                  },
                },
              },
            },
          },
        },
        payout: true,
      },
    });

    if (!cycle) {
      return null;
    }

    const [enrollments, previousWinningCycles] = await Promise.all([
      db.chitEnrollment.findMany({
        where: { chitGroupId: cycle.chitGroupId },
        orderBy: [{ ticketNumber: "asc" }],
        include: {
          member: {
            select: {
              id: true,
              memberCode: true,
              firstName: true,
              lastName: true,
              status: true,
              primaryPhone: true,
            },
          },
          installments: {
            orderBy: [{ cycleNumber: "asc" }],
            select: {
              id: true,
              cycleNumber: true,
              dueDate: true,
              dueAmount: true,
              paidAmount: true,
              status: true,
            },
          },
        },
      }),
      db.auctionCycle.findMany({
        where: {
          chitGroupId: cycle.chitGroupId,
          status: "SETTLED",
          winningEnrollmentId: {
            not: null,
          },
        },
        select: {
          id: true,
          cycleNumber: true,
          winningEnrollmentId: true,
        },
      }),
    ]);

    const bidIds = cycle.bids.map((bid) => bid.id);
    const auditFilters = [
      {
        entityType: "AuctionCycle",
        entityId: auctionCycleId,
      },
      ...(bidIds.length > 0
        ? [
            {
              entityType: "Bid",
              entityId: {
                in: bidIds,
              },
            },
          ]
        : []),
      ...(cycle.payout
        ? [
            {
              entityType: "Payout",
              entityId: cycle.payout.id,
            },
          ]
        : []),
    ];

    const auditLogs = await db.auditLog.findMany({
      where: {
        OR: auditFilters,
      },
      orderBy: [{ createdAt: "desc" }],
      take: 20,
    });

    return {
      cycle,
      enrollments,
      previousWinningCycles,
      auditLogs,
    };
  },

  createAuctionCycle(data: CreateAuctionCycleRecord) {
    return db.$transaction(async (tx) => {
      const cycle = await tx.auctionCycle.create({
        data: {
          chitGroupId: data.chitGroupId,
          cycleNumber: data.cycleNumber,
          scheduledAt: data.scheduledAt,
          notes: data.notes,
        },
        include: {
          chitGroup: {
            select: {
              code: true,
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: data.actorUserId,
          entityType: "AuctionCycle",
          entityId: cycle.id,
          action: "auction-cycle.created",
          summary: `${cycle.chitGroup.code} cycle ${cycle.cycleNumber} created`,
          after: {
            chitGroupId: cycle.chitGroupId,
            cycleNumber: cycle.cycleNumber,
            scheduledAt: cycle.scheduledAt,
            notes: cycle.notes,
          },
        },
      });

      return cycle;
    });
  },

  recordBid(data: RecordBidRecord) {
    return db.$transaction(async (tx) => {
      const cycle = await tx.auctionCycle.findUniqueOrThrow({
        where: { id: data.auctionCycleId },
        select: {
          id: true,
          cycleNumber: true,
          status: true,
        },
      });

      if (cycle.status === "SCHEDULED") {
        await tx.auctionCycle.update({
          where: { id: cycle.id },
          data: { status: "OPEN" },
        });

        await tx.auditLog.create({
          data: {
            actorUserId: data.actorUserId,
            entityType: "AuctionCycle",
            entityId: cycle.id,
            action: "auction-cycle.opened",
            summary: `Cycle ${cycle.cycleNumber} opened by first bid`,
          },
        });
      }

      const bid = await tx.bid.create({
        data: {
          auctionCycleId: data.auctionCycleId,
          chitEnrollmentId: data.chitEnrollmentId,
          amount: data.amount,
          remarks: data.remarks,
        },
        include: {
          chitEnrollment: {
            select: {
              ticketNumber: true,
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
      });

      await tx.auditLog.create({
        data: {
          actorUserId: data.actorUserId,
          entityType: "Bid",
          entityId: bid.id,
          action: "bid.recorded",
          summary: `Bid ${bid.amount.toString()} recorded for ticket ${bid.chitEnrollment.ticketNumber}`,
          after: {
            auctionCycleId: bid.auctionCycleId,
            chitEnrollmentId: bid.chitEnrollmentId,
            amount: bid.amount.toString(),
            remarks: bid.remarks,
          },
        },
      });

      return bid;
    });
  },

  finalizeAuction(data: FinalizeAuctionRecord) {
    return db.$transaction(async (tx) => {
      const bid = await tx.bid.findUniqueOrThrow({
        where: { id: data.winningBidId },
        include: {
          chitEnrollment: {
            select: {
              id: true,
              memberId: true,
              ticketNumber: true,
              member: {
                select: {
                  memberCode: true,
                },
              },
            },
          },
          auctionCycle: {
            select: {
              id: true,
              chitGroupId: true,
              cycleNumber: true,
              notes: true,
            },
          },
        },
      });

      const auctionCycle = await tx.auctionCycle.update({
        where: { id: data.auctionCycleId },
        data: {
          status: "SETTLED",
          closedAt: new Date(),
          winningEnrollmentId: bid.chitEnrollmentId,
          winningBidAmount: data.discountAmount,
          grossPrizeAmount: data.grossPrizeAmount,
          discountAmount: data.discountAmount,
          netPrizeAmount: data.netPrizeAmount,
          dividendAmount: data.dividendAmount,
          notes: data.notes ?? bid.auctionCycle.notes,
        },
      });

      const payout = await tx.payout.create({
        data: {
          auctionCycleId: data.auctionCycleId,
          chitGroupId: bid.auctionCycle.chitGroupId,
          chitEnrollmentId: bid.chitEnrollmentId,
          memberId: bid.chitEnrollment.memberId,
          grossAmount: data.grossPrizeAmount,
          deductionsAmount: data.discountAmount,
          netAmount: data.netPrizeAmount,
          status: "PENDING",
          remarks: "Created automatically after auction finalization.",
        },
      });

      await tx.auditLog.createMany({
        data: [
          {
            actorUserId: data.actorUserId,
            entityType: "AuctionCycle",
            entityId: auctionCycle.id,
            action: "auction-cycle.finalized",
            summary: `Cycle ${auctionCycle.cycleNumber} finalized. Winner ticket ${bid.chitEnrollment.ticketNumber}.`,
            after: {
              status: auctionCycle.status,
              winningEnrollmentId: auctionCycle.winningEnrollmentId,
              winningBidAmount: auctionCycle.winningBidAmount?.toString(),
              grossPrizeAmount: auctionCycle.grossPrizeAmount?.toString(),
              discountAmount: auctionCycle.discountAmount?.toString(),
              netPrizeAmount: auctionCycle.netPrizeAmount?.toString(),
              dividendAmount: auctionCycle.dividendAmount?.toString(),
            },
          },
          {
            actorUserId: data.actorUserId,
            entityType: "Payout",
            entityId: payout.id,
            action: "payout.created",
            summary: `Pending payout created for member ${bid.chitEnrollment.member.memberCode}`,
            after: {
              auctionCycleId: payout.auctionCycleId,
              memberId: payout.memberId,
              status: payout.status,
              netAmount: payout.netAmount.toString(),
            },
          },
        ],
      });

      return {
        auctionCycle,
        payout,
      };
    });
  },
};
