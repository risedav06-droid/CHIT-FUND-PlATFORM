import { z } from "zod";

import { parseDateInput, startOfUtcDay } from "@/lib/dates";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const optionalReferenceText = z
  .string()
  .trim()
  .optional()
  .transform((value) =>
    value && value.length > 0 ? value.toUpperCase() : undefined,
  );

export const recordInstallmentPaymentSchema = z.object({
  installmentId: z.string().uuid("Select a valid installment."),
  amount: z.coerce.number().positive("Enter a payment amount greater than 0."),
  paymentMode: z.enum(
    ["CASH", "BANK_TRANSFER", "UPI", "CHEQUE", "ONLINE", "ADJUSTMENT"] as const,
    {
      message: "Select a valid payment mode.",
    },
  ),
  referenceNo: optionalReferenceText,
  receivedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter the received date in YYYY-MM-DD format.")
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
      message:
        "Reference number is required for bank transfer, UPI, cheque, and online payments.",
    });
  }
});

export type RecordInstallmentPaymentInput = z.infer<
  typeof recordInstallmentPaymentSchema
>;
