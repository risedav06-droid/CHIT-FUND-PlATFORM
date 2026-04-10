import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/server/env";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
});

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
