'use client';

import { useActionState, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { FormFeedback } from "@/components/ui/form-feedback";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Input } from "@/components/ui/input";
import { requestOtpAction } from "@/modules/auth/auth.actions";
import { createClient } from "@/utils/supabase/client";

type LoginFormProps = {
  nextPath: string;
};

const initialState = {
  error: "",
  success: false,
  email: "",
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const { t } = useTranslation();
  const [state, formAction] = useActionState(requestOtpAction, initialState);
  const [email, setEmail] = useState("");
  const [resendCountdown, setResendCountdown] = useState(30);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const sentEmail = state.success ? state.email : "";

  useEffect(() => {
    if (!state.success) {
      return;
    }

    setShowConfirmation(true);
    setResendCountdown(30);
  }, [state.success, state.email]);

  useEffect(() => {
    if (!state.success || resendCountdown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendCountdown((value) => Math.max(value - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [state.success, resendCountdown]);

  const gmailHref = useMemo(() => "https://mail.google.com", []);

  const handleGoogleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      }
    })
  }

  if (showConfirmation && state.success && sentEmail) {
    return (
      <div className="mt-8">
        <FormFeedback status={state.error ? "error" : undefined} message={state.error || undefined} />

        <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-low)] px-6 py-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(27,67,50,0.12)] text-[var(--color-primary-container)]">
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m5 13 4 4L19 7" />
            </svg>
          </div>

          <h2 className="mt-5 text-[1.75rem] text-[var(--color-text-primary)]">Check your inbox</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--color-text-body)]">
            {t("auth.checkEmailSub", { email: sentEmail })}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
            {t("auth.linkExpiry")}
          </p>

          <a
            href={gmailHref}
            target="_blank"
            rel="noreferrer"
            className="amber-button mt-6 w-full justify-center"
          >
            {t("auth.openGmail")}
          </a>

          <form action={formAction} className="mt-5">
            <input type="hidden" name="email" value={sentEmail} />
            <input type="hidden" name="next" value={nextPath} />
            <button
              type="submit"
              disabled={resendCountdown > 0}
              className="text-sm font-medium text-[var(--color-primary-container)] disabled:text-[var(--color-text-muted)]"
            >
              {resendCountdown > 0
                ? t("auth.resendIn", { seconds: resendCountdown })
                : t("auth.resend")}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setShowConfirmation(false);
              setEmail(sentEmail);
            }}
            className="mt-4 text-sm text-[var(--color-text-body)] underline underline-offset-4"
          >
            {t("auth.differentEmail")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <FormFeedback
        status={state.error ? "error" : undefined}
        message={state.error || undefined}
      />

      <form action={formAction} className="mt-8 space-y-5">
        <input type="hidden" name="next" value={nextPath} />

        <label className="space-y-2 text-sm font-medium text-foreground">
          <span>{t("auth.emailLabel")}</span>
          <div className="rounded-[var(--radius-input)] bg-[var(--color-surface-high)] px-4 py-1.5">
            <Input
              name="email"
              type="email"
              autoComplete="email"
              placeholder={t("auth.emailPlaceholder")}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="h-11 border-none bg-transparent px-0 shadow-none"
            />
          </div>
        </label>

        <div className="glass-shell sticky bottom-4 rounded-[var(--radius-card)] p-3">
          <FormSubmitButton className="w-full justify-center py-3">
            {t("auth.sendLink")}
          </FormSubmitButton>
        </div>

        <p className="mt-3 text-center text-[0.8125rem] leading-[1.5] text-[#9ca3af]">
          {t("auth.newUser")}
        </p>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-[rgba(113,121,115,0.22)]" />
        <span className="text-[13px] text-[#9ca3af]">or</span>
        <div className="h-px flex-1 bg-[rgba(113,121,115,0.22)]" />
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        style={{
          width: '100%',
          padding: '11px 20px',
          borderRadius: 6,
          border: '1px solid #e5e7eb',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          cursor: 'pointer',
          fontSize: '0.875rem',
          color: '#374151',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <img src="https://www.google.com/favicon.ico" width={18} height={18} />
        {t("auth.continueGoogle")}
      </button>
    </>
  );
}
