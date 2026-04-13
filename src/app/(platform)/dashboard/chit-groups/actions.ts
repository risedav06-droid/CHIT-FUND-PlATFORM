'use server';
import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";
import { addMemberToGroup, getDashboardChitGroupDetail, markPaymentPaid } from "@/utils/supabase/db";

export type CreateChitGroupFormState = {
  error?: string;
  success?: boolean;
  redirectTo?: string;
  fieldErrors?: Partial<Record<
    "name" | "memberCount" | "monthlyAmount" | "durationMonths" | "commissionPct" | "chitType" | "startDate",
    string
  >>;
};

function validateCreateChitGroup(formData: FormData): CreateChitGroupFormState {
  const name = String(formData.get("name") || "").trim();
  const memberCount = parseInt(String(formData.get("memberCount") || "0"), 10);
  const monthlyAmount = parseFloat(String(formData.get("monthlyAmount") || "0"));
  const durationMonths = parseInt(String(formData.get("durationMonths") || "0"), 10);
  const commissionPct = parseFloat(String(formData.get("commissionPct") || "5"));
  const chitType = String(formData.get("chitType") || "");
  const startDate = String(formData.get("startDate") || "");
  const fieldErrors: CreateChitGroupFormState["fieldErrors"] = {};

  if (!name) fieldErrors.name = "Enter a chit name.";
  if (!Number.isFinite(memberCount) || memberCount < 2 || memberCount > 100) {
    fieldErrors.memberCount = "Member count must be between 2 and 100.";
  }
  if (!Number.isFinite(monthlyAmount) || monthlyAmount <= 0) {
    fieldErrors.monthlyAmount = "Monthly amount must be greater than 0.";
  }
  if (!Number.isFinite(durationMonths) || durationMonths < 1 || durationMonths > 60) {
    fieldErrors.durationMonths = "Duration must be between 1 and 60 months.";
  }
  if (!Number.isFinite(commissionPct)) {
    fieldErrors.commissionPct = "Enter a valid commission percentage.";
  }
  if (!chitType) {
    fieldErrors.chitType = "Choose how this chit group should run.";
  }
  if (!startDate) {
    fieldErrors.startDate = "Select a start date.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      error: "Please review the highlighted fields.",
      fieldErrors,
    };
  }

  return {};
}

export async function createDashboardChitGroupAction(
  _previousState: CreateChitGroupFormState,
  formData: FormData,
): Promise<CreateChitGroupFormState> {
  const validation = validateCreateChitGroup(formData);

  if (validation.error) {
    return validation;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please sign in again and try once more." };
  }

  await supabase.from("profiles").upsert(
    {
      id: user.id,
      phone: "",
      plan: "free",
    },
    { onConflict: "id", ignoreDuplicates: true },
  );

  const memberCount = parseInt(String(formData.get("memberCount")), 10);
  const monthlyAmount = parseFloat(String(formData.get("monthlyAmount")));
  const durationMonths = parseInt(String(formData.get("durationMonths")), 10);
  const commissionPct = parseFloat(String(formData.get("commissionPct") || "5"));
  const startDate = String(formData.get("startDate"));

  const { data, error } = await supabase
    .from("chit_groups")
    .insert({
      organiser_id: user.id,
      name: formData.get("name"),
      description: formData.get("description") || null,
      member_count: memberCount,
      monthly_amount: monthlyAmount,
      duration_months: durationMonths,
      commission_pct: commissionPct,
      chit_type: formData.get("chitType") || "auction",
      start_date: startDate,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    console.error("[Create Chit Group Error]", error.message);
    return { error: error.message };
  }

  const { error: cycleError } = await supabase.from("payment_cycles").insert({
    chit_group_id: data.id,
    cycle_number: 1,
    due_date: startDate,
    status: "pending",
  });

  if (cycleError) {
    console.error("[Create Payment Cycles Error]", cycleError.message);
    return { error: cycleError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/chit-groups");

  return {
    success: true,
    redirectTo: `/dashboard/chit-groups/${data.id}`,
  };
}

export async function addMemberToDashboardChitGroupAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const chitGroupId = String(formData.get("chitGroupId") || "");

  if (!user) {
    throw new Error("Please sign in again.");
  }

  const detail = await getDashboardChitGroupDetail(chitGroupId, user.id);

  if (!detail.data?.group) {
    throw new Error("This chit group could not be found.");
  }

  await addMemberToGroup({
    chitGroupId,
    name: String(formData.get("name") || ""),
    phone: String(formData.get("phone") || ""),
    whatsappPhone: String(formData.get("whatsappPhone") || ""),
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/chit-groups/${chitGroupId}`);
}

export async function markMemberPaidAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const paymentId = String(formData.get("paymentId") || "");
  const chitGroupId = String(formData.get("chitGroupId") || "");

  if (!user) {
    throw new Error("Please sign in again.");
  }

  const detail = await getDashboardChitGroupDetail(chitGroupId, user.id);

  if (!detail.data?.group) {
    throw new Error("This chit group could not be found.");
  }

  await markPaymentPaid(paymentId);

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/chit-groups/${chitGroupId}`);
}
