import type { Route } from "next";
import { redirect } from "next/navigation";

import { buildFeedbackHref } from "@/lib/action-state";
import {
  canAccessPermission,
  type AuthPermission,
} from "@/modules/auth/auth.permissions";
import { getCurrentSession } from "@/modules/auth/auth.session";

export type AuthenticatedSession = NonNullable<
  Awaited<ReturnType<typeof getCurrentSession>>
>;

function normalizeNextPath(nextPath?: string) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/dashboard";
  }

  return nextPath;
}

export function buildLoginHref(nextPath?: string, message?: string) {
  const params = new URLSearchParams({
    next: normalizeNextPath(nextPath),
  });

  if (message) {
    params.set("message", message);
    params.set("status", "error");
  }

  return `/login?${params.toString()}` as Route;
}

export function buildVerifyHref(phone: string, nextPath?: string) {
  const params = new URLSearchParams({
    phone,
    next: normalizeNextPath(nextPath),
  });

  return `/verify?${params.toString()}` as Route;
}

export function getPostLoginPath() {
  return "/dashboard" as Route;
}

export const authService = {
  getCurrentSession,
  buildLoginHref,
  buildVerifyHref,
  getPostLoginPath,

  async redirectIfAuthenticated() {
    const session = await getCurrentSession();

    if (session) {
      redirect(getPostLoginPath());
    }
  },

  async requireAuthenticatedSession(nextPath?: string) {
    const session = await getCurrentSession();

    if (!session) {
      redirect(buildLoginHref(nextPath));
    }

    return session;
  },

  async requirePermission(permission: AuthPermission, nextPath?: string) {
    const session = await this.requireAuthenticatedSession(nextPath);

    if (!canAccessPermission(session.user.role, permission)) {
      redirect(
        buildFeedbackHref(
          "/dashboard",
          "error",
          "You don’t have access to that section yet.",
        ),
      );
    }

    return session;
  },

  async requireActionPermission(permission: AuthPermission, feedbackPath: string) {
    const session = await this.requireAuthenticatedSession(feedbackPath);

    if (!canAccessPermission(session.user.role, permission)) {
      redirect(
        buildFeedbackHref(
          feedbackPath,
          "error",
          "That action isn’t available for your account right now.",
        ),
      );
    }

    return session;
  },

  async requireMemberRecordAccess() {
    return null;
  },
};
