import { Loading, StatCardSkeleton } from "@/components/ui/loading";

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      <section className="rounded-[var(--radius-card)] bg-white px-8 py-8 shadow-[var(--shadow-card)]">
        <Loading message="Preparing your ledger" />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </section>

      <section
        className="rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)]"
        style={{ height: "320px", animation: "cm-loading-shimmer 1.8s ease-in-out infinite" }}
      >
        <style>{`
          @keyframes cm-loading-shimmer {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.45; }
          }
        `}</style>
      </section>
    </div>
  );
}
