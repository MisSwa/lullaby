# Phase 3 — Breast Feed Tracking: Plan

## Group 1: Types & Context — Feed Timer State

- Confirm `ActiveTrackers` already has `feedLeftStart`, `feedRightStart`, `feedLeftElapsed`, `feedRightElapsed` (it does — defined in Phase 0)
- Implement `toggleBreastFeed(side)` in `TrackerContext`:
  - If the pressed side is running → pause it (accumulate elapsed, clear start)
  - If the pressed side is stopped → start it (set start to `Date.now()`)
  - **Auto-pause the other side** when starting one: if the opposite side is running, accumulate its elapsed and clear its start before activating the new side
- Implement `saveBreastFeed(notes?)` in `TrackerContext`:
  - Compute final `leftDuration` and `rightDuration` (accumulated + any live running time)
  - Build a `FeedLog` with `feedType: 'breast'`, insert into SQLite
  - Reset all four feed fields in `active` back to zero/null
  - Call `refreshLogs()`

## Group 2: `useLiveTick` — Dual-Side Feed Elapsed

- `useLiveTick` already returns a single elapsed in seconds — it can be reused per-side
- In Dashboard, call `useLiveTick` once for left and once for right:
  - `const leftTick = useLiveTick(active.feedLeftStart);`
  - `const rightTick = useLiveTick(active.feedRightStart);`
- Compute total live elapsed for each side: `active.feedLeftElapsed + leftTick` and `active.feedRightElapsed + rightTick`
- AppState correction is handled by `useLiveTick` already (immediate tick on resume)

## Group 3: `formatFeedElapsed` Helper

- Add a helper (in Dashboard or a shared location) that formats seconds as `Xm Ys`:
  ```ts
  function formatFeedElapsed(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  }
  ```
- Used on the L/R buttons and on the log card

## Group 4: Dashboard — Feed Action Buttons

- Below the existing sleep button, add a second row for breastfeeding
- Two side-by-side buttons: **L** and **R**
- Each button shows:
  - Side label: `L` or `R`
  - Live elapsed: `formatFeedElapsed(totalSecs)` (updates every second via `useLiveTick`)
  - Visual state: active (running) vs idle
- A **Save** button appears only when at least one side has elapsed > 0 and no side is currently running
- Tapping Save opens `NotesModal` with title `'End Feed Session'`

## Group 5: `NotesModal` Reuse for Feed Save

- `NotesModal` already accepts `title`, `elapsed`, `onSave`, `onDismiss`
- For feed: compute a combined elapsed string for display (e.g. `'L 4m 32s · R 2m 10s'`)
- Wire `onSave` to call `saveBreastFeed(notes)` then dismiss

## Group 6: `LogCard` — Feed Card Display

- `durationForLog` currently only handles sleep — extend it for `feed`:
  - For `feedType: 'breast'`: return `'L Xm Ys · R Xm Ys'` (omit a side if its duration is 0)
- `labelForLog` already returns `'FEED'` for `type: 'feed'`
- `colorForLog` already returns `COLORS.feed` for `type: 'feed'`
- Show notes below duration if present (already handled by `cardNotes` style)
