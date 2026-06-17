# Lullaby — Tech Stack

## Core Framework

| Layer | Choice | Rationale |
|---|---|---|
| Language | TypeScript (`strict: true`) | Paid-app quality bar. All types explicit. No `any`. |
| UI Framework | React Native | Cross-platform iOS + Android from one codebase. |
| Runtime | Expo SDK (version TBD at project init) | Managed ecosystem, OTA updates, EAS Build access. |
| Build tooling | To be decided at project setup | Managed workflow preferred; bare workflow only if a native module requires it. |

## State Management

**React Context + Native Hooks only.** No third-party state library (no Redux, Zustand, Jotai, MobX, Recoil, etc.).

Two contexts:
- `TrackerContext` — all tracking state (logs, active sessions, baby profiles, active baby)
- `SettingsContext` — notification preferences and app configuration

## Persistence

**SQLite via `expo-sqlite`.** This is the only persistent store. There is no remote database, no REST API, no GraphQL endpoint.

Two tables:
- `babies` — baby profiles (id, name, dob, created_at)
- `baby_logs` — all tracking events scoped to a baby_id

All timestamps stored as Unix epoch milliseconds (`INTEGER`). No ISO strings in the database.

## Approved Dependencies

Only the packages listed here are permitted. Adding any new dependency requires updating this file first.

| Package | Purpose |
|---|---|
| `expo-sqlite` | Local database |
| `expo-crypto` | UUID generation (`Crypto.randomUUID()`) — `Math.random()` is banned for IDs |
| `expo-notifications` | Local push notifications for smart feed/diaper/sleep reminders |
| `expo-file-system` | Reading and writing backup JSON files |
| `expo-document-picker` | Accessing iCloud (iOS) and Google Drive (Android) for backup storage |

## Navigation

**None.** There is no navigation library in this project. The entire app is a single screen (`Dashboard.tsx`). Supplementary flows (onboarding, adding a baby, inputting notes or bottle amounts) use React Native `Modal` components rendered inline.

## Styling

`StyleSheet.create()` only. No styled-components, no NativeWind, no CSS-in-JS library. All color values come from `src/theme/colors.ts`. No hardcoded color strings in component files.

## Forbidden Categories

The following categories of dependency are permanently off-limits:

- HTTP clients (axios, fetch wrappers) — there is no network layer
- Analytics or crash reporting SDKs — no data leaves the device
- UI component libraries (NativeBase, RN Paper, Tamagui, etc.)
- Date formatting libraries (use `Intl.DateTimeFormat` or `.toLocaleTimeString()`)
- Navigation libraries (React Navigation, Expo Router)
- State management libraries (see above)

## Code Quality Constraints

- `strict: true` in `tsconfig.json`
- `exhaustive-deps` ESLint rule enforced for `useEffect`
- All `async` functions touching SQLite or notifications wrapped in `try/catch`
- No silent error swallowing — at minimum `console.error`
- All discriminated union arms (`BabyLog` type) handled exhaustively in switch statements
- No side effects inside render functions
- Components never call `db` directly — all mutations go through context actions
