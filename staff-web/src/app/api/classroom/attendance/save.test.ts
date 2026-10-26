// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
const m = vi.hoisted(() => ({
 auth: vi.fn(), transaction: vi.fn(),
 tx: { class: { findFirst: vi.fn() }, student: { count: vi.fn(), update: vi.fn() },
 attendance: { findFirst: vi.fn(), upsert: vi.fn(), findMany: vi.fn() } },
}));
vi.mock('@/lib/auth', () => ({ auth: m.auth }));
vi.mock('@/lib/prisma', () => ({ default: { $transaction: m.transaction } }));
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(), getClientIp: vi.fn() }));
import { POST, GET } from './route';
const payload = { classId: '2', date: '2026-10-26', records: [{ studentId: '7', status: 'absent' }] };
const request = (body: unknown) => new NextRequest('https://example.com/api/classroom/attendance', { method: 'POST', body: JSON.stringify(body) });
beforeEach(() => {
 vi.resetAllMocks();
 m.auth.mockResolvedValue({ user: { id: 3, role: 'teacher' } });
 m.transaction.mockImplementation(callback => callback(m.tx));
 m.tx.class.findFirst.mockResolvedValue({ id: 2 });
 m.tx.student.count.mockResolvedValue(1);
 m.tx.attendance.findFirst.mockResolvedValue(null);
 m.tx.attendance.upsert.mockResolvedValue({ id: 11 });
 m.tx.attendance.findMany.mockResolvedValue([{ status: 'absent' }]);
});
describe('attendance writes', () => {
 it('scopes the teacher and updates derived rates inside the transaction', async () => {
  expect((await POST(request(payload))).status).toBe(200);
  expect(m.tx.class.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { AND: [{ id: 2 }, { teacherId: 3 }] } }));
  expect(m.transaction).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({ isolationLevel: 'Serializable' }));
  expect(m.tx.attendance.upsert.mock.calls[0][0].where.studentId_date).toEqual({ studentId: 7, date: new Date('2026-10-26T00:00:00Z') });
  expect(m.tx.student.update).toHaveBeenCalledWith({ where: { id: 7 }, data: { attendanceRate: 0, attendanceStatus: 'poor' } });
 });
 it('rejects an unassigned class before writes', async () => {
  m.tx.class.findFirst.mockResolvedValue(null);
  expect((await POST(request(payload))).status).toBe(404);
  expect(m.tx.attendance.upsert).not.toHaveBeenCalled();
 });
 it('rejects a student outside the active roster', async () => {
  m.tx.student.count.mockResolvedValue(0);
  expect((await POST(request(payload))).status).toBe(400);
  expect(m.tx.attendance.upsert).not.toHaveBeenCalled();
 });
 it('does not overwrite a transferred student’s record from another class', async () => {
  m.tx.attendance.findFirst.mockResolvedValue({ id: 9 });
  expect((await POST(request(payload))).status).toBe(409);
  expect(m.tx.attendance.upsert).not.toHaveBeenCalled();
 });
 it.each([
  { ...payload, date: '2026-02-30' }, { ...payload, date: '2026-10-26T23:00:00-05:00' },
  { ...payload, records: [...payload.records, ...payload.records] },
  { ...payload, records: [{ studentId: true, status: 'present' }] },
  { ...payload, records: [{ studentId: 7, status: 'unknown' }] },
  { ...payload, records: [{ studentId: 7 }] }, { ...payload, records: [] }, null,
 ])('rejects malformed attendance before opening a transaction: %j', async input => {
  expect((await POST(request(input))).status).toBe(400);
  expect(m.transaction).not.toHaveBeenCalled();
 });
 it('handles malformed JSON', async () => {
  expect((await POST(new NextRequest('https://example.com', { method: 'POST', body: '{' }))).status).toBe(400);
 });
 it('retries serialization conflicts with a bounded limit', async () => {
  m.transaction.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Conflict', { code: 'P2034', clientVersion: '5' }));
  expect((await POST(request(payload))).status).toBe(409);
  expect(m.transaction).toHaveBeenCalledTimes(3);
 });
 it('rechecks authorization when retrying', async () => {
  m.transaction.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError('Conflict', { code: 'P2034', clientVersion: '5' }));
  m.tx.class.findFirst.mockResolvedValue(null);
  expect((await POST(request(payload))).status).toBe(404);
 });
 it('supports individual corrections with rate recalculation', async () => {
  expect((await POST(request({ classId: 2, date: payload.date, studentId: 7, status: 'absent' }))).status).toBe(200);
  expect(m.tx.student.update).toHaveBeenCalledTimes(1);
 });
 it.each(['page=-1', 'limit=501', 'classId=2oops', 'date=2026-02-30', 'dateFrom=2026-11-01&dateTo=2026-10-01'])('rejects invalid read filters %s', async query => {
  expect((await GET(new NextRequest(`https://example.com?${query}`))).status).toBe(400);
 });
});
