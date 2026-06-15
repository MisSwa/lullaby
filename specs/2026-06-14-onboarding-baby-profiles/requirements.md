# Phase 1 — Onboarding & Baby Profiles: Requirements

## Scope

This phase produces the first visible UI: an onboarding flow for new users and a dashboard header with a baby switcher. No tracking features are implemented. The app goes from a blank screen to a named, navigable shell.

---

## New Dependency

`@react-native-community/datetimepicker` — installed via `npx expo install` to get the SDK-compatible version. This is the only new package permitted in this phase. It uses the platform's native date picker component (spinner on Android, wheel on iOS) with no additional setup.

---

## New Files

```
src/
  modals/
    BabyFormModal.tsx      — shared form: name input + DOB picker
    OnboardingModal.tsx    — full-screen first-launch gate
    AddBabyModal.tsx       — slide-up sheet for adding a second baby
  screens/
    AppShell.tsx           — context-aware router: onboarding vs dashboard
    Dashboard.tsx          — screen shell with header + placeholder
    DashboardHeader.tsx    — app name + baby dropdown switcher
```

No other files are created. `src/services/db.ts` and `src/context/TrackerContext.tsx` already have `createBaby` and `fetchBabies` implemented from Phase 0 — no changes needed there.

---

## Component Contracts

### BabyFormModal

Shared form rendered inline (not as a nested `Modal`). Used by both `OnboardingModal` and `AddBabyModal`.

```ts
interface BabyFormModalProps {
  visible: boolean;
  mode: 'onboarding' | 'add';
  onSave: (name: string, dob: number) => Promise<void>;
  onDismiss?: () => void; // only rendered when mode === 'add'
}
```

**Name field:**
- `TextInput`, `autoFocus={true}`, `maxLength={40}`, `returnKeyType="done"`
- Placeholder: `'Baby's name'`
- Controlled — value bound to local state

**Date of birth field:**
- Label: `'Date of Birth'`
- `DateTimePicker` from `@react-native-community/datetimepicker`
- `mode="date"`, `display="default"`
- `maximumDate`: yesterday (`new Date(Date.now() - 86400000)`)
- `minimumDate`: 3 years ago (reasonable floor — not enforced strictly)
- Default value: yesterday

**Save button:**
- Disabled when `name.trim() === ''` or `saving === true`
- On press: sets `saving = true`, calls `onSave(name.trim(), dob.getTime())`, parent hides the modal on resolve
- On error: sets `saving = false`, re-enables button (error logged to `console.error`)

**Dismiss button:**
- Only rendered when `mode === 'add'`
- Label: `'Cancel'`
- Calls `onDismiss`
- Always enabled — not affected by `saving` state

---

### OnboardingModal

Full-screen, non-dismissible first-launch gate.

```ts
interface OnboardingModalProps {
  visible: boolean;
  onComplete: () => void;
}
```

- React Native `Modal`, `animationType="fade"`, `transparent={false}`
- Background: `COLORS.background`, full flex
- No close button, no back gesture handler — the only exit is completing the form
- Renders the baby form fields directly (not `BabyFormModal` as a nested modal)
- On save: calls `useTracker().createBaby(name, dob)` → calls `onComplete()`

---

### AddBabyModal

Slide-up sheet for adding subsequent babies.

```ts
interface AddBabyModalProps {
  visible: boolean;
  onDismiss: () => void;
}
```

- React Native `Modal`, `animationType="slide"`, `transparent={false}`
- Renders `BabyFormModal` in `mode="add"`
- On save: calls `useTracker().createBaby(name, dob)` → calls `onDismiss()`
- On cancel: calls `onDismiss()` directly

---

### DashboardHeader

```ts
interface DashboardHeaderProps {
  onAddBaby: () => void;
}
```

- Horizontal row: app name left, baby switcher right
- App name: `'Lullaby'`, `COLORS.primary`, bold, `TYPOGRAPHY.size.lg`
- Baby switcher: `TouchableOpacity` showing active baby name + `' ▾'`
- Dropdown: transparent-backdrop `Modal` listing all babies; active baby shows `'✓'`; last row is `'+ Add Baby'`
- Tapping a baby: calls `setActiveBabyId(id)`, closes dropdown
- Tapping `'+ Add Baby'`: closes dropdown, calls `onAddBaby`
- If `activeBabyId` is null (should not happen after onboarding): shows `'—'`

---

### AppShell

Internal routing component. Rendered inside all providers in `App.tsx`.

```ts
// No props
export const AppShell: React.FC = () => { ... }
```

- Reads `babies` from `useTracker()`
- `OnboardingModal` `visible={babies.length === 0}`
- `Dashboard` always rendered — mounts immediately so it is ready the instant the first baby is saved
- `OnboardingModal` sits on top of `Dashboard` via React Native's Modal stacking

---

### Dashboard (shell)

```ts
// No props
export const Dashboard: React.FC = () => { ... }
```

- `SafeAreaView` with `COLORS.background`, flex 1
- `DashboardHeader` at top, wired to `AddBabyModal`
- `AddBabyModal` controlled by local `showAddBaby: boolean` state
- Remaining space: centered `Text` `'Ready to track.'` in `COLORS.textMuted`, `TYPOGRAPHY.size.base`
- The tracker buttons added in Phase 2 will replace this placeholder

---

## Styling Rules (from CLAUDE.md)

- All colors via `COLORS`. No hardcoded hex strings.
- All font sizes via `TYPOGRAPHY.size`. No hardcoded numbers.
- All `TouchableOpacity` hit areas minimum 44×44 logical pixels.
- `StyleSheet.create()` for all styles — no inline style objects except for dynamic values (e.g., active state colors).

---

## Data Flow

```
AppShell
  ↓ reads babies.length from TrackerContext
  ↓ if 0 → OnboardingModal visible
    ↓ user submits → createBaby() in TrackerContext
      ↓ db.createBaby() writes to SQLite
      ↓ TrackerContext updates babies state
    ↓ babies.length > 0 → OnboardingModal hides, Dashboard shows
  ↓ if > 0 → Dashboard visible immediately
    ↓ DashboardHeader reads babies + activeBabyId from TrackerContext
    ↓ dropdown calls setActiveBabyId()
```

No new database functions are needed — `createBaby` and `fetchBabies` from Phase 0 handle everything.

---

## Out of Scope

- Baby profile editing (name, DOB correction)
- Baby profile deletion
- Baby photo / avatar
- Any tracking UI (sleep, feed, diaper) — Phase 2 onwards
- The log list — Phase 2 onwards
- Notifications — Phase 6
