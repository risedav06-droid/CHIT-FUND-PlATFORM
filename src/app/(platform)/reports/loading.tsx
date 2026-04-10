export default function ReportsLoading() {
  return (
    <div className="space-y-8">
      <div className="h-52 animate-pulse rounded-[1.75rem] bg-surface" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="h-36 animate-pulse rounded-[1.5rem] bg-white" />
        <div className="h-36 animate-pulse rounded-[1.5rem] bg-white" />
        <div className="h-36 animate-pulse rounded-[1.5rem] bg-white" />
        <div className="h-36 animate-pulse rounded-[1.5rem] bg-white" />
        <div className="h-36 animate-pulse rounded-[1.5rem] bg-white" />
      </div>
      <div className="h-96 animate-pulse rounded-[1.75rem] bg-white" />
    </div>
  );
}
