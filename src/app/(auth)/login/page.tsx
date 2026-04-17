import { LoginForm } from "@/components/auth/login-form";
import { LoginPageCopy } from "@/components/auth/login-page-copy";
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
        <LoginPageCopy />

        <LoginForm nextPath={nextPath} />
      </section>
    </main>
  );
}
