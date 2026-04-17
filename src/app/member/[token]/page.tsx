import { notFound } from "next/navigation";
import { MemberPortalClient } from "@/components/member/member-portal-client";
import { formatDate } from "@/lib/dates";
import { buildReminderMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import { getGroupMembers, getMemberByToken } from "@/utils/supabase/db";

type MemberPortalPageProps = {
  params: Promise<{
    token: string;
  }>;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function MemberPortalPage({ params }: MemberPortalPageProps) {
  const { token } = await params;
  const { data: member } = await getMemberByToken(token);

  if (!member) {
    notFound();
  }

  const group = Array.isArray(member.chit_groups) ? member.chit_groups[0] : member.chit_groups;
  const organiserProfile = Array.isArray(group?.profiles) ? group.profiles[0] : group?.profiles;
  const { data: groupMembers } = group?.id ? await getGroupMembers(group.id) : { data: [] };
  const payments = [...(member.payments ?? [])].sort(
    (a, b) =>
      Number(b.payment_cycles?.cycle_number ?? 0) - Number(a.payment_cycles?.cycle_number ?? 0),
  );
  const currentPayment =
    payments.find((payment: any) => payment.status !== "paid") ?? payments[0] ?? null;
  const monthlyContribution = currentPayment?.amount_due ?? group?.monthly_amount ?? 0;
  const currentCycleNumber = Number(currentPayment?.payment_cycles?.cycle_number ?? 1);
  const totalCycles = Number(group?.duration_months ?? Math.max(payments.length, 1));
  const whatsappHref = buildWhatsAppLink(
    organiserProfile?.phone || member.whatsapp_phone || member.phone,
    buildReminderMessage(
      member.name.split(" ")[0] || member.name,
      group?.name ?? "your chit",
      Number(monthlyContribution),
      currentPayment?.payment_cycles?.due_date
        ? formatDate(currentPayment.payment_cycles.due_date)
        : "This month",
    ),
  );
  const trackerMembers = ((groupMembers ?? []) as any[]).map((groupMember) => ({
    name: groupMember.id === member.id ? "You" : groupMember.name.split(" ")[0],
    initials: initials(groupMember.name),
    status: (groupMember.id === member.id
      ? "you"
      : groupMember.pot_taken
        ? "taken"
        : "waiting") as "taken" | "waiting" | "you",
  }));

  return (
    <MemberPortalClient
      member={member}
      group={group}
      organiserPhone={organiserProfile?.phone || member.whatsapp_phone || member.phone}
      payments={payments}
      currentPayment={currentPayment}
      currentCycleNumber={currentCycleNumber}
      totalCycles={totalCycles}
      monthlyContribution={monthlyContribution}
      whatsappHref={whatsappHref}
      trackerMembers={trackerMembers}
    />
  );
}
