'use client';

import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు" },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language?.slice(0, 2) || "en";

  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        background: "#f5f3f0",
        borderRadius: 8,
        padding: 3,
      }}
    >
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          style={{
            padding: "5px 12px",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            fontSize: "0.8rem",
            fontWeight: current === lang.code ? 700 : 400,
            background: current === lang.code ? "#1b4332" : "transparent",
            color: current === lang.code ? "#ffffff" : "#717973",
            transition: "all 0.15s ease",
          }}
        >
          {lang.nativeLabel}
        </button>
      ))}
    </div>
  );
}
