# Phase 5 — Diaper Tracking: Validation

## Exit Criteria

All of the following must be true before this branch can be merged.

---

### Functional

- [ ] **Tap wet:** Tapping the "wet" button immediately saves a log; a `DIAPER · Wet` card appears in the list with the correct timestamp.
- [ ] **Tap dirty:** `DIAPER · Dirty` card appears.
- [ ] **Tap mixed:** `DIAPER · Mixed` card appears.
- [ ] **Tap dry:** `DIAPER · Dry` card appears.
- [ ] **Long-press any button:** `NotesModal` opens with a title referencing the status (e.g. "Add Note — Wet").
- [ ] **Long-press → save note:** Note text is attached to the log card; card is visible in the list.
- [ ] **Long-press → cancel:** Modal closes, no log is saved.
- [ ] **Delete:** Tapping ✕ on a diaper card removes it from the list and from SQLite.

---

### Multi-baby

- [ ] Diaper logs are scoped to the active baby. Switching babies shows only that baby's logs.

---

### TypeScript

- [ ] `npx tsc --noEmit` exits with zero errors.
- [ ] No `any` type in new or modified files.
- [ ] `DiaperLog['status']` is typed correctly — no string literals or casts.

---

### Design

- [ ] No hardcoded color values — all through `COLORS`.
- [ ] All four diaper buttons are ≥ 44px tall.
- [ ] Dashboard action zone layout matches the agreed spec: Sleep → L/R Breast → Bottle/Solids → Diaper row.
- [ ] Diaper buttons use `COLORS.diaper` (Soft Earth Clay `#8C6239`).

---

### Code Quality

- [ ] `logDiaper` in `TrackerContext` is wrapped in `try/catch` with `console.error`.
- [ ] No direct `db` calls from any component — all through context.
- [ ] `pendingDiaperStatus` is reset to `null` when the notes modal is dismissed without saving.
