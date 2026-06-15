# Phase 6 — Smart Notifications: Validation

## Exit Criteria

All of the following must be true before this branch can be merged.

---

### TypeScript

- [ ] `npx tsc --noEmit` exits with zero errors.
- [ ] No `any` type in new or modified files.
- [ ] `NotificationType` union (`'feed' | 'diaper' | 'sleep'`) is exhaustively handled in all switch statements.
- [ ] `logTypeToNotifType` covers all three arms with no default catch-all.

---

### Infrastructure

- [ ] `settings` table is created on fresh install — visible in console log from `initializeDatabase`.
- [ ] After updating a threshold and force-quitting the app, re-opening reflects the saved value.
- [ ] After toggling a type off and force-quitting, re-opening shows it persisted as disabled.
- [ ] `getSetting` and `setSetting` are wrapped in `try/catch` with `console.error`.

---

### Permission Request

- [ ] On first launch: after completing onboarding and tapping Save, the system permission dialog appears.
- [ ] If permission is denied: the app continues normally; no crash; the inline denial message appears beneath the save button.
- [ ] Subsequent launches after permission has been resolved: no second permission dialog.
- [ ] No permission dialog appears on any screen other than `OnboardingModal`.

---

### Short-Threshold Manual Test (Expo Go)

_Before each test: open SettingsModal and set the relevant threshold to 1 minute. This tests the full user-facing flow without waiting hours._

- [ ] **Feed notification fires:** Log any feed event → background the app → wait ~1 min → notification appears with correct title and body.
- [ ] **Diaper notification fires:** Log a diaper event → background → wait ~1 min → notification appears.
- [ ] **Sleep notification fires:** Stop a sleep session → background → wait ~1 min → notification appears.
- [ ] **Cancel on re-log:** Log a feed (t=0) → wait 30s → log another feed → only one notification fires at ~1 min from the second log; no earlier notification arrives.
- [ ] **Cancel on delete:** Log a feed → wait 30s → delete the log card → no notification fires.
- [ ] **Disabled type:** Disable feed in SettingsModal → log a feed → background → no notification fires after the threshold.
- [ ] **Threshold change takes effect:** Log a feed with threshold at 2 min → change threshold to 1 min → log another feed → notification fires at ~1 min (not 2 min) from the second log.

---

### Multi-baby Notification Body

- [ ] Single baby profile: notification title does **not** include the baby's name (generic title only).
- [ ] Two baby profiles, Baby A active: notification title includes Baby A's name.
- [ ] Switch to Baby B, log an event: notification title includes Baby B's name.

---

### Expo Notification Console Verification

_Add temporary `console.log` statements during development — confirmed removed before merge._

- [ ] After logging a feed, console shows `scheduleReminder('feed', ...)` called with the correct `thresholdMinutes`.
- [ ] After logging a second feed, console shows `cancelReminder('feed')` called before `scheduleReminder`.
- [ ] After `removeLog`, console shows `cancelReminder` called with the correct type.
- [ ] Scheduled notification identifier is a non-empty string (confirm from `Notifications.scheduleNotificationAsync` return value log).
- [ ] All temporary `console.log` statements are removed from committed code.

---

### Settings UI

- [ ] Gear icon (⚙) is visible in the dashboard header.
- [ ] Tapping the gear icon opens `SettingsModal`.
- [ ] All three notification types (Feed, Diaper, Sleep) are present in `SettingsModal`.
- [ ] Toggling a type off and re-opening settings shows it persisted as off.
- [ ] Changing a threshold and re-opening settings shows the new value.
- [ ] "Done" button dismisses the modal.
- [ ] All interactive elements in `SettingsModal` are ≥ 44px tall.
- [ ] No hardcoded colors in `SettingsModal` or header gear button.

---

### Code Quality

- [ ] `useNotifications` does not import `useTracker` or `useSettings` — all data arrives as parameters.
- [ ] No direct `db` calls from any component or modal.
- [ ] All `Notifications.*` calls wrapped in `try/catch` with `console.error`.
- [ ] No side effects inside render functions in new or modified files.
- [ ] `useEffect` dependency arrays in `SettingsContext` are complete and correct.
