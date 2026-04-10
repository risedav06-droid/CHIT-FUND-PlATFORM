import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition focus:border-brand",
        className,
      )}
      {...props}
    />
  );
}
