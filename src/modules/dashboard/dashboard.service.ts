// TODO: rewrite with Supabase
export const dashboardService = {
  async getOrganizerDashboard() {
    return {
      summary: {
        activeChitGroups: 0,
        membersThisMonth: 0,
        commissionEarned: 0,
        paymentsPending: 0,
      },
      activeGroups: [],
      recentActivity: [],
      unreadNotificationsCount: 0,
    };
  },
  async getMemberDashboard() {
    return null;
  },
};
