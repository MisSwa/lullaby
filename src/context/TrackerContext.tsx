import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { Baby } from '../types/baby';
import {
  BabyLog,
  ActiveTrackers,
  SleepLog,
  FeedLog,
  DiaperLog,
  NotificationType,
} from '../types/tracker';
import { fetchBabies, fetchLogsForBaby, fetchSolidsHistory, insertLog, deleteLog, createBaby, updateBaby } from '@services/db';
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
  cancelSleep: () => void;
  stopSleep: (notes?: string, endTime?: number) => Promise<void>;
  toggleBreastFeed: (side: 'left' | 'right') => void;
  adjustFeedStart: (deltaMs: number) => void;
  saveBreastFeed: (notes?: string, timestamp?: number) => Promise<void>;
  logBottle: (amountMl: number, notes?: string, timestamp?: number) => Promise<void>;
  logSolids: (notes?: string, timestamp?: number) => Promise<void>;
  logDiaper: (status: 'wet' | 'dirty' | 'mixed' | 'dry', notes?: string, timestamp?: number) => Promise<void>;
  solidsFoodHistory: string[];
  historyLogs: BabyLog[];
  historyDate: number | null;
  loadHistoryDate: (dateMs: number) => Promise<void>;
  clearHistory: () => void;
  logBreastFeedManual: (leftSecs: number, rightSecs: number, timestamp: number, notes?: string) => Promise<void>;
  removeLog: (id: string) => Promise<void>;
  createBaby: (name: string, dob: number) => Promise<void>;
  updateBaby: (id: string, name: string, dob: number) => Promise<void>;
  updateSleepStart: (timestamp: number) => void;
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
    default: {
      const _exhaustive: never = logType;
      throw new Error(`Unhandled log type: ${JSON.stringify(_exhaustive)}`);
    }
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
  const [solidsFoodHistory, setSolidsFoodHistory] = useState<string[]>([]);
  const [historyLogs, setHistoryLogs] = useState<BabyLog[]>([]);
  const [historyDate, setHistoryDate] = useState<number | null>(null);
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

  const loadSolidsHistory = useCallback(async (): Promise<void> => {
    if (!activeBabyId) return;
    const history = await fetchSolidsHistory(db, activeBabyId);
    setSolidsFoodHistory(history);
  }, [db, activeBabyId]);

  const loadHistoryDate = useCallback(async (dateMs: number): Promise<void> => {
    if (!activeBabyId) return;
    try {
      const d = new Date(dateMs);
      d.setHours(0, 0, 0, 0);
      const startMs = d.getTime();
      const endMs = startMs + 24 * 60 * 60 * 1000 - 1;
      const fetched = await fetchLogsForBaby(db, activeBabyId, startMs, endMs);
      setHistoryLogs(fetched);
      setHistoryDate(dateMs);
    } catch (error) {
      console.error('Failed to load history logs:', error);
    }
  }, [db, activeBabyId]);

  const clearHistory = useCallback((): void => {
    setHistoryLogs([]);
    setHistoryDate(null);
  }, []);

  useEffect(() => {
    refreshLogs();
    loadSolidsHistory();
  }, [refreshLogs, loadSolidsHistory]);

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

  const handleUpdateBaby = async (id: string, name: string, dob: number): Promise<void> => {
    try {
      await updateBaby(db, id, name, dob);
      setBabies(prev => prev.map(b => (b.id === id ? { ...b, name, dob } : b)));
    } catch (error) {
      console.error('Failed to update baby:', error);
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

  const cancelSleep = (): void => {
    setActive(prev => ({ ...prev, sleepStart: null }));
  };

  const MAX_SLEEP_RETROACTIVE_MS = 12 * 60 * 60 * 1000;

  const updateSleepStart = (timestamp: number): void => {
    const now = Date.now();
    if (timestamp > now) throw new Error('Start time cannot be in the future.');
    if (now - timestamp > MAX_SLEEP_RETROACTIVE_MS)
      throw new Error('Start time cannot be more than 12 hours in the past.');
    setActive(prev => ({ ...prev, sleepStart: timestamp }));
  };

  const stopSleep = async (notes = '', endTime?: number): Promise<void> => {
    if (!active.sleepStart || !activeBabyId) return;
    const log: SleepLog = {
      id: Crypto.randomUUID(),
      babyId: activeBabyId,
      type: 'sleep',
      timestamp: active.sleepStart,
      endTime: endTime ?? Date.now(),
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

  // Shift the active side's start timestamp back by deltaMs so useLiveTick
  // reflects the retroactive start the user set in the nursing time picker.
  const adjustFeedStart = (deltaMs: number): void => {
    if (deltaMs <= 0) return;
    setActive(prev => {
      if (prev.feedLeftStart !== null) {
        return { ...prev, feedLeftStart: prev.feedLeftStart - deltaMs };
      }
      if (prev.feedRightStart !== null) {
        return { ...prev, feedRightStart: prev.feedRightStart - deltaMs };
      }
      // No side running but user has accumulated time — add to the larger side
      if (prev.feedLeftElapsed > 0 || prev.feedRightElapsed > 0) {
        const extraSecs = Math.floor(deltaMs / 1000);
        return prev.feedLeftElapsed >= prev.feedRightElapsed
          ? { ...prev, feedLeftElapsed: prev.feedLeftElapsed + extraSecs }
          : { ...prev, feedRightElapsed: prev.feedRightElapsed + extraSecs };
      }
      return prev;
    });
  };

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

  const saveBreastFeed = async (notes = '', timestamp?: number): Promise<void> => {
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
      timestamp: timestamp ?? now,
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

  // Log a nursing session that was not tracked live (user enters durations manually)
  const logBreastFeedManual = async (
    leftSecs: number,
    rightSecs: number,
    timestamp: number,
    notes = '',
  ): Promise<void> => {
    if (!activeBabyId || (leftSecs < 1 && rightSecs < 1)) return;
    const log: FeedLog = {
      id: Crypto.randomUUID(),
      babyId: activeBabyId,
      type: 'feed',
      feedType: 'breast',
      timestamp,
      leftDuration: leftSecs,
      rightDuration: rightSecs,
      amountMl: 0,
      notes,
    };
    try {
      await insertLog(db, log);
      await refreshLogs();
      await afterInsert(log, babies);
    } catch (error) {
      console.error('Failed to log manual breast feed:', error);
      throw error;
    }
  };

  // ─── Bottle & Solids ─────────────────────────────────────────────────────────

  const logBottle = async (amountMl: number, notes?: string, timestamp?: number): Promise<void> => {
    if (!activeBabyId || amountMl < 1) return;
    const log: FeedLog = {
      id: Crypto.randomUUID(),
      babyId: activeBabyId,
      type: 'feed',
      feedType: 'bottle',
      timestamp: timestamp ?? Date.now(),
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

  const logSolids = async (notes?: string, timestamp?: number): Promise<void> => {
    if (!activeBabyId) return;
    const log: FeedLog = {
      id: Crypto.randomUUID(),
      babyId: activeBabyId,
      type: 'feed',
      feedType: 'solids',
      timestamp: timestamp ?? Date.now(),
      leftDuration: 0,
      rightDuration: 0,
      amountMl: 0,
      notes: notes ?? '',
    };
    try {
      await insertLog(db, log);
      await refreshLogs();
      await loadSolidsHistory();
      await afterInsert(log, babies);
    } catch (error) {
      console.error('Failed to log solids:', error);
      throw error;
    }
  };

  // ─── Diaper ──────────────────────────────────────────────────────────────────

  const logDiaper = async (status: DiaperLog['status'], notes?: string, timestamp?: number): Promise<void> => {
    if (!activeBabyId) return;
    const log: DiaperLog = {
      id: Crypto.randomUUID(),
      babyId: activeBabyId,
      type: 'diaper',
      status,
      timestamp: timestamp ?? Date.now(),
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
        cancelSleep,
        stopSleep,
        toggleBreastFeed,
        adjustFeedStart,
        saveBreastFeed,
        logBottle,
        logSolids,
        logDiaper,
        solidsFoodHistory,
        historyLogs,
        historyDate,
        loadHistoryDate,
        clearHistory,
        logBreastFeedManual,
        removeLog,
        createBaby: handleCreateBaby,
        updateBaby: handleUpdateBaby,
        updateSleepStart,
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
