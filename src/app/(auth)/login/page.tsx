import { LoginForm } from "@/components/auth/login-form";
import { authService } from "@/modules/auth/auth.service";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  await authService.redirectIfAuthenticated();

  const rawSearchParams = await searchParams;
  const nextPath =
    typeof rawSearchParams.next === "string" ? rawSearchParams.next : "/dashboard";

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <section className="card-surface w-full max-w-xl rounded-[calc(var(--radius-card)+8px)] bg-[rgba(255,255,255,0.94)] p-8 shadow-[var(--shadow-float)] sm:p-10">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#012d1d,#1b4332)] text-lg font-semibold text-white shadow-[var(--shadow-card)]">
            CM
          </div>
          <p className="editorial-label mt-4">ChitMate</p>
          <h1 className="mt-4 text-4xl text-foreground">Welcome to ChitMate</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--text-body)]">
            Enter your email to sign in or create your account. We&apos;ll send you a secure login link
            — no password needed.
          </p>
        </div>

        <LoginForm nextPath={nextPath} />
      </section>
    </main>
  );
}
