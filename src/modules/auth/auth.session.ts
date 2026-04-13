import "server-only";

import { getProfile, getSession } from "@/utils/supabase/db";

function getDisplayName(email?: string | null, fallback?: string) {
  const metadataName =
    typeof fallback === "string" && fallback.trim().length > 0 ? fallback : undefined;

  if (metadataName) {
    return metadataName;
  }

  if (email) {
    const prefix = email.split("@")[0] ?? "";
    const cleaned = prefix.replace(/[0-9]/g, "");

    if (cleaned) {
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
  }

  return fallback || "Organiser";
}

export async function getCurrentSession() {
  const user = await getSession();

  if (!user) {
    return null;
  }

  const { data: profile } = await getProfile(user.id);
  const metadataDisplayName =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : undefined;

  return {
    id: user.id,
    unreadNotificationsCount: 0,
    user: {
      id: user.id,
      role: "ORGANIZER" as const,
      email: user.email ?? "",
      phone: profile?.phone ?? user.phone ?? "",
      name: getDisplayName(
        user.email,
        metadataDisplayName ?? profile?.phone ?? user.phone ?? "Organiser",
      ),
      profile,
    },
  };
}

export type CurrentSession = Awaited<ReturnType<typeof getCurrentSession>>;
