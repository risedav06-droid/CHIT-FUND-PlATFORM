import { PageEmptyState } from "@/components/ui/page-empty-state";
import { authService } from "@/modules/auth/auth.service";

export default async function MembersPage() {
  await authService.requireAuthenticatedSession("/members");

  return (
    <div className="space-y-8">
      <section className="rounded-[var(--radius-card)] bg-[linear-gradient(135deg,rgba(245,243,240,0.94),rgba(255,255,255,0.82))] p-7 shadow-[var(--shadow-card)]">
        <h1 className="font-display text-[1.875rem] leading-tight text-[var(--text-primary)]">
          Member Directory
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
          Member management is moving to the new Supabase data layer. This
          screen will be reconnected next.
        </p>
      </section>

      <section className="rounded-[var(--radius-card)] bg-white p-8 shadow-[var(--shadow-card)]">
        <PageEmptyState
          title="Add your first member to get started."
          description="The full member directory is being rewritten with Supabase and will be available again soon."
        />
      </section>
    </div>
  );
}
