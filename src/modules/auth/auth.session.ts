import "server-only";

import { cookies, headers } from "next/headers";

import { authRepository } from "@/modules/auth/auth.repository";
import { createSessionToken, hashSessionToken } from "@/modules/auth/auth.password";
import { env } from "@/server/env";

const sessionCookieName = "chitflow_session";
const sessionDurationInDays = 14;
const sessionDurationInSeconds = sessionDurationInDays * 24 * 60 * 60;

export type CurrentSession = Awaited<ReturnType<typeof getCurrentSession>>;

function getSessionExpiryDate() {
  const now = new Date();
  now.setUTCDate(now.getUTCDate() + sessionDurationInDays);
  return now;
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(sessionCookieName)?.value;

  if (!sessionToken) {
    return null;
  }

  const sessionTokenHash = hashSessionToken(sessionToken);
  const session = await authRepository.findSessionByTokenHash(sessionTokenHash);

  if (!session || session.expiresAt <= new Date() || !session.user.isActive) {
    return null;
  }

  return {
    id: session.id,
    unreadNotificationsCount: session.user.notifications.length,
    user: {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      profile: session.user.profile,
      member: session.user.member,
    },
  };
}

export async function createAuthenticatedSession(userId: string) {
  const sessionToken = createSessionToken();
  const sessionTokenHash = hashSessionToken(sessionToken);
  const cookieStore = await cookies();
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim();
  const userAgent = headerStore.get("user-agent") ?? undefined;

  await authRepository.deleteExpiredSessions();
  await authRepository.createSession({
    userId,
    sessionTokenHash,
    expiresAt: getSessionExpiryDate(),
    ipAddress,
    userAgent,
  });

  cookieStore.set({
    name: sessionCookieName,
    value: sessionToken,
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionDurationInSeconds,
  });
}

export async function destroyAuthenticatedSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(sessionCookieName)?.value;

  if (sessionToken) {
    await authRepository.deleteSessionByTokenHash(hashSessionToken(sessionToken));
  }

  cookieStore.set({
    name: sessionCookieName,
    value: "",
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
  });
}

export function getSessionCookieName() {
  return sessionCookieName;
}
