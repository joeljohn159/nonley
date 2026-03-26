import { createHash } from "node:crypto";

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "msclkid",
  "ref",
  "source",
]);

/**
 * Hash a URL using SHA-256 for privacy-preserving presence tracking.
 * The presence engine stores only hashed URLs, never raw URLs.
 */
export function hashUrl(url: string): string {
  const normalized = normalizeUrl(url);
  return createHash("sha256").update(normalized).digest("hex");
}

/**
 * Normalize a URL for consistent hashing.
 * Strips fragments, tracking parameters, trailing slashes, and lowercases the hostname.
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";

    // Remove tracking parameters
    for (const param of TRACKING_PARAMS) {
      parsed.searchParams.delete(param);
    }

    // Remove trailing slash for consistency
    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }

    const search = parsed.searchParams.toString();
    return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${pathname}${search ? `?${search}` : ""}`;
  } catch {
    return url.toLowerCase().trim();
  }
}

/**
 * Generate a room hash from a URL hash.
 * Used as the room identifier in the presence engine.
 */
export function roomHashFromUrl(urlHash: string): string {
  return `room:${urlHash}`;
}
