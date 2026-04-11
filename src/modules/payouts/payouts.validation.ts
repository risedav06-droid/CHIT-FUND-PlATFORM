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

const optionalDateField = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter the payout date in YYYY-MM-DD format.").transform(parseDateInput).optional());

export const payoutStatusUpdateSchema = z.object({
  payoutId: z.string().uuid("Select a valid payout."),
  status: z.enum(["APPROVED", "PAID", "REJECTED"] as const, {
    message: "Select the next payout status.",
  }),
  method: z.enum(["CASH", "BANK_TRANSFER", "UPI", "CHEQUE", "ONLINE"] as const).optional(),
  referenceNo: optionalReferenceText,
  paidOn: optionalDateField,
  remarks: optionalText,
  proofUrl: optionalText,
  rejectionReason: optionalText,
  confirmAction: z.enum(["yes"] as const, {
    message: "Tick the confirmation box before changing the payout status.",
  }),
}).superRefine((value, ctx) => {
  if (value.status === "PAID") {
    if (!value.method) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["method"],
        message: "Choose a payout method before marking this payout as paid.",
      });
    }

    if (!value.paidOn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paidOn"],
        message: "Paid date is required when marking a payout as paid.",
      });
    }

    if (
      value.method &&
      ["BANK_TRANSFER", "UPI", "CHEQUE", "ONLINE"].includes(value.method) &&
      !value.referenceNo
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["referenceNo"],
        message:
          "Payout reference number is required for bank transfer, UPI, cheque, and online payouts.",
      });
    }
  }

  if (value.status === "REJECTED" && !value.rejectionReason) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["rejectionReason"],
      message: "Enter a rejection reason before rejecting this payout.",
    });
  }

  if (value.paidOn && startOfUtcDay(value.paidOn) > startOfUtcDay(new Date())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["paidOn"],
      message: "Paid date cannot be in the future.",
    });
  }
});

export type PayoutStatusUpdateInput = z.infer<typeof payoutStatusUpdateSchema>;
