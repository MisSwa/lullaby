# Lullaby — UI/UX Upgrade Roadmap

> Implementation order for the 31 v1 action items identified in `HUCKLEBERRY_ANALYSIS.md`.
> Each phase covers one logical screen area. Phases must be completed in order —
> later phases depend on earlier ones being done and tested.
>
> **Phase granularity rule:** One screen area = one phase. Each phase ships as a
> discrete, testable unit. Do not start the next phase until the current phase
> compiles clean, handles its empty/error states, and works after a 10-minute background.

---

## Phase 0 — Theme Foundation
**Scope:** Infrastructure only. No visible UI change until the consumer components are updated in Phase 1.

### Deliverables
- [x] Extend `src/theme/colors.ts` to export `LIGHT` and `DARK` palette objects (both typed with a `ColorPalette` interface)
- [x] Create `src/hooks/useTheme.ts` — reads `Appearance.getColorScheme()` and returns the matching palette; subscribes to `Appearance.addChangeListener` so the app responds immediately when the OS theme changes
- [x] Add `theme` to `SettingsContext` as `'system' | 'light' | 'dark'` (default: `'system'`); `useTheme()` respects this override when present
- [x] Update `src/theme/colors.ts` to add the `surfaceAlt` token to both palettes (used for ghost icon tints on cards)
- [x] Audit all existing files: replace any hardcoded hex colors with `COLORS.*` references — zero hardcoded colors anywhere

### Done when
- `useTheme()` returns the correct palette on both light and dark OS settings ✓
- No hardcoded hex string remains in any `.ts` or `.tsx` file ✓ (grep confirmed)
- TypeScript compiles clean, strict mode, zero errors ✓ (`npx tsc --noEmit` clean)

---

## Phase 1 — Dashboard Card Layout
**Scope:** All visual changes to the tracking cards on the main dashboard. Does not touch modal internals.

### Deliverables
- [x] **Baby avatar circle** in the header — colored circle (~36px) with the baby's initial letter in white; color derived from a deterministic hash of the baby's name (not hardcoded)
- [x] **Computed age string** in the header — "Oliver · 4 months" or "Neela · 2 years 3 months" computed from `dob` at render time using `Intl.RelativeTimeFormat` or a small pure helper; updates on every render (no caching needed at this scale)
- [x] **Ghost/watermark category icon** on each card — `@expo/vector-icons` Ionicons icon, same hue as the card's category color, 10% opacity, large (~72px), positioned absolutely at the left-center of the card
- [x] **"Xh Ym ago" time-since label** on every card — computed from the most recent log of that type in today's log list; shows "–" when no log exists today; refreshes every 60 seconds via a lightweight interval (does not need `useLiveTick` precision)
- [x] **Last-logged detail** shown as a second muted line on each card:
  - Sleep: last duration "slept 2h 14m" or "active" if running
  - Feed (breast): "L: 8m · R: 12m" from the last session
  - Feed (bottle): "120ml"
  - Feed (solids): "logged"
  - Diaper: last status capitalized ("Wet", "Dirty", "Mixed", "Dry")
