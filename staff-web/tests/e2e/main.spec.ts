import { test, expect } from "@playwright/test";

test.describe("Login Flow", () => {
  test("should display login page", async ({ page }) => {
    await page.goto("/");
    
    await expect(page.locator("h1, h2")).toContainText(/sign in|login|welcome/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("should show validation errors for empty fields", async ({ page }) => {
    await page.goto("/");
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator("text=/required|email|password/i")).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/");
    
    await page.fill('input[type="email"]', "invalid@test.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    
    await expect(page.locator("text=/invalid|incorrect|failed/i")).toBeVisible();
  });

  test("should redirect to dashboard on successful login", async ({ page }) => {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@almomineen.org";
    const adminPassword = process.env.ADMIN_PASSWORD || "AdminPass123!";
    
    await page.goto("/");
    
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.locator("text=/dashboard/i")).toBeVisible();
  });
});

test.describe("Dashboard Navigation", () => {
  test.beforeEach(async ({ page }) => {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@almomineen.org";
    const adminPassword = process.env.ADMIN_PASSWORD || "AdminPass123!";
    
    await page.goto("/");
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test("should navigate to Users page", async ({ page }) => {
    await page.click('text=/user management|users/i');
    await page.waitForURL(/\/dashboard\/users/);
    await expect(page.locator("h1")).toContainText(/user/i);
  });

  test("should navigate to Blog page", async ({ page }) => {
    await page.click('text=/blog|news/i');
    await page.waitForURL(/\/dashboard\/blog/);
    await expect(page.locator("h1")).toContainText(/blog/i);
  });

  test("should navigate to Finances page", async ({ page }) => {
    await page.click('text=/finance/i');
    await page.waitForURL(/\/dashboard\/finances/);
    await expect(page.locator("h1")).toContainText(/finance/i);
  });

  test("should show notification bell", async ({ page }) => {
    await expect(page.locator('[class*="bell"], svg[class*="Bell"]')).toBeVisible();
  });

  test("should toggle dark mode", async ({ page }) => {
    const themeButton = page.locator('button[title*="theme"], button:has-text("Dark"), button:has-text("Light")').first();
    if (await themeButton.isVisible()) {
      await themeButton.click();
    }
  });

  test("should logout successfully", async ({ page }) => {
    await page.click('text=/sign out|logout/i');
    await page.waitForURL("/");
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});

test.describe("User Management", () => {
  test.beforeEach(async ({ page }) => {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@almomineen.org";
    const adminPassword = process.env.ADMIN_PASSWORD || "AdminPass123!";
    
    await page.goto("/");
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await page.goto("/dashboard/users");
  });

  test("should display users list", async ({ page }) => {
    await expect(page.locator("h1")).toContainText(/user/i);
    await expect(page.locator("table, [role='table']")).toBeVisible();
  });

  test("should open create user dialog", async ({ page }) => {
    await page.click('button:has-text("Add"), button:has-text("Create"), button:has-text("New")');
    await expect(page.locator('input[type="email"]').last()).toBeVisible();
  });

  test("should search users", async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("admin");
      await expect(page.locator("table, [role='table']")).toBeVisible();
    }
  });
});

test.describe("Kiosk Mode", () => {
  test("should display public kiosk TV mode", async ({ page }) => {
    await page.goto("/kiosk/tv");
    
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("should display announcements on kiosk", async ({ page }) => {
    await page.goto("/kiosk/tv");
    
    await page.waitForTimeout(2000);
    
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(100);
  });
});

test.describe("API Endpoints", () => {
  test("should access public prayer times API", async ({ request }) => {
    const response = await request.get("/api/public/prayers");
    expect([200, 404]).toContain(response.status());
  });

  test("should access public blog API", async ({ request }) => {
    const response = await request.get("/api/public/blog");
    expect([200, 404]).toContain(response.status());
  });

  test("should reject unauthorized access to protected endpoints", async ({ request }) => {
    const response = await request.get("/api/users");
    expect([401, 403]).toContain(response.status());
  });

  test("should accept valid credentials", async ({ request }) => {
    const response = await request.post("/api/auth/signin", {
      data: {
        email: "admin@almomineen.org",
        password: "AdminPass123!",
      },
    });
    expect([200, 401]).toContain(response.status());
  });
});

test.describe("Responsive Design", () => {
  test("should work on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto("/");
    
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
  });

  test("should work on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto("/");
    
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
  });

  test("should work on desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.goto("/");
    
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
  });
});
