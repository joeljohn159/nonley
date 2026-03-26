import { describe, it, expect } from "vitest";

import {
  PRESENCE,
  RATE_LIMITS,
  CHAT,
  UI,
  PLANS,
  FOCUS,
  PERFORMANCE,
  DATA_RETENTION,
  STRIPE_CONFIG,
  CONNECTION,
  CORS_ALLOWED_ORIGINS,
} from "../constants";

describe("PRESENCE", () => {
  it("has correct heartbeat interval", () => {
    expect(PRESENCE.HEARTBEAT_INTERVAL_MS).toBe(30_000);
  });

  it("has correct heartbeat timeout", () => {
    expect(PRESENCE.HEARTBEAT_TIMEOUT_MS).toBe(90_000);
  });

  it("timeout is longer than heartbeat interval", () => {
    expect(PRESENCE.HEARTBEAT_TIMEOUT_MS).toBeGreaterThan(
      PRESENCE.HEARTBEAT_INTERVAL_MS,
    );
  });

  it("has correct sub room threshold", () => {
    expect(PRESENCE.SUB_ROOM_THRESHOLD).toBe(50);
  });

  it("has correct ring2 sample size", () => {
    expect(PRESENCE.RING2_SAMPLE_SIZE).toBe(15);
  });

  it("ring2 sample size is less than sub room threshold", () => {
    expect(PRESENCE.RING2_SAMPLE_SIZE).toBeLessThan(
      PRESENCE.SUB_ROOM_THRESHOLD,
    );
  });

  it("all values are numbers", () => {
    for (const value of Object.values(PRESENCE)) {
      expect(typeof value).toBe("number");
    }
  });
});

describe("RATE_LIMITS", () => {
  it("has correct API requests per minute", () => {
    expect(RATE_LIMITS.API_REQUESTS_PER_MINUTE).toBe(100);
  });

  it("has correct auth requests per minute", () => {
    expect(RATE_LIMITS.AUTH_REQUESTS_PER_MINUTE).toBe(10);
  });

  it("auth rate limit is stricter than general API limit", () => {
    expect(RATE_LIMITS.AUTH_REQUESTS_PER_MINUTE).toBeLessThan(
      RATE_LIMITS.API_REQUESTS_PER_MINUTE,
    );
  });

  it("has correct reactions cooldown", () => {
    expect(RATE_LIMITS.REACTIONS_COOLDOWN_MS).toBe(10_000);
  });

  it("has correct whisper initiations per hour", () => {
    expect(RATE_LIMITS.WHISPER_INITIATIONS_PER_HOUR).toBe(5);
  });

  it("has correct room chat messages per hour", () => {
    expect(RATE_LIMITS.ROOM_CHAT_MESSAGES_PER_HOUR).toBe(30);
  });

  it("all values are numbers", () => {
    for (const value of Object.values(RATE_LIMITS)) {
      expect(typeof value).toBe("number");
    }
  });
});

describe("CHAT", () => {
  it("has max message length of 280", () => {
    expect(CHAT.MAX_MESSAGE_LENGTH).toBe(280);
  });

  it("has 24 hour expiry", () => {
    expect(CHAT.EXPIRY_HOURS).toBe(24);
  });

  it("has link stripping enabled", () => {
    expect(CHAT.LINK_STRIPPING).toBe(true);
  });

  it("requires minimum 3 users for room chat", () => {
    expect(CHAT.ROOM_CHAT_MIN_USERS).toBe(3);
  });

  it("has max room chat participants", () => {
    expect(CHAT.MAX_ROOM_CHAT_PARTICIPANTS).toBe(20);
  });

  it("has whisper max visible height", () => {
    expect(CHAT.WHISPER_MAX_VISIBLE_HEIGHT_PX).toBe(200);
  });
});

describe("UI", () => {
  it("has correct bubble height", () => {
    expect(UI.BUBBLE_HEIGHT_PX).toBe(40);
  });

  it("has correct panel max width", () => {
    expect(UI.PANEL_MAX_WIDTH_PX).toBe(320);
  });

  it("has correct panel max height", () => {
    expect(UI.PANEL_MAX_HEIGHT_PX).toBe(400);
  });

  it("has correct reaction display duration", () => {
    expect(UI.REACTION_DISPLAY_MS).toBe(3_000);
  });

  it("has correct focus fade in duration", () => {
    expect(UI.FOCUS_FADE_IN_MS).toBe(500);
  });

  it("max viewport width percent is 25", () => {
    expect(UI.MAX_VIEWPORT_WIDTH_PERCENT).toBe(25);
  });

  it("all values are numbers", () => {
    for (const value of Object.values(UI)) {
      expect(typeof value).toBe("number");
    }
  });
});

