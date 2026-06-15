import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { Baby } from '../types/baby';
import { BabyLog, ActiveTrackers, SleepLog, FeedLog, DiaperLog, NotificationType } from '../types/tracker';
import { fetchBabies, fetchLogsForBaby, insertLog, deleteLog, createBaby } from '@services/db';
import { useSettings } from '@context/SettingsContext';
import { useNotifications } from '@hooks/useNotifications';

interface TrackerContextType {
  babies: Baby[];
  activeBabyId: string | null;
  setActiveBabyId: (id: string) => void;
  logs: BabyLog[];
  active: ActiveTrackers;
  refreshLogs: () => Promise<void>;
  startSleep: () => void;
  stopSleep: (notes?: string) => Promise<void>;
  toggleBreastFeed: (side: 'left' | 'right') => void;
  saveBreastFeed: (notes?: string) => Promise<void>;
  logBottle: (amountMl: number, notes?: string) => Promise<void>;
  logSolids: (notes?: string) => Promise<void>;
  logDiaper: (status: 'wet' | 'dirty' | 'mixed' | 'dry', notes?: string) => Promise<void>;
  removeLog: (id: string) => Promise<void>;
  createBaby: (name: string, dob: number) => Promise<void>;
}

const INITIAL_ACTIVE: ActiveTrackers = {
  sleepStart: null,
  feedLeftStart: null,
  feedRightStart: null,
  feedLeftElapsed: 0,
  feedRightElapsed: 0,
};

function todayRange(): { start: number; end: number } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const end = start + 24 * 60 * 60 * 1000 - 1;
  return { start, end };
}

function logTypeToNotifType(logType: BabyLog['type']): NotificationType {
  switch (logType) {
    case 'sleep':
      return 'sleep';
    case 'feed':
      return 'feed';
    case 'diaper':
      return 'diaper';
  }
}

const TrackerContext = createContext<TrackerContextType | undefined>(undefined);

