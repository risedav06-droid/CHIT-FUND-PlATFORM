import type { Route } from "next";
import Link from "next/link";

import { FormFeedback } from "@/components/ui/form-feedback";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { readFeedback } from "@/lib/action-state";
import { formatDate } from "@/lib/dates";
import { authService } from "@/modules/auth/auth.service";
import { createMemberAction } from "@/modules/members/members.actions";
import { membersService } from "@/modules/members/members.service";

type MembersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getFullName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ");
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  await authService.requirePermission("view_staff_area", "/members");
  const feedback = readFeedback(await searchParams);
  const members = await membersService.listMembers();

  return (
    <div className="space-y-8">
      <section className="rounded-[1.75rem] border border-border bg-surface p-6 shadow-[0_20px_70px_-50px_rgba(31,27,23,0.5)]">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold text-foreground">Members</h1>
          <p className="mt-2 text-sm leading-7 text-muted">
            Create and manage member records before they join chit groups.
          </p>
        </div>
      </section>

      <FormFeedback {...feedback} />

      <section className="grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Create Member
            </h2>
            <p className="mt-2 text-sm text-muted">
              Capture the minimum operational details needed to start
              enrollments.
            </p>
          </div>

          <form action={createMemberAction} className="space-y-4 pb-20 lg:pb-0">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Member code</span>
                <Input name="memberCode" placeholder="MBR-001" required />
              </label>
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Primary phone</span>
                <Input name="primaryPhone" placeholder="9876543210" required />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>First name</span>
                <Input name="firstName" placeholder="Ravi" required />
              </label>
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Last name</span>
                <Input name="lastName" placeholder="Kumar" />
              </label>
            </div>

            <label className="space-y-2 text-sm font-medium text-foreground">
              <span>Email</span>
              <Input
                name="primaryEmail"
                type="email"
                placeholder="member@example.com"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>City</span>
                <Input name="city" placeholder="Hyderabad" />
              </label>
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>State</span>
                <Input name="state" placeholder="Telangana" />
              </label>
              <label className="space-y-2 text-sm font-medium text-foreground">
                <span>Postal code</span>
                <Input name="postalCode" placeholder="500001" />
              </label>
            </div>

            <label className="space-y-2 text-sm font-medium text-foreground">
              <span>Address line 1</span>
              <Input name="addressLine1" placeholder="Street and area" />
            </label>

            <label className="space-y-2 text-sm font-medium text-foreground">
              <span>Address line 2</span>
              <Input name="addressLine2" placeholder="Landmark or locality" />
            </label>

            <label className="space-y-2 text-sm font-medium text-foreground">
              <span>Notes</span>
              <Textarea name="notes" placeholder="Relationship manager notes" />
            </label>

            <div className="sticky bottom-4 rounded-[1.25rem] border border-border bg-white/95 p-3 backdrop-blur">
              <FormSubmitButton className="w-full justify-center py-3">
                Create member
              </FormSubmitButton>
            </div>
          </form>
        </article>

        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Member Directory
              </h2>
              <p className="mt-2 text-sm text-muted">
                Current members available for chit fund enrollment.
              </p>
            </div>
            <div className="rounded-full bg-surface px-3 py-1 text-sm font-medium text-muted">
              {members.length} total
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-surface-strong/50 text-left text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Enrollments</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted">
                      No members yet. Create the first member from the form.
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member.id}>
                      <td className="px-4 py-4">
                        <Link
                          href={`/members/${member.id}` as Route}
                          className="font-medium text-foreground hover:text-brand"
                        >
                          {getFullName(member.firstName, member.lastName)}
                        </Link>
                        <div className="text-xs text-muted">
                          {member.memberCode}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted">
                        <div>{member.primaryPhone}</div>
                        <div className="text-xs">
                          {member.primaryEmail ?? "No email"}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-foreground">
                          {member.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-muted">
                        {member._count.enrollments}
                      </td>
                      <td className="px-4 py-4 text-muted">
                        {formatDate(member.joinedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}
