'use client';

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import type { CreateChitGroupFormState } from "@/app/(platform)/dashboard/chit-groups/actions";
import { createDashboardChitGroupAction } from "@/app/(platform)/dashboard/chit-groups/actions";
import { FormFeedback } from "@/components/ui/form-feedback";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";

const initialState: CreateChitGroupFormState = {};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-[0.75rem] text-[#dc2626]">{message}</p>;
}

function calcEndDate(startDate: string, duration: string, unit: "months" | "years"): string | null {
  if (!startDate || !duration) return null;
  const value = Number(duration);
  if (!value) return null;
  const date = new Date(startDate);
  const months = unit === "years" ? value * 12 : value;
  date.setMonth(date.getMonth() + months);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function CreateChitGroupForm() {
  const { t } = useTranslation();
  const [state, formAction, isPending] = useActionState(createDashboardChitGroupAction, initialState);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [memberCount, setMemberCount] = useState("20");
  const [monthlyAmount, setMonthlyAmount] = useState("5000");
  const [durationValue, setDurationValue] = useState("12");
  const [durationUnit, setDurationUnit] = useState<"months" | "years">("months");
  const [commissionPct, setCommissionPct] = useState("5");
  const [chitType, setChitType] = useState<"auction" | "fixed_rotation">("auction");
  const [startDate, setStartDate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (state.success && state.redirectTo) {
      window.location.href = state.redirectTo;
    }
  }, [state.redirectTo, state.success]);

  const summary = useMemo(() => {
    const members = Number(memberCount) || 0;
    const monthly = Number(monthlyAmount) || 0;
    const durationNumber = Number(durationValue) || 0;
    const months = durationUnit === "years" ? durationNumber * 12 : durationNumber;
    const commission = Number(commissionPct) || 0;
    const monthlyPot = members * monthly;

    return {
      months,
      monthlyPot,
      monthlyCommission: (monthlyPot * commission) / 100,
      totalValue: monthlyPot * months,
      endDate: calcEndDate(startDate, durationValue, durationUnit),
    };
  }, [commissionPct, durationUnit, durationValue, memberCount, monthlyAmount, startDate]);

  function validate(field: string, value: string, nextUnit = durationUnit) {
    setErrors((current) => {
      const next = { ...current };

      if (field === "name") {
        if (!value || value.trim().length < 3) next.name = t("errors.nameRequired");
        else delete next.name;
      }

      if (field === "memberCount") {
        const count = Number(value);
        if (!value || count < 2 || count > 100) next.memberCount = t("errors.membersRange");
        else delete next.memberCount;
      }

      if (field === "monthlyAmount") {
        const amount = Number(value);
        if (!value || amount <= 0) next.monthlyAmount = t("errors.amountRequired");
        else delete next.monthlyAmount;
      }

      if (field === "durationValue") {
        const months = nextUnit === "years" ? Number(value) * 12 : Number(value);
        if (!value || months < 1 || months > 120) {
          next.durationValue =
            nextUnit === "years"
              ? t("errors.durationYears")
              : t("errors.durationMonths");
        } else {
          delete next.durationValue;
        }
      }

      return next;
    });
  }

  const hasClientErrors = Object.keys(errors).length > 0;

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
            {t("common.back")}
          </Link>
          <h1 className="mt-4 text-[1.875rem]">{t("chitGroup.create")}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-text-body)]">
            {t("chitGroup.createSub")}
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

          <div className="grid gap-6">
            <label className="space-y-2">
              <span className="editorial-label !text-[var(--color-text-muted)]">{t("chitGroup.chitName")}</span>
              <Input
                name="name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  validate("name", event.target.value);
                }}
                placeholder={t("chitGroup.chitNamePlaceholder")}
                required
              />
              <FieldError message={errors.name || state.fieldErrors?.name} />
            </label>

            <div className="space-y-3">
              <span className="editorial-label !text-[var(--color-text-muted)]">{t("chitGroup.chitType")}</span>
              <input type="hidden" name="chitType" value={chitType} />
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  {
                    value: "auction" as const,
                    title: t("chitGroup.auctionBased"),
                    desc: t("chitGroup.auctionDesc"),
                  },
                  {
                    value: "fixed_rotation" as const,
                    title: t("chitGroup.fixedRotation"),
                    desc: t("chitGroup.fixedDesc"),
                  },
                ].map((option) => (
                  <div
                    key={option.value}
                    onClick={() => setChitType(option.value)}
                    className="cursor-pointer rounded-[var(--radius-card)] p-4 transition-all duration-150"
                    style={{
                      border:
                        chitType === option.value ? "2px solid #1b4332" : "1px solid #e5e7eb",
                      background: chitType === option.value ? "#e8f5ee" : "#ffffff",
                    }}
                  >
                    <div className="mb-1 text-[0.9rem] font-bold text-[#1b4332]">
                      {chitType === option.value ? "● " : "○ "}
                      {option.title}
                    </div>
                    <div className="text-[0.75rem] leading-[1.5] text-[#6b7280]">{option.desc}</div>
                  </div>
                ))}
              </div>
              <FieldError message={state.fieldErrors?.chitType} />
            </div>

            <label className="space-y-2">
              <span className="editorial-label !text-[var(--color-text-muted)]">{t("chitGroup.description")}</span>
              <Textarea
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t("chitGroup.descriptionPlaceholder")}
              />
            </label>

            <div className="grid gap-6 md:grid-cols-2">
              <label className="space-y-2">
                <span className="editorial-label !text-[var(--color-text-muted)]">{t("chitGroup.numberOfMembers")}</span>
                <Input
                  name="memberCount"
                  type="number"
                  min="2"
                  max="100"
                  value={memberCount}
                  onChange={(event) => {
                    setMemberCount(event.target.value);
                    validate("memberCount", event.target.value);
                  }}
                  placeholder={t("chitGroup.membersPlaceholder")}
                  required
                />
                <p className="text-sm text-[var(--color-text-muted)]">Including yourself as the foreman</p>
                <FieldError message={errors.memberCount || state.fieldErrors?.memberCount} />
              </label>

              <label className="space-y-2">
                <span className="editorial-label !text-[var(--color-text-muted)]">{t("chitGroup.monthlyAmount")} ₹</span>
                <Input
                  name="monthlyAmount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={monthlyAmount}
                  onChange={(event) => {
                    setMonthlyAmount(event.target.value);
                    validate("monthlyAmount", event.target.value);
                  }}
                  placeholder={t("chitGroup.amountPlaceholder")}
                  required
                />
                <FieldError message={errors.monthlyAmount || state.fieldErrors?.monthlyAmount} />
              </label>

              <label className="space-y-2">
                <span className="editorial-label !text-[var(--color-text-muted)]">{t("chitGroup.duration")}</span>
                <input
                  type="hidden"
                  name="durationMonths"
                  value={durationUnit === "years" ? String((Number(durationValue) || 0) * 12) : durationValue}
                />
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
                  <Input
                    type="number"
                    min="1"
                    max={durationUnit === "years" ? "10" : "120"}
                    value={durationValue}
                    onChange={(event) => {
                      setDurationValue(event.target.value);
                      validate("durationValue", event.target.value);
                    }}
                    placeholder={t("chitGroup.durationPlaceholder")}
                    required
                  />
                  <select
                    value={durationUnit}
                    onChange={(event) => {
                      const nextUnit = event.target.value as "months" | "years";
                      setDurationUnit(nextUnit);
                      validate("durationValue", durationValue, nextUnit);
                    }}
                    className="recessed-input h-11 w-full"
                  >
                    <option value="months">{t("chitGroup.months")}</option>
                    <option value="years">{t("chitGroup.years")}</option>
                  </select>
                </div>
                {durationUnit === "years" ? (
                  <p className="text-sm text-[var(--color-text-muted)]">
                    = {(Number(durationValue) || 0) * 12} months
                  </p>
                ) : null}
                <FieldError message={errors.durationValue || state.fieldErrors?.durationMonths} />
              </label>

              <label className="space-y-2">
                <span className="editorial-label !text-[var(--color-text-muted)]">{t("chitGroup.commission")}</span>
                <Input
                  name="commissionPct"
                  type="number"
                  min="0"
                  step="0.01"
                  value={commissionPct}
                  onChange={(event) => setCommissionPct(event.target.value)}
                  placeholder="5"
                  required
                />
                <p className="text-sm text-[var(--color-text-muted)]">Industry standard is 5% of the pot value</p>
                <FieldError message={state.fieldErrors?.commissionPct} />
              </label>
            </div>

            <label className="space-y-2">
                <span className="editorial-label !text-[var(--color-text-muted)]">{t("chitGroup.startDate")}</span>
              <Input
                name="startDate"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                required
              />
              <FieldError message={state.fieldErrors?.startDate} />
              {summary.endDate ? (
                <p className="mt-1 text-[0.8rem] font-medium text-[#1b4332]">
                  {t("chitGroup.estimatedEndDate", { date: summary.endDate })}
                </p>
              ) : null}
            </label>

            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={hasClientErrors || isPending}
                className="primary-button w-full justify-center disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[240px]"
              >
                {isPending ? (
                  <>
                    <span
                      className="mr-2 inline-block animate-spin"
                      style={{
                        width: 16,
                        height: 16,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTop: "2px solid white",
                        borderRadius: "50%",
                      }}
                    />
                    Creating...
                  </>
                ) : (
                  t("chitGroup.createButton")
                )}
              </button>
              <Link href="/dashboard" className="ghost-button w-full justify-center sm:w-auto">
                {t("common.cancel")}
              </Link>
            </div>
          </div>
        </form>
      </div>

      <aside className="xl:sticky xl:top-4 xl:self-start">
        <section
          className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]"
          style={{ boxShadow: "inset 4px 0 0 #1b4332, 0 4px 24px rgba(27,28,26,0.06)" }}
        >
          <p className="editorial-label">{t("common.tagline")}</p>
          <div className="mt-5 space-y-4 text-sm text-[var(--color-text-body)]">
            <div>
              <p className="editorial-label !text-[var(--color-text-muted)]">{t("chitGroup.chitName")}</p>
              <p className="mt-2 font-display text-[1.35rem] text-[var(--color-text-primary)]">
                {name || "Golden Years Circle"}
              </p>
            </div>
            <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-low)] p-4">
              <p className="editorial-label !text-[var(--color-text-muted)]">{t("chitGroup.potValue")}</p>
              <p className="mt-2 font-display text-[1.6rem] text-[var(--color-text-primary)]">
                {formatCurrency(summary.monthlyPot)}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div>
                <p className="editorial-label !text-[var(--color-text-muted)]">{t("chitGroup.commissionLabel")}</p>
                <p className="mt-2 font-display text-[1.35rem] text-[var(--color-text-primary)]">
                  {formatCurrency(summary.monthlyCommission)} per month
                </p>
              </div>
              <div>
                <p className="editorial-label !text-[var(--color-text-muted)]">{t("chitGroup.duration_label")}</p>
                <p className="mt-2 font-display text-[1.35rem] text-[var(--color-text-primary)]">
                  {summary.months === 0 ? "0 months" : `${summary.months} months`}
                </p>
              </div>
            </div>
            <div>
              <p className="editorial-label !text-[var(--color-text-muted)]">{t("chitGroup.potValue")}</p>
              <p className="mt-2 font-display text-[1.6rem] text-[var(--color-text-primary)]">
                {formatCurrency(summary.totalValue)}
              </p>
            </div>
            {summary.endDate ? (
              <div>
                <p className="editorial-label !text-[var(--color-text-muted)]">{t("chitGroup.endDate")}</p>
                <p className="mt-2 font-display text-[1.35rem] text-[var(--color-text-primary)]">
                  {summary.endDate}
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </aside>
    </div>
  );
}
