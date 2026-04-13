import Link from "next/link";

import { PageEmptyState } from "@/components/ui/page-empty-state";
import { authService } from "@/modules/auth/auth.service";

type ExportViewPageProps = {
  params: Promise<{ view: string }>;
};

export default async function ExportViewPage({ params }: ExportViewPageProps) {
  const { view } = await params;
  await authService.requireAuthenticatedSession(`/exports/${view}`);

  return (
    <div className="space-y-8">
      <section className="rounded-[var(--radius-card)] bg-[linear-gradient(135deg,rgba(245,243,240,0.94),rgba(255,255,255,0.82))] p-7 shadow-[var(--shadow-card)]">
        <Link href="/reports" className="editorial-label">
          Back to reports
        </Link>
        <h1 className="mt-6 font-display text-[1.875rem] leading-tight text-[var(--text-primary)]">
          Export view
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
          Export views are being rebuilt for the Supabase reporting layer.
        </p>
      </section>

      <section className="rounded-[var(--radius-card)] bg-white p-8 shadow-[var(--shadow-card)]">
        <PageEmptyState
          title="This export is coming back soon."
          description="Reporting queries are being migrated to Supabase before this print-safe export is restored."
        />
      </section>
    </div>
  );
}
