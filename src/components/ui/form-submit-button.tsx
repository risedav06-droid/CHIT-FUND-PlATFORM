'use client';

import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

type FormSubmitButtonProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "amber";
  pendingLabel?: string;
};

export function FormSubmitButton({
  children,
  className,
  variant = "primary",
  pendingLabel = "Working...",
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        variant === "amber" ? "amber-button" : "primary-button",
        "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0",
        className,
      )}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
