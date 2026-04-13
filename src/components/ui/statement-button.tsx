'use client';

export function StatementButton() {
  return (
    <button
      type="button"
      className="amber-button w-full"
      onClick={() => {
        window.alert("Statement coming soon");
      }}
    >
      Download Statement
    </button>
  );
}
