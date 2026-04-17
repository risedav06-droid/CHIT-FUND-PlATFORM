'use server';
import { revalidatePath } from "next/cache";

import { isValidIndianPhone, normalizePhone } from "@/lib/phone";
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

export type AddMemberFormState = {
  error?: string;
  success?: boolean;
  member?: {
    id: string;
    name: string;
    phone: string;
    whatsapp_phone?: string | null;
    invite_token: string;
    pot_taken: boolean;
  };
  currentPayment?: {
    id: string;
    amount_due: number;
    amount_paid: number;
    status: "paid" | "unpaid" | "partial";
  } | null;
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

  if (!name || name.length < 3) fieldErrors.name = "Name must be at least 3 characters.";
  if (!Number.isFinite(memberCount) || memberCount < 2 || memberCount > 100) {
    fieldErrors.memberCount = "Member count must be between 2 and 100.";
  }
  if (!Number.isFinite(monthlyAmount) || monthlyAmount <= 0) {
    fieldErrors.monthlyAmount = "Monthly amount must be greater than 0.";
  }
  if (!Number.isFinite(durationMonths) || durationMonths < 1 || durationMonths > 120) {
    fieldErrors.durationMonths = "Duration must be between 1 and 120 months.";
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

export async function addMemberToDashboardChitGroupAction(
  _previousState: AddMemberFormState,
  formData: FormData,
): Promise<AddMemberFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const chitGroupId = String(formData.get("chitGroupId") || "");

  if (!user) {
    return { error: "Please sign in again.", success: false };
  }

  const detail = await getDashboardChitGroupDetail(chitGroupId, user.id);

  if (!detail.data?.group) {
    return { error: "This chit group could not be found.", success: false };
  }

  const currentMembers = (detail.data.members as any[]) ?? [];
  const memberLimit = Number((detail.data.group as any).member_count ?? 0);

  if (currentMembers.length >= memberLimit) {
    return {
      error: `This chit is full. You set a limit of ${memberLimit} members when creating this chit.`,
      success: false,
    };
  }

  let member;

  try {
    member = await addMemberToGroup({
      chitGroupId,
      name: String(formData.get("name") || ""),
      phone: String(formData.get("phone") || ""),
      whatsappPhone: String(formData.get("whatsappPhone") || ""),
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not add member.",
      success: false,
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/chit-groups/${chitGroupId}`);
  return {
    success: true,
    member: {
      id: member.id,
      name: member.name,
      phone: member.phone,
      whatsapp_phone: member.whatsapp_phone,
      invite_token: member.invite_token,
      pot_taken: Boolean(member.pot_taken),
    },
    currentPayment: member.payments?.[0]
      ? {
          id: member.payments[0].id,
          amount_due: Number(member.payments[0].amount_due ?? 0),
          amount_paid: Number(member.payments[0].amount_paid ?? 0),
          status: (member.payments[0].status ?? "unpaid") as "paid" | "unpaid" | "partial",
        }
      : null,
  };
}

export async function updateDashboardMemberAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const chitGroupId = String(formData.get("chitGroupId") || "");
  const memberId = String(formData.get("memberId") || "");
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const whatsappPhone = String(formData.get("whatsappPhone") || "").trim();

  if (!user) {
    throw new Error("Please sign in again.");
  }

  const detail = await getDashboardChitGroupDetail(chitGroupId, user.id);

  if (!detail.data?.group) {
    throw new Error("This chit group could not be found.");
  }

  if (!name || name.length < 3) {
    throw new Error("Enter a member name with at least 3 characters.");
  }

  if (!isValidIndianPhone(phone)) {
    throw new Error("Enter a valid Indian phone number.");
  }

  if (whatsappPhone && !isValidIndianPhone(whatsappPhone)) {
    throw new Error("Enter a valid WhatsApp number or leave it blank.");
  }

  const { error } = await supabase
    .from("members")
    .update({
      name,
      phone: normalizePhone(phone),
      whatsapp_phone: whatsappPhone ? normalizePhone(whatsappPhone) : normalizePhone(phone),
    })
    .eq("id", memberId)
    .eq("chit_group_id", chitGroupId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/chit-groups/${chitGroupId}`);
  revalidatePath(`/dashboard/chit-groups/${chitGroupId}/members/${memberId}`);
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
