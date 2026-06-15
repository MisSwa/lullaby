# Phase 4 — Bottle & Solids Logging: Plan

## Task Groups

---

### Group 1 — Types

**1.1** Verify `FeedLog` in `src/types/tracker.ts` already has `feedType: 'bottle' | 'solids'` and `amountMl` field. Add if missing.

**1.2** Confirm `amountMl` is typed as `number` (not `integer`) in the TypeScript interface to allow decimals.

---

### Group 2 — Database

**2.1** Open `src/services/db.ts` and check the `amountMl` column declaration. SQLite uses type affinity — `INTEGER` affinity will coerce `87.5` to `87`. Change column affinity to `REAL` if needed.

**2.2** If the column type needs updating: add a migration step inside `initializeDatabase` that runs `ALTER TABLE baby_logs RENAME COLUMN amountMl TO amountMl_old` + `ALTER TABLE baby_logs ADD COLUMN amountMl REAL` and migrates data. Alternatively, since SQLite is loosely typed and we may not have shipped data yet, simply update the `CREATE TABLE IF NOT EXISTS` declaration to `amountMl REAL` and document the change.

**2.3** Add `insertBottleLog(babyId, amountMl, notes?)` and `insertSolidsLog(babyId, notes?)` helper functions in `db.ts`, or confirm existing `insertLog` is generic enough to handle these without new functions.

---

### Group 3 — Context Actions

**3.1** In `src/context/TrackerContext.tsx`, add `logBottle(amountMl: number, notes?: string): Promise<void>`:
- Validates `amountMl >= 1`
- Calls `insertLog` with `type: 'feed'`, `feedType: 'bottle'`, `amountMl`, `timestamp: Date.now()`
- Refreshes today's log list

**3.2** Add `logSolids(notes?: string): Promise<void>`:
- Calls `insertLog` with `type: 'feed'`, `feedType: 'solids'`, `amountMl: 0`, `timestamp: Date.now()`
- Refreshes today's log list

**3.3** Expose both actions on the `TrackerContext` type interface.

---

### Group 4 — BottleLogModal

**4.1** Create `src/modals/BottleLogModal.tsx`:
- Props: `visible: boolean`, `onClose(): void`, `onSave(amountMl: number, notes?: string): void`, `prefillNotes?: string`
- Contains a `TextInput` with `keyboardType="decimal-pad"` (iOS) / `"numeric"` (Android)
- Inline validation: disable save button if parsed value < 1 or empty; show a subtle error label
- "Save" calls `onSave(parsedAmount)` and closes
- "Cancel" calls `onClose()` without saving
- Follows `COLORS` and `StyleSheet.create` — no inline colors

**4.2** Add the modal to `Dashboard.tsx` state: `bottleModalVisible`, `pendingBottleNotes` (populated when launched from long-press notes flow).

---

### Group 5 — Dashboard Buttons

**5.1** In `src/screens/Dashboard.tsx`, add a new row below the breast feed row:
```
[ Bottle (flex: 1) ] [ Solids (flex: 1) ]
```
Both buttons ≥ 44px tall (primary tap targets, not 90px since they're secondary to the timed feeds).

**5.2** Bottle button:
- `onPress` → open `BottleLogModal` (no pre-filled notes)
- `onLongPress` → open `NotesModal` first; on save from `NotesModal`, pass the notes string into `BottleLogModal` as `prefillNotes`, then open `BottleLogModal`

**5.3** Solids button:
- `onPress` → call `logSolids()` immediately, no modal
- `onLongPress` → open `NotesModal`; on save, call `logSolids(notes)`

**5.4** Both buttons use `COLORS.feed` as their accent color.

---

### Group 6 — Log List Cards

**6.1** In the log list renderer (inside `Dashboard.tsx` or extracted component), add handling for `feedType === 'bottle'` and `feedType === 'solids'`:
- Bottle card: `FEED · Bottle · {amountMl}ml` — format amount: show integer if `.0`, otherwise one decimal place (e.g. `90ml`, `87.5ml`)
- Solids card: `FEED · Solids`
- Both cards show timestamp formatted with `.toLocaleTimeString()`
- Both use `COLORS.feed` color strip

**6.2** Confirm existing exhaustive switch on `BabyLog` type handles `feedType` sub-cases without TypeScript errors.

---

### Group 7 — Wiring & Cleanup

**7.1** Export `BottleLogModal` from its file and import it in `Dashboard.tsx`.

**7.2** Add `logBottle` and `logSolids` to the `TrackerContext` consumer in `Dashboard.tsx`.

**7.3** Run TypeScript check — zero errors under `strict: true`.

**7.4** Verify no hardcoded colors in any new or touched file.
