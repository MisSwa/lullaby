export interface ColorPalette {
  primary: string;
  primaryLight: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  textPrimary: string;
  textMuted: string;
  border: string;
  sleep: string;
  feed: string;
  diaper: string;
  active: string;
  error: string;
  success: string;
  shadow: string;
  overlay: string;
}

export const LIGHT: ColorPalette = {
  primary: '#5F7A61',
  primaryLight: '#D5E0D5',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F4F0',
  textPrimary: '#2D3748',
  textMuted: '#718096',
  border: '#E2E8F0',
  sleep: '#4A6FA5',
  feed: '#D97706',
  diaper: '#8C6239',
  active: '#10B981',
  error: '#EF4444',
  success: '#10B981',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.35)',
};

export const DARK: ColorPalette = {
  primary: '#7BA67D',
  primaryLight: '#2D3D2E',
  background: '#0F1117',
  surface: '#1A1E27',
  surfaceAlt: '#1E2530',
  textPrimary: '#E2E8F0',
  textMuted: '#718096',
  border: '#2D3748',
  sleep: '#6B9FD4',
  feed: '#F59E0B',
  diaper: '#A07850',
  active: '#10B981',
  error: '#FC8181',
  success: '#10B981',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.6)',
};

/** @deprecated Use `useTheme()` instead. Will be removed after all files migrate. */
export const COLORS: ColorPalette = LIGHT;

export const TYPOGRAPHY = {
  fontFamily: 'System',
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 22,
    title: 28,
  },
} as const;
