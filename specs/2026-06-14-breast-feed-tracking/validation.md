# Phase 3 — Breast Feed Tracking: Validation

All checks must pass before this branch can be merged.

---

## Check 1: TypeScript (`npx tsc --noEmit`)

```sh
npx tsc --noEmit
```

**Pass condition:** Zero errors.

**Things likely to catch errors:**
- `toggleBreastFeed` implementation must not use `any`; `active` state must be typed as `ActiveTrackers`
- `saveBreastFeed`: `FeedLog.feedType` must be `'breast'` (literal), not `string`
- `durationForLog` — when narrowing `log` to `FeedLog`, use `log as FeedLog` after `log.type === 'feed'` guard
- `formatFeedElapsed` must accept `number` and return `string`
- Dashboard: `useLiveTick` calls for left and right sides must pass `number | null`
- No `noUnusedLocals` or `noUnusedParameters` violations; stubs must remain `_`-prefixed

---

## Check 2: ESLint (`npm run lint`)

```sh
npm run lint
```

**Pass condition:** Zero errors.

**Things to verify before running:**
- Any new `useEffect` or `useCallback` in Dashboard for feed state must list all deps (`exhaustive-deps`)
- `useLiveTick` is called at the top level of `Dashboard` (not inside callbacks or conditions) — React rules of hooks
- No `any` anywhere in new or modified code
- `_`-prefixed stubs for `logBottle`, `logSolids`, `logDiaper` remain in TrackerContext (not removed)

---

## Check 3: Feed session — single side happy path

Launch the app with at least one baby profile.

| # | Action | Expected |
|---|---|---|
| 3.1 | Open app | L and R buttons visible, both idle (`COLORS.feed`), both show `'0m 0s'`, Save not visible |
| 3.2 | Tap **L** | L button turns active (`COLORS.active`), timer starts ticking (`'0m 0s'`, `'0m 1s'`, ...) |
| 3.3 | Wait 90 seconds | L shows `'1m 30s'`, R still shows `'0m 0s'` |
| 3.4 | Tap **L** again | L pauses, button returns to idle color, timer stops, Save button appears |
| 3.5 | Tap **Save** | `NotesModal` slides up with title `'End Feed Session'` and elapsed `'L 1m 30s'` |
| 3.6 | Tap **Cancel** in modal | Modal dismisses, Save button still visible, timer state preserved |
| 3.7 | Tap **Save** again, enter a note, tap **Save** in modal | Modal dismisses, buttons reset to idle `'0m 0s'`, Save disappears, feed card appears in log list |
| 3.8 | Feed card | Shows `'FEED'`, timestamp as `HH:MM`, `'L 1m 30s'`, and note text if entered |

---

## Check 4: Auto-pause — alternating sides

| # | Action | Expected |
|---|---|---|
| 4.1 | Tap **L** | L running, R idle |
| 4.2 | Tap **R** (while L is running) | L pauses (elapsed preserved), R starts |
| 4.3 | Tap **L** (while R is running) | R pauses (elapsed preserved), L resumes from 0 (new start) |
| 4.4 | Tap **L** to pause | Both sides stopped, Save visible |
| 4.5 | Tap **Save**, confirm | Card shows both `'L Xm Ys · R Xm Ys'` with correct per-side totals |

---

## Check 5: Background timer accuracy

| # | Action | Expected |
|---|---|---|
| 5.1 | Start L timer | Shows `'0m 0s'`, ticking |
| 5.2 | Background the app for exactly 2 minutes | (wait) |
| 5.3 | Return to app | L immediately shows `'2m 0s'` (within one tick of correct) |
| 5.4 | Continue ticking | Timer increments correctly from correct base |

---

## Check 6: Delete feed log

| # | Action | Expected |
|---|---|---|
| 6.1 | With at least one feed log in the list | Card visible with `✕` button |
| 6.2 | Tap `✕` | Card disappears immediately |
| 6.3 | If it was the only log | `'No logs yet today.'` empty state appears |

---

## Check 7: Sleep + Feed coexistence

| # | Action | Expected |
|---|---|---|
| 7.1 | Start a sleep session | Sleep button active |
| 7.2 | Verify feed buttons | L and R buttons are disabled (not interactive) |
| 7.3 | Stop sleep session | Feed buttons become interactive again |
| 7.4 | Start a feed session | Feed buttons active, sleep button still functional |
| 7.5 | Start sleep while feed is active | Feed timers pause; sleep starts (or: sleep button is disabled while feed is active — implement whichever is simpler) |

> Note: The exact sleep+feed interaction (which disables which) should be consistent but either approach is acceptable for v1. Document whichever is chosen in a comment.

---

## Check 8: Feed card display edge cases

| # | Scenario | Expected card duration |
|---|---|---|
| 8.1 | Left only (45s), right 0 | `'L 0m 45s'` |
| 8.2 | Right only (2m), left 0 | `'R 2m 0s'` |
| 8.3 | Both sides non-zero | `'L Xm Ys · R Xm Ys'` |
| 8.4 | Notes present | Note text appears below duration |

---

## Definition of Mergeable

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run lint` — zero errors
- [ ] Single-side happy path (Check 3): all 8 steps pass
- [ ] Auto-pause (Check 4): elapsed preserved correctly on each side
- [ ] Background accuracy (Check 5): timer within 1 tick of correct on resume
- [ ] Delete (Check 6): log removed, empty state correct
- [ ] Sleep+feed coexistence (Check 7): no simultaneous running timers
- [ ] Card display edge cases (Check 8): correct per-side labelling
- [ ] No hardcoded colors in any new or modified file
- [ ] No `Math.random()` calls anywhere
- [ ] `formatFeedElapsed` is local to Dashboard (not a shared utility unless used in >1 file)
