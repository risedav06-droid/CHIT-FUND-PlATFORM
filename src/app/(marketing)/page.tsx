import Link from "next/link";

import { platformSections } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { authService } from "@/modules/auth/auth.service";

const foundationItems = [
  {
    title: "Organiser-first operations",
    description:
      "Run collections, auctions, and member communication from one warm dashboard built for daily fund operations.",
  },
  {
    title: "Member trust built in",
    description:
      "Every member gets a private portal link with clear payment history, pot progress, and organiser contact details.",
  },
  {
    title: "Built for Indian chit funds",
    description:
      "Phone OTP access, WhatsApp-ready workflows, and transparent monthly cycles keep the experience practical and familiar.",
  },
] as const;

export default async function HomePage() {
  await authService.redirectIfAuthenticated();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-6 py-10 lg:px-10 lg:py-14">
      <section className="grid gap-6 rounded-[var(--radius-card)] bg-[linear-gradient(135deg,rgba(245,243,240,0.94),rgba(255,255,255,0.82))] px-8 py-10 shadow-[var(--shadow-float)] lg:grid-cols-[1.25fr_0.75fr] lg:px-10 lg:py-12">
        <div>
        <span className="editorial-label rounded-full bg-[rgba(212,168,67,0.14)] px-3 py-1">
          The Digital Ledger
        </span>
        <div className="mt-6 max-w-3xl space-y-4">
          <h1 className="text-4xl text-foreground sm:text-6xl">
            {siteConfig.name}
          </h1>
          <p className="max-w-2xl text-base leading-8 text-[var(--text-body)] sm:text-lg">
            Chit fund management for modern organisers in India, blending warm editorial design with practical control over groups, payments, auctions, and member trust.
          </p>
          <Link
            href="/login"
            className="primary-button inline-flex rounded-full px-5 py-3 text-sm font-semibold hover:-translate-y-0.5"
          >
            Sign in to ChitMate
          </Link>
        </div>
        </div>

        <aside className="card-surface flex flex-col justify-between rounded-[var(--radius-card)] bg-[rgba(255,255,255,0.9)] p-6">
          <div>
            <p className="editorial-label">Today&apos;s view</p>
            <p className="display-number mt-4 text-5xl text-foreground">3</p>
            <p className="mt-3 text-sm leading-7 text-[var(--text-body)]">
              connected workstreams across organiser control, member transparency, and collection follow-through.
            </p>
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.16em] text-[var(--text-body)]">
            The Digital Ledger
          </p>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-[0.9fr_1.1fr_1fr]">
        {foundationItems.map((item) => (
          <article
            key={item.title}
            className="card-surface rounded-[var(--radius-card)] bg-[rgba(255,255,255,0.9)] p-6"
          >
            <p className="editorial-label">Foundation</p>
            <h2 className="mt-3 text-xl text-foreground">
              {item.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--text-body)]">
              {item.description}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-[var(--radius-card)] bg-[linear-gradient(135deg,#012d1d,#1b4332)] px-8 py-10 text-white shadow-[var(--shadow-float)]">
        <div className="max-w-2xl">
          <p className="editorial-label !text-[rgba(255,255,255,0.72)]">Platform coverage</p>
          <h2 className="mt-3 text-3xl">Everything your fund needs in one place</h2>
          <p className="mt-3 text-sm leading-7 text-white/72">
            From onboarding to disbursement, ChitMate keeps the operating rhythm of a traditional chit fund while making the records far easier to run and review.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {platformSections.map((section) => (
            <article
              key={section.title}
              className="rounded-[var(--radius-card)] bg-white/8 p-5"
            >
              <p className="editorial-label !text-[rgba(255,255,255,0.72)]">
                {section.href}
              </p>
              <h3 className="mt-3 text-lg">{section.title}</h3>
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
