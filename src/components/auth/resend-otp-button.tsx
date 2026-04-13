'use client';

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type ResendOtpButtonProps = {
  className?: string;
};

export function ResendOtpButton({ className }: ResendOtpButtonProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(30);

  useEffect(() => {
    if (remainingSeconds <= 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setRemainingSeconds((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [remainingSeconds]);

  return (
    <button
      type="submit"
      disabled={remainingSeconds > 0}
      className={cn(
        "text-sm font-medium text-[var(--color-primary-container)] transition disabled:text-[var(--text-body)] disabled:opacity-80",
        className,
      )}
    >
      Didn&apos;t receive it? {remainingSeconds > 0 ? `Resend in ${remainingSeconds}s` : "Resend now"}
    </button>
  );
}
