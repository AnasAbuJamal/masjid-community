import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
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

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  light: 'System',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: COLORS.shadowBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: COLORS.shadowBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  lg: {
    shadowColor: COLORS.shadowBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  glow: {
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  glass: {
    shadowColor: COLORS.shadowBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
};

export const DIMENSIONS = {
  width,
  height,
  bottomTabHeight: Platform.OS === 'ios' ? 84 : 70,
  statusBarHeight: Platform.OS === 'ios' ? 44 : 24,
};

export const GRADIENTS = {
  primary: ['#4A90D9', '#7BB3E8'],
  accent: ['#00D9FF', '#7DF9FF'],
  glass: ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.6)'],
  background: ['#FFFFFF', '#E8F4FD', '#D6EEFF'],
};

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
