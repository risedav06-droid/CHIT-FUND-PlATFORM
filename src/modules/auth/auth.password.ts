import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import { env } from "@/server/env";

const passwordKeyLength = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, passwordKeyLength).toString("hex");

  return `scrypt:${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  const [algorithm, salt, expectedHash] = passwordHash.split(":");

  if (algorithm !== "scrypt" || !salt || !expectedHash) {
    return false;
  }

  const derivedKey = scryptSync(password, salt, passwordKeyLength);
  const expectedKey = Buffer.from(expectedHash, "hex");

  if (derivedKey.length !== expectedKey.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, expectedKey);
}

export function createSessionToken() {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(sessionToken: string) {
  return createHmac("sha256", env.AUTH_SECRET).update(sessionToken).digest("hex");
}

export function createNotificationEventKey(parts: string[]) {
  return createHash("sha256").update(parts.join(":")).digest("hex");
}
