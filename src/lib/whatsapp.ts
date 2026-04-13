export function buildWhatsAppLink(phone: string, message: string): string {
  const normalized = phone.replace(/\D/g, "");
  const withCountryCode = normalized.startsWith("91") ? normalized : `91${normalized}`;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`;
}

export function buildReminderMessage(
  memberName: string,
  chitName: string,
  amount: number,
  dueDate: string,
): string {
  return `Hi ${memberName}! 🙏\n\nThis is a reminder for your *${chitName}* chit fund contribution.\n\n*Amount Due:* ₹${amount.toLocaleString("en-IN")}\n*Due Date:* ${dueDate}\n\nPlease pay at your earliest convenience.\n\n_Managed via ChitMate_`;
}