describe("PLANS", () => {
  it("Free plan has correct name", () => {
    expect(PLANS.FREE.name).toBe("Free");
  });

  it("Free plan has no price", () => {
    expect(PLANS.FREE).not.toHaveProperty("priceMonthly");
  });

  it("Free plan has limited embed visitors", () => {
    expect(PLANS.FREE.maxEmbedVisitors).toBe(20);
  });

  it("Free plan disables premium features", () => {
    expect(PLANS.FREE.integrations).toBe(false);
    expect(PLANS.FREE.saveMicroChats).toBe(false);
    expect(PLANS.FREE.privateCircles).toBe(false);
    expect(PLANS.FREE.customVisibility).toBe(false);
    expect(PLANS.FREE.desktopApp).toBe(false);
  });

  it("Pro plan monthly price is in cents ($7.00)", () => {
    expect(PLANS.PRO.priceMonthly).toBe(700);
  });

  it("Pro plan annual price is in cents ($5.00/mo)", () => {
    expect(PLANS.PRO.priceAnnual).toBe(500);
  });

  it("Pro plan annual price is less than monthly price", () => {
    expect(PLANS.PRO.priceAnnual).toBeLessThan(PLANS.PRO.priceMonthly);
  });

  it("Pro plan enables premium features", () => {
    expect(PLANS.PRO.integrations).toBe(true);
    expect(PLANS.PRO.saveMicroChats).toBe(true);
    expect(PLANS.PRO.privateCircles).toBe(true);
    expect(PLANS.PRO.customVisibility).toBe(true);
    expect(PLANS.PRO.desktopApp).toBe(true);
  });

  it("Site plan monthly price is in cents ($29.00)", () => {
    expect(PLANS.SITE.priceMonthly).toBe(2900);
  });

  it("Site plan has unlimited embed visitors", () => {
    expect(PLANS.SITE.maxEmbedVisitors).toBe(Infinity);
  });

  it("Site plan has unlimited embed sites", () => {
    expect(PLANS.SITE.maxEmbedSites).toBe(Infinity);
  });

  it("Site plan includes analytics and moderation", () => {
    expect(PLANS.SITE.analytics).toBe(true);
    expect(PLANS.SITE.moderation).toBe(true);
    expect(PLANS.SITE.apiAccess).toBe(true);
  });

  it("Community plan monthly price is in cents ($99.00)", () => {
    expect(PLANS.COMMUNITY.priceMonthly).toBe(9900);
  });

  it("Community plan includes enterprise features", () => {
    expect(PLANS.COMMUNITY.whiteLabel).toBe(true);
    expect(PLANS.COMMUNITY.customDomain).toBe(true);
    expect(PLANS.COMMUNITY.dedicatedSupport).toBe(true);
  });

  it("all prices are in cents (greater than 100)", () => {
    const paidPlans = [PLANS.PRO, PLANS.SITE, PLANS.COMMUNITY] as Array<
      Record<string, unknown>
    >;
    for (const plan of paidPlans) {
      expect(plan.priceMonthly).toBeGreaterThanOrEqual(100);
      expect(Number.isInteger(plan.priceMonthly)).toBe(true);
    }
  });

  it("plan pricing tiers increase from Pro to Community", () => {
    expect(PLANS.PRO.priceMonthly).toBeLessThan(PLANS.SITE.priceMonthly);
    expect(PLANS.SITE.priceMonthly).toBeLessThan(PLANS.COMMUNITY.priceMonthly);
  });
});

describe("FOCUS", () => {
  it("auto suggest idle is 30 minutes", () => {
    expect(FOCUS.AUTO_SUGGEST_IDLE_MS).toBe(1_800_000);
  });

  it("has correct fade in duration", () => {
    expect(FOCUS.FADE_IN_MS).toBe(500);
  });

  it("has keyboard shortcut", () => {
    expect(FOCUS.KEYBOARD_SHORTCUT).toBe("Ctrl+Shift+F");
  });
});

describe("PERFORMANCE", () => {
  it("max page load impact is 50ms", () => {
    expect(PERFORMANCE.MAX_PAGE_LOAD_IMPACT_MS).toBe(50);
  });

  it("max memory is 20MB", () => {
    expect(PERFORMANCE.MAX_MEMORY_MB).toBe(20);
  });

  it("embed max gzipped is 15KB", () => {
    expect(PERFORMANCE.EMBED_MAX_GZIPPED_KB).toBe(15);
  });
});

describe("DATA_RETENTION", () => {
  it("web trail retention is 30 days", () => {
    expect(DATA_RETENTION.WEB_TRAIL_DAYS).toBe(30);
  });

  it("chat expiry matches CHAT constant", () => {
    expect(DATA_RETENTION.CHAT_EXPIRY_HOURS).toBe(CHAT.EXPIRY_HOURS);
  });

  it("account deletion grace period is 30 days", () => {
    expect(DATA_RETENTION.ACCOUNT_DELETION_DAYS).toBe(30);
  });
});

describe("STRIPE_CONFIG", () => {
  it("has 7 day grace period", () => {
    expect(STRIPE_CONFIG.GRACE_PERIOD_DAYS).toBe(7);
  });
});

describe("CONNECTION", () => {
  it("max websockets per user is 5", () => {
    expect(CONNECTION.MAX_WS_PER_USER).toBe(5);
  });
});

describe("CORS_ALLOWED_ORIGINS", () => {
  it("includes nonley.com", () => {
    expect(CORS_ALLOWED_ORIGINS).toContain("https://nonley.com");
  });

  it("includes www.nonley.com", () => {
    expect(CORS_ALLOWED_ORIGINS).toContain("https://www.nonley.com");
  });

  it("includes nonley.app", () => {
    expect(CORS_ALLOWED_ORIGINS).toContain("https://nonley.app");
  });

  it("includes nonley.io", () => {
    expect(CORS_ALLOWED_ORIGINS).toContain("https://nonley.io");
  });

  it("all origins use HTTPS", () => {
    for (const origin of CORS_ALLOWED_ORIGINS) {
      expect(origin.startsWith("https://")).toBe(true);
    }
  });
});
