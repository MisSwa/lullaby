# Phase 2 — Sleep Active State: Validation

## Commands
```bash
npx tsc --noEmit
grep -r "#[0-9A-Fa-f]\{6\}" src/ --include="*.ts" --include="*.tsx" | grep -v "colors.ts" | grep -v "App.tsx"
```

## Checklist

### Active Sleep View
- [ ] Tapping the SleepCard starts sleep and the card zone transitions to the expanded view
- [ ] Large HH : MM : SS display is visible and counting up live
- [ ] HOURS / MIN / SEC unit labels appear below each digit group
- [ ] "Started at HH:MM AM/PM" row is visible and tappable
- [ ] Tapping "Started at" opens the time picker
- [ ] Editing start time to a valid earlier time → timer jumps to reflect new elapsed
- [ ] Setting start time > 12h in the past → inline error shown, time not changed
- [ ] Setting start time in the future → inline error shown, time not changed
- [ ] STOP button is at least 80px tall, full width, `COLORS.active` background
- [ ] Dashed border ring surrounds the STOP button
- [ ] Tapping STOP opens NotesModal (existing Phase 1 flow)
- [ ] After stopping sleep, the card zone animates back to the normal card grid

### Animation
- [ ] Transition from collapsed → expanded is smooth (no jump)
- [ ] Transition from expanded → collapsed is smooth (no jump)

### Background correctness
- [ ] Start sleep, background app for 10 minutes, resume → timer shows correct elapsed time

### Regression
- [ ] Nursing, Bottle, Diaper cards are hidden while sleep is active
- [ ] Nursing, Bottle, Diaper cards reappear after sleep stops
- [ ] Today's log list still updates after stopping sleep
- [ ] Zero TypeScript errors

## Merge Criteria
All checklist items pass + `npx tsc --noEmit` clean + zero hex grep matches.
