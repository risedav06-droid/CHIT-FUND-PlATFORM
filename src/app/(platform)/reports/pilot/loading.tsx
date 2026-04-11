export default function PilotReadinessLoading() {
  return (
    <div className="space-y-8">
      <section className="rounded-[1.75rem] border border-border bg-surface p-6">
        <div className="h-4 w-32 animate-pulse rounded-full bg-white/70" />
        <div className="mt-6 h-10 w-80 animate-pulse rounded-2xl bg-white/70" />
        <div className="mt-4 h-4 w-full max-w-3xl animate-pulse rounded-full bg-white/70" />
        <div className="mt-3 h-4 w-full max-w-2xl animate-pulse rounded-full bg-white/70" />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[1.5rem] border border-border bg-white p-5"
          >
            <div className="h-4 w-24 animate-pulse rounded-full bg-surface" />
            <div className="mt-5 h-8 w-16 animate-pulse rounded-2xl bg-surface" />
            <div className="mt-3 h-4 w-32 animate-pulse rounded-full bg-surface" />
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[1.75rem] border border-border bg-white p-6"
          >
            <div className="h-6 w-40 animate-pulse rounded-full bg-surface" />
            <div className="mt-6 space-y-4">
              {Array.from({ length: 3 }).map((__, innerIndex) => (
                <div
                  key={innerIndex}
                  className="rounded-2xl border border-border bg-surface/40 p-4"
                >
                  <div className="h-4 w-40 animate-pulse rounded-full bg-white" />
                  <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-white" />
                  <div className="mt-2 h-4 w-3/4 animate-pulse rounded-full bg-white" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
