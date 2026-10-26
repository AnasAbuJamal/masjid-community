// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const m = vi.hoisted(() => ({ auth: vi.fn(), update: vi.fn(), audit: vi.fn() }));
vi.mock('@/lib/auth', () => ({ auth: m.auth }));
vi.mock('@/lib/prisma', () => ({ default: { studentReport: { updateMany: m.update } } }));
vi.mock('@/lib/audit', () => ({ logAudit: m.audit, getClientIp: vi.fn() }));
import { PUT } from './route';
const input = { title: 'Progress', content: 'Updated report', category: 'academic', expectedUpdatedAt: '2026-10-26T12:00:00.000Z' };
const req = (body: unknown = input) => new NextRequest('https://example.com', { method: 'PUT', body: JSON.stringify(body) });
const params = { params: Promise.resolve({ id: '9' }) };
beforeEach(() => { vi.resetAllMocks(); m.auth.mockResolvedValue({ user: { id: 7, role: 'teacher' } }); m.update.mockResolvedValue({ count: 1 }); });
describe('report editing', () => {
 it('requires authentication', async () => { m.auth.mockResolvedValue(null); expect((await PUT(req(), params)).status).toBe(401); expect(m.update).not.toHaveBeenCalled(); });
 it.each(['student', 'member'])('prevents %s report edits', async role => {
  m.auth.mockResolvedValue({ user: { id: 7, role } });
  expect((await PUT(req(), params)).status).toBe(403); expect(m.update).not.toHaveBeenCalled();
 });
 it.each([{ ...input, studentId: 10 }, { ...input, teacherId: 8 }, { ...input, title: ' ' }, { ...input, expectedUpdatedAt: undefined }, { ...input, expectedUpdatedAt: 'bad' }])('rejects invalid fields/ownership/version (%#)', async body => {
  expect((await PUT(req(body), params)).status).toBe(400); expect(m.update).not.toHaveBeenCalled();
 });
 it('checks scope and original version in the same write and preserves author', async () => {
  expect((await PUT(req(), params)).status).toBe(200);
  expect(m.update).toHaveBeenCalledWith({ where: { id: 9, updatedAt: new Date(input.expectedUpdatedAt), student: { class: { teacherId: 7 } } }, data: { title: input.title, content: input.content, category: input.category } });
  expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ userId: 7, entityId: '9', action: 'update_student_report' }));
 });
 it('refuses stale or inaccessible reports without claiming success', async () => {
  m.update.mockResolvedValue({ count: 0 });
  expect((await PUT(req(), params)).status).toBe(409); expect(m.audit).not.toHaveBeenCalled();
 });
});
