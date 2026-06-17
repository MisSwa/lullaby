# Phase 2 — Sleep Tracking: Validation

All checks must pass before this branch can be merged.

---

## Check 1: TypeScript (`npx tsc --noEmit`)

```sh
npx tsc --noEmit
```

**Pass condition:** Zero errors.

**Things likely to catch errors:**
- `AppState.addEventListener` return type — must be assigned and `.remove()` called in cleanup
- `SleepLog` shape — `babyId` field is required; ensure it's populated from `activeBabyId`
- `useLiveTick` — `startTimestamp` typed as `number | null`; the effect must guard with `if (!startTimestamp) return`
- `active.sleepStart` is `number | null` — any arithmetic must be inside a null-guard

---

## Check 2: ESLint (`npm run lint`)

```sh
npm run lint
```

**Pass condition:** Zero errors.

**Things to verify before running:**
- `useLiveTick` `useEffect` deps include `startTimestamp` — satisfies `exhaustive-deps`
- No `any` in `NotesModal` or `Dashboard`

---

## Check 3: Sleep session — happy path

Launch the app with at least one baby profile set up.

| # | Action | Expected |
|---|---|---|
| 3.1 | Open app | Sleep button visible, idle state (`COLORS.sleep`), label `'Track Sleep'` |
| 3.2 | Tap `'Track Sleep'` | Button turns green (`COLORS.active`), label changes to `'Wake Up · 0m'` |
| 3.3 | Wait 90 seconds | Label shows `'Wake Up · 1m'` |
| 3.4 | Tap `'Wake Up · ...'` | `NotesModal` slides up. Timer keeps running in background. |
| 3.5 | Tap `'Cancel'` in NotesModal | Modal dismisses. Button still active with timer running. |
| 3.6 | Tap `'Wake Up · ...'` again | `NotesModal` slides up again. |
| 3.7 | Optionally type a note, tap `'Save'` | Modal dismisses. Button returns to idle (`'Track Sleep'`). Sleep card appears in log list. |
| 3.8 | Log card shows | `'SLEEP'`, start time as `HH:MM`, correct duration, note text if entered. |

---

## Check 4: Background timer accuracy

| # | Action | Expected |
|---|---|---|
| 4.1 | Start a sleep session | Timer running, shows `'0m'` |
| 4.2 | Background the app for exactly 2 minutes | (wait) |
| 4.3 | Return to app | Timer immediately shows `'2m'` (or `'1m'` at worst — within one tick of correct) |
| 4.4 | The timer continues ticking | Elapsed increments each minute correctly |

---

## Check 5: Delete log

| # | Action | Expected |
|---|---|---|
| 5.1 | With at least one sleep log in the list | Card is visible with `✕` button |
| 5.2 | Tap `✕` | Card disappears from the list immediately |
| 5.3 | Verify empty state | If that was the only log, `'No logs yet today.'` appears |

---

## Check 6: Log list edge cases

| # | Action | Expected |
|---|---|---|
| 6.1 | Fresh baby profile with no logs | Log list shows `'No logs yet today.'` |
| 6.2 | Log two sleep sessions | Both cards appear, most recent first |
| 6.3 | Switch to a different baby in the header | Log list updates to show that baby's logs (or empty state) |

---

## Check 7: In-progress card

If a sleep session is active and the app is relaunched (not typical but possible if the OS kills it):
- The `SleepLog` is only written to SQLite on `stopSleep` — so after a force-kill there is no orphaned log. This is acceptable v1 behaviour.
- There is no partially-saved `'In progress'` card from a mid-session kill. The `'In progress'` label is only shown for a log with `endTime: null`, which only exists if a log is manually inserted that way (not via this phase's implementation).

---

## Definition of Mergeable

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run lint` — zero errors
- [ ] Sleep happy path (Check 3): all 8 steps pass
- [ ] Background accuracy (Check 4): timer within 1 tick of correct on resume
- [ ] Delete (Check 5): log removed, empty state appears correctly
- [ ] Log list edge cases (Check 6): empty state, chronological order, baby switch
- [ ] No hardcoded colors in any new or modified file
- [ ] No `Math.random()` calls anywhere
- [ ] `src/hooks/.gitkeep` is gone (replaced by `useLiveTick.ts`)
