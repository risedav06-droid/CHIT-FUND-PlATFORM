import type { Route } from "next";
import Link from "next/link";

import { getPlatformNavigationForRole } from "@/config/navigation";
import { getPostLoginPath, type AuthenticatedSession } from "@/modules/auth/auth.service";
import { logoutAction } from "@/modules/auth/auth.actions";
import { NotificationBadge } from "@/components/layout/notification-badge";
import { MobileNav } from "@/components/layout/mobile-nav";

type PlatformShellProps = {
  session: AuthenticatedSession;
  children: React.ReactNode;
};

function getDisplayName(session: AuthenticatedSession) {
  const profileName = [session.user.profile?.firstName, session.user.profile?.lastName]
    .filter(Boolean)
    .join(" ");

  if (profileName) {
    return profileName;
  }

  if (session.user.member) {
    return [session.user.member.firstName, session.user.member.lastName]
      .filter(Boolean)
      .join(" ");
  }

  return session.user.email;
}

function getRoleLabel(role: string) {
  return role.replaceAll("_", " ");
}

export function PlatformShell({ session, children }: PlatformShellProps) {
  const roleNavigation = getPlatformNavigationForRole(session.user.role).map((item) => ({
    title: item.title,
    href: item.href as Route,
  }));
  const memberNavigation =
    session.user.role === "MEMBER" && session.user.member
      ? ([
          {
            title: "Dashboard",
            href: "/dashboard" as Route,
          },
          {
            title: "My Record",
            href: `/members/${session.user.member.id}` as Route,
          },
          {
            title: "Notifications",
            href: "/notifications" as Route,
          },
        ] as const)
      : roleNavigation;

  const mobileItems = memberNavigation.map((item) => ({
    ...item,
    badgeCount: item.href === "/notifications" ? session.unreadNotificationsCount : undefined,
  }));

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link href={getPostLoginPath(session)} className="text-lg font-semibold text-foreground">
                ChitFlow Platform
              </Link>
              <p className="text-sm text-muted">
                {session.user.role === "MEMBER"
                  ? "Self-service member view"
                  : "Controlled pilot operating workspace"}
              </p>
            </div>
            <div className="flex items-center gap-2 lg:hidden">
              <NotificationBadge unreadCount={session.unreadNotificationsCount} />
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-full border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground transition hover:border-brand hover:text-brand"
                >
                  Out
                </button>
              </form>
            </div>
          </div>

          <nav className="hidden flex-wrap gap-2 lg:flex">
            {memberNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition hover:border-brand hover:text-brand"
              >
                {item.title}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-border bg-white px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {getDisplayName(session)}
              </p>
              <p className="truncate text-xs uppercase tracking-[0.18em] text-muted">
                {getRoleLabel(session.user.role)}
              </p>
            </div>
            <div className="hidden items-center gap-2 lg:flex">
              <NotificationBadge unreadCount={session.unreadNotificationsCount} />
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-brand hover:text-brand"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        {children}
      </main>

      <MobileNav items={mobileItems} />
    </div>
  );
}
