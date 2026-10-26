// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const m = vi.hoisted(() => ({ identity: vi.fn(), classes: vi.fn(), attendance: vi.fn(), auth: vi.fn() }));
vi.mock('@/lib/api-identity', () => ({ getApiIdentity: m.identity }));
vi.mock('@/lib/auth', () => ({ auth: m.auth }));
vi.mock('@/lib/prisma', () => ({ default: { class: { findMany: m.classes }, attendance: { findMany: m.attendance } } }));
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn(), getClientIp: vi.fn() }));
import { GET } from './route';
import { POST as createClass } from '../../../classroom/classes/route';
import { PUT as updateClass } from '../../../classroom/classes/[id]/route';
import { POST as createStudent } from '../../../classroom/students/route';
const req = () => new NextRequest('https://example.com');
beforeEach(() => { vi.resetAllMocks(); m.classes.mockResolvedValue([]); m.attendance.mockResolvedValue([]); });
describe('trusted teacher account assignment', () => {
 it('uses account identity even when a teacher adopts another instructor name', async () => {
  m.identity.mockResolvedValue({ id: 7, role: 'teacher', firstName: 'Another', lastName: 'Instructor' });
  expect((await GET(req())).status).toBe(200);
  expect(m.classes.mock.calls[0][0].where).toEqual({ teacherId: 7 });
  expect(m.attendance.mock.calls[0][0].where.classId).toEqual({ in: [] });
 });
 it('retains administrator access to all classes', async () => {
  m.identity.mockResolvedValue({ id: 1, role: 'admin' });
  await GET(req()); expect(m.classes.mock.calls[0][0].where).toEqual({});
 });
 it.each(['member', 'student', 'staff'])('rejects %s at the teaching endpoint', async role => {
  m.identity.mockResolvedValue({ id: 7, role });
  expect((await GET(req())).status).toBe(403); expect(m.classes).not.toHaveBeenCalled();
 });
 it('requires authentication', async () => {
  m.identity.mockResolvedValue(null); expect((await GET(req())).status).toBe(401);
 });
 it.each(['teacher', 'member', 'student', 'staff'])('blocks %s changing account links through legacy roster writes', async role => {
  m.auth.mockResolvedValue({ user: { id: '7', role } });
  expect((await createClass(req())).status).toBe(403);
  expect((await updateClass(req(), { params: Promise.resolve({ id: '1' }) })).status).toBe(403);
  expect((await createStudent(req())).status).toBe(403);
 });
});
