# Phase 0 — Project Skeleton: Validation

All three checks must pass before this branch can be merged. A partial pass is not acceptable — this phase sets the quality floor for the entire project.

---

## Check 1: TypeScript (`npx tsc --noEmit`)

Run from the project root:

```sh
npx tsc --noEmit
```

**Pass condition:** Zero errors. Zero warnings. Clean exit.

**Common failure causes:**
- Missing type on a context stub function parameter
- `any` type slipping in from `expo-sqlite` row mapping in `db.ts` — use typed generics (`db.getAllAsync<Baby>`) instead
- `noUnusedLocals` flagging a type imported for an interface but not used in a value position — restructure or use `import type`

---

## Check 2: ESLint (`npm run lint`)

Run from the project root:

```sh
npm run lint
```

**Pass condition:** Zero errors. Zero warnings that are not explicitly suppressed with an inline comment explaining why.

**Key rules to verify manually before running:**
- `react-hooks/exhaustive-deps` is set to `'error'`, not `'warn'`. Any `useEffect` with a missing dependency is a hard failure.
- `@typescript-eslint/no-explicit-any` is `'error'`. Any `any` in `db.ts` row mapping is a failure.
- `no-console` allows only `console.error` and `console.warn`. The one permitted `console.log` in `initializeDatabase` must be changed to `console.warn` or wrapped in `__DEV__` guard.

---

## Check 3: Manual App Launch

Run from the project root:

```sh
npx expo start
```

Open on a physical device or simulator (both iOS and Android if available).

**Pass conditions (verify each):**

| # | Check | Expected result |
|---|---|---|
| 3.1 | App launches | No red error screen. No crash. |
| 3.2 | DB init message | Metro console shows the database initialization confirmation message. |
| 3.3 | Blank screen | The app renders a blank white/off-white `SafeAreaView`. No Expo template UI visible. |
| 3.4 | No network requests | No fetch or XHR appears in Metro logs. The app is fully offline. |
| 3.5 | Context providers mount | No "must be used inside Provider" invariant errors in console. |
| 3.6 | Background + resume | Background the app for 30 seconds, return — no crash, no error in console. |

---

## Structural Verification

Before running any check, confirm the folder structure matches `requirements.md` exactly:

```sh
find src -type f | sort
```

Expected output (`.gitkeep` files included):

```
src/context/SettingsContext.tsx
src/context/TrackerContext.tsx
src/hooks/.gitkeep
src/modals/.gitkeep
src/screens/.gitkeep
src/services/db.ts
src/theme/colors.ts
src/types/baby.ts
src/types/tracker.ts
```

Any file present that is not on this list (except `.DS_Store`) is a scope violation for this phase.

---

## Definition of Mergeable

This branch is mergeable when:

- [ ] `npx tsc --noEmit` exits with zero errors
- [ ] `npm run lint` exits with zero errors
- [ ] App launches on at least one platform (iOS or Android) with no crash
- [ ] DB init message appears in Metro console on first launch
- [ ] Blank screen renders (no Expo template remnants)
- [ ] No `any` types exist in committed `.ts` or `.tsx` files
- [ ] No `Math.random()` calls exist in committed files
- [ ] Folder structure matches the contract in `requirements.md`
- [ ] All context stubs have explicit TypeScript return types

All boxes must be checked. If any is blocked, document the blocker in a comment on the PR before requesting review.
