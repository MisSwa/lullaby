# Phase 2 — Sleep Active State: Requirements

## Scope
Only changes what happens when sleep is running. The card zone in Dashboard swaps to a full-width
active sleep view while `active.sleepStart !== null`. All other cards (Nursing, Bottle, Diaper)
are hidden during active sleep and reappear when sleep ends.

---

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Expand style | Full-width takeover — other cards hidden | Gives maximum focus to the running timer |
| Animation library | `react-native-reanimated` 4.x | Bundled in Expo Go; approved in tech-stack.md |
| Animation | `useSharedValue` + `withTiming` on height/opacity | Smooth expand in, fade out when stopping |
| Retroactive start edit | Updates `sleepStart` in TrackerContext | `useLiveTick` recalculates elapsed automatically |
| STOP button style | Dashed border ring via nested `borderStyle: 'dashed'` View | No Reanimated border needed |

---

## Active Sleep Layout (full-width card zone replacement)

```
┌─────────────────────────────────────────┐
│  SLEEP                            [bell] │  ← category label + bell
│                                          │
│     00   :   14   :   32                 │  ← large digit display
│   HOURS     MIN     SEC                  │  ← muted unit labels
│                                          │
│  Started at 10:45 PM          ›         │  ← tappable row → datetimepicker
│  [inline error if out of range]          │
│                                          │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
│    ■  Stop Sleep                         │  ← large stop button, COLORS.active bg
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
└─────────────────────────────────────────┘
```

---

## TrackerContext Changes

Add `updateSleepStart(timestamp: number): void` action:
- Validates: timestamp must be > `Date.now() - 12h` and < `Date.now()`
- If valid: calls `setActive(prev => ({ ...prev, sleepStart: timestamp }))`
- Validation error is returned to caller (throw or return error string — throw is simpler)

---

## Datetimepicker Behaviour
- `mode="time"`, `display="spinner"` on iOS, `display="default"` on Android
- `maximumDate = new Date()` (no future times)
- `minimumDate = new Date(Date.now() - 12h)`
- On confirm: call `updateSleepStart`; show inline error if out of range
- On iOS, picker is always visible (inline) — no tap-to-show needed
- On Android, show only after tap (existing pattern from Phase 1)

---

## Animation Spec
- Trigger: `active.sleepStart` changes from `null` → number (sleep starts)
- Animate: card zone height from `COLLAPSED_HEIGHT` → `EXPANDED_HEIGHT` using `withTiming(duration: 350ms, easing: Easing.out(Easing.quad))`
- Reverse: sleep stops → animate back to collapsed, then re-show card grid
- The `SleepCard` (Phase 1 collapsed version) is replaced by `ActiveSleepView` during expansion

---

## Non-Negotiables
- Zero hardcoded hex values
- All time values through Unix epoch ms
- Zero TypeScript errors under strict mode
- Must show correct elapsed time after 10-minute background
