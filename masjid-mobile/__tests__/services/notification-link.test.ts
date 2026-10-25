import { describe, it, expect } from 'vitest';
import { notificationDestination } from '../../services/notification-link';
describe('notification destinations', () => {
  it('opens the linked record instead of treating notification ID as record ID', () => {
    expect(notificationDestination('/jobs/73')).toBe('/jobs/73');
    expect(notificationDestination('/proposals/19')).toBe('/proposals/19');
  });
  it('rejects external URLs, admin pages, malformed IDs and missing destinations', () => {
    for (const value of [null, '', 'https://example.com', '//example.com', '/admin/users', '/dashboard/jobs', '/jobs/../admin', '/jobs/3?redirect=evil']) {
      expect(notificationDestination(value)).toBeNull();
    }
  });
});
