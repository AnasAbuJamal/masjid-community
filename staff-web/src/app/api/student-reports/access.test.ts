// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
const m = vi.hoisted(() => ({ transaction: vi.fn(), auth: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn() }));
vi.mock('@/lib/auth', () => ({ auth: m.auth }));
vi.mock('@/lib/prisma', () => ({ default: { $transaction: m.transaction, studentReport: { findMany: m.findMany, create: m.create }, student: { findFirst: m.findFirst } } }));
import { GET, POST } from './route';
const request = () => new NextRequest('https://example.com/api/student-reports', { method: 'POST', body: JSON.stringify({ studentId: 9, title: 'Progress', content: 'Report' }) });
beforeEach(() => { vi.resetAllMocks(); m.findMany.mockResolvedValue([]); m.transaction.mockImplementation(callback => callback({ student: { findFirst: m.findFirst }, studentReport: { create: m.create } })); });
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
 it('checks active class access and writes using the same transaction', async () => {
  m.auth.mockResolvedValue({ user: { id: 7, role: 'teacher' } });
  m.findFirst.mockResolvedValue({ id: 9 });
  m.create.mockResolvedValue({ id: 12 });
  expect((await POST(request())).status).toBe(201);
  expect(m.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
  expect(m.findFirst).toHaveBeenCalledWith({
   where: { AND: [{ id: 9, isActive: true }, { class: { teacherId: 7 } }] },
   select: { id: true },
  });
  expect(m.create).toHaveBeenCalledWith({
   data: { studentId: 9, teacherId: 7, title: 'Progress', content: 'Report', category: 'general' },
  });
 });
 it('returns a conflict without silently retrying a report create', async () => {
  m.auth.mockResolvedValue({ user: { id: 7, role: 'teacher' } });
  m.transaction.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Conflict', { code: 'P2034', clientVersion: '5' }));
  expect((await POST(request())).status).toBe(409);
  expect(m.transaction).toHaveBeenCalledTimes(1);
 });

});
