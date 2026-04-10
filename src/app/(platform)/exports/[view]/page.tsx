import Link from "next/link";
import { notFound } from "next/navigation";

import { Input } from "@/components/ui/input";
import { PageEmptyState } from "@/components/ui/page-empty-state";
import { formatDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import { authService } from "@/modules/auth/auth.service";
import { exportsService, getExportTitle } from "@/modules/exports/exports.service";

type ExportViewPageProps = {
  params: Promise<{
    view: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function getFullName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ");
}

export default async function ExportViewPage({
  params,
  searchParams,
}: ExportViewPageProps) {
  const [{ view }, rawSearchParams] = await Promise.all([params, searchParams]);
  await authService.requirePermission("view_exports", `/exports/${view}`);

  let exportData: Awaited<ReturnType<typeof exportsService.getExport>>;

  try {
    exportData = await exportsService.getExport(view, rawSearchParams);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-8 print:space-y-4">
      <section className="rounded-[1.75rem] border border-border bg-surface p-6 print:border-0 print:bg-white print:p-0">
        <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div>
            <Link href="/reports" className="text-sm font-medium text-brand print:hidden">
              Back to reports
            </Link>
            <h1 className="mt-3 text-3xl font-semibold text-foreground">
              {getExportTitle(exportData.view)}
            </h1>
            <p className="mt-2 text-sm text-muted">
              Print-safe operational export for pilot usage.
            </p>
          </div>

          <form className="grid gap-3 rounded-[1.5rem] border border-border bg-white p-4 print:hidden sm:grid-cols-[1fr_1fr_auto]">
            <label className="space-y-2 text-sm font-medium text-foreground">
              <span>From</span>
              <Input
                name="dateFrom"
                type="date"
                defaultValue={exportData.filters.dateFromInput}
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-foreground">
              <span>To</span>
              <Input
                name="dateTo"
                type="date"
                defaultValue={exportData.filters.dateToInput}
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

      {"report" in exportData ? (
        <>
          {exportData.view === "member-ledger" ? (
            <section className="overflow-hidden rounded-[1.75rem] border border-border bg-white">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-surface-strong/50 text-left text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Member</th>
                    <th className="px-4 py-3 font-medium">Paid / due</th>
                    <th className="px-4 py-3 font-medium">Outstanding</th>
                    <th className="px-4 py-3 font-medium">Payouts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {exportData.report.memberLedger.map((member) => (
                    <tr key={member.id}>
                      <td className="px-4 py-4">
                        {member.memberCode} | {member.name}
                      </td>
                      <td className="px-4 py-4">
                        {formatCurrency(member.totalPaid)} / {formatCurrency(member.totalDue)}
                      </td>
                      <td className="px-4 py-4">
                        {formatCurrency(member.outstandingAmount)}
                      </td>
                      <td className="px-4 py-4">
                        Paid {formatCurrency(member.paidPayouts)} | Pending{" "}
                        {formatCurrency(member.pendingPayouts)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}

          {exportData.view === "group-ledger" ? (
            <section className="overflow-hidden rounded-[1.75rem] border border-border bg-white">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-surface-strong/50 text-left text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Group</th>
                    <th className="px-4 py-3 font-medium">Enrollment</th>
                    <th className="px-4 py-3 font-medium">Collections</th>
                    <th className="px-4 py-3 font-medium">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {exportData.report.groupPerformance.map((group) => (
                    <tr key={group.id}>
                      <td className="px-4 py-4">
                        {group.code} | {group.name}
                      </td>
                      <td className="px-4 py-4">
                        {group.enrolledTickets}/{group.ticketCount}
                      </td>
                      <td className="px-4 py-4">
                        {formatCurrency(group.totalPaid)} collected |{" "}
                        {formatCurrency(group.outstandingAmount)} outstanding
                      </td>
                      <td className="px-4 py-4">
                        {group.overdueCount} overdue | Pending payout{" "}
                        {formatCurrency(group.pendingPayouts)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}

          {exportData.view === "overdue" ? (
            <section className="overflow-hidden rounded-[1.75rem] border border-border bg-white">
              {exportData.report.overdueInstallments.length === 0 ? (
                <div className="p-6">
                  <PageEmptyState
                    title="No overdue rows"
                    description="No overdue installments fall inside the current filter set."
                  />
                </div>
              ) : (
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
                    {exportData.report.overdueInstallments.map((installment) => (
                      <tr key={installment.id}>
                        <td className="px-4 py-4">
                          {installment.chitEnrollment.member.memberCode} |{" "}
                          {getFullName(
                            installment.chitEnrollment.member.firstName,
                            installment.chitEnrollment.member.lastName,
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {installment.chitGroup.code} | Ticket{" "}
                          {installment.chitEnrollment.ticketNumber} | Cycle{" "}
                          {installment.cycleNumber}
                        </td>
                        <td className="px-4 py-4">
                          {formatCurrency(installment.metrics.outstandingAmount)}
                        </td>
                        <td className="px-4 py-4">{formatDate(installment.dueDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          ) : null}

          {exportData.view === "collections" ? (
            <section className="overflow-hidden rounded-[1.75rem] border border-border bg-white">
              {exportData.report.collections.length === 0 ? (
                <div className="p-6">
                  <PageEmptyState
                    title="No collections"
                    description="No payments were recorded in the selected date range."
                  />
                </div>
              ) : (
                <table className="min-w-full divide-y divide-border text-sm">
                  <thead className="bg-surface-strong/50 text-left text-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">Received</th>
                      <th className="px-4 py-3 font-medium">Member</th>
                      <th className="px-4 py-3 font-medium">Group / cycle</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {exportData.report.collections.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-4 py-4">{formatDate(payment.receivedOn)}</td>
                        <td className="px-4 py-4">
                          {payment.member.memberCode} |{" "}
                          {getFullName(payment.member.firstName, payment.member.lastName)}
                        </td>
                        <td className="px-4 py-4">
                          {payment.chitGroup.code} | Cycle {payment.installment.cycleNumber}
                        </td>
                        <td className="px-4 py-4">
                          {formatCurrency(payment.amount.toString())}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          ) : null}
        </>
      ) : (
        <section className="overflow-hidden rounded-[1.75rem] border border-border bg-white">
          {exportData.rows.length === 0 ? (
            <div className="p-6">
              <PageEmptyState
                title="No rows for this export"
                description="Nothing matched the current date range."
              />
            </div>
          ) : exportData.view === "auction-summary" ? (
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-surface-strong/50 text-left text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Auction</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Winner</th>
                  <th className="px-4 py-3 font-medium">Result</th>
                </tr>
              </thead>
                <tbody className="divide-y divide-border">
                {exportData.rows.map((row) => {
                  if (!("winningEnrollment" in row)) {
                    return null;
                  }

                  return (
                    <tr key={row.id}>
                      <td className="px-4 py-4">
                        {row.chitGroup.code} | Cycle {row.cycleNumber} |{" "}
                        {formatDate(row.scheduledAt)}
                      </td>
                      <td className="px-4 py-4">{formatStatus(row.status)}</td>
                      <td className="px-4 py-4">
                        {row.winningEnrollment
                          ? `${row.winningEnrollment.member.memberCode} | ${getFullName(
                              row.winningEnrollment.member.firstName,
                              row.winningEnrollment.member.lastName,
                            )}`
                          : "Not finalized"}
                      </td>
                      <td className="px-4 py-4">
                        Net {formatCurrency(row.netPrizeAmount?.toString() ?? "0")} | Payout{" "}
                        {row.payout ? formatStatus(row.payout.status) : "Pending"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-surface-strong/50 text-left text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Group / cycle</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {exportData.rows.map((row) => {
                  if (!("auctionCycle" in row)) {
                    return null;
                  }

                  return (
                    <tr key={row.id}>
                      <td className="px-4 py-4">{formatDate(row.createdAt)}</td>
                      <td className="px-4 py-4">
                        {row.member.memberCode} |{" "}
                        {getFullName(row.member.firstName, row.member.lastName)}
                      </td>
                      <td className="px-4 py-4">
                        {row.chitGroup.code} | Cycle {row.auctionCycle.cycleNumber}
                      </td>
                      <td className="px-4 py-4">{formatStatus(row.status)}</td>
                      <td className="px-4 py-4">
                        {formatCurrency(row.netAmount.toString())}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}
