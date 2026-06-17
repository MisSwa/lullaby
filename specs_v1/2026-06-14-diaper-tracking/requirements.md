# Phase 5 — Diaper Tracking: Requirements

## Goal

A parent can log a diaper change in one tap. Four status options are always visible on the dashboard. Long-press opens an optional notes flow before saving.

---

## Scope

### In Scope

- Four diaper status buttons inline on the dashboard: **wet / dirty / mixed / dry**
- Tap any button → `logDiaper(status)` saves immediately, no modal
- Long-press any button → `NotesModal` opens → save saves with note attached
- `logDiaper(status: DiaperStatus, notes?: string)` action implemented in `TrackerContext`
- `DiaperLog` cards in the today log list: label `DIAPER · {Status}` + timestamp
- Delete works the same as all other log cards (existing ✕ button)

### Out of Scope

- Editing a saved diaper log
- Diaper change reminders (deferred to Phase 6 — Smart Notifications)
- Amount or notes field inside a dedicated modal (no diaper-specific modal needed)

---

## Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| Notes access | Long-press all four buttons opens `NotesModal` | Consistent with Phase 4 bottle/solids pattern; tap = instant, long-press = annotate |
| Dashboard layout | Single row of four equal-width buttons below the Bottle/Solids row | Matches roadmap spec; all four fit in one row with `flex: 1` each |
| Card label format | `DIAPER · Wet`, `DIAPER · Dirty`, `DIAPER · Mixed`, `DIAPER · Dry` | Consistent with `FEED · Bottle` / `FEED · Solids` pattern from Phase 4 |

---

## Data

Uses existing `baby_logs` schema — no new columns needed:

```
{ type: 'diaper', status: 'wet' | 'dirty' | 'mixed' | 'dry', timestamp: Date.now(), notes?: string }
```

`DiaperLog` type already defined in `src/types/tracker.ts`. `logDiaper` stub already exists in `TrackerContext`.

---

## Constraints (from CLAUDE.md / tech-stack.md)

- All colors through `COLORS` — no inline hex
- Touch targets ≥ 44×44pt; diaper buttons must meet this minimum
- No date libraries — `.toLocaleTimeString()` only (already used)
- Components must not call `db` directly — mutations through `TrackerContext`
- All `async` functions touching SQLite wrapped in `try/catch` with `console.error`
- `DiaperLog['status']` is a discriminated union arm — must be handled exhaustively in any switch

---

## Interaction Pattern (mirrors Phase 4)

```
Tap   →  logDiaper(status)  →  DiaperLog card appears
Long-press  →  NotesModal("Add Note — {Status}")  →  save  →  logDiaper(status, notes)
```

`NotesModal` is reused as-is. The `elapsed` prop is omitted (already optional after Phase 4).
