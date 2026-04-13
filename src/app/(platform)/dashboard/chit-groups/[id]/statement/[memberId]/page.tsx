export const revalidate = 10;

import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";

import { PrintStatementButton } from "@/components/dashboard/print-statement-button";
import { authService } from "@/modules/auth/auth.service";
import { formatCurrency } from "@/lib/utils";
import { getStatementData } from "@/utils/supabase/db";

type StatementPageProps = {
  params: Promise<{ id: string; memberId: string }>;
};

export default async function StatementPage({ params }: StatementPageProps) {
  const session = await authService.requireAuthenticatedSession("/dashboard");
  const { id, memberId } = await params;
  const { data } = await getStatementData(id, memberId, session.user.id);

  if (!data?.group || !data.member) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-8 print:px-0 print:py-0">
      <section className="rounded-[var(--radius-card)] bg-white p-8 shadow-[var(--shadow-card)] print:shadow-none">
        <div className="print:hidden">
          <Link href={`/dashboard/chit-groups/${id}`} className="editorial-label">
            Back to chit group
          </Link>
        </div>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-[1.5rem] italic text-[var(--color-primary)]">
              ChitMate
            </p>
            <h1 className="mt-2 text-[1.875rem]">Member Statement</h1>
            <p className="mt-2 text-sm text-[var(--color-text-body)]">
              Generated on {format(new Date(), "do MMMM yyyy")}
            </p>
          </div>
          <PrintStatementButton />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div>
            <p className="editorial-label !text-[var(--color-text-muted)]">Member</p>
            <p className="mt-2 text-sm">{data.member.name}</p>
            <p className="text-sm text-[var(--color-text-body)]">{data.member.phone}</p>
          </div>
          <div>
            <p className="editorial-label !text-[var(--color-text-muted)]">Chit Name</p>
            <p className="mt-2 text-sm">{data.group.name}</p>
          </div>
          <div>
            <p className="editorial-label !text-[var(--color-text-muted)]">Managed By</p>
            <p className="mt-2 text-sm">{session.user.name}</p>
          </div>
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                {["Month", "Due Date", "Amount Due", "Amount Paid", "Mode", "Status"].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="px-3 py-3 text-left text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {(data.payments as any[]).map((payment, index) => (
                <tr
                  key={payment.id}
                  className={index % 2 === 0 ? "bg-[var(--color-surface-low)]" : "bg-white"}
                >
                  <td className="px-3 py-4">Month {payment.payment_cycles?.cycle_number ?? index + 1}</td>
                  <td className="px-3 py-4">
                    {payment.payment_cycles?.due_date
                      ? format(new Date(payment.payment_cycles.due_date), "do MMM yyyy")
                      : "—"}
                  </td>
                  <td className="px-3 py-4">{formatCurrency(Number(payment.amount_due ?? 0))}</td>
                  <td className="px-3 py-4">{formatCurrency(Number(payment.amount_paid ?? 0))}</td>
                  <td className="px-3 py-4">{payment.payment_mode ?? "—"}</td>
                  <td className="px-3 py-4">{payment.status ?? "unpaid"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-8 text-sm text-[var(--color-text-body)]">
          {session.user.name} • Managed via ChitMate
        </p>
      </section>
    </main>
  );
}
