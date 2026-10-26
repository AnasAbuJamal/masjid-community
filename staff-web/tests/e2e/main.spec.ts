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


test("financial budgets remain private until published and use real posted expenses", async ({ request }) => {
  test.skip(!hasFixture, "Requires isolated PostgreSQL test database");
  expect((await request.get("/api/admin/finances/budgets")).status()).toBe(401);

  const response = await request.post("/api/auth/login", {
    data: { email: adminEmail, password: adminPassword },
  });
  expect(response.status()).toBe(200);
  const { token } = await response.json();
  const headers = { Authorization: `Bearer ${token}` };
  const adminList = await request.get("/api/admin/finances/budgets", { headers });
  expect(adminList.status()).toBe(200);
  const categories = (await adminList.json()).categories as { id: number; name: string }[];
  const category = categories.find(c => c.name === "CI Utilities");
  expect(category).toBeDefined();

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const draft = {
    categoryId: category!.id, year, month, allocated: 200,
    isPublished: false,
  };
  const invalid = await request.post("/api/admin/finances/budgets", {
    headers, data: { ...draft, allocated: -1 },
  });
  expect(invalid.status()).toBe(400);

  const created = await request.post("/api/admin/finances/budgets", { headers, data: draft });
  expect(created.status()).toBe(200);
  const id = (await created.json()).id;

  const endpoint = `/api/public/finances?year=${year}&month=${month}`;
  const privateReport = await request.get(endpoint);
  expect(privateReport.status()).toBe(200);
  expect((await privateReport.json()).budgets.some((r: { id: string }) => r.id === String(id))).toBe(false);

  const publish = await request.post("/api/admin/finances/budgets", {
    headers, data: { ...draft, isPublished: true },
  });
  expect(publish.status()).toBe(200);
  const report = await request.get(endpoint);
  expect(report.status()).toBe(200);
  const budget = (await report.json()).budgets.find((r: { id: string }) => r.id === String(id));
  expect(budget).toBeDefined();
  expect(budget.allocated).toBe(200);
  expect(budget.spent).toBeGreaterThanOrEqual(34.25);

  const deleted = await request.delete(`/api/admin/finances/budgets/${id}`, { headers });
  expect(deleted.status()).toBe(200);
  const after = await request.get(endpoint);
  expect((await after.json()).budgets.some((r: { id: string }) => r.id === String(id))).toBe(false);
});


test("mobile admin job publishing and status changes require real permission", async ({ request }) => {
  test.skip(!hasFixture, "Requires isolated PostgreSQL test database");
  expect((await request.get("/api/mobile/admin/jobs")).status()).toBe(401);
  const result = await request.post("/api/auth/login", {
    data: { email: adminEmail, password: adminPassword },
  });
  const admin = await result.json();
  const headers = { Authorization: `Bearer ${admin.token}` };

  const job = {
    title: "CI Integration Test Position",
    company: "Masjid Test Unit",
    contactName: "Test Admin", contactEmail: "ci-jobs@example.test",
    description: "A staging-only integration test vacancy",
    location: "Test location", category: "Education", employmentType: "part_time",
  };
  const invalid = await request.post("/api/mobile/admin/jobs", {
    headers, data: { ...job, employmentType: "any_type" },
  });
  expect(invalid.status()).toBe(400);

  const created = await request.post("/api/mobile/admin/jobs", { headers, data: job });
  expect(created.status()).toBe(201);
  const { id } = await created.json();
  const list = await request.get("/api/mobile/admin/jobs", { headers });
  expect(list.status()).toBe(200);
  expect((await list.json()).jobs.some((j: { id: string }) => j.id === id)).toBe(true);

  const paused = await request.patch(`/api/mobile/admin/jobs/${id}`, {
    headers, data: { status: "paused" },
  });
  expect(paused.status()).toBe(200);
  const publiclyHidden = await request.get(`/api/public/jobs/${id}`);
  expect(publiclyHidden.status()).toBe(404);

  const restored = await request.patch(`/api/mobile/admin/jobs/${id}`, {
    headers, data: { status: "active" },
  });
  expect(restored.status()).toBe(200);
  expect((await request.get(`/api/public/jobs/${id}`)).status()).toBe(200);
  await request.patch(`/api/mobile/admin/jobs/${id}`, { headers, data: { status: "closed" } });
});

