type ActivityFeedItemProps = {
  type: "payment" | "auction" | "missed" | "new_member";
  title: string;
  subtitle: string;
  time: string;
};

const colorMap = {
  payment: "bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  auction: "bg-[rgba(212,168,67,0.18)] text-[var(--color-amber-text)]",
  missed: "bg-[var(--color-error-bg)] text-[var(--color-error-text)]",
  new_member: "bg-[rgba(15,118,110,0.14)] text-teal-700",
};

export function ActivityFeedItem({
  type,
  title,
  subtitle,
  time,
}: ActivityFeedItemProps) {
  return (
    <article className="rounded-[var(--radius-card)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold ${colorMap[type]}`}
        >
          {type === "payment" ? "₹" : type === "auction" ? "A" : type === "missed" ? "!" : "+"}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-[var(--color-text-primary)]">{title}</p>
          <p className="mt-1 text-sm text-[var(--color-text-body)]">{subtitle}</p>
          <p className="mt-2 text-[0.6875rem] text-[var(--color-text-muted)]">{time}</p>
        </div>
      </div>
    </article>
  );
}
