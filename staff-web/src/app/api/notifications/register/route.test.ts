// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
const m = vi.hoisted(() => ({ auth: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() }));
vi.mock('@/lib/auth', () => ({ auth: m.auth }));
vi.mock('@/lib/prisma', () => ({ default: { pushToken: m } }));
import { POST, DELETE } from './route';
const request = (body: unknown) => new NextRequest('https://example.com/api/notifications/register', { method: 'POST', body: JSON.stringify(body) });
beforeEach(() => { vi.resetAllMocks(); m.auth.mockResolvedValue({ user: { id: 7 } }); });
describe('device registration ownership', () => {
 it('requires authentication for registration and removal', async () => {
  m.auth.mockResolvedValue(null);
  expect((await POST(request({ token: 'ExpoPushToken[device]' }))).status).toBe(401);
  expect((await DELETE(request({ token: 'ExpoPushToken[device]' }))).status).toBe(401);
  expect(m.upsert).not.toHaveBeenCalled();
 });
 it('rejects invalid tokens and client-supplied ownership', async () => {
  for (const body of [{ token: 'invalid' }, { token: 'ExpoPushToken[device]', userId: 22 }, {}]) expect((await POST(request(body))).status).toBe(400);
  expect(m.upsert).not.toHaveBeenCalled();
 });
 it('associates the installation with the session user and expiry', async () => {
  expect((await POST(request({ token: 'ExpoPushToken[device]' }))).status).toBe(200);
  expect(m.upsert).toHaveBeenCalledWith({ where: { token: 'ExpoPushToken[device]' }, create: { token: 'ExpoPushToken[device]', userId: 7, expiresAt: expect.any(Date) }, update: { userId: 7, expiresAt: expect.any(Date) } });
 });
 it('only removes the current user device registration', async () => {
  await DELETE(request({ token: 'ExpoPushToken[device]' }));
  expect(m.deleteMany).toHaveBeenCalledWith({ where: { token: 'ExpoPushToken[device]', userId: 7 } });
 });
});
