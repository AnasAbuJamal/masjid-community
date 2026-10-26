import { test, expect, type Page } from "@playwright/test";

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
const hasFixture = Boolean(adminEmail && adminPassword);

async function login(page: Page) {
  const pageResponse = await page.goto("/");
      expect(pageResponse?.status(), "Login page must respond successfully").toBe(200);
  await page.locator('input[type="email"]').fill(adminEmail!);
  await page.locator('input[type="password"]').fill(adminPassword!);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/dashboard(?:\/|$)/, { timeout: 20000 });
}

test.describe("Responsive access — phone, iPad and desktop", () => {
  for (const device of [
    { name: "phone", width: 390, height: 844 },
    { name: "iPad", width: 820, height: 1180 },
    { name: "desktop", width: 1440, height: 900 },
  ]) {
    test(`${device.name}: login controls fit viewport without horizontal scrolling`, async ({ page }) => {
      await page.setViewportSize({ width: device.width, height: device.height });
      const pageResponse = await page.goto("/");
    expect(pageResponse?.status(), "Login page must respond successfully").toBe(200);
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(device.width + 1);
    });

    test(`${device.name}: dashboard layout is usable`, async ({ page }) => {
      test.skip(!hasFixture, "Only run with an isolated test admin");
      await page.setViewportSize({ width: device.width, height: device.height });
      await login(page);
      await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(device.width + 1);
      if (device.width < 1024) {
        await page.getByRole("button", { name: "Open navigation" }).click();
        await expect(page.getByRole("link", { name: /users/i }).first()).toBeVisible();
      }
    });
  }
});

test("invalid credentials show an authentication error", async ({ page }) => {
  const pageResponse = await page.goto("/");
      expect(pageResponse?.status(), "Login page must respond successfully").toBe(200);
  await page.locator('input[type="email"]').fill("invalid@example.test");
  await page.locator('input[type="password"]').fill("not-the-right-password");
  await page.locator('button[type="submit"]').click();
  await expect(page.getByText(/invalid|incorrect|failed|error/i).first()).toBeVisible();
});

test("staff can open user management and sign out", async ({ page }) => {
  test.skip(!hasFixture, "Only run with an isolated test admin");
  await login(page);
  await page.goto("/dashboard/users");
  await expect(page.getByRole("heading", { name: /user/i }).first()).toBeVisible();
  await page.getByRole("button", { name: /sign out/i }).first().click();
  await expect(page).toHaveURL("/");
});

test("public API uses database and protected data rejects guests", async ({ request }) => {
  const campaigns = await request.get("/api/donations/campaigns");
  expect(campaigns.status()).toBe(200);
  expect(Array.isArray((await campaigns.json()).campaigns)).toBe(true);
  const proposals = await request.get("/api/public/proposals");
  expect(proposals.status()).toBe(200);
  for (const path of [
    "/api/school/students", "/api/applications/mine",
    "/api/public/gamification", "/api/donations/mine",
    "/api/donations/recurring", "/api/public/rentals/bookings",
    "/api/public/students/123",
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(401);
  }
});

test("mobile bearer login authenticates and authorizes the user's private endpoints", async ({ request }) => {
  test.skip(!hasFixture, "Only run with an isolated test admin");
  const response = await request.post("/api/auth/login", {
    data: { email: adminEmail, password: adminPassword },
  });
  expect(response.status()).toBe(200);
  const { token, user } = await response.json();
  expect(typeof token).toBe("string");
  expect(user.email).toBe(adminEmail);
  const headers = { Authorization: `Bearer ${token}` };
  const me = await request.get("/api/auth/me", { headers });
  expect(me.status()).toBe(200);
  expect((await me.json()).email).toBe(adminEmail);
  const students = await request.get("/api/school/students", { headers });
  expect(students.status()).toBe(200);
  expect(Array.isArray(await students.json())).toBe(true);
  const history = await request.get("/api/donations/mine", { headers });
  expect(history.status()).toBe(200);
  expect(Array.isArray(await history.json())).toBe(true);
});

test("payment and student input are validated", async ({ request }) => {
  const badStudent = await request.post("/api/public/students", { data: {} });
  expect(badStudent.status()).toBe(400);
  const badLogin = await request.post("/api/auth/login", { data: { email: "", password: "" } });
  expect(badLogin.status()).toBe(400);
  const badPayment = await request.post("/api/donations/checkout", { data: { amount: -50 } });
  expect(badPayment.status()).toBe(400);
});
