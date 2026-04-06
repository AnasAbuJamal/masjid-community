import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsState {
  themeMode: ThemeMode;
  prayerNotifications: boolean;
  announcementNotifications: boolean;
  donationNotifications: boolean;
  attendanceAlerts: boolean;
  gradeNotifications: boolean;
  paymentReminders: boolean;
  isLoading: boolean;
}

interface SettingsActions {
  initialize: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setPrayerNotifications: (enabled: boolean) => Promise<void>;
  setAnnouncementNotifications: (enabled: boolean) => Promise<void>;
  setDonationNotifications: (enabled: boolean) => Promise<void>;
  setAttendanceAlerts: (enabled: boolean) => Promise<void>;
  setGradeNotifications: (enabled: boolean) => Promise<void>;
  setPaymentReminders: (enabled: boolean) => Promise<void>;
}

const SETTINGS_STORAGE_KEY = '@masjid:settings';

export const useSettingsStore = create<SettingsState & SettingsActions>((set, get) => ({
  themeMode: 'light',
  prayerNotifications: true,
  announcementNotifications: true,
  donationNotifications: true,
  attendanceAlerts: true,
  gradeNotifications: true,
  paymentReminders: true,
  isLoading: true,

  initialize: async () => {
    try {
      const settingsStr = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        set({ 
          ...settings, 
          isLoading: false,
          attendanceAlerts: settings.attendanceAlerts ?? true,
          gradeNotifications: settings.gradeNotifications ?? true,
          paymentReminders: settings.paymentReminders ?? true,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  setThemeMode: async (mode: ThemeMode) => {
    set({ themeMode: mode });
    await saveSettings(get());
  },

  setPrayerNotifications: async (enabled: boolean) => {
    set({ prayerNotifications: enabled });
    await saveSettings(get());
  },

  setAnnouncementNotifications: async (enabled: boolean) => {
    set({ announcementNotifications: enabled });
    await saveSettings(get());
  },

  setDonationNotifications: async (enabled: boolean) => {
    set({ donationNotifications: enabled });
    await saveSettings(get());
  },

  setAttendanceAlerts: async (enabled: boolean) => {
    set({ attendanceAlerts: enabled });
    await saveSettings(get());
  },

  setGradeNotifications: async (enabled: boolean) => {
    set({ gradeNotifications: enabled });
    await saveSettings(get());
  },

  setPaymentReminders: async (enabled: boolean) => {
    set({ paymentReminders: enabled });
    await saveSettings(get());
  },
}));

async function saveSettings(state: SettingsState & SettingsActions) {
  const { themeMode, prayerNotifications, announcementNotifications, donationNotifications, attendanceAlerts, gradeNotifications, paymentReminders } = state;
  await AsyncStorage.setItem(
    SETTINGS_STORAGE_KEY,
    JSON.stringify({ themeMode, prayerNotifications, announcementNotifications, donationNotifications, attendanceAlerts, gradeNotifications, paymentReminders })
  );
}

export default useSettingsStore;
