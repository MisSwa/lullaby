import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { Baby } from '../types/baby';
import { BabyLog, SleepLog, FeedLog, DiaperLog } from '../types/tracker';

export async function initializeDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await db.execAsync('PRAGMA foreign_keys = ON;');

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS babies (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        dob INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS baby_logs (
        id TEXT PRIMARY KEY NOT NULL,
        baby_id TEXT NOT NULL,
        type TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        notes TEXT,
        endTime INTEGER,
        feedType TEXT,
        leftDuration INTEGER,
        rightDuration INTEGER,
        amountMl REAL,
        status TEXT,
        FOREIGN KEY (baby_id) REFERENCES babies(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_logs_baby_timestamp ON baby_logs (baby_id, timestamp DESC);
    `);

    console.warn('Lullaby database initialized (WAL mode, FK enabled).');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export async function createBaby(
  db: SQLite.SQLiteDatabase,
  name: string,
  dob: number,
): Promise<Baby> {
  const baby: Baby = {
    id: Crypto.randomUUID(),
    name,
    dob,
    createdAt: Date.now(),
  };

  try {
    await db.runAsync('INSERT INTO babies (id, name, dob, created_at) VALUES (?, ?, ?, ?);', [
      baby.id,
      baby.name,
      baby.dob,
      baby.createdAt,
    ]);
    return baby;
  } catch (error) {
    console.error('Failed to create baby:', error);
    throw error;
  }
}

export async function fetchBabies(db: SQLite.SQLiteDatabase): Promise<Baby[]> {
  try {
    const rows = await db.getAllAsync<{
      id: string;
      name: string;
      dob: number;
      created_at: number;
    }>('SELECT * FROM babies ORDER BY created_at ASC;');

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      dob: row.dob,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error('Failed to fetch babies:', error);
    throw error;
  }
}

export async function insertLog(db: SQLite.SQLiteDatabase, log: BabyLog): Promise<void> {
  const query = `
    INSERT INTO baby_logs (id, baby_id, type, timestamp, notes, endTime, feedType, leftDuration, rightDuration, amountMl, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;

  const params: (string | number | null)[] = [
    log.id,
    log.babyId,
    log.type,
    log.timestamp,
    log.notes ?? '',
    log.type === 'sleep' ? (log as SleepLog).endTime : null,
    log.type === 'feed' ? (log as FeedLog).feedType : null,
    log.type === 'feed' ? (log as FeedLog).leftDuration : null,
    log.type === 'feed' ? (log as FeedLog).rightDuration : null,
    log.type === 'feed' ? (log as FeedLog).amountMl : null,
    log.type === 'diaper' ? (log as DiaperLog).status : null,
  ];

  try {
    await db.runAsync(query, params);
  } catch (error) {
    console.error('Failed to insert log:', error);
    throw error;
  }
}

export async function fetchLogsForBaby(
  db: SQLite.SQLiteDatabase,
  babyId: string,
  dateStart: number,
  dateEnd: number,
): Promise<BabyLog[]> {
  try {
    const rows = await db.getAllAsync<{
      id: string;
      baby_id: string;
      type: string;
      timestamp: number;
      notes: string;
      endTime: number | null;
      feedType: string | null;
      leftDuration: number | null;
      rightDuration: number | null;
      amountMl: number | null;
      status: string | null;
    }>(
      'SELECT * FROM baby_logs WHERE baby_id = ? AND timestamp >= ? AND timestamp <= ? ORDER BY timestamp DESC;',
      [babyId, dateStart, dateEnd],
    );

    return rows.map(row => {
      const base = {
        id: row.id,
        babyId: row.baby_id,
        timestamp: row.timestamp,
        notes: row.notes ?? '',
      };

      if (row.type === 'sleep') {
        return { ...base, type: 'sleep' as const, endTime: row.endTime } satisfies SleepLog;
      }
      if (row.type === 'feed') {
        return {
          ...base,
          type: 'feed' as const,
          feedType: (row.feedType ?? 'breast') as FeedLog['feedType'],
          leftDuration: row.leftDuration ?? 0,
          rightDuration: row.rightDuration ?? 0,
          amountMl: row.amountMl ?? 0,
        } satisfies FeedLog;
      }
      return {
        ...base,
        type: 'diaper' as const,
        status: (row.status ?? 'wet') as DiaperLog['status'],
      } satisfies DiaperLog;
    });
  } catch (error) {
    console.error('Failed to fetch logs:', error);
    throw error;
  }
}

export async function deleteLog(db: SQLite.SQLiteDatabase, id: string): Promise<void> {
  try {
    await db.runAsync('DELETE FROM baby_logs WHERE id = ?;', [id]);
  } catch (error) {
    console.error('Failed to delete log:', error);
    throw error;
  }
}
