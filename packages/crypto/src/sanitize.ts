/**
 * Escape HTML special characters to prevent XSS.
 * Used by extension and embed widget when rendering user-generated content.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sanitize a URL for use in CSS background-image.
 * Only allows http/https URLs.
 */
export function sanitizeImageUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return "";
    }
    return parsed.href;
  } catch {
    return "";
  }
}

/**
 * Strip all HTML tags from a string.
 */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "");
}

/**
 * Strip URLs/links from text (for whisper messages where links are not allowed).
 */
export function stripLinks(str: string): string {
  return str.replace(/https?:\/\/\S+/gi, "[link removed]");
}
