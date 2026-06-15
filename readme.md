Act as an elite React Native & TypeScript Staff Engineer. We are building Project "Lullaby," a high-performance, local-first premium baby tracking app modeled after Huckleberry's frictionless one-handed flows, priced at $5 upfront on the Play Store. 

Follow this strict Development Constitution:
1. Palette Swap: Absolutely NO Huckleberry purple. Use a high-end, soothing Sage Green and Slate palette.
2. Architecture: Pure React Context + Native Hooks for state. No extra dependencies except 'expo-sqlite'.
3. Zero-Drop Background State: Timers must preserve absolute Unix timestamps to protect data accuracy across Android background cycles using AppState listeners.
4. Paid-App Code Hygiene: Strict type-safety, user-facing try/catch boundaries, explicit fallback views.

Generate the exact codebase structured across these 5 system files. Create them exactly as written below:



1. The Color Palette Engine

// File: src/theme/colors.ts
export const COLORS = {
  // Brand Foundation (High-end Sage & Slate)
  primary: '#5F7A61',       // Deep Premium Sage Green
  primaryLight: '#D5E0D5',  // Soft Wash Sage
  background: '#F8F9FA',    // Clean Slate Off-White
  surface: '#FFFFFF',       // Card Backgrounds
  textPrimary: '#2D3748',   // Deep Charcoal Slate
  textMuted: '#718096',     // Soft Gray Text
  border: '#E2E8F0',        // Subtle Divider Line

  // State-Specific Action Metrics (Muted Premium Pastels)
  sleep: '#4A6FA5',         // Soft Evening Indigo
  feed: '#D97706',          // Warm Amber
  diaper: '#8C6239',        // Soft Earth Clay
  active: '#10B981',        // Vibrant Active Emerald Timer

  // UI Status
  error: '#EF4444',
  success: '#10B981',
};

export const TYPOGRAPHY = {
  fontFamily: 'System',
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 22,
    title: 28,
  }
};


2. The Absolute Type Contracts


// File: src/types/tracker.ts
export type LogType = 'sleep' | 'feed' | 'diaper';

export interface BaseLog {
  id: string;
  timestamp: number; // Absolute Unix Epoch
  notes: string;
}

export interface SleepLog extends BaseLog {
  type: 'sleep';
  endTime: number | null; // null represents an ongoing active session
}

export interface FeedLog extends BaseLog {
  type: 'feed';
  feedType: 'breast' | 'bottle' | 'solids';
  leftDuration: number;  // Seconds spent feeding on left breast
  rightDuration: number; // Seconds spent feeding on right breast
  amountMl: number;      // Measurement for bottle entries
}

export interface DiaperLog extends BaseLog {
  type: 'diaper';
  status: 'wet' | 'dirty' | 'mixed' | 'dry';
}

export type BabyLog = SleepLog | FeedLog | DiaperLog;

export interface ActiveTrackers {
  sleepStart: number | null;
  feedLeftStart: number | null;
  feedRightStart: number | null;
  feedLeftElapsed: number;
  feedRightElapsed: number;
}



3. The Local-First SQLite Database Driver


// File: src/services/db.ts
import * as SQLite from 'expo-sqlite';
import { BabyLog, SleepLog, FeedLog, DiaperLog } from '../types/tracker';

const DB_NAME = 'lullaby_local.db';

export async function initializeDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await db.execAsync('PRAGMA foreign_keys = ON;');
    
    // Core consolidated master tracker table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS baby_logs (
        id TEXT PRIMARY KEY NOT NULL,
        type TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        notes TEXT,
        endTime INTEGER,
        feedType TEXT,
        leftDuration INTEGER,
        rightDuration INTEGER,
        amountMl INTEGER,
        status TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON baby_logs (timestamp DESC);
    `);
    console.log('Lullaby local database initialized smoothly.');
  } catch (error) {
    console.error('Critical database execution structural error:', error);
  }
}

export async function insertLog(db: SQLite.SQLiteDatabase, log: BabyLog): Promise<void> {
  const query = `
    INSERT INTO baby_logs (id, type, timestamp, notes, endTime, feedType, leftDuration, rightDuration, amountMl, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;
  
  const params = [
    log.id,
    log.type,
    log.timestamp,
    log.notes || '',
    log.type === 'sleep' ? log.endTime : null,
    log.type === 'feed' ? log.feedType : null,
    log.type === 'feed' ? log.leftDuration : null,
    log.type === 'feed' ? log.rightDuration : null,
    log.type === 'feed' ? log.amountMl : null,
    log.type === 'diaper' ? log.status : null,
  ];

  await db.runAsync(query, params);
}

