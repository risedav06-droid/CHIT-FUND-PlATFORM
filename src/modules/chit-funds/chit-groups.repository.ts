import { db } from "@/server/db/client";

type CreateChitGroupRecord = {
  code: string;
  name: string;
  description?: string;
  ticketCount: number;
  installmentAmount: string;
  prizeAmount: string;
  durationMonths: number;
  startDate: Date;
  auctionDay?: number;
  status: "OPEN";
  auctionCycles: Array<{
    cycleNumber: number;
    scheduledAt: Date;
  }>;
  actorUserId?: string;
};

type CreateEnrollmentRecord = {
  chitGroupId: string;
  memberId: string;
  ticketNumber: number;
  isActive: boolean;
  installments: Array<{
    cycleNumber: number;
    dueDate: Date;
    dueAmount: string;
    status: "PENDING" | "OVERDUE";
  }>;
  actorUserId?: string;
};

export const chitGroupsRepository = {
  listChitGroups() {
    return db.chitGroup.findMany({
      orderBy: [{ createdAt: "desc" }],
      include: {
        _count: {
          select: {
            enrollments: true,
            auctionCycles: true,
          },
        },
      },
    });
  },

  countActiveGroups() {
    return db.chitGroup.count({
      where: {
        status: {
          in: ["OPEN", "ACTIVE"],
        },
      },
    });
  },

  listEnrollmentTargetGroups() {
    return db.chitGroup.findMany({
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
    });
  },

  findGroupById(groupId: string) {
    return db.chitGroup.findUnique({
      where: { id: groupId },
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });
  },

  async getChitGroupDetail(chitId: string) {
    const group = await db.chitGroup.findUnique({
      where: { id: chitId },
      include: {
        auctionCycles: {
          orderBy: [{ cycleNumber: "asc" }],
        },
        enrollments: {
          orderBy: [{ ticketNumber: "asc" }],
          include: {
            member: {
              select: {
                id: true,
                memberCode: true,
                firstName: true,
                lastName: true,
                primaryPhone: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      return null;
    }

    const [installments, payments, auctionResults, payouts] = await Promise.all([
      db.installment.findMany({
        where: { chitGroupId: chitId },
        orderBy: [{ dueDate: "asc" }, { cycleNumber: "asc" }],
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
                },
              },
            },
          },
        },
      }),
      db.payment.findMany({
        where: { chitGroupId: chitId },
        orderBy: [{ receivedOn: "desc" }, { createdAt: "desc" }],
        take: 30,
        include: {
          member: {
            select: {
              id: true,
              memberCode: true,
              firstName: true,
              lastName: true,
            },
          },
          installment: {
            select: {
              id: true,
              cycleNumber: true,
            },
          },
          chitEnrollment: {
            select: {
              id: true,
              ticketNumber: true,
            },
          },
        },
      }),
      db.auctionCycle.findMany({
        where: {
          chitGroupId: chitId,
          status: "SETTLED",
        },
        orderBy: [{ cycleNumber: "desc" }],
        take: 20,
        include: {
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
        },
      }),
      db.payout.findMany({
        where: { chitGroupId: chitId },
        orderBy: [{ createdAt: "desc" }],
        take: 25,
        include: {
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
          chitEnrollment: {
            select: {
              id: true,
              ticketNumber: true,
            },
          },
        },
      }),
    ]);

    const enrollmentIds = group.enrollments.map((enrollment) => enrollment.id);
    const paymentIds = payments.map((payment) => payment.id);
    const auctionCycleIds = [
      ...group.auctionCycles.map((cycle) => cycle.id),
      ...auctionResults.map((auctionResult) => auctionResult.id),
    ];
    const payoutIds = payouts.map((payout) => payout.id);
    const auditFilters = [
      {
        entityType: "ChitGroup",
        entityId: chitId,
      },
      ...(enrollmentIds.length > 0
        ? [
            {
              entityType: "ChitEnrollment",
              entityId: {
                in: enrollmentIds,
              },
            },
          ]
        : []),
      ...(paymentIds.length > 0
        ? [
            {
              entityType: "Payment",
              entityId: {
                in: paymentIds,
              },
            },
          ]
        : []),
      ...(auctionCycleIds.length > 0
        ? [
            {
              entityType: "AuctionCycle",
              entityId: {
                in: auctionCycleIds,
              },
            },
          ]
        : []),
      ...(payoutIds.length > 0
        ? [
            {
              entityType: "Payout",
              entityId: {
                in: payoutIds,
              },
            },
          ]
        : []),
    ];

    const auditLogs = await db.auditLog.findMany({
      where: {
        OR: auditFilters,
      },
      orderBy: [{ createdAt: "desc" }],
      take: 12,
    });

    return {
      group,
      installments,
      payments,
      auctionResults,
      payouts,
      auditLogs,
    };
  },

  createChitGroup(data: CreateChitGroupRecord) {
    return db.$transaction(async (tx) => {
      const chitGroup = await tx.chitGroup.create({
        data: {
          code: data.code,
          name: data.name,
          description: data.description,
          ticketCount: data.ticketCount,
          installmentAmount: data.installmentAmount,
          prizeAmount: data.prizeAmount,
          durationMonths: data.durationMonths,
          startDate: data.startDate,
          auctionDay: data.auctionDay,
          status: data.status,
          createdByUserId: data.actorUserId,
        },
      });

      await tx.auctionCycle.createMany({
        data: data.auctionCycles.map((cycle) => ({
          chitGroupId: chitGroup.id,
          cycleNumber: cycle.cycleNumber,
          scheduledAt: cycle.scheduledAt,
        })),
      });

      await tx.auditLog.create({
        data: {
          actorUserId: data.actorUserId,
          entityType: "ChitGroup",
          entityId: chitGroup.id,
          action: "chit-group.created",
          summary: `Chit group ${chitGroup.code} created`,
          after: {
            code: chitGroup.code,
            name: chitGroup.name,
            ticketCount: chitGroup.ticketCount,
            installmentAmount: chitGroup.installmentAmount.toString(),
            durationMonths: chitGroup.durationMonths,
          },
        },
      });

      return chitGroup;
    });
  },

  createEnrollment(data: CreateEnrollmentRecord) {
    return db.$transaction(async (tx) => {
      const enrollment = await tx.chitEnrollment.create({
        data: {
          chitGroupId: data.chitGroupId,
          memberId: data.memberId,
          ticketNumber: data.ticketNumber,
          isActive: data.isActive,
        },
      });

      await tx.installment.createMany({
        data: data.installments.map((installment) => ({
          chitGroupId: data.chitGroupId,
          chitEnrollmentId: enrollment.id,
          cycleNumber: installment.cycleNumber,
          dueDate: installment.dueDate,
          dueAmount: installment.dueAmount,
          status: installment.status,
        })),
      });

      await tx.auditLog.create({
        data: {
          actorUserId: data.actorUserId,
          entityType: "ChitEnrollment",
          entityId: enrollment.id,
          action: "chit-enrollment.created",
          summary: `Ticket ${enrollment.ticketNumber} enrolled`,
          after: {
            chitGroupId: enrollment.chitGroupId,
            memberId: enrollment.memberId,
            ticketNumber: enrollment.ticketNumber,
          },
        },
      });

      return enrollment;
    });
  },
};
