export const revalidate = 30;

import Link from "next/link";
import type { ReactNode } from "react";

import { DashboardPaymentStatusDonut } from "@/components/dashboard/dashboard-payment-status-donut";
import { DashboardQuickActions } from "@/components/dashboard/dashboard-quick-actions";
import { ActivityFeedItem } from "@/components/ui/activity-feed-item";
import { ChitGroupCard } from "@/components/ui/chit-group-card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { formatCurrency } from "@/lib/utils";
import { authService } from "@/modules/auth/auth.service";
import { getOrganiserDashboardInsights } from "@/utils/supabase/db";

function icon(path: ReactNode) {
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface-low)] text-[var(--color-primary)]">
      {path}
    </span>
  );
}

function barTone(percent: number) {
  if (percent >= 90) return "#1b4332";
  if (percent >= 70) return "#d4a843";
  return "#dc2626";
}

export default async function DashboardPage() {
  const session = await authService.requireAuthenticatedSession("/dashboard");
  const dashboard = await getOrganiserDashboardInsights(session.user.id);

  const commissionPeak = Math.max(
    ...dashboard.rightPanel.commissionHistory.map((entry) => entry.amount),
    1,
  );

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="rounded-[var(--radius-card)] bg-white px-8 py-8 shadow-[var(--shadow-card)]">
            <h1 className="text-[1.875rem]">
              Welcome back, {session.user.name?.split(" ")[0] ?? "Organiser"}
            </h1>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">{dashboard.subtitle}</p>
          </section>

          <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            <StatCard
              label="Active Chits"
              value={dashboard.statSummary.activeChits}
              hint="running this month"
              icon={icon(
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <rect x="3.5" y="4" width="13" height="4" rx="1.2" />
                  <rect x="3.5" y="12" width="13" height="4" rx="1.2" />
                </svg>,
              )}
            />
            <StatCard
              label="Total Members"
              value={dashboard.statSummary.totalMembers}
              hint="across all chits"
              icon={icon(
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M6.5 8.1a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z" />
                  <path d="M13.7 9.2a2.1 2.1 0 1 0 0-4.2 2.1 2.1 0 0 0 0 4.2Z" />
                  <path d="M2.8 16.3c.6-2 2.3-3.1 4.7-3.1 2.5 0 4.2 1.1 4.8 3.1" />
                  <path d="M12.2 15.8c.4-1.4 1.6-2.2 3.4-2.2 1 0 1.8.2 2.4.7" />
                </svg>,
              )}
            />
            <StatCard
              label="Commission Earned"
              value={formatCurrency(dashboard.statSummary.commissionEarned)}
              hint="this cycle"
              icon={icon(
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M10 3.5v13" />
                  <path d="M13 6.2c0-1.1-1.3-2-3-2s-3 .9-3 2 1.3 2 3 2 3 .9 3 2-1.3 2-3 2-3-.9-3-2" />
                </svg>,
              )}
            />
            <StatCard
              label="Payments Pending"
              value={dashboard.statSummary.pendingPayments}
              hint="needs follow-up"
              highlight={dashboard.statSummary.pendingPayments > 0}
              icon={icon(
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M10 4.2 16.2 15H3.8L10 4.2Z" />
                  <path d="M10 8v3.7" />
                  <path d="M10 13.8h.01" />
                </svg>,
              )}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <article className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2>Monthly Collection</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-body)]">
                    Last six months of collection-rate performance.
                  </p>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-6 items-end gap-3">
                {dashboard.monthlyCollection.map((month) => (
                  <div key={month.key} className="flex flex-col items-center gap-3">
                    <div className="flex h-44 w-full items-end justify-center rounded-[var(--radius-card)] bg-[var(--color-surface-low)] px-2 py-3">
                      <div
                        className="w-full rounded-t-[6px] transition-all"
                        style={{
                          height: `${Math.max(month.percent, month.totalCount > 0 ? 12 : 6)}%`,
                          background: barTone(month.percent),
                        }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{month.label}</p>
                      <p className="mt-1 text-[0.75rem] text-[var(--color-text-muted)]">{month.percent}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <DashboardPaymentStatusDonut
              paidPercent={dashboard.paymentStatus.paidPercent}
              collectedAmount={dashboard.paymentStatus.collectedAmount}
              outstandingAmount={dashboard.paymentStatus.outstandingAmount}
            />
          </section>

          <section id="chit-groups" className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2>Active Chit Groups</h2>
                <p className="mt-1 text-sm text-[var(--color-text-body)]">
                  Keep each collection cycle moving with progress at a glance.
                </p>
              </div>
              <Link href="/dashboard/chit-groups" className="ghost-button">
                View All Chits
              </Link>
            </div>

            {dashboard.groupCards.length === 0 ? (
              <EmptyState
                amberGlow
                eyebrow="A Quiet Start"
                title="No chits yet — create your first one and invite your group!"
                subtitle="You haven't created a chit yet. Start one and invite your group in minutes."
                actionLabel="Create Your First Chit"
                actionHref="/dashboard/chit-groups/new"
              />
            ) : (
              <div className="space-y-4">
                {dashboard.groupCards.map((group) => (
                  <ChitGroupCard
                    key={group.id}
                    name={group.name}
                    memberCount={group.memberCount}
                    currentCycle={group.currentCycle}
                    totalCycles={group.totalCycles}
                    paidCount={group.paidCount}
                    totalMembers={group.totalMembers}
                    nextAuction={group.nextAuction}
                    outstandingAmount={formatCurrency(group.outstanding)}
                    badge={group.badge as "HIGH YIELD" | "STANDARD"}
                    href={`/dashboard/chit-groups/${group.id}`}
                    reminderHref={
                      group.reminderMessage
                        ? `https://wa.me/?text=${encodeURIComponent(group.reminderMessage)}`
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </section>

          <DashboardQuickActions bulkReminderMessage={dashboard.quickActions.bulkReminderMessage} />
        </div>

        <aside className="space-y-6 xl:sticky xl:top-4 xl:self-start">
          <section className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-4">
              <h2>Recent Activity</h2>
              <span className="editorial-label !text-[var(--color-text-muted)]">
                {dashboard.rightPanel.activity.length} updates
              </span>
            </div>

            {dashboard.rightPanel.activity.length === 0 ? (
              <p className="mt-4 text-sm leading-7 text-[var(--color-text-body)]">
                No activity yet. Actions you take will appear here.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {dashboard.rightPanel.activity.map((item, index) => (
                  <ActivityFeedItem
                    key={`${item.title}-${index}`}
                    type={item.type}
                    title={item.title}
                    subtitle={item.subtitle}
                    time={item.time}
                  />
                ))}
              </div>
            )}
          </section>

          <section
            className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]"
            style={{ boxShadow: "inset 4px 0 0 #d4a843, 0 4px 24px rgba(27,28,26,0.06)" }}
          >
            <h2>This Month at a Glance</h2>
            <div className="mt-5 space-y-4 text-sm text-[var(--color-text-body)]">
              <div className="flex items-center justify-between gap-4">
                <span>Collection rate</span>
                <span className="font-medium text-[var(--color-text-primary)]">
                  {dashboard.rightPanel.collectionRate}%
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Days to next auction</span>
                <span className="font-medium text-[var(--color-text-primary)]">
                  {dashboard.rightPanel.daysToNextAuction ?? "—"} days
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Members paid</span>
                <span className="font-medium text-[var(--color-text-primary)]">
                  {dashboard.rightPanel.membersPaid} / {dashboard.rightPanel.totalMembers}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Reminders sent</span>
                <span className="font-medium text-[var(--color-text-primary)]">
                  {dashboard.rightPanel.remindersSent}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
            <h2>Commission Tracker</h2>
            <p className="mt-1 text-sm text-[var(--color-text-body)]">
              Six months of foreman earnings from completed auctions.
            </p>

            <div className="mt-6 grid grid-cols-6 items-end gap-3">
              {dashboard.rightPanel.commissionHistory.map((month, index) => {
                const height = `${Math.max((month.amount / commissionPeak) * 100, month.amount > 0 ? 18 : 8)}%`;
                return (
                  <div key={month.key} className="flex flex-col items-center gap-3">
                    <div className="flex h-36 w-full items-end justify-center rounded-[var(--radius-card)] bg-[var(--color-surface-low)] px-2 py-3">
                      <div
                        className="w-full rounded-t-[6px]"
                        style={{
                          height,
                          background: index % 2 === 0 ? "#1b4332" : "#d4a843",
                        }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{month.label}</p>
                      <p className="mt-1 text-[0.75rem] text-[var(--color-text-muted)]">
                        {month.amount > 0 ? formatCurrency(month.amount) : "—"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-6 text-sm text-[var(--color-text-body)]">
              <span className="font-medium text-[var(--color-text-primary)]">
                {formatCurrency(dashboard.rightPanel.commissionThisCycle)}
              </span>{" "}
              earned this cycle
            </p>
          </section>

          <section className="rounded-[var(--radius-card)] bg-[var(--color-primary-container)] p-6 text-white shadow-[var(--shadow-card)]">
            <h2 className="text-white">Automate Reminders</h2>
            <p className="mt-3 text-sm leading-7 text-white/78">
              Set up WhatsApp reminders in Settings. Coming soon on ChitMate Pro.
            </p>
            <Link
              href="/dashboard/settings"
              className="mt-6 inline-flex rounded-[var(--radius-button)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-primary-container)]"
            >
              Enable Now
            </Link>
          </section>
        </aside>
      </div>

      <Link
        href="/dashboard/chit-groups/new"
        title="Create Chit Group"
        className="fixed bottom-24 right-5 z-30 flex flex-col items-center gap-1 rounded-full lg:bottom-8 lg:right-8"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#d4a843,#eec058)] text-3xl text-[var(--color-text-primary)] shadow-[var(--shadow-float)]">
          +
        </span>
        <span className="text-xs font-medium text-[var(--color-text-primary)] lg:sr-only">
          Create Chit Group
        </span>
        <span className="hidden rounded-[var(--radius-button)] bg-white/90 px-3 py-1 text-xs font-medium text-[var(--color-text-primary)] shadow-[var(--shadow-card)] lg:block">
          Create Chit Group
        </span>
      </Link>
    </>
  );
}
