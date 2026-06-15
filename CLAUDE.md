# Project Lullaby — Development Constitution

This document is the single source of truth for all architectural, design, and engineering decisions. Every line of code written for this project must conform to it. No exceptions without explicitly updating this file first.

---

## 1. Project Identity

**What it is:** A premium, local-first baby tracking app for new parents. Frictionless one-handed operation is the primary UX goal.

**Inspiration:** Huckleberry's interaction model — not its visual design.

**Price:** $5.00 upfront. No in-app purchases. No subscriptions. No ads. No freemium gating.

**Platforms:** Both iOS (App Store) and Android (Google Play Store).

---

## 2. Absolute Non-Negotiables

These rules may never be broken without a full constitution revision.

1. **No Huckleberry purple.** The color `#7C5CBF` or any variant of it is permanently banned. The palette is Sage Green and Slate only. See Section 7.
2. **No cloud accounts or login.** There is no user authentication. No sign-up. No email. Data stays on-device.
3. **Single-screen dashboard only.** There is no React Navigation, no bottom tabs, no stack navigator. The entire app lives on one screen. Modals handle input flows.
4. **Pure React Context + Native Hooks.** No Redux, Zustand, Jotai, MobX, Recoil, or any other state management library.
5. **Absolute Unix timestamps everywhere.** All time values stored and computed as Unix epoch milliseconds (`Date.now()`). No string dates. No local date objects in the database.
6. **Strict TypeScript.** No `any` type is permitted in committed code. Use `unknown` and narrow properly. All props and return types must be explicitly typed.

---

## 3. Approved Dependency List

The following packages are approved. Do not add any package not on this list without first adding it here.

| Package | Purpose |
|---|---|
| `expo-sqlite` | Local database — the only persistent store |
| `expo-crypto` | Cryptographically safe UUID generation |
| `expo-notifications` | Local push notifications for smart reminders |
| `expo-file-system` | Reading/writing backup files for cloud sync |
| `expo-document-picker` | iOS iCloud / Android Google Drive file access |
| React Native core | `AppState`, `TouchableOpacity`, `StyleSheet`, etc. |

**Forbidden categories:** HTTP clients, analytics SDKs, crash reporting SDKs, UI component libraries, date formatting libraries (use `Intl.DateTimeFormat` or native `.toLocaleTimeString()`).

---

## 4. Data Architecture

### 4.1 ID Generation

All record IDs must be generated with `expo-crypto`:

```ts
import * as Crypto from 'expo-crypto';
const id = Crypto.randomUUID(); // Always. Math.random() is banned for IDs.
```

### 4.2 SQLite Schema

Two tables. All logs are scoped to a `baby_id`.

```sql
-- Baby profiles
CREATE TABLE IF NOT EXISTS babies (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  dob INTEGER NOT NULL,         -- Unix epoch ms of date of birth
  created_at INTEGER NOT NULL
);

-- All tracking logs
CREATE TABLE IF NOT EXISTS baby_logs (
  id TEXT PRIMARY KEY NOT NULL,
  baby_id TEXT NOT NULL,
  type TEXT NOT NULL,           -- 'sleep' | 'feed' | 'diaper'
  timestamp INTEGER NOT NULL,   -- Unix epoch ms — start time / event time
  notes TEXT,
  -- Sleep fields
  endTime INTEGER,              -- null = session still active
  -- Feed fields
  feedType TEXT,                -- 'breast' | 'bottle' | 'solids'
  leftDuration INTEGER,         -- seconds
  rightDuration INTEGER,        -- seconds
  amountMl INTEGER,             -- for bottle entries
  -- Diaper fields
  status TEXT,                  -- 'wet' | 'dirty' | 'mixed' | 'dry'
  FOREIGN KEY (baby_id) REFERENCES babies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_logs_baby_timestamp ON baby_logs (baby_id, timestamp DESC);
```

**WAL mode and foreign keys must be enabled on every database open.** See `src/services/db.ts`.

### 4.3 Active Session State (in-memory only)

