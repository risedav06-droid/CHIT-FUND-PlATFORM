'use client';

import Link from "next/link";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/ui/empty-state";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { PaymentLedgerItem } from "@/components/ui/payment-ledger-item";
import { PotTracker } from "@/components/ui/pot-tracker";
import { StatementButton } from "@/components/ui/statement-button";
import { StatusChip } from "@/components/ui/status-chip";
import { formatCurrency } from "@/lib/utils";

type MemberPortalClientProps = {
  member: any;
  group: any;
  organiserPhone: string;
  payments: any[];
  currentPayment: any;
  currentCycleNumber: number;
  totalCycles: number;
  monthlyContribution: number;
  whatsappHref: string;
  trackerMembers: Array<{ name: string; initials: string; status: "taken" | "waiting" | "you" }>;
};

export function MemberPortalClient({
  member,
  group,
  organiserPhone,
  payments,
  currentPayment,
  currentCycleNumber,
  totalCycles,
  monthlyContribution,
  whatsappHref,
  trackerMembers,
}: MemberPortalClientProps) {
  const { t, i18n } = useTranslation();
  const searchParams = useSearchParams();

  useEffect(() => {
    const lang = searchParams.get("lang");
    if (lang === "en" || lang === "te") {
      i18n.changeLanguage(lang);
    }
  }, [i18n, searchParams]);

  return (
    <main className="min-h-screen bg-[var(--color-background)] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header id="home" className="flex items-center justify-between gap-4">
          <p className="font-display text-[1.6rem] italic text-[var(--color-primary)]">{t("common.appName")}</p>
          <div className="flex items-center gap-3">
            <div className="hidden md:block"><LanguageSwitcher /></div>
            <p className="hidden text-sm text-[var(--color-text-body)] md:block">{t("member.hi", { name: member.name.split(" ")[0] })} 👋</p>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.35fr_0.65fr]">
          <aside className="space-y-6">
            <section className="md:hidden">
              <div className="mb-3 w-fit"><LanguageSwitcher /></div>
              <h1 className="text-[1.875rem]">{t("member.hi", { name: member.name.split(" ")[0] })} 👋</h1>
              <p className="mt-2 text-sm text-[var(--color-text-body)]">
                {t("member.dashboard", { chitName: group?.name ?? "chit" })}
              </p>
            </section>

            <section className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between gap-4">
                <span className="ledger-chip bg-[rgba(212,168,67,0.18)] text-[var(--color-amber-text)]">
                  {t("member.activeGroup")}
                </span>
                <span className="text-sm text-[var(--color-text-body)]">
                  {t("member.month", { current: currentCycleNumber, total: totalCycles })}
                </span>
              </div>
              <h1 className="mt-5 hidden text-[1.875rem] md:block">{t("member.hi", { name: member.name.split(" ")[0] })} 👋</h1>
              <p className="mt-2 hidden text-sm text-[var(--color-text-body)] md:block">{t("member.dashboard", { chitName: group?.name ?? "chit" })}</p>
              <h2 className="mt-6">{group?.name ?? "Your chit"}</h2>
              <p className="editorial-label mt-6 !text-[var(--color-text-muted)]">{t("member.amountDue")}</p>
              <p className="mt-2 font-display text-[2.3rem] text-[var(--color-text-primary)]">{formatCurrency(Number(monthlyContribution))}</p>
              <div className="mt-4">
                <StatusChip status={currentPayment?.status === "paid" ? "paid" : currentPayment?.status === "partial" ? "partial" : "unpaid"}>
                  {currentPayment?.status === "paid" ? t("chitGroup.paid") : currentPayment?.status === "partial" ? t("chitGroup.partial") : t("chitGroup.unpaid")}
                </StatusChip>
              </div>
            </section>

            <section id="group" className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
              <p className="editorial-label !text-[var(--color-text-muted)]">{t("member.organiser")}</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-container)] text-sm font-semibold text-white">
                  {organiserPhone.slice(0, 2) || "CM"}
                </div>
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">{organiserPhone || t("member.organiser")}</p>
                  <p className="text-sm text-[var(--color-text-body)]">{t("member.organiser")}</p>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <a href={whatsappHref} target="_blank" rel="noreferrer" className="whatsapp-button w-full">{t("member.chatWhatsApp")}</a>
                <StatementButton />
              </div>
            </section>
          </aside>

          <section className="space-y-6 pb-24 md:pb-0">
            <section className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2>{t("member.fundPotTracker")}</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-body)]">
                    {trackerMembers.length} {t("chitGroup.members")} • {t("member.scrollForDetails")}
                  </p>
                </div>
              </div>
              <div className="mt-6"><PotTracker members={trackerMembers} /></div>
            </section>

            <section id="payments" className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
              <h2>{t("member.paymentLedger")}</h2>
              {payments.length === 0 ? (
                <div className="mt-6">
                  <EmptyState title={t("member.noPayments")} subtitle={t("member.noPayments")} />
                </div>
              ) : (
                <>
                  <div className="mt-6 space-y-4">
                    {payments.map((payment: any, index: number) => (
                      <PaymentLedgerItem
                        key={payment.id}
                        month={t("member.contribution", { n: payment.payment_cycles?.cycle_number ?? index + 1 })}
                        date={payment.payment_date ?? payment.payment_cycles?.due_date ?? "Awaiting collection"}
                        mode={payment.payment_mode ?? "Mode pending"}
                        amount={formatCurrency(Number(payment.amount_paid || payment.amount_due || 0))}
                        status={(payment.status as any) ?? "unpaid"}
                        current={index === 0}
                      />
                    ))}
                  </div>
                  <p className="mt-5 text-sm italic text-[var(--color-text-muted)]">
                    {t("member.showingHistory", { n: Math.min(payments.length, 3), total: payments.length })}
                  </p>
                </>
              )}
            </section>
          </section>
        </div>

        <nav className="glass-shell fixed inset-x-3 bottom-3 z-30 rounded-[calc(var(--radius-card)+6px)] px-3 py-3 shadow-[var(--shadow-float)] md:hidden">
          <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-medium tracking-[0.08em] text-[var(--color-text-body)]">
            <a href="#home" className="rounded-[var(--radius-button)] bg-white/90 px-2 py-3 text-[var(--color-primary)]">HOME</a>
            <a href="#payments" className="rounded-[var(--radius-button)] px-2 py-3">PAYMENTS</a>
            <a href="#group" className="rounded-[var(--radius-button)] px-2 py-3">GROUP</a>
            <a href="#home" className="rounded-[var(--radius-button)] px-2 py-3">STATEMENT</a>
          </div>
        </nav>
      </div>
    </main>
  );
}
