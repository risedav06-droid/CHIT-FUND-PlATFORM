import { PageEmptyState } from "@/components/ui/page-empty-state";
import { authService } from "@/modules/auth/auth.service";

export default async function CollectionsPage() {
  await authService.requireAuthenticatedSession("/collections");

  return (
    <div className="space-y-8">
      <section className="rounded-[var(--radius-card)] bg-[linear-gradient(135deg,rgba(245,243,240,0.94),rgba(255,255,255,0.82))] p-7 shadow-[var(--shadow-card)]">
        <h1 className="font-display text-[1.875rem] leading-tight text-[var(--text-primary)]">
          Collections
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
          Payment recording is being rewritten for Supabase-backed cycles and
          payments.
        </p>
      </section>

      <section className="rounded-[var(--radius-card)] bg-white p-8 shadow-[var(--shadow-card)]">
        <PageEmptyState
          title="No payments recorded yet for this cycle."
          description="The collections workflow is being reconnected to Supabase and will return with the new payment model."
        />
      </section>
    </div>
  );
}
