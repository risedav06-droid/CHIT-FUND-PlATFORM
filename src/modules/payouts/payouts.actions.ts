'use server';

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildFeedbackHref } from "@/lib/action-state";
import { formDataToObject } from "@/lib/form-data";
import { authService } from "@/modules/auth/auth.service";
import { payoutsService } from "@/modules/payouts/payouts.service";
import { payoutStatusUpdateSchema } from "@/modules/payouts/payouts.validation";

const auctionsPath = "/auctions";

export async function updatePayoutStatusAction(formData: FormData) {
  const session = await authService.requireActionPermission(
    "manage_payouts",
    auctionsPath,
  );
  const rawInput = formDataToObject(formData);
  const rawAuctionCycleId =
    typeof rawInput.auctionCycleId === "string"
      ? rawInput.auctionCycleId
      : undefined;
  const feedbackPath = rawAuctionCycleId
    ? `/auctions/${rawAuctionCycleId}`
    : auctionsPath;
  const parsed = payoutStatusUpdateSchema.safeParse(rawInput);

  if (!parsed.success) {
    redirect(
      buildFeedbackHref(
        feedbackPath,
        "error",
        parsed.error.issues[0]?.message ?? "Unable to update payout.",
      ),
    );
  }

  try {
    const payout = await payoutsService.updatePayoutStatus(
      parsed.data,
      session.user.id,
      session.user.role,
    );
    const cyclePath = `/auctions/${payout.auctionCycle.id}`;

    revalidatePath(cyclePath);
    revalidatePath(auctionsPath);
    revalidatePath("/chit-funds");
    revalidatePath("/members");
    revalidatePath("/dashboard");

    redirect(
      buildFeedbackHref(
        cyclePath,
        "success",
        `Payout status updated to ${payout.status.replaceAll("_", " ")}.`,
      ),
    );
  } catch (error) {
    redirect(
      buildFeedbackHref(
        feedbackPath,
        "error",
        error instanceof Error ? error.message : "Unable to update payout.",
      ),
    );
  }
}
