"use client";

import type { Route } from "next";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { StatusChip } from "@/components/ui/status-chip";

type ChitGroupCardProps = {
  name: string;
  memberCount: number;
  currentCycle: number;
  totalCycles: number;
  paidCount: number;
  totalMembers: number;
  nextAuction: string;
  outstandingAmount?: string;
  badge: "HIGH YIELD" | "STANDARD";
  href: string;
  reminderHref?: string;
};

export function ChitGroupCard({
  name,
  memberCount,
  currentCycle,
  totalCycles,
  paidCount,
  totalMembers,
  nextAuction,
  outstandingAmount,
  badge,
  href,
  reminderHref,
}: ChitGroupCardProps) {
  const { t } = useTranslation();
  const progress = totalMembers > 0 ? Math.min((paidCount / totalMembers) * 100, 100) : 0;

  return (
    <article className="card-surface rounded-[var(--radius-card)] p-6">
      <div className="grid gap-6 lg:grid-cols-[0.6fr_0.4fr]">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl text-[var(--color-text-primary)]">{name}</h3>
              <p className="mt-2 text-sm text-[var(--color-text-body)]">
                {memberCount} {t("chitGroup.members").toLowerCase()} • Cycle {currentCycle} of {totalCycles}
              </p>
            </div>
            {badge === "HIGH YIELD" ? (
              <span className="ledger-chip bg-[rgba(212,168,67,0.18)] text-[var(--color-amber-text)]">
                {t("chitGroup.highYield")}
              </span>
            ) : (
              <StatusChip status="completed">{t("chitGroup.standard")}</StatusChip>
            )}
          </div>

          <div className="mt-6">
            <div className="h-1 rounded-full bg-[var(--color-surface-low)]">
              <div
                className="h-1 rounded-full bg-[var(--color-primary-container)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-[var(--color-text-body)]">
              <span>
                {paidCount} / {totalMembers} {t("chitGroup.paid")}
              </span>
              <span>
                {t("dashboard.nextAuction")}: {nextAuction}
                {outstandingAmount ? ` · ${outstandingAmount} ${t("dashboard.outstanding").toLowerCase()}` : ""}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-5 rounded-[var(--radius-card)] bg-[var(--color-surface-low)] p-5">
          <div>
            <p className="editorial-label">{t("dashboard.nextAuction")}</p>
            <p className="mt-2 text-lg italic text-[var(--color-primary)]">{nextAuction}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={href as Route} className="ghost-button">
              {t("common.view")}
            </Link>
            {reminderHref ? (
              <a href={reminderHref} target="_blank" rel="noreferrer" className="primary-button">
                {t("dashboard.sendReminders")}
              </a>
            ) : (
              <button type="button" className="primary-button">
                {t("dashboard.sendReminders")}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
