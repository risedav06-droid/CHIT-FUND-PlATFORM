import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  next: optionalText.refine(
    (value) => !value || (value.startsWith("/") && !value.startsWith("//")),
    "Enter a valid internal redirect path.",
  ),
});

export type LoginInput = z.infer<typeof loginSchema>;
