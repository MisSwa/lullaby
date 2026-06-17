# Phase 0 — Theme Foundation: Implementation Plan

> Execute task groups in order. Each group must compile and type-check before
> moving to the next. Never leave the repo in a non-compiling state.

---

## Group 1 — Define the Color Palette Type and Dual Palettes

**Files:** `src/theme/colors.ts`

### Tasks

1.1 Add a `ColorPalette` interface above `COLORS` that explicitly types every token:

```ts
export interface ColorPalette {
  primary: string;
  primaryLight: string;
  background: string;
  surface: string;
  surfaceAlt: string;       // NEW token
  textPrimary: string;
  textMuted: string;
  border: string;
  sleep: string;
  feed: string;
  diaper: string;
  active: string;
  error: string;
  success: string;
  shadow: string;
  overlay: string;
}
```

1.2 Add `LIGHT` and `DARK` objects typed as `ColorPalette` with all values from the dark palette table in `requirements.md`.

1.3 Keep the existing `COLORS` export but make it a reference to `LIGHT` (not a new object) and mark it deprecated:

```ts
/** @deprecated Use `useTheme()` instead. Will be removed after all files migrate. */
export const COLORS: ColorPalette = LIGHT;
```

1.4 Verify TypeScript: both `LIGHT` and `DARK` must satisfy `ColorPalette` — if any token is missing from either, the compile fails. This is the intent.

**Compile check:** `npx tsc --noEmit` passes after this group.

---

## Group 2 — Add `theme` to SettingsContext

**Files:** `src/context/SettingsContext.tsx`

### Tasks

2.1 Add `AppTheme` type to the types file OR define it locally in SettingsContext:

```ts
export type AppTheme = 'system' | 'light' | 'dark';
```

2.2 Extend `SettingsContextType` interface:

```ts
interface SettingsContextType {
  notifications: NotificationSettings;
  updateNotificationPref: (...) => Promise<void>;
  theme: AppTheme;                           // NEW
  updateTheme: (t: AppTheme) => Promise<void>; // NEW
}
```

2.3 In the provider, load `theme` from SQLite on mount using key `'app_theme'`. If the stored value is not one of `'system' | 'light' | 'dark'`, fall back to `'system'`.

2.4 Implement `updateTheme`: updates local state and persists to SQLite via `setSetting(db, 'app_theme', t)`.

2.5 Verify that no existing consumer of `useSettings()` breaks — `notifications` and `updateNotificationPref` are unchanged. All existing call sites still compile.

**Compile check:** `npx tsc --noEmit` passes after this group.

---

## Group 3 — Create `useTheme()` Hook

**Files:** `src/hooks/useTheme.ts` *(new file)*

### Tasks

3.1 Create `src/hooks/useTheme.ts`:

```ts
import { useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { LIGHT, DARK, ColorPalette } from '@theme/colors';
import { useSettings } from '@context/SettingsContext';

function resolveScheme(override: 'system' | 'light' | 'dark'): ColorPalette {
  if (override === 'light') return LIGHT;
  if (override === 'dark') return DARK;
  // 'system'
  return Appearance.getColorScheme() === 'dark' ? DARK : LIGHT;
}

export function useTheme(): ColorPalette {
  const { theme } = useSettings();
  const [palette, setPalette] = useState<ColorPalette>(() => resolveScheme(theme));

  useEffect(() => {
    // Re-resolve whenever the user override changes
    setPalette(resolveScheme(theme));
  }, [theme]);

  useEffect(() => {
    // Only listen to OS changes when override is 'system'
    if (theme !== 'system') return;
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setPalette(colorScheme === 'dark' ? DARK : LIGHT);
    });
    return () => sub.remove();
  }, [theme]);

  return palette;
}
```

3.2 The hook must only be called inside components that are descendants of `SettingsProvider`. Document this in a JSDoc comment on the export.

3.3 Verify the hook compiles with no implicit `any` types. The return type `ColorPalette` must be explicit.

**Compile check:** `npx tsc --noEmit` passes after this group.

