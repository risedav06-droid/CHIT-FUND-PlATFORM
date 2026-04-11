import type { Route } from "next";
import Link from "next/link";

import { FormFeedback } from "@/components/ui/form-feedback";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Input } from "@/components/ui/input";
import { PageEmptyState } from "@/components/ui/page-empty-state";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { readFeedback } from "@/lib/action-state";
import { formatDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import { authService } from "@/modules/auth/auth.service";
import { recordInstallmentPaymentAction } from "@/modules/collections/payments.actions";
import { paymentsService } from "@/modules/collections/payments.service";

type CollectionsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getFullName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ");
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export default async function CollectionsPage({
  searchParams,
}: CollectionsPageProps) {
  await authService.requirePermission("record_payment", "/collections");
  const feedback = readFeedback(await searchParams);
  const [installments, recentPayments] = await Promise.all([
    paymentsService.listPendingInstallments(),
    paymentsService.listRecentPayments(),
  ]);

  return (
    <div className="space-y-8">
      <section className="rounded-[1.75rem] border border-border bg-surface p-6 shadow-[0_20px_70px_-50px_rgba(31,27,23,0.5)]">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold text-foreground">Collections</h1>
          <p className="mt-2 text-sm leading-7 text-muted">
            Record installment receipts, normalize references, and monitor pending collection work.
          </p>
        </div>
      </section>

      <FormFeedback {...feedback} />

      <section className="grid gap-6 xl:grid-cols-[1.05fr_1.45fr]">
        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Record Installment Payment
            </h2>
            <p className="mt-2 text-sm text-muted">
              Select a pending installment and post the received amount. Bank transfer, UPI, cheque, and online receipts require a reference number.
            </p>
          </div>

          <form action={recordInstallmentPaymentAction} className="space-y-4 pb-20 lg:pb-0">
            <label className="space-y-2 text-sm font-medium text-foreground">
              <span>Pending installment</span>
              <Select name="installmentId" required defaultValue="">
                <option value="" disabled>
                  Select an installment
                </option>
                {installments.map((installment) => {
                  return (
                    <option key={installment.id} value={installment.id}>
                      {installment.chitGroup.code} |{" "}
                      {installment.chitEnrollment.member.memberCode} | Ticket{" "}
                      {installment.chitEnrollment.ticketNumber} | Cycle{" "}
                      {installment.cycleNumber} | Outstanding{" "}
                      {formatCurrency(installment.metrics.outstandingAmount)}
                    </option>
                  );
                })}
              </Select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Amount</span>
                <Input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Payment mode</span>
                <Select name="paymentMode" required defaultValue="CASH">
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="ONLINE">Online</option>
                  <option value="ADJUSTMENT">Adjustment</option>
                </Select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Received on</span>
                <Input name="receivedOn" type="date" required defaultValue={todayInputValue()} />
              </label>
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Reference number</span>
                <Input
                  name="referenceNo"
                  placeholder="Required for bank transfer, UPI, cheque, or online"
                />
              </label>
            </div>

            <label className="space-y-2 text-sm font-medium text-foreground">
              <span>Remarks</span>
              <Textarea
                name="remarks"
                placeholder="Receipt notes, branch memo, or payment context"
              />
            </label>

            <div className="sticky bottom-[calc(1rem+env(safe-area-inset-bottom))] rounded-[1.25rem] border border-border bg-white/95 p-3 backdrop-blur">
              <FormSubmitButton className="w-full justify-center py-3">
                Record payment
              </FormSubmitButton>
            </div>
          </form>
        </article>

        <div className="space-y-6">
          <article className="rounded-[1.75rem] border border-border bg-white p-6">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Pending Installments
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Installments currently awaiting collection or top-up.
                </p>
              </div>
              <div className="rounded-full bg-surface px-3 py-1 text-sm font-medium text-muted">
                {installments.length} pending
              </div>
            </div>

            {installments.length === 0 ? (
              <PageEmptyState
                title="No pending installments"
                description="Enroll a member into a chit group to generate collection work."
              />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="min-w-[760px] divide-y divide-border text-sm">
                  <thead className="bg-surface-strong/50 text-left text-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">Member</th>
                      <th className="px-4 py-3 font-medium">Group</th>
                      <th className="px-4 py-3 font-medium">Collection state</th>
                      <th className="px-4 py-3 font-medium">Balance</th>
                      <th className="px-4 py-3 font-medium">Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-white">
                    {installments.map((installment) => (
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
                            {installment.chitEnrollment.member.memberCode} | Ticket{" "}
                            {installment.chitEnrollment.ticketNumber}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-muted">
                          <Link
                            href={`/chit-funds/${installment.chitGroup.id}` as Route}
                            className="font-medium text-foreground hover:text-brand"
                          >
                            {installment.chitGroup.code}
                          </Link>
                          <div className="text-xs">{installment.chitGroup.name}</div>
                        </td>
                        <td className="px-4 py-4 text-muted">
                          <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-foreground">
                            {statusLabel(installment.metrics.derivedStatus)}
                          </span>
                          <div className="mt-2 text-xs">
                            Cycle {installment.cycleNumber}
                            {installment.metrics.isPartiallyPaid
                              ? " | partially paid"
                              : ""}
                          </div>
                          {installment.payments[0] ? (
                            <div className="mt-1 text-xs">
                              Last paid {formatDate(installment.payments[0].receivedOn)}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 text-muted">
                          <div className="font-medium text-foreground">
                            {formatCurrency(installment.metrics.outstandingAmount)}
                          </div>
                          <div className="text-xs">
                            Paid {formatCurrency(installment.metrics.paidAmount)} of{" "}
                            {formatCurrency(installment.metrics.dueAmount)}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-muted">
                          <div>{formatDate(installment.dueDate)}</div>
                          {installment.metrics.isOverdue ? (
                            <div className="text-xs font-medium text-rose-700">
                              {installment.metrics.daysOverdue} days overdue
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          <article className="rounded-[1.75rem] border border-border bg-white p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                Recent Payments
              </h2>
              <p className="mt-2 text-sm text-muted">
                Latest posted payments across chit groups.
              </p>
            </div>

            {recentPayments.length === 0 ? (
              <PageEmptyState
                title="No payment history yet"
                description="Recorded installment payments will appear here with their reference and receipt date."
              />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="min-w-[760px] divide-y divide-border text-sm">
                  <thead className="bg-surface-strong/50 text-left text-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">Member</th>
                      <th className="px-4 py-3 font-medium">Group</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Mode / Ref</th>
                      <th className="px-4 py-3 font-medium">Received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-white">
                    {recentPayments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-4 py-4">
                          <Link
                            href={`/members/${payment.member.id}` as Route}
                            className="font-medium text-foreground hover:text-brand"
                          >
                            {getFullName(payment.member.firstName, payment.member.lastName)}
                          </Link>
                          <div className="text-xs text-muted">
                            {payment.member.memberCode}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-muted">
                          <Link
                            href={`/chit-funds/${payment.chitGroup.id}` as Route}
                            className="font-medium text-foreground hover:text-brand"
                          >
                            {payment.chitGroup.code}
                          </Link>
                          <div className="text-xs">
                            Cycle {payment.installment.cycleNumber}
                          </div>
                        </td>
                        <td className="px-4 py-4 font-medium text-foreground">
                          {formatCurrency(payment.amount.toString())}
                        </td>
                        <td className="px-4 py-4 text-muted">
                          <div>{payment.paymentMode.replaceAll("_", " ")}</div>
                          <div className="text-xs">
                            {payment.referenceNo ?? "No reference"}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-muted">
                          {formatDate(payment.receivedOn)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}
