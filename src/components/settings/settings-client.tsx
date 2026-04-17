'use client';

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { LanguageSwitcher } from "@/components/ui/language-switcher";

type SettingsClientProps = {
  email: string;
  initialDisplayName: string;
  initialPhone: string;
};

export function SettingsClient({
  email,
  initialDisplayName,
  initialPhone,
}: SettingsClientProps) {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [phone, setPhone] = useState(initialPhone);
  const [saved, setSaved] = useState<string | null>(null);
  const [whatsappReminders, setWhatsappReminders] = useState(true);
  const [schedule, setSchedule] = useState({
    seven: true,
    three: true,
    dayOf: true,
  });
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div className="space-y-6">
      <section className="rounded-[var(--radius-card)] bg-white px-8 py-8 shadow-[var(--shadow-card)]">
        <p className="editorial-label">{t("nav.settings")}</p>
        <h1 className="mt-3 text-[1.875rem]">{t("settings.title")}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-text-body)]">
          Keep your organiser details current and shape how ChitMate nudges members.
        </p>
      </section>

      {saved ? (
        <div className="rounded-[var(--radius-card)] bg-[var(--color-success-bg)] px-5 py-4 text-sm text-[var(--color-success-text)] shadow-[var(--shadow-card)]">
          {saved}
        </div>
      ) : null}

      <section className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
        <h2>{t("settings.profile")}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="editorial-label !text-[var(--color-text-muted)]">{t("settings.displayName")}</span>
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="recessed-input h-11 w-full" />
          </label>
          <label className="space-y-2">
            <span className="editorial-label !text-[var(--color-text-muted)]">{t("settings.phone")}</span>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} className="recessed-input h-11 w-full" />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="editorial-label !text-[var(--color-text-muted)]">{t("settings.email")}</span>
            <input value={email} readOnly className="recessed-input h-11 w-full opacity-70" />
          </label>
        </div>
        <button
          type="button"
          className="primary-button mt-5"
          onClick={async () => {
            const response = await fetch("/api/settings/profile", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ displayName, phone }),
            });

            if (response.ok) {
              setSaved("Settings saved.");
              window.setTimeout(() => setSaved(null), 2200);
            }
          }}
        >
          {t("common.save")}
        </button>
      </section>

      <section className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
        <h2>{t("settings.language")}</h2>
        <p className="mt-2 text-sm text-[var(--color-text-body)]">{t("settings.selectLanguage")}</p>
        <div className="mt-4">
          <LanguageSwitcher />
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
        <h2>{t("settings.notifications")}</h2>
        <div className="mt-5 space-y-4">
          <label className="flex items-center justify-between gap-4 rounded-[var(--radius-card)] bg-[var(--color-surface-low)] px-4 py-4">
            <span>{t("settings.whatsappReminders")}</span>
            <input type="checkbox" checked={whatsappReminders} onChange={() => setWhatsappReminders((value) => !value)} />
          </label>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["seven", "7 days before"],
              ["three", "3 days before"],
              ["dayOf", "Day of due date"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 rounded-[var(--radius-card)] bg-[var(--color-surface-low)] px-4 py-4">
                <input
                  type="checkbox"
                  checked={schedule[key as keyof typeof schedule]}
                  onChange={() =>
                    setSchedule((current) => ({
                      ...current,
                      [key]: !current[key as keyof typeof schedule],
                    }))
                  }
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <button type="button" className="primary-button" onClick={() => {
            setSaved("Notification preferences saved.");
            window.setTimeout(() => setSaved(null), 2200);
          }}>
            {t("common.save")}
          </button>
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)]">
        <h2>{t("settings.title")}</h2>
        <div className="mt-5 space-y-4">
          <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-low)] px-4 py-4">
            <p className="editorial-label !text-[var(--color-text-muted)]">{t("settings.plan")}</p>
            <div className="mt-2 flex items-center justify-between gap-4">
              <span>{t("settings.free")}</span>
              <button type="button" className="amber-button">{t("settings.upgradePro")}</button>
            </div>
          </div>
          <button type="button" className="ghost-button">{t("settings.signOutAll")}</button>
          <button type="button" className="text-sm font-medium text-[var(--color-error-text)]" onClick={() => setShowDelete(true)}>
            {t("settings.deleteAccount")}
          </button>
        </div>
      </section>

      {showDelete ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(27,28,26,0.18)] px-4">
          <div className="w-full max-w-md rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-float)]">
            <h3>{t("settings.deleteAccount")}</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--color-text-body)]">
              This is a confirmation step only for now. Account deletion will be added with a full data export flow.
            </p>
            <div className="mt-6 flex gap-3">
              <button type="button" className="ghost-button flex-1 justify-center" onClick={() => setShowDelete(false)}>
                {t("common.cancel")}
              </button>
              <button type="button" className="amber-button flex-1 justify-center" onClick={() => setShowDelete(false)}>
                {t("common.confirm")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
