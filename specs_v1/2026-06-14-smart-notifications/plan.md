# Phase 6 — Smart Notifications: Plan

## Task Groups

---

### Group 1 — SettingsContext + SQLite Persistence

**1.1** Add `NotificationType`, `NotificationPref`, and `NotificationSettings` to `src/types/tracker.ts` (see `requirements.md` for definitions).

**1.2** In `src/services/db.ts`, add the `settings` key-value table to `initializeDatabase`:

```sql
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
```

**1.3** Add two helpers to `db.ts` (typed, no `any`):

```ts
async function getSetting(db: SQLiteDatabase, key: string): Promise<string | null>
async function setSetting(db: SQLiteDatabase, key: string, value: string): Promise<void>
```

Both wrapped in `try/catch` with `console.error`.

**1.4** Replace the `SettingsContext` stub in `src/context/SettingsContext.tsx` with a full implementation:

- State: `notifications: NotificationSettings`
- Defaults: `feed: { enabled: true, thresholdMinutes: 180 }`, `diaper: { enabled: true, thresholdMinutes: 240 }`, `sleep: { enabled: true, thresholdMinutes: 120 }`
- On mount: load all three prefs from the `settings` table via `getSetting`; parse JSON; fall back to defaults if a key is absent or the value is malformed.
- Action: `updateNotificationPref(type: NotificationType, pref: Partial<NotificationPref>)` — merges the update into state, serialises to JSON, calls `setSetting`.
- Expose via `useSettings()` custom hook.
- All SQLite calls wrapped in `try/catch` with `console.error`.

---

### Group 2 — `useNotifications` Hook

**2.1** Create `src/hooks/useNotifications.ts` with the following interface:

```ts
function useNotifications(): {
  scheduleReminder: (
    type: NotificationType,
    thresholdMinutes: number,
    babyName?: string
  ) => Promise<void>;
  cancelReminder: (type: NotificationType) => Promise<void>;
}
```

**2.2** Use `useRef<Partial<Record<NotificationType, string>>>({})` to track the active notification identifier per type.

**2.3** `scheduleReminder(type, thresholdMinutes, babyName?)`:
- Calls `cancelReminder(type)` first to cancel any existing reminder of this type.
- Calls `Notifications.scheduleNotificationAsync` with `trigger: { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: thresholdMinutes * 60, repeats: false }`.
- Notification content by type:
  - `feed`: title `"Feed reminder"`, body `"It's been ${hours}h since the last feed."` (+ baby name if provided)
  - `diaper`: title `"Diaper reminder"`, body `"It's been ${hours}h since the last diaper change."` (+ baby name if provided)
  - `sleep`: title `"Sleep reminder"`, body `"${babyName ?? 'Baby'} has been asleep for ${hours}h."`
- When `babyName` is provided: append `" — ${babyName}"` to the title.
- Format hours as a decimal via plain division (`thresholdMinutes / 60`); no date library.
- Stores returned identifier in the ref.
- Wrapped in `try/catch` with `console.error`.

**2.4** `cancelReminder(type)`:
- Reads identifier from ref; if absent, returns early.
- Calls `Notifications.cancelScheduledNotificationAsync(id)`.
- Deletes the ref entry.
- Wrapped in `try/catch` with `console.error`.

**2.5** `useNotifications` must not import `useTracker` or `useSettings` — all data arrives as parameters. This keeps the hook pure and independently testable.

---

### Group 3 — Wire Into TrackerContext

**3.1** Import `useNotifications` and `useSettings` into `src/context/TrackerContext.tsx`.

**3.2** After each successful `insertLog` call, inside the relevant action (`stopSleep`, `saveBreastFeed`, `logBottle`, `logSolids`, `logDiaper`):
- Determine the `NotificationType` from the saved log (`sleep` → `'sleep'`, any `FeedLog` → `'feed'`, `DiaperLog` → `'diaper'`).
- Read `notifications[type]` from `SettingsContext`.
- If `enabled`: call `scheduleReminder(type, thresholdMinutes, babyName)` where `babyName = babies.length > 1 ? activeBaby.name : undefined`.

**3.3** After each successful `removeLog` call:
- Determine the `NotificationType` from the deleted log's `type` field.
- Call `cancelReminder(type)`.

**3.4** Map `BabyLog.type` to `NotificationType` exhaustively:

```ts
function logTypeToNotifType(logType: BabyLog['type']): NotificationType {
  switch (logType) {
    case 'sleep': return 'sleep';
    case 'feed':  return 'feed';
    case 'diaper': return 'diaper';
  }
}
```

---

### Group 4 — Permission in OnboardingModal

**4.1** In `src/modals/OnboardingModal.tsx`, after the first baby is persisted (inside the save handler, after `createBaby` resolves):
- Call `Notifications.requestPermissionsAsync()`.
- If `status !== 'granted'`: set a local `permissionDenied: boolean` state to `true` — render one line of muted text below the save button: `"You can enable notifications later in Settings."` This text is only visible after a denial and must not block the flow.
- Wrapped in `try/catch` with `console.error`.

**4.2** Do not request permissions anywhere else in the app.

---

### Group 5 — SettingsModal UI

**5.1** Create `src/modals/SettingsModal.tsx`:
- Props: `{ visible: boolean; onDismiss: () => void }`
- Rendered as a React Native `Modal`.
- Consumes `useSettings()` for current prefs and `updateNotificationPref` for changes.
- Three sections (Feed, Diaper, Sleep), each containing:
  - A section label styled with `TYPOGRAPHY` and `COLORS.textPrimary`.
  - An enabled/disabled toggle (`Switch` component, track color `COLORS.primary` when on, `COLORS.border` when off).
  - A numeric text input for threshold hours (convert to/from minutes: `displayHours = thresholdMinutes / 60`, `store: Math.round(hours * 60)`). Keyboard type `numeric`. Minimum 44px tall.
  - A sub-label: `"Remind after X hour(s)"` updated as the user types.
- "Done" button (≥ 90px tall, `COLORS.primary` background) dismisses the modal via `onDismiss`.
- Changes are applied immediately via `updateNotificationPref` — not deferred to "Done".
- All colors through `COLORS`. No hardcoded hex.

**5.2** In `src/screens/Dashboard.tsx`:
- Add `settingsVisible: boolean` state.
- Add a gear label (`"⚙"`) or text button to the header row, to the right of the baby dropdown. `onPress` sets `settingsVisible = true`. Minimum 44×44pt touch target.
- Add `<SettingsModal visible={settingsVisible} onDismiss={() => setSettingsVisible(false)} />` at the bottom of the Dashboard JSX alongside other modals.

---

### Group 6 — TypeScript & Cleanup

**6.1** Run `npx tsc --noEmit` — zero errors required.

**6.2** Confirm `NotificationType` (`'feed' | 'diaper' | 'sleep'`) is exhaustively handled in all switch statements, including `logTypeToNotifType`.

**6.3** Verify no hardcoded colors in new or modified files.

**6.4** Verify no `any` type in new or modified files.

**6.5** Remove any temporary `console.log` statements added during validation (see `validation.md` Group: Expo Debugger).
