import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { finalizeLuckyDrawForCycle, getSession } from "@/utils/supabase/db";

export async function POST(request: Request) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
    }

    const body = await request.json();
    const result = await finalizeLuckyDrawForCycle({
      organiserId: user.id,
      chitGroupId: body.groupId,
      cycleId: body.cycleId,
    });

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/chit-groups/${body.groupId}`);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not complete the lucky draw." },
      { status: 500 },
    );
  }
}
