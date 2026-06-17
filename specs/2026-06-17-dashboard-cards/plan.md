# Phase 1 — Dashboard Cards: Implementation Plan

## Task Groups

### Group 1 — Utilities
1. Create `src/utils/ageString.ts` — `computeAge(dob: number): string`
2. Create `src/utils/timeSince.ts` — `timeSince(ts: number | null, now: number): string`
3. `npx tsc --noEmit` — must pass before continuing

### Group 2 — Extend SettingsContext for `units`
1. Add `units: 'ml' | 'oz'` + `updateUnits` to `SettingsContext`
   (FeedModal bottle tab needs this; persisted under key `'app_units'`)
2. `npx tsc --noEmit` — must pass

### Group 3 — DiaperModal
1. Create `src/modals/DiaperModal.tsx`
   - Icon circles: Pee / Poo / Mixed / Dry
   - "Started at" row with DateTimePicker (12h clamp)
   - Auto-save + close on tap
2. `npx tsc --noEmit` — must pass

### Group 4 — FeedModal (replaces BottleLogModal)
1. Create `src/modals/FeedModal.tsx`
   - Nursing | Bottle segmented control
   - Nursing tab: L/R circle buttons, live timers, save session
   - Bottle tab: slider, ml/oz toggle, save
   - "Started at" retroactive row on both tabs
2. Delete `src/modals/BottleLogModal.tsx`
3. Update all imports of `BottleLogModal` → `FeedModal`
4. `npx tsc --noEmit` — must pass

### Group 5 — Card Components
1. Create `src/components/cards/SleepCard.tsx`
2. Create `src/components/cards/NursingCard.tsx`
3. Create `src/components/cards/BottleCard.tsx`
4. Create `src/components/cards/DiaperCard.tsx`

Each card:
- Ghost icon (Ionicons, same hue as category, 10% opacity, ~72px, absolute positioned left-center)
- Category color strip on left edge
- Card title (SLEEP / NURSING / BOTTLE / DIAPER)
- Time-since label (60s refresh via setInterval)
- Last-detail second line (muted)
- Reminder bell icon if `notifications[type].enabled` is true
- `COLORS.surface` background, `COLORS.border` border, `borderRadius: 16`
- Minimum height: 90px touch target

SleepCard additionally:
- Live timer badge top-right when `active.sleepStart !== null`
- Tap: `startSleep()` if inactive, else open NotesModal

5. `npx tsc --noEmit` — must pass

### Group 6 — DashboardHeader updates
1. Add baby avatar circle (~36px) — letter initial, deterministic color from name hash
2. Add age string next to name — "Oliver · 4 months" using `computeAge`
3. `npx tsc --noEmit` — must pass

### Group 7 — Dashboard.tsx Rewire
1. Replace the `actionZone` contents with the four card components:
   - SleepCard (full width)
   - NursingCard + BottleCard (half-width row, 50% each minus half gap)
   - DiaperCard (full width)
2. Remove all inline feed/diaper button logic
3. Wire modal state: `diaperModalVisible`, `feedModalVisible`, `feedModalTab`
4. Remove `BottleLogModal` usage (replaced by `FeedModal`)
5. `npx tsc --noEmit` — must pass

### Group 8 — Final Polish & Cleanup
1. Confirm `BottleLogModal.tsx` is deleted and has zero remaining references
2. Hex grep — zero hardcoded colors: `grep -r "#[0-9A-Fa-f]\{6\}" src/`
3. Run `npx tsc --noEmit` — zero errors
4. Check light theme and dark theme both render correctly
5. Update `specs/roadmap.md` — mark Phase 1 checkboxes done

---

## File Additions
```
src/
  utils/
    ageString.ts        NEW
    timeSince.ts        NEW
  components/
    cards/
      SleepCard.tsx     NEW
      NursingCard.tsx   NEW
      BottleCard.tsx    NEW
      DiaperCard.tsx    NEW
  modals/
    DiaperModal.tsx     NEW
    FeedModal.tsx       NEW
    BottleLogModal.tsx  DELETED
```

## Files Modified
- `src/context/SettingsContext.tsx` — add `units`
- `src/screens/DashboardHeader.tsx` — avatar + age
- `src/screens/Dashboard.tsx` — rewire action zone
