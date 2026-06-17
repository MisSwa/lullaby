# Phase 0 — Theme Foundation: Validation Criteria

> This phase is complete and ready to merge when **every** criterion below passes.
> No partial passes. No "close enough."
> Primary validation environment: **iOS Simulator** (Xcode).

---

## 1. TypeScript — Zero Errors

Run:
```bash
npx tsc --noEmit
```

**Pass:** Output is empty. Exit code 0.
**Fail:** Any error, any warning treated as error (strict mode).

This must pass at the end of every task group, not just at the end of the phase.

---

## 2. No Hardcoded Hex Strings in Component Files

Run:
```bash
grep -rn "#[0-9a-fA-F]\{3,6\}" \
  src/ \
  --include="*.ts" \
  --include="*.tsx" \
  | grep -v "src/theme/colors.ts"
```

**Pass:** No output. Exit code 1 from grep (no matches).
**Fail:** Any line returned. Each match must be fixed before merge.

---

## 3. `ColorPalette` Interface Completeness

Both `LIGHT` and `DARK` must satisfy the `ColorPalette` interface without a type assertion. TypeScript will enforce this at compile time. Specific check:

- `LIGHT` has all 16 tokens from the `ColorPalette` interface
- `DARK` has all 16 tokens from the `ColorPalette` interface
- `surfaceAlt` is present in both

**Pass:** `npx tsc --noEmit` passes (implies both objects satisfy the interface).
**Fail:** Compile error about missing or mistyped property.

---

## 4. `useTheme()` Hook Behavior — System Mode

**Setup:** iOS Simulator, OS appearance = **Light**.

**Steps:**
1. Launch app fresh (Expo Go or development build)
2. Navigate through: Dashboard → tap "Add Baby" → tap any modal

**Expected:**
- Background colors are light (`#F8F9FA` equivalent)
- Card surfaces are white (`#FFFFFF` equivalent)
- Text is dark (`#2D3748` equivalent)

**Then:**
1. Open iOS Simulator menu: `Device → Appearance → Dark`
2. Observe the app **without restarting**

**Expected:**
- App immediately repaints to dark palette
- Background becomes deep slate (`#0F1117`)
- Card surfaces become `#1A1E27`
- Text becomes near-white (`#E2E8F0`)
- All modals (if open) repaint correctly

**Then:**
1. Switch back to `Device → Appearance → Light`

**Expected:**
- App immediately returns to light palette

**Pass:** All three states render correctly and transitions are immediate (no restart required).
**Fail:** Any state renders incorrectly, or a restart is required for changes to take effect.

---

## 5. `useTheme()` Hook Behavior — Manual Override (SettingsContext)

Since the Settings UI toggle is not built until Phase 5, test this via a temporary code change:

**Test:** In `App.tsx` (or a test component), temporarily call `updateTheme('dark')` inside a `useEffect` on mount. Launch the app.

**Expected:**
- App renders in dark mode regardless of OS appearance setting

**Restore:** Revert the temporary change before merge. This test is manual/dev-only.

**Pass:** Manual override to `'dark'` forces dark palette even when OS is in light mode.
**Fail:** Override is ignored.

---

## 6. `SettingsContext` — Theme Persists Across Restarts

**Setup:** The `updateTheme` function saves to SQLite under key `'app_theme'`.

**Steps:**
1. Call `updateTheme('dark')` programmatically (same temp change as criterion 5)
2. Kill and relaunch the app
3. Observe initial render

**Expected:** App opens in dark mode — the `'dark'` value was read from SQLite on mount.

**Pass:** Persisted theme loads correctly on cold start.
**Fail:** App reverts to `'system'` after restart (SQLite load is broken).

---

## 7. `COLORS` Deprecated Export — Still Compiles

The flat `COLORS` export must remain functional (pointing to `LIGHT`) so that any file NOT yet migrated (outside this phase's scope) doesn't break.

**Pass:** `import { COLORS } from '@theme/colors'` in any file still compiles. `COLORS.primary` equals `LIGHT.primary`.
**Fail:** Import fails or `COLORS` returns wrong values.

---

## 8. No Regressions in Existing Functionality

All of these must still work correctly in Light mode (the default / pre-phase behavior):

| Feature | Test |
|---|---|
| Onboarding modal appears on first launch | Delete app, reinstall, launch → OnboardingModal shows |
| Baby name + DOB can be saved | Complete onboarding, verify dashboard loads |
| Sleep start/stop works | Tap sleep card — timer starts, tap again — stops |
| Bottle log works | Tap bottle card — modal opens, enter amount, save |
| Today's log list renders | After logging, entries appear in reverse-chron order |
| Settings modal opens | Tap gear icon → SettingsModal appears |

**Pass:** All 6 features work without visible change from before this phase.
**Fail:** Any regression in existing functionality.

---

## 9. Merge Readiness Checklist

Before opening a PR or merging to main:

- [ ] `npx tsc --noEmit` → zero errors
- [ ] Hex grep → zero matches outside `colors.ts`
- [ ] iOS Simulator light/dark toggle → immediate repaints
- [ ] `updateTheme('dark')` override test → dark palette forced
- [ ] SQLite persistence test → theme survives app restart
- [ ] `COLORS` deprecated import → still compiles
- [ ] All 6 regression tests → pass
- [ ] `specs/roadmap.md` Phase 0 checkboxes → all marked `[x]`
- [ ] No `TODO`, `FIXME`, or `console.log` statements left in modified files (except existing ones that predate this phase)
