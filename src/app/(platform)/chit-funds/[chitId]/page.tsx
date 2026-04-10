import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageEmptyState } from "@/components/ui/page-empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { formatDate, formatDateTime } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import { authService } from "@/modules/auth/auth.service";
import { chitGroupsService } from "@/modules/chit-funds/chit-groups.service";

type ChitGroupDetailPageProps = {
  params: Promise<{
    chitId: string;
  }>;
};

function getFullName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ");
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

export default async function ChitGroupDetailPage({
  params,
}: ChitGroupDetailPageProps) {
  const { chitId } = await params;
  await authService.requirePermission("view_staff_area", `/chit-funds/${chitId}`);
  const detail = await chitGroupsService.getChitGroupDetail(chitId);

  if (!detail) {
    notFound();
  }

  const cycleList =
    detail.upcomingCycles.length > 0
      ? detail.upcomingCycles
      : detail.group.auctionCycles.slice(0, 8);

  return (
    <div className="space-y-8">
      <section className="rounded-[1.75rem] border border-border bg-surface p-6">
        <Link href="/chit-funds" className="text-sm font-medium text-brand">
          Back to chit funds
        </Link>
        <div className="mt-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-medium text-muted">{detail.group.code}</p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">
              {detail.group.name}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
              {detail.group.description ??
                "Operational detail view for enrolled tickets, cycles, collections, and audit history."}
            </p>
          </div>
          <span className="w-fit rounded-full bg-white px-4 py-2 text-sm font-semibold text-foreground">
            {formatStatus(detail.group.status)}
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard
          label="Enrolled tickets"
          value={`${detail.enrollmentSummaries.length}/${detail.group.ticketCount}`}
          hint="Current enrollment usage"
        />
        <StatCard
          label="Installment"
          value={formatCurrency(detail.group.installmentAmount.toString())}
          hint={`${detail.group.durationMonths} generated cycles`}
        />
        <StatCard
          label="Total demand"
          value={formatCurrency(detail.totals.totalDue)}
          hint="Generated member installments"
        />
        <StatCard
          label="Collected"
          value={formatCurrency(detail.totals.totalPaid)}
          hint="Recorded against installments"
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(detail.totals.totalOutstanding)}
          hint="Unpaid installment balance"
        />
        <StatCard
          label="Overdue"
          value={formatCurrency(detail.totals.overdueAmount)}
          hint={`Pending payouts ${formatCurrency(detail.totals.pendingPayouts)}`}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">Enrolled Members</h2>
          <p className="mt-2 text-sm text-muted">
            Ticket holders and their current collection position in this group.
          </p>

          <div className="mt-6 space-y-4">
            {detail.enrollmentSummaries.length === 0 ? (
              <PageEmptyState
                title="No enrolled members"
                description="Use the chit funds page to enroll a member and generate installment schedules."
              />
            ) : (
              detail.enrollmentSummaries.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="rounded-2xl border border-border bg-surface/40 p-4"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <Link
                        href={`/members/${enrollment.member.id}` as Route}
                        className="text-lg font-semibold text-foreground hover:text-brand"
                      >
                        {getFullName(enrollment.member.firstName, enrollment.member.lastName)}
                      </Link>
                      <p className="mt-1 text-sm text-muted">
                        {enrollment.member.memberCode} | Ticket{" "}
                        {enrollment.ticketNumber} | {enrollment.member.primaryPhone}
                      </p>
                    </div>
                    <div className="text-sm text-muted md:text-right">
                      <div>Paid {formatCurrency(enrollment.totalPaid)}</div>
                      <div>Outstanding {formatCurrency(enrollment.outstandingAmount)}</div>
                    </div>
                  </div>
                  {enrollment.overdueInstallmentsCount > 0 ? (
                    <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
                      {enrollment.overdueInstallmentsCount} overdue installment(s),{" "}
                      {formatCurrency(enrollment.overdueAmount)} overdue.
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">Overdue Focus</h2>
          <p className="mt-2 text-sm text-muted">
            Enrollments ranked by count and overdue amount.
          </p>
          <div className="mt-6 space-y-4">
            {detail.overdueEnrollments.length === 0 ? (
              <PageEmptyState
                title="No overdue enrollments"
                description="All generated installments are either paid or still within schedule."
              />
            ) : (
              detail.overdueEnrollments.map((enrollment) => (
                <Link
                  key={enrollment.id}
                  href={`/members/${enrollment.member.id}` as Route}
                  className="block rounded-2xl border border-border bg-surface/40 p-4 transition hover:border-brand"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">
                        {enrollment.member.memberCode}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        Ticket {enrollment.ticketNumber}
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted">
                      <p>{enrollment.overdueInstallmentsCount} overdue</p>
                      <p className="font-semibold text-rose-700">
                        {formatCurrency(enrollment.overdueAmount)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">
            {detail.upcomingCycles.length > 0 ? "Upcoming Cycles" : "Generated Cycles"}
          </h2>
          <div className="mt-6 grid gap-3">
            {cycleList.map((cycle) => (
              <Link
                key={cycle.id}
                href={`/auctions/${cycle.id}` as Route}
                className="flex justify-between gap-4 rounded-2xl border border-border bg-surface/40 p-4 text-sm"
              >
                <div>
                  <p className="font-semibold text-foreground">Cycle {cycle.cycleNumber}</p>
                  <p className="mt-1 text-muted">{formatDate(cycle.scheduledAt)}</p>
                </div>
                <p className="text-muted">{formatStatus(cycle.status)}</p>
              </Link>
            ))}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">Recent Payments</h2>
          <div className="mt-6 space-y-4">
            {detail.payments.length === 0 ? (
              <PageEmptyState
                title="No collections yet"
                description="Payments recorded for this chit group will be shown here."
              />
            ) : (
              detail.payments.slice(0, 10).map((payment) => (
                <div
                  key={payment.id}
                  className="rounded-2xl border border-border bg-surface/40 p-4"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-medium text-foreground">
                        {formatCurrency(payment.amount.toString())}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {payment.member.memberCode} | Ticket{" "}
                        {payment.chitEnrollment.ticketNumber} | Cycle{" "}
                        {payment.installment.cycleNumber}
                      </p>
                    </div>
                    <p className="text-sm text-muted">{formatDate(payment.receivedOn)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">Auction Results</h2>
          <p className="mt-2 text-sm text-muted">
            Finalized winners, locked auction calculations, and payout state.
          </p>
          <div className="mt-6 space-y-4">
            {detail.auctionResults.length === 0 ? (
              <PageEmptyState
                title="No finalized auctions"
                description="Finalize a cycle from the auctions page to write the result here."
              />
            ) : (
              detail.auctionResults.map((auctionResult) => (
                <Link
                  key={auctionResult.id}
                  href={`/auctions/${auctionResult.id}` as Route}
                  className="block rounded-2xl border border-border bg-surface/40 p-4 transition hover:border-brand"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">
                        Cycle {auctionResult.cycleNumber}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        Winner{" "}
                        {auctionResult.winningEnrollment
                          ? getFullName(
                              auctionResult.winningEnrollment.member.firstName,
                              auctionResult.winningEnrollment.member.lastName,
                            )
                          : "not recorded"}
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted">
                      <p>
                        Net{" "}
                        {formatCurrency(
                          auctionResult.netPrizeAmount?.toString() ?? "0",
                        )}
                      </p>
                      <p>
                        Payout{" "}
                        {auctionResult.payout
                          ? formatStatus(auctionResult.payout.status)
                          : "not created"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">Payout History</h2>
          <p className="mt-2 text-sm text-muted">
            Disbursements owed to auction winners in this chit group.
          </p>
          <div className="mt-6 space-y-4">
            {detail.payouts.length === 0 ? (
              <PageEmptyState
                title="No payout records"
                description="Pending payouts are created automatically after auction finalization."
              />
            ) : (
              detail.payouts.map((payout) => (
                <Link
                  key={payout.id}
                  href={`/auctions/${payout.auctionCycle.id}` as Route}
                  className="block rounded-2xl border border-border bg-surface/40 p-4 transition hover:border-brand"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">
                        {payout.member.memberCode} | Cycle{" "}
                        {payout.auctionCycle.cycleNumber}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        Ticket {payout.chitEnrollment.ticketNumber} |{" "}
                        {getFullName(payout.member.firstName, payout.member.lastName)}
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted">
                      <p>{formatCurrency(payout.netAmount.toString())}</p>
                      <p>{formatStatus(payout.status)}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="rounded-[1.75rem] border border-border bg-white p-6">
        <h2 className="text-xl font-semibold text-foreground">Recent Audit Logs</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {detail.auditLogs.length === 0 ? (
            <PageEmptyState
              title="No audit activity"
              description="Group, enrollment, and payment audit entries will appear here."
            />
          ) : (
            detail.auditLogs.map((auditLog) => (
              <div
                key={auditLog.id}
                className="rounded-2xl border border-border bg-surface/40 p-4"
              >
                <p className="font-medium text-foreground">{auditLog.summary}</p>
                <p className="mt-2 text-sm text-muted">
                  {auditLog.action} | {formatDateTime(auditLog.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
