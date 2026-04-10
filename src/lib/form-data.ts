export function formDataToObject(formData: FormData) {
  return Object.fromEntries(
    Array.from(formData.entries()).filter(([key]) => !key.startsWith("$ACTION_")),
  );
}

export function normalizeOptionalString(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}
