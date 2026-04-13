import { authService } from "@/modules/auth/auth.service";

import { CreateChitGroupForm } from "./create-chit-group-form";

export default async function CreateDashboardChitGroupPage() {
  await authService.requireAuthenticatedSession("/dashboard/chit-groups/new");

  return <CreateChitGroupForm />;
}
