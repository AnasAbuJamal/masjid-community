// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
const m = vi.hoisted(() => ({ auth: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn() }));
vi.mock('@/lib/auth', () => ({ auth: m.auth }));
vi.mock('@/lib/prisma', () => ({ default: { studentReport: { findMany: m.findMany, create: m.create }, student: { findFirst: m.findFirst } } }));
import { GET, POST } from './route';
const request = () => new NextRequest('https://example.com/api/student-reports', { method: 'POST', body: JSON.stringify({ studentId: 9, title: 'Progress', content: 'Report' }) });
beforeEach(() => { vi.resetAllMocks(); m.findMany.mockResolvedValue([]); });
describe('report permissions', () => {
 it('blocks unauthenticated report reads', async () => {
  m.auth.mockResolvedValue(null);
  expect((await GET(request())).status).toBe(401);
  expect(m.findMany).not.toHaveBeenCalled();
 });
 it('scopes teacher reads to assigned class students', async () => {
  m.auth.mockResolvedValue({ user: { id: 7, role: 'teacher' } });
  await GET(request());
  expect(m.findMany.mock.calls[0][0].where).toEqual({ student: { class: { teacherId: 7 } } });
 });
 it.each(['member','student'])('prevents %s from creating reports', async role => {
  m.auth.mockResolvedValue({ user: { id: 7, role } });
  expect((await POST(request())).status).toBe(403);
  expect(m.create).not.toHaveBeenCalled();
 });
 it.each([
  { studentId: true, title: 'Progress', content: 'Report' },
  { studentId: 9, title: ' ', content: 'Report' },
  { studentId: 9, title: 'Progress', content: 'Report', teacherId: 99 },
  { studentId: 9, title: 'Progress', content: 'Report', category: 'unknown' },
 ])('rejects invalid report inputs before querying a student (%#)', async body => {
  m.auth.mockResolvedValue({ user: { id: 7, role: 'teacher' } });
  expect((await POST(new NextRequest('https://example.com', { method: 'POST', body: JSON.stringify(body) }))).status).toBe(400);
  expect(m.findFirst).not.toHaveBeenCalled();
  expect(m.create).not.toHaveBeenCalled();
 });
 it('blocks teachers writing reports outside their class' , async () => {
  m.auth.mockResolvedValue({ user: { id: 7, role: 'teacher' } });
  m.findFirst.mockResolvedValue(null);
  expect((await POST(request())).status).toBe(404);
  expect(m.create).not.toHaveBeenCalled();
 });
});
