// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
vi.mock('next/headers', () => ({ headers: vi.fn() }));
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ default: { user: { findUnique: vi.fn() } } }));
import { headers } from 'next/headers';
import { getServerSession } from 'next-auth';
import prisma from './prisma';
import { auth } from './auth';
import { issueMobileToken } from './mobile-token';

describe('database-aware sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('AUTH_SECRET', 'test-only-secret');
    vi.mocked(headers).mockResolvedValue(new Headers() as Awaited<ReturnType<typeof headers>>);
    vi.mocked(getServerSession).mockResolvedValue(null);
  });
  afterEach(() => vi.unstubAllEnvs());
  it('requires authentication before querying private user data', async () => {
    expect(await auth()).toBeNull();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
  it('rejects a forged bearer even if a cookie session exists', async () => {
    vi.mocked(headers).mockResolvedValue(new Headers({ authorization: 'Bearer forged' }) as Awaited<ReturnType<typeof headers>>);
    expect(await auth()).toBeNull();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
  it('resolves a signed mobile token to the current numeric ID and role', async () => {
    const token = await issueMobileToken(42);
    vi.mocked(headers).mockResolvedValue(new Headers({ authorization: `Bearer ${token}` }) as Awaited<ReturnType<typeof headers>>);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 42, role: 'member', email: 'test@example.com', firstName: 'Test', lastName: 'Member', isActive: true } as never);
    expect((await auth())?.user).toMatchObject({ id: 42, role: 'member' });
    expect(prisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 42 } }));
  });
  it('revokes access for a deactivated account', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: '42', role: 'admin' }, expires: '2030-01-01' });
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 42, isActive: false } as never);
    expect(await auth()).toBeNull();
  });
});
