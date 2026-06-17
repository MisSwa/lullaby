# Phase 2 — Sleep Tracking: Implementation Plan

Each group is independently completable in order.

---

## Group 1: useLiveTick hook

1.1 Create `src/hooks/useLiveTick.ts`.

1.2 Signature:
  ```ts
  export function useLiveTick(startTimestamp: number | null): number
  ```
  Returns elapsed seconds as a `number` (0 when `startTimestamp` is null).

1.3 Implementation:
  - On mount (or when `startTimestamp` changes to non-null): fire an immediate tick, then set a 1-second `setInterval`.
  - Each tick: `setElapsed(Math.floor((Date.now() - startTimestamp) / 1000))`.
  - Add an `AppState` `'change'` listener; when `nextState === 'active'`, fire a tick immediately to re-sync after background.
  - Clean up both the interval and the `AppState` subscription in the effect's return.
  - When `startTimestamp` is null, reset elapsed to 0 and skip setup.

1.4 Run `npx tsc --noEmit` — zero errors.

---

## Group 2: NotesModal

2.1 Create `src/modals/NotesModal.tsx`.

2.2 Props:
  ```ts
  interface NotesModalProps {
    visible: boolean;
    title: string;          // e.g. 'End Sleep Session'
    elapsed: string;        // formatted duration shown as context, e.g. '1h 23m'
    onSave: (notes: string) => Promise<void>;
    onDismiss: () => void;
  }
  ```

2.3 Layout:
  - React Native `Modal`, `animationType='slide'`, `transparent={false}`
  - `SafeAreaView` with `COLORS.background`
  - Title text at top
  - Elapsed duration shown below title in `COLORS.textMuted` — gives context before saving
  - Optional multiline `TextInput` for notes (placeholder: `'Add a note...'`, `maxLength=200`)
  - `'Save'` button — calls `onSave(notes)`, shows `ActivityIndicator` while in flight
  - `'Cancel'` button — calls `onDismiss`

2.4 `onSave` resolves → parent is responsible for hiding modal. `NotesModal` does not call `onDismiss` after save.

2.5 Run `npx tsc --noEmit` — zero errors.

---

## Group 3: TrackerContext — startSleep / stopSleep

3.1 In `src/context/TrackerContext.tsx`:
  - Change `const [active] = useState<ActiveTrackers>(INITIAL_ACTIVE)` to `const [active, setActive] = useState<ActiveTrackers>(INITIAL_ACTIVE)`.
  - Add imports: `AppState` from `react-native`, `* as Crypto` from `expo-crypto`, `insertLog` from `@services/db`, `SleepLog` from `../types/tracker`.

3.2 Implement `startSleep`:
  ```ts
  const startSleep = (): void => {
    setActive(prev => ({ ...prev, sleepStart: Date.now() }));
  };
  ```

3.3 Implement `stopSleep`:
  ```ts
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
    await insertLog(db, log);
    setActive(prev => ({ ...prev, sleepStart: null }));
    await refreshLogs();
  };
  ```
  Wrap the body in `try/catch`; re-throw after `console.error`.

3.4 Note on AppState for sleep: because sleep stores an absolute Unix start timestamp, elapsed time is always computed as `Date.now() - sleepStart` and is inherently correct after backgrounding. No separate AppState correction is needed in the context — `useLiveTick` handles the display re-sync internally.

3.5 Run `npx tsc --noEmit` — zero errors.

---

## Group 4: Dashboard — sleep button + action zone

4.1 In `src/screens/Dashboard.tsx`, replace the `'Ready to track.'` placeholder `View` with an action zone `View`.

4.2 Add a `formatElapsed(secs: number): string` helper:
  ```ts
  // e.g. 0–59s → '0m', 60s–3599s → '23m', 3600s+ → '1h 23m'
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
  ```

4.3 Consume `useLiveTick(active.sleepStart)` to get live elapsed seconds.

4.4 Sleep toggle button:
  - Full-width, `height: 90`, `borderRadius: 16`
  - Idle state: `backgroundColor: COLORS.sleep`, label: `'Track Sleep'`
  - Active state: `backgroundColor: COLORS.active`, label: `'Wake Up · Xh Ym'`
  - On press when idle: call `startSleep()`
  - On press when active: open `NotesModal` (do NOT call `stopSleep` directly)

4.5 Add local state: `notesVisible: boolean` to control `NotesModal`.

4.6 Wire `NotesModal`:
  - `title='End Sleep Session'`
  - `elapsed={formatElapsed(sleepElapsed)}`
  - `onSave={async (notes) => { await stopSleep(notes); setNotesVisible(false); }}`
  - `onDismiss={() => setNotesVisible(false)}`

4.7 Run `npx tsc --noEmit` — zero errors.

---

## Group 5: Dashboard — log list

5.1 Still in `src/screens/Dashboard.tsx`, below the action zone add a `ScrollView` that fills the remaining flex space.

5.2 Add a section label: `'Today'` in `COLORS.textMuted`, uppercase, small — rendered above the list.

5.3 Empty state: when `logs.length === 0`, render centered text `'No logs yet today.'` in `COLORS.textMuted`.

5.4 For each log, render a `LogCard` — implement as an inline component or a local function component within `Dashboard.tsx` (no separate file needed in this phase):
  - Horizontal row: left color strip (6px wide, full height), card body, delete button
  - Color strip color: `COLORS.sleep` for sleep logs (other types added in later phases)
  - Card body: type label (`'SLEEP'`), start time (`HH:MM`), duration or `'In progress'` if `endTime` is null
  - Notes line: only rendered when `item.notes` is non-empty
  - Delete button: `✕` in `COLORS.textMuted`, `width: 50`, vertically centered; calls `removeLog(item.id)`
  - Card background: `COLORS.surface`, `borderRadius: 12`, `borderWidth: 1`, `borderColor: COLORS.border`

5.5 Run `npx tsc --noEmit` and `npm run lint` — zero errors on both.

---

## Group 6: Cleanup & commit

6.1 Confirm `src/hooks/.gitkeep` is removed (it will be, once `useLiveTick.ts` exists).
6.2 Final `npx tsc --noEmit` and `npm run lint` — clean pass.
6.3 Commit all changes.
