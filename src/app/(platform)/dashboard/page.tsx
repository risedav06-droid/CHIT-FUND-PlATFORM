export const revalidate = 30;

import Link from "next/link";

import { ChitGroupCard } from "@/components/ui/chit-group-card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { authService } from "@/modules/auth/auth.service";
import { formatCurrency } from "@/lib/utils";
import { getOrganiserDashboardData } from "@/utils/supabase/db";

function icon(path: React.ReactNode) {
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface-low)] text-[var(--color-primary)]">
      {path}
    </span>
  );
}

export default async function DashboardPage() {
  const session = await authService.requireAuthenticatedSession("/dashboard");
  const {
    groups: activeGroups,
    membersCount: activeMembers,
    commissionEarned,
    pendingPayments,
  } = await getOrganiserDashboardData(session.user.id);

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="rounded-[var(--radius-card)] bg-white px-8 py-8 shadow-[var(--shadow-card)]">
            <h1 className="text-[1.875rem]">
              Welcome back, {session.user.name?.split(" ")[0] ?? "Organiser"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-text-body)]">
              Your portfolio is ready. Create your first chit group to get started.
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            <StatCard
              label="Total Active Chits"
              value={activeGroups.length}
              icon={icon(
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <rect x="3.5" y="4" width="13" height="4" rx="1.2" />
                  <rect x="3.5" y="12" width="13" height="4" rx="1.2" />
                </svg>,
              )}
            />
            <StatCard
              label="Members This Month"
              value={activeMembers}
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
              value={formatCurrency(commissionEarned)}
              icon={icon(
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M10 3.5v13" />
                  <path d="M13 6.2c0-1.1-1.3-2-3-2s-3 .9-3 2 1.3 2 3 2 3 .9 3 2-1.3 2-3 2-3-.9-3-2" />
                </svg>,
              )}
            />
            <StatCard
              label="Payments Pending"
              value={pendingPayments}
              highlight={pendingPayments > 0}
              icon={icon(
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M10 4.2 16.2 15H3.8L10 4.2Z" />
                  <path d="M10 8v3.7" />
                  <path d="M10 13.8h.01" />
                </svg>,
              )}
            />
          </section>

          <section id="chit-groups" className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2>Active Chit Groups</h2>
                <p className="mt-1 text-sm text-[var(--color-text-body)]">
                  Create your first chit group to get started.
                </p>
              </div>
              <Link href="/dashboard/chit-groups" className="ghost-button">
                View All Chits
              </Link>
            </div>

            {activeGroups.length === 0 ? (
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
                {activeGroups.map((group: any, index: number) => (
                  <ChitGroupCard
                    key={group.id}
                    name={group.name}
                    memberCount={Number(group.member_count ?? 0)}
                    currentCycle={1}
                    totalCycles={Number(group.duration_months ?? 12)}
                    paidCount={0}
                    totalMembers={Number(group.member_count ?? 0)}
                    nextAuction="Awaiting first collection cycle"
                    badge={index % 2 === 0 ? "HIGH YIELD" : "STANDARD"}
                    href={`/dashboard/chit-groups/${group.id}`}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-4 xl:self-start">
          <section className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
            <h2>Recent Activity</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--color-text-body)]">
              No activity yet. Actions you take will appear here.
            </p>
          </section>

          <section className="rounded-[var(--radius-card)] bg-[var(--color-primary-container)] p-6 text-white shadow-[var(--shadow-card)]">
            <h2 className="text-white">Automate Reminders</h2>
            <p className="mt-3 text-sm leading-7 text-white/78">
              Set up WhatsApp reminders for all pending members.
            </p>
            <button type="button" className="mt-6 inline-flex rounded-[var(--radius-button)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-primary-container)]">
              Enable Now
            </button>
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
