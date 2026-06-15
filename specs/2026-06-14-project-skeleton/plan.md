# Phase 0 — Project Skeleton: Implementation Plan

Each task group is independently completable. Complete them in order — later groups assume earlier ones are done.

---

## Group 1: Expo Project Initialization

1.1 Run `npx create-expo-app@latest lullaby --template blank-typescript` inside the target directory.
1.2 Verify the generated project boots: `npx expo start` → confirm Expo Go or simulator loads the default screen.
1.3 Delete all template boilerplate files that are not needed:
  - Remove `app/` directory if generated (we are not using Expo Router)
  - Remove any generated `components/`, `constants/`, `hooks/` directories from the template
  - Clear `App.tsx` down to a minimal `<View style={{ flex: 1 }} />` return
  - Remove any unused imports and sample assets from `assets/`
1.4 Confirm `npx expo start` still boots after cleanup.

---

## Group 2: TypeScript Configuration

2.1 Overwrite `tsconfig.json` with the exact shape specified in `requirements.md`.
2.2 Run `npx tsc --noEmit` — confirm zero errors against the cleaned template.
2.3 Add `"moduleResolution": "bundler"` if not already present (required for Expo SDK 52+).

---

## Group 3: Linting & Formatting

3.1 Install dev dependencies:
  ```
  npx expo install --dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-native prettier eslint-config-prettier eslint-plugin-prettier
  ```
3.2 Create `.eslintrc.js` per the configuration in `requirements.md`.
3.3 Create `.prettierrc` per the configuration in `requirements.md`.
3.4 Add scripts to `package.json`:
  ```json
  "lint": "eslint . --ext .ts,.tsx",
  "format": "prettier --write ."
  ```
3.5 Run `npm run lint` — confirm zero errors on the cleaned template.
3.6 Add `.eslintignore` to exclude `node_modules`, `dist`, `.expo`.

---

## Group 4: Folder Structure

4.1 Create the full directory tree under `src/`:
  ```
  src/
    theme/
    types/
    services/
    context/
    hooks/
    screens/
    modals/
  ```
4.2 Place a `.gitkeep` in each empty directory so they are tracked by git.
4.3 Confirm structure matches the contract in `requirements.md` exactly.

---

## Group 5: Theme & Type Contracts

5.1 Write `src/theme/colors.ts` — `COLORS` and `TYPOGRAPHY` objects per `CLAUDE.md`. No values deviate from the spec.
5.2 Write `src/types/tracker.ts` — all discriminated union types:
  - `LogType`
  - `BaseLog`
  - `SleepLog`
  - `FeedLog` (with `feedType: 'breast' | 'bottle' | 'solids'`, `leftDuration`, `rightDuration`, `amountMl`)
  - `DiaperLog`
  - `BabyLog` (union of the three)
  - `ActiveTrackers`
5.3 Write `src/types/baby.ts` — `Baby` interface (`id`, `name`, `dob: number`, `createdAt: number`).
5.4 Run `npx tsc --noEmit` — zero errors.

---

## Group 6: Database Service

6.1 Install `expo-sqlite`: `npx expo install expo-sqlite`.
6.2 Write `src/services/db.ts`:
  - `initializeDatabase(db)` — enables WAL mode, foreign keys, creates `babies` and `baby_logs` tables and index. See `requirements.md` for exact schema.
  - `insertLog(db, log)` — inserts any `BabyLog`.
  - `fetchLogsForBaby(db, babyId, dateStart, dateEnd)` — returns logs for a baby within a Unix timestamp range.
  - `deleteLog(db, id)` — hard deletes by id.
  - `createBaby(db, baby)` — inserts a baby profile.
  - `fetchBabies(db)` — returns all baby profiles ordered by `created_at`.
6.3 Every function is wrapped in `try/catch`. Errors are re-thrown after `console.error` so callers can handle them.
6.4 Run `npx tsc --noEmit` — zero errors.

---

## Group 7: Context Scaffolding

7.1 Write `src/context/TrackerContext.tsx`:
  - Defines `TrackerContextType` interface with all action signatures (no-op implementations for now).
  - `TrackerProvider` fetches babies on mount; exposes `babies`, `activeBabyId`, `setActiveBabyId`, `logs`, `active`, and all action stubs.
  - `useTracker()` hook with invariant error if called outside provider.
7.2 Write `src/context/SettingsContext.tsx`:
  - Defines `SettingsContextType` (notification prefs: `feedReminderEnabled`, `feedReminderMinutes`, `diaperReminderEnabled`, `diaperReminderMinutes`).
  - `SettingsProvider` with hardcoded defaults (no persistence yet — persistence added in Phase 6).
  - `useSettings()` hook with invariant error if called outside provider.
7.3 Run `npx tsc --noEmit` — zero errors.

---

## Group 8: App Entry Wiring

8.1 Write `App.tsx`:
  ```
  SQLiteProvider (databaseName="lullaby_local.db", onInit=initializeDatabase)
    └─ TrackerProvider
         └─ SettingsProvider
              └─ <SafeAreaView style={{ flex: 1 }} />   ← placeholder for Dashboard
  ```
8.2 Add `Suspense` wrapper around `SQLiteProvider` with a centered `ActivityIndicator` fallback using `COLORS.primary`.
8.3 Run `npx expo start` — app loads, no crash, DB init message appears in Metro console.
8.4 Run `npx tsc --noEmit` — zero errors.
8.5 Run `npm run lint` — zero errors.
