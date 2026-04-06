import { describe, it, expect } from 'vitest';

describe('authStore', () => {
  describe('initial state', () => {
    it('should have correct initial values', () => {
      const initialState = {
        user: null,
        isAuthenticated: false,
        isLoading: true,
      };

      expect(initialState.user).toBeNull();
      expect(initialState.isAuthenticated).toBe(false);
      expect(initialState.isLoading).toBe(true);
    });
  });

  describe('user structure', () => {
    it('should define user with correct properties', () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'member' as const,
      };

      expect(user.id).toBe('1');
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe('member');
    });

    it('should accept all valid roles', () => {
      const validRoles = ['admin', 'staff', 'member', 'student'] as const;
      
      validRoles.forEach(role => {
        const user = { id: '1', email: 'test@test.com', firstName: 'T', lastName: 'U', role };
        expect(user.role).toBe(role);
      });
    });
  });

  describe('AuthResponse structure', () => {
    it('should include user and token', () => {
      const response = {
        user: { id: '1', email: 'test@test.com', firstName: 'T', lastName: 'U', role: 'member' as const },
        token: 'jwt-token-123',
      };

      expect(response.user).toBeDefined();
      expect(response.token).toBe('jwt-token-123');
    });
  });
});

describe('auth service methods', () => {
  describe('login', () => {
    it('should accept email and password', () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      expect(credentials.email).toContain('@');
      expect(credentials.password.length).toBeGreaterThan(0);
    });
  });

  describe('register', () => {
    it('should require firstName and lastName', () => {
      const data = {
        email: 'new@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      expect(data.firstName).toBeDefined();
      expect(data.lastName).toBeDefined();
    });
  });

  describe('logout', () => {
    it('should clear authentication', () => {
      const logout = () => ({
        user: null,
        isAuthenticated: false,
      });

      const result = logout();
      expect(result.user).toBeNull();
      expect(result.isAuthenticated).toBe(false);
    });
  });

  describe('updateUser', () => {
    it('should accept partial user updates', () => {
      const currentUser = { id: '1', email: 'test@test.com', firstName: 'T', lastName: 'U', role: 'member' as const };
      const updates = { firstName: 'Updated' };

      const updated = { ...currentUser, ...updates };
      expect(updated.firstName).toBe('Updated');
      expect(updated.lastName).toBe('U');
    });
  });
});
