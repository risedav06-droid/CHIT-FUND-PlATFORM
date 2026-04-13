// TODO: rewrite with Supabase
export const payoutsService = {
  async updatePayoutStatus(_input: unknown, _actorId: string, _role?: string) {
    return {
      id: "pending",
      status: "PENDING",
      auctionCycle: {
        id: "pending",
      },
    };
  },
};
