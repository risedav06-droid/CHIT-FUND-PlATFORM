import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";

import { EmptyState } from "@/components/ui/empty-state";
import { PaymentLedgerItem } from "@/components/ui/payment-ledger-item";
import { PotTracker } from "@/components/ui/pot-tracker";
import { StatementButton } from "@/components/ui/statement-button";
import { StatusChip } from "@/components/ui/status-chip";
import { formatDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
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
    <main className="min-h-screen bg-[var(--color-background)] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header id="home" className="flex items-center justify-between">
          <p className="font-display text-[1.6rem] italic text-[var(--color-primary)]">
            ChitMate
          </p>
          <p className="hidden text-sm text-[var(--color-text-body)] md:block">
            Hi, {member.name.split(" ")[0]} 👋
          </p>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.35fr_0.65fr]">
          <aside className="space-y-6">
            <section className="md:hidden">
              <h1 className="text-[1.875rem]">Hi, {member.name.split(" ")[0]} 👋</h1>
              <p className="mt-2 text-sm text-[var(--color-text-body)]">
                Your {group?.name ?? "chit"} dashboard is updated.
              </p>
            </section>

            <section className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between gap-4">
                <span className="ledger-chip bg-[rgba(212,168,67,0.18)] text-[var(--color-amber-text)]">
                  Active Group
                </span>
                <span className="text-sm text-[var(--color-text-body)]">
                  Month {currentCycleNumber}/{totalCycles}
                </span>
              </div>
              <h1 className="mt-5 hidden text-[1.875rem] md:block">
                Hi, {member.name.split(" ")[0]} 👋
              </h1>
              <p className="mt-2 hidden text-sm text-[var(--color-text-body)] md:block">
                Your {group?.name ?? "chit"} dashboard
              </p>
              <h2 className="mt-6">{group?.name ?? "Your chit"}</h2>
              <p className="editorial-label mt-6 !text-[var(--color-text-muted)]">Amount Due</p>
              <p className="mt-2 font-display text-[2.3rem] text-[var(--color-text-primary)]">
                {formatCurrency(Number(monthlyContribution))}
              </p>
              <div className="mt-4">
                <StatusChip
                  status={
                    currentPayment?.status === "paid"
                      ? "paid"
                      : currentPayment?.status === "partial"
                        ? "partial"
                        : "unpaid"
                  }
                >
                  {currentPayment?.status === "paid"
                    ? "Paid"
                    : currentPayment?.status === "partial"
                      ? "Partial"
                      : "Unpaid"}
                </StatusChip>
              </div>
            </section>

            <section id="group" className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
              <p className="editorial-label !text-[var(--color-text-muted)]">Organiser</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-container)] text-sm font-semibold text-white">
                  {initials(organiserProfile?.phone || "CM")}
                </div>
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">
                    {organiserProfile?.phone || "Your organiser"}
                  </p>
                  <p className="text-sm text-[var(--color-text-body)]">Group organiser</p>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <a href={whatsappHref} target="_blank" rel="noreferrer" className="whatsapp-button w-full">
                  Chat on WhatsApp
                </a>
                <StatementButton />
              </div>
            </section>
          </aside>

          <section className="space-y-6 pb-24 md:pb-0">
            <section className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2>Pot Participants</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-body)]">
                    {trackerMembers.length} Members • Scroll for details
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <PotTracker members={trackerMembers} />
              </div>
            </section>

            <section id="payments" className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
              <h2>Payment Ledger</h2>
              {payments.length === 0 ? (
                <div className="mt-6">
                  <EmptyState
                    title="No payments recorded yet"
                    subtitle="Your payment history will appear here once your organiser records your first payment."
                  />
                </div>
              ) : (
                <>
                  <div className="mt-6 space-y-4">
                    {payments.map((payment: any, index: number) => (
                      <PaymentLedgerItem
                        key={payment.id}
                        month={`Month ${payment.payment_cycles?.cycle_number ?? index + 1}`}
                        date={
                          payment.payment_date
                            ? formatDate(payment.payment_date)
                            : payment.payment_cycles?.due_date
                              ? format(new Date(payment.payment_cycles.due_date), "do MMM yyyy")
                              : "Awaiting collection"
                        }
                        mode={payment.payment_mode ?? "Mode pending"}
                        amount={formatCurrency(Number(payment.amount_paid || payment.amount_due || 0))}
                        status={(payment.status as any) ?? "unpaid"}
                        current={index === 0}
                      />
                    ))}
                  </div>
                  <p className="mt-5 text-sm italic text-[var(--color-text-muted)]">
                    Showing last {Math.min(payments.length, 3)} of {payments.length} months. Tap to expand history.
                  </p>
                </>
              )}
            </section>
          </section>
        </div>

        <nav className="glass-shell fixed inset-x-3 bottom-3 z-30 rounded-[calc(var(--radius-card)+6px)] px-3 py-3 shadow-[var(--shadow-float)] md:hidden">
          <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-medium tracking-[0.08em] text-[var(--color-text-body)]">
            <a href="#home" className="rounded-[var(--radius-button)] bg-white/90 px-2 py-3 text-[var(--color-primary)]">
              HOME
            </a>
            <a href="#payments" className="rounded-[var(--radius-button)] px-2 py-3">
              PAYMENTS
            </a>
            <a href="#group" className="rounded-[var(--radius-button)] px-2 py-3">
              GROUP
            </a>
            <a href="#home" className="rounded-[var(--radius-button)] px-2 py-3">
              STATEMENT
            </a>
          </div>
        </nav>
      </div>
    </main>
  );
}
