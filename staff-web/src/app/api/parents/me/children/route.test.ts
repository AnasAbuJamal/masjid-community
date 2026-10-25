// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
const m = vi.hoisted(() => ({ auth: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() }));
vi.mock('@/lib/auth', () => ({ auth: m.auth }));
vi.mock('@/lib/prisma', () => ({ default: { student: { findMany: m.findMany }, user: { findUnique: m.findUnique } } }));
import { GET } from './route';
beforeEach(() => { vi.resetAllMocks(); m.auth.mockResolvedValue({ user: { id: 7, email: 'parent@example.com' } }); m.findUnique.mockResolvedValue({ isVerified: true }); m.findMany.mockResolvedValue([]); });
describe('family record access', () => {
 it('requires authentication and verified account before querying students', async () => {
  m.auth.mockResolvedValue(null);
  expect((await GET()).status).toBe(401);
  m.auth.mockResolvedValue({ user: { id: 7, email: 'parent@example.com' } });
  m.findUnique.mockResolvedValue({ isVerified: false });
  expect((await GET()).status).toBe(403);
  expect(m.findMany).not.toHaveBeenCalled();
 });
 it('uses the signed-in parent identity and excludes unrelated students', async () => {
  const response = await GET();
  expect(m.findMany.mock.calls[0][0].where).toEqual({ parentEmail: { equals: 'parent@example.com', mode: 'insensitive' }, isActive: true });
  expect(response.headers.get('Cache-Control')).toBe('no-store');
  expect(await response.json()).toEqual({ children: [] });
 });
 it('returns persisted attendance and reports with stable string IDs', async () => {
  m.findMany.mockResolvedValue([{ id: 12, firstName: 'Child', lastName: 'One', attendances: [{ id: 4, status: 'late' }], reports: [{ id: 8, title: 'Progress' }] }]);
  const body = await (await GET()).json();
  expect(body.children[0]).toMatchObject({ id: '12', attendances: [{ id: '4', status: 'late' }], reports: [{ id: '8', title: 'Progress' }] });
 });
});