- [x] **Live timer badge** on the sleep card when active — top-right corner, small pill showing `HH:MM:SS` elapsed, `COLORS.active` background; powered by `useLiveTick`
- [x] **Nursing + Bottle as half-width paired cards** — rendered side by side in a row; each is 50% of card row width minus half the gap; same height as a full-width card
- [x] **Reminder bell icon** — small Ionicons bell in the top-right corner of cards that have an active notification scheduled; uses a boolean from `SettingsContext` (whether that log type's reminder is enabled)
- [x] Both light and dark themes applied across all cards (consume `useTheme()`)

### Done when
- All cards show time-since, last-detail, and ghost icon
- Avatar and age string appear in the header
- Nursing and Bottle are side-by-side half-width cards
- Active sleep shows the live badge
- Light/dark toggle on the OS changes all card colors immediately
- Zero TypeScript errors

---

## Phase 2 — Sleep Active State
**Scope:** The sleep card's expanded/active view. Only changes what happens when sleep is running.

### Deliverables
- [x] When sleep is active, the sleep card **expands** (or transitions to an expanded layout) showing:
  - Large `HH : MM : SS` timer display, centered, with unit labels (HOURS / MIN / SEC) in small muted text beneath each
  - Current elapsed time computed from `sleepStartTimestamp` in `TrackerContext`
- [x] **Tappable "Started at HH:MM AM/PM" row** below the timer — tapping opens the `@react-native-community/datetimepicker` in `mode="time"` to allow retroactive correction; on confirm, updates `sleepStartTimestamp` in `TrackerContext` (clamps to max 12h in the past; shows an inline error if out of range)
- [x] **Large STOP button** — minimum 80px height, full card width, `COLORS.active` background, dashed outer ring (implemented with a `borderStyle: 'dashed'` wrapper view or a Reanimated animated border)
- [x] Smooth **Reanimated expand transition** when sleep starts — the card height animates from normal to expanded; does not jump
- [x] When sleep is not active, the card returns to the standard layout from Phase 1

### Done when
- Active sleep shows the large HH:MM:SS breakdown
- Start time is editable retroactively
- Stop button is large and obvious
- Expand/collapse is animated smoothly
- Backgrounding the app for 10 minutes and resuming shows the correct elapsed time
- Zero TypeScript errors

---

## Phase 3 — DiaperModal
**Scope:** Replace the four inline diaper status buttons on the dashboard card with a proper modal.

### Deliverables
- [x] **New file: `src/modals/DiaperModal.tsx`** — a `Modal` component following the same pattern as `BottleLogModal`
- [x] The diaper card becomes a **single-tap card** — tapping anywhere on it opens `DiaperModal`; the four inline status buttons are removed from the card
- [x] Modal contents:
  - **"Log Diaper"** header + X close button
  - **"Started at" row** — shows "Today, HH:MM AM/PM"; tapping opens the datetimepicker to correct retroactively (same 12h clamp rule as Phase 2)
  - **Four large circle icon buttons** (~100px diameter) in a 2×2 grid or horizontal scroll:
    - Pee — `Ionicons` droplet icon, `COLORS.diaper` tint
    - Poo — `Ionicons` cloud / poo icon, `COLORS.diaper` tint
    - Mixed — two-icon composite or a single combined icon, `COLORS.diaper` tint
    - Dry — dashed droplet (outline style), `COLORS.diaper` at 50% opacity
  - Tapping a circle **auto-saves the log and closes the modal** — no separate Save button needed
  - Each circle has a label below it (Pee / Poo / Mixed / Dry)
- [x] Light/dark theming on modal background and button states

### Done when
- Tapping the diaper card opens the modal ✓
- Tapping a status icon logs immediately and closes ✓
- Start time is editable before logging ✓
- Modal handles the "no baby selected" empty state gracefully ✓
- Zero TypeScript errors ✓

---

## Phase 4 — Unified Feed Modal
**Scope:** Replace `BottleLogModal` and the inline nursing buttons with a single "Add Feeding" modal containing a segmented Nursing / Bottle tab switcher.

### Deliverables
- [x] **New file: `src/modals/FeedModal.tsx`** — replaces `BottleLogModal.tsx`; `BottleLogModal.tsx` is deleted
- [x] Modal has a **Nursing | Bottle** segmented control at the top (two pill tabs, selected fills with `COLORS.feed`)
- [x] **Nursing tab:**
  - Two large circle buttons (~120px diameter): LEFT and RIGHT, `COLORS.feed` (amber) fill
  - Each has a play ▶ or stop ■ icon depending on whether that side is currently running
  - Starting one side auto-pauses the other (existing `TrackerContext` behavior, unchanged)
  - Dashed outer ring on each button (`borderStyle: 'dashed'`, `borderRadius: 60`, animated via Reanimated when active)
  - Live elapsed timers displayed below each button (L: 08:32 / R: 04:15) using `useLiveTick`
  - "Started at" row for retroactive correction (same datetimepicker pattern)
  - **"Manual entry"** text link below the buttons — opens a sub-sheet where the user can type a total duration in MM:SS format; for sessions logged after the fact (e.g., a night feed recalled in the morning)
  - "Save Session" button appears once any time > 0 has accumulated on either side; disabled + grayed out until then
- [x] **Bottle tab:**
  - "Started at" row (retroactive time edit)
  - **Slider** (0–300ml, step 5ml) with a floating live-value badge above the thumb showing e.g. "120 ml"
  - **Outlined pill unit toggle**: `ml` | `oz` — reads from `SettingsContext.units`; stores as ml internally, displays per preference; toggle updates SettingsContext immediately
  - Optional **feed type row**: Formula | Breast milk | Donor milk — three outlined pill buttons; selection stored in `feedType` column (already exists in schema)
  - "Save" full-width button at bottom
- [x] The breast feed card on the dashboard retains its LEFT / RIGHT buttons for direct quick-tap access (they now open `FeedModal` pre-set to the Nursing tab with that side already running)
- [x] Remove `src/modals/BottleLogModal.tsx` once `FeedModal` covers all its functionality

### Done when
- Nursing and Bottle are both accessible from one modal via tabs ✓
- Nursing: L/R buttons work, dashed ring animates, save appears after time accrues ✓
- Bottle: slider works without opening the keyboard, oz/ml toggle works ✓
- Manual entry link opens a simple duration input ✓
- Retroactive start time works on both tabs ✓
- Old `BottleLogModal` is deleted with no remaining references ✓
- Zero TypeScript errors ✓

---

## Phase 2b — Visual Card Redesign
**Scope:** Deeper aesthetic overhaul of all four tracking cards and the dashboard header.

### Deliverables
- [ ] **Double-wrapper card structure** — all 4 cards: outer `TouchableOpacity` (shadow, no overflow),
      inner `View` (overflow: hidden, borderRadius: 16)
- [ ] **Colored category header band** on each card — short top bar filled with category color
      (`COLORS.sleep` / `COLORS.feed` / `COLORS.diaper`); label text white 11px uppercase;
      bell icon white; live timer badge (white bg, category-colored text) on sleep card only
- [ ] **White card body** — `COLORS.surface` background below the header band
- [ ] **Ghost watermark icon on the right** — absolutely positioned in card body, right edge,
      opacity 0.1; 88px for full-width cards, 60–68px for half-width
- [ ] **Fix bottle icon** — change from `Ionicons flask-outline` to
      `MaterialCommunityIcons baby-bottle-outline`
- [ ] **Drop shadows** on all cards — `shadowOffset: {0, 3}`, `shadowOpacity: 0.09`,
      `shadowRadius: 10`, `elevation: 4`; no border (shadow provides separation)
- [ ] **Larger time-since text** — 22px bold on full-width (Sleep, Diaper);
      16px semibold on half-width (Nursing, Bottle)
- [ ] **Dashboard card zone** — `backgroundColor: COLORS.background` (not surface)
      so cards appear elevated against the page
- [ ] **Header warmth** — `backgroundColor: COLORS.surfaceAlt` (sage tint),
      subtle bottom shadow

### Done when
- All four cards display header band + white body + ghost icon right-aligned
- Flask icon is gone; baby-bottle icon appears on Bottle card
- Drop shadow visible on cards (test in iOS Simulator)
- timeSince values are noticeably larger on Sleep and Diaper cards
- Dashboard header has warm sage-tinted background
- Zero TypeScript errors
- Light and dark themes both render correctly

---

## Phase 5 — Settings Screen
**Scope:** Expand SettingsContext and add a settings modal (or section) with all new preference rows.

### Deliverables
- [ ] **New file: `src/modals/SettingsModal.tsx`** — triggered from a gear icon in the dashboard header
- [ ] Settings rows (label-left / value-right underlined style, with dividers between sections):
  - **Baby list section:**
    - One row per baby: avatar circle (same as Phase 1 header style) + name + age + "Edit" tap
    - "Edit" opens `AddBabyModal` pre-populated (edit mode)
    - **"+ Add Child"** primary-color text button below the list
  - **Preferences section:**
    - Theme: Light | System | Dark — three-option segmented control (updates `SettingsContext.theme`, `useTheme()` responds immediately)
    - Units: ml | oz — two-option segmented control (updates `SettingsContext.units`)
    - Time format: 12h | 24h — two-option segmented control (updates `SettingsContext.timeFormat`; all timestamp displays in the app respect this)
  - **Notifications section:**
    - Feed reminder after: [threshold picker] hours (existing)
    - Diaper reminder after: [threshold picker] hours (existing)
    - Sleep reminder after: [threshold picker] hours (existing)
  - **About section:**
    - "Your data is stored locally on this device." — static informational row, no chevron
    - App version (read from `expo-constants` or `package.json` — `Constants.expoConfig?.version`)
    - Privacy Policy — tappable link (opens a `Linking.openURL` to a static URL)
- [ ] `SettingsContext` extended with: `theme: 'system' | 'light' | 'dark'`, `units: 'ml' | 'oz'`, `timeFormat: '12h' | '24h'`
- [ ] All timestamp displays across the app (log list, session summaries) must read `timeFormat` from context

### Done when
- Theme toggle works live (no restart needed)
- Units toggle switches bottle display between ml and oz everywhere
- Time format toggle switches all time displays
- Baby edit works
- About section shows real app version
- Zero TypeScript errors

---

## Phase 6 — UX Micro-Interactions & Polish
**Scope:** Small behavioral improvements that don't require new screens.

### Deliverables
- [ ] **Congratulatory nudge bottom sheet** — shown once after the user saves their first log of each type (tracked in `SettingsContext` as `hasSeenNudge: { sleep: boolean, feed: boolean, diaper: boolean }`). Content: "First sleep logged! Set up a reminder so you never miss one." Split-button CTA: "Skip" (outlined) + "Set up" (filled, opens SettingsModal to notifications section). One-time only per type.
- [ ] **Split-button CTA pattern** — extracted as a reusable `SplitButtonRow` component in `src/components/SplitButtonRow.tsx`: takes `leftLabel`, `rightLabel`, `onLeft`, `onRight` props. Used in the nudge sheet and anywhere else a dismiss/confirm pair is needed (e.g., "Discard session?").
- [ ] **Computed age string helper** — if not already done in Phase 1, extract to `src/utils/ageString.ts` as a pure function `computeAge(dob: number): string` returning e.g. "4 months" or "2 years 3 months".
- [ ] **Card press animation** — subtle `scale(0.97)` press feedback on all tracking cards using Reanimated `useSharedValue` + `withSpring`. Communicates that the card is tappable.
- [ ] **Solids log notes** — if the user holds (long-press) the Solids card, open a minimal `SolidsModal` with a single free-text notes field ("What did they eat?") before saving. Short-tap still logs immediately. This adds food logging without changing the one-tap flow.

### Done when
- Nudge sheet appears on first log of each type and never again
- Split button component is reused across at least two places
- Card press animation feels natural (not over-animated)
- Solids long-press works without breaking the short-tap behavior
- Zero TypeScript errors

---

## Phase Dependency Map

```
Phase 0 (Theme)
    │
    ▼
Phase 1 (Dashboard Cards)   ← useTheme() must exist
    │
    ├─▶ Phase 2 (Sleep Active State)   ← card layout must exist
    │       │
    │       ▼
    │   Phase 2b (Visual Card Redesign) ← card structure must exist
    │
    ├─▶ Phase 3 (DiaperModal)  ✓ done  ← card tap-to-open must exist
    │
    ├─▶ Phase 4 (FeedModal)    ✓ done  ← card tap-to-open must exist
    │
    ▼
Phase 5 (Settings)          ← SettingsContext additions affect Phases 2–4
    │
    ▼
Phase 6 (Polish)            ← all above must be complete
```

Phases 2, 3, and 4 can be worked in parallel once Phase 1 is done — they don't depend on each other.
Phase 2b can be worked alongside or after Phase 2 — it deepens the card aesthetics without affecting behavior.

---

## What "Done" Means (Phase-level)

A phase is done when ALL of the following are true:

1. It compiles with zero TypeScript errors under `strict: true`
2. Every new component handles its empty, loading, and error states explicitly
3. All time values flow through Unix epoch ms — never strings, never `Date` objects in state or DB
4. It works correctly after the app is backgrounded for 10 minutes and resumed
5. It works correctly when a second baby profile exists
6. Light and dark themes both render correctly
7. No hardcoded color hex values in any file touched by the phase

---

## Items Not in This Roadmap (Deferred to v2)

These were identified in the Huckleberry analysis but are explicitly deferred:

- History/Reports screen (Day/Week/List/Summary views)
- Sleep trend charts and wake window analysis
- Rise and bedtime sparkline charts
- Age-appropriate sleep tip cards (requires static age-range lookup table)
- Export data as CSV/JSON from the settings screen
- "Rate Lullaby" row (expo-store-review)
- Food name database/search for solids modal
- Contextual quick-action suggestion chips above the log list
- Baby profile photo/avatar (photo, not initial circle)
