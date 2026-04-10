import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FormFeedback } from "@/components/ui/form-feedback";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Input } from "@/components/ui/input";
import { PageEmptyState } from "@/components/ui/page-empty-state";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import { Textarea } from "@/components/ui/textarea";
import { readFeedback } from "@/lib/action-state";
import { formatDate, formatDateTime } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import { authService } from "@/modules/auth/auth.service";
import {
  finalizeAuctionAction,
  recordBidAction,
} from "@/modules/auctions/auctions.actions";
import { auctionsService } from "@/modules/auctions/auctions.service";
import { updatePayoutStatusAction } from "@/modules/payouts/payouts.actions";

type AuctionCycleDetailPageProps = {
  params: Promise<{
    cycleId: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getFullName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ");
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export default async function AuctionCycleDetailPage({
  params,
  searchParams,
}: AuctionCycleDetailPageProps) {
  const [{ cycleId }, rawSearchParams] = await Promise.all([params, searchParams]);
  await authService.requirePermission("manage_auctions", `/auctions/${cycleId}`);
  const feedback = readFeedback(rawSearchParams);
  const detail = await auctionsService.getAuctionCycleDetail(cycleId);

  if (!detail) {
    notFound();
  }

  const topBid = detail.bids[0];

  return (
    <div className="space-y-8">
      <section className="rounded-[1.75rem] border border-border bg-surface p-6">
        <Link href="/auctions" className="text-sm font-medium text-brand">
          Back to auctions
        </Link>
        <div className="mt-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-medium text-muted">
              {detail.cycle.chitGroup.code} | Cycle {detail.cycle.cycleNumber}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">
              Monthly Auction
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
              Scheduled {formatDate(detail.cycle.scheduledAt)} for{" "}
              <Link
                href={`/chit-funds/${detail.cycle.chitGroup.id}` as Route}
                className="font-semibold text-brand"
              >
                {detail.cycle.chitGroup.name}
              </Link>
              . Finalized cycles are locked for bid and winner changes.
            </p>
          </div>
          <span className="w-fit rounded-full bg-white px-4 py-2 text-sm font-semibold text-foreground">
            {formatStatus(detail.cycle.status)}
          </span>
        </div>
      </section>

      <FormFeedback {...feedback} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Gross prize"
          value={formatCurrency(detail.cycle.chitGroup.prizeAmount.toString())}
          hint={`${detail.cycle.chitGroup.ticketCount} tickets`}
        />
        <StatCard
          label="Eligible"
          value={detail.eligibleEnrollments.length}
          hint="Tickets allowed to bid"
        />
        <StatCard
          label="Ineligible"
          value={detail.ineligibleEnrollments.length}
          hint="Tickets with operating blockers"
        />
        <StatCard
          label="Bids"
          value={detail.bids.length}
          hint={topBid ? `Top bid ${formatCurrency(topBid.amount.toString())}` : "No bids yet"}
        />
        <StatCard
          label="Payout"
          value={detail.payout ? formatStatus(detail.payout.status) : "Not created"}
          hint={detail.payout ? formatCurrency(detail.payout.netAmount.toString()) : "Created on finalization"}
        />
      </section>

      {detail.result ? (
        <section className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-6">
          <h2 className="text-xl font-semibold text-emerald-950">
            Auction Result
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <StatCard
              label="Gross prize"
              value={formatCurrency(detail.result.grossPrizeAmount)}
              hint="Chit group prize"
            />
            <StatCard
              label="Discount"
              value={formatCurrency(detail.result.discountAmount)}
              hint="Winning bid / deduction"
            />
            <StatCard
              label="Net payout"
              value={formatCurrency(detail.result.netPrizeAmount)}
              hint="Amount payable to winner"
            />
            <StatCard
              label="Dividend"
              value={formatCurrency(detail.result.dividendAmount)}
              hint="Indicative member dividend"
            />
          </div>
          {detail.cycle.winningEnrollment ? (
            <p className="mt-5 text-sm text-emerald-900">
              Winner:{" "}
              <Link
                href={`/members/${detail.cycle.winningEnrollment.member.id}` as Route}
                className="font-semibold underline"
              >
                {getFullName(
                  detail.cycle.winningEnrollment.member.firstName,
                  detail.cycle.winningEnrollment.member.lastName,
                )}
              </Link>
              {" "}ticket {detail.cycle.winningEnrollment.ticketNumber}
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">Record Manual Bid</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Enter a discount bid for an eligible ticket. Each ticket can hold one
            bid in this cycle.
          </p>

          {detail.isLocked ? (
            <div className="mt-6">
              <PageEmptyState
                title="Cycle is locked"
                description="This auction has been finalized or closed. Bid entry is no longer available."
              />
            </div>
          ) : detail.bidEntryEnrollments.length === 0 ? (
            <div className="mt-6">
              <PageEmptyState
                title="No bid-entry tickets"
                description="All eligible tickets either have a bid or are blocked by an operating rule."
              />
            </div>
          ) : (
            <form action={recordBidAction} className="mt-6 space-y-4 pb-20 lg:pb-0">
              <input type="hidden" name="auctionCycleId" value={detail.cycle.id} />
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Eligible enrollment</span>
                <Select name="chitEnrollmentId" required defaultValue="">
                  <option value="" disabled>
                    Select member / ticket
                  </option>
                  {detail.bidEntryEnrollments.map(({ enrollment, memberName }) => (
                    <option key={enrollment.id} value={enrollment.id}>
                      {enrollment.member.memberCode} | {memberName} | Ticket{" "}
                      {enrollment.ticketNumber}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Bid discount amount</span>
                <Input name="amount" type="number" step="0.01" min="0.01" required />
              </label>

              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Remarks</span>
                <Textarea name="remarks" placeholder="Bid slip, caller, or round note" />
              </label>

              <div className="sticky bottom-4 rounded-[1.25rem] border border-border bg-white/95 p-3 backdrop-blur">
                <FormSubmitButton className="w-full justify-center py-3">
                  Record bid
                </FormSubmitButton>
              </div>
            </form>
          )}
        </article>

        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">Finalize Winner</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Finalization stores the winner, prize calculation, member dividend,
            payout draft, and locks the cycle.
          </p>

          {detail.isLocked ? (
            <div className="mt-6">
              <PageEmptyState
                title="Finalization complete"
                description="Winner, calculation, and payout draft have already been written for this cycle."
              />
            </div>
          ) : detail.bids.length === 0 ? (
            <div className="mt-6">
              <PageEmptyState
                title="No bids yet"
                description="Record at least one bid before finalizing the winner."
              />
            </div>
          ) : (
            <form action={finalizeAuctionAction} className="mt-6 space-y-4 pb-20 lg:pb-0">
              <input type="hidden" name="auctionCycleId" value={detail.cycle.id} />
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Winning bid</span>
                <Select name="winningBidId" required defaultValue={topBid?.id}>
                  {detail.bids.map((bid) => (
                    <option key={bid.id} value={bid.id}>
                      {bid.chitEnrollment.member.memberCode} | Ticket{" "}
                      {bid.chitEnrollment.ticketNumber} | Discount{" "}
                      {formatCurrency(bid.amount.toString())}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Finalization notes</span>
                <Textarea
                  name="notes"
                  placeholder="Board approval, auction room note, or manual override explanation"
                />
              </label>

              <div className="sticky bottom-4 rounded-[1.25rem] border border-border bg-white/95 p-3 backdrop-blur">
                <FormSubmitButton className="w-full justify-center py-3">
                  Finalize auction
                </FormSubmitButton>
              </div>
            </form>
          )}
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">Bid Register</h2>
          <div className="mt-6 space-y-4">
            {detail.bids.length === 0 ? (
              <PageEmptyState
                title="No bid history"
                description="Manual bids entered for this cycle will appear here."
              />
            ) : (
              detail.bids.map((bid) => (
                <div
                  key={bid.id}
                  className="rounded-2xl border border-border bg-surface/40 p-4"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <p className="font-semibold text-foreground">
                        {getFullName(
                          bid.chitEnrollment.member.firstName,
                          bid.chitEnrollment.member.lastName,
                        )}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {bid.chitEnrollment.member.memberCode} | Ticket{" "}
                        {bid.chitEnrollment.ticketNumber} |{" "}
                        {formatDateTime(bid.createdAt)}
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-foreground">
                      {formatCurrency(bid.amount.toString())}
                    </p>
                  </div>
                  {bid.remarks ? (
                    <p className="mt-3 text-sm text-muted">{bid.remarks}</p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">Payout Tracking</h2>
          {detail.payout ? (
            <div className="mt-6 space-y-5">
              <div className="rounded-2xl border border-border bg-surface/40 p-4 text-sm text-muted">
                <div className="flex justify-between gap-4">
                  <span>Status</span>
                  <span className="font-semibold text-foreground">
                    {formatStatus(detail.payout.status)}
                  </span>
                </div>
                <div className="mt-3 flex justify-between gap-4">
                  <span>Net payout</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(detail.payout.netAmount.toString())}
                  </span>
                </div>
                <div className="mt-3 flex justify-between gap-4">
                  <span>Method / ref</span>
                  <span className="text-right">
                    {detail.payout.method ? formatStatus(detail.payout.method) : "Not paid"}
                    {detail.payout.referenceNo ? ` | ${detail.payout.referenceNo}` : ""}
                  </span>
                </div>
              </div>

              {["PAID", "DISBURSED", "REJECTED", "CANCELLED"].includes(detail.payout.status) ? (
                <PageEmptyState
                  title="Payout is terminal"
                  description="No further payout status changes are available in v1."
                />
              ) : (
                <form action={updatePayoutStatusAction} className="space-y-4 pb-20 lg:pb-0">
                  <input type="hidden" name="payoutId" value={detail.payout.id} />
                  <input type="hidden" name="auctionCycleId" value={detail.cycle.id} />
                  <label className="space-y-2 text-sm font-medium text-foreground">
                    <span>Next payout status</span>
                    <Select name="status" required defaultValue="">
                      <option value="" disabled>
                        Select status
                      </option>
                      {detail.payout.status === "PENDING" ? (
                        <option value="APPROVED">Approved</option>
                      ) : null}
                      {detail.payout.status === "APPROVED" ? (
                        <option value="PAID">Paid</option>
                      ) : null}
                      <option value="REJECTED">Rejected</option>
                    </Select>
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 text-sm font-medium text-foreground">
                      <span>Payout method</span>
                      <Select name="method" defaultValue="">
                        <option value="">Select when paid</option>
                        <option value="CASH">Cash</option>
                        <option value="BANK_TRANSFER">Bank transfer</option>
                        <option value="UPI">UPI</option>
                        <option value="CHEQUE">Cheque</option>
                        <option value="ONLINE">Online</option>
                      </Select>
                    </label>
                    <label className="space-y-2 text-sm font-medium text-foreground">
                      <span>Paid on</span>
                      <Input name="paidOn" type="date" defaultValue={todayInputValue()} />
                    </label>
                  </div>

                  <label className="space-y-2 text-sm font-medium text-foreground">
                    <span>Payout reference</span>
                    <Input name="referenceNo" placeholder="Bank / UPI / cheque reference" />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-foreground">
                    <span>Proof or acknowledgment placeholder</span>
                    <Input name="proofUrl" placeholder="Receipt URL, file note, or acknowledgment ID" />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-foreground">
                    <span>Remarks</span>
                    <Textarea name="remarks" placeholder="Approval, payout, or bank note" />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-foreground">
                    <span>Rejection reason</span>
                    <Textarea name="rejectionReason" placeholder="Required only when rejecting" />
                  </label>

                  <div className="sticky bottom-4 rounded-[1.25rem] border border-border bg-white/95 p-3 backdrop-blur">
                    <FormSubmitButton className="w-full justify-center py-3">
                      Update payout
                    </FormSubmitButton>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="mt-6">
              <PageEmptyState
                title="No payout yet"
                description="Finalize the auction winner to create a pending payout record."
              />
            </div>
          )}
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">Eligible Tickets</h2>
          <div className="mt-6 grid gap-3">
            {detail.eligibleEnrollments.length === 0 ? (
              <PageEmptyState
                title="No eligible tickets"
                description="Resolve the ineligible reasons before entering auction bids."
              />
            ) : (
              detail.eligibleEnrollments.map(({ enrollment, memberName, hasBid }) => (
                <div
                  key={enrollment.id}
                  className="rounded-2xl border border-border bg-surface/40 p-4 text-sm"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">{memberName}</p>
                      <p className="mt-1 text-muted">
                        {enrollment.member.memberCode} | Ticket {enrollment.ticketNumber}
                      </p>
                    </div>
                    <span className="text-muted">{hasBid ? "Bid recorded" : "Can bid"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">
            Ineligible Tickets
          </h2>
          <div className="mt-6 grid gap-3">
            {detail.ineligibleEnrollments.length === 0 ? (
              <PageEmptyState
                title="No blockers"
                description="Every enrolled ticket currently passes v1 auction eligibility rules."
              />
            ) : (
              detail.ineligibleEnrollments.map(({ enrollment, memberName, reasons, overdueAmount }) => (
                <div
                  key={enrollment.id}
                  className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-900"
                >
                  <p className="font-semibold">{memberName}</p>
                  <p className="mt-1">
                    {enrollment.member.memberCode} | Ticket {enrollment.ticketNumber}
                    {overdueAmount > 0 ? ` | Overdue ${formatCurrency(overdueAmount)}` : ""}
                  </p>
                  <p className="mt-3 text-rose-800">{reasons.join(" ")}</p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="rounded-[1.75rem] border border-border bg-white p-6">
        <h2 className="text-xl font-semibold text-foreground">Auction Audit History</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {detail.auditLogs.length === 0 ? (
            <PageEmptyState
              title="No audit activity"
              description="Bid, auction finalization, and payout events will appear here."
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
