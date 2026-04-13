'use client';

export function PrintStatementButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="primary-button print:hidden"
    >
      Print / Save as PDF
    </button>
  );
}
