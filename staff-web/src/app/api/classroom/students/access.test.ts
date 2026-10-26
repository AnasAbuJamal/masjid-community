// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const m = vi.hoisted(() => ({ auth: vi.fn(), rows: vi.fn(), count: vi.fn() }));
vi.mock('@/lib/auth', () => ({ auth: m.auth }));
vi.mock('@/lib/prisma', () => ({ default: { student: { findMany: m.rows, count: m.count } } }));
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(), getClientIp: vi.fn() }));
import { GET } from './route';
beforeEach(() => { vi.resetAllMocks(); m.auth.mockResolvedValue({ user: { id: 7, role: 'teacher' } }); m.rows.mockResolvedValue([]); m.count.mockResolvedValue(0); });
describe('report student picker scope', () => {
 it('intersects the requested class with teacher access for rows and counts', async () => {
  const response = await GET(new NextRequest('https://example.com?classId=4&page=2&limit=50'));
  const where = { AND: [{ class: { teacherId: 7 } }, { isActive: true, classId: 4 }] };
  expect(m.rows).toHaveBeenCalledWith(expect.objectContaining({ where, skip: 50, take: 50, orderBy: [{ firstName: 'asc' }, { id: 'asc' }] }));
  expect(m.count).toHaveBeenCalledWith({ where });
  expect(response.headers.get('Cache-Control')).toBe('no-store');
 });
 it('does not widen a student account to the requested class roster', async () => {
  m.auth.mockResolvedValue({ user: { id: 7, role: 'student' } });
  await GET(new NextRequest('https://example.com?classId=4'));
  expect(m.rows.mock.calls[0][0].where.AND[0]).toEqual({ userId: 7 });
 });
 it.each(['?classId=','?classId=abc','?page=-1','?limit=101','?page=10001'])('rejects malformed or unbounded filters %s', async query => {
  expect((await GET(new NextRequest(`https://example.com${query}`))).status).toBe(400);
  expect(m.rows).not.toHaveBeenCalled();
 });
 it('requires authentication', async () => {
  m.auth.mockResolvedValue(null);
  expect((await GET(new NextRequest('https://example.com'))).status).toBe(401);
  expect(m.rows).not.toHaveBeenCalled();
 });
});
