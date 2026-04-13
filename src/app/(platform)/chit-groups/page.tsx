import Link from "next/link";

import { ChitGroupCard } from "@/components/ui/chit-group-card";
import { PageEmptyState } from "@/components/ui/page-empty-state";
import { authService } from "@/modules/auth/auth.service";
import { getChitGroups } from "@/utils/supabase/db";

export default async function ChitGroupsPage() {
  const session = await authService.requireAuthenticatedSession("/chit-groups");
  const { data: groups } = await getChitGroups(session.user.id);
  const activeGroups = groups ?? [];

  return (
    <main className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="editorial-label">Chit groups</p>
          <h1 className="mt-3">All active funds</h1>
        </div>
        <Link href="/dashboard" className="ghost-button">
          Back to dashboard
        </Link>
      </div>

      {activeGroups.length === 0 ? (
        <PageEmptyState
          title="No chits yet — create your first one and invite your group!"
          description="You haven't created a chit yet. Start one and invite your group in minutes."
          actionLabel="Create Your First Chit"
          actionHref={"/chit-groups" as const}
        />
      ) : (
        <div className="space-y-4">
          {activeGroups.map((group: any, index: number) => (
            <ChitGroupCard
              key={group.id}
              name={group.name}
              memberCount={group.member_count}
              currentCycle={index + 1}
              totalCycles={group.duration_months}
              paidCount={0}
              totalMembers={group.member_count}
              nextAuction="Schedule pending"
              badge={index % 2 === 0 ? "HIGH YIELD" : "STANDARD"}
              href={`/chit-groups/${group.id}`}
            />
          ))}
        </div>
      )}
    </main>
  );
}
