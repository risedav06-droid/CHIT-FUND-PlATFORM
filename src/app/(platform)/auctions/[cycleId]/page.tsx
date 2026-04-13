import Link from "next/link";

import { PageEmptyState } from "@/components/ui/page-empty-state";
import { authService } from "@/modules/auth/auth.service";

type AuctionCycleDetailPageProps = {
  params: Promise<{ cycleId: string }>;
};

export default async function AuctionCycleDetailPage({
  params,
}: AuctionCycleDetailPageProps) {
  const { cycleId } = await params;
  await authService.requireAuthenticatedSession(`/auctions/${cycleId}`);

  return (
    <div className="space-y-8">
      <section className="rounded-[var(--radius-card)] bg-[linear-gradient(135deg,rgba(245,243,240,0.94),rgba(255,255,255,0.82))] p-7 shadow-[var(--shadow-card)]">
        <Link href="/auctions" className="editorial-label">
          Back to auctions
        </Link>
        <h1 className="mt-6 font-display text-[1.875rem] leading-tight text-[var(--text-primary)]">
          Auction details
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
          This legacy auction detail view has been retired during the Supabase
          migration.
        </p>
      </section>

      <section className="rounded-[var(--radius-card)] bg-white p-8 shadow-[var(--shadow-card)]">
        <PageEmptyState
          title="Open the auction from its chit group instead."
          description="The new auction workflow lives under each chit group and uses the Supabase payment-cycle model."
        />
      </section>
    </div>
  );
}
