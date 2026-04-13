// TODO: rewrite with Supabase
export const reportsService = {
  async getReports(_searchParams: Record<string, string | string[] | undefined>) {
    return {
      filters: {
        dateFrom: new Date(),
        dateTo: new Date(),
        dateFromInput: "",
        dateToInput: "",
      },
      filterError: undefined,
      organizerSummary: {
        activeGroups: 0,
        activeMembers: 0,
        collectionsTotal: 0,
        collectionsCount: 0,
        overdueAmount: 0,
        overdueInstallmentsCount: 0,
        paidPayouts: 0,
        pendingPayouts: 0,
      },
      overdueInstallments: [],
      collections: [],
      memberLedger: [],
      groupPerformance: [],
    };
  },
};
