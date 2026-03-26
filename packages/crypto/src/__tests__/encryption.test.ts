import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { encrypt, decrypt } from "../encryption";

describe("encrypt / decrypt", () => {
  const TEST_KEY =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  const DIFFERENT_KEY =
    "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210";

  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = TEST_KEY;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.ENCRYPTION_KEY;
    } else {
      process.env.ENCRYPTION_KEY = originalEnv;
    }
  });

  it("encrypts and decrypts a simple string (roundtrip)", () => {
    const plaintext = "hello, world";
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("roundtrips an empty string", () => {
    const encrypted = encrypt("");
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe("");
  });

  it("roundtrips unicode / emoji content", () => {
    const plaintext = "Hello 🌍 你好 مرحبا";
    const encrypted = encrypt(plaintext);
    expect(decrypt(encrypted)).toBe(plaintext);
  });

  it("roundtrips a long string", () => {
    const plaintext = "a".repeat(10_000);
    const encrypted = encrypt(plaintext);
    expect(decrypt(encrypted)).toBe(plaintext);
  });

  it("returns encrypted output in iv:authTag:ciphertext format", () => {
    const encrypted = encrypt("test");
    const parts = encrypted.split(":");
    expect(parts).toHaveLength(3);
    expect(parts[0]).toMatch(/^[a-f0-9]{32}$/);
    expect(parts[1]).toMatch(/^[a-f0-9]{32}$/);
    expect(parts[2]).toMatch(/^[a-f0-9]+$/);
  });

  it("produces different ciphertext for the same plaintext (random IV)", () => {
    const a = encrypt("same plaintext");
    const b = encrypt("same plaintext");
    expect(a).not.toBe(b);
  });

  it("throws when ENCRYPTION_KEY env var is missing", () => {
    delete process.env.ENCRYPTION_KEY;
    expect(() => encrypt("test")).toThrow(
      "ENCRYPTION_KEY environment variable is not set",
    );
    expect(() => decrypt("aa:bb:cc")).toThrow(
      "ENCRYPTION_KEY environment variable is not set",
    );
  });

  it("throws when ENCRYPTION_KEY is the wrong length", () => {
    process.env.ENCRYPTION_KEY = "abcd";
    expect(() => encrypt("test")).toThrow("must be exactly 32 bytes");
  });

  it("throws when decrypting with the wrong key", () => {
    const encrypted = encrypt("secret data");
    process.env.ENCRYPTION_KEY = DIFFERENT_KEY;
    expect(() => decrypt(encrypted)).toThrow();
  });

  it("throws on an invalid encrypted string format (missing parts)", () => {
    expect(() => decrypt("onlyonepart")).toThrow(
      "Invalid encrypted string format",
    );
    expect(() => decrypt("two:parts")).toThrow(
      "Invalid encrypted string format",
    );
  });

  it("throws on tampered ciphertext", () => {
    const encrypted = encrypt("important data");
    const parts = encrypted.split(":");
    const tampered = parts[2]!.replace(/[0-9]/, (c) =>
      String((parseInt(c) + 1) % 10),
    );
    expect(() => decrypt(`${parts[0]}:${parts[1]}:${tampered}`)).toThrow();
  });

  it("throws on tampered auth tag", () => {
    const encrypted = encrypt("important data");
    const parts = encrypted.split(":");
    const badTag = "0".repeat(32);
    expect(() => decrypt(`${parts[0]}:${badTag}:${parts[2]}`)).toThrow();
  });
});
