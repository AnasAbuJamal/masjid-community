// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const m = vi.hoisted(() => ({ auth: vi.fn(), transaction: vi.fn(), student: vi.fn(), records: vi.fn(), groups: vi.fn() }));
vi.mock('@/lib/auth', () => ({ auth: m.auth }));
vi.mock('@/lib/prisma', () => ({ default: { $transaction: m.transaction } }));
import { GET } from './route';
const request = (query = '') => new NextRequest(`https://example.com/api/students/me/attendance${query}`);
beforeEach(() => {
  vi.resetAllMocks();
  m.auth.mockResolvedValue({ user: { id: 42, role: 'student' } });
  m.transaction.mockImplementation(callback => callback({ student: { findFirst: m.student }, attendance: { findMany: m.records, groupBy: m.groups } }));
  m.student.mockResolvedValue({ id: 7, firstName: 'Student', lastName: 'One', class: { name: 'Arabic' } });
  m.records.mockResolvedValue([{ id: 9, date: new Date('2026-10-26T00:00:00Z'), status: 'late', class: { name: 'Arabic' } }]);
  m.groups.mockResolvedValue([{ status: 'present', _count: { _all: 31 } }, { status: 'late', _count: { _all: 1 } }]);
});
describe('own attendance', () => {
  it('requires authentication', async () => {
    m.auth.mockResolvedValue(null);
    expect((await GET(request())).status).toBe(401);
    expect(m.transaction).not.toHaveBeenCalled();
  });
  it.each(['member', 'teacher', 'staff', 'admin'])('rejects %s accounts from the student-only endpoint', async role => {
    m.auth.mockResolvedValue({ user: { id: 42, role } });
    expect((await GET(request())).status).toBe(403);
    expect(m.transaction).not.toHaveBeenCalled();
  });
  it.each(['?studentId=8', '?userId=8', '?page=0', '?page=1.5', '?page=10001', '?page=abc'])('rejects invalid query or caller identity %s', async query => {
    expect((await GET(request(query))).status).toBe(400);
    expect(m.transaction).not.toHaveBeenCalled();
  });
  it('uses only the authenticated account and returns limited fields', async () => {
    const response = await GET(request('?page=2'));
    expect(m.student.mock.calls[0][0].where).toEqual({ userId: 42, isActive: true });
    expect(m.records.mock.calls[0][0]).toMatchObject({ where: { studentId: 7 }, skip: 30, take: 30, orderBy: [{ date: 'desc' }, { id: 'desc' }] });
    expect(m.records.mock.calls[0][0].select).toEqual({ id: true, date: true, status: true, class: { select: { name: true } } });
    expect(m.groups.mock.calls[0][0].where).toEqual({ studentId: 7 });
    expect(m.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'RepeatableRead' });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toMatchObject({ student: { id: '7' }, records: [{ id: '9', status: 'late' }], summary: { present: 31, absent: 0, late: 1, excused: 0, total: 32 }, page: 2, totalPages: 2 });
  });
  it('does not query attendance without an active account link', async () => {
    m.student.mockResolvedValue(null);
    expect(await (await GET(request())).json()).toEqual({ student: null, records: [], summary: null, page: 1, totalPages: 0 });
    expect(m.records).not.toHaveBeenCalled();
    expect(m.groups).not.toHaveBeenCalled();
  });
  it('represents no recorded attendance without invented absences', async () => {
    m.records.mockResolvedValue([]); m.groups.mockResolvedValue([]);
    expect(await (await GET(request())).json()).toMatchObject({ summary: { present: 0, absent: 0, late: 0, excused: 0, total: 0 }, totalPages: 0 });
  });
  it('returns an error rather than a fabricated empty history on database failure', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    m.transaction.mockRejectedValue(new Error('unavailable'));
    expect((await GET(request())).status).toBe(500);
    log.mockRestore();
  });
});
