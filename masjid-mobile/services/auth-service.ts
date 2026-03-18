import api from './api-client';
import apiService from './api-service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKMARKS_KEY = '@masjid:bookmarks';

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  email: string;
  code: string;
  newPassword: string;
}

export interface SocialLoginRequest {
  provider: 'google' | 'apple';
  idToken: string;
}

class AuthExtendedService {
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      await api.instance.post('/auth/password-reset/request', { email });
      return { success: true, message: 'Password reset code sent to your email' };
    } catch (error) {
      return { success: false, message: 'Failed to send reset code. Please try again.' };
    }
  }

  async confirmPasswordReset(email: string, code: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      await api.instance.post('/auth/password-reset/confirm', { email, code, newPassword });
      return { success: true, message: 'Password reset successful' };
    } catch (error) {
      return { success: false, message: 'Invalid code or expired. Please try again.' };
    }
  }

  async loginWithGoogle(idToken: string): Promise<{ success: boolean; user?: any; token?: string; error?: string }> {
    try {
      const response = await api.instance.post('/auth/social/login', {
        provider: 'google',
        idToken,
      });
      const { user, token } = response.data;
      await api.setToken(token);
      await AsyncStorage.setItem('@masjid:user', JSON.stringify(user));
      return { success: true, user, token };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Google login failed' };
    }
  }

  async loginWithApple(idToken: string): Promise<{ success: boolean; user?: any; token?: string; error?: string }> {
    try {
      const response = await api.instance.post('/auth/social/login', {
        provider: 'apple',
        idToken,
      });
      const { user, token } = response.data;
      await api.setToken(token);
      await AsyncStorage.setItem('@masjid:user', JSON.stringify(user));
      return { success: true, user, token };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Apple login failed' };
    }
  }

  async getStoredUser(): Promise<any | null> {
    try {
      const userStr = await AsyncStorage.getItem('@masjid:user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  async updateProfile(data: { firstName?: string; lastName?: string; phone?: string }): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const user = await apiService.auth.updateProfile(data);
      await AsyncStorage.setItem('@masjid:user', JSON.stringify(user));
      return { success: true, user };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to update profile' };
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiService.auth.changePassword(currentPassword, newPassword);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to change password' };
    }
  }

  async refreshToken(): Promise<{ success: boolean; token?: string }> {
    try {
      const response = await api.instance.post('/auth/refresh');
      const { token } = response.data;
      await api.setToken(token);
      return { success: true, token };
    } catch {
      return { success: false };
    }
  }

  async isTokenValid(): Promise<boolean> {
    const token = await api.getToken();
    return !!token;
  }
}

export const authExtendedService = new AuthExtendedService();
export default authExtendedService;
