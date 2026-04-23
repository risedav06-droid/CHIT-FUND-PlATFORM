'use client';

import { useActionState, useEffect, useState } from "react";

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
  const [state, formAction, isPending] = useActionState(addMemberToDashboardChitGroupAction, initialState);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newWhatsApp, setNewWhatsApp] = useState("");
  const [phoneError, setPhoneError] = useState("");

  function validatePhone(value: string) {
    const digits = value.replace(/\D/g, "");
    const normalized = digits.startsWith("91") && digits.length === 12
      ? digits.slice(2)
      : digits;

    if (!normalized) {
      setPhoneError("Phone number is required");
      return false;
    }
    if (normalized.length !== 10) {
      setPhoneError("Must be exactly 10 digits");
      return false;
    }
    if (!/^[6-9]/.test(normalized)) {
      setPhoneError("Must start with 6, 7, 8 or 9");
      return false;
    }

    setPhoneError("");
    return true;
  }

  useEffect(() => {
    if (!state.success) {
      return;
    }

    if (state.member) {
      onMemberAdded?.(state.member, state.currentPayment ?? null);
    }
    setNewName("");
    setNewPhone("");
    setNewWhatsApp("");
    setPhoneError("");
  }, [onMemberAdded, state.currentPayment, state.member, state.success]);

  return (
    <form
      id="add-member-form"
      action={formAction}
      autoComplete="off"
      className="rounded-[var(--radius-card)] bg-[var(--color-surface-low)] p-6 shadow-[var(--shadow-card)]"
      onSubmit={(event) => {
        if (!validatePhone(newPhone)) {
          event.preventDefault();
        }
      }}
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
        <Input
          name="name"
          type="text"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="Member name e.g. Ravi Kumar"
          autoComplete="off"
          required
          disabled={disabled || isPending}
          style={{ background: "#eeece9" }}
        />
        <div>
          <Input
            name="phone"
            type="tel"
            value={newPhone}
            onChange={(event) => {
              const value = event.target.value;
              setNewPhone(value);

              if (value.length >= 10) {
                validatePhone(value);
              } else {
                setPhoneError("");
              }
            }}
            onBlur={() => validatePhone(newPhone)}
            placeholder="Phone number e.g. 9876543210"
            autoComplete="off"
            required
            disabled={disabled || isPending}
            style={{ background: "#eeece9" }}
          />
          {phoneError ? (
            <p
              style={{
                color: "#dc2626",
                fontSize: "0.75rem",
                marginTop: 4,
              }}
            >
              {phoneError}
            </p>
          ) : null}
        </div>
        <Input
          name="whatsappPhone"
          type="tel"
          value={newWhatsApp}
          onChange={(event) => setNewWhatsApp(event.target.value)}
          placeholder="WhatsApp number (optional)"
          autoComplete="off"
          disabled={disabled || isPending}
          style={{ background: "#eeece9" }}
        />
      </div>
      {disabledMessage ? (
        <p className="mt-5 text-sm text-[var(--color-error-text)]">{disabledMessage}</p>
      ) : null}
      <button
        type="submit"
        className="primary-button mt-5"
        disabled={disabled || isPending || !!phoneError || !newName.trim() || !newPhone.trim()}
      >
        {isPending ? "Adding..." : "Add Member"}
      </button>
    </form>
  );
}
