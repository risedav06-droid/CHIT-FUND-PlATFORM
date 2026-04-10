import { z } from "zod";

import { parseDateInput } from "@/lib/dates";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const optionalInteger = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length === 0 ? undefined : Number(trimmedValue);
}, z.number().int().min(1).max(31).optional());

const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.")
  .transform(parseDateInput);

export const createChitGroupSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Group code is required.")
    .max(30, "Group code is too long.")
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(3, "Group name is required."),
  description: optionalText,
  ticketCount: z.coerce.number().int().min(1, "Ticket count must be at least 1."),
  installmentAmount: z.coerce
    .number()
    .positive("Installment amount must be greater than 0."),
  durationMonths: z.coerce
    .number()
    .int()
    .min(1, "Duration must be at least 1 month."),
  startDate: dateField,
  auctionDay: optionalInteger,
});

export const createEnrollmentSchema = z.object({
  chitGroupId: z.string().uuid("Select a valid chit group."),
  memberId: z.string().uuid("Select a valid member."),
  ticketNumber: z.coerce
    .number()
    .int()
    .min(1, "Ticket number must be at least 1."),
});

export type CreateChitGroupInput = z.infer<typeof createChitGroupSchema>;
export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