export async function fetchAllLogs(db: SQLite.SQLiteDatabase): Promise<BabyLog[]> {
  const rows = await db.getAllAsync<any>('SELECT * FROM baby_logs ORDER BY timestamp DESC;');
  return rows.map(row => ({
    id: row.id,
    type: row.type,
    timestamp: row.timestamp,
    notes: row.notes,
    ...(row.type === 'sleep' && { endTime: row.endTime }),
    ...(row.type === 'feed' && {
      feedType: row.feedType,
      leftDuration: row.leftDuration,
      rightDuration: row.rightDuration,
      amountMl: row.amountMl
    }),
    ...(row.type === 'diaper' && { status: row.status })
  })) as BabyLog[];
}

export async function deleteLog(db: SQLite.SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM baby_logs WHERE id = ?;', [id]);
}



4. The Resilient Background State Tracker Engine


// File: src/context/TrackerContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { BabyLog, ActiveTrackers } from '../types/tracker';
import { fetchAllLogs, insertLog, deleteLog as dbDeleteLog } from '../services/db';

interface TrackerContextType {
  logs: BabyLog[];
  active: ActiveTrackers;
  startSleep: () => void;
  stopSleep: (notes?: string) => Promise<void>;
  toggleBreastFeed: (side: 'left' | 'right') => void;
  saveBreastFeed: (notes?: string) => Promise<void>;
  logDiaper: (status: 'wet' | 'dirty' | 'mixed' | 'dry', notes?: string) => Promise<void>;
  removeLog: (id: string) => Promise<void>;
  refreshLogs: () => Promise<void>;
}

const TrackerContext = createContext<TrackerContextType | undefined>(undefined);

