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
        await expect(page.locator('a[href="/dashboard/users"]').first()).toBeVisible();
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
  await expect(page.getByRole("alert").first()).toContainText(/invalid|incorrect|failed|error/i);
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


test("school invoices are issued only by admins and can be voided before payment", async ({ request }) => {
  test.skip(!hasFixture, "Requires ephemeral integration database");

  expect((await request.get("/api/admin/school/invoices")).status()).toBe(401);
  const login = await request.post("/api/auth/login", {
    data: { email: adminEmail, password: adminPassword },
  });
  expect(login.status()).toBe(200);
  const { token } = await login.json();
  const headers = { Authorization: `Bearer ${token}` };

  const index = await request.get("/api/admin/school/invoices", { headers });
  expect(index.status()).toBe(200);
  const students = (await index.json()).students as { id: number; studentId: number }[];
  const student = students.find(s => s.studentId === 991017);
  expect(student).toBeDefined();

  const invalid = await request.post("/api/admin/school/invoices", {
    headers, data: { studentId: student!.id, amountCents: -300, description: "Test", dueDate: "2026-12-10" },
  });
  expect(invalid.status()).toBe(400);

  const created = await request.post("/api/admin/school/invoices", {
    headers, data: {
      studentId: student!.id, amountCents: 2500,
      description: "CI Test School Materials", dueDate: "2026-12-10",
    },
  });
  expect(created.status()).toBe(201);
  const invoice = await created.json();
  expect(invoice.amountCents).toBe(2500);
  expect(invoice.status).toBe("pending");

  const visible = await request.get("/api/school/invoices", { headers });
  expect(visible.status()).toBe(200);
  expect((await visible.json()).invoices.some((i: { id: string }) => i.id === invoice.id)).toBe(true);

  const voided = await request.patch(`/api/admin/school/invoices/${invoice.id}`, {
    headers, data: { action: "void" },
  });
  expect(voided.status()).toBe(200);
  const doubleVoid = await request.patch(`/api/admin/school/invoices/${invoice.id}`, {
    headers, data: { action: "void" },
  });
  expect(doubleVoid.status()).toBe(409);
});


test("educational resources require staff publishing, validate links and hide drafts", async ({ request }) => {
  test.skip(!hasFixture, "Requires isolated PostgreSQL test database");
  const authResult = await request.post("/api/auth/login", {
    data: { email: adminEmail, password: adminPassword },
  });
  expect(authResult.status()).toBe(200);
  const { token } = await authResult.json();
  const headers = { Authorization: `Bearer ${token}` };
  const resource = {
    title: "Verified CI Educational Resource",
    description: "A record created by the integration tests",
    category: "Education",
    type: "link",
    url: "https://www.example.org/education",
    tags: ["testing"], gradeLevels: ["all"],
    createdBy: "CI", isFeatured: false, isPublished: false,
  };
  const invalid = await request.post("/api/admin/resources", {
    headers, data: { ...resource, url: "javascript:alert(1)" },
  });
  expect(invalid.status()).toBe(400);

  const unauthorized = await request.post("/api/admin/resources", { data: resource });
  expect(unauthorized.status()).toBe(401);

  const created = await request.post("/api/admin/resources", { headers, data: resource });
  expect(created.status()).toBe(201);
  const draft = await created.json();
  expect(draft.isPublished).toBe(false);

  const beforePublishing = await request.get("/api/resources?search=Verified%20CI");
  expect(beforePublishing.status()).toBe(200);
  expect((await beforePublishing.json()).resources.some((r: { id: string }) => r.id === draft.id)).toBe(false);

  const saved = await request.put(`/api/admin/resources/${draft.id}`, {
    headers, data: { ...resource, isPublished: true },
  });
  expect(saved.status()).toBe(200);
  expect((await saved.json()).isPublished).toBe(true);

  const listed = await request.get("/api/resources?search=Verified%20CI");
  expect(listed.status()).toBe(200);
  expect((await listed.json()).resources.some((r: { id: string }) => r.id === draft.id)).toBe(true);
  const detail = await request.get(`/api/resources/${draft.id}`);
  expect(detail.status()).toBe(200);
  const view = await request.post(`/api/resources/${draft.id}/view`);
  expect(view.status()).toBe(200);

  const removed = await request.delete(`/api/admin/resources/${draft.id}`, { headers });
  expect(removed.status()).toBe(200);
  expect((await request.get(`/api/resources/${draft.id}`)).status()).toBe(404);
});


test("CRM analytics reflect database totals and enforce admin-only access", async ({ request }) => {
  test.skip(!hasFixture, "Requires isolated database fixture");
  expect((await request.get("/api/mobile/admin/analytics")).status()).toBe(401);

  const parentResponse = await request.post("/api/auth/login", {
    data: { email: "ci-parent@example.test", password: "ci-only-parent-password-not-for-production" },
  });
  expect(parentResponse.status()).toBe(200);
  const parent = await parentResponse.json();
  expect((await request.get("/api/mobile/admin/analytics", {
    headers: { Authorization: `Bearer ${parent.token}` },
  })).status()).toBe(403);

  const adminResponse = await request.post("/api/auth/login", {
    data: { email: adminEmail, password: adminPassword },
  });
  expect(adminResponse.status()).toBe(200);
  const admin = await adminResponse.json();
  const result = await request.get("/api/mobile/admin/analytics", {
    headers: { Authorization: `Bearer ${admin.token}` },
  });
  expect(result.status()).toBe(200);
  const report = await result.json();
  expect(report.months).toHaveLength(6);
  for (const month of report.months) {
    expect(Number.isFinite(month.donations)).toBe(true);
    expect(Number.isFinite(month.expenses)).toBe(true);
    expect(Number.isInteger(month.newMembers)).toBe(true);
  }
  expect(report.totals.activeMembers).toBeGreaterThanOrEqual(2);
  expect(report.events).toEqual(expect.any(Array));
  if (report.events.length > 0) {
    expect(report.events[0]).toHaveProperty("confirmedRSVPs");
    expect(report.events[0]).not.toHaveProperty("attended");
  }
});
