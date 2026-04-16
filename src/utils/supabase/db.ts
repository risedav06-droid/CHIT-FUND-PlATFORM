import { addMonths, differenceInCalendarDays, format, startOfMonth, subMonths } from "date-fns";

import { isValidIndianPhone, normalizePhone } from "@/lib/phone";
import { formatCurrency } from "@/lib/utils";

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

function monthKeyFor(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return format(date, "yyyy-MM");
}

function monthLabelFor(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return format(date, "MMM");
}

export async function getOrganiserDashboardInsights(organiserId: string) {
  const supabase = await createClient();
  const { data: groups } = await getChitGroups(organiserId);
  const activeGroups = groups ?? [];
  const groupIds = activeGroups.map((group: any) => group.id);
  const monthBuckets = Array.from({ length: 6 }, (_, index) => {
    const date = subMonths(startOfMonth(new Date()), 5 - index);
    return {
      key: monthKeyFor(date),
      label: monthLabelFor(date),
    };
  });

  if (groupIds.length === 0) {
    return {
      subtitle: `${format(new Date(), "MMMM yyyy")} · 0 active chits · Collection cycle in progress`,
      statSummary: {
        activeChits: 0,
        totalMembers: 0,
        commissionEarned: 0,
        pendingPayments: 0,
      },
      monthlyCollection: monthBuckets.map((bucket) => ({
        ...bucket,
        percent: 0,
        paidCount: 0,
        totalCount: 0,
      })),
      paymentStatus: {
        paidCount: 0,
        unpaidCount: 0,
        paidPercent: 0,
        collectedAmount: 0,
        outstandingAmount: 0,
      },
      groupCards: [],
      quickActions: {
        bulkReminderMessage: "",
      },
      rightPanel: {
        activity: [],
        collectionRate: 0,
        daysToNextAuction: null,
        membersPaid: 0,
        totalMembers: 0,
        remindersSent: 0,
        commissionHistory: monthBuckets.map((bucket) => ({
          ...bucket,
          amount: 0,
        })),
        commissionThisCycle: 0,
      },
    };
  }

  const [{ data: members }, { data: cycles }] = await Promise.all([
    supabase
      .from("members")
      .select("id, name, phone, invite_token, chit_group_id, is_active, created_at, pot_taken")
      .in("chit_group_id", groupIds)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("payment_cycles")
      .select("id, chit_group_id, cycle_number, due_date, status, created_at")
      .in("chit_group_id", groupIds)
      .order("cycle_number", { ascending: true }),
  ]);

  const cycleIds = (cycles ?? []).map((cycle: any) => cycle.id);
  const payments = cycleIds.length
    ? (
        await supabase
          .from("payments")
          .select("id, cycle_id, member_id, amount_due, amount_paid, status, payment_date, updated_at, created_at")
          .in("cycle_id", cycleIds)
      ).data ?? []
    : [];
  const auctions = cycleIds.length
    ? (
        await supabase
          .from("auctions")
          .select("id, cycle_id, foreman_commission, created_at, winner_id")
          .in("cycle_id", cycleIds)
      ).data ?? []
    : [];

  const groupsById = new Map(activeGroups.map((group: any) => [group.id, group]));
  const membersByGroup = new Map<string, any[]>();
  const cyclesByGroup = new Map<string, any[]>();
  const paymentsByCycle = new Map<string, any[]>();
  const cycleById = new Map<string, any>();

  for (const member of members ?? []) {
    const collection = membersByGroup.get(member.chit_group_id) ?? [];
    collection.push(member);
    membersByGroup.set(member.chit_group_id, collection);
  }

  for (const cycle of cycles ?? []) {
    const collection = cyclesByGroup.get(cycle.chit_group_id) ?? [];
    collection.push(cycle);
    cyclesByGroup.set(cycle.chit_group_id, collection);
    cycleById.set(cycle.id, cycle);
  }

  for (const payment of payments) {
    const collection = paymentsByCycle.get(payment.cycle_id) ?? [];
    collection.push(payment);
    paymentsByCycle.set(payment.cycle_id, collection);
  }

  const currentCycles = activeGroups
    .map((group: any) => {
      const groupCycles = cyclesByGroup.get(group.id) ?? [];
      return (
        groupCycles.find((cycle: any) => cycle.status !== "completed") ??
        groupCycles[groupCycles.length - 1] ??
        null
      );
    })
    .filter(Boolean) as any[];

  const currentCycleIds = new Set(currentCycles.map((cycle) => cycle.id));
  const currentCyclePayments = payments.filter((payment: any) => currentCycleIds.has(payment.cycle_id));
  const paidPayments = currentCyclePayments.filter((payment: any) => payment.status === "paid");
  const unpaidPayments = currentCyclePayments.filter((payment: any) => payment.status !== "paid");
  const totalMembers = (members ?? []).length;
  const collectedAmount = paidPayments.reduce(
    (sum: number, payment: any) => sum + Number(payment.amount_paid ?? payment.amount_due ?? 0),
    0,
  );
  const outstandingAmount = unpaidPayments.reduce(
    (sum: number, payment: any) => sum + Math.max(Number(payment.amount_due ?? 0) - Number(payment.amount_paid ?? 0), 0),
    0,
  );
  const paidPercent =
    currentCyclePayments.length > 0
      ? Math.round((paidPayments.length / currentCyclePayments.length) * 100)
      : 0;

  const subtitle = `${format(new Date(), "MMMM yyyy")} · ${activeGroups.length} active chits · ${
    currentCyclePayments.length > 0 ? "Collection cycle in progress" : "Ready to launch collections"
  }`;

  const monthlyCollection = monthBuckets.map((bucket) => {
    const cycleIdsForMonth = (cycles ?? [])
      .filter((cycle: any) => cycle.due_date && monthKeyFor(cycle.due_date) === bucket.key)
      .map((cycle: any) => cycle.id);
    const monthPayments = payments.filter((payment: any) => cycleIdsForMonth.includes(payment.cycle_id));
    const monthPaidCount = monthPayments.filter((payment: any) => payment.status === "paid").length;
    const monthTotal = monthPayments.length;

    return {
      ...bucket,
      percent: monthTotal > 0 ? Math.round((monthPaidCount / monthTotal) * 100) : 0,
      paidCount: monthPaidCount,
      totalCount: monthTotal,
    };
  });

  const commissionHistory = monthBuckets.map((bucket) => {
    const amount = auctions
      .filter((auction: any) => auction.created_at && monthKeyFor(auction.created_at) === bucket.key)
      .reduce((sum: number, auction: any) => sum + Number(auction.foreman_commission ?? 0), 0);

    return {
      ...bucket,
      amount,
    };
  });

  const currentMonthKey = monthKeyFor(new Date());
  const commissionThisCycle = auctions
    .filter((auction: any) => {
      const cycle = cycleById.get(auction.cycle_id);
      return cycle?.due_date && monthKeyFor(cycle.due_date) === currentMonthKey;
    })
    .reduce((sum: number, auction: any) => sum + Number(auction.foreman_commission ?? 0), 0);

  const groupCards = activeGroups.map((group: any, index: number) => {
    const groupMembers = membersByGroup.get(group.id) ?? [];
    const currentCycle =
      currentCycles.find((cycle: any) => cycle.chit_group_id === group.id) ?? null;
    const groupPayments = currentCycle ? paymentsByCycle.get(currentCycle.id) ?? [] : [];
    const paidCount = groupPayments.filter((payment: any) => payment.status === "paid").length;
    const totalCount = groupPayments.length || groupMembers.length || Number(group.member_count ?? 0);
    const outstanding = groupPayments.reduce(
      (sum: number, payment: any) =>
        sum + Math.max(Number(payment.amount_due ?? 0) - Number(payment.amount_paid ?? 0), 0),
      0,
    );

    return {
      id: group.id,
      name: group.name,
      memberCount: Number(group.member_count ?? totalCount ?? 0),
      currentCycle: Number(currentCycle?.cycle_number ?? 1),
      totalCycles: Number(group.duration_months ?? 12),
      paidCount,
      totalMembers: totalCount,
      nextAuction: currentCycle?.due_date
        ? format(new Date(currentCycle.due_date), "d MMM")
        : "Schedule pending",
      outstanding,
      badge: index % 2 === 0 ? "HIGH YIELD" : "STANDARD",
      reminderMessage: groupPayments.filter((payment: any) => payment.status !== "paid").length
        ? `Dear members of *${group.name}* 🙏\n\nThis is a friendly reminder that your contribution of *₹${Number(group.monthly_amount ?? 0).toLocaleString("en-IN")}* is pending${currentCycle?.due_date ? ` for *${format(new Date(currentCycle.due_date), "d MMMM")}*` : ""}.\n\nPending members:\n${groupPayments
            .filter((payment: any) => payment.status !== "paid")
            .map((payment: any) => {
              const member = (groupMembers as any[]).find((entry) => entry.id === payment.member_id);
              return `• ${member?.name ?? "Member"}`;
            })
            .join("\n")}\n\n_Managed via ChitMate_`
        : "",
    };
  });

  const pendingMembersForReminder = unpaidPayments
    .map((payment: any) => {
      const cycle = cycleById.get(payment.cycle_id);
      const member = (members ?? []).find((entry: any) => entry.id === payment.member_id);
      const group = cycle ? groupsById.get(cycle.chit_group_id) : null;
      return { payment, cycle, member, group };
    })
    .filter((entry) => entry.member && entry.group);

  const bulkReminderMessage = pendingMembersForReminder.length
    ? `Dear members 🙏\n\nThis is a friendly reminder that your ChitMate contributions are pending.\n\n${pendingMembersForReminder
        .map((entry) => {
          const dueDate = entry.cycle?.due_date
            ? format(new Date(entry.cycle.due_date), "d MMMM")
            : "the current cycle";
          return `• ${entry.member?.name ?? "Member"} — ${entry.group?.name ?? "Chit"} — ₹${Number(entry.payment.amount_due ?? 0).toLocaleString("en-IN")} due by ${dueDate}`;
        })
        .join("\n")}\n\nPlease pay at your earliest convenience.\n\n_Managed via ChitMate_`
    : "";

  const overduePendingCycles = new Map<string, number>();
  for (const payment of payments) {
    if (payment.status === "paid") continue;
    const cycle = cycleById.get(payment.cycle_id);
    if (!cycle?.due_date) continue;
    if (new Date(cycle.due_date) > new Date()) continue;
    overduePendingCycles.set(
      payment.member_id,
      (overduePendingCycles.get(payment.member_id) ?? 0) + 1,
    );
  }

  const daysToNextAuction = currentCycles.length
    ? Math.max(
        Math.min(
          ...currentCycles
            .filter((cycle: any) => cycle.due_date)
            .map((cycle: any) => differenceInCalendarDays(new Date(cycle.due_date), new Date())),
        ),
        0,
      )
    : null;

  const activity = [
    ...(members ?? [])
      .slice(0, 2)
      .map((member: any) => ({
        type: "new_member" as const,
        title: `${member.name} joined a chit`,
        subtitle: groupsById.get(member.chit_group_id)?.name ?? "Member added",
        time: member.created_at ? format(new Date(member.created_at), "d MMM, h:mm a") : "Recently",
        sortDate: member.created_at ?? new Date().toISOString(),
      })),
    ...paidPayments
      .slice(0, 2)
      .map((payment: any) => {
        const member = (members ?? []).find((entry: any) => entry.id === payment.member_id);
        const cycle = cycleById.get(payment.cycle_id);
        const group = cycle ? groupsById.get(cycle.chit_group_id) : null;
        return {
          type: "payment" as const,
          title: `${member?.name ?? "Member"} paid ${formatCurrency(payment.amount_paid ?? payment.amount_due ?? 0)}`,
          subtitle: group?.name ?? "Current cycle",
          time: payment.payment_date
            ? format(new Date(payment.payment_date), "d MMM, h:mm a")
            : "Recently",
          sortDate: payment.payment_date ?? payment.updated_at ?? payment.created_at ?? new Date().toISOString(),
        };
      }),
    ...auctions.slice(0, 1).map((auction: any) => {
      const cycle = cycleById.get(auction.cycle_id);
      const group = cycle ? groupsById.get(cycle.chit_group_id) : null;
      return {
        type: "auction" as const,
        title: `${group?.name ?? "Chit"} auction completed`,
        subtitle: `Commission ${formatCurrency(auction.foreman_commission ?? 0)}`,
        time: auction.created_at ? format(new Date(auction.created_at), "d MMM, h:mm a") : "Recently",
        sortDate: auction.created_at ?? new Date().toISOString(),
      };
    }),
  ]
    .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())
    .slice(0, 5);

  return {
    subtitle,
    statSummary: {
      activeChits: activeGroups.length,
      totalMembers,
      commissionEarned: commissionThisCycle,
      pendingPayments: unpaidPayments.length,
    },
    monthlyCollection,
    paymentStatus: {
      paidCount: paidPayments.length,
      unpaidCount: unpaidPayments.length,
      paidPercent,
      collectedAmount,
      outstandingAmount,
    },
    groupCards,
    quickActions: {
      bulkReminderMessage,
    },
    rightPanel: {
      activity,
      collectionRate: paidPercent,
      daysToNextAuction,
      membersPaid: paidPayments.length,
      totalMembers: currentCyclePayments.length || totalMembers,
      remindersSent: 0,
      commissionHistory,
      commissionThisCycle,
      defaulters: Array.from(overduePendingCycles.values()).filter((count) => count >= 2).length,
    },
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
  const normalizedPhone = normalizePhone(input.phone);
  const normalizedWhatsappPhone = input.whatsappPhone
    ? normalizePhone(input.whatsappPhone)
    : normalizedPhone;

  if (!isValidIndianPhone(input.phone)) {
    throw new Error("Enter a valid Indian phone number.");
  }

  if (input.whatsappPhone && !isValidIndianPhone(input.whatsappPhone)) {
    throw new Error("Enter a valid WhatsApp number or leave it blank.");
  }

  const [{ data: group }, { data: paymentCycles }, { count }] = await Promise.all([
    supabase
      .from("chit_groups")
      .select("monthly_amount, member_count")
      .eq("id", input.chitGroupId)
      .single(),
    supabase
      .from("payment_cycles")
      .select("*")
      .eq("chit_group_id", input.chitGroupId)
      .order("cycle_number", { ascending: true }),
    supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("chit_group_id", input.chitGroupId),
  ]);

  if (count !== null && group && count >= Number(group.member_count ?? 0)) {
    throw new Error(
      `This chit is full. You set a limit of ${Number(group.member_count ?? 0)} members when creating this chit.`,
    );
  }

  const { data: member, error: memberError } = await supabase
    .from("members")
    .insert({
      chit_group_id: input.chitGroupId,
      name: input.name,
      phone: normalizedPhone,
      whatsapp_phone: normalizedWhatsappPhone || normalizedPhone,
    })
    .select("*")
    .single();

  if (memberError || !member) {
    throw new Error(memberError?.message ?? "Unable to add member.");
  }

  const currentCycle =
    (paymentCycles ?? []).find((cycle: any) => cycle.status !== "completed") ??
    (paymentCycles ?? [])[0];

  if (currentCycle) {
    const { data: payment, error: paymentsError } = await supabase.from("payments").insert({
      cycle_id: currentCycle.id,
      member_id: member.id,
      amount_due: group?.monthly_amount ?? 0,
      amount_paid: 0,
      status: "unpaid",
    }).select("*").single();

    if (paymentsError) {
      throw new Error(paymentsError.message);
    }

    return {
      ...member,
      payments: payment ? [payment] : [],
    };
  }

  return {
    ...member,
    payments: [],
  };
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

export async function getDashboardMemberDetail(
  chitGroupId: string,
  memberId: string,
  organiserId: string,
) {
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
      paymentCycles: detail.data.paymentCycles,
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
