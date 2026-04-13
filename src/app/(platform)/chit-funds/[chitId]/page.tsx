import Link from "next/link";

import { PageEmptyState } from "@/components/ui/page-empty-state";
import { authService } from "@/modules/auth/auth.service";

type ChitGroupDetailPageProps = {
  params: Promise<{ chitId: string }>;
};

export default async function ChitGroupDetailPage({
  params,
}: ChitGroupDetailPageProps) {
  const { chitId } = await params;
  await authService.requireAuthenticatedSession(`/chit-funds/${chitId}`);

  return (
    <div className="space-y-8">
      <section className="rounded-[var(--radius-card)] bg-[linear-gradient(135deg,rgba(245,243,240,0.94),rgba(255,255,255,0.82))] p-7 shadow-[var(--shadow-card)]">
        <Link href="/chit-funds" className="editorial-label">
          Back to legacy chit funds
        </Link>
        <h1 className="mt-6 font-display text-[1.875rem] leading-tight text-[var(--text-primary)]">
          Legacy chit detail
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
          This older detail view has been retired. The live organiser workflow
          now runs through the new chit group pages.
        </p>
      </section>

      <section className="rounded-[var(--radius-card)] bg-white p-8 shadow-[var(--shadow-card)]">
        <PageEmptyState
          title="Open this group from the new chit group flow."
          description="The Supabase migration keeps the current organiser experience under Chit Groups."
        />
      </section>
    </div>
  );
}
