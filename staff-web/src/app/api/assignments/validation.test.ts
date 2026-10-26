// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
const m = vi.hoisted(() => ({ auth: vi.fn(), transaction: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(), findMany: vi.fn(), count: vi.fn() }));
vi.mock('@/lib/auth', () => ({ auth: m.auth }));
vi.mock('@/lib/prisma', () => ({ default: { $transaction: m.transaction, assignment: { update: m.update, delete: m.remove, findMany: m.findMany, count: m.count } } }));
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(), getClientIp: vi.fn() }));
import { GET, POST } from './route';
import { PUT, DELETE } from './[id]/route';
const payload = { studentId: '9', date: '2026-10-26', type: 'review', location: 'home', description: 'Review lesson one', status: 'pending', rating: 'none' };
const request = (body: unknown, method = 'POST') => new NextRequest('https://example.com/api/assignments', { method, body: JSON.stringify(body) });
const params = { params: Promise.resolve({ id: '4' }) };
beforeEach(() => {
 vi.resetAllMocks(); m.auth.mockResolvedValue({ user: { id: 7, role: 'teacher' } });
 m.transaction.mockImplementation(callback => callback({ assignment: { create: m.create } }));
 m.create.mockResolvedValue({ id: 4 }); m.update.mockResolvedValue({ id: 4 });
 m.findMany.mockResolvedValue([]); m.count.mockResolvedValue(0);
});
describe('assignment input and ownership', () => {
 it('requires sign-in', async () => {
  m.auth.mockResolvedValue(null);
  expect((await POST(request(payload))).status).toBe(401);
  expect(m.transaction).not.toHaveBeenCalled();
 });
 it.each(['student','member'])('denies %s writes', async role => {
  m.auth.mockResolvedValue({ user: { id: 7, role } });
  expect((await POST(request(payload))).status).toBe(403);
  expect((await PUT(request({ rating: 'excellent' }, 'PUT'), params)).status).toBe(403);
  expect((await DELETE(new NextRequest('https://example.com'), params)).status).toBe(403);
 });
 it.each([
  null, { ...payload, date: '2026-02-30' }, { ...payload, description: ' ' }, { ...payload, description: 'x'.repeat(10001) },
  { ...payload, studentId: true }, { ...payload, type: 'other' }, { ...payload, rating: 'A' },
  { ...payload, teacherId: 8 }, { ...payload, student: { connect: { id: 8 } } }, { ...payload, createdAt: '2026-01-01' },
 ])('rejects invalid or privileged fields (%#)', async body => {
  expect((await POST(request(body))).status).toBe(400);
  expect(m.transaction).not.toHaveBeenCalled();
 });
 it('handles malformed JSON', async () => {
  expect((await POST(new NextRequest('https://example.com', { method: 'POST', body: '{' }))).status).toBe(400);
 });
 it('connects only an active authorized student and uses the session teacher', async () => {
  expect((await POST(request(payload))).status).toBe(201);
  expect(m.create.mock.calls[0][0].data).toMatchObject({ student: { connect: { id: 9, AND: [{ class: { teacherId: 7 } }, { isActive: true }] } }, teacher: { connect: { id: 7 } }, date: new Date('2026-10-26T00:00:00Z') });
  expect(m.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
 });
 it.each([['P2025',404],['P2034',409]] as const)('returns a controlled %s response', async (code, status) => {
  m.transaction.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('failed', { code, clientVersion: '5' }));
  expect((await POST(request(payload))).status).toBe(status);
 });
 it.each([{ studentId: 8 }, { teacherId: 8 }, {}, { rating: 'unrecognized' }])('rejects immutable/empty/invalid updates (%#)', async body => {
  expect((await PUT(request(body, 'PUT'), params)).status).toBe(400);
  expect(m.update).not.toHaveBeenCalled();
 });
 it('scopes status/rating updates to the current authorized student relationship', async () => {
  expect((await PUT(request({ status: 'completed', rating: 'excellent' }, 'PUT'), params)).status).toBe(200);
  expect(m.update).toHaveBeenCalledWith({ where: { id: 4, student: { class: { teacherId: 7 } } }, data: { status: 'completed', rating: 'excellent' } });
 });
 it('returns not found when deletion is outside scope', async () => {
  m.remove.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('missing', { code: 'P2025', clientVersion: '5' }));
  expect((await DELETE(new NextRequest('https://example.com'), params)).status).toBe(404);
  expect(m.remove).toHaveBeenCalledWith({ where: { id: 4, student: { class: { teacherId: 7 } } } });
 });
 it.each(['?limit=101','?page=-1','?studentId=abc','?teacherId=2oops'])('rejects invalid filters %s', async query => {
  expect((await GET(new NextRequest(`https://example.com${query}`))).status).toBe(400);
  expect(m.findMany).not.toHaveBeenCalled();
 });
 it('keeps read filters within the student scope', async () => {
  m.auth.mockResolvedValue({ user: { id: 7, role: 'student' } });
  const response = await GET(new NextRequest('https://example.com?studentId=9'));
  expect(m.findMany.mock.calls[0][0].where).toEqual({ student: { userId: 7 }, studentId: 9 });
  expect(response.headers.get('Cache-Control')).toBe('no-store');
 });
});
