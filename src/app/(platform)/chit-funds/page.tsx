import type { Route } from "next";
import Link from "next/link";

import { FormFeedback } from "@/components/ui/form-feedback";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Input } from "@/components/ui/input";
import { PageEmptyState } from "@/components/ui/page-empty-state";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { readFeedback } from "@/lib/action-state";
import { formatDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import { canAccessPermission } from "@/modules/auth/auth.permissions";
import { authService } from "@/modules/auth/auth.service";
import {
  createChitGroupAction,
  enrollMemberInChitGroupAction,
} from "@/modules/chit-funds/chit-groups.actions";
import { chitGroupsService } from "@/modules/chit-funds/chit-groups.service";
import { membersService } from "@/modules/members/members.service";

type ChitFundsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getFullName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ");
}

export default async function ChitFundsPage({
  searchParams,
}: ChitFundsPageProps) {
  const session = await authService.requirePermission("view_staff_area", "/chit-funds");
  const feedback = readFeedback(await searchParams);
  const canCreateGroup = canAccessPermission(session.user.role, "create_chit_group");
  const canEnrollMember = canAccessPermission(session.user.role, "enroll_member");
  const [groups, availableGroups, members] = await Promise.all([
    chitGroupsService.listChitGroups(),
    chitGroupsService.listOpenGroupsForEnrollment(),
    membersService.listMemberOptions(),
  ]);

  return (
    <div className="space-y-8">
      <section className="rounded-[1.75rem] border border-border bg-surface p-6 shadow-[0_20px_70px_-50px_rgba(31,27,23,0.5)]">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold text-foreground">Chit Funds</h1>
          <p className="mt-2 text-sm leading-7 text-muted">
            Create operational chit groups, schedule their monthly cycles, and
            enroll members into active tickets.
          </p>
        </div>
      </section>

      <FormFeedback {...feedback} />

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Create Chit Group
            </h2>
            <p className="mt-2 text-sm text-muted">
              A new group automatically gets its auction cycle schedule.
            </p>
          </div>

          {canCreateGroup ? (
            <form action={createChitGroupAction} className="space-y-4 pb-20 lg:pb-0">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Group code</span>
                <Input name="code" placeholder="CG-2026-01" required />
              </label>
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Group name</span>
                <Input name="name" placeholder="April 2026 - 20 Members" required />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Ticket count</span>
                <Input name="ticketCount" type="number" min="1" required />
              </label>
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Installment amount</span>
                <Input
                  name="installmentAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Duration (months)</span>
                <Input name="durationMonths" type="number" min="1" required />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Start date</span>
                <Input name="startDate" type="date" required />
              </label>
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Auction day</span>
                <Input
                  name="auctionDay"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Defaults to start day"
                />
              </label>
            </div>

            <label className="space-y-2 text-sm font-medium text-foreground">
              <span>Description</span>
              <Textarea
                name="description"
                placeholder="Optional notes about the group or branch setup"
              />
            </label>

            <div className="sticky bottom-4 rounded-[1.25rem] border border-border bg-white/95 p-3 backdrop-blur">
              <FormSubmitButton className="w-full justify-center py-3">
                Create chit group
              </FormSubmitButton>
            </div>
            </form>
          ) : (
            <div className="mt-6">
              <PageEmptyState
                title="Organizer access required"
                description="Only organizers and super admins can create new chit groups in the pilot."
              />
            </div>
          )}
        </article>

        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Enroll Member
            </h2>
            <p className="mt-2 text-sm text-muted">
              Enrolling creates the member&apos;s installment schedule across the
              full group duration.
            </p>
          </div>

          {canEnrollMember ? (
            <form action={enrollMemberInChitGroupAction} className="space-y-4 pb-20 lg:pb-0">
            <label className="space-y-2 text-sm font-medium text-foreground">
              <span>Member</span>
              <Select name="memberId" required defaultValue="">
                <option value="" disabled>
                  Select a member
                </option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.memberCode} -{" "}
                    {getFullName(member.firstName, member.lastName)}
                  </option>
                ))}
              </Select>
            </label>

            <label className="space-y-2 text-sm font-medium text-foreground">
              <span>Chit group</span>
              <Select name="chitGroupId" required defaultValue="">
                <option value="" disabled>
                  Select an open group
                </option>
                {availableGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.code} - {group.name} ({group._count.enrollments}/
                    {group.ticketCount})
                  </option>
                ))}
              </Select>
            </label>

            <label className="space-y-2 text-sm font-medium text-foreground">
              <span>Ticket number</span>
              <Input name="ticketNumber" type="number" min="1" required />
            </label>

            <div className="sticky bottom-4 rounded-[1.25rem] border border-border bg-white/95 p-3 backdrop-blur">
              <FormSubmitButton className="w-full justify-center py-3">
                Enroll member
              </FormSubmitButton>
            </div>
            </form>
          ) : (
            <div className="mt-6">
              <PageEmptyState
                title="Organizer access required"
                description="Only organizers and super admins can enroll members into chit groups."
              />
            </div>
          )}
        </article>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              Active Group Register
            </h2>
            <p className="mt-2 text-sm text-muted">
              Track created groups and current enrollment usage.
            </p>
          </div>
          <div className="rounded-full bg-surface px-3 py-1 text-sm font-medium text-muted">
            {groups.length} groups
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {groups.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-border bg-white p-8 text-sm text-muted">
              No chit groups yet. Create the first group from the form above.
            </div>
          ) : (
            groups.map((group) => (
              <article
                key={group.id}
                className="rounded-[1.5rem] border border-border bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-brand">{group.code}</p>
                    <Link
                      href={`/chit-funds/${group.id}` as Route}
                      className="mt-2 block text-lg font-semibold text-foreground hover:text-brand"
                    >
                      {group.name}
                    </Link>
                  </div>
                  <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-foreground">
                    {group.status}
                  </span>
                </div>
                <dl className="mt-4 grid gap-3 text-sm text-muted">
                  <div className="flex items-center justify-between gap-3">
                    <dt>Installment</dt>
                    <dd>{formatCurrency(group.installmentAmount.toString())}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt>Prize amount</dt>
                    <dd>{formatCurrency(group.prizeAmount.toString())}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt>Duration</dt>
                    <dd>{group.durationMonths} months</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt>Start date</dt>
                    <dd>{formatDate(group.startDate)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt>Enrollments</dt>
                    <dd>
                      {group._count.enrollments}/{group.ticketCount}
                    </dd>
                  </div>
                </dl>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
