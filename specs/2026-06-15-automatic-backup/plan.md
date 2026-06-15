# Phase 7 — Automatic Backup: Plan

## Task Groups

---

### Group 1 — `exportSnapshot` Service

**1.1** Create `src/services/backup.ts`.

Define a `BackupPayload` type:

```
{
  exportedAt: number;          // Unix epoch ms
  babies: BabyRow[];           // raw rows from babies table
  logs: BabyLogRow[];          // raw rows from baby_logs table
}
```

Where `BabyRow` and `BabyLogRow` are plain object types mirroring the SQLite column shapes (all fields typed explicitly — no `any`).

**1.2** Implement `exportSnapshot(db: SQLiteDatabase): Promise<string>`:
- Queries `SELECT * FROM babies ORDER BY created_at ASC`
- Queries `SELECT * FROM baby_logs ORDER BY timestamp DESC`
- Assembles a `BackupPayload` with `exportedAt: Date.now()`
- Returns `JSON.stringify(payload)`
- Wrapped in `try/catch` with `console.error`; re-throws so callers can handle

**1.3** Implement `buildBackupFileName(): string`:
- Returns `lullaby_backup_YYYY-MM-DD.json` using `Intl.DateTimeFormat` or plain `Date` arithmetic — no date library

---

### Group 2 — iOS iCloud Write

**2.1** Implement `writeBackupIOS(json: string): Promise<void>` in `backup.ts`:
- Constructs path: `FileSystem.documentDirectory + buildBackupFileName()`
- Calls `FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 })`
- On success, logs `console.log('Backup written to:', path)`
- Immediately reads back the file and logs its byte length to confirm a valid write: `FileSystem.getInfoAsync(path)` — use the `size` field
- Wrapped in `try/catch`; logs error but does not throw (fire-and-forget contract)

**2.2** Install `expo-file-system` (`npx expo install expo-file-system`).

---

### Group 3 — Android Google Drive Write

**3.1** Install `expo-auth-session` (`npx expo install expo-auth-session`).

**3.2** Create `src/services/driveAuth.ts`:
- Exports `signInWithGoogle(): Promise<string | null>` — returns an access token or `null` on failure/cancellation
- Uses `AuthSession.makeRedirectUri` and `Google.useAuthRequest` (or the imperative `promptAsync` flow)
- OAuth scopes: `openid`, `email`, `https://www.googleapis.com/auth/drive.file`
- Token stored in a module-level variable (in-memory, not persisted)
- Wrapped in `try/catch`; returns `null` on error and logs with `console.error`

**3.3** Implement `writeBackupAndroid(json: string, accessToken: string): Promise<void>` in `backup.ts`:
- Uses native `fetch` to call the Drive Files API multipart upload:
  `POST https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`
- Request body: multipart/related with metadata part (`name`, `mimeType: 'application/json'`) and media part (the JSON string)
- `Authorization: Bearer <accessToken>` header
- On success, logs `console.log('Backup uploaded to Drive')`
- Immediately performs a readback confirmation: fetch the file's `size` from `GET https://www.googleapis.com/drive/v3/files/<id>?fields=size` and log it
- Wrapped in `try/catch`; logs error, does not throw

---

### Group 4 — AppState Trigger in App.tsx

**4.1** In `App.tsx`, import `AppState` from `react-native`, `exportSnapshot` from `@services/backup`, and the platform-specific write functions.

**4.2** Add a `useEffect` at the root level (inside the `SQLiteProvider` tree so `db` is accessible via a small wrapper component `BackupManager`) that:
- Subscribes to `AppState.addEventListener('change', handler)`
- In `handler`: when `nextState === 'background'`:
  - Calls `exportSnapshot(db)` to get the JSON string
  - On iOS (`Platform.OS === 'ios'`): calls `writeBackupIOS(json)`
  - On Android (`Platform.OS === 'android'`): retrieves the stored token from `driveAuth`; if token is present calls `writeBackupAndroid(json, token)`; if absent, logs `console.warn('Drive backup skipped — not authenticated')`
  - Entire handler wrapped in `try/catch` with `console.error`; never throws
- Cleans up subscription on unmount

**4.3** Create `src/components/BackupManager.tsx` — a renderless component (`return null`) that contains the above `useEffect`. Mount it inside `SQLiteProvider` in `App.tsx` so it has access to `useSQLiteContext()`. This keeps `App.tsx` clean.

**4.4** On Android first launch (or when token is absent), trigger `signInWithGoogle()` once during or after onboarding so the token is available before the first background event. Wire this call into `OnboardingModal` alongside the notification permission request — after `createBaby` resolves, call `signInWithGoogle()` on Android only (`Platform.OS === 'android'`), fire and forget.

---

### Group 5 — Build Config

**5.1** In `app.json` (or `app.config.js`), add the iCloud entitlement for iOS:

```json
"ios": {
  "entitlements": {
    "com.apple.developer.icloud-services": ["CloudDocuments"],
    "com.apple.developer.icloud-container-identifiers": ["iCloud.$(CFBundleIdentifier)"]
  }
}
```

**5.2** Add Google OAuth client IDs for Android in `app.json`:

```json
"android": {
  "googleServicesFile": "./google-services.json"
}
```

Note any required Google Cloud Console setup (OAuth consent screen, Drive API enabled, client IDs) in a comment in `driveAuth.ts`.

---

### Group 6 — TypeScript & Cleanup

**6.1** Run `npx tsc --noEmit` — zero errors required.

**6.2** Verify no `any` type in `backup.ts`, `driveAuth.ts`, or `BackupManager.tsx`.

**6.3** Confirm `BackupPayload`, `BabyRow`, and `BabyLogRow` types are fully explicit.

**6.4** Verify no backup error is ever re-thrown to the UI layer — all `catch` blocks terminate with `console.error`.
