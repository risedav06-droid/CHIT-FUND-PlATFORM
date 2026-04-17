"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

import { MobileNav } from "@/components/layout/mobile-nav";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { signOutAction } from "@/modules/auth/auth.actions";
import type { AuthenticatedSession } from "@/modules/auth/auth.service";

type PlatformShellProps = {
  session: AuthenticatedSession;
  children: React.ReactNode;
};

const navigationItems: Array<{
  title: string;
  href: Route;
  icon: React.ReactNode;
}> = [
  {
    title: "Dashboard",
    href: "/dashboard" as Route,
    icon: (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M3.5 10.5 10 4l6.5 6.5" />
        <path d="M5.5 9.5v6h9v-6" />
      </svg>
    ),
  },
  {
    title: "Chit Groups",
    href: "/dashboard/chit-groups" as Route,
    icon: (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="3.5" y="4" width="13" height="4" rx="1.2" />
        <rect x="3.5" y="12" width="13" height="4" rx="1.2" />
      </svg>
    ),
  },
  {
    title: "Member Directory",
    href: "/dashboard/members" as Route,
    icon: (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M6.5 8.1a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z" />
        <path d="M13.7 9.2a2.1 2.1 0 1 0 0-4.2 2.1 2.1 0 0 0 0 4.2Z" />
        <path d="M2.8 16.3c.6-2 2.3-3.1 4.7-3.1 2.5 0 4.2 1.1 4.8 3.1" />
        <path d="M12.2 15.8c.4-1.4 1.6-2.2 3.4-2.2 1 0 1.8.2 2.4.7" />
      </svg>
    ),
  },
  {
    title: "Financial Reports",
    href: "/dashboard/reports" as Route,
    icon: (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M4 15.5h12" />
        <path d="M6.2 15.5V9.8" />
        <path d="M10 15.5V5.8" />
        <path d="M13.8 15.5v-3.9" />
      </svg>
    ),
  },
  {
    title: "Settings",
    href: "/dashboard/settings" as Route,
    icon: (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M10 12.8A2.8 2.8 0 1 0 10 7.2a2.8 2.8 0 0 0 0 5.6Z" />
        <path d="M15.9 10.7v-1.4l-1.5-.4a4.7 4.7 0 0 0-.5-1.1l.8-1.3-1-1-1.3.8a4.7 4.7 0 0 0-1.1-.5l-.4-1.5H9l-.4 1.5a4.7 4.7 0 0 0-1.1.5l-1.3-.8-1 1 .8 1.3a4.7 4.7 0 0 0-.5 1.1l-1.5.4v1.4l1.5.4c.1.4.3.8.5 1.1l-.8 1.3 1 1 1.3-.8c.3.2.7.4 1.1.5l.4 1.5h1.4l.4-1.5c.4-.1.8-.3 1.1-.5l1.3.8 1-1-.8-1.3c.2-.3.4-.7.5-1.1l1.5-.4Z" />
      </svg>
    ),
  },
];

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function PlatformShell({ session, children }: PlatformShellProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const displayName = session.user.name || session.user.phone || "Organiser";

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-28 lg:pb-0">
      <div className="mx-auto flex min-h-screen max-w-[1720px] px-4 py-4 sm:px-6 lg:px-8">
        <aside className="hidden h-[calc(100vh-2rem)] w-[260px] shrink-0 flex-col rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-card)] lg:sticky lg:top-4 lg:flex">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#012d1d,#1b4332)] text-sm font-semibold text-white">
                CM
              </div>
              <p className="font-display text-[1.7rem] italic text-[var(--color-primary)]">
                {t("common.appName")}
              </p>
            </div>
            <p className="editorial-label mt-6">{t("nav.organiserPortal")}</p>
            <p className="mt-3 text-sm font-medium capitalize text-[var(--color-text-primary)]">
              {displayName}
            </p>
          </div>

          <nav className="mt-8 space-y-2">
            {navigationItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link gap-3 ${isActive ? "sidebar-link-active" : ""}`}
                >
                  <span>{item.icon}</span>
                  <span>{t(`nav.${item.title === "Dashboard"
                    ? "dashboard"
                    : item.title === "Chit Groups"
                      ? "chitGroups"
                      : item.title === "Member Directory"
                        ? "memberDirectory"
                        : item.title === "Financial Reports"
                          ? "financialReports"
                          : "settings"}`)}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-[var(--radius-card)] bg-[var(--color-surface-low)] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-container)] text-sm font-semibold text-white">
                {getInitials(displayName)}
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {displayName}
                </p>
                <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  {t("nav.managingDirector")}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-1 text-[0.75rem] uppercase tracking-[0.05em] text-[#717973]">
                Language / భాష
              </div>
              <LanguageSwitcher />
            </div>
            <form action={signOutAction} className="mt-4">
              <button type="submit" className="ghost-button w-full justify-center">
                {t("common.signOut")}
              </button>
            </form>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-x-hidden pl-0 lg:pl-6">{children}</main>
      </div>

      <MobileNav items={navigationItems.map(({ title, href }) => ({ title, href }))} />
    </div>
  );
}
