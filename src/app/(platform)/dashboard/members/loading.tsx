import { Loading, MemberRowSkeleton } from "@/components/ui/loading";

export default function MembersLoading() {
  return (
    <div className="space-y-6">
      <section className="rounded-[var(--radius-card)] bg-white px-8 py-8 shadow-[var(--shadow-card)]">
        <Loading message="Loading member records" />
      </section>

      <section className="space-y-3 rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
        {Array.from({ length: 3 }).map((_, index) => (
          <MemberRowSkeleton key={index} />
        ))}
      </section>
    </div>
  );
}
