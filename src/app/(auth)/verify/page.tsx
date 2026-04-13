import Link from "next/link";

import { authService } from "@/modules/auth/auth.service";

export default async function VerifyPage() {
  await authService.redirectIfAuthenticated();

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <section className="card-surface w-full max-w-xl rounded-[calc(var(--radius-card)+8px)] bg-[rgba(255,255,255,0.94)] p-8 shadow-[var(--shadow-float)] sm:p-10">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#012d1d,#1b4332)] text-lg font-semibold text-white shadow-[var(--shadow-card)]">
            CM
          </div>
          <h1 className="mt-6 text-4xl text-foreground">Check your email</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--text-body)]">
            We now use Supabase email magic links for development sign-in. Open
            the link in your inbox to continue.
          </p>
          <Link
            href="/login"
            className="primary-button mt-8 inline-flex rounded-full px-5 py-3 text-sm font-semibold"
          >
            Back to login
          </Link>
        </div>
      </section>
    </main>
  );
}
