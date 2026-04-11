type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
};

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <article className="rounded-[1.5rem] border border-border bg-white p-4 sm:p-5">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-3 break-words text-xl font-semibold text-foreground sm:text-2xl">
        {value}
      </p>
      {hint ? <p className="mt-2 text-sm leading-6 text-muted">{hint}</p> : null}
    </article>
  );
}
