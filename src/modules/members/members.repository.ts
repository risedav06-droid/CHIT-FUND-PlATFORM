import { db } from "@/server/db/client";

type CreateMemberRecord = {
  memberCode: string;
  firstName: string;
  lastName?: string;
  primaryPhone: string;
  primaryEmail?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  notes?: string;
  actorUserId?: string;
};

export const membersRepository = {
  listMembers() {
    return db.member.findMany({
      orderBy: [{ createdAt: "desc" }],
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });
  },

  countActiveMembers() {
    return db.member.count({
      where: {
        status: "ACTIVE",
      },
    });
  },

  listMemberOptions() {
    return db.member.findMany({
      where: {
        status: {
          in: ["ACTIVE", "PENDING_KYC"],
        },
      },
      orderBy: [{ firstName: "asc" }, { memberCode: "asc" }],
      select: {
        id: true,
        memberCode: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    });
  },

  findMemberById(memberId: string) {
    return db.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        memberCode: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    });
  },

  async getMemberDetail(memberId: string) {
    const member = await db.member.findUnique({
      where: { id: memberId },
      include: {
        enrollments: {
          orderBy: [{ joinedAt: "desc" }],
          include: {
            chitGroup: {
              select: {
                id: true,
                code: true,
                name: true,
                status: true,
                startDate: true,
                installmentAmount: true,
                durationMonths: true,
              },
            },
          },
        },
      },
    });

    if (!member) {
      return null;
    }

    const [installments, payments, auctionResults, payouts] = await Promise.all([
      db.installment.findMany({
        where: {
          chitEnrollment: {
            memberId,
          },
        },
        orderBy: [{ dueDate: "asc" }, { cycleNumber: "asc" }],
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
            },
          },
        },
      }),
      db.payment.findMany({
        where: { memberId },
        orderBy: [{ receivedOn: "desc" }, { createdAt: "desc" }],
        take: 30,
        include: {
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
              dueDate: true,
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
          winningEnrollment: {
            is: {
              memberId,
            },
          },
        },
        orderBy: [{ closedAt: "desc" }, { scheduledAt: "desc" }],
        take: 20,
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
              id: true,
              ticketNumber: true,
            },
          },
          payout: {
            select: {
              id: true,
              status: true,
              netAmount: true,
              method: true,
              referenceNo: true,
              paidAt: true,
            },
          },
        },
      }),
      db.payout.findMany({
        where: { memberId },
        orderBy: [{ createdAt: "desc" }],
        take: 20,
        include: {
          chitGroup: {
            select: {
              id: true,
              code: true,
              name: true,
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

    const enrollmentIds = member.enrollments.map((enrollment) => enrollment.id);
    const paymentIds = payments.map((payment) => payment.id);
    const auctionCycleIds = auctionResults.map((auctionResult) => auctionResult.id);
    const payoutIds = payouts.map((payout) => payout.id);
    const auditFilters = [
      {
        entityType: "Member",
        entityId: memberId,
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
      member,
      installments,
      payments,
      auctionResults,
      payouts,
      auditLogs,
    };
  },

  createMember(data: CreateMemberRecord) {
    return db.$transaction(async (tx) => {
      const member = await tx.member.create({
        data: {
          memberCode: data.memberCode,
          firstName: data.firstName,
          lastName: data.lastName,
          primaryPhone: data.primaryPhone,
          primaryEmail: data.primaryEmail,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          notes: data.notes,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: data.actorUserId,
          entityType: "Member",
          entityId: member.id,
          action: "member.created",
          summary: `Member ${member.memberCode} created`,
          after: {
            memberCode: member.memberCode,
            firstName: member.firstName,
            primaryPhone: member.primaryPhone,
            status: member.status,
          },
        },
      });

      return member;
    });
  },
};
