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
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid report date.").transform(parseDateInput).optional());

export const reportFiltersSchema = z.object({
  dateFrom: optionalDateSearchParam,
  dateTo: optionalDateSearchParam,
});

export type ReportFiltersInput = z.infer<typeof reportFiltersSchema>;
