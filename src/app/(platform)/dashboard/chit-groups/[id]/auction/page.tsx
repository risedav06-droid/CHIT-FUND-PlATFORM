export const revalidate = 10;

import { notFound } from "next/navigation";

import { AuctionWorkspace } from "@/components/dashboard/auction-workspace";
import { authService } from "@/modules/auth/auth.service";
import { getAuctionWorkspace } from "@/utils/supabase/db";

type AuctionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ChitGroupAuctionPage({ params }: AuctionPageProps) {
  const session = await authService.requireAuthenticatedSession("/dashboard");
  const { id } = await params;
  const { data } = await getAuctionWorkspace(id, session.user.id);

  if (!data?.group || !data.currentCycle) {
    notFound();
  }

  return (
    <AuctionWorkspace
      groupId={data.group.id}
      cycleId={data.currentCycle.id}
      cycleNumber={Number(data.currentCycle.cycle_number ?? 1)}
      durationMonths={Number(data.group.duration_months ?? 1)}
      monthlyAmount={Number(data.group.monthly_amount ?? 0)}
      memberCount={Number(data.group.member_count ?? 0)}
      members={(data.members as any[]).map((member) => ({ id: member.id, name: member.name }))}
      existingAuction={
        data.auction
          ? {
              winner_id: data.auction.winner_id,
              winning_discount: Number(data.auction.winning_discount ?? 0),
              winner_payout: Number(data.auction.winner_payout ?? 0),
              foreman_commission: Number(data.auction.foreman_commission ?? 0),
              dividend_distributed: Number(data.auction.dividend_distributed ?? 0),
            }
          : null
      }
    />
  );
}
