import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
  default: {
    AuthError: class extends Error {},
  },
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { getServerSession } from 'next-auth';
import prisma from '../lib/prisma';

describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getServerSession', () => {
    it('is mocked', () => {
      expect(getServerSession).toBeDefined();
    });
  });
});
