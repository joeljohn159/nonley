import { randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Generate a cryptographically secure random token.
 * Used for site keys, API keys, etc.
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString("hex");
}

/**
 * Generate a site key for embed widget authentication.
 */
export function generateSiteKey(): string {
  return `nly_${generateToken(24)}`;
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
