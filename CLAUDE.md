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
| `expo-font` | Peer dep of @expo/vector-icons; provides font loading infrastructure |
| `expo-asset` | Peer dep of expo-font; provides asset resolution for bundled font files |
| `expo-auth-session` | Google Drive OAuth for Android background backup (only non-user-facing auth) |
| `expo-status-bar` | Status bar tinting to match app theme |
| `@expo/vector-icons` | Icon sets (Ionicons, MaterialCommunityIcons) for UI icons and card watermarks |
| `@react-native-community/datetimepicker` | Native date/time picker for retroactive session time correction in modals |
| `@react-native-community/slider` | Native slider for bottle amount input (0–300 ml, step 5) |
| `react-native-reanimated` | Spring animations for card press feedback (scale 0.97 on press) |
| React Native core | `AppState`, `TouchableOpacity`, `StyleSheet`, etc. |

**Forbidden categories:** HTTP clients, analytics SDKs, crash reporting SDKs, UI component libraries, date formatting libraries (use `Intl.DateTimeFormat` or native `.toLocaleTimeString()`). Note: `@expo/vector-icons` is explicitly approved as an **icon library** and is not considered a UI component library under this rule.

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
- **Breast feed tracking:** Accessed via FeedModal (Nursing tab). Two large L/R circle buttons with live elapsed timers under each. Only one side can run at a time — starting one auto-pauses the other. "Save Session" button appears once any time > 0 has accumulated. Quick-tap nursing card opens FeedModal pre-set to Nursing tab.
- **Bottle feed logging:** Via FeedModal (Bottle tab) — slider (0–300 ml, step 5), ml/oz toggle reads from SettingsContext, retroactive time correction available.
- **Solids logging:** Via SolidsCard (full-width, between feed row and DiaperCard). Single tap logs immediately with no notes; long-press opens SolidsModal for optional notes before saving.
- **Diaper logging:** Modal-based via DiaperModal — tapping the card opens a modal with four large icon buttons (Pee/Poo/Mixed/Dry). Tapping a button auto-saves and closes. Retroactive timestamp correction available before tapping.
- **Today-only log list:** Reverse-chronological list of today's events for the active baby. No pagination or date picker.
- **Delete log:** Swipe or tap ✕ to delete any log entry.
- **Smart notifications:** Configurable local push reminders based on elapsed time since the last logged event (feed, diaper, sleep). Powered by `expo-notifications`.
- **Settings modal:** SettingsModal (gear icon in header) — controls theme (light/system/dark), units (ml/oz), and notification thresholds per type.
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

- `OnboardingModal` — first-launch baby setup (name + DOB)
- `AddBabyModal` — add additional baby profile from header
- `DiaperModal` — four icon buttons (Pee/Poo/Mixed/Dry); tap auto-logs and closes; retroactive timestamp
- `FeedModal` — unified Nursing + Bottle tabs; replaces the deleted `BottleLogModal`
- `NotesModal` — optional free-text notes; used when ending a sleep session
- `SolidsModal` — optional notes ("What did they eat?") opened via long-press on SolidsCard
- `SettingsModal` — app preferences (theme, units, notification thresholds per category)

`BottleLogModal` is deleted — fully replaced by `FeedModal`.

No `react-navigation`, `expo-router`, or any navigation library is permitted.

### 6.2 State Management

One context: `TrackerContext`. It owns:
- The list of baby profiles
- The currently selected `babyId`
- All active session state (timers)
- The today's log list

A separate `SettingsContext` owns:
- Notification preferences (enabled/disabled per type, threshold minutes)
- `theme: 'system' | 'light' | 'dark'` — controls `useTheme()` override
- `units: 'ml' | 'oz'` — persisted; used in FeedModal bottle tab and log list display
- `updateUnits(u: 'ml' | 'oz'): void`
- `timeFormat: '12h' | '24h'` — persisted; applied to every `toLocaleTimeString` call in the app
- `updateTimeFormat(f: '12h' | '24h'): void`

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
// src/theme/colors.ts — canonical source (LIGHT palette)
primary: '#5F7A61'        // Deep Premium Sage Green
primaryLight: '#D5E0D5'   // Soft Wash Sage
background: '#F8F9FA'     // Clean Slate Off-White
surface: '#FFFFFF'         // Card Backgrounds
surfaceAlt: '#F0F4F0'     // Subtle sage-tinted surface for app header background
textPrimary: '#2D3748'    // Deep Charcoal Slate
textMuted: '#718096'      // Soft Gray Text
border: '#E2E8F0'         // Subtle Divider Line

sleep: '#4A6FA5'          // Soft Evening Indigo
feed: '#D97706'           // Warm Amber
diaper: '#8C6239'         // Soft Earth Clay
active: '#10B981'         // Vibrant Active Emerald (running timer state)

