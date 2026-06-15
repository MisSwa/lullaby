# Lullaby — Roadmap

Each phase is a vertical slice: independently buildable, testable, and coherent. Later phases build on earlier ones but never require them to be "refactored first."

---

## Phase 0 — Project Skeleton

**Goal:** A running app with the correct folder structure, theme, types, and database wiring. No visible product features yet.

- Initialize Expo project with TypeScript strict mode
- Create folder structure per `CLAUDE.md` (`src/theme`, `src/types`, `src/services`, `src/context`, `src/hooks`, `src/screens`, `src/modals`)
- Write `src/theme/colors.ts` — `COLORS` and `TYPOGRAPHY` constants
- Write `src/types/tracker.ts` — all discriminated union types (`BabyLog`, `SleepLog`, `FeedLog`, `DiaperLog`, `ActiveTrackers`)
- Write `src/services/db.ts` — `initializeDatabase`, `insertLog`, `fetchLogsForBaby`, `deleteLog`; WAL mode + foreign keys on init
- Scaffold `TrackerContext` and `SettingsContext` with empty state and no-op actions
- Wire `App.tsx`: `SQLiteProvider` → `TrackerProvider` → `SettingsProvider` → placeholder `<View>`
- App launches, database initializes, no crash

**Exit check:** `npx expo start` runs without errors. Database init log appears in console.

---

## Phase 1 — Onboarding & Baby Profiles

**Goal:** A user with no data is guided to create their first baby profile before anything else appears.

- Build `OnboardingModal` — name input + date of birth picker; visible when `babies` table is empty
- Build `AddBabyModal` — reuses the same form, triggered from header
- Implement `createBaby` and `fetchBabies` in `db.ts`; add `babies` CRUD to `TrackerContext`
- Build header component: app name on the left, baby name dropdown on the right; switches `activeBabyId` in context
- Dashboard renders the header and an empty action zone; no log list yet
- `OnboardingModal` is dismissed once the first baby is saved; never shown again

**Exit check:** Fresh install → onboarding modal → enter name + DOB → dashboard header shows baby name → add second baby → dropdown switches between them.

---

## Phase 2 — Sleep Tracking

**Goal:** A parent can start and stop a sleep session with one tap and see it in a log list.

- Build the sleep toggle button on the dashboard (full-width, 90px tall)
- Implement `startSleep` and `stopSleep` in `TrackerContext`; stop saves `SleepLog` to SQLite
- Implement `useLiveTick` hook — 1-second interval, returns elapsed seconds, cleans up on unmount
- Display live elapsed time on the sleep button when active
- Build the today's log list (reverse-chronological `ScrollView`, today's events only for active baby)
- Render `SleepLog` cards: type label, start time, duration, color strip
- Implement delete (✕ button on each card → `removeLog`)
- Implement `AppState` background correction for sleep timer (Unix delta sync on resume)

**Exit check:** Tap sleep → timer counts up → background app for 2 min → return → timer is accurate → tap again → log appears in list with correct duration → delete removes it.

---

## Phase 3 — Breast Feed Tracking

**Goal:** A parent can time left and right breast independently, with only one side running at a time, and save the combined session.

- Add left and right feed buttons to the dashboard (side by side, below sleep button)
- Implement `toggleBreastFeed(side)` in `TrackerContext` — starting one side auto-pauses the other; accumulates elapsed per side
- Display live elapsed seconds per side on the respective button while running
- Show "Save Session" button once either side has accumulated any time
- `saveBreastFeed` saves a `FeedLog` with `feedType: 'breast'`, `leftDuration`, `rightDuration`
- Render `FeedLog` (breast) cards in the log list: type, time, L/R durations
- Implement `AppState` background correction for feed timers (same Unix delta pattern as sleep)
- Build `NotesModal` — optional text input, shown before save on long-press of "Save Session"

**Exit check:** Toggle left → timer runs → toggle right → left pauses, right runs → background 1 min → return → elapsed is accurate → save → feed card appears with correct L/R times.

