// TODO: rewrite with Supabase
export const paymentsService = {
  async listPendingInstallments() {
    return [];
  },
  async listRecentPayments() {
    return [];
  },
  async getDashboardMetrics() {
    return {
      amountCollectedToday: 0,
      pendingInstallmentsCount: 0,
      overdueInstallmentsCount: 0,
      outstandingAmount: 0,
    };
  },
  async recordInstallmentPayment(_input: unknown, _actorId: string) {
    return { ok: true };
  },
};
