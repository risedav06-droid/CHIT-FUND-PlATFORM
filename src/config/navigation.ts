import type { AuthRole } from "@/modules/auth/auth.permissions";

type NavigationItem = {
  title: string;
  href: string;
  allowedRoles: AuthRole[];
};

export const platformSections = [
  {
    title: "Dashboard",
    href: "/dashboard",
    description:
      "Operational overview for active groups, collections, overdue pressure, and recent activity.",
  },
  {
    title: "Members",
    href: "/members",
    description:
      "Member onboarding, KYC tracking, nominations, and participation history.",
  },
  {
    title: "Chit Funds",
    href: "/chit-funds",
    description:
      "Group setup, cycle schedules, installment calendars, and subscriptions.",
  },
  {
    title: "Collections",
    href: "/collections",
    description:
      "Receipts, due tracking, penalties, ledger posting, and payment review.",
  },
  {
    title: "Auctions",
    href: "/auctions",
    description:
      "Bid rounds, prize calculations, winner records, and disbursement flow.",
  },
  {
    title: "Reports",
    href: "/reports",
    description:
      "Operational exports, reconciliation summaries, and business insights.",
  },
  {
    title: "Notifications",
    href: "/notifications",
    description:
      "In-app reminders, auction results, payout updates, and notification history.",
  },
] as const;

export const platformNavigation: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    allowedRoles: ["SUPER_ADMIN", "ORGANIZER", "AGENT"],
  },
  {
    title: "Members",
    href: "/members",
    allowedRoles: ["SUPER_ADMIN", "ORGANIZER", "AGENT"],
  },
  {
    title: "Chit Funds",
    href: "/chit-funds",
    allowedRoles: ["SUPER_ADMIN", "ORGANIZER", "AGENT"],
  },
  {
    title: "Collections",
    href: "/collections",
    allowedRoles: ["SUPER_ADMIN", "ORGANIZER", "AGENT"],
  },
  {
    title: "Auctions",
    href: "/auctions",
    allowedRoles: ["SUPER_ADMIN", "ORGANIZER", "AGENT"],
  },
  {
    title: "Reports",
    href: "/reports",
    allowedRoles: ["SUPER_ADMIN", "ORGANIZER"],
  },
  {
    title: "Notifications",
    href: "/notifications",
    allowedRoles: ["SUPER_ADMIN", "ORGANIZER", "AGENT", "MEMBER"],
  },
] as const;

export function getPlatformNavigationForRole(role: AuthRole) {
  return platformNavigation.filter((item) => item.allowedRoles.includes(role));
}
