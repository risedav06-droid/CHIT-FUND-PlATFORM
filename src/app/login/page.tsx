import Link from "next/link";

import { FormFeedback } from "@/components/ui/form-feedback";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Input } from "@/components/ui/input";
import { readFeedback } from "@/lib/action-state";
import { loginAction } from "@/modules/auth/auth.actions";
import { authService } from "@/modules/auth/auth.service";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  await authService.redirectIfAuthenticated();

  const rawSearchParams = await searchParams;
  const feedback = readFeedback(rawSearchParams);
  const nextPath =
    typeof rawSearchParams.next === "string" ? rawSearchParams.next : "/dashboard";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-12 lg:px-10">
      <div className="grid w-full gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="rounded-[2rem] border border-border bg-surface p-8 shadow-[0_24px_80px_-48px_rgba(31,27,23,0.45)] lg:p-10">
          <span className="inline-flex rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand">
            Pilot access
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Secure sign-in for staff and members
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-muted">
            ChitFlow now uses password login, durable server-side sessions, and
            role-aware access so organizers, agents, and members only see the
            work that belongs to them.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <article className="rounded-[1.5rem] border border-border bg-white/80 p-5">
              <h2 className="text-lg font-semibold text-foreground">Staff access</h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                Organizers and agents can work from the operational dashboard,
                collections, auctions, notifications, and pilot exports based on
                their assigned role.
              </p>
            </article>
            <article className="rounded-[1.5rem] border border-border bg-white/80 p-5">
              <h2 className="text-lg font-semibold text-foreground">Member access</h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                Members are limited to their own dashboard, their own member
                record, and their notification center.
              </p>
            </article>
          </div>
        </section>

        <section className="rounded-[2rem] border border-border bg-white p-8 shadow-[0_24px_80px_-48px_rgba(31,27,23,0.32)]">
          <div className="mb-6">
            <p className="text-sm font-medium text-brand">Login</p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              Enter your credentials
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted">
              Demo users are created by the pilot seed script. After login,
              you&apos;ll return to your requested page.
            </p>
          </div>

          <FormFeedback {...feedback} />

          <form action={loginAction} className="mt-6 space-y-4">
            <input type="hidden" name="next" value={nextPath} />
            <label className="space-y-2 text-sm font-medium text-foreground">
              <span>Email</span>
              <Input name="email" type="email" autoComplete="email" required />
            </label>

            <label className="space-y-2 text-sm font-medium text-foreground">
              <span>Password</span>
              <Input
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>

            <div className="sticky bottom-4 rounded-[1.25rem] border border-border bg-white/95 p-3 backdrop-blur">
              <FormSubmitButton className="w-full justify-center py-3">
                Sign in
              </FormSubmitButton>
            </div>
          </form>

          <p className="mt-6 text-sm text-muted">
            Need the overview first?{" "}
            <Link href="/" className="font-semibold text-brand">
              Return to the product landing page
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
