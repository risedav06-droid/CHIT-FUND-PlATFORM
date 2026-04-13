import { addMonths } from "date-fns";

import { createClient } from "./server";

export async function ensureProfile(userId: string, phone = "") {
  const supabase = await createClient();
  return supabase.from("profiles").upsert(
    {
      id: userId,
      phone,
      plan: "free",
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
}

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(userId: string) {
  const supabase = await createClient();
  return supabase.from("profiles").select("*").eq("id", userId).single();
}

export async function getChitGroups(organiserId: string) {
  const supabase = await createClient();
  return supabase
    .from("chit_groups")
    .select(`
      *,
      members (count)
    `)
    .eq("organiser_id", organiserId)
    .eq("status", "active")
    .order("created_at", { ascending: false });
}

export async function getOrganiserDashboardData(organiserId: string) {
  const supabase = await createClient();
  const { data: groups } = await getChitGroups(organiserId);
  const activeGroups = groups ?? [];
  const groupIds = activeGroups.map((group: any) => group.id);

  if (groupIds.length === 0) {
    return {
      groups: [],
      membersCount: 0,
      pendingPayments: 0,
      commissionEarned: 0,
    };
  }

  const [{ data: cycles }, { data: members }] = await Promise.all([
    supabase
      .from("payment_cycles")
      .select("id, chit_group_id, cycle_number, status")
      .in("chit_group_id", groupIds),
    supabase.from("members").select("id").in("chit_group_id", groupIds).eq("is_active", true),
  ]);

  const cycleIds = (cycles ?? []).map((cycle) => cycle.id);
  const [{ data: payments }, { data: auctions }] = await Promise.all([
    cycleIds.length > 0
      ? supabase
          .from("payments")
          .select("id, cycle_id, status")
          .in("cycle_id", cycleIds)
      : Promise.resolve({ data: [] as any[] }),
    cycleIds.length > 0
      ? supabase
          .from("auctions")
          .select("foreman_commission")
          .in("cycle_id", cycleIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  return {
    groups: activeGroups,
    membersCount: (members ?? []).length,
    pendingPayments: (payments ?? []).filter((payment) => payment.status !== "paid").length,
    commissionEarned: (auctions ?? []).reduce(
      (sum, auction: any) => sum + Number(auction.foreman_commission ?? 0),
      0,
    ),
  };
}

export async function getChitGroupById(id: string, organiserId: string) {
  const supabase = await createClient();
  return supabase
    .from("chit_groups")
    .select(`
      *,
      members (*),
      payment_cycles (*)
    `)
    .eq("id", id)
    .eq("organiser_id", organiserId)
    .single();
}

export async function getDashboardChitGroupDetail(id: string, organiserId: string) {
  const supabase = await createClient();
  const [{ data: group, error: groupError }, { data: members }, { data: paymentCycles }] =
    await Promise.all([
      supabase
        .from("chit_groups")
        .select("*")
        .eq("id", id)
        .eq("organiser_id", organiserId)
        .single(),
      supabase
        .from("members")
        .select(`
          *,
          payments (
            *,
            payment_cycles (*)
          )
        `)
        .eq("chit_group_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("payment_cycles")
        .select(`
          *,
          auctions (*)
        `)
        .eq("chit_group_id", id)
        .order("cycle_number", { ascending: true }),
    ]);

  if (groupError) {
    return { data: null, error: groupError };
  }

  return {
    data: {
      group,
      members: members ?? [],
      paymentCycles: paymentCycles ?? [],
    },
    error: null,
  };
}

export async function createChitGroup(input: {
  organiserId: string;
  name: string;
  description?: string;
  memberCount: number;
  monthlyAmount: number;
  durationMonths: number;
  commissionPct: number;
  chitType: "auction" | "fixed_rotation";
  startDate: string;
}) {
  const supabase = await createClient();
  const { data: group, error } = await supabase
    .from("chit_groups")
    .insert({
      organiser_id: input.organiserId,
      name: input.name,
      description: input.description || null,
      member_count: input.memberCount,
      monthly_amount: input.monthlyAmount,
      duration_months: input.durationMonths,
      commission_pct: input.commissionPct,
      chit_type: input.chitType,
      start_date: input.startDate,
      status: "active",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const { error: cycleError } = await supabase.from("payment_cycles").insert({
    chit_group_id: group.id,
    cycle_number: 1,
    due_date: input.startDate,
    status: "pending",
  });

  if (cycleError) {
    throw new Error(cycleError.message);
  }

  return group;
}

export async function addMemberToGroup(input: {
  chitGroupId: string;
  name: string;
  phone: string;
  whatsappPhone?: string;
}) {
  const supabase = await createClient();
  const [{ data: member, error: memberError }, { data: group }, { data: paymentCycles }] =
    await Promise.all([
      supabase
        .from("members")
        .insert({
          chit_group_id: input.chitGroupId,
          name: input.name,
          phone: input.phone,
          whatsapp_phone: input.whatsappPhone || input.phone,
        })
        .select("*")
        .single(),
      supabase
        .from("chit_groups")
        .select("monthly_amount")
        .eq("id", input.chitGroupId)
        .single(),
      supabase
        .from("payment_cycles")
        .select("*")
        .eq("chit_group_id", input.chitGroupId)
        .order("cycle_number", { ascending: true }),
    ]);

  if (memberError || !member) {
    throw new Error(memberError?.message ?? "Unable to add member.");
  }

  const currentCycle =
    (paymentCycles ?? []).find((cycle: any) => cycle.status !== "completed") ??
    (paymentCycles ?? [])[0];

  if (currentCycle) {
    const { error: paymentsError } = await supabase.from("payments").insert({
      cycle_id: currentCycle.id,
      member_id: member.id,
      amount_due: group?.monthly_amount ?? 0,
      amount_paid: 0,
      status: "unpaid",
    });

    if (paymentsError) {
      throw new Error(paymentsError.message);
    }
  }

  return member;
}

export async function markPaymentPaid(paymentId: string) {
  const supabase = await createClient();
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .single();

  if (paymentError || !payment) {
    throw new Error(paymentError?.message ?? "Payment not found.");
  }

  const { error } = await supabase
    .from("payments")
    .update({
      amount_paid: payment.amount_due,
      payment_mode: payment.payment_mode ?? "cash",
      payment_date: new Date().toISOString().slice(0, 10),
      status: "paid",
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updatePaymentWithDetails(input: {
  paymentId: string;
  paymentMode: string;
  paymentDate: string;
  notes?: string;
}) {
  const supabase = await createClient();
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select(`
      *,
      members (
        id,
        name,
        chit_group_id
      ),
      payment_cycles (
        id,
        cycle_number
      )
    `)
    .eq("id", input.paymentId)
    .single();

  if (paymentError || !payment) {
    throw new Error(paymentError?.message ?? "Payment not found.");
  }

  const { error } = await supabase
    .from("payments")
    .update({
      amount_paid: payment.amount_due,
      payment_mode: input.paymentMode,
      payment_date: input.paymentDate,
      notes: input.notes || null,
      status: "paid",
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.paymentId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return payment;
}

export async function getGroupMembers(chitGroupId: string) {
  const supabase = await createClient();
  return supabase
    .from("members")
    .select(`
      *,
      payments (
        *,
        payment_cycles (*)
      )
    `)
    .eq("chit_group_id", chitGroupId)
    .order("created_at", { ascending: true });
}

export async function getOrganiserMembers(organiserId: string) {
  const supabase = await createClient();
  return supabase
    .from("members")
    .select(`
      *,
      chit_groups!inner (
        id,
        name,
        organiser_id
      )
    `)
    .eq("chit_groups.organiser_id", organiserId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
}

export async function getMemberByToken(token: string) {
  const supabase = await createClient();
  return supabase
    .from("members")
    .select(`
      *,
      chit_groups (
        *,
        profiles (*)
      ),
      payments (
        *,
        payment_cycles (*)
      )
    `)
    .eq("invite_token", token)
    .single();
}

export async function getPaymentCycles(chitGroupId: string) {
  const supabase = await createClient();
  return supabase
    .from("payment_cycles")
    .select(`
      *,
      payments (*),
      auctions (*)
    `)
    .eq("chit_group_id", chitGroupId)
    .order("cycle_number", { ascending: true });
}

export async function getAuctionWorkspace(chitGroupId: string, organiserId: string) {
  const supabase = await createClient();
  const { data: detail, error } = await getDashboardChitGroupDetail(chitGroupId, organiserId);

  if (error || !detail?.group) {
    return { data: null, error };
  }

  const currentCycle =
    detail.paymentCycles.find((cycle: any) => cycle.status !== "completed") ??
    detail.paymentCycles[0] ??
    null;

  const auction =
    currentCycle?.id
      ? await supabase.from("auctions").select("*").eq("cycle_id", currentCycle.id).maybeSingle()
      : { data: null, error: null };

  return {
    data: {
      ...detail,
      currentCycle,
      auction: auction.data,
    },
    error: null,
  };
}

export async function finalizeAuctionForCycle(input: {
  organiserId: string;
  chitGroupId: string;
  cycleId: string;
  winnerId: string;
  winningDiscount: number;
}) {
  const supabase = await createClient();
  const detail = await getAuctionWorkspace(input.chitGroupId, input.organiserId);

  if (!detail.data?.group || !detail.data.currentCycle) {
    throw new Error("Auction cycle not found.");
  }

  const group = detail.data.group as any;
  const members = (detail.data.members as any[]).filter((member) => member.is_active !== false);
  const currentCycle = detail.data.currentCycle as any;
  const potValue = Number(group.monthly_amount ?? 0) * Number(group.member_count ?? 0);
  const memberCount = Math.max(members.length, 1);
  const dividendPerMember =
    memberCount > 1 ? input.winningDiscount / Math.max(memberCount - 1, 1) : 0;
  const foremanCommission = (input.winningDiscount * Number(group.commission_pct ?? 0)) / 100;
  const winnerPayout = potValue - input.winningDiscount;

  const { error: auctionError } = await supabase.from("auctions").insert({
    cycle_id: input.cycleId,
    bids: [],
    winner_id: input.winnerId,
    winning_discount: input.winningDiscount,
    winner_payout: winnerPayout,
    foreman_commission: foremanCommission,
    dividend_distributed: dividendPerMember,
  });

  if (auctionError) {
    throw new Error(auctionError.message);
  }

  const { error: cycleError } = await supabase
    .from("payment_cycles")
    .update({
      auction_winner_id: input.winnerId,
      discount_amount: input.winningDiscount,
      dividend_per_member: dividendPerMember,
      foreman_commission: foremanCommission,
      status: "completed",
    })
    .eq("id", input.cycleId);

  if (cycleError) {
    throw new Error(cycleError.message);
  }

  const { error: memberError } = await supabase
    .from("members")
    .update({
      pot_taken: true,
      pot_month: currentCycle.cycle_number,
    })
    .eq("id", input.winnerId);

  if (memberError) {
    throw new Error(memberError.message);
  }

  const nextCycleNumber = Number(currentCycle.cycle_number ?? 1) + 1;

  if (nextCycleNumber <= Number(group.duration_months ?? nextCycleNumber)) {
    const nextDueDate = addMonths(new Date(currentCycle.due_date), 1)
      .toISOString()
      .slice(0, 10);
    const { data: nextCycle, error: nextCycleError } = await supabase
      .from("payment_cycles")
      .insert({
        chit_group_id: input.chitGroupId,
        cycle_number: nextCycleNumber,
        due_date: nextDueDate,
        status: "pending",
      })
      .select("*")
      .single();

    if (nextCycleError) {
      throw new Error(nextCycleError.message);
    }

    const paymentRows = members.map((member: any) => ({
      cycle_id: nextCycle.id,
      member_id: member.id,
      amount_due: Number(group.monthly_amount ?? 0),
      amount_paid: 0,
      status: "unpaid",
    }));

    const { error: paymentsError } = await supabase.from("payments").insert(paymentRows);

    if (paymentsError) {
      throw new Error(paymentsError.message);
    }
  }

  return {
    winnerPayout,
    dividendPerMember,
    foremanCommission,
  };
}

export async function getStatementData(chitGroupId: string, memberId: string, organiserId: string) {
  const supabase = await createClient();
  const detail = await getDashboardChitGroupDetail(chitGroupId, organiserId);

  if (!detail.data?.group) {
    return { data: null, error: detail.error };
  }

  const member = (detail.data.members as any[]).find((entry) => entry.id === memberId);

  if (!member) {
    return { data: null, error: new Error("Member not found.") };
  }

  return {
    data: {
      group: detail.data.group,
      member,
      payments: member.payments ?? [],
    },
    error: null,
  };
}

export async function getReportsData(organiserId: string) {
  const supabase = await createClient();
  const { data: groups } = await getChitGroups(organiserId);
  const activeGroups = groups ?? [];
  const groupIds = activeGroups.map((group: any) => group.id);

  if (groupIds.length === 0) {
    return {
      groups: [],
      cycles: [],
      payments: [],
      members: [],
      auctions: [],
    };
  }

  const [{ data: cycles }, { data: members }] = await Promise.all([
    supabase
      .from("payment_cycles")
      .select("*")
      .in("chit_group_id", groupIds)
      .order("cycle_number", { ascending: true }),
    supabase
      .from("members")
      .select("*")
      .in("chit_group_id", groupIds)
      .eq("is_active", true),
  ]);

  const cycleIds = (cycles ?? []).map((cycle) => cycle.id);
  const [{ data: payments }, { data: auctions }] = await Promise.all([
    cycleIds.length > 0
      ? supabase
          .from("payments")
          .select(`
            *,
            members (
              id,
              name,
              chit_group_id
            ),
            payment_cycles (
              id,
              cycle_number,
              due_date,
              chit_group_id
            )
          `)
          .in("cycle_id", cycleIds)
      : Promise.resolve({ data: [] as any[] }),
    cycleIds.length > 0
      ? supabase
          .from("auctions")
          .select("*")
          .in("cycle_id", cycleIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  return {
    groups: activeGroups,
    cycles: cycles ?? [],
    payments: payments ?? [],
    members: members ?? [],
    auctions: auctions ?? [],
  };
}
