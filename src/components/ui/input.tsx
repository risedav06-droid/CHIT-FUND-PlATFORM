import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "recessed-input h-11 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]/80",
        className,
      )}
      {...props}
    />
  );
}
