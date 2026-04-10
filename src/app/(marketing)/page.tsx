import Link from "next/link";

import { platformSections } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { authService } from "@/modules/auth/auth.service";

const foundationItems = [
  {
    title: "Next.js 16 App Router",
    description:
      "Routes now live under src/app, which keeps framework files separate from project configuration.",
  },
  {
    title: "Server-first structure",
    description:
      "Environment parsing and Prisma access live in src/server so database logic stays out of UI files.",
  },
  {
    title: "Feature-ready modules",
    description:
      "Business domains such as members, auctions, collections, and reports can grow independently in src/modules.",
  },
] as const;

export default async function HomePage() {
  await authService.redirectIfAuthenticated();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-6 py-12 lg:px-10">
      <section className="rounded-[2rem] border border-border bg-surface px-8 py-10 shadow-[0_24px_80px_-48px_rgba(31,27,23,0.45)]">
        <span className="inline-flex rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand">
          Foundation pass
        </span>
        <div className="mt-6 max-w-3xl space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {siteConfig.name}
          </h1>
          <p className="text-lg leading-8 text-muted">
            A structured foundation for managing chit funds, members,
            installments, auctions, collections, and reporting without
            overbuilding the first iteration.
          </p>
          <Link
            href="/login"
            className="inline-flex rounded-full bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground transition hover:opacity-95"
          >
            Sign in to the pilot workspace
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {foundationItems.map((item) => (
          <article
            key={item.title}
            className="rounded-[1.5rem] border border-border bg-white/80 p-6 backdrop-blur"
          >
            <h2 className="text-xl font-semibold text-foreground">
              {item.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              {item.description}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-[2rem] border border-border bg-[#1f1b17] px-8 py-10 text-white">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold">Planned platform modules</h2>
          <p className="mt-3 text-sm leading-7 text-white/72">
            These are the main business areas the next implementation passes
            will build out on top of this base architecture.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {platformSections.map((section) => (
            <article
              key={section.title}
              className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5"
            >
              <p className="text-sm font-medium text-brand-foreground/80">
                {section.href}
              </p>
              <h3 className="mt-3 text-lg font-semibold">{section.title}</h3>
              <p className="mt-2 text-sm leading-7 text-white/70">
                {section.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
