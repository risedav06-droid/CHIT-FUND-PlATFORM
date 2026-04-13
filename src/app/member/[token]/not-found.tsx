import Link from "next/link";

export default function MemberNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <section className="card-surface w-full max-w-lg rounded-[calc(var(--radius-card)+8px)] p-8 text-center shadow-[var(--shadow-float)]">
        <p className="editorial-label">Member portal</p>
        <h1 className="mt-4 text-4xl text-foreground">Link not found</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--text-body)]">
          This member link is missing or expired. Ask your organiser to share a fresh ChitMate invite.
        </p>
        <Link href="/login" className="primary-button mt-8 inline-flex items-center justify-center px-5 py-3 text-sm font-medium">
          Open ChitMate
        </Link>
      </section>
    </main>
  );
}
