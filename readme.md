# Lullaby

A premium, local-first baby tracking app for iOS and Android. Built for new parents who need to log feeds, sleep, and diapers quickly — often one-handed, often at 3am.

**$5.00. Once. No subscription. No ads. No accounts.**

---

## What It Does

Lullaby lets you track everything that matters in the first months of a baby's life — without friction, without loading screens, and without a paywall in the way.

Every core action is reachable in a single tap from the moment the app opens. The dashboard stays on one screen. You never navigate away to log something.

### Tracking

**Sleep** — Tap once to start a sleep session. The button shows a live elapsed timer while your baby is sleeping. Tap again to end it. The session is saved with a precise start and end time. You can optionally add a note before saving.

**Breast feeding** — Two independent timers, one for each side. Starting one side automatically pauses the other, so you never have to think about which timer is running. Both timers accumulate across pauses. When you're done, a Save button appears and logs the full session with left and right durations recorded separately.

**Bottle feeding** — Tap the Bottle button to open a numeric input. Enter the amount in millilitres and save. Long-pressing the button lets you add a note first.

**Solids** — A single tap logs a solids entry immediately. Long-press to add a note before saving.

**Diaper changes** — Four buttons in a row: wet, dirty, mixed, dry. Tap the right one and the log appears instantly. Long-press to add a note.

### Log List

Every event you log appears in a reverse-chronological list showing today's activity for the currently selected baby. Each card shows the type, time, and duration or amount where relevant. Tap the ✕ on any card to delete it.

### Multi-baby Support

A dropdown in the header lets you switch between baby profiles. All tracking and log data is scoped to whichever baby is currently selected. You can add additional profiles at any time from the same header.

### Smart Notifications

The app sends local push reminders when it has been too long since the last logged event. There are three independent reminder types — feed, diaper, and sleep — each with its own on/off toggle and configurable time threshold. Defaults are three hours for feeds, four hours for diapers, and two hours for sleep. You can adjust these from the settings panel, which is accessible via the gear icon in the header. Notification permission is requested once, during onboarding.

---

## Design Principles

**One-handed first.** Every primary button meets a minimum 44pt touch target. The main sleep button is 90pt tall. The app is designed to be usable while holding a baby in the other arm.

**No accounts, no cloud, no data harvesting.** Everything is stored locally on the device using SQLite. There is no login, no email address, no server that holds your data.

**Honest pricing.** Five dollars, paid once. Nothing is gated, nothing expires, nothing asks you to subscribe.

**Timer accuracy across backgrounding.** When the app is sent to the background mid-session, timers do not drift. All active sessions store their start time as an absolute Unix timestamp. When the app returns to the foreground, elapsed time is calculated from the wall clock, not from a paused counter. A session running for ten minutes while the app is closed will show ten minutes when you return.

**Sage green, not purple.** The colour palette is a premium Sage Green and Slate. This is a hard constraint — the app will never use the Huckleberry purple.

---

## Architecture

Lullaby is a React Native app built with Expo. It runs on both iOS and Android from a single codebase.

**Single screen.** There is no navigation library. The entire app lives on one screen — `Dashboard`. Supplementary flows like onboarding, adding a baby, entering a bottle amount, or writing a note use React Native `Modal` components rather than navigation pushes. This keeps the interaction model simple and fast.

**State management.** All app state is managed with React Context and native hooks. There are two contexts: `TrackerContext`, which owns all tracking state and log data, and `SettingsContext`, which owns notification preferences. No third-party state library is used.

**Persistence.** The only storage layer is SQLite via `expo-sqlite`. There are two tables: `babies` for profiles, and `baby_logs` for all tracking events. All timestamps are stored as Unix epoch milliseconds — never as strings, never as formatted dates. A `settings` key-value table stores notification preferences.

**Notifications.** Local push notifications are scheduled via `expo-notifications`. When you save a log, any pending reminder for that event type is cancelled and a new one is scheduled based on your configured threshold. Deleting a log also cancels its reminder.

**TypeScript.** The codebase is written in strict TypeScript with no `any` types permitted. All discriminated union arms are handled exhaustively. All async functions touching SQLite or notifications are wrapped in `try/catch`.

---

## Project Structure

The source lives in `src/` and is organised by layer:

- `theme/` — colour palette and typography constants. Every colour in the app comes from here; nothing is hardcoded inline.
- `types/` — all TypeScript interfaces and discriminated unions for logs, babies, and settings.
- `services/` — SQLite database access. Components never call the database directly; they go through context actions.
- `context/` — `TrackerContext` and `SettingsContext`.
- `hooks/` — `useLiveTick` for 1-second timer intervals, `useNotifications` for scheduling and cancelling local reminders.
- `screens/` — `Dashboard` and `AppShell`.
- `modals/` — `OnboardingModal`, `AddBabyModal`, `BottleLogModal`, `NotesModal`, `SettingsModal`.

The `specs/` directory contains per-phase planning documents including requirements, task plans, and validation checklists. Each phase of development has its own folder.

---

## Roadmap

The app is built in phases, each a self-contained vertical slice.

| Phase | Description | Status |
|---|---|---|
| 0 | Project skeleton — folder structure, theme, types, database wiring | Complete |
| 1 | Onboarding and baby profiles | Complete |
| 2 | Sleep tracking with live timer and log list | Complete |
| 3 | Breast feed tracking with L/R timers and auto-pause | Complete |
| 4 | Bottle and solids logging | Complete |
| 5 | Diaper tracking with four status options | Complete |
| 6 | Smart notifications — configurable local reminders per event type | Complete |
| 7 | Automatic background backup to iCloud / Google Drive | Planned |
| 8 | Polish, app icon, store submission | Planned |

Features deferred to a future version include a history view with date navigation, charts and pattern analysis, data import from backup files, growth tracking, and baby photos.

---

## Development

The project uses Expo's managed workflow. All dependencies are approved in `CLAUDE.md` and `specs/tech-stack.md`. Adding a new package requires updating those documents first.

The development constitution is in `CLAUDE.md` at the root of the repository. It defines the colour palette, architecture rules, approved dependencies, data schema, and what "done" means for a feature. All code in this project is written to conform to it.
