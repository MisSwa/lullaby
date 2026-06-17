# Phase 1 — Dashboard Cards: Validation

## Commands
```bash
npx tsc --noEmit                                  # zero errors
grep -r "#[0-9A-Fa-f]\{6\}" src/ --include="*.ts" --include="*.tsx"  # zero matches outside colors.ts
```

## Checklist

### Cards
- [ ] All four cards visible on dashboard (Sleep full-width, Nursing + Bottle half-width row, Diaper full-width)
- [ ] Each card shows a ghost/watermark icon (correct Ionicons, correct hue, ~10% opacity)
- [ ] Each card shows "Xh Ym ago" time-since label (or "–" with no log today)
- [ ] Time-since updates after 60 seconds without a manual refresh
- [ ] Each card shows the last-detail second line (sleep duration, L/R times, amount, diaper status)
- [ ] "just now" appears when a log is less than 1 minute old
- [ ] SleepCard shows live HH:MM:SS badge in top-right when sleep is active
- [ ] Reminder bell icon appears on cards where `notifications[type].enabled` is true

### Header
- [ ] Avatar circle shows the baby's initial letter in a deterministic color
- [ ] "Name · X months" or "Name · X years Y months" displays correctly next to name
- [ ] Avatar and age update when switching babies

### DiaperModal
- [ ] Tapping DiaperCard opens DiaperModal
- [ ] Four icon-circle buttons are visible and tappable
- [ ] Tapping a status icon saves the log and closes the modal immediately
- [ ] "Started at" row shows current time; tapping opens time picker
- [ ] Time picker clamps to max 12h in the past
- [ ] Empty state: modal opens gracefully when no baby is selected

### FeedModal
- [ ] Tapping NursingCard opens FeedModal on Nursing tab
- [ ] Tapping BottleCard opens FeedModal on Bottle tab
- [ ] Nursing tab: L/R buttons toggle correctly; only one side runs at a time
- [ ] Nursing tab: live elapsed timers update per second
- [ ] Nursing tab: "Save Session" appears only after time > 0
- [ ] Nursing tab: "Started at" retroactive correction works
- [ ] Bottle tab: slider moves 0–300 ml in steps of 5
- [ ] Bottle tab: ml/oz toggle switches display (stores as ml)
- [ ] Bottle tab: "Save" button saves and closes

### Theme
- [ ] All cards render correctly in light mode
- [ ] All cards render correctly in dark mode (OS toggle)
- [ ] No hardcoded hex values in any new file

### Regression
- [ ] Today's log list still shows after logging
- [ ] Delete log still works
- [ ] `BottleLogModal.tsx` does not exist; no file imports it
- [ ] App works after 10-minute background
- [ ] App works with a second baby profile

## Merge Criteria
All checklist items pass + `npx tsc --noEmit` clean + zero hex grep matches.
