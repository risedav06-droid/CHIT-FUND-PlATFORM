export const revalidate = 30;

import { DashboardPageClient } from "@/components/dashboard/dashboard-page-client";
import { authService } from "@/modules/auth/auth.service";
import { getOrganiserDashboardInsights } from "@/utils/supabase/db";

export default async function DashboardPage() {
  const session = await authService.requireAuthenticatedSession("/dashboard");
  const dashboard = await getOrganiserDashboardInsights(session.user.id);

  return (
    <DashboardPageClient displayName={session.user.name?.split(" ")[0] ?? "Organiser"} dashboard={dashboard} />
  );
}
