import { getUtcMonthRange, startOfUtcDay } from "@/lib/dates";
import { exportsRepository } from "@/modules/exports/exports.repository";
import { exportFiltersSchema, exportViewSchema, type ExportView } from "@/modules/exports/exports.validation";
import { reportsService } from "@/modules/reports/reports.service";

function addUtcDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function dateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export const exportsService = {
  async getExport(viewValue: string, searchParams: Record<string, string | string[] | undefined>) {
    const view = exportViewSchema.parse(viewValue);
    const now = new Date();
    const monthRange = getUtcMonthRange(now);
    const parsedFilters = exportFiltersSchema.safeParse(searchParams);
    const filters = parsedFilters.success ? parsedFilters.data : {};
    const dateFrom = startOfUtcDay(filters.dateFrom ?? monthRange.start);
    const dateTo = startOfUtcDay(filters.dateTo ?? addUtcDays(monthRange.end, -1));
    const dateToExclusive = addUtcDays(dateTo, 1);

    const base = {
      view,
      filters: {
        dateFrom,
        dateTo,
        dateFromInput: dateInputValue(dateFrom),
        dateToInput: dateInputValue(dateTo),
      },
    };

    switch (view) {
      case "member-ledger":
      case "group-ledger":
      case "overdue":
      case "collections": {
        const report = await reportsService.getReports({
          dateFrom: dateInputValue(dateFrom),
          dateTo: dateInputValue(dateTo),
        });

        return {
          ...base,
          report,
        };
      }
      case "auction-summary": {
        return {
          ...base,
          rows: await exportsRepository.listAuctionSummary({
            dateFrom,
            dateToExclusive,
          }),
        };
      }
      case "payout-register": {
        return {
          ...base,
          rows: await exportsRepository.listPayoutRegister({
            dateFrom,
            dateToExclusive,
          }),
        };
      }
      default: {
        return assertNever(view);
      }
    }
  },
};

function assertNever(value: never): never {
  throw new Error(`Unsupported export view: ${String(value)}`);
}

export function getExportTitle(view: ExportView) {
  switch (view) {
    case "member-ledger":
      return "Member Ledger Export";
    case "group-ledger":
      return "Group Ledger Export";
    case "overdue":
      return "Overdue Export";
    case "collections":
      return "Collections Export";
    case "auction-summary":
      return "Auction Summary Print View";
    case "payout-register":
      return "Payout Register Print View";
    default:
      return assertNever(view);
  }
}
