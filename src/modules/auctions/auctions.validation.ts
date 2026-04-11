import { z } from "zod";

import { parseDateInput } from "@/lib/dates";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.")
  .transform(parseDateInput);

export const createAuctionCycleSchema = z.object({
  chitGroupId: z.string().uuid("Select a valid chit group."),
  scheduledAt: dateField,
  notes: optionalText,
});

export const recordBidSchema = z.object({
  auctionCycleId: z.string().uuid("Select a valid auction cycle."),
  chitEnrollmentId: z.string().uuid("Select an eligible enrollment."),
  amount: z.coerce.number().positive("Bid amount must be greater than 0."),
  remarks: optionalText,
});

export const finalizeAuctionSchema = z.object({
  auctionCycleId: z.string().uuid("Select a valid auction cycle."),
  winningBidId: z.string().uuid("Select the winning bid."),
  notes: optionalText,
  confirmFinalization: z.enum(["yes"] as const, {
    message: "Tick the confirmation box before finalizing the auction.",
  }),
});

export type CreateAuctionCycleInput = z.infer<typeof createAuctionCycleSchema>;
export type RecordBidInput = z.infer<typeof recordBidSchema>;
export type FinalizeAuctionInput = z.infer<typeof finalizeAuctionSchema>;
