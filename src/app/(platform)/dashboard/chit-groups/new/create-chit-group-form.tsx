'use client';

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import type { CreateChitGroupFormState } from "@/app/(platform)/dashboard/chit-groups/actions";
import { createDashboardChitGroupAction } from "@/app/(platform)/dashboard/chit-groups/actions";
import { FormFeedback } from "@/components/ui/form-feedback";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";

const initialState: CreateChitGroupFormState = {};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-[var(--color-error-text)]">{message}</p>;
}

export function CreateChitGroupForm() {
  const [state, formAction, isPending] = useActionState(createDashboardChitGroupAction, initialState);
  const [name, setName] = useState("");
  const [memberCount, setMemberCount] = useState("20");
  const [monthlyAmount, setMonthlyAmount] = useState("5000");
  const [durationMonths, setDurationMonths] = useState("12");
  const [commissionPct, setCommissionPct] = useState("5");
  const [chitType, setChitType] = useState<"auction" | "fixed_rotation">("auction");

  useEffect(() => {
    if (state.success && state.redirectTo) {
      window.location.href = state.redirectTo;
    }
  }, [state.redirectTo, state.success]);

  const summary = useMemo(() => {
    const members = Number(memberCount) || 0;
    const monthly = Number(monthlyAmount) || 0;
    const months = Number(durationMonths) || 0;
    const commission = Number(commissionPct) || 0;
    const monthlyPot = members * monthly;

    return {
      monthlyPot,
      monthlyCommission: (monthlyPot * commission) / 100,
      totalValue: monthlyPot * months,
    };
  }, [commissionPct, durationMonths, memberCount, monthlyAmount]);

  const steps: Array<{ step: string; label: string; active: boolean }> = [
    { step: "Step 1", label: "Basic Info", active: true },
    { step: "Step 2", label: "Members", active: false },
    { step: "Step 3", label: "Launch", active: false },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <section className="rounded-[var(--radius-card)] bg-white px-8 py-8 shadow-[var(--shadow-card)]">
          <Link href="/dashboard" className="editorial-label">
            Back to dashboard
          </Link>
          <h1 className="mt-4 text-[1.875rem]">Create New Chit Group</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-text-body)]">
            Shape the group once and launch with a clean, member-ready structure.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {steps.map(({ step, label, active }) => (
              <div
                key={label}
                className={`rounded-[var(--radius-card)] px-4 py-4 ${active ? "bg-[rgba(1,45,29,0.08)] text-[var(--color-primary)]" : "bg-[var(--color-surface-low)] text-[var(--color-text-muted)]"}`}
              >
                <p className="editorial-label !text-current">{step}</p>
                <p className="mt-2 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <form action={formAction} className="rounded-[var(--radius-card)] bg-white p-8 shadow-[var(--shadow-card)]">
          <FormFeedback status={state.error ? "error" : undefined} message={state.error} />

          <div className="mt-0 grid gap-6">
            <label className="space-y-2">
              <span className="editorial-label !text-[var(--color-text-muted)]">Chit Name</span>
              <Input
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Golden Years Circle"
                aria-invalid={Boolean(state.fieldErrors?.name)}
                required
              />
              <FieldError message={state.fieldErrors?.name} />
            </label>

            <label className="space-y-2">
              <span className="editorial-label !text-[var(--color-text-muted)]">Description</span>
              <Textarea name="description" placeholder="Optional note for this fund" />
            </label>

            <div className="grid gap-6 md:grid-cols-2">
              <label className="space-y-2">
                <span className="editorial-label !text-[var(--color-text-muted)]">Number of Members</span>
                <Input
                  name="memberCount"
                  type="number"
                  min="2"
                  max="100"
                  value={memberCount}
                  onChange={(event) => setMemberCount(event.target.value)}
                  required
                />
                <p className="text-sm text-[var(--color-text-muted)]">Including yourself as the foreman</p>
                <FieldError message={state.fieldErrors?.memberCount} />
              </label>
              <label className="space-y-2">
                <span className="editorial-label !text-[var(--color-text-muted)]">Monthly Contribution Amount ₹</span>
                <Input
                  name="monthlyAmount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={monthlyAmount}
                  onChange={(event) => setMonthlyAmount(event.target.value)}
                  required
                />
                <FieldError message={state.fieldErrors?.monthlyAmount} />
              </label>
              <label className="space-y-2">
                <span className="editorial-label !text-[var(--color-text-muted)]">Duration in Months</span>
                <Input
                  name="durationMonths"
                  type="number"
                  min="1"
                  max="60"
                  value={durationMonths}
                  onChange={(event) => setDurationMonths(event.target.value)}
                  required
                />
                <FieldError message={state.fieldErrors?.durationMonths} />
              </label>
              <label className="space-y-2">
                <span className="editorial-label !text-[var(--color-text-muted)]">Foreman Commission %</span>
                <Input
                  name="commissionPct"
                  type="number"
                  min="0"
                  step="0.01"
                  value={commissionPct}
                  onChange={(event) => setCommissionPct(event.target.value)}
                  required
                />
                <p className="text-sm text-[var(--color-text-muted)]">Industry standard is 5% of the pot value</p>
                <FieldError message={state.fieldErrors?.commissionPct} />
              </label>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="editorial-label !text-[var(--color-text-muted)]">Chit Type</span>
                <span
                  title="Auction lets members bid monthly. Fixed rotation follows a pre-decided order."
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-surface-low)] text-xs text-[var(--color-text-muted)]"
                >
                  ?
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label
                  className={`cursor-pointer rounded-[var(--radius-card)] p-5 ${chitType === "auction" ? "bg-[rgba(1,45,29,0.08)] shadow-[inset_0_0_0_2px_#1b4332]" : "bg-[var(--color-surface-low)]"}`}
                >
                  <input
                    type="radio"
                    name="chitType"
                    value="auction"
                    checked={chitType === "auction"}
                    onChange={() => setChitType("auction")}
                    className="sr-only"
                  />
                  <p className="font-display text-[1.15rem] text-[var(--color-text-primary)]">Auction-based</p>
                  <p className="mt-2 text-sm text-[var(--color-text-body)]">Members bid monthly</p>
                  <p className="text-sm text-[var(--color-text-body)]">Highest discount wins</p>
                  <p className="text-sm text-[var(--color-text-body)]">Better for savings</p>
                </label>
                <label
                  className={`cursor-pointer rounded-[var(--radius-card)] p-5 ${chitType === "fixed_rotation" ? "bg-[rgba(1,45,29,0.08)] shadow-[inset_0_0_0_2px_#1b4332]" : "bg-[var(--color-surface-low)]"}`}
                >
                  <input
                    type="radio"
                    name="chitType"
                    value="fixed_rotation"
                    checked={chitType === "fixed_rotation"}
                    onChange={() => setChitType("fixed_rotation")}
                    className="sr-only"
                  />
                  <p className="font-display text-[1.15rem] text-[var(--color-text-primary)]">Fixed Rotation</p>
                  <p className="mt-2 text-sm text-[var(--color-text-body)]">Order decided upfront</p>
                  <p className="text-sm text-[var(--color-text-body)]">No bidding required</p>
                  <p className="text-sm text-[var(--color-text-body)]">Better for small groups</p>
                </label>
              </div>
              <FieldError message={state.fieldErrors?.chitType} />
            </div>

            <label className="space-y-2">
              <span className="editorial-label !text-[var(--color-text-muted)]">Start Date</span>
              <Input name="startDate" type="date" required />
              <FieldError message={state.fieldErrors?.startDate} />
            </label>

            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={isPending}
                className="primary-button w-full justify-center sm:w-auto sm:min-w-[240px]"
              >
                {isPending ? "Creating..." : "Create Chit Group"}
              </button>
              <Link href="/dashboard" className="ghost-button w-full justify-center sm:w-auto">
                Cancel
              </Link>
            </div>
          </div>
        </form>
      </div>

      <aside className="xl:sticky xl:top-4 xl:self-start">
        <section className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]" style={{ boxShadow: "inset 4px 0 0 #1b4332, 0 4px 24px rgba(27,28,26,0.06)" }}>
          <p className="editorial-label">Your Chit Summary</p>
          <div className="mt-5 space-y-4 text-sm text-[var(--color-text-body)]">
            <div>
              <p className="editorial-label !text-[var(--color-text-muted)]">Chit Name</p>
              <p className="mt-2 font-display text-[1.35rem] text-[var(--color-text-primary)]">
                {name || "Golden Years Circle"}
              </p>
            </div>
            <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-low)] p-4">
              <p className="editorial-label !text-[var(--color-text-muted)]">Monthly Pot</p>
              <p className="mt-2 font-display text-[1.6rem] text-[var(--color-text-primary)]">
                {formatCurrency(summary.monthlyPot)}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div>
                <p className="editorial-label !text-[var(--color-text-muted)]">Your Commission</p>
                <p className="mt-2 font-display text-[1.35rem] text-[var(--color-text-primary)]">
                  {formatCurrency(summary.monthlyCommission)} per month
                </p>
              </div>
              <div>
                <p className="editorial-label !text-[var(--color-text-muted)]">Duration</p>
                <p className="mt-2 font-display text-[1.35rem] text-[var(--color-text-primary)]">
                  {durationMonths || "0"} months
                </p>
              </div>
            </div>
            <div>
              <p className="editorial-label !text-[var(--color-text-muted)]">Total Value</p>
              <p className="mt-2 font-display text-[1.6rem] text-[var(--color-text-primary)]">
                {formatCurrency(summary.totalValue)}
              </p>
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}
