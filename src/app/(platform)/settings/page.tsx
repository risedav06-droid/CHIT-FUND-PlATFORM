import { authService } from "@/modules/auth/auth.service";

export default async function SettingsPage() {
  await authService.requireAuthenticatedSession("/settings");

  return (
    <main className="rounded-[var(--radius-card)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-card)]">
      <p className="editorial-label">Settings</p>
      <h1 className="mt-3">Workspace settings</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-text-body)]">
        Billing, reminder automation, staff seats, and WhatsApp templates will live here as the organiser portal expands.
      </p>
    </main>
  );
}