Active timers (sleep, breast feed sides) are never written to SQLite until the user explicitly saves the session. They live only in `TrackerContext` React state with `AppState` backup delta correction.

---

## 5. Feature Scope — Version 1

### In Scope

- **Onboarding:** A mandatory setup screen shown on first launch. Collects baby name and date of birth. Cannot proceed to dashboard without at least one baby profile.
- **Multi-baby:** Header dropdown switcher to select the active baby. All tracking is scoped to the currently selected baby.
- **Sleep tracking:** Toggle start/stop. Live elapsed timer on dashboard. Saves start + end Unix timestamps.
- **Breast feed tracking:** Independent left/right side timers. Only one side can run at a time — starting one auto-pauses the other. Live elapsed display per side. "Save Session" button appears once any time has been accumulated.
- **Bottle feed logging:** Modal input for ml amount. Single tap to log.
- **Solids logging:** Single tap to log. No amount field.
- **Diaper logging:** Four status options inline (wet / dirty / mixed / dry). Single tap to log.
- **Today-only log list:** Reverse-chronological list of today's events for the active baby. No pagination or date picker.
- **Delete log:** Swipe or tap ✕ to delete any log entry.
- **Smart notifications:** Configurable local push reminders based on elapsed time since the last logged event (feed, diaper, sleep). Powered by `expo-notifications`.
- **Automatic background backup:** On `AppState` transition to `background`, silently export a JSON snapshot of all data and write it to iCloud (iOS) or Google Drive (Android) via `expo-file-system`. The user is never interrupted.

### Explicitly Out of Scope for v1

- History view, date picker, or multi-day browsing
- Charts, graphs, or pattern analysis
- Cloud accounts, login, or server sync
- Sharing or exporting to other apps
- Baby photo or avatar
- Growth tracking (weight, height)
- Doctor appointment logging

---

## 6. Architecture Rules

### 6.1 Navigation

There is one screen: `Dashboard`. Supplementary flows use React Native `Modal` components rendered inside `Dashboard`:

- `OnboardingModal` — shown when no baby profiles exist
- `AddBabyModal` — triggered from header when user wants to add a second baby
- `BottleLogModal` — input for ml amount
- `NotesModal` — optional notes before saving a sleep or feed session

No `react-navigation`, `expo-router`, or any navigation library is permitted.

### 6.2 State Management

One context: `TrackerContext`. It owns:
- The list of baby profiles
- The currently selected `babyId`
- All active session state (timers)
- The today's log list

A separate `SettingsContext` owns:
- Notification preferences (enabled/disabled per type, threshold minutes)

No prop drilling beyond two levels. If a component needs data from more than two levels up, it must consume context directly.

### 6.3 Background State Integrity

This is a paid app. Timer data must never drift or be lost.

- Sleep start is stored as an absolute Unix epoch ms in `TrackerContext`.
- Feed side start times are stored as absolute Unix epoch ms.
- On `AppState` transition from `background/inactive` back to `active`, compute the elapsed delta from `(Date.now() - storedStartTimestamp)` and accumulate it into the elapsed totals. Reset the start timestamp to `Date.now()`.
- This ensures that if the OS kills and restores the app, the user sees accurate elapsed time.

---

## 7. Design System

### 7.1 Color Palette

```ts
// src/theme/colors.ts — canonical source
primary: '#5F7A61'        // Deep Premium Sage Green
primaryLight: '#D5E0D5'   // Soft Wash Sage
background: '#F8F9FA'     // Clean Slate Off-White
surface: '#FFFFFF'         // Card Backgrounds
textPrimary: '#2D3748'    // Deep Charcoal Slate
textMuted: '#718096'      // Soft Gray Text
border: '#E2E8F0'         // Subtle Divider Line

sleep: '#4A6FA5'          // Soft Evening Indigo
feed: '#D97706'           // Warm Amber
diaper: '#8C6239'         // Soft Earth Clay
active: '#10B981'         // Vibrant Active Emerald (running timer state)

error: '#EF4444'
success: '#10B981'
```

