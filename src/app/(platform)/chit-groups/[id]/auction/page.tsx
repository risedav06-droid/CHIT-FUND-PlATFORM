import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusChip } from "@/components/ui/status-chip";
import { authService } from "@/modules/auth/auth.service";
import { formatCurrency } from "@/lib/utils";
import { getChitGroupById, getPaymentCycles } from "@/utils/supabase/db";

type AuctionPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function parseBids(bids: unknown) {
  if (!Array.isArray(bids)) {
    return [];
  }

  return bids as Array<{
    memberId: string;
    memberName: string;
    bidAmount: number;
    resultingPayout: number;
  }>;
}

export default async function ChitGroupAuctionPage({ params }: AuctionPageProps) {
  const session = await authService.requireAuthenticatedSession("/chit-groups");
  const { id } = await params;
  const [{ data: group }, { data: cycles }] = await Promise.all([
    getChitGroupById(id, session.user.id),
    getPaymentCycles(id),
  ]);

  if (!group) {
    notFound();
  }

  const cycle = (cycles ?? []).at(-1);
  const auction = cycle?.auctions?.[0];
  const bids = parseBids(auction?.bids);
  const potValue = Number(group.monthly_amount) * Number(group.member_count);

  return (
    <main className="space-y-6">
      <section className="rounded-[var(--radius-card)] bg-[linear-gradient(135deg,rgba(255,255,255,0.82),rgba(245,243,240,0.96))] p-7 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm text-[var(--color-text-muted)]">
              <Link href={"/chit-groups" as Route} className="text-[var(--color-primary-container)]">Chit Groups</Link>
              {" > "}
              {group.name}
            </p>
            <h1 className="mt-3">
              Month {cycle?.cycle_number ?? 1} of {group.duration_months}
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-body)]">Live Auction Session</p>
          </div>
          <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
            <p className="editorial-label">Total pot value</p>
            <p data-display="true" className="mt-3 text-[2.5rem] text-[var(--color-text-primary)]">
              {formatCurrency(potValue)}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.4fr_0.6fr]">
        <div className="space-y-6">
          <article className="card-surface rounded-[var(--radius-card)] p-6">
            <h2>Bid Entry</h2>
            <form className="mt-6 space-y-4">
              <label className="space-y-2 text-sm font-medium text-[var(--color-text-primary)]">
                <span>Select Member</span>
                <Select defaultValue="">
                  <option value="" disabled>
                    Select member
                  </option>
                  {(group.members ?? []).map((member: any) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="space-y-2 text-sm font-medium text-[var(--color-text-primary)]">
                <span>Bid Amount</span>
                <div className="flex items-center gap-3 rounded-[var(--radius-input)] bg-[var(--color-surface-high)] px-4 py-1.5">
                  <span className="font-semibold text-[var(--color-primary-container)]">₹</span>
                  <Input type="number" placeholder="5000" className="border-none bg-transparent px-0" />
                </div>
              </label>
              <FormSubmitButton className="w-full justify-center py-3">
                Save Changes
              </FormSubmitButton>
            </form>
          </article>

          {auction ? (
            <article className="rounded-[var(--radius-card)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-3">
                <span className="ledger-chip bg-[rgba(212,168,67,0.18)] text-[var(--color-amber-text)]">
                  Auction Concluded
                </span>
                <StatusChip status="active">Winner Declared</StatusChip>
              </div>
              <h2 className="mt-5">Winner selected</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-low)] p-4">
                  <p className="editorial-label">Discount</p>
                  <p className="mt-2 text-lg font-semibold text-[var(--color-text-primary)]">
                    {formatCurrency(Number(auction.winning_discount ?? 0))}
                  </p>
                </div>
                <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-low)] p-4">
                  <p className="editorial-label">Payout</p>
                  <p className="mt-2 text-lg font-semibold text-[var(--color-text-primary)]">
                    {formatCurrency(Number(auction.winner_payout ?? 0))}
                  </p>
                </div>
              </div>
            </article>
          ) : null}
        </div>

        <div className="space-y-6">
          <article className="card-surface rounded-[var(--radius-card)] p-6">
            <div className="flex items-center justify-between gap-4">
              <h2>Live Bid Table</h2>
              <span className="ledger-chip bg-[var(--color-success-bg)] text-[var(--color-success-text)]">
                ● LIVE
              </span>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="table-tone min-w-[640px]">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Bid (Discount)</th>
                    <th>Resulting Payout</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bids.length === 0 ? (
                    <tr>
                      <td colSpan={4}>No bids recorded yet.</td>
                    </tr>
                  ) : (
                    bids.map((bid, index) => (
                      <tr key={`${bid.memberId}-${index}`}>
                        <td>{bid.memberName}</td>
                        <td>{formatCurrency(Number(bid.bidAmount))}</td>
                        <td>{formatCurrency(Number(bid.resultingPayout))}</td>
                        <td>
                          {index === 0 ? <StatusChip status="active">Highest</StatusChip> : <span className="text-sm text-[var(--color-text-body)]">Open</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