---

## Phase 4 — Bottle & Solids Logging

**Goal:** Complete the feed tracking surface. A parent can log a bottle with an amount, or solids with a single tap.

- Build `BottleLogModal` — numeric input for ml amount + save button
- Add bottle and solids tap targets to the dashboard (below breast feed row)
- `logBottle(amountMl, notes)` saves a `FeedLog` with `feedType: 'bottle'`
- `logSolids(notes)` saves a `FeedLog` with `feedType: 'solids'`, `amountMl: 0`
- Render bottle/solids cards in the log list with appropriate labels and amount display

**Exit check:** Tap bottle → modal opens → enter 90ml → save → card shows "FEED · Bottle · 90ml". Tap solids → card appears immediately.

---

## Phase 5 — Diaper Tracking

**Goal:** A parent can log a diaper change in one tap.

- Add four diaper status buttons inline on the dashboard (wet / dirty / mixed / dry)
- `logDiaper(status, notes)` saves a `DiaperLog` to SQLite
- Render `DiaperLog` cards in the log list with status and timestamp
- Optional: long-press any diaper button opens `NotesModal` before saving

**Exit check:** Tap "wet" → diaper card appears with correct status and time.

---

## Phase 6 — Smart Notifications

**Goal:** The app proactively nudges parents when time has elapsed since the last logged event.

- Request notification permission during the `OnboardingModal` flow (not on first feature use)
- Implement `useNotifications` hook — exposes `scheduleReminder(type, thresholdMinutes)` and `cancelReminder(type)`
- After every `insertLog`, cancel the existing reminder for that type and schedule a new one
- Default thresholds: feed → 3 hours, diaper → 4 hours (configurable in settings)
- Build a minimal settings panel (rendered as a `Modal` from a header icon): toggle notifications on/off per type, adjust threshold
- Notification body includes the active baby's name when multiple profiles exist
- Implement `SettingsContext` with persistence (store settings in a `settings` key-value SQLite table)

**Exit check:** Log a feed → wait (or manually set clock) → notification fires with correct baby name and message → log another feed → previous notification is cancelled, new one scheduled.

---

## Phase 7 — Automatic Backup

**Goal:** User data is silently backed up to cloud storage every time the app is backgrounded.

- Implement `src/services/backup.ts` — `exportSnapshot()` serializes all `babies` and `baby_logs` rows to JSON
- On `AppState` transition to `background`, call `exportSnapshot()` and write the file via `expo-file-system`
- iOS: write to iCloud Documents container (`FileSystem.documentDirectory` with iCloud entitlement)
- Android: write to app-scoped Google Drive folder (requires one-time OAuth via `expo-auth-session`; defer Android if OAuth setup is complex)
- File named `lullaby_backup_<YYYY-MM-DD>.json`; overwrite same-day file on each backup
- Errors are logged to console only — never surface a backup failure to the user
- No restore UI in this phase

**Exit check:** Use the app → background it → check iCloud/Drive → JSON file exists with correct data.

---

## Phase 8 — Polish & Store Submission

**Goal:** The app is ready for a paid public release on both stores.

- App icon and splash screen
- Review all empty states, error boundaries, and fallback views
- Audit all touch targets (minimum 44×44pt)
- Audit all TypeScript — zero errors under `strict: true`
- Test background/resume timer accuracy across iOS and Android
- Test with two baby profiles — confirm all logs are correctly scoped
- Confirm no hardcoded colors (all through `COLORS`)
- Set up EAS Build for production `.ipa` and `.aab`
- App Store and Play Store metadata, screenshots, description
- Submit for review

---

## What Is Not On This Roadmap (v2 and beyond)

- History view with date picker
- Charts or pattern visualizations
- Data import / restore from backup file
- Growth tracking (weight, height)
- Doctor appointment logging
- Baby photo / avatar
- Sharing or exporting individual logs