---

## Group 4 — Migrate Dashboard.tsx

**Files:** `src/screens/Dashboard.tsx`

### Tasks

4.1 Add `const COLORS = useTheme();` at the top of the component function body (shadow the deprecated import with a local const — clean, no import change needed if the file currently imports `COLORS` from theme).

4.2 Remove the `import { COLORS } from '@theme/colors'` line (or change to import `useTheme` instead).

4.3 All `COLORS.*` references in the `StyleSheet.create()` calls must move OUT of `StyleSheet.create()` and into the component body, since `StyleSheet.create()` runs once at module load time and cannot access a hook's return value. Pattern:

```ts
// BEFORE (static, doesn't respond to theme)
const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.surface }
});

// AFTER (dynamic, theme-aware)
export default function Dashboard() {
  const COLORS = useTheme();
  const styles = React.useMemo(() => StyleSheet.create({
    card: { backgroundColor: COLORS.surface }
  }), [COLORS]);
  // ...
}
```

4.4 Wrap the `StyleSheet.create()` call in `useMemo` with `[COLORS]` as the dependency so styles recompute when the theme changes.

4.5 After migration, no hex string literal (`#...`) should remain in `Dashboard.tsx`. Verify by searching for `/#[0-9a-fA-F]/` in the file.

**Compile check:** `npx tsc --noEmit` passes after this group.

---

## Group 5 — Migrate DashboardHeader.tsx

**Files:** `src/screens/DashboardHeader.tsx`

### Tasks

5.1 Same pattern as Group 4: add `const COLORS = useTheme();`, move styles into `useMemo([COLORS])`, remove static import of `COLORS`.

5.2 No hex string literal remains in the file after migration.

**Compile check:** `npx tsc --noEmit` passes after this group.

---

## Group 6 — Migrate All Modal Files

**Files:**
- `src/modals/OnboardingModal.tsx`
- `src/modals/AddBabyModal.tsx`
- `src/modals/BabyFormModal.tsx`
- `src/modals/BottleLogModal.tsx`
- `src/modals/NotesModal.tsx`
- `src/modals/SettingsModal.tsx`

### Tasks

6.1 Apply the same `useTheme()` + `useMemo` pattern to all six modal files. Each modal is a React component — the hook call goes at the top of the component function body.

6.2 Work through them in order (OnboardingModal → AddBabyModal → BabyFormModal → BottleLogModal → NotesModal → SettingsModal). Compile-check after each file.

6.3 After all six are done, search the entire `src/` directory for remaining hex literals in `.tsx` files:

```bash
grep -rn "#[0-9a-fA-F]\{3,6\}" src/ --include="*.tsx" --include="*.ts" \
  | grep -v "colors.ts"
```

The result must be empty.

**Compile check:** `npx tsc --noEmit` passes after this group.

---

## Group 7 — Final Audit and Deprecation

**Files:** `src/theme/colors.ts`, any remaining files

### Tasks

7.1 Run the full hex-string grep (from Group 6 step 3) and verify zero results outside `colors.ts`.

7.2 Confirm `COLORS` is marked `@deprecated` in `colors.ts`.

7.3 Add `AppTheme` to `src/types/tracker.ts` (or a new `src/types/settings.ts`) so it is a shared named type — not defined locally in SettingsContext.

7.4 Final `npx tsc --noEmit` — zero errors, zero warnings.

7.5 Smoke-test in iOS Simulator:
- Launch app in Light mode → all screens render with light palette
- Switch device to Dark mode → app immediately updates without restart
- Switch back to Light → app immediately updates

7.6 Update the roadmap checklist: mark all Phase 0 deliverables as `[x]` in `specs/roadmap.md`.

---

## Task Group Order Summary

```
Group 1 → Group 2 → Group 3 → Group 4 → Group 5 → Group 6 → Group 7
 colors     settings  useTheme  Dashboard  Header   6 modals  audit+test
```

Groups 4–6 (file migrations) can technically be done in any order relative to each other, but must all come after Group 3.
