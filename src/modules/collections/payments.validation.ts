import { z } from "zod";

import { parseDateInput, startOfUtcDay } from "@/lib/dates";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

export const recordInstallmentPaymentSchema = z.object({
  installmentId: z.string().uuid("Select a valid installment."),
  amount: z.coerce.number().positive("Payment amount must be greater than 0."),
  paymentMode: z.enum(
    ["CASH", "BANK_TRANSFER", "UPI", "CHEQUE", "ONLINE", "ADJUSTMENT"] as const,
    {
      message: "Select a valid payment mode.",
    },
  ),
  referenceNo: optionalText,
  receivedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid received date.")
    .transform(parseDateInput),
  remarks: optionalText,
}).superRefine((value, ctx) => {
  const today = startOfUtcDay(new Date());
  const receivedOn = startOfUtcDay(value.receivedOn);

  if (receivedOn > today) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["receivedOn"],
      message: "Received date cannot be in the future.",
    });
  }

  const requiresReference = [
    "BANK_TRANSFER",
    "UPI",
    "CHEQUE",
    "ONLINE",
  ].includes(value.paymentMode);

  if (requiresReference && !value.referenceNo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["referenceNo"],
      message: "Reference number is required for this payment mode.",
    });
  }
});

export type RecordInstallmentPaymentInput = z.infer<
  typeof recordInstallmentPaymentSchema
>;
