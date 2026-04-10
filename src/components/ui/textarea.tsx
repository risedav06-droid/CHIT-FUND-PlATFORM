import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-xl border border-border bg-white px-3 py-3 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-brand",
        className,
      )}
      {...props}
    />
  );
}
