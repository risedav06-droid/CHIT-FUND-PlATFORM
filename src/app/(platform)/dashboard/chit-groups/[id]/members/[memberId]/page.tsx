import Link from "next/link";

import { updateDashboardMemberAction } from "@/app/(platform)/dashboard/chit-groups/actions";
import { CopyLinkButton } from "@/components/ui/copy-link-button";
import { Input } from "@/components/ui/input";
import { PageEmptyState } from "@/components/ui/page-empty-state";
import { StatusChip } from "@/components/ui/status-chip";
import { authService } from "@/modules/auth/auth.service";
import { formatCurrency } from "@/lib/utils";
import { buildReminderMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import { getDashboardMemberDetail } from "@/utils/supabase/db";

type DashboardMemberDetailPageProps = {
  params: Promise<{ id: string; memberId: string }>;
};

export default async function DashboardMemberDetailPage({
  params,
}: DashboardMemberDetailPageProps) {
  const session = await authService.requireAuthenticatedSession("/dashboard");
  const { id, memberId } = await params;
  const { data } = await getDashboardMemberDetail(id, memberId, session.user.id);

  if (!data?.group || !data.member) {
    return (
      <PageEmptyState
        title="Member not found"
        description="We couldn’t find that member inside this chit group."
      />
    );
  }

  const group = data.group as any;
  const member = data.member as any;
  const payments = [...(member.payments ?? [])].sort(
    (a, b) => Number(a.payment_cycles?.cycle_number ?? 0) - Number(b.payment_cycles?.cycle_number ?? 0),
  );
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/member/${member.invite_token}`;
  const nextPayment = payments.find((payment: any) => payment.status !== "paid") ?? payments[0];
  const whatsappHref = buildWhatsAppLink(
    member.whatsapp_phone || member.phone,
    buildReminderMessage(
      member.name,
      group.name,
      Number(nextPayment?.amount_due ?? group.monthly_amount ?? 0),
      nextPayment?.payment_cycles?.due_date ?? "This month",
    ),
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[var(--radius-card)] bg-white px-8 py-8 shadow-[var(--shadow-card)]">
        <Link href={`/dashboard/chit-groups/${id}`} className="editorial-label">
          ← Back to chit group
        </Link>
        <h1 className="mt-4 text-[1.875rem]">{member.name}</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--color-text-body)]">
          Full payment history, portal access, and member contact details.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center gap-3">
            <StatusChip status={member.pot_taken ? "active" : "partial"}>
              {member.pot_taken ? "Pot Taken" : "Awaiting Pot"}
            </StatusChip>
            <span className="text-sm text-[var(--color-text-body)]">{member.phone}</span>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  {["Month", "Due Date", "Amount Due", "Amount Paid", "Mode", "Status"].map((heading) => (
                    <th
                      key={heading}
                      className="px-3 py-3 text-left text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((payment: any, index: number) => (
                  <tr
                    key={payment.id}
                    className={index % 2 === 0 ? "bg-[var(--color-surface-low)]" : "bg-white"}
                  >
                    <td className="px-3 py-4">Month {payment.payment_cycles?.cycle_number ?? index + 1}</td>
                    <td className="px-3 py-4">{payment.payment_cycles?.due_date ?? "—"}</td>
                    <td className="px-3 py-4">{formatCurrency(Number(payment.amount_due ?? 0))}</td>
                    <td className="px-3 py-4">{formatCurrency(Number(payment.amount_paid ?? 0))}</td>
                    <td className="px-3 py-4">{payment.payment_mode ?? "—"}</td>
                    <td className="px-3 py-4 capitalize">{payment.status ?? "unpaid"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <section className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
            <p className="editorial-label !text-[var(--color-text-muted)]">Invite Link</p>
            <p className="mt-3 break-all text-sm text-[var(--color-text-body)]">{inviteLink}</p>
            <div className="mt-4 flex flex-col gap-3">
              <CopyLinkButton value={inviteLink} label="Copy Invite Link" />
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="whatsapp-button w-full justify-center">
                WhatsApp Reminder
              </a>
            </div>
          </section>

          <form
            action={updateDashboardMemberAction}
            className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]"
          >
            <input type="hidden" name="chitGroupId" value={id} />
            <input type="hidden" name="memberId" value={memberId} />
            <p className="editorial-label !text-[var(--color-text-muted)]">Edit Member</p>
            <div className="mt-4 space-y-4">
              <Input name="name" defaultValue={member.name} placeholder="Member name" required />
              <Input name="phone" defaultValue={member.phone} placeholder="Phone number" required />
              <Input
                name="whatsappPhone"
                defaultValue={member.whatsapp_phone ?? ""}
                placeholder="WhatsApp number"
              />
            </div>
            <button type="submit" className="primary-button mt-5">
              Save Changes
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
