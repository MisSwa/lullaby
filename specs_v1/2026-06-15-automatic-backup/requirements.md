# Phase 7 — Automatic Backup: Requirements

## Goal

Every time the user backgrounds the app, a JSON snapshot of all data is silently written to cloud storage. The user is never interrupted. Backup failures are logged but never surfaced as UI errors.

---

## Scope

### In Scope

- `src/services/backup.ts` — `exportSnapshot(db)` serializes all `babies` and `baby_logs` rows into a single JSON object
- Backup triggered on `AppState` change to `'background'` — fire and forget, no UI impact
- File name: `lullaby_backup_YYYY-MM-DD.json` (ISO date, overwrite same-day file on each background)
- **iOS:** write to the app's iCloud Documents container via `expo-file-system`
- **Android:** write to the app-scoped Google Drive folder via the Drive Files API, using one-time OAuth via `expo-auth-session`
- Errors caught and logged to `console.error` only — no user-facing error dialogs, no loading states
- No restore / import UI in this phase

### Out of Scope

- Manual backup trigger in UI
- Restore or import from backup file (deferred to v2)
- Backup status indicator or last-backup timestamp shown to user
- Multiple backup file history (one file per day, overwritten)

---

## Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| Android | Implement Drive OAuth via `expo-auth-session` | User confirmed both platforms in scope for v1 |
| Plan order | Service first | `exportSnapshot` must exist before filesystem or wiring code can be written |
| Validation | Console log path + Files app check AND expo-file-system readback | Belt-and-suspenders per user request |
| Android OAuth type | One-time OAuth; tokens stored in-memory for the session | CLAUDE.md exception: Drive OAuth is the only non-user-facing account permitted |
| Trigger location | `AppState` listener in `App.tsx` (root level) | Backup is app-wide, not scoped to a screen or context |
| File collision | Overwrite same-day file | Simple and predictable; no file accumulation |

---

## Backup File Format

```
lullaby_backup_2026-06-15.json
```

Content structure (JSON):

```
{
  "exportedAt": <Unix epoch ms>,
  "babies": [ ...all rows from babies table as objects ],
  "logs": [ ...all rows from baby_logs table as objects ]
}
```

All values are their native types from SQLite — integers, strings, or null. No transformations or renaming.

---

## New Dependencies

| Package | Purpose |
|---|---|
| `expo-file-system` | Writing the backup JSON file to iCloud / local filesystem |
| `expo-auth-session` | Android: one-time OAuth token exchange for Google Drive |

Both must be added to `CLAUDE.md` and `specs/tech-stack.md` approved lists before use.

---

## Platform Behaviour

### iOS

- Write path: `FileSystem.documentDirectory + 'lullaby_backup_YYYY-MM-DD.json'`
- iCloud sync is automatic when the iCloud Documents entitlement is configured in the Expo build config (`app.json` or `app.config.js`)
- No additional user action required

### Android

- One-time OAuth via `expo-auth-session` using Google's OAuth 2.0 endpoint
- Scopes required: `https://www.googleapis.com/auth/drive.file` (app-scoped; does not access the user's full Drive)
- Token is held in memory for the session; if the token expires or is absent, the backup is skipped silently and an error is logged
- Upload via the Drive Files API multipart upload endpoint
- File is named `lullaby_backup_YYYY-MM-DD.json` in the app's Drive folder

---

## Constraints (from CLAUDE.md / tech-stack.md)

- `expo-file-system` and `expo-auth-session` are the only new packages this phase
- No HTTP client libraries — use native `fetch` for the Drive API call
- Backup must never block the UI thread or show any loading state
- All async operations wrapped in `try/catch` with `console.error`
- No `any` type in new or modified files
- No user-facing error dialog for backup failures — log only
