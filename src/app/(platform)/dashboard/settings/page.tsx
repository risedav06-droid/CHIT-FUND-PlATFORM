export const revalidate = 30;

import { SettingsClient } from "@/components/settings/settings-client";
import { authService } from "@/modules/auth/auth.service";

export default async function DashboardSettingsPage() {
  const session = await authService.requireAuthenticatedSession("/dashboard/settings");

  return (
    <SettingsClient
      email={session.user.email ?? ""}
      initialDisplayName={session.user.name ?? ""}
      initialPhone={session.user.phone ?? ""}
    />
  );
}
