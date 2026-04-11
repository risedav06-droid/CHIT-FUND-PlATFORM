'use server';

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildFeedbackHref } from "@/lib/action-state";
import { formDataToObject } from "@/lib/form-data";
import { authService } from "@/modules/auth/auth.service";
import { auctionsService } from "@/modules/auctions/auctions.service";
import {
  createAuctionCycleSchema,
  finalizeAuctionSchema,
  recordBidSchema,
} from "@/modules/auctions/auctions.validation";

const auctionsPath = "/auctions";

function revalidateAuctionWorkspaces(cyclePath?: string) {
  revalidatePath(auctionsPath);
  revalidatePath("/dashboard");
  revalidatePath("/chit-funds");
  revalidatePath("/members");
  revalidatePath("/reports");
  revalidatePath("/reports/pilot");
  revalidatePath("/exports");
  revalidatePath("/notifications");

  if (cyclePath) {
    revalidatePath(cyclePath);
  }
}

export async function createAuctionCycleAction(formData: FormData) {
  const session = await authService.requireActionPermission(
    "manage_auctions",
    auctionsPath,
  );
  const parsed = createAuctionCycleSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirect(
      buildFeedbackHref(
        auctionsPath,
        "error",
        parsed.error.issues[0]?.message ?? "Unable to create the auction cycle.",
      ),
    );
  }

  try {
    const cycle = await auctionsService.createAuctionCycle(
      parsed.data,
      session.user.id,
    );

    revalidateAuctionWorkspaces();
    redirect(
      buildFeedbackHref(
        `/auctions/${cycle.id}`,
        "success",
        "Auction cycle created successfully.",
      ),
    );
  } catch (error) {
    redirect(
      buildFeedbackHref(
        auctionsPath,
        "error",
        error instanceof Error
          ? error.message
          : "Unable to create the auction cycle.",
      ),
    );
  }
}

export async function recordBidAction(formData: FormData) {
  const session = await authService.requireActionPermission(
    "manage_auctions",
    auctionsPath,
  );
  const parsed = recordBidSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirect(
      buildFeedbackHref(
        auctionsPath,
        "error",
        parsed.error.issues[0]?.message ?? "Unable to record the bid.",
      ),
    );
  }

  const cyclePath = `/auctions/${parsed.data.auctionCycleId}`;

  try {
    await auctionsService.recordBid(parsed.data, session.user.id);
  } catch (error) {
    redirect(
      buildFeedbackHref(
        cyclePath,
        "error",
        error instanceof Error ? error.message : "Unable to record the bid.",
      ),
    );
  }

  revalidateAuctionWorkspaces(cyclePath);
  redirect(
    buildFeedbackHref(cyclePath, "success", "Bid recorded successfully."),
  );
}

export async function finalizeAuctionAction(formData: FormData) {
  const session = await authService.requireActionPermission(
    "finalize_auction",
    auctionsPath,
  );
  const parsed = finalizeAuctionSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    redirect(
      buildFeedbackHref(
        auctionsPath,
        "error",
        parsed.error.issues[0]?.message ?? "Unable to finalize the auction.",
      ),
    );
  }

  const cyclePath = `/auctions/${parsed.data.auctionCycleId}`;

  try {
    await auctionsService.finalizeAuction(parsed.data, session.user.id);
  } catch (error) {
    redirect(
      buildFeedbackHref(
        cyclePath,
        "error",
        error instanceof Error ? error.message : "Unable to finalize the auction.",
      ),
    );
  }

  revalidateAuctionWorkspaces(cyclePath);
  redirect(
    buildFeedbackHref(
      cyclePath,
      "success",
      "Auction finalized and pending payout created.",
    ),
  );
}
