// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
const m = vi.hoisted(() => ({ auth: vi.fn(), findMany: vi.fn(), count: vi.fn() }));
vi.mock('@/lib/auth', () => ({ auth: m.auth }));
vi.mock('@/lib/prisma', () => ({ default: { class: { findMany: m.findMany, count: m.count } } }));
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(), getClientIp: vi.fn() }));
import { GET, POST } from './route';
const req = (query = '') => new NextRequest(`https://example.com/api/classroom/classes${query}`);
beforeEach(() => {
  vi.resetAllMocks(); m.auth.mockResolvedValue({ user: { id: 7, role: 'teacher' } });
  m.findMany.mockResolvedValue([]); m.count.mockResolvedValue(0);
});
describe('teaching class access', () => {
  it('scopes the roster and count to assigned teacher and active students', async () => {
    const response = await GET(req('?page=2&limit=20'));
    expect(m.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { teacherId: 7 }, include: { students: { where: { isActive: true } } }, skip: 20, take: 20 }));
    expect(m.count).toHaveBeenCalledWith({ where: { teacherId: 7 } });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
  it.each(['student', 'member'])('does not provide a school roster to %s accounts', async role => {
    m.auth.mockResolvedValue({ user: { id: 7, role, isVerified: true } });
    await GET(req());
    expect(m.findMany.mock.calls[0][0].where).toEqual({ id: -1 });
  });
  it('does not let teachers create classes', async () => {
    expect((await POST(req())).status).toBe(403);
  });
  it('requires authentication', async () => {
    m.auth.mockResolvedValue(null);
    expect((await GET(req())).status).toBe(401);
    expect(m.findMany).not.toHaveBeenCalled();
  });
  it.each(['?page=-1', '?limit=101', '?limit=1oops', '?page=10001'])('rejects invalid pagination %s', async query => {
    expect((await GET(req(query))).status).toBe(400);
    expect(m.findMany).not.toHaveBeenCalled();
  });
});
