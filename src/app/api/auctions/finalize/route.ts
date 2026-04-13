import { NextResponse } from "next/server";

import { getSession } from "@/utils/supabase/db";
import { finalizeAuctionForCycle } from "@/utils/supabase/db";

export async function POST(request: Request) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
    }

    const body = await request.json();
    const result = await finalizeAuctionForCycle({
      organiserId: user.id,
      chitGroupId: body.groupId,
      cycleId: body.cycleId,
      winnerId: body.winnerId,
      winningDiscount: Number(body.winningDiscount),
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not finalize auction." },
      { status: 500 },
    );
  }
}
