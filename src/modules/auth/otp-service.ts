import crypto from "node:crypto";

export function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function generateOTPHash(phone: string, otp: string, expiresAt: number): string {
  const data = `${phone}.${otp}.${expiresAt}`;
  return crypto
    .createHmac("sha256", process.env.AUTH_SECRET!)
    .update(data)
    .digest("hex");
}

export function verifyOTPHash(
  phone: string,
  otp: string,
  hash: string,
  expiresAt: number,
): boolean {
  if (Date.now() > expiresAt) {
    return false;
  }

  const expected = generateOTPHash(phone, otp, expiresAt);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expected));
}
