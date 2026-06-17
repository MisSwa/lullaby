# Phase 4 — Bottle & Solids Logging: Requirements

## Goal

Complete the feed tracking surface. A parent can log a bottle with a decimal ml amount, or solids with a single tap. Both support optional notes via long-press.

---

## Scope

### In Scope

- `BottleLogModal` — numeric input for ml amount (decimal, minimum 1ml), save button, validation error if below minimum
- Bottle tap target on the dashboard — opens `BottleLogModal` on tap; opens `NotesModal` on long-press before presenting `BottleLogModal`
- Solids tap target on the dashboard — logs immediately on tap; opens `NotesModal` on long-press before saving
- `logBottle(amountMl: number, notes?: string)` action in `TrackerContext`
- `logSolids(notes?: string)` action in `TrackerContext`
- Both actions call `insertLog` in `db.ts` with `feedType: 'bottle'` or `feedType: 'solids'`
- Log list cards for bottle (label, time, amount in ml) and solids (label, time)
- `NotesModal` is reused from Phase 3 — no changes to the modal itself

### Out of Scope for This Phase

- Serving size presets or recent amounts
- Unit conversion (ml ↔ oz)
- Editing a saved log
- History or date browsing

---

## Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| Bottle amount precision | Decimal allowed, minimum 1ml enforced | Supports e.g. 87.5ml; rejects 0 before save; numeric keyboard handles the input |
| Dashboard layout | Single row: `[ Bottle \| Solids ]` below the breast feed row | Consistent with the L/R side-by-side pattern above; natural visual grouping by function |
| Notes access | Long-press on either button opens `NotesModal` before saving | Tap = instant save; long-press = annotate first; matches CLAUDE.md spec intent for diaper long-press |

---

## Data

Both log types use `baby_logs` with `type: 'feed'`:

```
bottle: { type: 'feed', feedType: 'bottle', amountMl: number (float, ≥ 1), timestamp: now, notes?: string }
solids: { type: 'feed', feedType: 'solids', amountMl: 0, timestamp: now, notes?: string }
```

No new columns are needed — `amountMl` already supports this in the schema.

---

## Constraints (from CLAUDE.md / tech-stack.md)

- All colors through `COLORS` — no inline hex
- No date libraries — `Intl.DateTimeFormat` or `.toLocaleTimeString()` only
- Decimal amount stored as `REAL` in SQLite via the existing `amountMl INTEGER` column — check if this needs updating to `REAL`. If the column is `INTEGER`, storing 87.5 will truncate. **Resolution: store as `Math.round(amountMl * 10)` (tenths of ml as integer) and divide on read, OR update column type to `REAL`. Prefer `REAL` column — update schema migration if needed.**
- `expo-crypto` for UUID; `Math.random()` banned
- Components must not call `db` directly — all through `TrackerContext`
- Touch targets ≥ 44×44pt; primary action buttons ≥ 90px tall

---

## Open Questions at Implementation Time

- Verify whether the existing `amountMl INTEGER` column accepts `REAL` values in SQLite (SQLite is loosely typed — `INTEGER` affinity will accept floats). Confirm behavior and document.
- `BottleLogModal` keyboard type: `decimal-pad` on iOS; `numeric` on Android — handle platform difference.
