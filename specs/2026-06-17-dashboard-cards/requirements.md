# Phase 1 — Dashboard Cards: Requirements

## Scope
Merged Phase 1 + Phase 3 + Phase 4 from roadmap.

Replace the existing inline action buttons with styled tracking cards and their modals.
Does not touch the log list, header baby switcher, or notification logic.

---

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Card components | Separate files in `src/components/cards/` | Phases 2/3/4 extend individual cards — isolation prevents Dashboard.tsx bloat |
| Card interaction | Tap-only → opens modal | Clean separation of display (card) and input (modal) |
| DiaperModal | New file — icon-circle pattern (Phase 3 spec) | Replaces 4 inline diaper buttons |
| FeedModal | New unified Nursing + Bottle tabbed modal (Phase 4 spec) | Replaces `BottleLogModal.tsx` entirely |
| Time-since label | Refreshes every 60s via `setInterval` in card | `useLiveTick` precision not needed here |
| Time-since < 1m | "just now" | Friendly UX |
| Avatar hash | `charCodeSum % AVATAR_COLORS.length` | Simple, deterministic, no dependency |
| Ghost icon library | `@expo/vector-icons` Ionicons | Bundled with Expo SDK, already in tech-stack.md |
| Nursing + Bottle | Half-width paired cards in one row | Matches Huckleberry layout |

---

## Card Inventory

### SleepCard (`src/components/cards/SleepCard.tsx`)
- Ghost icon: `moon-outline`
- Tap while inactive → `startSleep()`
- Tap while active → opens `NotesModal` (existing stop flow)
- Live timer badge: top-right pill `HH:MM:SS`, `COLORS.active` background (powered by `useLiveTick`)
- Last-detail: "slept Xh Ym" (last completed sleep) or "active" if running
- Time-since: from most recent sleep log today

### NursingCard (`src/components/cards/NursingCard.tsx`)
- Ghost icon: `heart-outline`
- Tap → opens `FeedModal` on Nursing tab
- Live elapsed L/R shown on card face while a side is running
- Time-since: from most recent breast feed log today
- Last-detail: "L: Xm · R: Ym" from last session

### BottleCard (`src/components/cards/BottleCard.tsx`)
- Ghost icon: `flask-outline`
- Tap → opens `FeedModal` on Bottle tab
- Time-since: from most recent bottle log today
- Last-detail: "120 ml" from last bottle log

### DiaperCard (`src/components/cards/DiaperCard.tsx`)
- Ghost icon: `water-outline`
- Tap → opens `DiaperModal`
- Time-since: from most recent diaper log today
- Last-detail: last status capitalized ("Wet", "Dirty", "Mixed", "Dry")

---

## New Modals

### DiaperModal (`src/modals/DiaperModal.tsx`)
- Header: "Log Diaper" + X close button
- "Started at" row — tappable, opens `DateTimePicker` in `mode="time"` for retroactive correction
  - Clamps: max 12h in the past; shows inline error if out of range
- Four large circle buttons (~100px diameter) in a 2×2 grid:
  - Pee — `droplet` icon
  - Poo — `cloud` icon
  - Mixed — `water` icon
  - Dry — `ban` icon (outline, 50% opacity)
- Tapping a circle auto-saves and closes — no separate Save button
- Label below each circle

### FeedModal (`src/modals/FeedModal.tsx`)
Replaces `BottleLogModal.tsx`.

- **Segmented control at top:** Nursing | Bottle
- **Nursing tab:**
  - Two large circle buttons (~120px diameter): LEFT / RIGHT, `COLORS.feed` fill
  - Each shows ▶ or ■ icon depending on running state
  - Only one side runs at a time (existing TrackerContext behavior)
  - Live elapsed timers below each button (using `useLiveTick`)
  - "Started at" row for retroactive correction (same 12h clamp)
  - "Save Session" button — appears once any time > 0 accumulated; disabled until then
- **Bottle tab:**
  - "Started at" row (retroactive)
  - Slider 0–300 ml, step 5 ml, with floating value badge above thumb ("120 ml")
  - Outlined pill toggle: `ml` | `oz` — reads/writes `SettingsContext.units`
  - "Save" full-width button

---

## Utilities

### `src/utils/ageString.ts`
```ts
export function computeAge(dob: number): string
// Returns "4 months" | "2 years 3 months" | "X days"
```

### `src/utils/timeSince.ts`
```ts
export function timeSince(ts: number | null, now: number): string
// Returns "2h 14m ago" | "just now" | "–" (when ts is null)
```

---

## Non-Negotiables
- Zero hardcoded hex values in any new file
- All new components call `useTheme()` + `useMemo([COLORS])`
- All time values through Unix epoch ms
- `BottleLogModal.tsx` deleted once `FeedModal` is complete with no remaining references
- Zero TypeScript errors under strict mode
