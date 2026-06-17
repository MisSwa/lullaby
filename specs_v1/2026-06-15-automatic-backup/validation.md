# Phase 7 — Automatic Backup: Validation

## Exit Criteria

All of the following must be true before this branch can be merged.

---

### TypeScript

- [ ] `npx tsc --noEmit` exits with zero errors.
- [ ] No `any` type in `backup.ts`, `driveAuth.ts`, or `BackupManager.tsx`.
- [ ] `BackupPayload`, `BabyRow`, and `BabyLogRow` types are explicitly defined — no inline type shortcuts.

---

### exportSnapshot

- [ ] With at least one baby and one log in the database, `exportSnapshot` returns a valid JSON string.
- [ ] The JSON parses to an object with `exportedAt` (number), `babies` (array), and `logs` (array).
- [ ] `babies` contains the correct number of rows matching the `babies` table.
- [ ] `logs` contains the correct number of rows matching the `baby_logs` table.
- [ ] `exportedAt` is a recent Unix epoch ms value.

---

### iOS — Console Log Validation

_Connect device to Metro, background the app, and inspect the console._

- [ ] When the app is backgrounded, a log line appears: `Backup written to: <path>` with a valid `.json` filename containing today's date.
- [ ] A second log line appears confirming the file size in bytes (from `FileSystem.getInfoAsync`). The size is greater than zero.
- [ ] Background the app a second time on the same day — the same filename is used (overwrite, not a second file).
- [ ] Background the app with no data (fresh install, no logs) — a backup still writes with empty `babies` and `logs` arrays; no crash.

---

### iOS — Files App Validation

- [ ] Open the Files app on the device → iCloud Drive → Lullaby folder.
- [ ] `lullaby_backup_YYYY-MM-DD.json` is present.
- [ ] Opening the file shows valid JSON with `exportedAt`, `babies`, and `logs` fields.
- [ ] After logging a new event and re-backgrounding, the file is updated (check `exportedAt` timestamp).

---

### Android — Console Log Validation

_Connect device to Metro, complete the Drive OAuth flow (triggered in onboarding), background the app._

- [ ] After OAuth completes, an access token is held in memory (confirmed by log in `driveAuth.ts`).
- [ ] When the app is backgrounded, a log line appears: `Backup uploaded to Drive`.
- [ ] A second log line confirms the file size in bytes from the Drive readback fetch. Size is greater than zero.
- [ ] If the app is freshly installed and OAuth has not been completed, backgrounding logs `Drive backup skipped — not authenticated` — no crash.

---

### Android — Drive Validation

- [ ] Log into the Google account used during OAuth on a desktop browser.
- [ ] Open Google Drive → find the file in the Lullaby app folder (`drive.file` scope — it will not appear in "My Drive" root).
- [ ] `lullaby_backup_YYYY-MM-DD.json` is present with valid JSON content.

---

### Error Handling

- [ ] Simulate a write failure on iOS (e.g., revoke iCloud access in Settings) — the app does not crash, no error dialog appears, and `console.error` logs the failure.
- [ ] Simulate an expired/invalid Drive token on Android — the backup is skipped silently with a `console.error` log.
- [ ] No backup error is ever re-thrown to the UI layer — confirmed by code review of all `catch` blocks in `backup.ts` and `driveAuth.ts`.

---

### Code Quality

- [ ] `BackupManager` is a renderless component (`return null`) — no UI rendered.
- [ ] The `AppState` listener in `BackupManager` is cleaned up on unmount (subscription removed).
- [ ] `exportSnapshot` is called only on background transition — not on foreground, not on launch.
- [ ] No backup logic lives in `TrackerContext`, `Dashboard`, or any screen/modal component.
- [ ] The Drive OAuth token is in-memory only — not written to SQLite or `AsyncStorage`.
