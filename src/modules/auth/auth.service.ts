import type { Route } from "next";
import { redirect } from "next/navigation";

import { buildFeedbackHref } from "@/lib/action-state";
import { canAccessPermission, type AuthPermission } from "@/modules/auth/auth.permissions";
import { authRepository } from "@/modules/auth/auth.repository";
import { verifyPassword } from "@/modules/auth/auth.password";
import { getCurrentSession } from "@/modules/auth/auth.session";
import type { LoginInput } from "@/modules/auth/auth.validation";

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
  }

  return `/login?${params.toString()}` as Route;
}

export function getPostLoginPath(session: AuthenticatedSession) {
  if (session.user.role === "MEMBER" && session.user.member) {
    return `/members/${session.user.member.id}` as Route;
  }

  return "/dashboard" as Route;
}

export const authService = {
  async authenticateWithPassword(input: LoginInput) {
    const user = await authRepository.findUserByEmail(input.email);

    if (!user || !user.passwordHash || !user.isActive) {
      throw new Error("Invalid email or password.");
    }

    if (!verifyPassword(input.password, user.passwordHash)) {
      throw new Error("Invalid email or password.");
    }

    await authRepository.recordSuccessfulLogin(user.id);

    return user;
  },

  getCurrentSession,

  async redirectIfAuthenticated() {
    const session = await getCurrentSession();

    if (session) {
      redirect(getPostLoginPath(session));
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
          "You are not allowed to access that operating area.",
        ),
      );
    }

    return session;
  },

  async requireActionPermission(permission: AuthPermission, feedbackPath: string) {
    const session = await getCurrentSession();

    if (!session) {
      redirect(buildLoginHref(feedbackPath, "Please log in to continue."));
    }

    if (!canAccessPermission(session.user.role, permission)) {
      redirect(
        buildFeedbackHref(
          feedbackPath,
          "error",
          "You are not allowed to perform that action.",
        ),
      );
    }

    return session;
  },

  async requireMemberRecordAccess(memberId: string) {
    const session = await this.requireAuthenticatedSession(`/members/${memberId}`);

    if (session.user.role === "MEMBER" && session.user.member?.id !== memberId) {
      redirect(
        buildFeedbackHref(
          getPostLoginPath(session),
          "error",
          "Members can only access their own record.",
        ),
      );
    }

    return session;
  },
};
