import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const optionalEmail = z
  .union([z.string().trim().email("Enter a valid email address."), z.literal("")])
  .optional()
  .transform((value) => (value ? value : undefined));

export const createMemberSchema = z.object({
  memberCode: z
    .string()
    .trim()
    .min(2, "Member code is required.")
    .max(30, "Member code is too long.")
    .transform((value) => value.toUpperCase()),
  firstName: z.string().trim().min(2, "First name is required."),
  lastName: optionalText,
  primaryPhone: z.string().trim().min(10, "Phone number is required."),
  primaryEmail: optionalEmail,
  addressLine1: optionalText,
  addressLine2: optionalText,
  city: optionalText,
  state: optionalText,
  postalCode: optionalText,
  notes: optionalText,
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
