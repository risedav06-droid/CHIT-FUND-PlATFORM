import "server-only";

import { z } from "zod";

const fallbackAuthSecret =
  "local-dev-auth-secret-change-before-pilot-1234567890";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters")
    .default(fallbackAuthSecret),
});

export const env = serverEnvSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
});
