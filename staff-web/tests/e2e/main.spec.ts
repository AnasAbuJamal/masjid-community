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


test("unverified parents cannot see a student's private data until confirming the email", async ({ request }) => {
  test.skip(!hasFixture, "Only run with an isolated test database");
  const parentEmail = "ci-parent@example.test";
  const login = await request.post("/api/auth/login", {
    data: { email: parentEmail, password: "ci-only-parent-password-not-for-production" },
  });
  expect(login.status()).toBe(200);
  const credentials = await login.json();
  expect(credentials.user.isVerified).toBe(false);
  const headers = { Authorization: `Bearer ${credentials.token}` };

  for (const url of [
    "/api/school/students", "/api/school/progress", "/api/school/assignments",
    "/api/public/students/991017", "/api/portal/students?studentId=991017",
  ]) {
    const response = await request.get(url, { headers });
    expect(response.status(), url).toBe(403);
  }

  // Opening the link (GET) does not silently verify accounts in email scanners.
  const token = "a".repeat(64);
  const review = await request.get(`/api/auth/verification/confirm?token=${token}`);
  expect(review.status()).toBe(200);
  expect(await review.text()).toContain("Confirm my email");
  const confirmation = await request.post("/api/auth/verification/confirm", {
    form: { token },
  });
  expect(confirmation.status()).toBe(200);
  expect(await confirmation.text()).toContain("Email verified");

  const nowAuthorized = await request.get("/api/school/students", { headers });
  expect(nowAuthorized.status()).toBe(200);
  const students = await nowAuthorized.json();
  expect(students).toHaveLength(1);
  expect(students[0].name).toBe("Test Student");

  const progress = await request.get("/api/school/progress", { headers });
  expect(progress.status()).toBe(200);
  expect((await progress.json()).students[0].instructor).toBe("Test Instructor");

  const details = await request.get("/api/public/students/991017", { headers });
  expect(details.status()).toBe(200);
  expect((await details.json()).firstName).toBe("Test");

  const replay = await request.post("/api/auth/verification/confirm", { form: { token } });
  expect(await replay.text()).toContain("Link expired");
});

test("mobile user administration is available only to admins and refuses self-deactivation", async ({ request }) => {
  test.skip(!hasFixture, "Only run with an isolated test admin");
  const login = await request.post("/api/auth/login", {
    data: { email: adminEmail, password: adminPassword },
  });
  expect(login.status()).toBe(200);
  const { token, user } = await login.json();
  const headers = { Authorization: `Bearer ${token}` };
  const list = await request.get("/api/mobile/admin/users", { headers });
  expect(list.status()).toBe(200);
  const data = await list.json();
  expect(data.total).toBeGreaterThanOrEqual(2);
  expect(data.users.every((u: { passwordHash?: string }) => !u.passwordHash)).toBe(true);

  const selfDeactivate = await request.patch(`/api/mobile/admin/users/${user.id}`, {
    headers, data: { isActive: false },
  });
  expect(selfDeactivate.status()).toBe(403);

  const unauthorized = await request.get("/api/mobile/admin/users");
  expect(unauthorized.status()).toBe(401);
});

test("public schedule returns persisted classes instead of example courses", async ({ request }) => {
  const response = await request.get("/api/public/classes");
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.classes.some((c: { name: string }) => c.name === "CI Test Quran Class")).toBe(true);
});
