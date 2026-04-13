export const revalidate = 10;

import Link from "next/link";
import { notFound } from "next/navigation";
import { differenceInCalendarDays, format } from "date-fns";

import { addMemberToDashboardChitGroupAction } from "@/app/(platform)/dashboard/chit-groups/actions";
import { ChitGroupMembersPanel } from "@/components/dashboard/chit-group-members-panel";
import { Input } from "@/components/ui/input";
import { StatusChip } from "@/components/ui/status-chip";
import { authService } from "@/modules/auth/auth.service";
import { formatCurrency } from "@/lib/utils";
import { getDashboardChitGroupDetail } from "@/utils/supabase/db";

type ChitGroupDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DashboardChitGroupDetailPage({
  params,
}: ChitGroupDetailPageProps) {
  const session = await authService.requireAuthenticatedSession("/dashboard");
  const { id } = await params;
  const { data } = await getDashboardChitGroupDetail(id, session.user.id);

  if (!data?.group) {
    notFound();
  }

  const group = data.group as any;
  const paymentCycles = (data.paymentCycles as any[]) ?? [];
  const members = ((data.members as any[]) ?? []).map((member) => {
    const payments = [...(member.payments ?? [])].sort(
      (a, b) => Number(a.payment_cycles?.cycle_number ?? 0) - Number(b.payment_cycles?.cycle_number ?? 0),
    );
    return { ...member, payments };
  });
  const currentCycle =
    paymentCycles.find((cycle) => cycle.status !== "completed") ?? paymentCycles[0] ?? null;
  const currentCycleNumber = Number(currentCycle?.cycle_number ?? 1);
  const monthLabel = currentCycle?.due_date
    ? format(new Date(currentCycle.due_date), "MMMM").toUpperCase()
    : "CURRENT CYCLE";
  const monthlyAmount = Number(group.monthly_amount ?? 0);
  const potValue = monthlyAmount * Number(group.member_count ?? 0);
  const currentMemberRows = members.map((member) => {
    const currentPayment =
      member.payments.find(
        (payment: any) => Number(payment.payment_cycles?.cycle_number ?? 0) === currentCycleNumber,
      ) ?? member.payments[0];

    return {
      member,
      currentPayment,
    };
  });
  const nextAuctionDate = currentCycle?.due_date
    ? format(new Date(currentCycle.due_date), "do MMMM yyyy")
    : "Schedule pending";
  const daysUntilDue = currentCycle?.due_date
    ? differenceInCalendarDays(new Date(currentCycle.due_date), new Date())
    : null;
  const defaulterCount = members.filter((member) => {
    const unpaidCycles = (member.payments ?? []).filter(
      (payment: any) => payment.status !== "paid",
    ).length;

    return unpaidCycles >= 2;
  }).length;

  return (
    <div className="space-y-6">
      <section className="rounded-[var(--radius-card)] bg-white px-8 py-8 shadow-[var(--shadow-card)]">
        <Link href="/dashboard/chit-groups" className="editorial-label">
          ← Back to chit groups
        </Link>
        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[1.875rem]">{group.name}</h1>
              <StatusChip status="active">Active</StatusChip>
            </div>
            <p className="editorial-label mt-4">{monthLabel} Cycle</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["Duration", `${group.duration_months} Months`],
            ["Monthly Deposit", formatCurrency(monthlyAmount)],
            ["Pot Value", formatCurrency(potValue)],
            ["Commission", `${group.commission_pct}%`],
          ].map(([label, value], index) => (
            <div
              key={label}
              className="min-w-0 rounded-[var(--radius-card)] bg-[var(--color-surface-low)] px-5 py-5"
              style={index === 3 ? { boxShadow: "inset 4px 0 0 rgba(212,168,67,0.9)" } : undefined}
            >
              <p className="editorial-label !text-[var(--color-text-muted)]">{label}</p>
              <p className="mt-3 truncate font-display text-[1.5rem] text-[var(--color-text-primary)]">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-8 overflow-x-auto text-sm">
          <span className="border-b-2 border-[var(--color-primary-container)] pb-3 font-display text-[var(--color-text-primary)]">
            Members
          </span>
          <span className="pb-3 text-[var(--color-text-muted)]">Payments</span>
          <Link href={`/dashboard/chit-groups/${group.id}/auction`} className="pb-3 text-[var(--color-text-muted)]">
            Auctions
          </Link>
          <Link
            href={`/dashboard/chit-groups/${group.id}/statement/${members[0]?.id ?? ""}`}
            className="pb-3 text-[var(--color-text-muted)]"
          >
            Statements
          </Link>
        </div>
      </section>

      <ChitGroupMembersPanel
        groupId={group.id}
        chitName={group.name}
        monthLabel={monthLabel}
        memberTargetCount={Number(group.member_count ?? 0)}
        monthlyAmount={monthlyAmount}
        nextAuctionDate={nextAuctionDate}
        daysUntilDue={daysUntilDue}
        defaulterCount={defaulterCount}
        addMemberForm={
          <form
            id="add-member-form"
            action={addMemberToDashboardChitGroupAction}
            className="rounded-[var(--radius-card)] bg-[var(--color-surface-low)] p-6 shadow-[var(--shadow-card)]"
          >
            <input type="hidden" name="chitGroupId" value={group.id} />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="editorial-label !text-[var(--color-text-muted)]">Add Member</p>
                <p className="mt-1 text-sm text-[var(--color-text-body)]">
                  Create the member record and generate their portal invite link.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <Input name="name" placeholder="Ravi Kumar" required />
              <Input name="phone" placeholder="9876543210" required />
              <Input name="whatsappPhone" placeholder="WhatsApp phone (optional)" />
            </div>
            <button type="submit" className="primary-button mt-5">
              Add Member
            </button>
          </form>
        }
        initialMembers={currentMemberRows.map(({ member, currentPayment }) => ({
          member: {
            id: member.id,
            name: member.name,
            phone: member.phone,
            whatsapp_phone: member.whatsapp_phone,
            invite_token: member.invite_token,
            pot_taken: Boolean(member.pot_taken),
          },
          currentPayment: currentPayment
            ? {
                id: currentPayment.id,
                amount_due: Number(currentPayment.amount_due ?? monthlyAmount),
                amount_paid: Number(currentPayment.amount_paid ?? 0),
                status: currentPayment.status ?? "unpaid",
              }
            : null,
        }))}
      />
    </div>
  );
}
