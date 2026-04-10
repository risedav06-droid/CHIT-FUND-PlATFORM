import { z } from "zod";

import { parseDateInput } from "@/lib/dates";

function firstString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const optionalDateSearchParam = z.preprocess((value) => {
  const firstValue = firstString(value as string | string[] | undefined);

  if (!firstValue) {
    return undefined;
  }

  return firstValue.trim().length > 0 ? firstValue : undefined;
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid export date.").transform(parseDateInput).optional());

export const exportViewSchema = z.enum([
  "member-ledger",
  "group-ledger",
  "overdue",
  "collections",
  "auction-summary",
  "payout-register",
] as const);

export const exportFiltersSchema = z.object({
  dateFrom: optionalDateSearchParam,
  dateTo: optionalDateSearchParam,
});

export type ExportView = z.infer<typeof exportViewSchema>;
