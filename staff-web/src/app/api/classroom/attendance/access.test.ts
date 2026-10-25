// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
const m = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock('@/lib/auth', () => ({ auth: m.auth }));
vi.mock('@/lib/prisma', () => ({ default: {} }));
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(), getClientIp: vi.fn() }));
import { GET, POST } from './route';
describe('attendance staff boundary', () => {
 it.each(['member', 'student'])('blocks %s from reading school-wide attendance or marking attendance', async role => {
  m.auth.mockResolvedValue({ user: { id: 7, role } });
  const req = new NextRequest('https://example.com/api/classroom/attendance');
  expect((await GET(req)).status).toBe(403);
  expect((await POST(req)).status).toBe(403);
 });
 it('requires a signed-in account', async () => {
  m.auth.mockResolvedValue(null);
  expect((await GET(new NextRequest('https://example.com/api/classroom/attendance'))).status).toBe(401);
 });
});
