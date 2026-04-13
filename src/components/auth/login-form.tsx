'use client';

import { useActionState } from "react";

import { FormFeedback } from "@/components/ui/form-feedback";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Input } from "@/components/ui/input";
import { requestOtpAction } from "@/modules/auth/auth.actions";

type LoginFormProps = {
  nextPath: string;
};

const initialState = {
  error: "",
  success: false,
  email: "",
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const [state, formAction] = useActionState(requestOtpAction, initialState);

  return (
    <>
      <FormFeedback
        status={state.error ? "error" : state.success ? "success" : undefined}
        message={
          state.error ||
          (state.success ? "Check your email for a login link" : undefined)
        }
      />

      <form action={formAction} className="mt-8 space-y-5">
        <input type="hidden" name="next" value={nextPath} />

        <label className="space-y-2 text-sm font-medium text-foreground">
          <span>Email address</span>
          <div className="rounded-[var(--radius-input)] bg-[var(--color-surface-high)] px-4 py-1.5">
            <Input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              className="h-11 border-none bg-transparent px-0 shadow-none"
            />
          </div>
        </label>

        <div className="glass-shell sticky bottom-4 rounded-[var(--radius-card)] p-3">
          <FormSubmitButton className="w-full justify-center py-3">
            Send Login Link
          </FormSubmitButton>
        </div>
      </form>
    </>
  );
}
