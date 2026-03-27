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
 * Pads the shorter string to avoid leaking length information.
 */
export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  // Pad shorter buffer so timingSafeEqual doesn't throw,
  // but still return false for different lengths
  if (bufA.length !== bufB.length) {
    // Compare against self of matching length to consume constant time,
    // then return false
    const padded = Buffer.alloc(bufA.length);
    timingSafeEqual(bufA, padded);
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}
