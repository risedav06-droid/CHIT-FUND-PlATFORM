export const authRoles = [
  "SUPER_ADMIN",
  "ORGANIZER",
  "AGENT",
  "MEMBER",
] as const;

export type AuthRole = (typeof authRoles)[number];

export type AuthPermission =
  | "view_staff_area"
  | "create_member"
  | "create_chit_group"
  | "enroll_member"
  | "record_payment"
  | "manage_auctions"
  | "finalize_auction"
  | "manage_payouts"
  | "view_reports"
  | "view_exports"
  | "manage_notifications";

export const staffRoles: AuthRole[] = [
  "SUPER_ADMIN",
  "ORGANIZER",
  "AGENT",
];

export const operationsManagerRoles: AuthRole[] = [
  "SUPER_ADMIN",
  "ORGANIZER",
];

type PermissionGuard = {
  label: string;
  description: string;
  allowedRoles: readonly AuthRole[];
};

export type ProtectedRouteDefinition = {
  label: string;
  path: string;
  allowedRoles: readonly AuthRole[];
  note: string;
};

export const permissionGuards: Record<AuthPermission, PermissionGuard> = {
  view_staff_area: {
    label: "staff operating workspace",
    description: "Open staff-only operating pages such as members, chit groups, and collections.",
    allowedRoles: staffRoles,
  },
  create_member: {
    label: "member creation",
    description: "Create and onboard member records.",
    allowedRoles: staffRoles,
  },
  create_chit_group: {
    label: "chit group creation",
    description: "Create new chit groups and configure group terms.",
    allowedRoles: operationsManagerRoles,
  },
  enroll_member: {
    label: "member enrollment",
    description: "Enroll members into chit groups and generate installments.",
    allowedRoles: operationsManagerRoles,
  },
  record_payment: {
    label: "payment recording",
    description: "Record installment receipts and update collection balances.",
    allowedRoles: ["SUPER_ADMIN", "ORGANIZER", "AGENT"],
  },
  manage_auctions: {
    label: "auction operations",
    description: "Open the auction workspace, create cycles, and record bids.",
    allowedRoles: operationsManagerRoles,
  },
  finalize_auction: {
    label: "auction finalization",
    description: "Finalize winners, lock cycles, and create pending payouts.",
    allowedRoles: operationsManagerRoles,
  },
  manage_payouts: {
    label: "payout approval and settlement",
    description: "Approve, reject, and mark payouts as paid.",
    allowedRoles: operationsManagerRoles,
  },
  view_reports: {
    label: "reports access",
    description: "Open reports, pilot readiness, and performance summaries.",
    allowedRoles: operationsManagerRoles,
  },
  view_exports: {
    label: "exports access",
    description: "Open print-safe exports and operational print views.",
    allowedRoles: operationsManagerRoles,
  },
  manage_notifications: {
    label: "notification generation",
    description: "Generate due, overdue, and auction reminder notifications.",
    allowedRoles: operationsManagerRoles,
  },
};

export const protectedRouteDefinitions: ProtectedRouteDefinition[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    allowedRoles: authRoles,
    note: "Members only see their own summary; staff see the operator board.",
  },
  {
    label: "Members list",
    path: "/members",
    allowedRoles: staffRoles,
    note: "Members can open only their own member detail page.",
  },
  {
    label: "Member detail",
    path: "/members/[memberId]",
    allowedRoles: authRoles,
    note: "Member role is self-only and blocked from other member records.",
  },
  {
    label: "Chit funds",
    path: "/chit-funds",
    allowedRoles: staffRoles,
    note: "Staff-only operating area for group management.",
  },
  {
    label: "Collections",
    path: "/collections",
    allowedRoles: ["SUPER_ADMIN", "ORGANIZER", "AGENT"],
    note: "Payment recording is limited to collection-capable staff roles.",
  },
  {
    label: "Auctions",
    path: "/auctions",
    allowedRoles: operationsManagerRoles,
    note: "The auction workspace is limited to organizer and super admin roles.",
  },
  {
    label: "Reports",
    path: "/reports",
    allowedRoles: operationsManagerRoles,
    note: "Reports and pilot readiness remain manager-only.",
  },
  {
    label: "Notifications",
    path: "/notifications",
    allowedRoles: authRoles,
    note: "All roles can access their own notifications.",
  },
  {
    label: "Exports",
    path: "/exports/[view]",
    allowedRoles: operationsManagerRoles,
    note: "Print-safe exports are restricted to manager roles.",
  },
];

export function canAccessPermission(role: AuthRole, permission: AuthPermission) {
  return permissionGuards[permission].allowedRoles.includes(role);
}

export function getPermissionGuard(permission: AuthPermission) {
  return permissionGuards[permission];
}

export function getAllowedRolesForPermission(permission: AuthPermission) {
  return permissionGuards[permission].allowedRoles;
}

export function isStaffRole(role: AuthRole) {
  return staffRoles.includes(role);
}

export function formatAuthRoleLabel(role: AuthRole) {
  return role.replaceAll("_", " ");
}
