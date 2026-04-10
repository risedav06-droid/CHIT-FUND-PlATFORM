import type { Route } from "next";
import Link from "next/link";

type NotificationBadgeProps = {
  unreadCount: number;
  href?: Route;
};

export function NotificationBadge({
  unreadCount,
  href = "/notifications" as Route,
}: NotificationBadgeProps) {
  return (
    <Link
      href={href}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand"
      aria-label="Open notifications"
    >
      N
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-brand-foreground">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
