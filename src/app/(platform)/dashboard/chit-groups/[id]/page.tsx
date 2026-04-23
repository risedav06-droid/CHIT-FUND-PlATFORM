export const revalidate = 10;

import { notFound } from "next/navigation";
import { differenceInCalendarDays, format } from "date-fns";

import { DashboardChitGroupDetailClient } from "@/components/dashboard/chit-group-detail-client";
import { authService } from "@/modules/auth/auth.service";
import { getDashboardChitGroupDetail } from "@/utils/supabase/db";

type ChitGroupDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DashboardChitGroupDetailPage({
  params,
}: ChitGroupDetailPageProps) {
  const session = await authService.requireAuthenticatedSession("/dashboard");
  const { id } = await params;
  const { data } = await getDashboardChitGroupDetail(id, session.user.id);

  if (!data?.group) {
    notFound();
  }

  const group = data.group as any;
  const paymentCycles = (data.paymentCycles as any[]) ?? [];
  const members = ((data.members as any[]) ?? []).map((member) => {
    const payments = [...(member.payments ?? [])].sort(
      (a, b) => Number(a.payment_cycles?.cycle_number ?? 0) - Number(b.payment_cycles?.cycle_number ?? 0),
    );
    return { ...member, payments };
  });
  const currentCycle =
    paymentCycles.find((cycle) => cycle.status !== "completed") ?? paymentCycles[0] ?? null;
  const currentCycleNumber = Number(currentCycle?.cycle_number ?? 1);
  const monthLabel = currentCycle?.due_date
    ? format(new Date(currentCycle.due_date), "MMMM").toUpperCase()
    : "CURRENT CYCLE";
  const monthlyAmount = Number(group.monthly_amount ?? 0);
  const potValue = monthlyAmount * Number(group.member_count ?? 0);
  const endDate = new Date(group.start_date);
  endDate.setMonth(endDate.getMonth() + Number(group.duration_months ?? 0));
  const endDateLabel = endDate.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  const currentMemberRows = members.map((member) => {
    const currentPayment =
      member.payments.find(
        (payment: any) => Number(payment.payment_cycles?.cycle_number ?? 0) === currentCycleNumber,
      ) ?? member.payments[0];

    return {
      member,
      currentPayment,
    };
  });
  const nextAuctionDate = currentCycle?.due_date
    ? format(new Date(currentCycle.due_date), "do MMMM yyyy")
    : "Schedule pending";
  const daysUntilDue = currentCycle?.due_date
    ? differenceInCalendarDays(new Date(currentCycle.due_date), new Date())
    : null;
  const defaulterCount = members.filter((member) => {
    const unpaidCycles = (member.payments ?? []).filter(
      (payment: any) => payment.status !== "paid",
    ).length;

    return unpaidCycles >= 2;
  }).length;

  return (
    <DashboardChitGroupDetailClient
      group={group}
      monthLabel={monthLabel}
      monthlyAmount={monthlyAmount}
      potValue={potValue}
      endDateLabel={endDateLabel}
      members={members}
      paymentCycles={paymentCycles}
      currentCycleId={currentCycle?.id ?? null}
      currentCycleNumber={currentCycleNumber}
      currentMemberRows={currentMemberRows.map(({ member, currentPayment }) => ({
        member: {
          id: member.id,
          name: member.name,
          phone: member.phone,
          whatsapp_phone: member.whatsapp_phone,
          invite_token: member.invite_token,
          pot_taken: Boolean(member.pot_taken),
        },
        currentPayment: currentPayment
          ? {
              id: currentPayment.id,
              amount_due: Number(currentPayment.amount_due ?? monthlyAmount),
              amount_paid: Number(currentPayment.amount_paid ?? 0),
              status: currentPayment.status ?? "unpaid",
            }
          : null,
      }))}
      nextAuctionDate={nextAuctionDate}
      daysUntilDue={daysUntilDue}
      defaulterCount={defaulterCount}
    />
  );
}
