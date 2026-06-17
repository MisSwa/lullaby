import { useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import { DARK, LIGHT, ColorPalette } from '@theme/colors';
import { useSettings } from '@context/SettingsContext';
import { AppTheme } from '../types/tracker';

function resolveScheme(override: AppTheme): ColorPalette {
  if (override === 'light') return LIGHT;
  if (override === 'dark') return DARK;
  // 'system' — defer to OS
  return Appearance.getColorScheme() === 'dark' ? DARK : LIGHT;
}

/**
 * Returns the active ColorPalette based on the user's theme preference
 * (stored in SettingsContext) and the OS appearance setting.
 *
 * Must be called inside a component that is a descendant of SettingsProvider.
 * Automatically re-renders when the OS appearance changes (system mode)
 * or when the user's manual override changes.
 */
export function useTheme(): ColorPalette {
  const { theme } = useSettings();
  const [palette, setPalette] = useState<ColorPalette>(() => resolveScheme(theme));

  // Re-resolve whenever the user's stored override changes
  useEffect(() => {
    setPalette(resolveScheme(theme));
  }, [theme]);

  // Listen for OS appearance changes only when in 'system' mode
  useEffect(() => {
    if (theme !== 'system') return;
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setPalette(colorScheme === 'dark' ? DARK : LIGHT);
    });
    return () => subscription.remove();
  }, [theme]);

  return palette;
}
