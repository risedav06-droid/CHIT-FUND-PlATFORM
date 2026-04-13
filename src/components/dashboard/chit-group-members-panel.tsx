'use client';

import { useMemo, useState, useTransition } from "react";

import { MemberActionsMenu } from "@/components/dashboard/member-actions-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { MemberRow } from "@/components/ui/member-row";
import { formatCurrency } from "@/lib/utils";

type MemberEntry = {
  member: {
    id: string;
    name: string;
    phone: string;
    whatsapp_phone?: string | null;
    invite_token: string;
    pot_taken: boolean;
  };
  currentPayment: {
    id: string;
    amount_due: number;
    amount_paid: number;
    status: "paid" | "unpaid" | "partial";
  } | null;
};

type ChitGroupMembersPanelProps = {
  groupId: string;
  chitName: string;
  monthLabel: string;
  memberTargetCount: number;
  monthlyAmount: number;
  initialMembers: MemberEntry[];
  nextAuctionDate: string;
  daysUntilDue: number | null;
  defaulterCount: number;
  addMemberForm?: React.ReactNode;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ChitGroupMembersPanel({
  groupId,
  chitName,
  monthLabel,
  memberTargetCount,
  monthlyAmount,
  initialMembers,
  nextAuctionDate,
  daysUntilDue,
  defaulterCount,
  addMemberForm,
}: ChitGroupMembersPanelProps) {
  const [members, setMembers] = useState(initialMembers);
  const [toast, setToast] = useState<string | null>(null);
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [, startTransition] = useTransition();

  const stats = useMemo(() => {
    const paidCount = members.filter((entry) => entry.currentPayment?.status === "paid").length;
    const collected = members.reduce(
      (sum, entry) => sum + Number(entry.currentPayment?.amount_paid ?? 0),
      0,
    );
    const outstanding = members.reduce(
      (sum, entry) =>
        sum +
        Math.max(
          Number(entry.currentPayment?.amount_due ?? monthlyAmount) -
            Number(entry.currentPayment?.amount_paid ?? 0),
          0,
        ),
      0,
    );

    return {
      paidCount,
      collected,
      outstanding,
      collectionRate:
        members.length === 0 ? 0 : Math.round((paidCount / Math.max(members.length, 1)) * 100),
    };
  }, [members, monthlyAmount]);

  const health = useMemo(() => {
    if (stats.collectionRate > 80) {
      return {
        tone: "bg-[var(--color-success-text)]",
        title: "Healthy",
        detail: "All payments on track",
      };
    }

    if (stats.collectionRate >= 50) {
      return {
        tone: "bg-[var(--color-amber)]",
        title: "Attention Needed",
        detail: `${Math.max(defaulterCount, members.length - stats.paidCount)} members need follow-up`,
      };
    }

    return {
      tone: "bg-[var(--color-error-text)]",
      title: "Critical",
      detail: "Critical: collection below 50%",
    };
  }, [defaulterCount, members.length, stats.collectionRate, stats.paidCount]);

  const closeModal = () => {
    setPendingPaymentId(null);
    setPaymentMode("cash");
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setNotes("");
  };

  const openPayment = (paymentId: string) => {
    setPendingPaymentId(paymentId);
  };

  const copyAllLinks = async () => {
    const message = [
      `ChitMate member portal links for ${chitName}:`,
      "",
      ...members.map(
        (entry, index) =>
          `${index + 1}. ${entry.member.name}: ${window.location.origin}/member/${entry.member.invite_token}`,
      ),
    ].join("\n");

    await navigator.clipboard.writeText(message);
    setToast("All member links copied ✓");
    window.setTimeout(() => setToast(null), 2400);
  };

  const confirmPayment = () => {
    if (!pendingPaymentId) {
      return;
    }

    const target = members.find((entry) => entry.currentPayment?.id === pendingPaymentId);

    if (!target) {
      return;
    }

    const previousMembers = members;
    setMembers((current) =>
      current.map((entry) =>
        entry.currentPayment?.id === pendingPaymentId
          ? {
              ...entry,
              currentPayment: entry.currentPayment
                ? {
                    ...entry.currentPayment,
                    amount_paid: entry.currentPayment.amount_due,
                    status: "paid",
                  }
                : entry.currentPayment,
            }
          : entry,
      ),
    );

    closeModal();

    startTransition(async () => {
      const response = await fetch("/api/payments/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: pendingPaymentId,
          paymentMode,
          paymentDate,
          notes,
        }),
      });

      if (!response.ok) {
        setMembers(previousMembers);
        setToast("Something went wrong. Try again.");
        window.setTimeout(() => setToast(null), 2400);
        return;
      }

      setToast(`Payment marked for ${target.member.name} ✓`);
      window.setTimeout(() => setToast(null), 2400);
    });
  };

  return (
    <>
      {toast ? (
        <div className="fixed right-4 top-4 z-50 rounded-[var(--radius-card)] bg-[var(--color-primary-container)] px-4 py-3 text-sm text-white shadow-[var(--shadow-float)]">
          {toast}
        </div>
      ) : null}

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <section className="min-w-0 rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2>Members</h2>
                <p className="mt-1 text-sm text-[var(--color-text-body)]">
                  Track the current cycle and keep every member up to date.
                </p>
              </div>
              <a href="#add-member-form" className="primary-button">
                Add Member
              </a>
            </div>

            <div className="hidden items-center gap-3 px-4 pb-2 lg:flex">
              <div className="min-w-0 flex-[1_1_160px]">
                <p className="editorial-label !text-[var(--color-text-muted)]">Member</p>
              </div>
              <div className="w-[110px] text-right">
                <p className="editorial-label !text-[var(--color-text-muted)]">Amount</p>
              </div>
              <div className="w-[88px]">
                <p className="editorial-label !text-[var(--color-text-muted)]">Status</p>
              </div>
              <div className="w-[88px]">
                <p className="editorial-label !text-[var(--color-text-muted)]">Pot Taken</p>
              </div>
              <div className="w-10 text-right">
                <p className="editorial-label !text-[var(--color-text-muted)]">Actions</p>
              </div>
            </div>

            {members.length === 0 ? (
              <EmptyState
                title="No members yet. Add your first member."
                subtitle="Once members are added, this table will show collection status, reminders, and portal links."
              />
            ) : (
              <div className="space-y-3">
                {members.map((entry, index) => (
                  <div
                    key={entry.member.id}
                    id={`member-${entry.member.id}`}
                    className={`rounded-[var(--radius-card)] ${
                      index % 2 === 0 ? "bg-white" : "bg-[var(--color-surface-low)]"
                    }`}
                  >
                    <MemberRow
                      name={entry.member.name}
                      phone={entry.member.phone}
                      initials={initials(entry.member.name)}
                      amount={formatCurrency(Number(entry.currentPayment?.amount_due ?? monthlyAmount))}
                      status={(entry.currentPayment?.status ?? "unpaid") as "paid" | "unpaid" | "partial"}
                      potTaken={Boolean(entry.member.pot_taken)}
                      actions={
                        <MemberActionsMenu
                          groupId={groupId}
                          token={entry.member.invite_token}
                          chitName={chitName}
                          canMarkPaid={Boolean(
                            entry.currentPayment && entry.currentPayment.status !== "paid",
                          )}
                          onMarkPaid={
                            entry.currentPayment && entry.currentPayment.status !== "paid"
                              ? () => openPayment(entry.currentPayment!.id)
                              : undefined
                          }
                        />
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          {addMemberForm}
        </div>

        <div className="flex flex-col gap-4 xl:sticky xl:top-6">
          <section className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
            <h2>{monthLabel} Cycle Collection</h2>
            <div className="mt-5 flex items-center justify-between text-sm text-[var(--color-text-body)]">
              <span>
                {stats.paidCount} / {Math.max(members.length, memberTargetCount)} Members paid
              </span>
              <span>{stats.collectionRate}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-[var(--color-surface-low)]">
              <div
                className="h-2 rounded-full bg-[var(--color-primary-container)]"
                style={{
                  width: `${stats.collectionRate}%`,
                }}
              />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <p className="editorial-label !text-[var(--color-text-muted)]">Collected</p>
                <p className="mt-2 font-display text-[1.7rem] text-[var(--color-success-text)]">
                  {formatCurrency(stats.collected)}
                </p>
              </div>
              <div>
                <p className="editorial-label !text-[var(--color-text-muted)]">Outstanding</p>
                <p className="mt-2 font-display text-[1.7rem] text-[#dc2626]">
                  {formatCurrency(stats.outstanding)}
                </p>
              </div>
            </div>
            <button type="button" className="primary-button mt-6 w-full justify-center">
              Send Bulk Reminders
            </button>
          </section>

          <section className="rounded-[var(--radius-card)] bg-[var(--color-primary-container)] p-6 text-white shadow-[var(--shadow-card)]">
            <p className="editorial-label !text-[rgba(255,255,255,0.72)]">Next Auction</p>
            <p className="mt-3 font-display text-[1.5rem] italic">{nextAuctionDate}</p>
            <p className="mt-3 text-sm leading-7 text-white/78">
              Auction starts via Member Portal
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {members.slice(0, 4).map((entry) => (
                <div
                  key={entry.member.id}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xs font-semibold text-[var(--color-primary)]"
                >
                  {initials(entry.member.name)}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
            <p className="editorial-label !text-[var(--color-text-muted)]">This Cycle at a Glance</p>
            <h3 className="mt-3 text-[1.15rem]">Quick Stats</h3>
            <div className="mt-5 space-y-5">
              <div>
                <div className="flex items-center justify-between text-sm text-[var(--color-text-body)]">
                  <span>Collection rate</span>
                  <span>{stats.collectionRate}%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-[var(--color-surface-low)]">
                  <div
                    className="h-2 rounded-full bg-[var(--color-primary-container)]"
                    style={{ width: `${stats.collectionRate}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-low)] px-4 py-4">
                  <p className="editorial-label !text-[var(--color-text-muted)]">Days Until Due</p>
                  <p className="mt-2 font-display text-[1.4rem] text-[var(--color-text-primary)]">
                    {daysUntilDue === null ? "—" : daysUntilDue}
                  </p>
                </div>
                <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-low)] px-4 py-4">
                  <p className="editorial-label !text-[var(--color-text-muted)]">Defaulters</p>
                  <p className="mt-2 font-display text-[1.4rem] text-[var(--color-text-primary)]">
                    {defaulterCount}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section
            className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]"
            style={{ boxShadow: "inset 4px 0 0 #d4a843, 0 4px 24px rgba(27,28,26,0.06)" }}
          >
            <p className="editorial-label !text-[var(--color-amber-text)]">Invite Members</p>
            <p className="mt-3 text-sm leading-7 text-[var(--color-text-body)]">
              Share portal links so members can track their own payments.
            </p>
            <button type="button" className="amber-button mt-5 w-full justify-center" onClick={copyAllLinks}>
              Copy All Links
            </button>
          </section>

          <section className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
            <p className="editorial-label !text-[var(--color-text-muted)]">Fund Health</p>
            <div className="mt-4 flex items-center gap-4">
              <span className={`h-4 w-4 rounded-full ${health.tone}`} />
              <div>
                <p className="font-display text-[1.2rem] text-[var(--color-text-primary)]">{health.title}</p>
                <p className="mt-1 text-sm text-[var(--color-text-body)]">{health.detail}</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {pendingPaymentId ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(27,28,26,0.18)] px-4">
          <div className="w-full max-w-lg rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-float)]">
            <h3>Mark as Paid</h3>
            <div className="mt-5 space-y-4">
              <div>
                <p className="editorial-label !text-[var(--color-text-muted)]">Payment Mode</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {["cash", "upi", "bank_transfer", "other"].map((mode) => (
                    <label
                      key={mode}
                      className={`rounded-[var(--radius-button)] px-4 py-3 text-sm ${
                        paymentMode === mode
                          ? "bg-[rgba(1,45,29,0.08)] text-[var(--color-primary)] shadow-[inset_0_0_0_2px_#1b4332]"
                          : "bg-[var(--color-surface-low)] text-[var(--color-text-body)]"
                      }`}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        checked={paymentMode === mode}
                        onChange={() => setPaymentMode(mode)}
                      />
                      {mode.replaceAll("_", " ")}
                    </label>
                  ))}
                </div>
              </div>
              <label className="space-y-2">
                <span className="editorial-label !text-[var(--color-text-muted)]">Payment Date</span>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(event) => setPaymentDate(event.target.value)}
                  className="recessed-input h-11 w-full"
                />
              </label>
              <label className="space-y-2">
                <span className="editorial-label !text-[var(--color-text-muted)]">Notes</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="recessed-input min-h-24 w-full"
                  placeholder="Optional receipt note"
                />
              </label>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" className="primary-button flex-1 justify-center" onClick={confirmPayment}>
                Confirm
              </button>
              <button type="button" className="ghost-button flex-1 justify-center" onClick={closeModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
