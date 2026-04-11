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
        "rounded-2xl border px-4 py-3",
        status === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-rose-200 bg-rose-50 text-rose-800",
      )}
    >
      <p className="text-sm font-semibold">
        {status === "success" ? "Saved" : "Action needed"}
      </p>
      <p className="mt-1 text-sm leading-6">{message}</p>
    </div>
  );
}
