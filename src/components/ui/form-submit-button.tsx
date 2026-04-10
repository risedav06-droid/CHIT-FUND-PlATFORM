'use client';

import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

type FormSubmitButtonProps = {
  children: React.ReactNode;
  className?: string;
};

export function FormSubmitButton({
  children,
  className,
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {pending ? "Saving..." : children}
    </button>
  );
}
