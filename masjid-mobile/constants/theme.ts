export const COLORS = {
  primary: '#1e3a5f',
  primaryLight: '#2d5a8a',
  primaryDark: '#152840',
  secondary: '#2e7d32',
  secondaryLight: '#43a047',
  accent: '#f9a825',
  accentLight: '#fbc02d',
  background: '#f0f4f8',
  surface: '#ffffff',
  surfaceAlt: '#f8fafc',
  text: '#1a202c',
  textSecondary: '#718096',
  textLight: '#a0aec0',
  border: '#e2e8f0',
  borderDark: '#cbd5e0',
  error: '#d32f2f',
  errorLight: '#ffebee',
  success: '#2e7d32',
  successLight: '#e8f5e9',
  warning: '#f57c00',
  warningLight: '#fff3e0',
  white: '#ffffff',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.5)',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
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
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#1a202c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#1a202c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1a202c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
