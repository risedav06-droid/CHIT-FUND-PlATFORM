export default function LoginLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-12 lg:px-10">
      <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="h-[28rem] animate-pulse rounded-[2rem] bg-surface" />
        <div className="h-[28rem] animate-pulse rounded-[2rem] bg-white" />
      </div>
    </main>
  );
}
