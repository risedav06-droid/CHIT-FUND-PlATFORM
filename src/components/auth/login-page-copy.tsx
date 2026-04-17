'use client';

import { useTranslation } from "react-i18next";

export function LoginPageCopy() {
  const { t } = useTranslation();

  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#012d1d,#1b4332)] text-lg font-semibold text-white shadow-[var(--shadow-card)]">
        CM
      </div>
      <p className="editorial-label mt-4">{t("common.appName")}</p>
      <h1 className="mt-4 text-4xl text-foreground">{t("auth.welcome")}</h1>
      <p className="mt-3 text-sm leading-7 text-[var(--text-body)]">{t("auth.subtitle")}</p>
    </div>
  );
}
