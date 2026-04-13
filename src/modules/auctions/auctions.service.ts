// TODO: rewrite with Supabase
export const auctionsService = {
  async listAuctionCycles() {
    return [];
  },
  async listGroupsForCycleCreation() {
    return [];
  },
  async getAuctionCycleDetail(_auctionCycleId: string) {
    return null;
  },
  async createAuctionCycle(_input: unknown, _actorId: string) {
    return { id: "pending" };
  },
  async recordBid(_input: unknown, _actorId: string) {
    return { ok: true };
  },
  async finalizeAuction(_input: unknown, _actorId: string) {
    return { ok: true };
  },
};
