import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { Baby } from '../types/baby';
import { BabyLog, ActiveTrackers, SleepLog } from '../types/tracker';
import { fetchBabies, fetchLogsForBaby, insertLog, deleteLog, createBaby } from '@services/db';

interface TrackerContextType {
  babies: Baby[];
  activeBabyId: string | null;
  setActiveBabyId: (id: string) => void;
  logs: BabyLog[];
  active: ActiveTrackers;
  refreshLogs: () => Promise<void>;
  startSleep: () => void;
  stopSleep: (notes?: string) => Promise<void>;
  // Stubs — implemented in later phases
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

const TrackerContext = createContext<TrackerContextType | undefined>(undefined);

export const TrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const db = useSQLiteContext();
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

  const handleCreateBaby = async (name: string, dob: number): Promise<void> => {
    try {
      const baby = await createBaby(db, name, dob);
      setBabies(prev => [...prev, baby]);
      if (!hasSetInitialBaby.current) {
        hasSetInitialBaby.current = true;
        setActiveBabyId(baby.id);
      }
    } catch (error) {
      console.error('Failed to create baby:', error);
      throw error;
    }
  };

  const removeLog = async (id: string): Promise<void> => {
    try {
      await deleteLog(db, id);
      await refreshLogs();
    } catch (error) {
      console.error('Failed to remove log:', error);
      throw error;
    }
  };

  // --- Sleep ---

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
    } catch (error) {
      console.error('Failed to stop sleep:', error);
      throw error;
    }
  };

  // --- Stubs (Phases 3–5) ---

  const toggleBreastFeed = (_side: 'left' | 'right'): void => {
    // Phase 3
  };

  const saveBreastFeed = async (_notes?: string): Promise<void> => {
    // Phase 3
  };

  const logBottle = async (_amountMl: number, _notes?: string): Promise<void> => {
    // Phase 4
  };

  const logSolids = async (_notes?: string): Promise<void> => {
    // Phase 4
  };

  const logDiaper = async (
    _status: 'wet' | 'dirty' | 'mixed' | 'dry',
    _notes?: string,
  ): Promise<void> => {
    // Phase 5
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
