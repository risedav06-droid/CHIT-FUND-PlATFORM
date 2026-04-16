export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("91") && digits.length === 12) {
    return digits.slice(2);
  }

  return digits;
}

export function isValidIndianPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return normalized.length === 10 && /^[6-9]/.test(normalized);
}
