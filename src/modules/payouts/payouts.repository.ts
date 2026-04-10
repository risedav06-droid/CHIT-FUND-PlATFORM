import { db } from "@/server/db/client";

type UpdatePayoutRecord = {
  payoutId: string;
  status: "APPROVED" | "PAID" | "REJECTED";
  method?: "CASH" | "BANK_TRANSFER" | "UPI" | "CHEQUE" | "ONLINE";
  referenceNo?: string;
  paidAt?: Date;
  remarks?: string;
  proofUrl?: string;
  rejectionReason?: string;
  actorUserId?: string;
};

export const payoutsRepository = {
  findPayoutById(payoutId: string) {
    return db.payout.findUnique({
      where: { id: payoutId },
      include: {
        auctionCycle: {
          select: {
            id: true,
            cycleNumber: true,
            status: true,
          },
        },
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
      },
    });
  },

  findPayoutByGroupReference(chitGroupId: string, referenceNo: string) {
    return db.payout.findFirst({
      where: {
        chitGroupId,
        referenceNo,
      },
      select: {
        id: true,
        status: true,
      },
    });
  },

  updatePayout(data: UpdatePayoutRecord) {
    return db.$transaction(async (tx) => {
      const currentPayout = await tx.payout.findUniqueOrThrow({
        where: { id: data.payoutId },
        select: {
          id: true,
          status: true,
          netAmount: true,
          approvedByUserId: true,
        },
      });

      const now = new Date();
      const payout = await tx.payout.update({
        where: { id: data.payoutId },
        data: {
          status: data.status,
          method: data.method,
          referenceNo: data.referenceNo,
          remarks: data.remarks,
          proofUrl: data.proofUrl,
          rejectionReason: data.rejectionReason,
          approvedByUserId:
            data.status === "APPROVED"
              ? data.actorUserId
              : data.status === "PAID"
                ? currentPayout.approvedByUserId ?? data.actorUserId
                : currentPayout.approvedByUserId,
          approvedAt: data.status === "APPROVED" ? now : undefined,
          paidAt: data.status === "PAID" ? data.paidAt : undefined,
          acknowledgedAt: data.status === "PAID" ? now : undefined,
          rejectedAt: data.status === "REJECTED" ? now : undefined,
        },
        include: {
          auctionCycle: {
            select: {
              id: true,
              cycleNumber: true,
            },
          },
          chitGroup: {
            select: {
              code: true,
            },
          },
          member: {
            select: {
              id: true,
              memberCode: true,
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: data.actorUserId,
          entityType: "Payout",
          entityId: payout.id,
          action: "payout.status-updated",
          summary: `Payout for cycle ${payout.auctionCycle.cycleNumber} moved to ${payout.status}`,
          before: {
            status: currentPayout.status,
            netAmount: currentPayout.netAmount.toString(),
          },
          after: {
            status: payout.status,
            method: payout.method,
            referenceNo: payout.referenceNo,
            paidAt: payout.paidAt,
            proofUrl: payout.proofUrl,
            rejectionReason: payout.rejectionReason,
          },
        },
      });

      return payout;
    });
  },
};
