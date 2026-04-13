'use server';

import type { Route } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

type OtpRequestState = {
  error: string;
  success: boolean;
  email: string;
};

type OtpVerifyState = {
  error: string;
};

export async function requestOtpAction(
  _previousState: OtpRequestState,
  formData: FormData,
) {
  const email = formData.get("email") as string;

  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address", success: false, email: "" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    console.error("[OTP Error]", error.message);
    return {
      error: "Could not send login link. Please try again.",
      success: false,
      email: "",
    };
  }

  return { error: "", success: true, email };
}

export async function verifyOtpAction(
  _previousState: OtpVerifyState,
  formData: FormData,
) {
  const phone = formData.get("phone") as string;
  const token = formData.get("token") as string;
  const nextPath = (formData.get("next") as string) || "/dashboard";

  if (!token || token.length !== 6) {
    return { error: "Enter the 6-digit code." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    phone: `+91${phone}`,
    token,
    type: "sms",
  });

  if (error) {
    console.error("[Verify Error]", error.message);
    return { error: "Invalid code. Please try again." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.from("profiles").upsert({
      id: user.id,
      phone: `+91${phone}`,
      plan: "free",
    });
  }

  redirect(nextPath as Route);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
