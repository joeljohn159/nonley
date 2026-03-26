import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("env", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("required()", () => {
    it("throws when a required env var is missing", async () => {
      delete process.env.DATABASE_URL;
      const { env } = await import("../env");
      expect(() => env.database.url).toThrow(
        "Missing required environment variable: DATABASE_URL",
      );
    });

    it("returns the value when a required env var is set", async () => {
      process.env.DATABASE_URL = "postgresql://localhost:5432/test";
      const { env } = await import("../env");
      expect(env.database.url).toBe("postgresql://localhost:5432/test");
    });

    it("throws when NEXTAUTH_SECRET is missing", async () => {
      delete process.env.NEXTAUTH_SECRET;
      const { env } = await import("../env");
      expect(() => env.auth.nextAuthSecret).toThrow(
        "Missing required environment variable: NEXTAUTH_SECRET",
      );
    });

    it("throws when ENCRYPTION_KEY is missing", async () => {
      delete process.env.ENCRYPTION_KEY;
      const { env } = await import("../env");
      expect(() => env.encryption.key).toThrow(
        "Missing required environment variable: ENCRYPTION_KEY",
      );
    });
  });

  describe("optional()", () => {
    it("returns fallback when env var is not set", async () => {
      delete process.env.REDIS_URL;
      const { env } = await import("../env");
      expect(env.redis.url).toBe("redis://localhost:6379");
    });

    it("returns env value when set", async () => {
      process.env.REDIS_URL = "redis://production:6379";
      const { env } = await import("../env");
      expect(env.redis.url).toBe("redis://production:6379");
    });

    it("returns fallback for NEXTAUTH_URL when not set", async () => {
      delete process.env.NEXTAUTH_URL;
      const { env } = await import("../env");
      expect(env.auth.nextAuthUrl).toBe("http://localhost:3000");
    });

    it("returns empty string fallback for OAuth client IDs", async () => {
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GITHUB_CLIENT_ID;
      const { env } = await import("../env");
      expect(env.auth.googleClientId).toBe("");
      expect(env.auth.githubClientId).toBe("");
    });

    it("returns default presence port when not set", async () => {
      delete process.env.PRESENCE_ENGINE_PORT;
      const { env } = await import("../env");
      expect(env.presence.port).toBe(3001);
    });

    it("parses presence port as integer", async () => {
      process.env.PRESENCE_ENGINE_PORT = "4000";
      const { env } = await import("../env");
      expect(env.presence.port).toBe(4000);
    });

    it("returns default app URLs when not set", async () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXT_PUBLIC_WS_URL;
      delete process.env.NEXT_PUBLIC_CDN_URL;
      const { env } = await import("../env");
      expect(env.app.url).toBe("http://localhost:3000");
      expect(env.app.wsUrl).toBe("ws://localhost:3001");
      expect(env.app.cdnUrl).toBe("http://localhost:3002");
    });
  });
});

describe("validateEnv()", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    vi.stubGlobal("window", undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it("throws when all required vars are missing", async () => {
    delete process.env.DATABASE_URL;
    delete process.env.REDIS_URL;
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.ENCRYPTION_KEY;
    const { validateEnv } = await import("../env");
    expect(() => validateEnv()).toThrow(
      "Missing required environment variables",
    );
  });

  it("includes all missing var names in error message", async () => {
    delete process.env.DATABASE_URL;
    delete process.env.REDIS_URL;
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.ENCRYPTION_KEY;
    const { validateEnv } = await import("../env");
    try {
      validateEnv();
      expect.unreachable("should have thrown");
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain("DATABASE_URL");
      expect(message).toContain("REDIS_URL");
      expect(message).toContain("NEXTAUTH_SECRET");
      expect(message).toContain("ENCRYPTION_KEY");
    }
  });

  it("throws when only some required vars are missing", async () => {
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    process.env.REDIS_URL = "redis://localhost:6379";
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.ENCRYPTION_KEY;
    const { validateEnv } = await import("../env");
    expect(() => validateEnv()).toThrow(
      "Missing required environment variables",
    );
  });

  it("does not throw when all required vars are present", async () => {
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    process.env.REDIS_URL = "redis://localhost:6379";
    process.env.NEXTAUTH_SECRET = "secret123";
    process.env.ENCRYPTION_KEY = "key123";
    const { validateEnv } = await import("../env");
    expect(() => validateEnv()).not.toThrow();
  });

  it("skips validation in browser environment (window defined)", async () => {
    vi.stubGlobal("window", { document: {} });
    delete process.env.DATABASE_URL;
    delete process.env.REDIS_URL;
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.ENCRYPTION_KEY;
    const { validateEnv } = await import("../env");
    expect(() => validateEnv()).not.toThrow();
  });
});