test("volunteer reviews cannot fill more spots than the opportunity allows", async ({ request }) => {
  test.skip(!hasFixture, "Requires isolated PostgreSQL test database");
  expect((await request.get("/api/mobile/admin/volunteer-applications")).status()).toBe(401);
  const result = await request.post("/api/auth/login", {
    data: { email: adminEmail, password: adminPassword },
  });
  const { token } = await result.json();
  const headers = { Authorization: `Bearer ${token}` };
  const queue = await request.get("/api/mobile/admin/volunteer-applications", {
    headers, params: { q: "CI Volunteer" },
  });
  expect(queue.status()).toBe(200);
  const applications = (await queue.json()).applications as { id: string }[];
  expect(applications).toHaveLength(2);
  const [first, second] = applications;
  const approve = await request.patch(`/api/mobile/admin/volunteer-applications/${first.id}`, {
    headers, data: { status: "approved" },
  });
  expect(approve.status()).toBe(200);
  const duplicate = await request.patch(`/api/mobile/admin/volunteer-applications/${first.id}`, {
    headers, data: { status: "approved" },
  });
  expect(duplicate.status()).toBe(200);
  const excess = await request.patch(`/api/mobile/admin/volunteer-applications/${second.id}`, {
    headers, data: { status: "approved" },
  });
  expect(excess.status()).toBe(409);

  const reject = await request.patch(`/api/mobile/admin/volunteer-applications/${first.id}`, {
    headers, data: { status: "rejected" },
  });
  expect(reject.status()).toBe(200);
  const nowApprove = await request.patch(`/api/mobile/admin/volunteer-applications/${second.id}`, {
    headers, data: { status: "approved" },
  });
  expect(nowApprove.status()).toBe(200);
});

