import { PlatformShell } from "@/components/layout/platform-shell";
import { authService } from "@/modules/auth/auth.service";

export default async function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await authService.requireAuthenticatedSession("/dashboard");
  return <PlatformShell session={session}>{children}</PlatformShell>;
}
