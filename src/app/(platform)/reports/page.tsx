import type { Route } from "next";
import Link from "next/link";

import { FormFeedback } from "@/components/ui/form-feedback";
import { Input } from "@/components/ui/input";
import { PageEmptyState } from "@/components/ui/page-empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { formatDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import { authService } from "@/modules/auth/auth.service";
import { reportsService } from "@/modules/reports/reports.service";

type ReportsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function getFullName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ");
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  await authService.requirePermission("view_reports", "/reports");
  const report = await reportsService.getReports(await searchParams);

  return (
    <div className="space-y-8">
      <section className="rounded-[1.75rem] border border-border bg-surface p-6 shadow-[0_20px_70px_-50px_rgba(31,27,23,0.5)]">
        <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold text-foreground">Reports</h1>
            <p className="mt-2 text-sm leading-7 text-muted">
              Monthly operating summary, overdue collections, date-range receipts,
              member ledger balances, and chit group performance.
            </p>
          </div>

          <form className="grid gap-3 rounded-[1.5rem] border border-border bg-white p-4 sm:grid-cols-[1fr_1fr_auto]">
            <label className="space-y-2 text-sm font-medium text-foreground">
              <span>From</span>
              <Input
                name="dateFrom"
                type="date"
                defaultValue={report.filters.dateFromInput}
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-foreground">
              <span>To</span>
              <Input
                name="dateTo"
                type="date"
                defaultValue={report.filters.dateToInput}
              />
            </label>
            <button
              type="submit"
              className="self-end rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground"
            >
              Apply
            </button>
          </form>
        </div>
      </section>

      <FormFeedback
        status={report.filterError ? "error" : undefined}
        message={report.filterError}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          ["Member ledger", "/exports/member-ledger"],
          ["Group ledger", "/exports/group-ledger"],
          ["Overdue export", "/exports/overdue"],
          ["Collections export", "/exports/collections"],
          ["Auction summary", "/exports/auction-summary"],
          ["Payout register", "/exports/payout-register"],
        ].map(([label, href]) => (
          <Link
            key={href}
            href={href as Route}
            className="rounded-[1.5rem] border border-border bg-white p-5 transition hover:border-brand"
          >
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <p className="mt-2 text-sm text-muted">
              Open a print-safe export view for pilot operations.
            </p>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard
          label="Active groups"
          value={report.organizerSummary.activeGroups}
          hint="Open or active groups"
        />
        <StatCard
          label="Active members"
          value={report.organizerSummary.activeMembers}
          hint="Active member records"
        />
        <StatCard
          label="Collections"
          value={formatCurrency(report.organizerSummary.collectionsTotal)}
          hint={`${report.organizerSummary.collectionsCount} receipt(s) in range`}
        />
        <StatCard
          label="Overdue"
          value={formatCurrency(report.organizerSummary.overdueAmount)}
          hint={`${report.organizerSummary.overdueInstallmentsCount} installment(s)`}
        />
        <StatCard
          label="Paid payouts"
          value={formatCurrency(report.organizerSummary.paidPayouts)}
          hint="Winner disbursements marked paid"
        />
        <StatCard
          label="Pending payouts"
          value={formatCurrency(report.organizerSummary.pendingPayouts)}
          hint="Pending / approved / on-hold payouts"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Overdue Installments
            </h2>
            <p className="mt-2 text-sm text-muted">
              Practical follow-up queue, ranked by outstanding amount.
            </p>
          </div>

          {report.overdueInstallments.length === 0 ? (
            <PageEmptyState
              title="No overdue installments"
              description="No unpaid installments are currently past due."
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-surface-strong/50 text-left text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Member</th>
                    <th className="px-4 py-3 font-medium">Group / cycle</th>
                    <th className="px-4 py-3 font-medium">Outstanding</th>
                    <th className="px-4 py-3 font-medium">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {report.overdueInstallments.slice(0, 20).map((installment) => (
                    <tr key={installment.id}>
                      <td className="px-4 py-4">
                        <Link
                          href={`/members/${installment.chitEnrollment.member.id}` as Route}
                          className="font-medium text-foreground hover:text-brand"
                        >
                          {getFullName(
                            installment.chitEnrollment.member.firstName,
                            installment.chitEnrollment.member.lastName,
                          )}
                        </Link>
                        <div className="text-xs text-muted">
                          {installment.chitEnrollment.member.memberCode} |{" "}
                          {installment.chitEnrollment.member.primaryPhone}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted">
                        <Link
                          href={`/chit-funds/${installment.chitGroup.id}` as Route}
                          className="font-medium text-foreground hover:text-brand"
                        >
                          {installment.chitGroup.code}
                        </Link>
                        <div className="text-xs">
                          Ticket {installment.chitEnrollment.ticketNumber} | Cycle{" "}
                          {installment.cycleNumber}
                        </div>
                      </td>
                      <td className="px-4 py-4 font-semibold text-rose-700">
                        {formatCurrency(installment.metrics.outstandingAmount)}
                      </td>
                      <td className="px-4 py-4 text-muted">
                        <div>{formatDate(installment.dueDate)}</div>
                        <div className="text-xs">
                          {installment.metrics.daysOverdue} days overdue
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">
            Collections By Date Range
          </h2>
          <p className="mt-2 text-sm text-muted">
            {formatDate(report.filters.dateFrom)} to {formatDate(report.filters.dateTo)}
          </p>
          <div className="mt-6 space-y-4">
            {report.collections.length === 0 ? (
              <PageEmptyState
                title="No collections"
                description="No payments were received in the selected date range."
              />
            ) : (
              report.collections.slice(0, 16).map((payment) => (
                <div
                  key={payment.id}
                  className="rounded-2xl border border-border bg-surface/40 p-4"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">
                        {formatCurrency(payment.amount.toString())}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {payment.member.memberCode} | {payment.chitGroup.code} | Cycle{" "}
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

      <section className="rounded-[1.75rem] border border-border bg-white p-6">
        <h2 className="text-xl font-semibold text-foreground">Member Ledger View</h2>
        <p className="mt-2 text-sm text-muted">
          Balance-level ledger across subscriptions, collections, and winner payouts.
        </p>
        {report.memberLedger.length === 0 ? (
          <div className="mt-6">
            <PageEmptyState
              title="No member ledger"
              description="Members and enrollments will appear here once created."
            />
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-border">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-surface-strong/50 text-left text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Paid / due</th>
                  <th className="px-4 py-3 font-medium">Outstanding</th>
                  <th className="px-4 py-3 font-medium">Payouts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {report.memberLedger.slice(0, 25).map((member) => (
                  <tr key={member.id}>
                    <td className="px-4 py-4">
                      <Link
                        href={`/members/${member.id}` as Route}
                        className="font-medium text-foreground hover:text-brand"
                      >
                        {member.name}
                      </Link>
                      <div className="text-xs text-muted">
                        {member.memberCode} | {member.enrollmentsCount} enrollment(s)
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted">{formatStatus(member.status)}</td>
                    <td className="px-4 py-4 text-muted">
                      {formatCurrency(member.totalPaid)} / {formatCurrency(member.totalDue)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-foreground">
                        {formatCurrency(member.outstandingAmount)}
                      </div>
                      {member.overdueAmount > 0 ? (
                        <div className="text-xs font-medium text-rose-700">
                          Overdue {formatCurrency(member.overdueAmount)}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-muted">
                      <div>Paid {formatCurrency(member.paidPayouts)}</div>
                      <div className="text-xs">
                        Pending {formatCurrency(member.pendingPayouts)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-[1.75rem] border border-border bg-white p-6">
        <h2 className="text-xl font-semibold text-foreground">
          Chit Group Performance Summary
        </h2>
        <p className="mt-2 text-sm text-muted">
          Enrollment, collections, auctions, overdue pressure, and pending payout exposure.
        </p>
        {report.groupPerformance.length === 0 ? (
          <div className="mt-6">
            <PageEmptyState
              title="No group performance"
              description="Create a chit group and enroll members to populate performance reports."
            />
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-border">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-surface-strong/50 text-left text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Group</th>
                  <th className="px-4 py-3 font-medium">Enrollment</th>
                  <th className="px-4 py-3 font-medium">Collections</th>
                  <th className="px-4 py-3 font-medium">Auction progress</th>
                  <th className="px-4 py-3 font-medium">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {report.groupPerformance.slice(0, 20).map((group) => (
                  <tr key={group.id}>
                    <td className="px-4 py-4">
                      <Link
                        href={`/chit-funds/${group.id}` as Route}
                        className="font-medium text-foreground hover:text-brand"
                      >
                        {group.code}
                      </Link>
                      <div className="text-xs text-muted">
                        {group.name} | {formatStatus(group.status)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted">
                      {group.enrolledTickets}/{group.ticketCount} tickets
                    </td>
                    <td className="px-4 py-4 text-muted">
                      <div>{formatCurrency(group.totalPaid)} collected</div>
                      <div className="text-xs">
                        {formatCurrency(group.outstandingAmount)} outstanding
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted">
                      {group.settledCycles}/{group.generatedCycles} settled
                    </td>
                    <td className="px-4 py-4 text-muted">
                      <div>{group.overdueCount} overdue installment(s)</div>
                      <div className="text-xs font-medium text-rose-700">
                        {formatCurrency(group.overdueAmount)} overdue
                      </div>
                      {group.pendingPayouts > 0 ? (
                        <div className="text-xs">
                          Pending payout {formatCurrency(group.pendingPayouts)}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