error: '#EF4444'
success: '#10B981'
shadow: '#000000'         // Used as shadowColor on cards
```

No color may be hardcoded inline. Every color reference must go through the `COLORS` object from `src/theme/colors.ts`.

### 7.2 Touch Targets

All interactive elements must be a minimum of 44×44 logical pixels. This is a one-handed app for sleep-deprived parents. Primary action buttons are 90px tall minimum.

### 7.3 Typography

System font only. No custom font loading. Use the `TYPOGRAPHY.size` scale from `src/theme/colors.ts`.

### 7.4 Card Design Principles

- Cards use a **colored header band** at top (category color fill) with the card label and action icons (bell, live badge) in white.
- Cards use a **double-wrapper pattern**: outer `TouchableOpacity` carries shadow (no `overflow: hidden`); inner `View` has `overflow: 'hidden'` + `borderRadius: 16` to clip header band corners.
- **Ghost watermark icon** on the right side of the card body at 10% opacity; 88px for full-width cards, 60–68px for half-width.
- No border on cards — separation provided by shadow (`shadowOpacity: 0.09, shadowRadius: 10, elevation: 4`).
- The `timeSince` value is the primary metric: 22px bold on full-width cards, 16px on half-width.
- Dashboard card zone uses `COLORS.background` (not `surface`) so cards float above the page.
- Header uses `COLORS.surfaceAlt` for a warm sage tint.

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
    colors.ts              — LIGHT, DARK palettes, COLORS (deprecated alias), TYPOGRAPHY
  types/
    tracker.ts             — BabyLog union (SleepLog | FeedLog | DiaperLog), AppTheme, AppUnits
    baby.ts                — Baby profile interface
  services/
    db.ts                  — SQLite init, WAL mode, CRUD
    backup.ts              — JSON snapshot export + cloud write
  context/
    TrackerContext.tsx     — Tracking state: babies, activeBabyId, logs, active timers, actions
    SettingsContext.tsx    — Theme, units, notification prefs, persisted to SQLite key-value
  hooks/
    useNotifications.ts    — Schedule/cancel local push reminders per log type
    useLiveTick.ts         — 1-second interval → elapsed seconds from a start timestamp
    useTheme.ts            — Returns ColorPalette matching OS scheme + SettingsContext override
  screens/
    Dashboard.tsx          — Single screen: card zone + log list + all modals
    DashboardHeader.tsx    — Baby avatar, age string, multi-baby switcher dropdown, gear icon
  components/
    ActiveSleepView.tsx    — Full-width sleep takeover: large HH:MM:SS, editable start, STOP button
    NudgeSheet.tsx         — Bottom-sheet shown once per log type after first save; prompts reminders setup
    SplitButtonRow.tsx     — Two equal-width side-by-side buttons (Skip | Set up reminders pattern)
    cards/
      SleepCard.tsx        — Sleep tracking card (full-width)
      NursingCard.tsx      — Breast feed card (half-width, paired with BottleCard)
      BottleCard.tsx       — Bottle feed card (half-width, paired with NursingCard)
      SolidsCard.tsx       — Solids tracking card (full-width); tap=quick-log, long-press=SolidsModal
      DiaperCard.tsx       — Diaper card (full-width)
  modals/
    OnboardingModal.tsx    — First-launch: name + DOB collection, blocks dashboard until done
    AddBabyModal.tsx       — Add a new baby profile
    DiaperModal.tsx        — 4-button diaper picker (replaces old inline buttons)
    FeedModal.tsx          — Unified Nursing/Bottle/Solids modal (replaces deleted BottleLogModal)
    NotesModal.tsx         — Optional text notes when ending a sleep session
    SolidsModal.tsx        — Optional notes ("What did they eat?") for long-press solids logging
    SettingsModal.tsx      — App preferences: theme, units, notification thresholds
  utils/
    ageString.ts           — computeAge(dob: number): string → "4 months" / "2 years 3 months"
    timeSince.ts           — timeSince(ts: number | null, now: number): string → "2h 14m ago" / "–"
scripts/
  patch-rn-podspecs.js     — Postinstall patcher for React Native podspec compatibility
App.tsx                    — SQLiteProvider → TrackerProvider → SettingsProvider → Dashboard
index.ts                   — Entry point
```

---

## 12. What "Done" Means

A feature is done when:
1. It compiles with zero TypeScript errors under `strict: true`.
2. It handles its empty/loading/error states explicitly.
3. All time values flow through Unix epoch ms — never strings, never `new Date()` objects stored to SQLite.
4. It works correctly after the app is backgrounded for 10 minutes and resumed.
5. It works correctly when a second baby profile exists.
