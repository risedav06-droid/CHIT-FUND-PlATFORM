import { StatusChip } from "@/components/ui/status-chip";

type PaymentLedgerItemProps = {
  month: string;
  date: string;
  mode: string;
  amount: string;
  status: "paid" | "unpaid" | "partial";
  current?: boolean;
};

export function PaymentLedgerItem({
  month,
  date,
  mode,
  amount,
  status,
  current = false,
}: PaymentLedgerItemProps) {
  return (
    <article className="timeline-item py-2">
      <div
        className={`absolute left-0 top-3 flex h-5 w-5 items-center justify-center rounded-full ${current ? "bg-[var(--color-primary-container)]" : "bg-[rgba(113,121,115,0.24)]"}`}
      />
      <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className={`${current ? "font-semibold text-[var(--color-text-primary)]" : "text-[var(--color-text-primary)]"}`}>
              {month}
            </p>
            <p className="text-sm text-[var(--color-text-body)]">{date}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              {mode}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {current ? (
              <span className="ledger-chip bg-[rgba(212,168,67,0.18)] text-[var(--color-amber-text)]">
                {amount}
              </span>
            ) : (
              <p className="font-medium text-[var(--color-text-primary)]">{amount}</p>
            )}
            <StatusChip status={status}>{status}</StatusChip>
          </div>
        </div>
      </div>
    </article>
  );
}
