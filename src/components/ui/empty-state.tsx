import type { Route } from "next";
import Link from "next/link";

type EmptyStateProps = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ReactNode;
  amberGlow?: boolean;
};

export function EmptyState({
  eyebrow,
  title,
  subtitle,
  actionLabel,
  actionHref,
  icon,
  amberGlow = false,
}: EmptyStateProps) {
  return (
    <div
      className="rounded-[var(--radius-card)] p-8 text-center shadow-[var(--shadow-card)]"
      style={{
        background: amberGlow
          ? "radial-gradient(circle at top left, rgba(238,192,88,0.14), transparent 45%), #ffffff"
          : "#ffffff",
      }}
    >
      {icon ? <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface-low)] text-[var(--color-primary)]">{icon}</div> : null}
      {eyebrow ? <p className="editorial-label">{eyebrow}</p> : null}
      <h3 className="mt-3 text-[1.4rem] leading-tight text-[var(--color-text-primary)]">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[var(--color-text-body)]">{subtitle}</p>
      {actionLabel && actionHref ? (
        <Link href={actionHref as Route} className="primary-button mt-6 inline-flex">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
