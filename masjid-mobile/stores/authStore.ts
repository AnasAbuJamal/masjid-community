import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_STORAGE_KEY = '@masjid:user';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'staff' | 'member' | 'student';
  phone?: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    try {
      const userStr = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (userStr) {
        const user: User = JSON.parse(userStr);
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  login: async (email: string, password: string): Promise<boolean> => {
    try {
      // TODO: Replace with real API call
      // const response = await api.post('/auth/login', { email, password });
      const firstName = email.split('@')[0];
      const user: User = {
        id: Date.now().toString(),
        email,
        firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
        lastName: 'Member',
        role: 'member',
      };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      set({ user, isAuthenticated: true });
      return true;
    } catch {
      return false;
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  },

  updateUser: (updates: Partial<User>) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...updates };
    set({ user: updated });
    AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated)).catch(
      () => {}
    );
  },
}));
