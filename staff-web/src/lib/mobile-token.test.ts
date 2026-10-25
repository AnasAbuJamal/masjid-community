// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { encode } from 'next-auth/jwt';
import { issueMobileToken, verifyMobileToken } from './mobile-token';

describe('mobile access tokens', () => {
  beforeEach(() => vi.stubEnv('AUTH_SECRET', 'test-only-secret-that-is-not-used-for-deployment'));
  afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });
  it('issues a verifiable, expiring token for the database user ID', async () => {
    const token = await issueMobileToken(42);
    const payload = await verifyMobileToken(token);
    expect(payload?.sub).toBe('42');
    expect(Number(payload?.exp) - Number(payload?.iat)).toBe(1800);
  });
  it('rejects the old unsigned base64 format', async () => {
    expect(await verifyMobileToken(Buffer.from('1:admin@example.com:123').toString('base64'))).toBeNull();
  });
  it('rejects tampering and tokens from another secret', async () => {
    const token = await issueMobileToken(42);
    expect(await verifyMobileToken(token + 'x')).toBeNull();
    vi.stubEnv('AUTH_SECRET', 'a-different-secret');
    expect(await verifyMobileToken(token)).toBeNull();
  });
  it('rejects expired tokens', async () => {
    vi.useFakeTimers();
    const token = await issueMobileToken(42);
    vi.advanceTimersByTime(31 * 60 * 1000);
    expect(await verifyMobileToken(token)).toBeNull();
  });
  it('does not accept a web session token as a mobile token', async () => {
    const token = await encode({ secret: process.env.AUTH_SECRET!, token: { sub: '1' } });
    expect(await verifyMobileToken(token)).toBeNull();
  });
  it('requires configured signing credentials', async () => {
    vi.stubEnv('AUTH_SECRET', '');
    await expect(issueMobileToken(1)).rejects.toThrow('AUTH_SECRET');
  });
});