test("admin audit logs are accessible only to administrators", async ({ request }) => {
  test.skip(!hasFixture, "Requires isolated PostgreSQL test database");
  expect((await request.get("/api/mobile/admin/audit-logs")).status()).toBe(401);
  const adminResponse = await request.post("/api/auth/login", {
    data: { email: adminEmail, password: adminPassword },
  });
  const { token } = await adminResponse.json();
  const result = await request.get("/api/mobile/admin/audit-logs", {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(result.status()).toBe(200);
  const data = await result.json();
  expect(data.logs).toEqual(expect.any(Array));
  expect(data.logs.every((log: { ipAddress?: string }) => log.ipAddress === undefined)).toBe(true);
});


test("announcements publish only after start time and respect visibility", async ({ request }) => {
  test.skip(!hasFixture, "Requires isolated integration database");
  expect((await request.get("/api/mobile/admin/announcements")).status()).toBe(401);

  const login = await request.post("/api/auth/login", {
    data: { email: adminEmail, password: adminPassword },
  });
  expect(login.status()).toBe(200);
  const { token } = await login.json();
  const headers = { Authorization: `Bearer ${token}` };

  const future = new Date(Date.now() + 86400000).toISOString();
  const text = "CI Future Announcement";
  const scheduled = await request.post("/api/mobile/admin/announcements", {
    headers, data: {
      title: text, message: "Scheduled CI-only text",
      type: "general", priority: 0, startsAt: future,
    },
  });
  expect(scheduled.status()).toBe(201);
  const { id, status } = await scheduled.json();
  expect(status).toBe("scheduled");

  const publicResult = await request.get("/api/public/announcements");
  expect(publicResult.status()).toBe(200);
  expect((await publicResult.json()).announcements.some((a: { id: number }) => String(a.id) === id)).toBe(false);

  const visible = await request.get("/api/mobile/admin/announcements", { headers });
  expect(visible.status()).toBe(200);
  expect((await visible.json()).announcements.some((a: { id: string }) => a.id === id)).toBe(true);

  const hidden = await request.patch(`/api/mobile/admin/announcements/${id}`, {
    headers, data: { isActive: false },
  });
  expect(hidden.status()).toBe(200);

  const invalid = await request.post("/api/mobile/admin/announcements", {
    headers, data: {
      title: "Invalid", message: "bad category", type: "unknown",
      priority: 0,
    },
  });
  expect(invalid.status()).toBe(400);

  const published = await request.post("/api/mobile/admin/announcements", {
    headers, data: {
      title: "CI Immediate Announcement", message: "Visible in integration tests",
      type: "event", priority: 1,
    },
  });
  expect(published.status()).toBe(201);
  const instantId = (await published.json()).id;
  const after = await request.get("/api/public/announcements");
  expect((await after.json()).announcements.some((a: { id: number }) => String(a.id) === instantId)).toBe(true);
});


test("anonymous donors are never identified in the authenticated CRM donor ledger", async ({ request }) => {
  test.skip(!hasFixture, "Requires isolated PostgreSQL test database");
  expect((await request.get("/api/mobile/admin/donors")).status()).toBe(401);

  const memberResponse = await request.post("/api/auth/login", {
    data: { email: "ci-parent@example.test", password: "ci-only-parent-password-not-for-production" },
  });
  const member = await memberResponse.json();
  expect((await request.get("/api/mobile/admin/donors", {
    headers: { Authorization: `Bearer ${member.token}` },
  })).status()).toBe(403);

  const adminResponse = await request.post("/api/auth/login", {
    data: { email: adminEmail, password: adminPassword },
  });
  const admin = await adminResponse.json();
  const result = await request.get("/api/mobile/admin/donors", {
    headers: { Authorization: `Bearer ${admin.token}` },
  });
  expect(result.status()).toBe(200);
  const data = await result.json();
  expect(data.totals.amount).toBeGreaterThanOrEqual(21.25);
  expect(data.totals.anonymousAmount).toBeGreaterThanOrEqual(8.75);
  expect(data.donors.some((d: { email: string }) => d.email === "ci-named-donor@example.test")).toBe(true);
  expect(data.donors.some((d: { email: string }) => d.email === "ci-secret-donor@example.test")).toBe(false);
  const raw = JSON.stringify(data);
  expect(raw).not.toContain("CI Private Donor");
});


test("facility administrators cannot approve overlapping reservations", async ({ request }) => {
  test.skip(!hasFixture, "Requires isolated PostgreSQL database");
  expect((await request.get("/api/mobile/admin/facilities")).status()).toBe(401);
  const login = await request.post("/api/auth/login", {
    data: { email: adminEmail, password: adminPassword },
  });
  expect(login.status()).toBe(200);
  const { token } = await login.json();
  const headers = { Authorization: `Bearer ${token}` };
  const response = await request.get("/api/mobile/admin/facilities", { headers });
  expect(response.status()).toBe(200);
  const body = await response.json();
  const items = body.facilities as { id: string; name: string }[];
  expect(items.some(item => item.name === "CI Community Room")).toBe(true);
  const bookings = (body.bookings as { id: string; renterName: string }[])
    .filter(b => b.renterName.startsWith("CI Renter"));
  expect(bookings).toHaveLength(2);

  const approved = await request.patch(`/api/mobile/admin/facilities/bookings/${bookings[0].id}`, {
    headers, data: { status: "approved" },
  });
  expect(approved.status()).toBe(200);
  const conflict = await request.patch(`/api/mobile/admin/facilities/bookings/${bookings[1].id}`, {
    headers, data: { status: "approved" },
  });
  expect(conflict.status()).toBe(409);
  const firstRejected = await request.patch(`/api/mobile/admin/facilities/bookings/${bookings[0].id}`, {
    headers, data: { status: "rejected" },
  });
  expect(firstRejected.status()).toBe(200);
  const next = await request.patch(`/api/mobile/admin/facilities/bookings/${bookings[1].id}`, {
    headers, data: { status: "approved" },
  });
  expect(next.status()).toBe(200);
});


test("CRM tasks persist create, transition, completion, reopen and deletion with admin authorization", async ({ request }) => {
  test.skip(!hasFixture, "Requires isolated PostgreSQL test database");
  expect((await request.get("/api/mobile/admin/crm/tasks")).status()).toBe(401);

  const parentLogin = await request.post("/api/auth/login", {
    data: { email: "ci-parent@example.test", password: "ci-only-parent-password-not-for-production" },
  });
  expect(parentLogin.status()).toBe(200);
  const { token: parentToken } = await parentLogin.json();
  expect((await request.get("/api/mobile/admin/crm/tasks", {
    headers: { Authorization: `Bearer ${parentToken}` },
  })).status()).toBe(403);

  const response = await request.post("/api/auth/login", {
    data: { email: adminEmail, password: adminPassword },
  });
  expect(response.status()).toBe(200);
  const { token } = await response.json();
  const headers = { Authorization: `Bearer ${token}` };

  const invalid = await request.post("/api/mobile/admin/crm/tasks", {
    headers, data: { title: "Unacceptable", description: "",
      category: "general", priority: "incorrect" },
  });
  expect(invalid.status()).toBe(400);

  const created = await request.post("/api/mobile/admin/crm/tasks", {
    headers, data: {
      title: "CI Follow-up Call", description: "Phone an enrolled family",
      assignedTo: "CI Administrator", category: "follow_up", priority: "high",
      dueDate: new Date(Date.now() + 86400000).toISOString(),
    },
  });
  expect(created.status()).toBe(201);
  const task = await created.json();
  expect(task.status).toBe("pending");
  expect(task.category).toBe("follow_up");

  const list = await request.get("/api/mobile/admin/crm/tasks?category=follow_up", { headers });
  expect(list.status()).toBe(200);
  const items = (await list.json()).tasks as { id: string; status: string }[];
  expect(items.some(item => item.id === task.id)).toBe(true);

  const progress = await request.patch(`/api/mobile/admin/crm/tasks/${task.id}`, {
    headers, data: { status: "in_progress" },
  });
  expect(progress.status()).toBe(200);
  const completed = await request.patch(`/api/mobile/admin/crm/tasks/${task.id}`, {
    headers, data: { status: "completed" },
  });
  expect(completed.status()).toBe(200);
  const reOpen = await request.patch(`/api/mobile/admin/crm/tasks/${task.id}`, {
    headers, data: { status: "pending" },
  });
  expect(reOpen.status()).toBe(200);

  const deleted = await request.delete(`/api/mobile/admin/crm/tasks/${task.id}`, { headers });
  expect(deleted.status()).toBe(200);
  expect((await request.delete(`/api/mobile/admin/crm/tasks/${task.id}`, { headers })).status()).toBe(404);
});