export const TrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const db = useSQLiteContext();
  const { notifications } = useSettings();
  const { scheduleReminder, cancelReminder } = useNotifications();

  const [babies, setBabies] = useState<Baby[]>([]);
  const [activeBabyId, setActiveBabyId] = useState<string | null>(null);
  const [logs, setLogs] = useState<BabyLog[]>([]);
  const [active, setActive] = useState<ActiveTrackers>(INITIAL_ACTIVE);
  const hasSetInitialBaby = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const fetched = await fetchBabies(db);
        setBabies(fetched);
        if (fetched.length > 0 && !hasSetInitialBaby.current) {
          hasSetInitialBaby.current = true;
          setActiveBabyId(fetched[0].id);
        }
      } catch (error) {
        console.error('Failed to load babies:', error);
      }
    })();
  }, [db]);

  const refreshLogs = useCallback(async (): Promise<void> => {
    if (!activeBabyId) return;
    try {
      const { start, end } = todayRange();
      const fetched = await fetchLogsForBaby(db, activeBabyId, start, end);
      setLogs(fetched);
    } catch (error) {
      console.error('Failed to refresh logs:', error);
    }
  }, [db, activeBabyId]);

  useEffect(() => {
    refreshLogs();
  }, [refreshLogs]);

  // ─── Notification helpers ────────────────────────────────────────────────────

  const afterInsert = useCallback(
    async (log: BabyLog, currentBabies: Baby[]): Promise<void> => {
      const notifType = logTypeToNotifType(log.type);
      const pref = notifications[notifType];
      if (!pref.enabled) return;
      const activeBaby = currentBabies.find(b => b.id === log.babyId);
      const babyName = currentBabies.length > 1 ? activeBaby?.name : undefined;
      await scheduleReminder(notifType, pref.thresholdMinutes, babyName);
    },
    [notifications, scheduleReminder],
  );

  const afterDelete = useCallback(
    async (logType: BabyLog['type']): Promise<void> => {
      const notifType = logTypeToNotifType(logType);
      await cancelReminder(notifType);
    },
    [cancelReminder],
  );

  // ─── Baby management ─────────────────────────────────────────────────────────

  const handleCreateBaby = async (name: string, dob: number): Promise<void> => {
    try {
      const baby = await createBaby(db, name, dob);
      setBabies(prev => {
        if (!hasSetInitialBaby.current) {
          hasSetInitialBaby.current = true;
          setActiveBabyId(baby.id);
        }
        return [...prev, baby];
      });
    } catch (error) {
      console.error('Failed to create baby:', error);
      throw error;
    }
  };

  // ─── Log management ──────────────────────────────────────────────────────────

  const removeLog = async (id: string): Promise<void> => {
    const logToRemove = logs.find(l => l.id === id);
    try {
      await deleteLog(db, id);
      if (logToRemove) {
        await afterDelete(logToRemove.type);
      }
      await refreshLogs();
    } catch (error) {
      console.error('Failed to remove log:', error);
      throw error;
    }
  };

  // ─── Sleep ───────────────────────────────────────────────────────────────────

  const startSleep = (): void => {
    setActive(prev => ({ ...prev, sleepStart: Date.now() }));
  };

  const stopSleep = async (notes = ''): Promise<void> => {
    if (!active.sleepStart || !activeBabyId) return;
    const log: SleepLog = {
      id: Crypto.randomUUID(),
      babyId: activeBabyId,
      type: 'sleep',
      timestamp: active.sleepStart,
      endTime: Date.now(),
      notes,
    };
    try {
      await insertLog(db, log);
      setActive(prev => ({ ...prev, sleepStart: null }));
      await refreshLogs();
      await afterInsert(log, babies);
    } catch (error) {
      console.error('Failed to stop sleep:', error);
      throw error;
    }
  };

  // ─── Breast Feed ─────────────────────────────────────────────────────────────

  const toggleBreastFeed = (side: 'left' | 'right'): void => {
    const now = Date.now();
    setActive(prev => {
      const isLeft = side === 'left';
      const myStart = isLeft ? prev.feedLeftStart : prev.feedRightStart;
      const otherStart = isLeft ? prev.feedRightStart : prev.feedLeftStart;
      const myElapsed = isLeft ? prev.feedLeftElapsed : prev.feedRightElapsed;
      const otherElapsed = isLeft ? prev.feedRightElapsed : prev.feedLeftElapsed;

      const newOtherElapsed =
        otherStart !== null ? otherElapsed + Math.floor((now - otherStart) / 1000) : otherElapsed;

      if (myStart !== null) {
        const newMyElapsed = myElapsed + Math.floor((now - myStart) / 1000);
        return isLeft
          ? {
              ...prev,
              feedLeftStart: null,
              feedLeftElapsed: newMyElapsed,
              feedRightStart: null,
              feedRightElapsed: newOtherElapsed,
            }
          : {
              ...prev,
              feedRightStart: null,
              feedRightElapsed: newMyElapsed,
              feedLeftStart: null,
              feedLeftElapsed: newOtherElapsed,
            };
      } else {
        return isLeft
          ? { ...prev, feedLeftStart: now, feedRightStart: null, feedRightElapsed: newOtherElapsed }
          : { ...prev, feedRightStart: now, feedLeftStart: null, feedLeftElapsed: newOtherElapsed };
      }
    });
  };

  const saveBreastFeed = async (notes = ''): Promise<void> => {
    if (!activeBabyId) return;
    const now = Date.now();
    const finalLeft =
      active.feedLeftElapsed +
      (active.feedLeftStart !== null ? Math.floor((now - active.feedLeftStart) / 1000) : 0);
    const finalRight =
      active.feedRightElapsed +
      (active.feedRightStart !== null ? Math.floor((now - active.feedRightStart) / 1000) : 0);
    if (finalLeft === 0 && finalRight === 0) return;
    const log: FeedLog = {
      id: Crypto.randomUUID(),
      babyId: activeBabyId,
      type: 'feed',
      feedType: 'breast',
      timestamp: now,
      leftDuration: finalLeft,
      rightDuration: finalRight,
      amountMl: 0,
      notes,
    };
    try {
      await insertLog(db, log);
      setActive(prev => ({
        ...prev,
        feedLeftStart: null,
        feedRightStart: null,
        feedLeftElapsed: 0,
        feedRightElapsed: 0,
      }));
      await refreshLogs();
      await afterInsert(log, babies);
    } catch (error) {
      console.error('Failed to save breast feed:', error);
      throw error;
    }
  };

  // ─── Bottle & Solids ─────────────────────────────────────────────────────────

  const logBottle = async (amountMl: number, notes?: string): Promise<void> => {
    if (!activeBabyId || amountMl < 1) return;
    const log: FeedLog = {
      id: Crypto.randomUUID(),
      babyId: activeBabyId,
      type: 'feed',
      feedType: 'bottle',
      timestamp: Date.now(),
      leftDuration: 0,
      rightDuration: 0,
      amountMl,
      notes: notes ?? '',
    };
    try {
      await insertLog(db, log);
      await refreshLogs();
      await afterInsert(log, babies);
    } catch (error) {
      console.error('Failed to log bottle:', error);
      throw error;
    }
  };

  const logSolids = async (notes?: string): Promise<void> => {
    if (!activeBabyId) return;
    const log: FeedLog = {
      id: Crypto.randomUUID(),
      babyId: activeBabyId,
      type: 'feed',
      feedType: 'solids',
      timestamp: Date.now(),
      leftDuration: 0,
      rightDuration: 0,
      amountMl: 0,
      notes: notes ?? '',
    };
    try {
      await insertLog(db, log);
      await refreshLogs();
      await afterInsert(log, babies);
    } catch (error) {
      console.error('Failed to log solids:', error);
      throw error;
    }
  };

  // ─── Diaper ──────────────────────────────────────────────────────────────────

  const logDiaper = async (status: DiaperLog['status'], notes?: string): Promise<void> => {
    if (!activeBabyId) return;
    const log: DiaperLog = {
      id: Crypto.randomUUID(),
      babyId: activeBabyId,
      type: 'diaper',
      status,
      timestamp: Date.now(),
      notes: notes ?? '',
    };
    try {
      await insertLog(db, log);
      await refreshLogs();
      await afterInsert(log, babies);
    } catch (error) {
      console.error('Failed to log diaper:', error);
      throw error;
    }
  };

  return (
    <TrackerContext.Provider
      value={{
        babies,
        activeBabyId,
        setActiveBabyId,
        logs,
        active,
        refreshLogs,
        startSleep,
        stopSleep,
        toggleBreastFeed,
        saveBreastFeed,
        logBottle,
        logSolids,
        logDiaper,
        removeLog,
        createBaby: handleCreateBaby,
      }}
    >
      {children}
    </TrackerContext.Provider>
  );
};

export const useTracker = (): TrackerContextType => {
  const context = useContext(TrackerContext);
  if (!context) {
    throw new Error('useTracker must be used within a TrackerProvider.');
  }
  return context;
};
