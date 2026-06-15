# Phase 5 — Diaper Tracking: Plan

## Task Groups

---

### Group 1 — Context Action

**1.1** In `src/context/TrackerContext.tsx`, replace the `logDiaper` stub with a full implementation:
- Accepts `status: 'wet' | 'dirty' | 'mixed' | 'dry'` and optional `notes?: string`
- Guards on `activeBabyId`
- Constructs a `DiaperLog` with `Crypto.randomUUID()`, `timestamp: Date.now()`
- Calls `insertLog(db, log)`
- Calls `refreshLogs()`
- Wrapped in `try/catch` with `console.error` and re-throws

Remove the `_status` and `_notes` underscore prefixes and the `// Phase 5` comment.

---

### Group 2 — Dashboard State & Handlers

**2.1** In `src/screens/Dashboard.tsx`, add `logDiaper` to the `useTracker()` destructure.

**2.2** Add state for the pending diaper notes flow:
- `diaperNotesVisible: boolean`
- `pendingDiaperStatus: DiaperLog['status'] | null`

**2.3** Add handlers:
- `handleDiaperPress(status)` → calls `logDiaper(status)` directly
- `handleDiaperLongPress(status)` → sets `pendingDiaperStatus = status`, sets `diaperNotesVisible = true`
- `handleDiaperNoteSaved(notes)` → calls `logDiaper(pendingDiaperStatus!, notes)`, closes modal, resets `pendingDiaperStatus`

**2.4** Import `DiaperLog` type if not already imported (needed for `DiaperLog['status']` in state typing).

---

### Group 3 — Dashboard UI Row

**3.1** Add a diaper button row below the Bottle/Solids row in the action zone JSX:

```
[ wet (flex:1) | dirty (flex:1) | mixed (flex:1) | dry (flex:1) ]
```

Each button:
- `onPress={() => handleDiaperPress(status)}`
- `onLongPress={() => handleDiaperLongPress(status)}`
- `delayLongPress={400}`
- Height ≥ 44px (target: 48px for comfortable one-handed tap)
- Background: `COLORS.diaper`
- Label: capitalised status string

**3.2** Add styles `diaperRow` and `diaperButton` / `diaperButtonLabel` to `StyleSheet.create`.

---

### Group 4 — Notes Modal Wiring

**4.1** Add a `NotesModal` instance at the bottom of the Dashboard JSX:

```tsx
<NotesModal
  visible={diaperNotesVisible}
  title={`Add Note — ${capitalize(pendingDiaperStatus ?? '')}`}
  onSave={handleDiaperNoteSaved}
  onDismiss={() => { setDiaperNotesVisible(false); setPendingDiaperStatus(null); }}
/>
```

**4.2** Add a small `capitalize` helper (or inline template literal) for the modal title. Keep it local to Dashboard — no need for a shared util.

---

### Group 5 — Log Card Display

**5.1** Update `labelForLog` in Dashboard to return `DIAPER · Wet`, `DIAPER · Dirty`, `DIAPER · Mixed`, or `DIAPER · Dry` for diaper logs.

`durationForLog` already returns `''` for diaper — no change needed there.

---

### Group 6 — TypeScript & Cleanup

**6.1** Run `npx tsc --noEmit` — zero errors required.

**6.2** Confirm the `BabyLog` switch in `labelForLog` remains exhaustive after the `diaper` arm update.

**6.3** Verify no hardcoded colors in new or modified code.
