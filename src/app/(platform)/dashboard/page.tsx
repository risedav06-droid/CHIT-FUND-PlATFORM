import type { Route } from "next";
import Link from "next/link";

import { FormFeedback } from "@/components/ui/form-feedback";
import { PageEmptyState } from "@/components/ui/page-empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { readFeedback } from "@/lib/action-state";
import { formatDate, formatDateTime } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import { authService } from "@/modules/auth/auth.service";
import { dashboardService } from "@/modules/dashboard/dashboard.service";

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getFullName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ");
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await authService.requireAuthenticatedSession("/dashboard");
  const [feedback, dashboard] = await Promise.all([
    readFeedback(await searchParams),
    dashboardService.getDashboard(session),
  ]);

  if (dashboard.kind === "member") {
    return (
      <div className="space-y-8">
        <section className="rounded-[1.75rem] border border-border bg-surface p-6">
          <p className="text-sm font-medium text-brand">Member dashboard</p>
          <h1 className="mt-3 text-3xl font-semibold text-foreground">
            Your chit fund summary
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
            Track your due installments, overdue balance, pending payouts, and
            recent reminders without seeing any other member&apos;s data.
          </p>
        </section>

        <FormFeedback {...feedback} />

        {dashboard.detail ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <StatCard
                label="Enrollments"
                value={dashboard.detail.enrollmentSummaries.length}
                hint="Active chit subscriptions"
              />
              <StatCard
                label="Due today"
                value={dashboard.dueToday.length}
                hint={formatCurrency(
                  dashboard.dueToday.reduce(
                    (sum, installment) => sum + installment.metrics.outstandingAmount,
                    0,
                  ),
                )}
              />
              <StatCard
                label="Overdue"
                value={dashboard.overdue.length}
                hint={formatCurrency(dashboard.detail.totals.overdueAmount)}
              />
              <StatCard
                label="Pending payouts"
                value={dashboard.pendingPayouts.length}
                hint={formatCurrency(dashboard.detail.totals.pendingPayouts)}
              />
              <StatCard
                label="Outstanding"
                value={formatCurrency(dashboard.detail.totals.totalOutstanding)}
                hint="Across all installments"
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <article className="rounded-[1.75rem] border border-border bg-white p-6">
                <h2 className="text-xl font-semibold text-foreground">Your dues</h2>
                <div className="mt-6 space-y-4">
                  {dashboard.dueToday.length === 0 && dashboard.overdue.length === 0 ? (
                    <PageEmptyState
                      title="No dues right now"
                      description="You have no due-today or overdue installments at the moment."
                    />
                  ) : (
                    [...dashboard.dueToday, ...dashboard.overdue.slice(0, 6)].map((installment) => (
                      <div
                        key={installment.id}
                        className="rounded-2xl border border-border bg-surface/40 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-semibold text-foreground">
                              {installment.chitGroup.code} | Cycle {installment.cycleNumber}
                            </p>
                            <p className="mt-1 text-sm text-muted">
                              Ticket {installment.chitEnrollment.ticketNumber} | Due{" "}
                              {formatDate(installment.dueDate)}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-rose-700">
                            {formatCurrency(installment.metrics.outstandingAmount)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </article>

              <article className="rounded-[1.75rem] border border-border bg-white p-6">
                <h2 className="text-xl font-semibold text-foreground">
                  Recent notifications
                </h2>
                <div className="mt-6 space-y-4">
                  {dashboard.recentNotifications.length === 0 ? (
                    <PageEmptyState
                      title="No notifications"
                      description="New reminders and payout updates will appear here."
                    />
                  ) : (
                    dashboard.recentNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="rounded-2xl border border-border bg-surface/40 p-4"
                      >
                        <p className="font-medium text-foreground">{notification.title}</p>
                        <p className="mt-2 text-sm text-muted">{notification.message}</p>
                        <p className="mt-3 text-xs text-muted">
                          {formatDateTime(notification.createdAt)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </article>
            </section>
          </>
        ) : (
          <PageEmptyState
            title="Member record not linked"
            description="This member login is missing its linked member record. Update the user linkage in seed or admin setup."
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[1.75rem] border border-border bg-surface p-6">
        <p className="text-sm font-medium text-brand">Operator dashboard</p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">
          Daily pilot operating board
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Due-today work, overdue pressure, payout queue, upcoming auctions, and
          recent activity are all staged here for the day&apos;s run.
        </p>
      </section>

      <FormFeedback {...feedback} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard
          label="Active groups"
          value={dashboard.activeGroups.length}
          hint="Open or active groups"
        />
        <StatCard
          label="Active members"
          value={dashboard.activeMembersCount}
          hint="Operational member records"
        />
        <StatCard
          label="Due today"
          value={dashboard.dueToday.length}
          hint={formatCurrency(dashboard.totals.dueTodayAmount)}
        />
        <StatCard
          label="Overdue today"
          value={dashboard.overdueToday.length}
          hint={formatCurrency(dashboard.totals.overdueTodayAmount)}
        />
        <StatCard
          label="Pending payouts"
          value={dashboard.pendingPayouts.length}
          hint={formatCurrency(dashboard.totals.pendingPayoutAmount)}
        />
        <StatCard
          label="Upcoming auctions"
          value={dashboard.upcomingAuctions.length}
          hint="Next 7 operating days"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Due Today</h2>
              <p className="mt-2 text-sm text-muted">
                Installments requiring attention before the day closes.
              </p>
            </div>
            <Link href="/collections" className="text-sm font-semibold text-brand">
              Open collections
            </Link>
          </div>

          {dashboard.dueToday.length === 0 ? (
            <PageEmptyState
              title="No due-today installments"
              description="There are no unpaid installments scheduled for today."
            />
          ) : (
            <div className="space-y-4">
              {dashboard.dueToday.slice(0, 8).map((installment) => (
                <div
                  key={installment.id}
                  className="rounded-2xl border border-border bg-surface/40 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <Link
                        href={`/members/${installment.chitEnrollment.member.id}` as Route}
                        className="font-semibold text-foreground hover:text-brand"
                      >
                        {getFullName(
                          installment.chitEnrollment.member.firstName,
                          installment.chitEnrollment.member.lastName,
                        )}
                      </Link>
                      <p className="mt-1 text-sm text-muted">
                        {installment.chitGroup.code} | Ticket{" "}
                        {installment.chitEnrollment.ticketNumber} | Cycle{" "}
                        {installment.cycleNumber}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(installment.metrics.outstandingAmount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">Pending Payouts</h2>
          <div className="mt-6 space-y-4">
            {dashboard.pendingPayouts.length === 0 ? (
              <PageEmptyState
                title="No pending payouts"
                description="Finalized auction payouts waiting for approval or payment will appear here."
              />
            ) : (
              dashboard.pendingPayouts.slice(0, 8).map((payout) => (
                <Link
                  key={payout.id}
                  href={`/auctions/${payout.auctionCycle.id}` as Route}
                  className="block rounded-2xl border border-border bg-surface/40 p-4 transition hover:border-brand"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-foreground">
                        {payout.chitGroup.code} | Cycle {payout.auctionCycle.cycleNumber}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {getFullName(payout.member.firstName, payout.member.lastName)} |{" "}
                        {payout.member.memberCode}
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted">
                      <p>{formatCurrency(payout.netAmount.toString())}</p>
                      <p>{payout.status.replaceAll("_", " ")}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">Risky Groups</h2>
          <div className="mt-6 space-y-4">
            {dashboard.riskyGroups.length === 0 ? (
              <PageEmptyState
                title="No risky groups"
                description="Groups with overdue pressure or pending payout exposure will appear here."
              />
            ) : (
              dashboard.riskyGroups.map((group) => (
                <Link
                  key={group.chitId}
                  href={`/chit-funds/${group.chitId}` as Route}
                  className="block rounded-2xl border border-border bg-surface/40 p-4 transition hover:border-brand"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{group.code}</p>
                      <p className="mt-1 text-sm text-muted">{group.name}</p>
                    </div>
                    <div className="text-right text-sm text-muted">
                      <p>{group.overdueCount} overdue</p>
                      <p className="text-rose-700">
                        {formatCurrency(group.overdueAmount)}
                      </p>
                      {group.pendingPayouts > 0 ? (
                        <p>Pending payout {formatCurrency(group.pendingPayouts)}</p>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">Upcoming Auctions</h2>
          <div className="mt-6 space-y-4">
            {dashboard.upcomingAuctions.length === 0 ? (
              <PageEmptyState
                title="No upcoming auctions"
                description="Scheduled or open auctions in the next seven days will appear here."
              />
            ) : (
              dashboard.upcomingAuctions.map((cycle) => (
                <Link
                  key={cycle.id}
                  href={`/auctions/${cycle.id}` as Route}
                  className="block rounded-2xl border border-border bg-surface/40 p-4 transition hover:border-brand"
                >
                  <p className="font-semibold text-foreground">
                    {cycle.chitGroup.code} | Cycle {cycle.cycleNumber}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {cycle.chitGroup.name} | {formatDate(cycle.scheduledAt)}
                  </p>
                </Link>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">
            Recent Partial Collections
          </h2>
          <div className="mt-6 space-y-4">
            {dashboard.recentPartialCollections.length === 0 ? (
              <PageEmptyState
                title="No recent partial collections"
                description="Partially settled installments will surface here when they occur."
              />
            ) : (
              dashboard.recentPartialCollections.map((payment) => (
                <div
                  key={payment.id}
                  className="rounded-2xl border border-border bg-surface/40 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-foreground">
                        {payment.member.memberCode} | {payment.chitGroup.code}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        Cycle {payment.installment.cycleNumber} | Received{" "}
                        {formatCurrency(payment.amount.toString())}
                      </p>
                    </div>
                    <p className="text-sm text-muted">{formatDate(payment.receivedOn)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">
            Recent Failed Collections
          </h2>
          <div className="mt-6 space-y-4">
            {dashboard.recentFailedCollections.length === 0 ? (
              <PageEmptyState
                title="No failed collections"
                description="Overdue installments with no recovery payment will appear here."
              />
            ) : (
              dashboard.recentFailedCollections.map((installment) => (
                <div
                  key={installment.id}
                  className="rounded-2xl border border-rose-100 bg-rose-50 p-4"
                >
                  <p className="font-semibold text-rose-900">
                    {installment.chitEnrollment.member.memberCode} |{" "}
                    {installment.chitGroup.code}
                  </p>
                  <p className="mt-1 text-sm text-rose-800">
                    Cycle {installment.cycleNumber} | Outstanding{" "}
                    {formatCurrency(installment.metrics.outstandingAmount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="rounded-[1.75rem] border border-border bg-white p-6">
        <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {dashboard.recentActivity.length === 0 ? (
            <PageEmptyState
              title="No recent activity"
              description="Audit trail activity will appear here as operations happen."
            />
          ) : (
            dashboard.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="rounded-2xl border border-border bg-surface/40 p-4"
              >
                <p className="font-medium text-foreground">
                  {activity.summary ?? activity.action}
                </p>
                <p className="mt-2 text-sm text-muted">
                  {activity.action} | {formatDateTime(activity.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
