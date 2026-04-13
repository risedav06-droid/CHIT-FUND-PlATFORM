import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MemberRow } from "@/components/ui/member-row";
import { StatusChip } from "@/components/ui/status-chip";
import { authService } from "@/modules/auth/auth.service";
import { formatCurrency } from "@/lib/utils";
import { getChitGroupById } from "@/utils/supabase/db";

type ChitGroupDetailPageProps = {
  params: Promise<{
    id: string;
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

export default async function ChitGroupDetailPage({ params }: ChitGroupDetailPageProps) {
  const session = await authService.requireAuthenticatedSession("/chit-groups");
  const { id } = await params;
  const { data: group } = await getChitGroupById(id, session.user.id);

  if (!group) {
    notFound();
  }

  const members = group.members ?? [];
  const paymentCycles = group.payment_cycles ?? [];
  const latestCycle = paymentCycles.at(-1);

  return (
    <main className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <section className="rounded-[var(--radius-card)] bg-[linear-gradient(135deg,rgba(255,255,255,0.8),rgba(245,243,240,0.96))] p-7 shadow-[var(--shadow-card)]">
          <Link href={"/chit-groups" as Route} className="inline-flex items-center gap-2 text-sm text-[var(--color-primary-container)]">
            <span aria-hidden="true">←</span>
            Back
          </Link>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1>{group.name}</h1>
              <p className="editorial-label mt-3">
                {latestCycle ? `Cycle ${latestCycle.cycle_number}` : "Current Cycle"}
              </p>
            </div>
            <StatusChip status="active">Active</StatusChip>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-low)] p-4">
              <p className="editorial-label">Duration</p>
              <p className="mt-2 text-lg font-semibold text-[var(--color-text-primary)]">
                {group.duration_months} months
              </p>
            </div>
            <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] p-4">
              <p className="editorial-label">Monthly Deposit</p>
              <p className="mt-2 text-lg font-semibold text-[var(--color-text-primary)]">
                {formatCurrency(Number(group.monthly_amount))}
              </p>
            </div>
            <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-low)] p-4">
              <p className="editorial-label">Pot Value</p>
              <p className="mt-2 text-lg font-semibold text-[var(--color-text-primary)]">
                {formatCurrency(Number(group.monthly_amount) * Number(group.member_count))}
              </p>
            </div>
            <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] p-4 shadow-[inset_3px_0_0_var(--color-amber)]">
              <p className="editorial-label">Commission</p>
              <p className="mt-2 text-lg font-semibold text-[var(--color-text-primary)]">
                {Number(group.commission_pct)}%
              </p>
            </div>
          </div>
        </section>

        <div className="flex gap-6 border-b border-[rgba(0,0,0,0.04)] pb-3 text-sm">
          <span className="border-b-2 border-[var(--color-primary-container)] pb-3 font-medium text-[var(--color-primary)]">
            Members
          </span>
          <span className="pb-3 text-[var(--color-text-muted)]">Payments</span>
          <Link href={`/chit-groups/${group.id}/auction` as Route} className="pb-3 text-[var(--color-text-muted)]">
            Auctions
          </Link>
          <span className="pb-3 text-[var(--color-text-muted)]">Statements</span>
        </div>

        <section className="space-y-3">
          <div className="hidden grid-cols-[1.4fr_0.8fr_0.7fr_0.7fr_1fr] px-4 text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)] md:grid">
            <span>Name</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Pot Taken</span>
            <span className="text-right">Actions</span>
          </div>
          {members.map((member: any) => (
            <MemberRow
              key={member.id}
              name={member.name}
              phone={member.phone}
              initials={initials(member.name)}
              amount={formatCurrency(Number(group.monthly_amount))}
              status={"unpaid"}
              potTaken={Boolean(member.pot_taken)}
              actions={
                <Link href={`/member/${member.invite_token}` as Route} className="ghost-button">
                  View
                </Link>
              }
            />
          ))}
        </section>
      </div>

      <aside className="space-y-6">
        <section className="sticky top-6 rounded-[var(--radius-card)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
          <h2>Current Cycle Collection</h2>
          <div className="mt-5 flex items-center justify-between gap-4 text-sm text-[var(--color-text-body)]">
            <span>0 / {group.member_count} Members</span>
            <span>0%</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-[var(--color-surface-low)]" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div>
              <p className="editorial-label">Collected</p>
              <p data-display="true" className="mt-2 text-[2rem] text-[var(--color-success-text)]">
                {formatCurrency(0)}
              </p>
            </div>
            <div>
              <p className="editorial-label">Outstanding</p>
              <p data-display="true" className="mt-2 text-[2rem] text-[#dc2626]">
                {formatCurrency(Number(group.monthly_amount) * Number(group.member_count))}
              </p>
            </div>
          </div>
          <button type="button" className="primary-button mt-6 w-full">
            Send Bulk Reminders
          </button>
        </section>
      </aside>
    </main>
  );
}
