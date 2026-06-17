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
  primary: '#6366F1',       // Electric Indigo
  primaryLight: '#E0E7FF',  // Light indigo tint
  background: '#F8FAFC',    // Crisp off-white
  surface: '#FFFFFF',        // Pure white cards
  surfaceAlt: '#EEF2FF',    // Indigo-tinted header
  textPrimary: '#111827',   // Near-black
  textMuted: '#6B7280',     // Neutral gray
  border: '#E5E7EB',        // Subtle divider

  sleep: '#8B5CF6',         // Vivid Violet
  feed: '#F97316',          // Vivid Orange
  diaper: '#0EA5E9',        // Sky Blue
  active: '#22C55E',        // Bright Green
  error: '#EF4444',
  success: '#22C55E',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.4)',
};

export const DARK: ColorPalette = {
  primary: '#818CF8',       // Lighter indigo for dark bg
  primaryLight: '#312E81',  // Dark indigo
  background: '#0F172A',    // Very dark navy
  surface: '#1E293B',       // Dark slate card
  surfaceAlt: '#1E1B4B',   // Dark indigo header
  textPrimary: '#F1F5F9',  // Near-white
  textMuted: '#94A3B8',    // Muted slate
  border: '#334155',        // Dark border

  sleep: '#A78BFA',         // Lighter violet
  feed: '#FB923C',          // Lighter orange
  diaper: '#38BDF8',        // Lighter sky blue
  active: '#4ADE80',        // Lighter green
  error: '#FC8181',
  success: '#4ADE80',
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
