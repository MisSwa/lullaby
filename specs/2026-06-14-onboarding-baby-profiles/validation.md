# Phase 1 — Onboarding & Baby Profiles: Validation

All checks must pass before this branch can be merged.

---

## Check 1: TypeScript (`npx tsc --noEmit`)

```sh
npx tsc --noEmit
```

**Pass condition:** Zero errors. Zero warnings.

**Things likely to catch errors:**
- `DateTimePicker` `onChange` prop type — accept `(_event: DateTimePickerEvent, date?: Date) => void`; the `_event` param must be present even if unused
- `onDismiss` on `BabyFormModal` is optional (`onDismiss?`) — call sites must guard with `onDismiss?.()` not `onDismiss()`
- `babies.length === 0` check in `AppShell` — TypeScript should not need casting here if `babies: Baby[]` is typed correctly in context

---

## Check 2: ESLint (`npm run lint`)

```sh
npm run lint
```

**Pass condition:** Zero errors.

**Things to verify manually before running:**
- No `any` types in any new file
- `exhaustive-deps` — all `useEffect` and `useCallback` deps are complete
- `DateTimePicker`'s `onChange` uses `_event` prefix for the unused first param (satisfies `argsIgnorePattern: '^_'`)

---

## Check 3: Path A — Fresh install (no babies)

Simulate a fresh install by clearing app data or using a new simulator. Launch the app.

| # | Action | Expected |
|---|---|---|
| 3.1 | App launches | Onboarding modal appears full-screen. Dashboard is not visible. |
| 3.2 | Attempt to dismiss by swiping or pressing back | Nothing happens. Modal cannot be closed. |
| 3.3 | Tap Save with empty name | Save button is disabled. Nothing happens. |
| 3.4 | Enter name, tap Save | Modal fades out. Dashboard appears with the baby's name in the header. |
| 3.5 | Header baby switcher | Shows the baby's name with a `▾` chevron. |
| 3.6 | Tap baby switcher | Dropdown shows one baby with a `✓` checkmark and a `'+ Add Baby'` row. |
| 3.7 | Dashboard body | Shows `'Ready to track.'` placeholder text. |

---

## Check 4: Path B — Returning user (babies already exist)

Kill and relaunch the app after completing Path A.

| # | Action | Expected |
|---|---|---|
| 4.1 | App launches | Onboarding modal does NOT appear. Dashboard loads directly. |
| 4.2 | Header shows correct baby name | The name from Path A is displayed immediately. |
| 4.3 | No flash of onboarding | The modal must not flicker briefly before hiding — `babies.length === 0` must be false before first render if DB load is fast enough, or the modal animation must be `'fade'` so any brief appearance is unnoticeable |

---

## Check 5: Multi-baby flow

Continuing from Check 3 or 4 with one baby already present.

| # | Action | Expected |
|---|---|---|
| 5.1 | Tap baby switcher → tap `'+ Add Baby'` | `AddBabyModal` slides up. |
| 5.2 | Enter second baby name + DOB → Save | Modal dismisses. Header dropdown now shows two babies. |
| 5.3 | Tap baby switcher | Both names listed. Active baby has `✓`. |
| 5.4 | Tap the other baby's name | Dropdown closes. Header updates to show the selected baby. |
| 5.5 | Tap Cancel in AddBabyModal without saving | Modal dismisses. Baby count unchanged. |

---

## Check 6: DOB picker constraints

| # | Action | Expected |
|---|---|---|
| 6.1 | Try to select a future date in the DOB picker | Not selectable — picker enforces `maximumDate` |
| 6.2 | Default date shown | Yesterday (not today) |

---

## Definition of Mergeable

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run lint` — zero errors
- [ ] Path A (fresh install): all 7 steps pass
- [ ] Path B (returning user): all 3 steps pass
- [ ] Multi-baby flow: all 5 steps pass
- [ ] DOB picker constraints: both checks pass
- [ ] No hardcoded color hex strings in any new file
- [ ] No `Math.random()` calls in any new file
- [ ] `.gitkeep` removed from `src/screens/` and `src/modals/`
