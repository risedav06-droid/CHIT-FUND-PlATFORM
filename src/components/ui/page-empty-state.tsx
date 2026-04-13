import type { Route } from "next";
import Link from "next/link";

type PageEmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: Route;
};

export function PageEmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: PageEmptyStateProps) {
  return (
    <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-low)] px-6 py-8 shadow-[var(--shadow-card)]">
      <p className="editorial-label">A quiet start</p>
      <h3 className="mt-3 text-xl text-[var(--color-text-primary)]">{title}</h3>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-text-body)]">
        {description}
      </p>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className="primary-button mt-5">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
