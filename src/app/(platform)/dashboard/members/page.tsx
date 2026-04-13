export const revalidate = 30;

import { MemberDirectoryTable } from "@/components/dashboard/member-directory-table";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardMembersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="rounded-[var(--radius-card)] bg-white p-8 shadow-[var(--shadow-card)]">
        Please sign in again.
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

  const { data: members } = await supabase
    .from("members")
    .select(`
      *,
      chit_groups!inner (
        id,
        name,
        organiser_id
      )
    `)
    .eq("chit_groups.organiser_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return (
    <MemberDirectoryTable
      members={(members ?? []).map((member: any) => ({
        ...member,
        chit_groups: Array.isArray(member.chit_groups) ? member.chit_groups[0] : member.chit_groups,
      }))}
    />
  );
}
