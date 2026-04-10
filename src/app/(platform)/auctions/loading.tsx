export default function AuctionsLoading() {
  return (
    <div className="space-y-8">
      <div className="h-52 animate-pulse rounded-[1.75rem] bg-surface" />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.4fr]">
        <div className="h-96 animate-pulse rounded-[1.75rem] bg-white" />
        <div className="h-96 animate-pulse rounded-[1.75rem] bg-white" />
      </div>
    </div>
  );
}
