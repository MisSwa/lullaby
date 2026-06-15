# Phase 3 — Breast Feed Tracking: Requirements

## Scope

Implement left/right breast-feed timer buttons on the Dashboard, with auto-pause toggle behaviour, AppState-correct elapsed display, and a `NotesModal`-gated save that writes a `FeedLog` to SQLite.

---

## 1. Data Model

### `FeedLog` (already defined in `src/types/tracker.ts`)

```ts
interface FeedLog extends BaseLog {
  type: 'feed';
  babyId: string;
  feedType: 'breast' | 'bottle' | 'solids';
  leftDuration: number;   // seconds
  rightDuration: number;  // seconds
  amountMl: number;       // 0 for breast
  notes: string;
}
```

### `ActiveTrackers` (already defined, no changes needed)

```ts
interface ActiveTrackers {
  sleepStart: number | null;
  feedLeftStart: number | null;   // Unix ms timestamp when left side last started
  feedRightStart: number | null;  // Unix ms timestamp when right side last started
  feedLeftElapsed: number;        // accumulated seconds (excluding current run)
  feedRightElapsed: number;       // accumulated seconds (excluding current run)
}
```

---

## 2. `TrackerContext` — `toggleBreastFeed`

Signature (already declared as a stub):
```ts
toggleBreastFeed: (side: 'left' | 'right') => void;
```

Behaviour:

| Current state of pressed side | Action |
|---|---|
| Stopped (`start === null`) | Set `start = Date.now()`. If opposite side is running, pause opposite side first (accumulate its elapsed, clear its start). |
| Running (`start !== null`) | Accumulate: `elapsed += Math.floor((Date.now() - start) / 1000)`. Clear `start = null`. |

- Auto-pause rule: only one side may be running at a time. Pressing one side while the other is running pauses the other first.
- This is a synchronous state update (`setActive`), no SQLite I/O.

---

## 3. `TrackerContext` — `saveBreastFeed`

Signature (already declared as a stub):
```ts
saveBreastFeed: (notes?: string) => Promise<void>;
```

Behaviour:
1. Guard: if both `feedLeftElapsed === 0` and `feedRightElapsed === 0` and both starts are null, return early.
2. Finalise durations: if a side's `start` is non-null (i.e. still running when Save is tapped), add live time: `elapsed + Math.floor((Date.now() - start) / 1000)`.
3. Build log:
   ```ts
   const log: FeedLog = {
     id: Crypto.randomUUID(),
     babyId: activeBabyId,
     type: 'feed',
     feedType: 'breast',
     timestamp: Date.now(),
     leftDuration: finalLeft,
     rightDuration: finalRight,
     amountMl: 0,
     notes: notes ?? '',
   };
   ```
4. `await insertLog(db, log)`
5. Reset active feed state: set all four feed fields back to initial (`null` / `0`).
6. `await refreshLogs()`
7. On error: `console.error` + `throw`.

---

## 4. Dashboard — Feed Buttons Layout

- Below the sleep button (same `actionZone`), add a new row for feed controls.
- Two side-by-side buttons: **L** (left) and **R** (right).
- Each button:
  - Shows side label on top row
  - Shows `formatFeedElapsed(totalSecs)` on second row (see §5)
  - Active state (running): distinct background color (`COLORS.active`)
  - Idle state: `COLORS.feed` background
- Save button: appears in the same row when `(feedLeftElapsed + feedRightElapsed) > 0`. Tapping Save opens `NotesModal`.
- Feed buttons and Save are disabled while sleep is in progress (`isSleeping === true`).

---

## 5. Elapsed Format

### `formatFeedElapsed(secs: number): string`

| Input | Output |
|---|---|
| 0 | `'0m 0s'` |
| 32 | `'0m 32s'` |
| 90 | `'1m 30s'` |
| 3661 | `'61m 1s'` |

No hours unit — breast feed sessions are always sub-60-minute in practice, but the format handles overflow naturally.

---

## 6. `NotesModal` Usage for Feed

- `title`: `'End Feed Session'`
- `elapsed`: combined elapsed string, e.g. `'L 4m 32s · R 2m 10s'`
  - Omit a side if its total duration is `0`
  - If both sides have elapsed: `'L Xm Ys · R Xm Ys'`
  - If only left: `'L Xm Ys'`
  - If only right: `'R Xm Ys'`
- `onSave`: calls `saveBreastFeed(notes)` then closes modal
- `onDismiss`: closes modal without saving; timer state is preserved

---

## 7. `LogCard` — Feed Duration Display

### `durationForLog` update

```ts
function durationForLog(log: BabyLog): string {
  if (log.type === 'sleep') { /* existing */ }
  if (log.type === 'feed') {
    const f = log as FeedLog;
    if (f.feedType !== 'breast') return '';
    const parts: string[] = [];
    if (f.leftDuration > 0) parts.push(`L ${formatFeedElapsed(f.leftDuration)}`);
    if (f.rightDuration > 0) parts.push(`R ${formatFeedElapsed(f.rightDuration)}`);
    return parts.join(' · ');
  }
  return '';
}
```

Result examples:
- Left 4m 32s, right 2m 10s → `'L 4m 32s · R 2m 10s'`
- Left only → `'L 4m 32s'`
- Right only → `'R 2m 10s'`

---

## 8. AppState Accuracy

- `useLiveTick` already fires an immediate tick on app resume — no additional work needed.
- Feed timers use absolute Unix `start` timestamps; accumulated elapsed is stored in context state. The live total is always recomputed from `Date.now()` on each tick, so background time passes correctly.

---

## 9. No-Change Contract

- `useLiveTick` — no changes (already handles both sleep and feed use cases)
- `NotesModal` — no changes
- `src/types/tracker.ts` — no changes
- `src/services/db.ts` — no changes (existing `insertLog` already serialises all `FeedLog` fields)
- `COLORS` — no new colors; use existing `COLORS.feed` and `COLORS.active`
