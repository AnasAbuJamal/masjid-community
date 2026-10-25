// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
const m = vi.hoisted(() => ({ auth: vi.fn(), findFirst: vi.fn(), upsert: vi.fn(), count: vi.fn(), create: vi.fn() }));
vi.mock('@/lib/auth', () => ({ auth: m.auth }));
vi.mock('@/lib/prisma', () => ({ default: { projectProposal: { findFirst: m.findFirst }, proposalVote: { upsert: m.upsert, count: m.count }, proposalComment: { create: m.create } } }));
import { POST as vote } from './[id]/vote/route';
import { POST as comment } from './[id]/comments/route';
import { GET as detail } from './[id]/route';
const req = (body = {}) => new NextRequest('https://example.com/api/public/proposals/9', { method: 'POST', body: JSON.stringify(body) });
const context = { params: Promise.resolve({ id: '9' }) };
beforeEach(() => { vi.resetAllMocks(); m.auth.mockResolvedValue({ user: { id: 7, role: 'member', name: 'Member' } }); m.findFirst.mockResolvedValue({ id: 9 }); m.count.mockResolvedValue(1); m.create.mockResolvedValue({ id: 2 }); });
describe('persisted proposal flows', () => {
 it('requires authentication for voting and commenting', async () => {
   m.auth.mockResolvedValue(null);
   expect((await vote(req(), context)).status).toBe(401);
   expect((await comment(req(), context)).status).toBe(401);
   expect(m.upsert).not.toHaveBeenCalled();
 });
 it('uses a unique voter/proposal identity and idempotent upsert', async () => {
   await vote(req({ userId: 99 }), context);
   expect(m.upsert).toHaveBeenCalledWith({ where: { proposalId_userId: { proposalId: 9, userId: 7 } }, update: {}, create: { proposalId: 9, userId: 7 } });
 });
 it('rejects hidden/missing proposals without writes', async () => {
   m.findFirst.mockResolvedValue(null);
   expect((await vote(req(), context)).status).toBe(404);
   expect((await comment(req({ message: 'Hello' }), context)).status).toBe(404);
   expect(m.create).not.toHaveBeenCalled();
 });
 it('derives comment authorship and visibility on the server', async () => {
   expect((await comment(req({ message: 'Useful idea', authorName: 'Admin', isInternal: true }), context)).status).toBe(201);
   expect(m.create).toHaveBeenCalledWith({ data: { proposalId: 9, authorName: 'Member', authorRole: 'member', message: 'Useful idea', isInternal: false } });
 });
 it('excludes internal comments and sensitive fields from public detail queries', async () => {
   m.findFirst.mockResolvedValue(null);
   await detail(req(), context);
   const query = m.findFirst.mock.calls[0][0];
   expect(query.select.comments.where).toEqual({ isInternal: false });
   expect(query.select).not.toHaveProperty('submitterEmail');
   expect(query.select).not.toHaveProperty('adminNotes');
 });
});
