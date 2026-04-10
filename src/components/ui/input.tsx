import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-brand",
        className,
      )}
      {...props}
    />
  );
}
