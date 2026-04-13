import { StatusChip } from "@/components/ui/status-chip";

type MemberRowProps = {
  name: string;
  phone: string;
  initials: string;
  amount: string;
  status: "paid" | "unpaid" | "partial";
  potTaken: boolean;
  actions?: React.ReactNode;
};

export function MemberRow({
  name,
  phone,
  initials,
  amount,
  status,
  potTaken,
  actions,
}: MemberRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-container)] text-sm font-semibold text-white">
        {initials}
      </div>

      <div className="min-w-0 flex-[1_1_160px]">
        <p className="truncate font-medium text-[var(--color-text-primary)]">{name}</p>
        <p className="truncate text-sm text-[var(--color-text-body)]">{phone}</p>
      </div>

      <div className="min-w-0 flex-[0_1_110px] text-left sm:text-right">
        <p className="truncate font-medium text-[var(--color-text-primary)]">{amount}</p>
      </div>

      <div className="flex-[0_0_88px]">
        <StatusChip status={status}>{status}</StatusChip>
      </div>

      <div className="flex-[0_0_88px]">
        {potTaken ? (
          <StatusChip status="active">Taken</StatusChip>
        ) : (
          <span className="text-sm text-[var(--color-text-body)]">Waiting</span>
        )}
      </div>

      <div className="ml-auto shrink-0">
        {actions}
      </div>
    </div>
  );
}
