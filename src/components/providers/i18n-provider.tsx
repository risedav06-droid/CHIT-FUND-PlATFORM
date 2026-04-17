'use client';

import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import "@/i18n/config";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang = i18n.language?.slice(0, 2) || "en";
    document.documentElement.lang = lang;
  }, [i18n.language]);

  return <>{children}</>;
}
