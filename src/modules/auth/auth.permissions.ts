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

const permissionMatrix: Record<AuthPermission, AuthRole[]> = {
  view_staff_area: staffRoles,
  create_member: staffRoles,
  create_chit_group: operationsManagerRoles,
  enroll_member: operationsManagerRoles,
  record_payment: ["SUPER_ADMIN", "ORGANIZER", "AGENT"],
  manage_auctions: operationsManagerRoles,
  finalize_auction: operationsManagerRoles,
  manage_payouts: operationsManagerRoles,
  view_reports: operationsManagerRoles,
  view_exports: operationsManagerRoles,
  manage_notifications: operationsManagerRoles,
};

export function canAccessPermission(role: AuthRole, permission: AuthPermission) {
  return permissionMatrix[permission].includes(role);
}

export function isStaffRole(role: AuthRole) {
  return staffRoles.includes(role);
}
