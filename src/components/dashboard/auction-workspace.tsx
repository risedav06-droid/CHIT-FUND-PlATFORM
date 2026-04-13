'use client';

import { useMemo, useState } from "react";

import { StatusChip } from "@/components/ui/status-chip";
import { formatCurrency } from "@/lib/utils";

type AuctionWorkspaceProps = {
  groupId: string;
  cycleId: string;
  cycleNumber: number;
  durationMonths: number;
  monthlyAmount: number;
  memberCount: number;
  members: Array<{ id: string; name: string }>;
  existingAuction?: {
    winner_id: string;
    winning_discount: number;
    winner_payout: number;
    foreman_commission: number;
    dividend_distributed: number;
  } | null;
};

export function AuctionWorkspace({
  groupId,
  cycleId,
  cycleNumber,
  durationMonths,
  monthlyAmount,
  memberCount,
  members,
  existingAuction,
}: AuctionWorkspaceProps) {
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id ?? "");
  const [bidAmount, setBidAmount] = useState("");
  const [bids, setBids] = useState<Array<{ memberId: string; memberName: string; bidAmount: number }>>([]);
  const [winner, setWinner] = useState(existingAuction);
  const [error, setError] = useState<string | null>(null);
  const potValue = monthlyAmount * memberCount;

  const sortedBids = useMemo(
    () => [...bids].sort((a, b) => b.bidAmount - a.bidAmount),
    [bids],
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[var(--radius-card)] bg-white px-8 py-8 shadow-[var(--shadow-card)]">
        <p className="editorial-label">Chit Groups &gt; Auction</p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[1.875rem]">Month {cycleNumber} of {durationMonths}</h1>
            <p className="mt-2 text-sm text-[var(--color-text-body)]">Live Auction Session</p>
          </div>
          <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-low)] p-5">
            <p className="editorial-label !text-[var(--color-text-muted)]">Total Pot Value</p>
            <p className="mt-2 font-display text-[2rem] text-[var(--color-text-primary)]">
              {formatCurrency(potValue)}
            </p>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-[var(--radius-card)] bg-[var(--color-error-bg)] px-5 py-4 text-sm text-[var(--color-error-text)]">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.4fr_0.6fr]">
        <section className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
          <h2>Bid Entry</h2>
          <div className="mt-5 space-y-4">
            <label className="space-y-2">
              <span className="editorial-label !text-[var(--color-text-muted)]">Select Member</span>
              <select
                value={selectedMemberId}
                onChange={(event) => setSelectedMemberId(event.target.value)}
                className="recessed-input h-11 w-full"
              >
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="editorial-label !text-[var(--color-text-muted)]">Bid Amount</span>
              <input
                value={bidAmount}
                onChange={(event) => setBidAmount(event.target.value)}
                className="recessed-input h-11 w-full"
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter discount in ₹"
              />
            </label>
            <button
              type="button"
              className="primary-button w-full justify-center"
              onClick={() => {
                const member = members.find((entry) => entry.id === selectedMemberId);
                const amount = Number(bidAmount);

                if (!member || !amount) {
                  return;
                }

                setBids((current) => [
                  ...current.filter((entry) => entry.memberId !== selectedMemberId),
                  { memberId: member.id, memberName: member.name, bidAmount: amount },
                ]);
                setBidAmount("");
              }}
            >
              Add Bid
            </button>
          </div>

          {winner ? (
            <div className="mt-6 rounded-[var(--radius-card)] bg-[rgba(212,168,67,0.14)] p-5">
              <StatusChip status="partial">Auction Concluded</StatusChip>
              <p className="mt-3 font-display text-[1.5rem] text-[var(--color-text-primary)]">
                {members.find((member) => member.id === winner.winner_id)?.name ?? "Winner"}
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div>
                  <p className="editorial-label !text-[var(--color-text-muted)]">Discount</p>
                  <p className="mt-1 text-sm">{formatCurrency(winner.winning_discount)}</p>
                </div>
                <div>
                  <p className="editorial-label !text-[var(--color-text-muted)]">Payout</p>
                  <p className="mt-1 text-sm">{formatCurrency(winner.winner_payout)}</p>
                </div>
                <div>
                  <p className="editorial-label !text-[var(--color-text-muted)]">Dividend per Member</p>
                  <p className="mt-1 text-sm">{formatCurrency(winner.dividend_distributed)}</p>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section className="space-y-6">
          <section className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <h2>Live Bid Table</h2>
              <span className="ledger-chip bg-[var(--color-success-bg)] text-[var(--color-success-text)]">● Live</span>
            </div>
            <div className="mt-6 space-y-3">
              {sortedBids.map((bid, index) => (
                <div
                  key={bid.memberId}
                  className={`grid gap-3 rounded-[var(--radius-card)] p-4 md:grid-cols-[1.2fr_1fr_1fr_0.8fr] md:items-center ${
                    index % 2 === 0 ? "bg-[var(--color-surface-low)]" : "bg-white"
                  }`}
                >
                  <p className="font-medium text-[var(--color-text-primary)]">{bid.memberName}</p>
                  <p>{formatCurrency(bid.bidAmount)}</p>
                  <p>{formatCurrency(potValue - bid.bidAmount)}</p>
                  <div>
                    {index === 0 ? <StatusChip status="paid">Highest</StatusChip> : null}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <button
            type="button"
            className="amber-button w-full justify-center"
            onClick={async () => {
              const topBid = sortedBids[0];

              if (!topBid) {
                setError("Add at least one bid before declaring a winner.");
                return;
              }

              setError(null);

              const response = await fetch("/api/auctions/finalize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  groupId,
                  cycleId,
                  winnerId: topBid.memberId,
                  winningDiscount: topBid.bidAmount,
                }),
              });

              if (!response.ok) {
                const payload = await response.json().catch(() => ({ error: "Could not finalize auction." }));
                setError(payload.error ?? "Could not finalize auction.");
                return;
              }

              const payload = await response.json();
              setWinner({
                winner_id: topBid.memberId,
                winning_discount: topBid.bidAmount,
                winner_payout: payload.winnerPayout,
                foreman_commission: payload.foremanCommission,
                dividend_distributed: payload.dividendPerMember,
              });
            }}
          >
            Declare Winner
          </button>

          <section className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]" style={{ boxShadow: "inset 4px 0 0 #d4a843, 0 4px 24px rgba(27,28,26,0.06)" }}>
            <p className="editorial-label">Dividend Summary</p>
            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="text-sm leading-7 text-[var(--color-text-body)]">
                Each member pays {winner ? formatCurrency(winner.dividend_distributed) : "—"} next month
              </p>
              <p className="text-sm font-medium text-[var(--color-amber-text)]">
                Effective savings: {winner ? `${Math.round((winner.winning_discount / potValue) * 100)}%` : "—"}
              </p>
            </div>
          </section>
        </section>
      </div>
    </div>
  );
}
