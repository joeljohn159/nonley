import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test("renders login page with branding", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("nonley");
    await expect(
      page.locator("text=You are never alone on the internet."),
    ).toBeVisible();
  });

  test("shows Google sign-in button", async ({ page }) => {
    await page.goto("/login");
    const googleBtn = page.locator("button", {
      hasText: "Continue with Google",
    });
    await expect(googleBtn).toBeVisible();
  });

  test("shows GitHub sign-in button", async ({ page }) => {
    await page.goto("/login");
    const githubBtn = page.locator("button", {
      hasText: "Continue with GitHub",
    });
    await expect(githubBtn).toBeVisible();
  });

  test("shows magic link email form", async ({ page }) => {
    await page.goto("/login");
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute("type", "email");
    await expect(emailInput).toHaveAttribute("required", "");
  });

  test("has Send Magic Link submit button", async ({ page }) => {
    await page.goto("/login");
    const submitBtn = page.locator('button[type="submit"]', {
      hasText: "Send Magic Link",
    });
    await expect(submitBtn).toBeVisible();
  });

  test("email input accepts valid email", async ({ page }) => {
    await page.goto("/login");
    const emailInput = page.locator('input[name="email"]');
    await emailInput.fill("test@example.com");
    await expect(emailInput).toHaveValue("test@example.com");
  });
});

test.describe("Navigation Guards", () => {
  test("unauthenticated user is redirected from protected routes", async ({
    page,
  }) => {
    await page.goto("/");
    // Should redirect to login since user is not authenticated
    await page.waitForURL(/\/(login|api\/auth)/);
  });

  test("unauthenticated user is redirected from settings", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForURL(/\/(login|api\/auth)/);
  });

  test("unauthenticated user is redirected from circles", async ({ page }) => {
    await page.goto("/circles");
    await page.waitForURL(/\/(login|api\/auth)/);
  });
});

test.describe("404 Page", () => {
  test("shows 404 for non-existent routes", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.locator("text=404")).toBeVisible();
    await expect(page.locator("text=Go Home")).toBeVisible();
  });

  test("404 page has a link back to home", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    const homeLink = page.locator('a[href="/"]', { hasText: "Go Home" });
    await expect(homeLink).toBeVisible();
  });
});
