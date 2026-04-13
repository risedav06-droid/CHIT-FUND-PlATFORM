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
      className="card-surface relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(255,255,255,0.94)] text-sm font-medium text-foreground transition hover:-translate-y-0.5 hover:text-[var(--color-primary-container)]"
      aria-label="Open notifications"
    >
      <span className="editorial-label !text-[var(--color-primary-container)]">NT</span>
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[linear-gradient(135deg,#d4a843,#eec058)] px-1.5 py-0.5 text-[10px] font-bold text-foreground">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
