export const revalidate = 30;

import { EmptyState } from "@/components/ui/empty-state";
import { authService } from "@/modules/auth/auth.service";
import { formatCurrency } from "@/lib/utils";
import { getReportsData } from "@/utils/supabase/db";

export default async function DashboardReportsPage() {
  const session = await authService.requireAuthenticatedSession("/dashboard/reports");
  const { groups, cycles, payments, members, auctions } = await getReportsData(session.user.id);

  if (groups.length === 0) {
    return (
      <EmptyState
        title="No report data yet."
        subtitle="Create your first chit group and start recording collections to unlock reports."
      />
    );
  }

  const monthlySummary = cycles.map((cycle: any) => {
    const cyclePayments = payments.filter((payment: any) => payment.cycle_id === cycle.id);
    const totalDue = cyclePayments.reduce((sum: number, payment: any) => sum + Number(payment.amount_due ?? 0), 0);
    const totalCollected = cyclePayments.reduce((sum: number, payment: any) => sum + Number(payment.amount_paid ?? 0), 0);
    const outstanding = totalDue - totalCollected;
    return {
      cycle,
      totalDue,
      totalCollected,
      outstanding,
      collectionRate: totalDue > 0 ? (totalCollected / totalDue) * 100 : 0,
    };
  });

  const reliabilityRows = members.map((member: any) => {
    const memberPayments = payments.filter((payment: any) => payment.member_id === member.id);
    const onTime = memberPayments.filter(
      (payment: any) =>
        payment.status === "paid" &&
        payment.payment_date &&
        payment.payment_cycles?.due_date &&
        new Date(payment.payment_date) <= new Date(payment.payment_cycles.due_date),
    ).length;
    const late = memberPayments.filter(
      (payment: any) =>
        payment.status === "paid" &&
        payment.payment_date &&
        payment.payment_cycles?.due_date &&
        new Date(payment.payment_date) > new Date(payment.payment_cycles.due_date),
    ).length;
    const missed = memberPayments.filter((payment: any) => payment.status !== "paid").length;
    const total = memberPayments.length || 1;
    return {
      member,
      onTime,
      late,
      missed,
      score: Math.round(((onTime + late * 0.5) / total) * 100),
    };
  });

  return (
    <div className="space-y-6">
      <section className="rounded-[var(--radius-card)] bg-white px-8 py-8 shadow-[var(--shadow-card)]">
        <p className="editorial-label">Financial Reports</p>
        <h1 className="mt-3 text-[1.875rem]">Collection and reliability insights</h1>
      </section>

      <section className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
        <h2>Monthly Collection Summary</h2>
        <div className="mt-5 space-y-3">
          {monthlySummary.map((row) => (
            <div key={row.cycle.id} className="grid gap-3 rounded-[var(--radius-card)] bg-[var(--color-surface-low)] p-4 md:grid-cols-5">
              <p>Month {row.cycle.cycle_number}</p>
              <p>{formatCurrency(row.totalDue)}</p>
              <p>{formatCurrency(row.totalCollected)}</p>
              <p>{formatCurrency(row.outstanding)}</p>
              <p>{row.collectionRate.toFixed(0)}%</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
        <h2>Commission Tracker</h2>
        <div className="mt-5 space-y-3">
          {groups.map((group: any) => {
            const groupCycleIds = cycles
              .filter((cycle: any) => cycle.chit_group_id === group.id)
              .map((cycle: any) => cycle.id);
            const groupCommission = auctions
              .filter((auction: any) => groupCycleIds.includes(auction.cycle_id))
              .reduce((sum: number, auction: any) => sum + Number(auction.foreman_commission ?? 0), 0);

            return (
              <div key={group.id} className="flex items-center justify-between rounded-[var(--radius-card)] bg-[var(--color-surface-low)] px-4 py-4">
                <span>{group.name}</span>
                <span className="font-display text-[1.4rem] text-[var(--color-text-primary)]">
                  {formatCurrency(groupCommission)}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
        <h2>Member Payment Reliability</h2>
        <div className="mt-5 space-y-3">
          {reliabilityRows.map((row) => (
            <div key={row.member.id} className="grid gap-3 rounded-[var(--radius-card)] bg-[var(--color-surface-low)] p-4 md:grid-cols-5">
              <p>{row.member.name}</p>
              <p>{groups.find((group: any) => group.id === row.member.chit_group_id)?.name ?? "—"}</p>
              <p>{row.onTime} on-time</p>
              <p>{row.late} late</p>
              <p>{row.missed} missed • {row.score}%</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
