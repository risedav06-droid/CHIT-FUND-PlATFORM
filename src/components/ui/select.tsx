import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "recessed-input h-11 appearance-none text-sm text-[var(--color-text-primary)]",
        className,
      )}
      {...props}
    />
  );
}
