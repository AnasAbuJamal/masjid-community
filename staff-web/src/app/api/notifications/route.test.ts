// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
const m = vi.hoisted(() => ({ auth: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn(), findMany: vi.fn(), count: vi.fn() }));
vi.mock('@/lib/auth', () => ({ auth: m.auth }));
vi.mock('@/lib/prisma', () => ({ default: { notification: m } }));
import { GET, POST, DELETE } from './route';
const req = (query = '') => new NextRequest(`https://example.com/api/notifications${query}`);
beforeEach(() => { vi.resetAllMocks(); m.auth.mockResolvedValue({ user: { id: 7 } }); m.updateMany.mockResolvedValue({ count: 0 }); m.deleteMany.mockResolvedValue({ count: 0 }); });
describe('notification boundaries', () => {
 it('rejects invalid delete IDs without deleting all records', async () => {
   for (const id of ['abc','0','-1','1.5','']) expect((await DELETE(req(`?id=${id}`))).status).toBe(400);
   expect(m.deleteMany).not.toHaveBeenCalled();
 });
 it('scopes deletion to the session and reports missing ownership as not found', async () => {
   expect((await DELETE(req('?id=22'))).status).toBe(404);
   expect(m.deleteMany).toHaveBeenCalledWith({ where: { id: 22, userId: 7 } });
 });
 it('rejects unbounded or malformed pagination', async () => {
   for (const query of ['?page=0','?limit=1000','?page=no','?limit=-1']) expect((await GET(req(query))).status).toBe(400);
   expect(m.findMany).not.toHaveBeenCalled();
 });
 it('marks only the session owner notifications read', async () => {
   const response = await POST(new NextRequest('https://example.com/api/notifications', { method: 'POST', body: JSON.stringify({ markAllRead: true }) }));
   expect(response.status).toBe(200);
   expect(m.updateMany).toHaveBeenCalledWith({ where: { userId: 7, isRead: false }, data: { isRead: true } });
 });
 it('rejects unauthenticated reads and writes', async () => {
   m.auth.mockResolvedValue(null);
   expect((await GET(req())).status).toBe(401);
   expect((await DELETE(req())).status).toBe(401);
   expect((await POST(req())).status).toBe(401);
 });
});
