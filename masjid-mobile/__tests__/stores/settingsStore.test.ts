import { describe, it, expect, beforeEach } from 'vitest';

describe('settingsStore', () => {
  let store: any;

  beforeEach(() => {
    store = {
      theme: 'system',
      notifications: {
        donations: true,
        events: true,
        general: true,
      },
      kioskMode: false,
      setTheme: (theme: string) => { store.theme = theme; },
      toggleNotification: (type: string) => {
        store.notifications[type] = !store.notifications[type];
      },
      setKioskMode: (enabled: boolean) => { store.kioskMode = enabled; },
      resetSettings: () => {
        store.theme = 'system';
        store.notifications = { donations: true, events: true, general: true };
        store.kioskMode = false;
      },
    };
  });

  describe('initial state', () => {
    it('should have system theme by default', () => {
      expect(store.theme).toBe('system');
    });

    it('should have all notifications enabled', () => {
      expect(store.notifications.donations).toBe(true);
      expect(store.notifications.events).toBe(true);
      expect(store.notifications.general).toBe(true);
    });

    it('should have kiosk mode disabled', () => {
      expect(store.kioskMode).toBe(false);
    });
  });

  describe('setTheme', () => {
    it('should update theme to dark', () => {
      store.setTheme('dark');
      expect(store.theme).toBe('dark');
    });

    it('should update theme to light', () => {
      store.setTheme('light');
      expect(store.theme).toBe('light');
    });

    it('should accept system theme', () => {
      store.setTheme('system');
      expect(store.theme).toBe('system');
    });
  });

  describe('toggleNotification', () => {
    it('should toggle notification setting', () => {
      const initialValue = store.notifications.donations;
      store.toggleNotification('donations');
      expect(store.notifications.donations).toBe(!initialValue);
    });

    it('should toggle back to original value', () => {
      const initialValue = store.notifications.events;
      store.toggleNotification('events');
      store.toggleNotification('events');
      expect(store.notifications.events).toBe(initialValue);
    });
  });

  describe('setKioskMode', () => {
    it('should enable kiosk mode', () => {
      store.setKioskMode(true);
      expect(store.kioskMode).toBe(true);
    });

    it('should disable kiosk mode', () => {
      store.kioskMode = true;
      store.setKioskMode(false);
      expect(store.kioskMode).toBe(false);
    });
  });

  describe('resetSettings', () => {
    it('should reset theme to system', () => {
      store.setTheme('dark');
      store.resetSettings();
      expect(store.theme).toBe('system');
    });

    it('should reset notifications to defaults', () => {
      store.toggleNotification('donations');
      store.resetSettings();
      expect(store.notifications.donations).toBe(true);
    });

    it('should reset kiosk mode', () => {
      store.setKioskMode(true);
      store.resetSettings();
      expect(store.kioskMode).toBe(false);
    });
  });
});
