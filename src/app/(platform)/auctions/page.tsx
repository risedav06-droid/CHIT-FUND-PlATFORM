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
import { authService } from "@/modules/auth/auth.service";
import { createAuctionCycleAction } from "@/modules/auctions/auctions.actions";
import { auctionsService } from "@/modules/auctions/auctions.service";

type AuctionsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getFullName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ");
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

export default async function AuctionsPage({ searchParams }: AuctionsPageProps) {
  await authService.requirePermission("manage_auctions", "/auctions");
  const feedback = readFeedback(await searchParams);
  const [cycles, groups] = await Promise.all([
    auctionsService.listAuctionCycles(),
    auctionsService.listGroupsForCycleCreation(),
  ]);

  return (
    <div className="space-y-8">
      <section className="rounded-[1.75rem] border border-border bg-surface p-6 shadow-[0_20px_70px_-50px_rgba(31,27,23,0.5)]">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold text-foreground">Auctions</h1>
          <p className="mt-2 text-sm leading-7 text-muted">
            Run monthly bidding, finalize winners, calculate discount and prize,
            and track the payout that follows each auction.
          </p>
        </div>
      </section>

      <FormFeedback {...feedback} />

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.45fr]">
        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <h2 className="text-xl font-semibold text-foreground">
            Create Missing Cycle
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            New chit groups already generate cycles. Use this when a group is
            missing its next monthly auction cycle.
          </p>

          <form action={createAuctionCycleAction} className="mt-6 space-y-4 pb-20 lg:pb-0">
            <label className="space-y-2 text-sm font-medium text-foreground">
              <span>Chit group</span>
              <Select name="chitGroupId" required defaultValue="">
                <option value="" disabled>
                  Select a group
                </option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.code} | {group.name}
                  </option>
                ))}
              </Select>
            </label>

            <label className="space-y-2 text-sm font-medium text-foreground">
              <span>Scheduled date</span>
              <Input name="scheduledAt" type="date" required />
            </label>

            <label className="space-y-2 text-sm font-medium text-foreground">
              <span>Notes</span>
              <Textarea
                name="notes"
                placeholder="Optional operating note for this auction cycle"
              />
            </label>

            <div className="sticky bottom-4 rounded-[1.25rem] border border-border bg-white/95 p-3 backdrop-blur">
              <FormSubmitButton className="w-full justify-center py-3">
                Create cycle
              </FormSubmitButton>
            </div>
          </form>
        </article>

        <article className="rounded-[1.75rem] border border-border bg-white p-6">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Auction Work Queue
              </h2>
              <p className="mt-2 text-sm text-muted">
                Latest generated cycles with bid, result, and payout context.
              </p>
            </div>
            <span className="w-fit rounded-full bg-surface px-3 py-1 text-sm font-medium text-muted">
              {cycles.length} cycles
            </span>
          </div>

          {cycles.length === 0 ? (
            <PageEmptyState
              title="No auction cycles"
              description="Create a chit group to generate monthly auction cycles."
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-surface-strong/50 text-left text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Cycle</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Bids / Winner</th>
                    <th className="px-4 py-3 font-medium">Prize</th>
                    <th className="px-4 py-3 font-medium">Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {cycles.map((cycle) => (
                    <tr key={cycle.id}>
                      <td className="px-4 py-4">
                        <Link
                          href={`/auctions/${cycle.id}` as Route}
                          className="font-semibold text-foreground hover:text-brand"
                        >
                          {cycle.chitGroup.code} | Cycle {cycle.cycleNumber}
                        </Link>
                        <div className="mt-1 text-xs text-muted">
                          {cycle.chitGroup.name} | {formatDate(cycle.scheduledAt)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted">
                        {formatStatus(cycle.status)}
                      </td>
                      <td className="px-4 py-4 text-muted">
                        <div>{cycle._count.bids} bid(s)</div>
                        {cycle.winningEnrollment ? (
                          <div className="mt-1 text-xs">
                            Winner{" "}
                            {getFullName(
                              cycle.winningEnrollment.member.firstName,
                              cycle.winningEnrollment.member.lastName,
                            )}
                          </div>
                        ) : (
                          <div className="mt-1 text-xs">Winner pending</div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-muted">
                        <div>{formatCurrency(cycle.chitGroup.prizeAmount.toString())}</div>
                        {cycle.discountAmount ? (
                          <div className="mt-1 text-xs">
                            Discount {formatCurrency(cycle.discountAmount.toString())}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 text-muted">
                        {cycle.payout ? (
                          <>
                            <div>{formatStatus(cycle.payout.status)}</div>
                            <div className="mt-1 text-xs">
                              {formatCurrency(cycle.payout.netAmount.toString())}
                            </div>
                          </>
                        ) : (
                          "Not generated"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
