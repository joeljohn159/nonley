import { describe, it, expect } from "vitest";

import { hashUrl, roomHashFromUrl } from "../hash";

describe("hashUrl", () => {
  it("returns a SHA-256 hex string for a valid URL", () => {
    const hash = hashUrl("https://example.com");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces deterministic output for the same URL", () => {
    const a = hashUrl("https://example.com/page");
    const b = hashUrl("https://example.com/page");
    expect(a).toBe(b);
  });

  it("produces different hashes for different URLs", () => {
    const a = hashUrl("https://example.com/a");
    const b = hashUrl("https://example.com/b");
    expect(a).not.toBe(b);
  });

  // --- URL normalization: fragments ---
  it("strips URL fragments so the same page with different anchors hashes equally", () => {
    const base = hashUrl("https://example.com/page");
    const withFragment = hashUrl("https://example.com/page#section-2");
    expect(base).toBe(withFragment);
  });

  // --- URL normalization: tracking params ---
  it.each([
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
  ])("strips tracking param %s", (param) => {
    const clean = hashUrl("https://example.com/page");
    const withParam = hashUrl(`https://example.com/page?${param}=abc123`);
    expect(clean).toBe(withParam);
  });

  it("strips multiple tracking params at once", () => {
    const clean = hashUrl("https://example.com/page");
    const dirty = hashUrl(
      "https://example.com/page?utm_source=google&fbclid=123&gclid=456#top",
    );
    expect(clean).toBe(dirty);
  });

  it("preserves non-tracking query parameters", () => {
    const withQuery = hashUrl("https://example.com/search?q=hello");
    const withoutQuery = hashUrl("https://example.com/search");
    expect(withQuery).not.toBe(withoutQuery);
  });

  it("preserves non-tracking params while stripping tracking params", () => {
    const clean = hashUrl("https://example.com/search?q=hello");
    const mixed = hashUrl(
      "https://example.com/search?q=hello&utm_source=twitter",
    );
    expect(clean).toBe(mixed);
  });

  // --- URL normalization: trailing slashes ---
  it("strips trailing slashes for consistency", () => {
    const a = hashUrl("https://example.com/page/");
    const b = hashUrl("https://example.com/page");
    expect(a).toBe(b);
  });

  it("does not strip the root slash", () => {
    const a = hashUrl("https://example.com/");
    const b = hashUrl("https://example.com");
    expect(a).toBe(b);
  });

  // --- URL normalization: hostname lowercasing ---
  it("lowercases the hostname", () => {
    const a = hashUrl("https://EXAMPLE.COM/page");
    const b = hashUrl("https://example.com/page");
    expect(a).toBe(b);
  });

  it("lowercases mixed-case hostname", () => {
    const a = hashUrl("https://ExAmPlE.CoM/CaseSensitivePath");
    const b = hashUrl("https://example.com/CaseSensitivePath");
    expect(a).toBe(b);
  });

  // --- Edge cases ---
  it("handles an empty string without throwing", () => {
    expect(() => hashUrl("")).not.toThrow();
    const hash = hashUrl("");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("handles a malformed/non-URL string by falling back gracefully", () => {
    const hash = hashUrl("not a url at all");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("handles URLs with non-standard ports", () => {
    const a = hashUrl("https://example.com:8080/page");
    const b = hashUrl("http://example.com:3000/page");
    expect(a).not.toBe(b);
  });
});

describe("roomHashFromUrl", () => {
  it("prepends room: to the hash", () => {
    const hash = "abc123def456";
    expect(roomHashFromUrl(hash)).toBe("room:abc123def456");
  });

  it("works with a real SHA-256 hash", () => {
    const urlHash = hashUrl("https://example.com");
    const room = roomHashFromUrl(urlHash);
    expect(room).toMatch(/^room:[a-f0-9]{64}$/);
  });

  it("handles an empty string", () => {
    expect(roomHashFromUrl("")).toBe("room:");
  });
});
