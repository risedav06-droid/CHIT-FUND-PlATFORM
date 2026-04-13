import Link from "next/link";

import { authService } from "@/modules/auth/auth.service";

export default async function PilotReadinessPage() {
  await authService.requireAuthenticatedSession("/reports/pilot");

  return (
    <div className="space-y-8">
      <section className="rounded-[var(--radius-card)] bg-[linear-gradient(135deg,rgba(245,243,240,0.94),rgba(255,255,255,0.82))] p-7 shadow-[var(--shadow-card)]">
        <Link href="/reports" className="editorial-label">
          Back to reports
        </Link>
        <h1 className="mt-6 font-display text-[1.875rem] leading-tight text-[var(--text-primary)]">
          Migration Notes
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
          The old pilot-readiness checks were tied to earlier data models and
          have been removed during the Supabase migration.
        </p>
      </section>

      <section className="rounded-[var(--radius-card)] bg-white p-8 shadow-[var(--shadow-card)]">
        <div className="space-y-4 text-sm leading-7 text-[var(--text-body)]">
          <p>Core organiser and member routes now use Supabase-only auth and data helpers.</p>
          <p>Reports, exports, and operational audits will come back once their SQL views are finalized.</p>
        </div>
      </section>
    </div>
  );
}
