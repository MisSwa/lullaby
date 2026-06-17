# Phase 2 — Sleep Tracking: Requirements

## Scope

This phase adds the first tracking feature: sleep. A parent can start a session with one tap, see a live elapsed timer, and stop the session through a brief notes modal before saving. All saved sessions appear in a reverse-chronological log list for today.

No other tracker types (feed, diaper) are implemented in this phase.

---

## New Files

```
src/
  hooks/
    useLiveTick.ts         — 1-second interval hook with AppState resume sync
  modals/
    NotesModal.tsx         — optional notes input before saving a session
```

**Modified files:**
- `src/context/TrackerContext.tsx` — implement `startSleep`, `stopSleep`; fix `active` state setter
- `src/screens/Dashboard.tsx` — replace placeholder with sleep button + log list

No new dependencies. No new database functions (`insertLog` already exists from Phase 0).

---

## useLiveTick

```ts
function useLiveTick(startTimestamp: number | null): number
```

- Returns `0` when `startTimestamp` is null.
- When `startTimestamp` is non-null, returns `Math.floor((Date.now() - startTimestamp) / 1000)`, updated every second.
- Fires an immediate tick on mount and whenever `startTimestamp` changes to avoid a 1-second delay on first render.
- Subscribes to `AppState 'change'` events; fires a tick immediately when `nextState === 'active'` to re-sync display after the app was backgrounded (iOS throttles `setInterval` in background).
- Cleans up both the interval and the `AppState` subscription on unmount.

**Why no correction needed in context:** Sleep stores an absolute Unix start timestamp (`sleepStart: number`). Elapsed is always computed as `Date.now() - sleepStart`, which is inherently accurate regardless of how long the app was backgrounded. The `useLiveTick` AppState listener handles the display update on resume — no state mutation in `TrackerContext` is required.

---

## NotesModal

```ts
interface NotesModalProps {
  visible: boolean;
  title: string;
  elapsed: string;       // e.g. '1h 23m' — shown for context
  onSave: (notes: string) => Promise<void>;
  onDismiss: () => void;
}
```

- `animationType='slide'`, `transparent={false}`
- Notes `TextInput`: optional, `multiline`, `maxLength=200`, placeholder `'Add a note...'`
- `'Save'` button: always enabled (notes are optional); shows `ActivityIndicator` while `onSave` is in flight
- `'Cancel'` button: always enabled; calls `onDismiss`; does not close modal on its own (parent controls `visible`)
- Parent hides modal after `onSave` resolves; `NotesModal` never calls `onDismiss` after save

---

## TrackerContext changes

### active state

Change the declaration from:
```ts
const [active] = useState<ActiveTrackers>(INITIAL_ACTIVE);
```
to:
```ts
const [active, setActive] = useState<ActiveTrackers>(INITIAL_ACTIVE);
```

The `setActive` setter is used only within context action implementations — never exposed on the context interface.

### startSleep

```ts
const startSleep = (): void => {
  setActive(prev => ({ ...prev, sleepStart: Date.now() }));
};
```

Idempotent — calling it while a session is already active replaces the start time. The UI prevents double-taps by showing the stop path when `active.sleepStart` is non-null.

### stopSleep

```ts
const stopSleep = async (notes = ''): Promise<void> => {
  if (!active.sleepStart || !activeBabyId) return;
  const log: SleepLog = {
    id: Crypto.randomUUID(),
    babyId: activeBabyId,
    type: 'sleep',
    timestamp: active.sleepStart,   // start time
    endTime: Date.now(),             // end time
    notes,
  };
  await insertLog(db, log);
  setActive(prev => ({ ...prev, sleepStart: null }));
  await refreshLogs();
};
```

Wrapped in `try/catch`; re-throws after `console.error` so the calling UI can handle the error.

---

## Dashboard layout

```
SafeAreaView (COLORS.background)
├── DashboardHeader
├── Action Zone (View, padding 24)
│   └── Sleep Button (TouchableOpacity, height 90, borderRadius 16, full width)
├── Section label 'TODAY' (Text, COLORS.textMuted, uppercase)
└── ScrollView (flex 1)
    └── LogCard × N  (or empty state text)
```

### Sleep button states

| State | Background | Label |
|---|---|---|
| Idle | `COLORS.sleep` | `'Track Sleep'` |
| Active | `COLORS.active` | `'Wake Up  ·  Xh Ym'` |

Tap when idle → `startSleep()`
Tap when active → open `NotesModal` (timer keeps running while modal is open)

### Elapsed time format

```
0 – 59 seconds  →  '0m'
1 – 59 minutes  →  '23m'
1+ hours        →  '1h 23m'
```

Seconds are not shown on the button. `useLiveTick` still ticks every second so the minute updates precisely.

### LogCard

Each card is a horizontal row:

```
[6px color strip] [card body: flex 1] [delete zone: 50px]
```

- **Color strip:** `COLORS.sleep` for sleep logs
- **Card body:**
  - Type label: `'SLEEP'` — `TYPOGRAPHY.size.sm`, bold, `COLORS.textPrimary`
  - Time: start time formatted as `HH:MM` — `TYPOGRAPHY.size.xs`, `COLORS.textMuted`
  - Duration: `endTime` present → formatted as `Xh Ym` or `Xm`; `endTime` null → `'In progress'` in `COLORS.active`
  - Notes: only rendered when non-empty — italic, `COLORS.textPrimary`
- **Delete zone:** `'✕'` in `COLORS.textMuted`; calls `removeLog(item.id)`

### Empty state

When `logs.length === 0`:
```
centered Text: 'No logs yet today.'  COLORS.textMuted
```

---

## Constraints (from CLAUDE.md & tech-stack.md)

- `Crypto.randomUUID()` for the log ID — no `Math.random()`
- All timestamps as Unix epoch ms
- All colors via `COLORS` — no hardcoded hex
- `StyleSheet.create()` for all styles
- Touch targets minimum 44×44pt — sleep button at 90px height satisfies this
- `try/catch` around all async DB calls, errors re-thrown after `console.error`
- No `any` types

---

## Out of Scope

- Feed and diaper tracking (Phases 3–5)
- Editing a saved sleep log
- Viewing logs beyond today
- Push notifications (Phase 6)
