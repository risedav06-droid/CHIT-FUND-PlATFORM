// TODO: rewrite with Supabase
import type { AuthenticatedSession } from "@/modules/auth/auth.service";

export const notificationsService = {
  async getNotificationCenter(_session: AuthenticatedSession) {
    return {
      notifications: [],
      deliveryLog: [],
      unreadCount: 0,
    };
  },
  async markNotificationRead(_notificationId: string, _userId: string) {
    return { ok: true };
  },
  async markAllNotificationsRead(_userId: string) {
    return { ok: true };
  },
  async generateOperationalNotifications(_session: AuthenticatedSession) {
    return { createdCount: 0 };
  },
  async notifyAuctionResult(_input: unknown) {
    return { ok: true };
  },
  async notifyPayoutStatusChange(_input: unknown) {
    return { ok: true };
  },
};
