import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FormFeedback } from "@/components/ui/form-feedback";
import { PageEmptyState } from "@/components/ui/page-empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { readFeedback } from "@/lib/action-state";
import { formatDate, formatDateTime } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import { authService } from "@/modules/auth/auth.service";
import { membersService } from "@/modules/members/members.service";

type MemberDetailPageProps = {
  params: Promise<{
    memberId: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getFullName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ");
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

export default async function MemberDetailPage({
  params,
  searchParams,
}: MemberDetailPageProps) {
  const [{ memberId }, feedback] = await Promise.all([
    params,
    readFeedback(await searchParams),
  ]);
  const session = await authService.requireMemberRecordAccess(memberId);
  const detail = await membersService.getMemberDetail(memberId);

  if (!detail) {
    notFound();
  }

  const memberName = getFullName(detail.member.firstName, detail.member.lastName);
  const backHref =
    session.user.role === "MEMBER" ? "/dashboard" : "/members";
  const backLabel =
    session.user.role === "MEMBER" ? "Back to dashboard" : "Back to members";

  return (
    <div className="space-y-8">
      <section className="rounded-[1.75rem] border border-border bg-surface p-6">
        <Link href={backHref} className="text-sm font-medium text-brand">
          {backLabel}
        </Link>
        <div className="mt-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-medium text-muted">{detail.member.memberCode}</p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">
              {memberName}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
              {detail.member.primaryPhone}
              {detail.member.primaryEmail ? ` | ${detail.member.primaryEmail}` : ""}
              {detail.member.city ? ` | ${detail.member.city}` : ""}
            </p>
          </div>
          <span className="w-fit rounded-full bg-white px-4 py-2 text-sm font-semibold text-foreground">
            {formatStatus(detail.member.status)}
          </span>
        </div>
      </section>

      <FormFeedback {...feedback} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard
          label="Enrollments"
          value={detail.enrollmentSummaries.length}
          hint="Tickets linked to this member"
        />
        <StatCard
          label="Total due"
          value={formatCurrency(detail.totals.totalDue)}
          hint="Generated installment demand"
        />
        <StatCard
          label="Total paid"
          value={formatCurrency(detail.totals.totalPaid)}
          hint="Recorded installment collections"
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(detail.totals.totalOutstanding)}
          hint="All unpaid installment balance"
        />
        <StatCard
          label="Overdue"
          value={formatCurrency(detail.totals.overdueAmount)}
          hint={`${detail.totals.overdueInstallmentsCount} installments overdue`}
        />
        <StatCard
          label="Pending payout"
          value={formatCurrency(detail.totals.pendingPayouts)}
          hint={`${detail.payouts.length} payout record(s)`}
        />
      </section>

      <section className="rounded-[1.75rem] border border-border bg-white p-6">
        <h2 className="text-xl font-semibold text-foreground">Enrollments</h2>
        <p className="mt-2 text-sm text-muted">
          Chit tickets owned by this member and their collection position.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {detail.enrollmentSummaries.length === 0 ? (
            <PageEmptyState
              title="No enrollments"
              description="Enroll this member from the chit funds screen to generate installments."
            />
          ) : (
            detail.enrollmentSummaries.map((enrollment) => (
              <article
                key={enrollment.id}
                className="rounded-[1.5rem] border border-border bg-surface/50 p-5"
              >
                <Link
                  href={`/chit-funds/${enrollment.chitGroup.id}` as Route}
                  className="text-lg font-semibold text-foreground hover:text-brand"
                >
                  {enrollment.chitGroup.name}
                </Link>
                <p className="mt-1 text-sm text-muted">
                  {enrollment.chitGroup.code} | Ticket {enrollment.ticketNumber}
                </p>
                <dl className="mt-5 grid gap-3 text-sm text-muted">
                  <div className="flex justify-between gap-4">
                    <dt>Joined</dt>
                    <dd>{formatDate(enrollment.joinedAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Paid</dt>
                    <dd>{formatCurrency(enrollment.totalPaid)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Outstanding</dt>
                    <dd>{formatCurrency(enrollment.outstandingAmount)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Overdue</dt>
                    <dd className={enrollment.overdueAmount > 0 ? "text-rose-700" : ""}>
                      {formatCurrency(enrollment.overdueAmount)}
                    </dd>
                  </div>
                </dl>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-border bg-white p-6">
        <h2 className="text-xl font-semibold text-foreground">Installment Overview</h2>
        <p className="mt-2 text-sm text-muted">
          Paid, outstanding, partial, and overdue state across every generated cycle.
        </p>

        {detail.installments.length === 0 ? (
          <div className="mt-6">
            <PageEmptyState
              title="No generated installments"
              description="Installments appear here after the member is enrolled into a chit group."
            />
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
            <table className="min-w-[760px] divide-y divide-border text-sm">
              <thead className="bg-surface-strong/50 text-left text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Group</th>
                  <th className="px-4 py-3 font-medium">Cycle</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Paid / Due</th>
                  <th className="px-4 py-3 font-medium">Due date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {detail.installments.map((installment) => (
                  <tr key={installment.id}>
                    <td className="px-4 py-4">
                      <Link
                        href={`/chit-funds/${installment.chitGroup.id}` as Route}
                        className="font-medium text-foreground hover:text-brand"
                      >
                        {installment.chitGroup.code}
                      </Link>
                      <div className="text-xs text-muted">
                        Ticket {installment.chitEnrollment.ticketNumber}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted">{installment.cycleNumber}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-foreground">
                        {formatStatus(installment.metrics.derivedStatus)}
                      </span>
                      {installment.metrics.isOverdue ? (
                        <div className="mt-2 text-xs font-medium text-rose-700">
                          {installment.metrics.daysOverdue} days overdue
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-muted">
                      <div>
                        {formatCurrency(installment.metrics.paidAmount)} /{" "}
                        {formatCurrency(installment.metrics.dueAmount)}
                      </div>
                      <div className="text-xs">
                        Outstanding{" "}
                        {formatCurrency(installment.metrics.outstandingAmount)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted">
                      {formatDate(installment.dueDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">Auction Results</h2>
          <p className="mt-2 text-sm text-muted">
            Cycles won by this member and the locked result calculation.
          </p>
          <div className="mt-6 space-y-4">
            {detail.auctionResults.length === 0 ? (
              <PageEmptyState
                title="No auction wins"
                description="Finalized auction wins for this member will appear here."
              />
            ) : (
              detail.auctionResults.map((auctionResult) => (
                <Link
                  key={auctionResult.id}
                  href={`/auctions/${auctionResult.id}` as Route}
                  className="block rounded-2xl border border-border bg-surface/40 p-4 transition hover:border-brand"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-foreground">
                        {auctionResult.chitGroup.code} | Cycle{" "}
                        {auctionResult.cycleNumber}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        Ticket {auctionResult.winningEnrollment?.ticketNumber ?? "-"} |{" "}
                        {formatDate(auctionResult.scheduledAt)}
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
                        Discount{" "}
                        {formatCurrency(
                          auctionResult.discountAmount?.toString() ??
                            auctionResult.winningBidAmount?.toString() ??
                            "0",
                        )}
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
            Winner disbursement records created from finalized auctions.
          </p>
          <div className="mt-6 space-y-4">
            {detail.payouts.length === 0 ? (
              <PageEmptyState
                title="No payouts"
                description="A pending payout is created automatically when this member wins an auction."
              />
            ) : (
              detail.payouts.map((payout) => (
                <Link
                  key={payout.id}
                  href={`/auctions/${payout.auctionCycle.id}` as Route}
                  className="block rounded-2xl border border-border bg-surface/40 p-4 transition hover:border-brand"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-foreground">
                        {formatCurrency(payout.netAmount.toString())}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {payout.chitGroup.code} | Cycle{" "}
                        {payout.auctionCycle.cycleNumber} | Ticket{" "}
                        {payout.chitEnrollment.ticketNumber}
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted">
                      <p>{formatStatus(payout.status)}</p>
                      <p>{payout.referenceNo ?? "No reference recorded"}</p>
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
          <h2 className="text-xl font-semibold text-foreground">Payment History</h2>
          <div className="mt-6 space-y-4">
            {detail.payments.length === 0 ? (
              <PageEmptyState
                title="No payments"
                description="Payment receipts for this member will be listed here."
              />
            ) : (
              detail.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="rounded-2xl border border-border bg-surface/40 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {formatCurrency(payment.amount.toString())}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {payment.chitGroup.code} | Cycle{" "}
                        {payment.installment.cycleNumber}
                      </p>
                    </div>
                    <p className="text-sm text-muted">{formatDate(payment.receivedOn)}</p>
                  </div>
                  <p className="mt-3 text-xs text-muted">
                    {formatStatus(payment.paymentMode)}
                    {payment.referenceNo ? ` | Ref ${payment.referenceNo}` : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">Recent Audit Logs</h2>
          <div className="mt-6 space-y-4">
            {detail.auditLogs.length === 0 ? (
              <PageEmptyState
                title="No audit activity"
                description="Member, enrollment, and payment audit entries will appear here."
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
        </article>
      </section>
    </div>
  );
}
