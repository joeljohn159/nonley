import { test, expect } from "@playwright/test";

test.describe("Accessibility", () => {
  test("login page has proper heading hierarchy", async ({ page }) => {
    await page.goto("/login");
    const h1 = page.locator("h1");
    await expect(h1).toHaveCount(1);
  });

  test("login page buttons are keyboard accessible", async ({ page }) => {
    await page.goto("/login");
    // Tab through interactive elements
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    const tagName = await focused.evaluate((el) => el.tagName.toLowerCase());
    expect(["button", "input", "a"]).toContain(tagName);
  });

  test("login form email input has proper type for validation", async ({
    page,
  }) => {
    await page.goto("/login");
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveAttribute("type", "email");
  });

  test("404 page has proper heading", async ({ page }) => {
    await page.goto("/this-does-not-exist");
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
  });

  test("pages use semantic HTML", async ({ page }) => {
    await page.goto("/login");
    const main = page.locator("main");
    await expect(main).toHaveCount(1);
  });
});

test.describe("Responsive Design", () => {
  test("login page renders on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/login");
    await expect(page.locator("h1")).toBeVisible();
    const googleBtn = page.locator("button", {
      hasText: "Continue with Google",
    });
    await expect(googleBtn).toBeVisible();
  });

  test("login page renders on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/login");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("login page renders on desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/login");
    await expect(page.locator("h1")).toBeVisible();
  });
});

test.describe("Security Headers", () => {
  test("response includes security headers", async ({ request }) => {
    const response = await request.get("/login");
    const headers = response.headers();

    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["strict-transport-security"]).toContain("max-age=");
    expect(headers["content-security-policy"]).toBeDefined();
  });

  test("CSP header blocks framing", async ({ request }) => {
    const response = await request.get("/login");
    const csp = response.headers()["content-security-policy"];
    expect(csp).toContain("frame-ancestors 'none'");
  });
});
