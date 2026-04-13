import { cn } from "@/lib/utils";

type Status = "paid" | "unpaid" | "partial" | "active" | "completed";

const statusClassMap: Record<Status, string> = {
  paid: "chip-paid",
  unpaid: "chip-unpaid",
  partial: "chip-partial",
  active: "chip-active",
  completed: "chip-completed",
};

type StatusChipProps = {
  status: Status;
  children?: React.ReactNode;
  className?: string;
};

export function StatusChip({ status, children, className }: StatusChipProps) {
  return (
    <span className={cn(statusClassMap[status], className)}>
      {children ?? status}
    </span>
  );
}
