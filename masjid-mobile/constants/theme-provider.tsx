import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useSettingsStore, ThemeMode } from '../stores/settingsStore';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryFaded: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  accent: string;
  accentLight: string;
  accentGlow: string;
  background: string;
  backgroundGradientStart: string;
  backgroundGradientEnd: string;
  surface: string;
  surfaceGlass: string;
  surfaceGlassLight: string;
  text: string;
  textSecondary: string;
  textLight: string;
  textWhite: string;
  border: string;
  borderLight: string;
  error: string;
  errorLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  white: string;
  black: string;
  overlay: string;
  glassBorder: string;
  glassShine: string;
  shadowColor: string;
  shadowBlue: string;
}

const lightColors: ThemeColors = {
  primary: '#4A90D9',
  primaryLight: '#7BB3E8',
  primaryDark: '#2E6BB5',
  primaryFaded: 'rgba(74, 144, 217, 0.15)',
  secondary: '#6DD5ED',
  secondaryLight: '#A8E6FF',
  secondaryDark: '#3FC5E8',
  accent: '#00D9FF',
  accentLight: '#7DF9FF',
  accentGlow: 'rgba(0, 217, 255, 0.3)',
  background: '#F8FAFC',
  backgroundGradientStart: '#FFFFFF',
  backgroundGradientEnd: '#E8F4FD',
  surface: 'rgba(255, 255, 255, 0.75)',
  surfaceGlass: 'rgba(255, 255, 255, 0.65)',
  surfaceGlassLight: 'rgba(255, 255, 255, 0.45)',
  text: '#1E3A5F',
  textSecondary: '#6B7C8F',
  textLight: '#9CA8B8',
  textWhite: '#FFFFFF',
  border: 'rgba(74, 144, 217, 0.2)',
  borderLight: 'rgba(255, 255, 255, 0.5)',
  error: '#FF6B6B',
  errorLight: 'rgba(255, 107, 107, 0.15)',
  success: '#4CAF50',
  successLight: 'rgba(76, 175, 80, 0.15)',
  warning: '#FFB74D',
  warningLight: 'rgba(255, 183, 77, 0.15)',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(30, 58, 95, 0.4)',
  glassBorder: 'rgba(255, 255, 255, 0.6)',
  glassShine: 'rgba(255, 255, 255, 0.8)',
  shadowColor: '#1E3A5F',
  shadowBlue: 'rgba(74, 144, 217, 0.25)',
};

const darkColors: ThemeColors = {
  primary: '#4A90D9',
  primaryLight: '#7BB3E8',
  primaryDark: '#2E6BB5',
  primaryFaded: 'rgba(74, 144, 217, 0.25)',
  secondary: '#6DD5ED',
  secondaryLight: '#A8E6FF',
  secondaryDark: '#3FC5E8',
  accent: '#00D9FF',
  accentLight: '#7DF9FF',
  accentGlow: 'rgba(0, 217, 255, 0.4)',
  background: '#0D1B2A',
  backgroundGradientStart: '#1B2838',
  backgroundGradientEnd: '#0D1B2A',
  surface: 'rgba(30, 58, 95, 0.6)',
  surfaceGlass: 'rgba(30, 58, 95, 0.5)',
  surfaceGlassLight: 'rgba(30, 58, 95, 0.35)',
  text: '#F0F4F8',
  textSecondary: '#A0AEC0',
  textLight: '#718096',
  textWhite: '#FFFFFF',
  border: 'rgba(74, 144, 217, 0.3)',
  borderLight: 'rgba(255, 255, 255, 0.1)',
  error: '#FC8181',
  errorLight: 'rgba(252, 129, 129, 0.2)',
  success: '#68D391',
  successLight: 'rgba(104, 211, 145, 0.2)',
  warning: '#F6AD55',
  warningLight: 'rgba(246, 173, 85, 0.2)',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.6)',
  glassBorder: 'rgba(255, 255, 255, 0.15)',
  glassShine: 'rgba(255, 255, 255, 0.3)',
  shadowColor: '#000000',
  shadowBlue: 'rgba(0, 0, 0, 0.4)',
};

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: lightColors,
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const { themeMode } = useSettingsStore();

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  const colors = useMemo(() => {
    return isDark ? darkColors : lightColors;
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  return useContext(ThemeContext);
}
