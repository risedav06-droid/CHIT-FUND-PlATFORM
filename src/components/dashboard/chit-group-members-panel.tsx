'use client';

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { AddMemberFormState } from "@/app/(platform)/dashboard/chit-groups/actions";
import { AddMemberInlineForm } from "@/components/dashboard/add-member-inline-form";
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
  memberLimit: number;
  limitReached: boolean;
  isAuctionType: boolean;
  initialMembers: MemberEntry[];
  nextAuctionDate: string;
  daysUntilDue: number | null;
  defaulterCount: number;
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
  memberLimit,
  limitReached,
  isAuctionType,
  initialMembers,
  nextAuctionDate,
  daysUntilDue,
  defaulterCount,
}: ChitGroupMembersPanelProps) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [toast, setToast] = useState<string | null>(null);
  const [openPaymentId, setOpenPaymentId] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState("Cash");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0] ?? "");
  const [notes, setNotes] = useState("");
  const [, startTransition] = useTransition();

  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  const stats = useMemo(() => {
    const paidCount = members.filter((entry) => entry.currentPayment?.status === "paid").length;
    const totalCount = members.length;
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
      totalCount,
      collected,
      outstanding,
      collectionRate:
        totalCount === 0 ? 0 : Math.round((paidCount / Math.max(totalCount, 1)) * 100),
    };
  }, [members, monthlyAmount]);

  const currentLimitReached = members.length >= memberLimit;

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

  const handleMemberAdded = (
    member: NonNullable<AddMemberFormState["member"]>,
    currentPayment: AddMemberFormState["currentPayment"],
  ) => {
    setMembers((current) =>
      current.some((entry) => entry.member.id === member.id)
        ? current
        : [
            ...current,
            {
              member,
              currentPayment: currentPayment ?? {
                id: `temp-${member.id}`,
                amount_due: monthlyAmount,
                amount_paid: 0,
                status: "unpaid",
              },
            },
          ],
    );
    setToast(`${member.name} added successfully ✓`);
    window.setTimeout(() => setToast(null), 2400);
  };

  const copyAllLinks = async () => {
    const shareText = `ChitMate — ${chitName}\n\nMember Portal Links:\n\n${members
      .map((entry) => `${entry.member.name}: ${window.location.origin}/member/${entry.member.invite_token}`)
      .join("\n\n")}\n\nClick your link to view your payment history and chit details.`;

    if (navigator.share) {
      await navigator.share({
        title: "ChitMate Member Links",
        text: shareText,
      });
      return;
    }

    await navigator.clipboard.writeText(shareText);
    setToast("Copied! ✓");
    window.setTimeout(() => setToast(null), 2400);
  };

  const handleBulkReminder = () => {
    const unpaidMembers = members.filter((entry) => entry.currentPayment?.status === "unpaid");

    if (unpaidMembers.length === 0) {
      window.alert("All members have paid this cycle!");
      return;
    }

    const memberList = unpaidMembers.map((entry) => `• ${entry.member.name}`).join("\n");
    const dueLine =
      nextAuctionDate && nextAuctionDate !== "Schedule pending"
        ? ` by *${nextAuctionDate}*`
        : "";
    const message = `Dear members of *${chitName}* 🙏\n\nThis is a friendly reminder that your contribution of *₹${Number(monthlyAmount).toLocaleString("en-IN")}* is due${dueLine}.\n\nPending payments:\n${memberList}\n\nPlease pay at your earliest convenience.\n\n_Managed via ChitMate_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  const openPayment = (paymentId: string) => {
    setOpenPaymentId(paymentId);
    setSelectedMode("Cash");
    setPaymentDate(new Date().toISOString().split("T")[0] ?? "");
    setNotes("");
  };

  const closePaymentPanel = () => {
    setOpenPaymentId(null);
    setSelectedMode("Cash");
    setPaymentDate(new Date().toISOString().split("T")[0] ?? "");
    setNotes("");
  };

  const confirmPayment = (paymentId: string) => {
    const target = members.find((entry) => entry.currentPayment?.id === paymentId);

    if (!target?.currentPayment) {
      return;
    }

    const previousMembers = members;
    setMembers((current) =>
      current.map((entry) =>
        entry.currentPayment?.id === paymentId
          ? {
              ...entry,
              currentPayment: {
                ...entry.currentPayment,
                amount_paid: entry.currentPayment.amount_due,
                status: "paid",
              },
            }
          : entry,
      ),
    );
    setOpenPaymentId(null);

    startTransition(async () => {
      const response = await fetch("/api/payments/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          paymentMode: selectedMode.toLowerCase().replace(/\s+/g, "_"),
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
      router.refresh();
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
              <div className="flex items-center gap-3">
                <span className="ledger-chip bg-[var(--color-surface-low)] text-[var(--color-text-body)]">
                  {members.length} / {memberLimit} members
                </span>
                <a
                  href="#add-member-form"
                  className={`primary-button ${currentLimitReached ? "pointer-events-none opacity-50" : ""}`}
                >
                  Add Member
                </a>
              </div>
            </div>

            {!isAuctionType ? (
              <div id="rotation-order" className="mb-5 rounded-[var(--radius-card)] bg-[var(--color-surface-low)] p-4">
                <p className="editorial-label !text-[var(--color-text-muted)]">Rotation Order</p>
                <p className="mt-3 text-sm text-[#6b7280]">
                  The pot will be distributed in this order. Each member receives the full pot in
                  their designated month.
                </p>
                <div className="mt-4 space-y-1">
                  {members.map((entry, index) => (
                    <div
                      key={entry.member.id}
                      className="flex items-center gap-3 py-3"
                      style={{ borderBottom: "1px solid #f5f3f0" }}
                    >
                      <div
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[0.875rem] font-bold"
                        style={{
                          background: entry.member.pot_taken ? "#dcfce7" : "#f5f3f0",
                          color: entry.member.pot_taken ? "#166534" : "#6b7280",
                        }}
                      >
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-[#1b1c1a]">{entry.member.name}</div>
                        <div className="text-[0.75rem] text-[#9ca3af]">
                          Month {index + 1} · {entry.member.pot_taken ? "Pot received ✓" : "Waiting"}
                        </div>
                      </div>
                      {entry.member.pot_taken ? (
                        <span className="ledger-chip bg-[#dcfce7] text-[#166534]">Done</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

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
                  (() => {
                    const unpaidPaymentId =
                      entry.currentPayment && entry.currentPayment.status !== "paid"
                        ? entry.currentPayment.id
                        : null;

                    return (
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
                              memberId={entry.member.id}
                              token={entry.member.invite_token}
                              chitName={chitName}
                              canMarkPaid={Boolean(unpaidPaymentId)}
                              onMarkPaid={unpaidPaymentId ? () => openPayment(unpaidPaymentId) : undefined}
                            />
                          }
                        />
                      </div>
                    );
                  })()
                ))}
              </div>
            )}
          </section>

          <section id="payments" className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="mb-5">
              <h2>Payments</h2>
              <p className="mt-1 text-sm text-[var(--color-text-body)]">
                Confirm collection for each member in the current cycle.
              </p>
            </div>

            {members.length === 0 ? (
              <EmptyState
                title="No payments yet"
                subtitle="Add members first and their current-cycle payment rows will appear here."
              />
            ) : (
              <div className="space-y-3">
                {members.map((entry, index) => (
                  <div
                    key={`${entry.member.id}-payment`}
                    className={`rounded-[var(--radius-card)] p-4 ${
                      index % 2 === 0 ? "bg-white" : "bg-[var(--color-surface-low)]"
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium text-[var(--color-text-primary)]">{entry.member.name}</p>
                        <p className="text-sm text-[var(--color-text-body)]">{entry.member.phone}</p>
                      </div>
                      <div className="flex flex-col gap-2 md:items-end">
                        <p className="font-medium text-[var(--color-text-primary)]">
                          {formatCurrency(Number(entry.currentPayment?.amount_due ?? monthlyAmount))}
                        </p>
                        {entry.currentPayment?.status === "paid" ? (
                          <span className="ledger-chip bg-[var(--color-success-bg)] text-[var(--color-success-text)]">
                            Paid
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => entry.currentPayment && openPayment(entry.currentPayment.id)}
                            className="amber-button"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </div>

                    {openPaymentId === entry.currentPayment?.id ? (
                      <div className="mt-3 rounded-[var(--radius-card)] bg-[var(--color-surface-low)] p-4">
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                          Mark payment for {entry.member.name}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {["Cash", "UPI", "Bank Transfer", "Other"].map((mode) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setSelectedMode(mode)}
                              className={`rounded-[var(--radius-button)] px-3 py-2 text-[0.8125rem] ${
                                selectedMode === mode
                                  ? "bg-[rgba(1,45,29,0.08)] text-[var(--color-primary)] shadow-[inset_0_0_0_2px_#1b4332]"
                                  : "bg-white text-[var(--color-text-body)] shadow-[inset_0_0_0_1px_rgba(209,213,219,1)]"
                              }`}
                            >
                              {mode}
                            </button>
                          ))}
                        </div>

                        <input
                          type="date"
                          value={paymentDate}
                          onChange={(event) => setPaymentDate(event.target.value)}
                          className="recessed-input mt-3 h-11 w-full"
                        />

                        <textarea
                          value={notes}
                          onChange={(event) => setNotes(event.target.value)}
                          placeholder="Optional notes"
                          className="recessed-input mt-3 min-h-24 w-full"
                        />

                        <div className="mt-3 flex gap-3">
                          <button
                            type="button"
                            onClick={() => entry.currentPayment && confirmPayment(entry.currentPayment.id)}
                            className="primary-button w-full justify-center"
                          >
                            Confirm Payment
                          </button>
                          <button
                            type="button"
                            onClick={closePaymentPanel}
                            className="ghost-button w-full justify-center"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>

          <AddMemberInlineForm
            chitGroupId={groupId}
            disabled={currentLimitReached}
            disabledMessage={
              currentLimitReached
                ? `This chit is full. You set a limit of ${memberLimit} members when creating this chit.`
                : undefined
            }
            onMemberAdded={handleMemberAdded}
          />
        </div>

        <div className="flex flex-col gap-4 xl:sticky xl:top-6">
          <section className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
            <h2>{monthLabel} Cycle Collection</h2>
            <div className="mt-5 flex items-center justify-between text-sm text-[var(--color-text-body)]">
              <span>
                {stats.paidCount} / {stats.totalCount} Members paid
              </span>
              <span>{stats.collectionRate}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-[var(--color-surface-low)]">
              <div
                className="h-2 rounded-full bg-[var(--color-primary-container)]"
                style={{ width: `${stats.collectionRate}%` }}
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
            <button
              type="button"
              className="primary-button mt-6 w-full justify-center"
              onClick={handleBulkReminder}
            >
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
    </>
  );
}
