export const revalidate = 30;

import Link from "next/link";

import { ChitGroupCard } from "@/components/ui/chit-group-card";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardChitGroupsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-8">
        <section className="rounded-[var(--radius-card)] bg-white px-8 py-8 shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="editorial-label">Chit Group Register</p>
              <h1 className="mt-3 text-[1.875rem]">All active chit groups</h1>
            </div>
            <Link href="/login" className="primary-button">
              Sign in
            </Link>
          </div>
        </section>
        <EmptyState
          amberGlow
          eyebrow="A Quiet Start"
          title="No chits yet — create your first one and invite your group!"
          subtitle="Sign in to begin setting up your first group."
          actionLabel="Go to Login"
          actionHref="/login"
        />
      </div>
    );
  }

  await supabase.from("profiles").upsert(
    {
      id: user.id,
      phone: "",
      plan: "free",
    },
    { onConflict: "id", ignoreDuplicates: true },
  );

  const { data: groups, error } = await supabase
    .from("chit_groups")
    .select(`
      *,
      members (count)
    `)
    .eq("organiser_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Dashboard Chit Groups Error]", error.message);
  }

  const activeGroups = groups ?? [];

  return (
    <div className="space-y-8">
      <section className="rounded-[var(--radius-card)] bg-white px-8 py-8 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="editorial-label">Chit Group Register</p>
            <h1 className="mt-3 text-[1.875rem]">All active chit groups</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-text-body)]">
              Review every live group, jump into collection progress, and open a
              member-ready dashboard for each chit.
            </p>
          </div>
          <Link href="/dashboard/chit-groups/new" className="primary-button">
            Create New Chit
          </Link>
        </div>
      </section>

      {activeGroups.length === 0 ? (
        <EmptyState
          amberGlow
          eyebrow="A Quiet Start"
          title="No chits yet — create your first one and invite your group!"
          subtitle="You haven't created a chit yet. Start one and invite your group in minutes."
          actionLabel="Create Your First Chit"
          actionHref="/dashboard/chit-groups/new"
        />
      ) : (
        <div className="space-y-4">
          {activeGroups.map((group: any, index: number) => (
            <ChitGroupCard
              key={group.id}
              name={group.name}
              memberCount={Number(group.member_count ?? 0)}
              currentCycle={1}
              totalCycles={Number(group.duration_months ?? 12)}
              paidCount={0}
              totalMembers={Number(group.member_count ?? 0)}
              nextAuction="Next cycle will appear after your first member joins"
              badge={index % 2 === 0 ? "HIGH YIELD" : "STANDARD"}
              href={`/dashboard/chit-groups/${group.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
