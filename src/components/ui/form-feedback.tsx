import type { PageFeedback } from "@/lib/action-state";
import { cn } from "@/lib/utils";

export function FormFeedback({ status, message }: PageFeedback) {
  if (!status || !message) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      role={status === "error" ? "alert" : "status"}
      className={cn(
        "mt-6 rounded-[var(--radius-card)] px-5 py-4 shadow-[var(--shadow-card)]",
        status === "success"
          ? "bg-[var(--color-success-bg)] text-[var(--color-success-text)]"
          : "bg-[var(--color-error-bg)] text-[var(--color-error-text)]",
      )}
    >
      <p className="editorial-label text-current">
        {status === "success" ? "Saved" : "Action needed"}
      </p>
      <p className="mt-2 text-sm leading-7">{message}</p>
    </div>
  );
}
