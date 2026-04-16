'use client';

import { useEffect, useRef } from "react";

import { formatCurrency } from "@/lib/utils";

type DashboardPaymentStatusDonutProps = {
  paidPercent: number;
  collectedAmount: number;
  outstandingAmount: number;
};

export function DashboardPaymentStatusDonut({
  paidPercent,
  collectedAmount,
  outstandingAmount,
}: DashboardPaymentStatusDonutProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const size = 220;
    const center = size / 2;
    const radius = 72;
    const lineWidth = 18;
    const startAngle = -Math.PI / 2;
    const paidAngle = (Math.PI * 2 * paidPercent) / 100;

    context.clearRect(0, 0, size, size);
    context.lineCap = "round";

    context.beginPath();
    context.strokeStyle = "#f4dada";
    context.lineWidth = lineWidth;
    context.arc(center, center, radius, 0, Math.PI * 2);
    context.stroke();

    context.beginPath();
    context.strokeStyle = "#1b4332";
    context.lineWidth = lineWidth;
    context.arc(center, center, radius, startAngle, startAngle + paidAngle);
    context.stroke();
  }, [paidPercent]);

  return (
    <div className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2>Payment Status</h2>
          <p className="mt-1 text-sm text-[var(--color-text-body)]">
            Paid vs unpaid for the current collection cycle.
          </p>
        </div>
      </div>

      <div className="relative mt-6 flex items-center justify-center">
        <canvas ref={canvasRef} width={220} height={220} className="h-[220px] w-[220px]" />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-display text-[2rem] leading-none text-[var(--color-text-primary)]">
            {paidPercent}%
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-body)]">paid</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[var(--radius-card)] bg-[rgba(22,101,52,0.08)] p-4">
          <p className="editorial-label !text-[var(--color-success-text)]">Collected</p>
          <p className="mt-2 text-lg font-semibold text-[var(--color-success-text)]">
            {formatCurrency(collectedAmount)}
          </p>
        </div>
        <div className="rounded-[var(--radius-card)] bg-[rgba(153,27,27,0.08)] p-4">
          <p className="editorial-label !text-[var(--color-error-text)]">Outstanding</p>
          <p className="mt-2 text-lg font-semibold text-[var(--color-error-text)]">
            {formatCurrency(outstandingAmount)}
          </p>
        </div>
      </div>
    </div>
  );
}
