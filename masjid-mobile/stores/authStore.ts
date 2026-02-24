import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    const userStr = await AsyncStorage.getItem('user');
    if (userStr) {
      set({ user: JSON.parse(userStr), isAuthenticated: true, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    const user = { id: '1', email, firstName: email.split('@')[0], lastName: 'User', role: 'member' };
    await AsyncStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
    return true;
  },

  logout: async () => {
    await AsyncStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },
}));
