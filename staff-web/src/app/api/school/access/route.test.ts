// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
const m = vi.hoisted(() => ({ auth: vi.fn(), findFirst: vi.fn(), update: vi.fn() }));
vi.mock('@/lib/auth', () => ({ auth: m.auth }));
vi.mock('@/lib/prisma', () => ({ default: { user: { findFirst: m.findFirst }, class: { update: m.update }, student: { update: m.update } } }));
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(), getClientIp: vi.fn() }));
import { POST } from './route';
const request = (body: unknown) => new NextRequest('https://example.com/api/school/access', { method: 'POST', body: JSON.stringify(body) });
beforeEach(() => { vi.resetAllMocks(); });
describe('school account association management', () => {
 it.each(['teacher','student','member','staff'])('prevents %s from assigning accounts', async role => {
  m.auth.mockResolvedValue({ user: { id: 1, role } });
  expect((await POST(request({ kind: 'teacher', recordId: 1, userId: 2 }))).status).toBe(403);
  expect(m.update).not.toHaveBeenCalled();
 });
 it('rejects inactive or wrong-role account targets', async () => {
  m.auth.mockResolvedValue({ user: { id: 1, role: 'admin' } });
  m.findFirst.mockResolvedValue(null);
  expect((await POST(request({ kind: 'teacher', recordId: 1, userId: 2 }))).status).toBe(400);
  expect(m.findFirst).toHaveBeenCalledWith({ where: { id: 2, role: 'teacher', isActive: true } });
  expect(m.update).not.toHaveBeenCalled();
 });
 it('allows an administrator to revoke a class assignment', async () => {
  m.auth.mockResolvedValue({ user: { id: 1, role: 'admin' } });
  expect((await POST(request({ kind: 'teacher', recordId: 1, userId: null }))).status).toBe(200);
  expect(m.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { teacherId: null } });
 });
});
