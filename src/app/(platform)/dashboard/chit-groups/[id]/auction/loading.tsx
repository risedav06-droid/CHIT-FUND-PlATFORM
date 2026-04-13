import { Loading, MemberRowSkeleton } from "@/components/ui/loading";

export default function AuctionLoading() {
  return (
    <div className="space-y-6">
      <section className="rounded-[var(--radius-card)] bg-white px-8 py-8 shadow-[var(--shadow-card)]">
        <Loading message="Fetching fund data" />
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.4fr_0.6fr]">
        <div
          className="rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)]"
          style={{ height: "320px", animation: "cm-loading-shimmer 1.8s ease-in-out infinite" }}
        >
          <style>{`
            @keyframes cm-loading-shimmer {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.45; }
            }
          `}</style>
        </div>
        <section className="space-y-3 rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
          {Array.from({ length: 3 }).map((_, index) => (
            <MemberRowSkeleton key={index} />
          ))}
        </section>
      </div>
    </div>
  );
}
