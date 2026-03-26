import { test, expect } from "@playwright/test";

test.describe("API Routes - Unauthenticated", () => {
  test("GET /api/circles returns 401 without auth", async ({ request }) => {
    const response = await request.get("/api/circles");
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  test("GET /api/connections returns 401 without auth", async ({ request }) => {
    const response = await request.get("/api/connections");
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test("GET /api/settings returns 401 without auth", async ({ request }) => {
    const response = await request.get("/api/settings");
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test("GET /api/admin/stats returns 401 without auth", async ({ request }) => {
    const response = await request.get("/api/admin/stats");
    expect(response.status()).toBe(401);
  });

  test("GET /api/admin/users returns 401 without auth", async ({ request }) => {
    const response = await request.get("/api/admin/users");
    expect(response.status()).toBe(401);
  });

  test("POST /api/ws-token returns 401 without auth", async ({ request }) => {
    const response = await request.post("/api/ws-token");
    expect(response.status()).toBe(401);
  });

  test("GET /api/settings/export returns 401 without auth", async ({
    request,
  }) => {
    const response = await request.get("/api/settings/export");
    expect(response.status()).toBe(401);
  });

  test("DELETE /api/settings/delete-account returns 401 without auth", async ({
    request,
  }) => {
    const response = await request.delete("/api/settings/delete-account");
    expect(response.status()).toBe(401);
  });
});

test.describe("API Routes - Validation", () => {
  test("POST /api/circles with invalid body returns 400", async ({
    request,
  }) => {
    const response = await request.post("/api/circles", {
      data: {},
      headers: { "Content-Type": "application/json" },
    });
    // Either 400 validation error or 401 unauthorized
    expect([400, 401]).toContain(response.status());
  });

  test("Stripe webhook without signature returns error", async ({
    request,
  }) => {
    const response = await request.post("/api/stripe/webhook", {
      data: { type: "checkout.session.completed" },
      headers: { "Content-Type": "application/json" },
    });
    // Should fail without valid Stripe signature
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe("API Response Format", () => {
  test("error responses have consistent structure", async ({ request }) => {
    const response = await request.get("/api/circles");
    const body = await response.json();

    expect(body).toHaveProperty("success");
    expect(body.success).toBe(false);
    expect(body).toHaveProperty("error");
    expect(body.error).toHaveProperty("code");
    expect(body.error).toHaveProperty("message");
    expect(typeof body.error.code).toBe("string");
    expect(typeof body.error.message).toBe("string");
  });
});
