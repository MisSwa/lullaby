import React, { createContext, useContext, useState } from 'react';

interface SettingsContextType {
  feedReminderEnabled: boolean;
  feedReminderMinutes: number;
  diaperReminderEnabled: boolean;
  diaperReminderMinutes: number;
  updateSettings: (patch: Partial<Omit<SettingsContextType, 'updateSettings'>>) => void;
}

const DEFAULTS: Omit<SettingsContextType, 'updateSettings'> = {
  feedReminderEnabled: true,
  feedReminderMinutes: 180, // 3 hours
  diaperReminderEnabled: true,
  diaperReminderMinutes: 240, // 4 hours
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULTS);

  const updateSettings = (patch: Partial<Omit<SettingsContextType, 'updateSettings'>>) => {
    setSettings(prev => ({ ...prev, ...patch }));
  };

  return (
    <SettingsContext.Provider value={{ ...settings, updateSettings }}>
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
