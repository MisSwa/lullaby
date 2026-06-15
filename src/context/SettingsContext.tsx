import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { getSetting, setSetting } from '@services/db';
import { NotificationPref, NotificationSettings, NotificationType } from '../types/tracker';

const DEFAULTS: NotificationSettings = {
  feed: { enabled: true, thresholdMinutes: 180 },
  diaper: { enabled: true, thresholdMinutes: 240 },
  sleep: { enabled: true, thresholdMinutes: 120 },
};

const SETTING_KEYS: Record<NotificationType, string> = {
  feed: 'notif_feed',
  diaper: 'notif_diaper',
  sleep: 'notif_sleep',
};

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

interface SettingsContextType {
  notifications: NotificationSettings;
  updateNotificationPref: (type: NotificationType, pref: Partial<NotificationPref>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const db = useSQLiteContext();
  const [notifications, setNotifications] = useState<NotificationSettings>(DEFAULTS);

  useEffect(() => {
    (async () => {
      try {
        const types: NotificationType[] = ['feed', 'diaper', 'sleep'];
        const loaded: NotificationSettings = { ...DEFAULTS };
        for (const type of types) {
          const raw = await getSetting(db, SETTING_KEYS[type]);
          loaded[type] = parsePreference(raw, DEFAULTS[type]);
        }
        setNotifications(loaded);
      } catch (error) {
        console.error('Failed to load notification settings:', error);
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
        setSetting(db, SETTING_KEYS[type], JSON.stringify(updated[type])).catch(error => {
          console.error(`Failed to persist ${type} notification pref:`, error);
        });
        return updated;
      });
    },
    [db],
  );

  return (
    <SettingsContext.Provider value={{ notifications, updateNotificationPref }}>
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
