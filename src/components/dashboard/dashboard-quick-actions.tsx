'use client';

import type { Route } from "next";
import Link from "next/link";
import { useTranslation } from "react-i18next";

type DashboardQuickActionsProps = {
  bulkReminderMessage: string;
};

const actions = [
  {
    href: "/dashboard/chit-groups/new" as Route,
    label: "Create Chit",
    icon: "+",
    description: "Launch a new fund",
  },
  {
    href: "/dashboard/chit-groups#add-member-form" as Route,
    label: "Add Member",
    icon: "M",
    description: "Grow your circles",
  },
  {
    href: "/dashboard/reports" as Route,
    label: "Statement",
    icon: "S",
    description: "Open your reports",
  },
];

export function DashboardQuickActions({ bulkReminderMessage }: DashboardQuickActionsProps) {
  const { t } = useTranslation();
  const sendReminders = () => {
    if (!bulkReminderMessage) {
      window.alert("No pending reminders right now.");
      return;
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(bulkReminderMessage)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="space-y-4">
      <div>
        <h2>{t("dashboard.quickActions")}</h2>
        <p className="mt-1 text-sm text-[var(--color-text-body)]">
          Jump into your most common organiser tasks.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {actions.slice(0, 2).map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="card-surface rounded-[var(--radius-card)] p-5 transition-transform duration-200 hover:-translate-y-0.5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-low)] text-sm font-semibold text-[var(--color-primary)]">
              {action.icon}
            </div>
            <p className="mt-4 text-lg font-medium text-[var(--color-text-primary)]">
              {action.label === "Create Chit"
                ? t("dashboard.createChit")
                : action.label === "Add Member"
                  ? t("dashboard.addMember")
                  : t("dashboard.statement")}
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-body)]">{action.description}</p>
          </Link>
        ))}

        <button
          type="button"
          onClick={sendReminders}
          className="card-surface rounded-[var(--radius-card)] p-5 text-left transition-transform duration-200 hover:-translate-y-0.5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(37,211,102,0.14)] text-sm font-semibold text-[#25d366]">
            W
          </div>
          <p className="mt-4 text-lg font-medium text-[var(--color-text-primary)]">{t("dashboard.sendReminders")}</p>
          <p className="mt-1 text-sm text-[var(--color-text-body)]">Open WhatsApp for all pending members</p>
        </button>

        <Link
          href={actions[2].href}
          className="card-surface rounded-[var(--radius-card)] p-5 transition-transform duration-200 hover:-translate-y-0.5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-low)] text-sm font-semibold text-[var(--color-primary)]">
            {actions[2].icon}
          </div>
          <p className="mt-4 text-lg font-medium text-[var(--color-text-primary)]">{t("dashboard.statement")}</p>
          <p className="mt-1 text-sm text-[var(--color-text-body)]">{actions[2].description}</p>
        </Link>
      </div>
    </section>
  );
}
