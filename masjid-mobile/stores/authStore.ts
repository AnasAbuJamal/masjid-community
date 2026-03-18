import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService, { User as ApiUser } from '../services/api-service';
import api from '../services/api-client';

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
      const response = await apiService.auth.login(email, password);
      const user: User = response.user;
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      set({ user, isAuthenticated: true });
      return true;
    } catch {
      return false;
    }
  },

  logout: async () => {
    try {
      await apiService.auth.logout();
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
    } catch {
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
