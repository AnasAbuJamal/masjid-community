import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logAudit, getClientIp } from '../lib/audit';

vi.mock('@/lib/prisma', () => ({
  default: {
    auditLog: {
      create: vi.fn(),
    },
  },
}));

import prisma from '../lib/prisma';

describe('audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logAudit', () => {
    it('creates audit log entry', async () => {
      vi.mocked(prisma.auditLog.create).mockResolvedValue({
        id: '1',
        action: 'test_action',
        userId: 'user123',
        email: 'test@example.com',
        details: 'Test details',
        ipAddress: '192.168.1.1',
        success: true,
        createdAt: new Date(),
      });

      await logAudit({
        action: 'test_action',
        userId: 'user123',
        email: 'test@example.com',
        details: 'Test details',
        ipAddress: '192.168.1.1',
        success: true,
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'test_action',
          userId: 'user123',
          email: 'test@example.com',
          details: 'Test details',
          ipAddress: '192.168.1.1',
          success: true,
        },
      });
    });

    it('handles optional fields', async () => {
      vi.mocked(prisma.auditLog.create).mockResolvedValue({
        id: '1',
        action: 'test_action',
        userId: undefined,
        email: undefined,
        details: undefined,
        ipAddress: undefined,
        success: true,
        createdAt: new Date(),
      });

      await logAudit({ action: 'test_action' });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'test_action',
          userId: undefined,
          email: undefined,
          details: undefined,
          ipAddress: undefined,
          success: true,
        },
      });
    });

    it('defaults success to true', async () => {
      vi.mocked(prisma.auditLog.create).mockResolvedValue({
        id: '1',
        action: 'test_action',
        success: true,
        createdAt: new Date(),
      } as never);

      await logAudit({ action: 'test_action' });

      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ success: true }),
        })
      );
    });

    it('does not throw on database error', async () => {
      vi.mocked(prisma.auditLog.create).mockRejectedValue(new Error('DB error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(logAudit({ action: 'test_action' })).resolves.not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('getClientIp', () => {
    it('extracts IP from x-forwarded-for', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
      });

      expect(getClientIp(req)).toBe('192.168.1.1');
    });

    it('extracts IP from x-real-ip', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-real-ip': '192.168.1.100' },
      });

      expect(getClientIp(req)).toBe('192.168.1.100');
    });

    it('returns unknown when no headers', () => {
      const req = new Request('http://localhost');

      expect(getClientIp(req)).toBe('unknown');
    });

    it('prefers x-forwarded-for over x-real-ip', () => {
      const req = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'x-real-ip': '192.168.1.100',
        },
      });

      expect(getClientIp(req)).toBe('192.168.1.1');
    });
  });
});