No color may be hardcoded inline. Every color reference must go through the `COLORS` object from `src/theme/colors.ts`.

### 7.2 Touch Targets

All interactive elements must be a minimum of 44×44 logical pixels. This is a one-handed app for sleep-deprived parents. Primary action buttons are 90px tall minimum.

### 7.3 Typography

System font only. No custom font loading. Use the `TYPOGRAPHY.size` scale from `src/theme/colors.ts`.

---

## 8. Code Quality Standards

### 8.1 Error Handling

- Every `async` function that touches SQLite or `expo-notifications` must be wrapped in `try/catch`.
- Errors must not be silently swallowed. Log to `console.error` at minimum.
- Every screen and modal must have an explicit fallback/empty state view. No component may render `null` as a data-loading default.

### 8.2 TypeScript

- `strict: true` in `tsconfig.json`. No exceptions.
- No `as any` casts. Use type guards and `unknown`.
- All `BabyLog` discriminated union arms must be handled exhaustively in switch statements.

### 8.3 Functional Purity

- No side effects inside render functions.
- All database mutations go through `TrackerContext` actions. Components never call `db` directly.
- `useEffect` dependencies must be complete and correct. ESLint `exhaustive-deps` rule is enforced.

---

## 9. Notification Rules

- Notification scheduling is managed by a dedicated `useNotifications` hook in `src/hooks/useNotifications.ts`.
- When the user saves any log, cancel any pending reminder for that type and schedule a new one based on the user's configured threshold.
- Default thresholds (configurable in settings): feed reminder after 3 hours, diaper reminder after 4 hours.
- Notifications must always include the active baby's name in the message body when more than one baby profile exists.
- Notification permission must be requested during onboarding, not at first use of a feature.

---

## 10. Backup Rules

- Backup format: a single JSON file named `lullaby_backup_<ISO_DATE>.json`.
- Content: all rows from `babies` and `baby_logs` tables, serialized as arrays of objects.
- Trigger: `AppState` change to `background`. Fire-and-forget — do not block the UI thread or show loading states.
- On iOS: write to the app's iCloud Documents container via `expo-file-system` (requires iCloud entitlement).
- On Android: write to the app-scoped Google Drive folder via the Drive Files API (requires `expo-auth-session` for one-time OAuth — this is the **only** exception to the no-accounts rule; it is not a user-facing account, it is a background drive permission).
- Backup errors must be logged but must never surface to the user as an error dialog.
- There is no restore UI in v1. Restoration is a manual "import from file" feature deferred to v2.

---

## 11. File & Folder Structure

```
src/
  theme/
    colors.ts              — COLORS and TYPOGRAPHY constants
  types/
    tracker.ts             — All TypeScript interfaces and discriminated unions
  services/
    db.ts                  — SQLite init, CRUD operations
    backup.ts              — JSON export and cloud write logic
  context/
    TrackerContext.tsx     — All tracking state and actions
    SettingsContext.tsx    — Notification prefs and app settings
  hooks/
    useNotifications.ts    — Scheduling and cancelling local notifications
    useLiveTick.ts         — 1-second interval hook for live timer display
  screens/
    Dashboard.tsx          — The one and only screen
  modals/
    OnboardingModal.tsx    — First-launch baby setup
    AddBabyModal.tsx       — Add additional baby profile
    BottleLogModal.tsx     — Bottle amount input
    NotesModal.tsx         — Optional notes before saving a session
App.tsx                    — Root: SQLiteProvider > TrackerProvider > SettingsProvider > Dashboard
```

---

## 12. What "Done" Means

A feature is done when:
1. It compiles with zero TypeScript errors under `strict: true`.
2. It handles its empty/loading/error states explicitly.
3. All time values flow through Unix epoch ms — never strings, never `new Date()` objects stored to SQLite.
4. It works correctly after the app is backgrounded for 10 minutes and resumed.
5. It works correctly when a second baby profile exists.
