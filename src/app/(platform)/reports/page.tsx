import Link from "next/link";

import { PageEmptyState } from "@/components/ui/page-empty-state";
import { authService } from "@/modules/auth/auth.service";

export default async function ReportsPage() {
  await authService.requireAuthenticatedSession("/reports");

  return (
    <div className="space-y-8">
      <section className="rounded-[var(--radius-card)] bg-[linear-gradient(135deg,rgba(245,243,240,0.94),rgba(255,255,255,0.82))] p-7 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-[1.875rem] leading-tight text-[var(--text-primary)]">
              Financial Reports
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
              Report exports are being reconnected to Supabase. The core
              dashboard and chit flows are already live on the new stack.
            </p>
          </div>
          <Link href="/reports/pilot" className="ghost-button px-4 py-2 text-sm font-medium">
            View migration notes
          </Link>
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] bg-white p-8 shadow-[var(--shadow-card)]">
        <PageEmptyState
          title="Reports are being rebuilt for Supabase."
          description="Print views and financial exports will return after the reporting queries are migrated."
        />
      </section>
    </div>
  );
}
