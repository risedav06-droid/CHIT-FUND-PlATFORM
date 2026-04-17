 "use client";

import type { Route } from "next";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

type MobileNavItem = {
  title: string;
  href: Route;
  badgeCount?: number;
};

type MobileNavProps = {
  items: MobileNavItem[];
};

export function MobileNav({ items }: MobileNavProps) {
  const { t } = useTranslation();
  if (items.length === 0) {
    return null;
  }

  return (
    <nav className="glass-shell fixed inset-x-3 bottom-3 z-40 rounded-[calc(var(--radius-card)+6px)] px-3 py-3 shadow-[var(--shadow-float)] lg:hidden">
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto pb-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative min-w-[5.5rem] flex-1 rounded-[var(--radius-button)] px-3 py-3 text-center text-[11px] font-medium tracking-[0.06em] text-[var(--text-body)] transition hover:bg-white/90 hover:text-[var(--color-primary-container)]",
            )}
          >
            {t(`nav.${item.title === "Dashboard"
              ? "dashboard"
              : item.title === "Chit Groups"
                ? "chitGroups"
                : item.title === "Member Directory"
                  ? "memberDirectory"
                  : item.title === "Financial Reports"
                    ? "financialReports"
                    : "settings"}`)}
            {item.badgeCount && item.badgeCount > 0 ? (
              <span className="absolute right-2 top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-[var(--color-primary-container)] px-1 text-[10px] text-white">
                {item.badgeCount > 9 ? "9+" : item.badgeCount}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </nav>
  );
}
