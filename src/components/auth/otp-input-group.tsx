'use client';

import { useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type OTPInputGroupProps = {
  name?: string;
  length?: number;
};

export function OTPInputGroup({
  name = "otp",
  length = 6,
}: OTPInputGroupProps) {
  const [value, setValue] = useState(Array.from({ length }, () => ""));
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const joinedValue = useMemo(() => value.join(""), [value]);

  function updateAt(index: number, nextValue: string) {
    const digit = nextValue.replace(/\D/g, "").slice(-1);
    setValue((current) => {
      const copy = [...current];
      copy[index] = digit;
      return copy;
    });

    if (digit && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);

    if (!digits) {
      return;
    }

    setValue((current) =>
      current.map((_, index) => digits[index] ?? ""),
    );

    const focusIndex = Math.min(digits.length, length - 1);
    refs.current[focusIndex]?.focus();
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={joinedValue} />
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {value.map((digit, index) => (
          <input
            key={index}
            ref={(node) => {
              refs.current[index] = node;
            }}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            aria-label={`OTP digit ${index + 1}`}
            maxLength={1}
            value={digit}
            onChange={(event) => updateAt(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            className={cn(
              "h-14 w-12 rounded-[var(--radius-input)] bg-[var(--surface-high)] text-center text-xl font-semibold text-foreground outline-none transition focus:bg-white focus:[box-shadow:inset_0_-2px_0_var(--brand-strong)] sm:h-16 sm:w-14",
            )}
          />
        ))}
      </div>
    </div>
  );
}
