'use client';

import { useActionState, useEffect, useRef } from "react";

import type { AddMemberFormState } from "@/app/(platform)/dashboard/chit-groups/actions";
import { addMemberToDashboardChitGroupAction } from "@/app/(platform)/dashboard/chit-groups/actions";
import { FormFeedback } from "@/components/ui/form-feedback";
import { Input } from "@/components/ui/input";

type AddMemberInlineFormProps = {
  chitGroupId: string;
  disabled?: boolean;
  disabledMessage?: string;
  onMemberAdded?: (payload: NonNullable<AddMemberFormState["member"]>, payment: AddMemberFormState["currentPayment"]) => void;
};

const initialState: AddMemberFormState = {};

export function AddMemberInlineForm({
  chitGroupId,
  disabled = false,
  disabledMessage,
  onMemberAdded,
}: AddMemberInlineFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [state, formAction, isPending] = useActionState(addMemberToDashboardChitGroupAction, initialState);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    if (state.member) {
      onMemberAdded?.(state.member, state.currentPayment ?? null);
    }
    formRef.current?.reset();
  }, [onMemberAdded, state.currentPayment, state.member, state.success]);

  return (
    <form
      id="add-member-form"
      ref={formRef}
      action={formAction}
      className="rounded-[var(--radius-card)] bg-[var(--color-surface-low)] p-6 shadow-[var(--shadow-card)]"
    >
      <input type="hidden" name="chitGroupId" value={chitGroupId} />
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="editorial-label !text-[var(--color-text-muted)]">Add Member</p>
          <p className="mt-1 text-sm text-[var(--color-text-body)]">
            Create the member record and generate their portal invite link.
          </p>
        </div>
      </div>
      <FormFeedback
        status={state.error ? "error" : state.success ? "success" : undefined}
        message={state.error || (state.success ? "Member added successfully." : undefined)}
      />
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <Input name="name" placeholder="Ravi Kumar" required disabled={disabled || isPending} />
        <Input name="phone" placeholder="91820 25225" required disabled={disabled || isPending} />
        <Input
          name="whatsappPhone"
          placeholder="WhatsApp phone (optional)"
          disabled={disabled || isPending}
        />
      </div>
      {disabledMessage ? (
        <p className="mt-5 text-sm text-[var(--color-error-text)]">{disabledMessage}</p>
      ) : null}
      <button type="submit" className="primary-button mt-5" disabled={disabled || isPending}>
        {isPending ? "Adding..." : "Add Member"}
      </button>
    </form>
  );
}
