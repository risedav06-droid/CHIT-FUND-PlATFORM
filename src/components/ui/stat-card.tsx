import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  hint?: string;
  highlight?: boolean;
};

export function StatCard({
  label,
  value,
  icon,
  hint,
  highlight = false,
}: StatCardProps) {
  return (
    <article className="card-surface rounded-[var(--radius-card)] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <p className="editorial-label">{label}</p>
        {icon ? (
          <div className="text-[var(--color-text-muted)]">{icon}</div>
        ) : null}
      </div>
      <p
        data-display="true"
        className={cn(
          "mt-4 break-words text-[2rem] leading-[1.15] tracking-[-0.02em]",
          highlight ? "text-[#dc2626]" : "text-[var(--color-text-primary)]",
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-3 text-sm leading-7 text-[var(--color-text-body)]">{hint}</p>
      ) : null}
    </article>
  );
}
