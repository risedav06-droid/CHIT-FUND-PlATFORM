import { payoutsRepository } from "@/modules/payouts/payouts.repository";
import { notificationsService } from "@/modules/notifications/notifications.service";
import type { PayoutStatusUpdateInput } from "@/modules/payouts/payouts.validation";
import type { AuthRole } from "@/modules/auth/auth.permissions";

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export const payoutsService = {
  async updatePayoutStatus(
    input: PayoutStatusUpdateInput,
    actorUserId?: string,
    actorRole?: AuthRole,
  ) {
    const payout = await payoutsRepository.findPayoutById(input.payoutId);

    if (!payout) {
      throw new Error("Payout record was not found.");
    }

    if (["PAID", "DISBURSED", "REJECTED", "CANCELLED"].includes(payout.status)) {
      throw new Error("This payout is already in a terminal state.");
    }

    if (input.status === "APPROVED" && payout.status !== "PENDING") {
      throw new Error("Only pending payouts can be approved.");
    }

    if (input.status === "PAID" && payout.status !== "APPROVED") {
      throw new Error("Approve the payout before marking it as paid.");
    }

    if (input.status === "REJECTED" && !["PENDING", "APPROVED", "ON_HOLD"].includes(payout.status)) {
      throw new Error("Only pending, approved, or on-hold payouts can be rejected.");
    }

    if (input.referenceNo) {
      const matchingReference = await payoutsRepository.findPayoutByGroupReference(
        payout.chitGroupId,
        input.referenceNo,
      );

      if (matchingReference && matchingReference.id !== payout.id) {
        throw new Error("That payout reference number is already used in this chit group.");
      }
    }

    try {
      const updatedPayout = await payoutsRepository.updatePayout({
        payoutId: input.payoutId,
        status: input.status,
        method: input.method,
        referenceNo: input.referenceNo,
        paidAt: input.paidOn,
        remarks: input.remarks,
        proofUrl: input.proofUrl,
        rejectionReason: input.rejectionReason,
        actorUserId,
      });

      await notificationsService.notifyPayoutStatusChange({
        payoutId: updatedPayout.id,
        cycleId: updatedPayout.auctionCycle.id,
        cycleNumber: updatedPayout.auctionCycle.cycleNumber,
        chitGroupCode: updatedPayout.chitGroup.code,
        memberId: updatedPayout.member.id,
        status: updatedPayout.status,
        netAmount: Number(updatedPayout.netAmount),
        actorRole: actorRole ?? "SUPER_ADMIN",
      });

      return updatedPayout;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new Error("That payout reference number is already used in this chit group.");
      }

      throw error;
    }
  },
};
