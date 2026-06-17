import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { getSetting, setSetting } from '@services/db';
import { AppTheme, AppUnits, AppTimeFormat, NotificationPref, NotificationSettings, NotificationType, HasSeenNudge } from '../types/tracker';

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
const UNITS_KEY = 'app_units';
const TIME_FORMAT_KEY = 'app_time_format';
const NUDGE_KEYS: Record<keyof HasSeenNudge, string> = {
  sleep: 'nudge_seen_sleep',
  feed: 'nudge_seen_feed',
  diaper: 'nudge_seen_diaper',
  solids: 'nudge_seen_solids',
};
const DEFAULT_NUDGE: HasSeenNudge = { sleep: false, feed: false, diaper: false, solids: false };
const VALID_THEMES = new Set<AppTheme>(['system', 'light', 'dark']);
const VALID_UNITS = new Set<AppUnits>(['ml', 'oz']);
const VALID_TIME_FORMATS = new Set<AppTimeFormat>(['12h', '24h']);

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

function parseUnits(raw: string | null): AppUnits {
  if (raw !== null && VALID_UNITS.has(raw as AppUnits)) {
    return raw as AppUnits;
  }
  return 'ml';
}

function parseTimeFormat(raw: string | null): AppTimeFormat {
  if (raw !== null && VALID_TIME_FORMATS.has(raw as AppTimeFormat)) {
    return raw as AppTimeFormat;
  }
  return '12h';
}

interface SettingsContextType {
  notifications: NotificationSettings;
  updateNotificationPref: (
    type: NotificationType,
    pref: Partial<NotificationPref>,
  ) => Promise<void>;
  theme: AppTheme;
  updateTheme: (t: AppTheme) => Promise<void>;
  units: AppUnits;
  updateUnits: (u: AppUnits) => Promise<void>;
  timeFormat: AppTimeFormat;
  updateTimeFormat: (f: AppTimeFormat) => Promise<void>;
  hasSeenNudge: HasSeenNudge;
  markNudgeSeen: (type: keyof HasSeenNudge) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const db = useSQLiteContext();
  const [notifications, setNotifications] = useState<NotificationSettings>(DEFAULTS);
  const [theme, setTheme] = useState<AppTheme>('system');
  const [units, setUnits] = useState<AppUnits>('ml');
  const [timeFormat, setTimeFormat] = useState<AppTimeFormat>('12h');
  const [hasSeenNudge, setHasSeenNudge] = useState<HasSeenNudge>(DEFAULT_NUDGE);

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

        const rawUnits = await getSetting(db, UNITS_KEY);
        setUnits(parseUnits(rawUnits));

        const rawTimeFormat = await getSetting(db, TIME_FORMAT_KEY);
        setTimeFormat(parseTimeFormat(rawTimeFormat));

        const nudgeTypes: (keyof HasSeenNudge)[] = ['sleep', 'feed', 'diaper', 'solids'];
        const loadedNudge: HasSeenNudge = { ...DEFAULT_NUDGE };
        for (const type of nudgeTypes) {
          const raw = await getSetting(db, NUDGE_KEYS[type]);
          loadedNudge[type] = raw === '1';
        }
        setHasSeenNudge(loadedNudge);
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

  const updateUnits = useCallback(
    async (u: AppUnits): Promise<void> => {
      setUnits(u);
      try {
        await setSetting(db, UNITS_KEY, u);
      } catch (error) {
        console.error('Failed to persist units:', error);
      }
    },
    [db],
  );

  const updateTimeFormat = useCallback(
    async (f: AppTimeFormat): Promise<void> => {
      setTimeFormat(f);
      try {
        await setSetting(db, TIME_FORMAT_KEY, f);
      } catch (error) {
        console.error('Failed to persist time format:', error);
      }
    },
    [db],
  );

  const markNudgeSeen = useCallback(
    async (type: keyof HasSeenNudge): Promise<void> => {
      setHasSeenNudge(prev => ({ ...prev, [type]: true }));
      try {
        await setSetting(db, NUDGE_KEYS[type], '1');
      } catch (error) {
        console.error(`Failed to persist nudge_seen_${type}:`, error);
      }
    },
    [db],
  );

  return (
    <SettingsContext.Provider value={{ notifications, updateNotificationPref, theme, updateTheme, units, updateUnits, timeFormat, updateTimeFormat, hasSeenNudge, markNudgeSeen }}>
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
