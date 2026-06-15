# Phase 6 — Smart Notifications: Requirements

## Goal

The app proactively nudges parents when too much time has elapsed since the last logged event. Notification preferences are configurable and persisted locally. Permission is requested during onboarding, not on first feature use.

---

## Scope

### In Scope

- Local push notifications for **three types**: `feed`, `diaper`, `sleep`
- Default thresholds: feed → 3 hours (180 min), diaper → 4 hours (240 min), sleep → 2 hours (120 min)
- Each type has an independent **enabled/disabled toggle** and **configurable threshold in hours**
- Preferences stored in a new `settings` SQLite key-value table, owned by `SettingsContext`
- After any `insertLog`, the existing reminder for that type is cancelled and a new one is scheduled (if enabled)
- After any `removeLog`, the reminder for that log's type is cancelled
- Notification body includes the active baby's name only when more than one profile exists
- Notification permission requested in `OnboardingModal` after first baby is saved — never at first feature use
- A `SettingsModal` accessible via a gear icon in the dashboard header
- `useNotifications` hook encapsulates all `expo-notifications` calls

### Out of Scope

- Server-side or remote push notifications (no network layer)
- Notification history or in-app notification center
- Sleep "too short" or pattern-based alerts — elapsed-time reminders only
- Restore or backup of scheduled notification identifiers

---

## Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| Notification types | Feed, diaper, sleep (all three) | Confirmed by user — full coverage for v1 |
| Plan order | Infrastructure first | `SettingsContext` and `useNotifications` hook must exist before any UI wiring |
| Validation approach | Short-threshold UI test + Expo notification console verification | Belt-and-suspenders; see `validation.md` |
| Permission timing | After first baby saved in `OnboardingModal` | `CLAUDE.md` rule: never at first feature use |
| Settings persistence | SQLite key-value `settings` table | Consistent with existing persistence model; no new dependency |
| Threshold display unit | Hours in UI, minutes in storage | Hours is user-friendly; `expo-notifications` uses seconds (convert: `thresholdMinutes * 60`) |
| Baby name in notification | Only when `babies.length > 1` | Avoids redundancy when there is only one baby |
| Notification identifier storage | `useRef` inside `useNotifications` | In-memory is sufficient; identifiers do not need to survive app termination |

---

## Data

New SQLite table — added to `initializeDatabase` in `src/services/db.ts`:

```sql
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL   -- JSON-serialized value
);
```

Keys used by this phase:

| Key | Default value |
|---|---|
| `notif_feed` | `{"enabled":true,"thresholdMinutes":180}` |
| `notif_diaper` | `{"enabled":true,"thresholdMinutes":240}` |
| `notif_sleep` | `{"enabled":true,"thresholdMinutes":120}` |

All values are stored as JSON strings and parsed on read. Absence of a key means the default applies.

---

## Types

Add to `src/types/tracker.ts`:

```ts
export type NotificationType = 'feed' | 'diaper' | 'sleep';

export interface NotificationPref {
  enabled: boolean;
  thresholdMinutes: number;
}

export interface NotificationSettings {
  feed: NotificationPref;
  diaper: NotificationPref;
  sleep: NotificationPref;
}
```

---

## Constraints (from CLAUDE.md / tech-stack.md)

- `expo-notifications` is the only approved notifications package — no third-party notification services
- No network calls — all notifications are local
- All SQLite calls in `SettingsContext` wrapped in `try/catch` with `console.error`
- No `any` type — `unknown` + type guards where needed
- All colors through `COLORS` — no inline hex
- Touch targets ≥ 44×44pt in `SettingsModal`
- `useNotifications` must not import any context — receives all data as parameters
- Components and modals never call `db` directly — all through context actions
