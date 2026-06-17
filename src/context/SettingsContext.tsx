import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { getSetting, setSetting } from '@services/db';
import { AppTheme, NotificationPref, NotificationSettings, NotificationType } from '../types/tracker';

const DEFAULTS: NotificationSettings = {
  feed: { enabled: true, thresholdMinutes: 180 },
  diaper: { enabled: true, thresholdMinutes: 240 },
  sleep: { enabled: true, thresholdMinutes: 120 },
};

const NOTIFICATION_KEYS: Record<NotificationType, string> = {
  feed: 'notif_feed',
  diaper: 'notif_diaper',
  sleep: 'notif_sleep',
};

const THEME_KEY = 'app_theme';
const VALID_THEMES = new Set<AppTheme>(['system', 'light', 'dark']);

function parsePreference(raw: string | null, fallback: NotificationPref): NotificationPref {
  if (!raw) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      'enabled' in parsed &&
      'thresholdMinutes' in parsed &&
      typeof (parsed as Record<string, unknown>).enabled === 'boolean' &&
      typeof (parsed as Record<string, unknown>).thresholdMinutes === 'number'
    ) {
      return {
        enabled: (parsed as Record<string, unknown>).enabled as boolean,
        thresholdMinutes: (parsed as Record<string, unknown>).thresholdMinutes as number,
      };
    }
  } catch {
    // malformed JSON — fall through to default
  }
  return fallback;
}

function parseTheme(raw: string | null): AppTheme {
  if (raw !== null && VALID_THEMES.has(raw as AppTheme)) {
    return raw as AppTheme;
  }
  return 'system';
}

interface SettingsContextType {
  notifications: NotificationSettings;
  updateNotificationPref: (
    type: NotificationType,
    pref: Partial<NotificationPref>,
  ) => Promise<void>;
  theme: AppTheme;
  updateTheme: (t: AppTheme) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const db = useSQLiteContext();
  const [notifications, setNotifications] = useState<NotificationSettings>(DEFAULTS);
  const [theme, setTheme] = useState<AppTheme>('system');

  useEffect(() => {
    (async () => {
      try {
        const types: NotificationType[] = ['feed', 'diaper', 'sleep'];
        const loaded: NotificationSettings = { ...DEFAULTS };
        for (const type of types) {
          const raw = await getSetting(db, NOTIFICATION_KEYS[type]);
          loaded[type] = parsePreference(raw, DEFAULTS[type]);
        }
        setNotifications(loaded);

        const rawTheme = await getSetting(db, THEME_KEY);
        setTheme(parseTheme(rawTheme));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    })();
  }, [db]);

  const updateNotificationPref = useCallback(
    async (type: NotificationType, pref: Partial<NotificationPref>): Promise<void> => {
      setNotifications(prev => {
        const updated: NotificationSettings = {
          ...prev,
          [type]: { ...prev[type], ...pref },
        };
        setSetting(db, NOTIFICATION_KEYS[type], JSON.stringify(updated[type])).catch(error => {
          console.error(`Failed to persist ${type} notification pref:`, error);
        });
        return updated;
      });
    },
    [db],
  );

  const updateTheme = useCallback(
    async (t: AppTheme): Promise<void> => {
      setTheme(t);
      try {
        await setSetting(db, THEME_KEY, t);
      } catch (error) {
        console.error('Failed to persist theme:', error);
      }
    },
    [db],
  );

  return (
    <SettingsContext.Provider value={{ notifications, updateNotificationPref, theme, updateTheme }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider.');
  }
  return context;
};
