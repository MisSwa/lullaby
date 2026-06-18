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
  feed: string;      // generic feed fallback (NudgeSheet, log list)
  nursing: string;   // breast feeding card
  bottle: string;    // bottle feeding card
  solids: string;    // solids card
  diaper: string;
  active: string;
  error: string;
  success: string;
  shadow: string;
  overlay: string;
}

export const LIGHT: ColorPalette = {
  primary: '#7C3AED',       // Deep Violet — premium CTA; 5.3:1 vs white (WCAG AA)
  primaryLight: '#EDE9FE',  // Violet-100 tint
  background: '#FAFAF8',    // Warm off-white (cream undertone)
  surface: '#FFFFFF',        // Pure white cards
  surfaceAlt: '#F5F3FF',    // Violet-50 — premium header tint
  textPrimary: '#18181B',   // Zinc-900 warm near-black
  textMuted: '#71717A',     // Zinc-500
  border: '#E4E4E7',        // Zinc-200

  sleep: '#1D4ED8',         // Bold Blue — night, stars, calm; 6.0:1 vs white
  feed: '#C2410C',          // Generic feed (NudgeSheet fallback / log list)
  nursing: '#BE185D',       // Deep Rose — intimate, warm; 5.9:1 vs white
  bottle: '#C2410C',        // Burnt Orange — warm liquid; 4.8:1 vs white
  solids: '#166534',        // Dark Forest Green — natural food; 7.2:1 vs white
  diaper: '#0F766E',        // Rich Teal — clean, fresh; 4.9:1 vs white
  active: '#16A34A',        // Forest Green — running timer state only
  error: '#DC2626',
  success: '#16A34A',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.4)',
};

export const DARK: ColorPalette = {
  primary: '#A78BFA',       // Violet-400
  primaryLight: '#2E1065',  // Violet-950
  background: '#0F172A',    // Very dark navy
  surface: '#1E293B',       // Dark slate card
  surfaceAlt: '#1E1B4B',    // Dark violet header
  textPrimary: '#F1F5F9',  // Near-white
  textMuted: '#94A3B8',    // Muted slate
  border: '#334155',        // Dark border

  sleep: '#60A5FA',         // Blue-400
  feed: '#FB923C',          // Orange-400 (fallback)
  nursing: '#F472B6',       // Pink-400
  bottle: '#FB923C',        // Orange-400
  solids: '#34D399',        // Emerald-400
  diaper: '#2DD4BF',        // Teal-400
  active: '#4ADE80',        // Green-400
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
