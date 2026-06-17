# Phase 1 — Onboarding & Baby Profiles: Implementation Plan

Each group is independently completable in order. Later groups assume earlier ones are done.

---

## Group 1: Install DateTimePicker

1.1 Install the platform-native date picker:
  ```
  npx expo install @react-native-community/datetimepicker
  ```
1.2 Confirm `npx tsc --noEmit` still passes after install (the package ships its own types).

---

## Group 2: BabyFormModal (shared form component)

2.1 Create `src/modals/BabyFormModal.tsx`.

2.2 The component accepts these props:
  ```ts
  interface BabyFormModalProps {
    visible: boolean;
    mode: 'onboarding' | 'add';
    onSave: (name: string, dob: number) => Promise<void>;
    onDismiss?: () => void; // only available in 'add' mode
  }
  ```

2.3 Internal state:
  - `name: string` — controlled TextInput value
  - `dob: Date` — controlled date picker value, defaults to today minus 1 day
  - `saving: boolean` — true while `onSave` is in flight; disables the submit button

2.4 Layout (top to bottom):
  - Title text: `'Add Baby'` in both modes (onboarding title handled by the wrapper text outside the modal)
  - `TextInput` for baby name — autoFocus, returnKeyType `'done'`, maxLength 40
  - Label: `'Date of Birth'`
  - `DateTimePicker` — mode `'date'`, display `'default'`, maximumDate set to yesterday (babies cannot have a future DOB)
  - Primary action button: `'Save'` — calls `onSave(name.trim(), dob.getTime())`, disabled when `name.trim()` is empty or `saving` is true
  - Dismiss button: rendered only when `mode === 'add'`; calls `onDismiss`

2.5 Validation:
  - Name must be non-empty after trim. Button is disabled, no inline error shown.
  - DOB must not be in the future. `DateTimePicker` enforces this via `maximumDate`.

2.6 On successful save (`onSave` resolves), the parent is responsible for hiding the modal. `BabyFormModal` does not call `onDismiss` after save.

2.7 Run `npx tsc --noEmit` — zero errors.

---

## Group 3: OnboardingModal

3.1 Create `src/modals/OnboardingModal.tsx`.

3.2 Props:
  ```ts
  interface OnboardingModalProps {
    visible: boolean;
    onComplete: () => void;
  }
  ```

3.3 Layout:
  - React Native `Modal` with `animationType='fade'`, `transparent={false}`, full-screen background in `COLORS.background`
  - App logo/name at top: `'Lullaby'` in `COLORS.primary`, `TYPOGRAPHY.size.title`
  - Tagline: `'Set up your first baby profile to get started.'` in `COLORS.textMuted`
  - `BabyFormModal`-equivalent form rendered inline (not as a nested modal) — same fields, no dismiss button
  - On save: calls `useTracker().createBaby(name, dob)` then calls `onComplete`

3.4 This modal is never dismissible by the user. There is no back button, no close icon. The only exit is saving a baby profile.

3.5 Run `npx tsc --noEmit` — zero errors.

---

## Group 4: AddBabyModal

4.1 Create `src/modals/AddBabyModal.tsx`.

4.2 Props:
  ```ts
  interface AddBabyModalProps {
    visible: boolean;
    onDismiss: () => void;
  }
  ```

4.3 Renders a React Native `Modal` (`animationType='slide'`, `transparent={false}`) containing `BabyFormModal` in `mode='add'`.

4.4 On save: calls `useTracker().createBaby(name, dob)` then calls `onDismiss`.

4.5 On dismiss (user taps cancel): calls `onDismiss` directly.

4.6 Run `npx tsc --noEmit` — zero errors.

---

## Group 5: DashboardHeader component

5.1 Create `src/screens/DashboardHeader.tsx`.

5.2 Props:
  ```ts
  interface DashboardHeaderProps {
    onAddBaby: () => void;
  }
  ```

5.3 Layout (horizontal row):
  - Left: app name `'Lullaby'` in `COLORS.primary`, `TYPOGRAPHY.size.lg`, bold
  - Right: baby name dropdown — a `TouchableOpacity` that shows the active baby's name + a `▾` chevron. On press, opens a dropdown (see 5.4).

5.4 Dropdown implementation:
  - Use a React Native `Modal` with `transparent={true}` and a semi-transparent backdrop.
  - Renders a list of all baby names from `useTracker().babies`.
  - Tapping a name calls `useTracker().setActiveBabyId(id)` and closes the dropdown.
  - Last item in the list is always `'+ Add Baby'` — tapping it closes the dropdown and calls `onAddBaby`.
  - Active baby has a `✓` checkmark on its row.

5.5 Run `npx tsc --noEmit` — zero errors.

---

## Group 6: Dashboard screen (shell)

6.1 Create `src/screens/Dashboard.tsx`.

6.2 This is the shell only — no tracking buttons yet (those come in Phase 2 onwards). It renders:
  - `SafeAreaView` with `COLORS.background`
  - `DashboardHeader` at the top with `onAddBaby` wired to show `AddBabyModal`
  - `AddBabyModal` (controlled by local `showAddBaby` state)
  - A centered placeholder `Text`: `'Ready to track.'` in `COLORS.textMuted` — fills the remaining flex space

6.3 Run `npx tsc --noEmit` — zero errors.

---

## Group 7: Wire onboarding into App.tsx

7.1 Update `App.tsx`:
  - Add local state: `onboardingComplete: boolean`, initialized by checking `useTracker().babies.length > 0` — but since context isn't available above the providers, use a callback pattern.
  - Simplest approach: add an `AppShell` component rendered inside the providers that reads `babies` from context and decides whether to show `OnboardingModal` or `Dashboard`.

7.2 Create `src/screens/AppShell.tsx`:
  ```ts
  // Reads babies from context; shows OnboardingModal until at least one baby exists,
  // then renders Dashboard permanently.
  ```
  - `OnboardingModal` `visible` prop = `babies.length === 0`
  - `Dashboard` is always rendered (behind the modal when onboarding is active), so it mounts and is ready immediately after the first baby is saved.

7.3 Update `App.tsx` to render `<AppShell />` instead of the bare `<SafeAreaView />`.

7.4 Run `npx tsc --noEmit` and `npm run lint` — zero errors on both.

---

## Group 8: Cleanup

8.1 Remove `.gitkeep` from `src/screens/` and `src/modals/` — they now have real files.
8.2 Run `npx tsc --noEmit` and `npm run lint` — final clean pass before commit.
