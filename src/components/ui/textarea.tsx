import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "recessed-input min-h-28 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]/80",
        className,
      )}
      {...props}
    />
  );
}
