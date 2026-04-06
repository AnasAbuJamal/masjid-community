import { describe, it, expect, vi } from 'vitest';
import { canAccess, navItems } from '../lib/role-config';

describe('role-config', () => {
  describe('canAccess', () => {
    it('allows admin to access admin routes', () => {
      expect(canAccess('admin', ['admin'])).toBe(true);
      expect(canAccess('admin', ['admin', 'teacher'])).toBe(true);
    });

    it('allows teacher to access teacher routes', () => {
      expect(canAccess('teacher', ['teacher'])).toBe(true);
      expect(canAccess('teacher', ['admin', 'teacher'])).toBe(true);
    });

    it('denies teacher access to admin-only routes', () => {
      expect(canAccess('teacher', ['admin'])).toBe(false);
    });

    it('denies admin access to teacher-only routes', () => {
      expect(canAccess('admin', ['teacher'])).toBe(false);
    });

    it('handles empty roles array', () => {
      expect(canAccess('admin', [])).toBe(false);
      expect(canAccess('teacher', [])).toBe(false);
    });
  });

  describe('navItems', () => {
    it('dashboard is accessible by both roles', () => {
      const dashboard = navItems.find(
        (item: { title: string }) => item.title === 'Dashboard'
      );
      expect(dashboard?.roles).toContain('admin');
      expect(dashboard?.roles).toContain('teacher');
    });

    it('user management is admin only', () => {
      const users = navItems.find(
        (item: { title: string }) => item.title === 'User Management'
      );
      expect(users?.roles).toEqual(['admin']);
    });

    it('prayer times is admin only', () => {
      const prayers = navItems.find(
        (item: { title: string }) => item.title === 'Prayer Times'
      );
      expect(prayers?.roles).toEqual(['admin']);
    });

    it('classroom is accessible by teacher', () => {
      const classroom = navItems.find(
        (item: { title: string }) => item.title === 'Classroom'
      );
      expect(classroom?.roles).toContain('teacher');
    });
  });
});
