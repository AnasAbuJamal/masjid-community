import { test, expect } from '@playwright/test';

test('login layout fits desktop and phone', async ({ page }, info) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`login-${width}.png`), fullPage: true });
  }
});

test('signed mobile sessions and public prayer contract', async ({ request }) => {
  expect((await request.get('/api/auth/me')).status()).toBe(401);
  const login = await request.post('/api/auth/login', { data: {
    email: process.env.ADMIN_SEED_EMAIL!.toUpperCase(), password: process.env.ADMIN_SEED_PASSWORD,
  } });
  expect(login.ok()).toBe(true);
  const { token, user } = await login.json();
  const me = await request.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
  expect(me.ok()).toBe(true);
  expect((await me.json()).id).toBe(user.id);
  expect((await request.get('/api/auth/me', { headers: { Authorization: 'Bearer forged' } })).status()).toBe(401);
  const prayers = await request.get('/api/public/prayers?days=7');
  expect(prayers.ok()).toBe(true);
  expect((await prayers.json()).prayerTimes.length).toBeGreaterThan(0);
  expect((await request.get('/api/public/prayers?date=2026-02-30')).status()).toBe(400);
});

test('staff can navigate on a phone using the keyboard', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByLabel('Email', { exact: true }).fill(process.env.ADMIN_SEED_EMAIL!);
  await page.getByLabel('Password', { exact: true }).fill(process.env.ADMIN_SEED_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in to workspace' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.getByRole('dialog', { name: 'Navigation' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('dashboard-phone.png'), fullPage: true });
});
