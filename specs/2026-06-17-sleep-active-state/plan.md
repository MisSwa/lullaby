# Phase 2 — Sleep Active State: Implementation Plan

## Task Groups

### Group 1 — TrackerContext: updateSleepStart
1. Add `updateSleepStart(timestamp: number): void` to `TrackerContextType`
2. Implement: validates 12h clamp, then `setActive(prev => ({ ...prev, sleepStart: timestamp }))`
3. `npx tsc --noEmit` — must pass

### Group 2 — ActiveSleepView component
1. Create `src/components/ActiveSleepView.tsx`
   - Consumes `sleepStart` prop + `useLiveTick` for live HH:MM:SS
   - Large digit display: three columns (HH / MM / SS) with muted unit labels below
   - "Started at" tappable row → DateTimePicker (12h clamp, inline error)
   - On confirm: calls `updateSleepStart` from TrackerContext
   - Large STOP button (min 80px height, full width, `COLORS.active`)
   - Dashed border ring around stop button (`borderStyle: 'dashed'`, outer wrapper View)
   - Bell icon if `notifications.sleep.enabled`
2. `npx tsc --noEmit` — must pass

### Group 3 — Animated card zone in Dashboard
1. In `Dashboard.tsx`:
   - Import `Animated`, `useSharedValue`, `withTiming`, `useAnimatedStyle` from reanimated
   - Add animated height value; expand when `isSleeping`, collapse when not
   - When `isSleeping`: render `ActiveSleepView` instead of card grid
   - When not sleeping: render card grid (SleepCard + feed row + DiaperCard)
   - Wrap the card zone `View` → `Animated.View` with animated height style
2. `npx tsc --noEmit` — must pass

### Group 4 — Roadmap + cleanup
1. Hex grep — zero matches outside `colors.ts` and `App.tsx`
2. Mark Phase 2 checkboxes in `specs/roadmap.md`
3. `npx tsc --noEmit` — final clean pass

## Files Added
```
src/components/ActiveSleepView.tsx    NEW
```

## Files Modified
- `src/context/TrackerContext.tsx` — add `updateSleepStart`
- `src/screens/Dashboard.tsx` — animated card zone swap
