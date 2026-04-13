import { NextResponse } from "next/server";

import { updatePaymentWithDetails } from "@/utils/supabase/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payment = await updatePaymentWithDetails({
      paymentId: body.paymentId,
      paymentMode: body.paymentMode,
      paymentDate: body.paymentDate,
      notes: body.notes,
    });

    return NextResponse.json({ ok: true, payment });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update payment." },
      { status: 500 },
    );
  }
}
