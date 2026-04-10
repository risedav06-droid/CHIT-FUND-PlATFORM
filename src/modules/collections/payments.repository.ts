import { db } from "@/server/db/client";

type CreatePaymentRecord = {
  installmentId: string;
  amount: string;
  paymentMode:
    | "CASH"
    | "BANK_TRANSFER"
    | "UPI"
    | "CHEQUE"
    | "ONLINE"
    | "ADJUSTMENT";
  referenceNo?: string;
  receivedOn: Date;
  remarks?: string;
  nextPaidAmount: string;
  nextStatus: "PAID" | "PARTIALLY_PAID" | "OVERDUE";
  paidAt?: Date;
  actorUserId?: string;
};

type DashboardMetricsInput = {
  monthStart: Date;
  monthEnd: Date;
  asOf: Date;
};

export const paymentsRepository = {
  listPendingInstallments() {
    return db.installment.findMany({
      where: {
        status: {
          in: ["PENDING", "PARTIALLY_PAID", "OVERDUE"],
        },
      },
      orderBy: [{ dueDate: "asc" }, { cycleNumber: "asc" }],
      include: {
        chitGroup: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
          },
        },
        chitEnrollment: {
          select: {
            id: true,
            ticketNumber: true,
            isActive: true,
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
          orderBy: [{ receivedOn: "desc" }, { createdAt: "desc" }],
          take: 3,
          select: {
            id: true,
            amount: true,
            paymentMode: true,
            referenceNo: true,
            receivedOn: true,
          },
        },
      },
    });
  },

  listRecentPayments() {
    return db.payment.findMany({
      orderBy: [{ receivedOn: "desc" }, { createdAt: "desc" }],
      take: 20,
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
      },
    });
  },

  findInstallmentById(installmentId: string) {
    return db.installment.findUnique({
      where: { id: installmentId },
      include: {
        chitGroup: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
          },
        },
        chitEnrollment: {
          select: {
            id: true,
            ticketNumber: true,
            isActive: true,
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
    });
  },

  findPaymentByGroupReference(chitGroupId: string, referenceNo: string) {
    return db.payment.findFirst({
      where: {
        chitGroupId,
        referenceNo,
      },
      select: {
        id: true,
        referenceNo: true,
      },
    });
  },

  async getDashboardMetrics({
    monthStart,
    monthEnd,
    asOf,
  }: DashboardMetricsInput) {
    const [dueThisMonthAggregate, collectionsThisMonthAggregate, overdueInstallments] =
      await Promise.all([
        db.installment.aggregate({
          where: {
            dueDate: {
              gte: monthStart,
              lt: monthEnd,
            },
          },
          _sum: {
            dueAmount: true,
          },
        }),
        db.payment.aggregate({
          where: {
            receivedOn: {
              gte: monthStart,
              lt: monthEnd,
            },
          },
          _sum: {
            amount: true,
          },
        }),
        db.installment.findMany({
          where: {
            dueDate: {
              lt: asOf,
            },
            status: {
              in: ["PENDING", "PARTIALLY_PAID", "OVERDUE"],
            },
          },
          select: {
            id: true,
            chitGroupId: true,
            dueDate: true,
            dueAmount: true,
            paidAmount: true,
            status: true,
            chitGroup: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        }),
      ]);

    return {
      dueThisMonth: dueThisMonthAggregate._sum.dueAmount,
      collectionsThisMonth: collectionsThisMonthAggregate._sum.amount,
      overdueInstallments,
    };
  },

  recordPayment(data: CreatePaymentRecord) {
    return db.$transaction(async (tx) => {
      const installment = await tx.installment.findUnique({
        where: { id: data.installmentId },
        include: {
          chitGroup: {
            select: {
              id: true,
              status: true,
            },
          },
          chitEnrollment: {
            select: {
              id: true,
              ticketNumber: true,
              isActive: true,
              member: {
                select: {
                  id: true,
                  memberCode: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      if (!installment) {
        throw new Error("Installment was not found.");
      }

      if (data.referenceNo) {
        const duplicateReference = await tx.payment.findFirst({
          where: {
            chitGroupId: installment.chitGroupId,
            referenceNo: data.referenceNo,
          },
          select: {
            id: true,
          },
        });

        if (duplicateReference) {
          throw new Error("Reference number already exists in this chit group.");
        }
      }

      const payment = await tx.payment.create({
        data: {
          installmentId: installment.id,
          chitGroupId: installment.chitGroupId,
          chitEnrollmentId: installment.chitEnrollmentId,
          memberId: installment.chitEnrollment.member.id,
          amount: data.amount,
          paymentMode: data.paymentMode,
          referenceNo: data.referenceNo,
          receivedOn: data.receivedOn,
          remarks: data.remarks,
          recordedByUserId: data.actorUserId,
        },
      });

      await tx.installment.update({
        where: { id: installment.id },
        data: {
          paidAmount: data.nextPaidAmount,
          status: data.nextStatus,
          lastPaidAt: data.receivedOn,
          paidAt: data.paidAt,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: data.actorUserId,
          entityType: "Payment",
          entityId: payment.id,
          action: "payment.recorded",
          summary: `Payment recorded for installment ${installment.cycleNumber}`,
          after: {
            installmentId: installment.id,
            amount: payment.amount.toString(),
            paymentMode: payment.paymentMode,
            referenceNo: payment.referenceNo,
          },
          metadata: {
            memberCode: installment.chitEnrollment.member.memberCode,
            ticketNumber: installment.chitEnrollment.ticketNumber,
          },
        },
      });

      return payment;
    });
  },
};
