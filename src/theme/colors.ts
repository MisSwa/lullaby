export const COLORS = {
  // Brand Foundation (High-end Sage & Slate)
  primary: '#5F7A61', // Deep Premium Sage Green
  primaryLight: '#D5E0D5', // Soft Wash Sage
  background: '#F8F9FA', // Clean Slate Off-White
  surface: '#FFFFFF', // Card Backgrounds
  textPrimary: '#2D3748', // Deep Charcoal Slate
  textMuted: '#718096', // Soft Gray Text
  border: '#E2E8F0', // Subtle Divider Line

  // State-Specific Action Metrics (Muted Premium Pastels)
  sleep: '#4A6FA5', // Soft Evening Indigo
  feed: '#D97706', // Warm Amber
  diaper: '#8C6239', // Soft Earth Clay
  active: '#10B981', // Vibrant Active Emerald Timer

  // UI Status
  error: '#EF4444',
  success: '#10B981',

  // Utility
  shadow: '#000000', // iOS/Android elevation shadow color
  overlay: 'rgba(0,0,0,0.35)', // Modal backdrop overlay
} as const;

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
