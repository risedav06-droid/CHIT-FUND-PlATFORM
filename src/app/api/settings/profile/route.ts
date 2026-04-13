import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { ensureProfile, getSession } from "@/utils/supabase/db";

export async function POST(request: Request) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
    }

    const body = await request.json();
    const supabase = await createClient();

    await ensureProfile(user.id, body.phone ?? "");
    await supabase.auth.updateUser({
      data: {
        display_name: body.displayName ?? "",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save settings." },
      { status: 500 },
    );
  }
}
