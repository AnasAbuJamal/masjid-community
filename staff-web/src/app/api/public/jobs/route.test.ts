// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({
  auth: vi.fn(), transaction: vi.fn(), findJob: vi.fn(), findApplication: vi.fn(), create: vi.fn(), notify: vi.fn(),
}));
vi.mock('@/lib/auth', () => ({ auth: mocks.auth }));
vi.mock('@/lib/prisma', () => ({ default: { $transaction: mocks.transaction } }));
vi.mock('@/lib/email', () => ({ shouldNotify: mocks.notify, getNotificationEmails: vi.fn(), sendEmail: vi.fn() }));
import { POST } from './route';
const request = (overrides = {}) => new NextRequest('https://example.com/api/public/jobs', {
  method: 'POST', body: JSON.stringify({ jobId: '7', coverLetter: 'My relevant skills and experience make me well suited for this role.', ...overrides }),
});
beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ user: { email: 'Member@Example.com', name: 'Member' } });
  mocks.findJob.mockResolvedValue({ id: 7, title: 'Teacher', status: 'active', expiresAt: null });
  mocks.findApplication.mockResolvedValue(null);
  mocks.create.mockResolvedValue({ id: 18 });
  mocks.transaction.mockImplementation(callback => callback({ jobPosting: { findUnique: mocks.findJob }, jobApplication: { findFirst: mocks.findApplication, create: mocks.create } }));
  mocks.notify.mockResolvedValue(false);
});
describe('job application API', () => {
  it('requires a session before accessing applicant data', async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await POST(request())).status).toBe(401);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it('uses session identity and ignores forged applicant and review fields', async () => {
    expect((await POST(request({ applicantEmail: 'victim@example.com', status: 'hired', workerProfileId: 44 }))).status).toBe(201);
    expect(mocks.create).toHaveBeenCalledWith({ data: expect.objectContaining({ applicantEmail: 'member@example.com', applicantName: 'Member', status: 'submitted' }) });
    expect(mocks.create.mock.calls[0][0].data).not.toHaveProperty('workerProfileId');
  });
  it('rejects duplicate applications without writing', async () => {
    mocks.findApplication.mockResolvedValue({ id: 3 });
    expect((await POST(request())).status).toBe(409);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it('rejects expired jobs and invalid input', async () => {
    mocks.findJob.mockResolvedValue({ status: 'active', expiresAt: new Date(0) });
    expect((await POST(request())).status).toBe(409);
    expect((await POST(request({ coverLetter: '' }))).status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it('still confirms a committed application when email fails', async () => {
    mocks.notify.mockRejectedValue(new Error('Provider unavailable'));
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await POST(request())).status).toBe(201);
    expect(mocks.create).toHaveBeenCalledTimes(1);
    log.mockRestore();
  });
});
