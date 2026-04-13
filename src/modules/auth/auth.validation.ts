import { z } from "zod";

export const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/\D/g, ""))
  .refine((value) => value.length === 10, "Enter a valid 10-digit phone number");

export const otpSchema = z
  .string()
  .trim()
  .refine((value) => value.length === 6, "Enter the 6-digit code.");
