'use client';

import Link from "next/link";
import { useMemo, useState } from "react";

import { MemberInviteActions } from "@/components/dashboard/member-invite-actions";
import { EmptyState } from "@/components/ui/empty-state";

type MemberDirectoryTableProps = {
  members: Array<{
    id: string;
    name: string;
    phone: string;
    pot_taken: boolean;
    invite_token: string;
    chit_groups: {
      id: string;
      name: string;
    };
  }>;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function MemberDirectoryTable({ members }: MemberDirectoryTableProps) {
  const [query, setQuery] = useState("");

  const filteredMembers = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return members;
    }

    return members.filter(
      (member) =>
        member.name.toLowerCase().includes(normalized) ||
        member.phone.toLowerCase().includes(normalized),
    );
  }, [members, query]);

  return (
    <div className="space-y-6">
      <section className="rounded-[var(--radius-card)] bg-white px-8 py-8 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="editorial-label">Member Directory</p>
            <h1 className="mt-3 text-[1.875rem]">All members in your portfolio</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-text-body)]">
              Search by name or phone number, copy invite links, and jump straight
              into the right chit group.
            </p>
          </div>
          <div className="w-full max-w-md">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or phone"
              className="recessed-input h-11 w-full"
            />
          </div>
        </div>
      </section>

      {filteredMembers.length === 0 ? (
        <EmptyState
          title="No members yet. Add members from inside a chit group."
          subtitle="Once your first members are added, they’ll appear here with invite links and payment history shortcuts."
        />
      ) : (
        <section className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
          <div className="hidden grid-cols-[1.3fr_0.9fr_0.9fr_0.6fr_1.1fr_0.8fr] px-4 pb-2 md:grid">
            {["Member", "Phone", "Chit Group", "Pot Taken", "Invite Link", "Actions"].map(
              (heading) => (
                <p key={heading} className="editorial-label !text-[var(--color-text-muted)]">
                  {heading}
                </p>
              ),
            )}
          </div>
          <div className="space-y-3">
            {filteredMembers.map((member, index) => (
              <div
                key={member.id}
                className={`grid gap-4 rounded-[var(--radius-card)] p-4 md:grid-cols-[1.3fr_0.9fr_0.9fr_0.6fr_1.1fr_0.8fr] md:items-center ${
                  index % 2 === 0 ? "bg-[var(--color-surface-low)]" : "bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-primary-container)] text-sm font-semibold text-white">
                    {initials(member.name)}
                  </div>
                  <p className="font-medium text-[var(--color-text-primary)]">{member.name}</p>
                </div>
                <p className="text-sm text-[var(--color-text-body)]">{member.phone}</p>
                <div>
                  <span className="ledger-chip bg-[rgba(1,45,29,0.08)] text-[var(--color-primary)]">
                    {member.chit_groups.name}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-text-body)]">
                  {member.pot_taken ? "✓" : "—"}
                </p>
                <MemberInviteActions token={member.invite_token} chitName={member.chit_groups.name} />
                <Link
                  href={`/dashboard/chit-groups/${member.chit_groups.id}`}
                  className="ghost-button justify-center md:justify-start"
                >
                  View Member
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
