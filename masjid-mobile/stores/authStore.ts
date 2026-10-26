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
  setUser: (user: User) => Promise<void>;
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
      const token = await api.getToken();
      if (userStr && token) {
        // Never trust cached user data without checking the signed server session.
        const user = await apiService.auth.me();
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        await api.clearToken();
        await AsyncStorage.removeItem(USER_STORAGE_KEY);
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      await api.clearToken();
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.auth.login(email, password);
      const user: User = response.user;
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      set({ user, isAuthenticated: true });
      return true;
    } catch (error: unknown) {
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

  setUser: async (user: User) => {
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    set({ user, isAuthenticated: true });
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
