'use client';

import type { CSSProperties } from "react";

type PrintStatementButtonProps = {
  className?: string;
  style?: CSSProperties;
};

export function PrintStatementButton({ className, style }: PrintStatementButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={className ?? "primary-button print:hidden"}
      style={style}
    >
      Print / Save as PDF
    </button>
  );
}
