# Phase 0 — Theme Foundation: Requirements

> **Branch:** `phase-0-theme-foundation`
> **Roadmap ref:** `specs/roadmap.md` — Phase 0
> **Date:** 2026-06-16

---

## Scope

Add a dual light/dark color palette system to Lullaby so that every subsequent phase can build themed components from day one. This phase is pure infrastructure — no user-visible UI changes beyond the OS theme being respected.

**In scope:**
- `ColorPalette` TypeScript interface in `colors.ts`
- `LIGHT` and `DARK` palette objects in `colors.ts`
- `surfaceAlt` token added to both palettes
- `useTheme()` hook in `src/hooks/useTheme.ts`
- `theme` field added to `SettingsContext` (`'system' | 'light' | 'dark'`, default `'system'`)
- Audit of all 8 component files — replace hardcoded hex strings with `useTheme()` calls
- Existing flat `COLORS` export kept but deprecated via a JSDoc comment (not deleted — backward compat during migration)

**Out of scope for this phase:**
- Any UI component that does not already exist (no new components)
- The Settings screen toggle for theme (Phase 5)
- `units` and `timeFormat` fields in SettingsContext (Phase 5)
- Android validation (iOS Simulator only per decision)

---

## Key Decisions

### Decision 1: Migration strategy — `COLORS` kept alongside `useTheme()`

The existing flat `COLORS` export is preserved and continues to point to the `LIGHT` palette values. This means the codebase stays compilable at every commit during the audit. Each of the 8 files is migrated in a separate task group. `COLORS` is marked `@deprecated` via JSDoc once all 8 files are migrated.

**Why not break the API immediately:** The 8 files span modals, screens, and headers. If they all need to change at once, a partial edit leaves the app uncompilable. Keeping `COLORS` means each file can be migrated and tested independently.

### Decision 2: `useTheme()` reads `Appearance` + `SettingsContext.theme` override (Phase 0 pre-wires it)

`SettingsContext` gets a `theme: 'system' | 'light' | 'dark'` field now, persisted under the key `'app_theme'` in the SQLite `settings` table. Since the default is `'system'`, the runtime behavior in Phase 0 is identical to reading `Appearance` directly. The hook signature and storage plumbing are complete — Phase 5 just adds the UI toggle.

**Why not defer:** Setting up the SettingsContext shape now means every component migrated in this phase is already wired to the correct final API. No Phase 5 re-migration needed.

**Resolution of circular dependency:** `useTheme()` imports `useSettings()` to read the override. This is not circular — `useTheme` is a consumer of `SettingsContext`, not a provider. The provider chain in `App.tsx` is `SQLiteProvider → SettingsProvider → TrackerProvider → Dashboard`, so `SettingsContext` is always available to any hook called inside components.

### Decision 3: Validation is iOS Simulator only

Android Appearance API behaves identically to iOS for `getColorScheme()` and `addChangeListener`. The iOS Simulator is sufficient for Phase 0. Android is validated as part of Phase 1 when actual themed components ship.

---

## Context: Current State of `colors.ts`

```ts
export const COLORS = {
  primary: '#5F7A61',
  primaryLight: '#D5E0D5',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  textPrimary: '#2D3748',
  textMuted: '#718096',
  border: '#E2E8F0',
  sleep: '#4A6FA5',
  feed: '#D97706',
  diaper: '#8C6239',
  active: '#10B981',
  error: '#EF4444',
  success: '#10B981',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.35)',
} as const;
```

No `DARK` palette exists. No `ColorPalette` type. No `useTheme()` hook.

---

## Context: Current State of `SettingsContext`

Currently owns only `notifications: NotificationSettings` and `updateNotificationPref`. Has no `theme` field. The new field must be added without breaking the existing `useSettings()` consumer interface.

---

## Context: Files with Hardcoded Colors

These 8 files must be migrated to `useTheme()` as part of this phase:

| File | Notes |
|---|---|
| `src/screens/Dashboard.tsx` | Main screen — most styles |
| `src/screens/DashboardHeader.tsx` | Header bar |
| `src/modals/OnboardingModal.tsx` | First-launch flow |
| `src/modals/AddBabyModal.tsx` | Add child flow |
| `src/modals/BabyFormModal.tsx` | Baby edit form |
| `src/modals/BottleLogModal.tsx` | Bottle amount input |
| `src/modals/NotesModal.tsx` | Notes input |
| `src/modals/SettingsModal.tsx` | Settings (stub) |

`src/theme/colors.ts` itself is obviously exempt (it defines the colors). `TrackerContext.tsx` and all service/hook files are not in this list because they do not reference colors.

---

## Dark Palette Values

| Token | Light value | Dark value |
|---|---|---|
| `primary` | `#5F7A61` | `#7BA67D` |
| `primaryLight` | `#D5E0D5` | `#2D3D2E` |
| `background` | `#F8F9FA` | `#0F1117` |
| `surface` | `#FFFFFF` | `#1A1E27` |
| `surfaceAlt` | `#F0F4F0` | `#1E2530` |
| `textPrimary` | `#2D3748` | `#E2E8F0` |
| `textMuted` | `#718096` | `#718096` |
| `border` | `#E2E8F0` | `#2D3748` |
| `sleep` | `#4A6FA5` | `#6B9FD4` |
| `feed` | `#D97706` | `#F59E0B` |
| `diaper` | `#8C6239` | `#A07850` |
| `active` | `#10B981` | `#10B981` |
| `error` | `#EF4444` | `#FC8181` |
| `success` | `#10B981` | `#10B981` |
| `shadow` | `#000000` | `#000000` |
| `overlay` | `rgba(0,0,0,0.35)` | `rgba(0,0,0,0.6)` |

---

## Non-negotiables (from CLAUDE.md)

- No hardcoded hex strings in any component file after this phase completes
- `strict: true` — the `ColorPalette` interface must type-check both `LIGHT` and `DARK` exhaustively
- No new packages — `Appearance` is from React Native core
- `useTheme()` must be a plain hook, not a context provider (no new context wrapper in the tree)
