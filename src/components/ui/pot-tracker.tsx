type PotTrackerItem = {
  name: string;
  initials: string;
  status: "taken" | "waiting" | "you";
};

type PotTrackerProps = {
  members: PotTrackerItem[];
};

export function PotTracker({ members }: PotTrackerProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {members.map((member) => (
        <div key={`${member.name}-${member.initials}`} className="min-w-[5rem] text-center">
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface-low)] text-sm font-semibold text-[var(--color-primary)]">
            <span>{member.initials}</span>
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs shadow-[var(--shadow-card)]">
              {member.status === "taken" ? "✓" : member.status === "you" ? "★" : "◷"}
            </span>
          </div>
          <p
            className={`mt-3 text-sm ${member.status === "you" ? "font-semibold text-[var(--color-amber-text)]" : "text-[var(--color-text-body)]"}`}
          >
            {member.name}
          </p>
        </div>
      ))}
    </div>
  );
}
