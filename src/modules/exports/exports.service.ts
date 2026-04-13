// TODO: rewrite with Supabase
export function getExportTitle(view: string) {
  switch (view) {
    case "member-ledger":
      return "Member Ledger";
    case "group-ledger":
      return "Group Ledger";
    case "overdue":
      return "Overdue Export";
    case "collections":
      return "Collections Export";
    case "auction-summary":
      return "Auction Summary";
    case "payout-register":
      return "Payout Register";
    default:
      return "Export";
  }
}

export const exportsService = {
  async getExport(view: string, _searchParams: Record<string, string | string[] | undefined>) {
    return {
      view,
      filters: {
        dateFrom: new Date(),
        dateTo: new Date(),
        dateFromInput: "",
        dateToInput: "",
      },
      rows: [],
    };
  },
};
