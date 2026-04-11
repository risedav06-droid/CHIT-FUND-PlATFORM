import type { Route } from "next";
import Link from "next/link";

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
  if (items.length === 0) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto pb-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative min-w-[5.5rem] flex-1 rounded-2xl border border-border bg-surface/60 px-3 py-3 text-center text-xs font-semibold text-foreground transition hover:border-brand hover:text-brand",
            )}
          >
            {item.title}
            {item.badgeCount && item.badgeCount > 0 ? (
              <span className="absolute right-2 top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] text-brand-foreground">
                {item.badgeCount > 9 ? "9+" : item.badgeCount}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </nav>
  );
}
