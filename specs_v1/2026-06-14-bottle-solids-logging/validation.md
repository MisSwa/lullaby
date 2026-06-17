# Phase 4 — Bottle & Solids Logging: Validation

## Exit Criteria

All of the following must be true before this branch can be merged.

---

### Functional

- [ ] **Bottle tap:** Tapping the Bottle button opens `BottleLogModal` with an empty amount field.
- [ ] **Bottle save (integer):** Enter `90` → tap Save → log card reads `FEED · Bottle · 90ml` with the correct timestamp.
- [ ] **Bottle save (decimal):** Enter `87.5` → tap Save → log card reads `FEED · Bottle · 87.5ml`.
- [ ] **Bottle minimum validation:** Enter `0` or clear the field → Save button is disabled or shows an error; no log is saved.
- [ ] **Bottle cancel:** Tap Cancel in `BottleLogModal` → modal closes, no log is saved.
- [ ] **Bottle long-press:** Long-press Bottle button → `NotesModal` opens → enter "drowsy" → save → `BottleLogModal` opens with "drowsy" pre-filled in the notes area → save → log card reflects the note.
- [ ] **Solids tap:** Tapping the Solids button immediately saves a log; a `FEED · Solids` card appears in the log list with the correct time.
- [ ] **Solids long-press:** Long-press Solids → `NotesModal` opens → enter a note → save → `FEED · Solids` card appears with the note attached; no intermediate modal shown.
- [ ] **Delete:** Tapping ✕ on a bottle or solids card removes it from the list and from SQLite.

---

### Multi-baby

- [ ] Bottle and solids logs are scoped to the active baby. Switching babies in the header shows only that baby's logs.

---

### Background / Resume

- [ ] Bottle and solids are instant logs (no timer), so there is nothing to drift. Confirm the log list is accurate after backgrounding and resuming.

---

### TypeScript

- [ ] `npx tsc --noEmit` exits with zero errors.
- [ ] No `any` type appears in new or modified files.
- [ ] The `BabyLog` discriminated union switch is exhaustive — adding `feedType` sub-cases does not break existing arms.

---

### Design

- [ ] No hardcoded color values in any new or modified file — all through `COLORS`.
- [ ] Bottle and Solids buttons are ≥ 44px tall.
- [ ] `BottleLogModal` and all new UI is legible and navigable in one hand.
- [ ] Amount display format: integers render as `90ml` (no `.0`), decimals render as `87.5ml` (one decimal place max).

---

### Code Quality

- [ ] `BottleLogModal` is in `src/modals/BottleLogModal.tsx`.
- [ ] No direct `db` calls from any component — all mutations go through `TrackerContext` actions.
- [ ] All `async` functions touching SQLite are wrapped in `try/catch` with `console.error` on failure.
- [ ] `useEffect` dependency arrays are complete (no ESLint `exhaustive-deps` warnings).
