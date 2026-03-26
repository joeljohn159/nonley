import { describe, it, expect } from "vitest";

import { generateToken, generateSiteKey, safeCompare } from "../tokens";

describe("generateToken", () => {
  it("returns a hex string of default length 64 chars (32 bytes)", () => {
    const token = generateToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  it("respects a custom byte length", () => {
    const token = generateToken(16);
    expect(token).toMatch(/^[a-f0-9]{32}$/);
  });

  it("generates unique tokens on each call", () => {
    const tokens = new Set(Array.from({ length: 50 }, () => generateToken()));
    expect(tokens.size).toBe(50);
  });

  it("returns an empty string for length 0", () => {
    expect(generateToken(0)).toBe("");
  });
});

describe("generateSiteKey", () => {
  it("starts with the nly_ prefix", () => {
    const key = generateSiteKey();
    expect(key.startsWith("nly_")).toBe(true);
  });

  it("has the correct total length (nly_ + 48 hex chars from 24 bytes)", () => {
    const key = generateSiteKey();
    expect(key).toHaveLength(52);
  });

  it("generates unique keys", () => {
    const a = generateSiteKey();
    const b = generateSiteKey();
    expect(a).not.toBe(b);
  });
});

describe("safeCompare", () => {
  it("returns true for identical strings", () => {
    expect(safeCompare("abc", "abc")).toBe(true);
  });

  it("returns false for different strings of equal length", () => {
    expect(safeCompare("abc", "xyz")).toBe(false);
  });

  it("returns false for strings of different lengths", () => {
    expect(safeCompare("short", "much longer string")).toBe(false);
  });

  it("returns true for empty strings", () => {
    expect(safeCompare("", "")).toBe(true);
  });

  it("returns false when one string is empty", () => {
    expect(safeCompare("abc", "")).toBe(false);
    expect(safeCompare("", "abc")).toBe(false);
  });

  it("handles long strings correctly", () => {
    const a = "x".repeat(1000);
    const b = "x".repeat(1000);
    expect(safeCompare(a, b)).toBe(true);
  });

  it("detects single-character difference", () => {
    expect(safeCompare("abcdef", "abcdeg")).toBe(false);
  });
});
