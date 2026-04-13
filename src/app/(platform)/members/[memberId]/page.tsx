import Link from "next/link";

import { PageEmptyState } from "@/components/ui/page-empty-state";
import { authService } from "@/modules/auth/auth.service";

type MemberDetailPageProps = {
  params: Promise<{ memberId: string }>;
};

export default async function MemberDetailPage({
  params,
}: MemberDetailPageProps) {
  const { memberId } = await params;
  await authService.requireAuthenticatedSession(`/members/${memberId}`);

  return (
    <div className="space-y-8">
      <section className="rounded-[var(--radius-card)] bg-[linear-gradient(135deg,rgba(245,243,240,0.94),rgba(255,255,255,0.82))] p-7 shadow-[var(--shadow-card)]">
        <Link href="/members" className="editorial-label">
          Back to members
        </Link>
        <h1 className="mt-6 font-display text-[1.875rem] leading-tight text-[var(--text-primary)]">
          Member details
        </h1>
        <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
          This profile view is being reconnected to Supabase and will return in
          the next migration pass.
        </p>
      </section>

      <section className="rounded-[var(--radius-card)] bg-white p-8 shadow-[var(--shadow-card)]">
        <PageEmptyState
          title="Member details are coming back soon."
          description="We removed the old profile logic so this screen can be rebuilt cleanly on Supabase."
        />
      </section>
    </div>
  );
}
