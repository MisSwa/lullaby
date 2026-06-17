export type LogType = 'sleep' | 'feed' | 'diaper';

export interface BaseLog {
  id: string;
  timestamp: number; // Unix epoch ms — start time / event time
  notes: string;
}

export interface SleepLog extends BaseLog {
  type: 'sleep';
  babyId: string;
  endTime: number | null; // null = session still active
}

export interface FeedLog extends BaseLog {
  type: 'feed';
  babyId: string;
  feedType: 'breast' | 'bottle' | 'solids';
  leftDuration: number; // seconds on left breast
  rightDuration: number; // seconds on right breast
  amountMl: number; // for bottle entries; 0 otherwise
}

export interface DiaperLog extends BaseLog {
  type: 'diaper';
  babyId: string;
  status: 'wet' | 'dirty' | 'mixed' | 'dry';
}

export type BabyLog = SleepLog | FeedLog | DiaperLog;

export interface ActiveTrackers {
  sleepStart: number | null; // Unix epoch ms
  feedLeftStart: number | null; // Unix epoch ms
  feedRightStart: number | null; // Unix epoch ms
  feedLeftElapsed: number; // accumulated seconds
  feedRightElapsed: number; // accumulated seconds
}

// ─── App Settings ────────────────────────────────────────────────────────────

export type AppTheme = 'system' | 'light' | 'dark';
export type AppUnits = 'ml' | 'oz';
export type AppTimeFormat = '12h' | '24h';

// ─── Notification Settings ───────────────────────────────────────────────────

export type NotificationType = 'feed' | 'diaper' | 'sleep';

export interface NotificationPref {
  enabled: boolean;
  thresholdMinutes: number;
}

export interface NotificationSettings {
  feed: NotificationPref;
  diaper: NotificationPref;
  sleep: NotificationPref;
}

// ─── Nudge State ─────────────────────────────────────────────────────────────

export interface HasSeenNudge {
  sleep: boolean;
  feed: boolean;
  diaper: boolean;
  solids: boolean;
}
