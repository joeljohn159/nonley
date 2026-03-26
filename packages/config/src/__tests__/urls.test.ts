import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("URL helpers", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("apiUrl()", () => {
    it("builds URL with default app URL", async () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      const { apiUrl } = await import("../urls");
      expect(apiUrl("/users")).toBe("http://localhost:3000/api/users");
    });

    it("builds URL with custom app URL", async () => {
      process.env.NEXT_PUBLIC_APP_URL = "https://nonley.com";
      const { apiUrl } = await import("../urls");
      expect(apiUrl("/users")).toBe("https://nonley.com/api/users");
    });

    it("handles root path", async () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      const { apiUrl } = await import("../urls");
      expect(apiUrl("")).toBe("http://localhost:3000/api");
    });

    it("handles nested paths", async () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      const { apiUrl } = await import("../urls");
      expect(apiUrl("/v1/presence/rooms")).toBe(
        "http://localhost:3000/api/v1/presence/rooms",
      );
    });
  });

  describe("wsUrl()", () => {
    it("returns default WebSocket URL", async () => {
      delete process.env.NEXT_PUBLIC_WS_URL;
      const { wsUrl } = await import("../urls");
      expect(wsUrl()).toBe("ws://localhost:3001");
    });

    it("returns custom WebSocket URL when set", async () => {
      process.env.NEXT_PUBLIC_WS_URL = "wss://ws.nonley.com";
      const { wsUrl } = await import("../urls");
      expect(wsUrl()).toBe("wss://ws.nonley.com");
    });
  });

  describe("cdnUrl()", () => {
    it("builds CDN URL with default base", async () => {
      delete process.env.NEXT_PUBLIC_CDN_URL;
      const { cdnUrl } = await import("../urls");
      expect(cdnUrl("/images/logo.png")).toBe(
        "http://localhost:3002/images/logo.png",
      );
    });

    it("builds CDN URL with custom base", async () => {
      process.env.NEXT_PUBLIC_CDN_URL = "https://cdn.nonley.com";
      const { cdnUrl } = await import("../urls");
      expect(cdnUrl("/images/logo.png")).toBe(
        "https://cdn.nonley.com/images/logo.png",
      );
    });

    it("handles root path", async () => {
      delete process.env.NEXT_PUBLIC_CDN_URL;
      const { cdnUrl } = await import("../urls");
      expect(cdnUrl("")).toBe("http://localhost:3002");
    });
  });
});