export const TrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const db = useSQLiteContext();
  const [logs, setLogs] = useState<BabyLog[]>([]);
  const [active, setActive] = useState<ActiveTrackers>({
    sleepStart: null,
    feedLeftStart: null,
    feedRightStart: null,
    feedLeftElapsed: 0,
    feedRightElapsed: 0,
  });

  const appState = useRef(AppState.currentState);
  const activeRef = useRef(active);
  activeRef.current = active;

  const refreshLogs = async () => {
    try {
      const data = await fetchAllLogs(db);
      setLogs(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshLogs();

    // Absolute Unix Sync Delta verification hook on Android wake sequence
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        const now = Date.now();
        setActive(prev => {
          let updatedLeft = prev.feedLeftElapsed;
          let updatedRight = prev.feedRightElapsed;

          if (prev.feedLeftStart) {
            updatedLeft += Math.floor((now - prev.feedLeftStart) / 1000);
          }
          if (prev.feedRightStart) {
            updatedRight += Math.floor((now - prev.feedRightStart) / 1000);
          }

          return {
            ...prev,
            feedLeftStart: prev.feedLeftStart ? now : null,
            feedRightStart: prev.feedRightStart ? now : null,
            feedLeftElapsed: updatedLeft,
            feedRightElapsed: updatedRight,
          };
        });
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [db]);

  const startSleep = () => {
    setActive(prev => ({ ...prev, sleepStart: Date.now() }));
  };

  const stopSleep = async (notes = '') => {
    if (!active.sleepStart) return;
    const newLog: BabyLog = {
      id: Math.random().toString(36).substring(7),
      type: 'sleep',
      timestamp: active.sleepStart,
      endTime: Date.now(),
      notes,
    };
    await insertLog(db, newLog);
    setActive(prev => ({ ...prev, sleepStart: null }));
    await refreshLogs();
  };

  const toggleBreastFeed = (side: 'left' | 'right') => {
    const now = Date.now();
    setActive(prev => {
      const isCurrentSideRunning = side === 'left' ? prev.feedLeftStart : prev.feedRightStart;
      
      if (isCurrentSideRunning) {
        // Pausing the timer
        const elapsedDelta = Math.floor((now - (isCurrentSideRunning as number)) / 1000);
        return {
          ...prev,
          feedLeftStart: side === 'left' ? null : prev.feedLeftStart,
          feedRightStart: side === 'right' ? null : prev.feedRightStart,
          feedLeftElapsed: side === 'left' ? prev.feedLeftElapsed + elapsedDelta : prev.feedLeftElapsed,
          feedRightElapsed: side === 'right' ? prev.feedRightElapsed + elapsedDelta : prev.feedRightElapsed,
        };
      } else {
        // Starting the timer & pausing opposite if running
        let updatedLeftElapsed = prev.feedLeftElapsed;
        let updatedRightElapsed = prev.feedRightElapsed;
        
        if (prev.feedLeftStart) updatedLeftElapsed += Math.floor((now - prev.feedLeftStart) / 1000);
        if (prev.feedRightStart) updatedRightElapsed += Math.floor((now - prev.feedRightStart) / 1000);

        return {
          ...prev,
          feedLeftStart: side === 'left' ? now : null,
          feedRightStart: side === 'right' ? now : null,
          feedLeftElapsed: updatedLeftElapsed,
          feedRightElapsed: updatedRightElapsed,
        };
      }
    });
  };

  const saveBreastFeed = async (notes = '') => {
    const now = Date.now();
    let finalLeft = active.feedLeftElapsed;
    let finalRight = active.feedRightElapsed;

    if (active.feedLeftStart) finalLeft += Math.floor((now - active.feedLeftStart) / 1000);
    if (active.feedRightStart) finalRight += Math.floor((now - active.feedRightStart) / 1000);

    if (finalLeft === 0 && finalRight === 0) return;

    const newLog: BabyLog = {
      id: Math.random().toString(36).substring(7),
      type: 'feed',
      timestamp: Date.now(),
      feedType: 'breast',
      leftDuration: finalLeft,
      rightDuration: finalRight,
      amountMl: 0,
      notes,
    };

    await insertLog(db, newLog);
    setActive(prev => ({
      ...prev,
      feedLeftStart: null,
      feedRightStart: null,
      feedLeftElapsed: 0,
      feedRightElapsed: 0,
    }));
    await refreshLogs();
  };

  const logDiaper = async (status: 'wet' | 'dirty' | 'mixed' | 'dry', notes = '') => {
    const newLog: BabyLog = {
      id: Math.random().toString(36).substring(7),
      type: 'diaper',
      timestamp: Date.now(),
      status,
      notes,
    };
    await insertLog(db, newLog);
    await refreshLogs();
  };

  const removeLog = async (id: string) => {
    await dbDeleteLog(db, id);
    await refreshLogs();
  };

  return (
    <TrackerContext.Provider value={{
      logs, active, startSleep, stopSleep, toggleBreastFeed, saveBreastFeed, logDiaper, removeLog, refreshLogs
    }}>
      {children}
    </TrackerContext.Provider>
  );
};

export const useTracker = () => {
  const context = useContext(TrackerContext);
  if (!context) throw new Error('useTracker must be explicitly parsed down inside TrackerProvider layout context trees.');
  return context;
};


5. The One-Handed Core Dashboard Controller (UI Layout Hub)


// File: src/screens/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useTracker } from '../context/TrackerContext';
import { COLORS, TYPOGRAPHY } from '../theme/colors';

export const Dashboard: React.FC = () => {
  const { logs, active, startSleep, stopSleep, toggleBreastFeed, saveBreastFeed, logDiaper, removeLog } = useTracker();
  const [sleepTime, setSleepTime] = useState(0);

  // Live UI tick updates for running active sessions
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (active.sleepStart) {
      interval = setInterval(() => {
        setSleepTime(Math.floor((Date.now() - (active.sleepStart as number)) / 1000));
      }, 1000);
    } else {
      setSleepTime(0);
    }
    return () => clearInterval(interval);
  }, [active.sleepStart]);

  const formatSeconds = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Project Lullaby</Text>
        <Text style={styles.subtitle}>Premium One-Hand Track Center</Text>
      </View>

      {/* Tactile Large Interactive Target Core Zone */}
      <View style={styles.actionGrid}>
        {/* Sleep Loop Toggle */}
        <TouchableOpacity 
          style={[styles.bigCircle, { backgroundColor: active.sleepStart ? COLORS.active : COLORS.sleep }]}
          onPress={() => active.sleepStart ? stopSleep('Logged via single tap dashboard') : startSleep()}
        >
          <Text style={styles.circleText}>{active.sleepStart ? 'Wake Up' : 'Track Sleep'}</Text>
          {active.sleepStart > 0 && <Text style={styles.timerSub}>{formatSeconds(sleepTime)}</Text>}
        </TouchableOpacity>

        {/* Nursing Matrix Controls */}
        <View style={styles.breastRow}>
          <TouchableOpacity 
            style={[styles.halfButton, active.feedLeftStart && { backgroundColor: COLORS.active }]} 
            onPress={() => toggleBreastFeed('left')}
          >
            <Text style={styles.buttonText}>Left {active.feedLeftElapsed > 0 ? `(${active.feedLeftElapsed}s)` : ''}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.halfButton, active.feedRightStart && { backgroundColor: COLORS.active }]} 
            onPress={() => toggleBreastFeed('right')}
          >
            <Text style={styles.buttonText}>Right {active.feedRightElapsed > 0 ? `(${active.feedRightElapsed}s)` : ''}</Text>
          </TouchableOpacity>
        </View>
        
        {(active.feedLeftElapsed > 0 || active.feedRightElapsed > 0) && (
          <TouchableOpacity style={styles.saveFeedButton} onPress={() => saveBreastFeed('Nursing complete.')}>
            <Text style={styles.buttonText}>Save Complete Feeding Session</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.sectionDividerTitle}>Today's Event Logs</Text>
      
      {/* Scrollable Reverse Chronological Clean Feed */}
      <ScrollView style={styles.timelineList}>
        {logs.length === 0 ? (
          <Text style={styles.emptyText}>No data logged today. Tap any target above to begin track.</Text>
        ) : (
          logs.map((item) => (
            <View key={item.id} style={styles.logCard}>
              <View style={[styles.colorIndicatorStrip, { 
                backgroundColor: item.type === 'sleep' ? COLORS.sleep : item.type === 'feed' ? COLORS.feed : COLORS.diaper 
              }]} />
              <View style={styles.cardInfoBody}>
                <Text style={styles.logMainTitle}>{item.type.toUpperCase()}</Text>
                <Text style={styles.logTimestampSub}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                {item.notes && <Text style={styles.logNoteString}>{item.notes}</Text>}
              </View>
              <TouchableOpacity style={styles.deleteActionArea} onPress={() => removeLog(item.id)}>
                <Text style={styles.deleteTextIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  title: { fontSize: TYPOGRAPHY.size.title, fontWeight: 'bold', color: COLORS.primary },
  subtitle: { fontSize: TYPOGRAPHY.size.sm, color: COLORS.textMuted },
  actionGrid: { padding: 24, alignment: 'center', backgroundColor: COLORS.surface, borderBottomWidth: 1, borderColor: COLORS.border },
  bigCircle: { width: '100%', height: 90, borderRadius: 16, backgroundColor: COLORS.sleep, justifyContent: 'center', alignItems: 'center', marginVertical: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  circleText: { color: COLORS.surface, fontSize: TYPOGRAPHY.size.lg, fontWeight: 'bold' },
  timerSub: { color: COLORS.surface, fontSize: TYPOGRAPHY.size.sm, marginTop: 4 },
  breastRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  halfButton: { flex: 0.48, height: 55, borderRadius: 12, backgroundColor: COLORS.feed, justifyContent: 'center', alignItems: 'center' },
  saveFeedButton: { backgroundColor: COLORS.primary, width: '100%', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  buttonText: { color: COLORS.surface, fontWeight: 'bold', fontSize: TYPOGRAPHY.size.base },
  sectionDividerTitle: { paddingHorizontal: 24, marginTop: 20, marginBottom: 8, fontSize: TYPOGRAPHY.size.sm, fontWeight: 'bold', color: COLORS.textMuted, textTransform: 'uppercase' },
  timelineList: { flex: 1, paddingHorizontal: 24 },
  emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: 40, fontSize: TYPOGRAPHY.size.base },
  logCard: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 12, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, elevation: 1 },
  colorIndicatorStrip: { width: 6, height: '100%' },
  cardInfoBody: { flex: 1, padding: 14 },
  logMainTitle: { fontSize: TYPOGRAPHY.size.sm, fontWeight: 'bold', color: COLORS.textPrimary },
  logTimestampSub: { fontSize: TYPOGRAPHY.size.xs, color: COLORS.textMuted, marginTop: 2 },
  logNoteString: { fontSize: TYPOGRAPHY.size.sm, color: COLORS.textPrimary, marginTop: 6, fontStyle: 'italic' },
  deleteActionArea: { width: 50, justifyContent: 'center', alignItems: 'center', borderLeftWidth: 1, borderLeftColor: COLORS.border },
  deleteTextIcon: { color: COLORS.textMuted, fontSize: TYPOGRAPHY.size.base },
});



How to link everything inside



import React from 'react';
import { Suspense, ActivityIndicator, View } from 'react-native';
import { SQLiteProvider } from 'expo-sqlite';
import { initializeDatabase } from './src/services/db';
import { TrackerProvider } from './src/context/TrackerContext';
import { Dashboard } from './src/screens/Dashboard';

export default function App() {
  return (
    <Suspense fallback={
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#5F7A61" />
      </View>
    }>
      <SQLiteProvider databaseName="lullaby_local.db" onInit={initializeDatabase}>
        <TrackerProvider>
          <Dashboard />
        </TrackerProvider>
      </SQLiteProvider>
    </Suspense>
  );
}


