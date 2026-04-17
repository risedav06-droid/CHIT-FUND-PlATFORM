'use client';

import Link from "next/link";
import { useTranslation } from "react-i18next";

import { ChitGroupMembersPanel } from "@/components/dashboard/chit-group-members-panel";
import { StatusChip } from "@/components/ui/status-chip";
import { formatCurrency } from "@/lib/utils";

type DashboardChitGroupDetailClientProps = {
  group: any;
  monthLabel: string;
  monthlyAmount: number;
  potValue: number;
  endDateLabel: string;
  members: any[];
  currentMemberRows: any[];
  nextAuctionDate: string;
  daysUntilDue: number | null;
  defaulterCount: number;
};

export function DashboardChitGroupDetailClient({
  group,
  monthLabel,
  monthlyAmount,
  potValue,
  endDateLabel,
  members,
  currentMemberRows,
  nextAuctionDate,
  daysUntilDue,
  defaulterCount,
}: DashboardChitGroupDetailClientProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <section className="rounded-[var(--radius-card)] bg-white px-8 py-8 shadow-[var(--shadow-card)]">
        <Link href="/dashboard/chit-groups" className="editorial-label">
          ← {t("chitGroup.backToChitGroups")}
        </Link>
        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[1.875rem]">{group.name}</h1>
              <StatusChip status="active">{t("chitGroup.active")}</StatusChip>
            </div>
            <p className="editorial-label mt-4">{t("chitGroup.aprilCycle", { month: monthLabel })}</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            [t("chitGroup.duration_label"), `${group.duration_months} ${t("chitGroup.months")}`],
            [t("chitGroup.monthlyDeposit"), formatCurrency(monthlyAmount)],
            [t("chitGroup.potValue"), formatCurrency(potValue)],
            [t("chitGroup.commissionLabel"), `${group.commission_pct}%`],
            [t("chitGroup.endDate"), endDateLabel],
          ].map(([label, value], index) => (
            <div key={label} className="min-w-0 rounded-[var(--radius-card)] bg-[var(--color-surface-low)] px-5 py-5" style={index === 3 ? { boxShadow: "inset 4px 0 0 rgba(212,168,67,0.9)" } : undefined}>
              <p className="editorial-label !text-[var(--color-text-muted)]">{label}</p>
              <p className="mt-3 truncate font-display text-[1.5rem] text-[var(--color-text-primary)]">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-8 overflow-x-auto text-sm">
          <span className="border-b-2 border-[var(--color-primary-container)] pb-3 font-display text-[var(--color-text-primary)]">{t("chitGroup.members")}</span>
          <a href="#payments" className="pb-3 text-[var(--color-text-muted)]">{t("chitGroup.payments")}</a>
          {group.chit_type === "auction" ? (
            <Link href={`/dashboard/chit-groups/${group.id}/auction`} className="pb-3 text-[var(--color-text-muted)]">
              {t("chitGroup.auctions")}
            </Link>
          ) : (
            <a href="#rotation-order" className="pb-3 text-[var(--color-text-muted)]">
              {t("chitGroup.rotationOrder")}
            </a>
          )}
          <Link href={`/dashboard/chit-groups/${group.id}/statement/${members[0]?.id ?? ""}`} className="pb-3 text-[var(--color-text-muted)]">
            {t("chitGroup.statements")}
          </Link>
        </div>
      </section>

      <ChitGroupMembersPanel
        groupId={group.id}
        chitName={group.name}
        monthLabel={monthLabel}
        memberTargetCount={Number(group.member_count ?? 0)}
        monthlyAmount={monthlyAmount}
        isAuctionType={group.chit_type === "auction"}
        memberLimit={Number(group.member_count ?? 0)}
        limitReached={members.length >= Number(group.member_count ?? 0)}
        nextAuctionDate={nextAuctionDate}
        daysUntilDue={daysUntilDue}
        defaulterCount={defaulterCount}
        initialMembers={currentMemberRows}
      />
    </div>
  );
}
