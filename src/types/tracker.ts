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
