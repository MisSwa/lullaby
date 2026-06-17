# Lullaby — Tech Stack Spec (UI/UX Upgrade Pass)

> Extends the approved dependency list in `CLAUDE.md` Section 3.
> All existing rules and forbidden categories still apply.
> Only the additions below are new.

---

## Existing Approved Packages (unchanged)

| Package | Purpose |
|---|---|
| `expo-sqlite` | Local database |
| `expo-crypto` | UUID generation |
| `expo-notifications` | Local push notifications |
| `expo-file-system` | Backup file I/O |
| `expo-document-picker` | iCloud / Drive file access |
| React Native core | `AppState`, `TouchableOpacity`, `StyleSheet`, etc. |

---

## New Approved Packages

All four packages below ship **inside the Expo SDK**. They require no `npm install` beyond what is already in the project. They are zero-cost additions.

### 1. `react-native-reanimated`

**Already in Expo SDK.** No install needed.

**Purpose:** Fluid, gesture-driven animations for:
- Slider thumb drag (bottle amount)
- Modal entry/exit transitions (smooth spring instead of abrupt)
- Active-state pulse on the running sleep/feed timer
- Card press feedback (subtle scale-down on tap)

**Rule:** Only use Reanimated for interactions that are genuinely improved by fluid animation. Do not animate for decoration. Every animation must serve a UX purpose (indicate state, acknowledge input, guide attention).

**Version:** Use the version pinned by the Expo SDK. Do not upgrade independently.

---

### 2. `@expo/vector-icons`

**Already in Expo SDK.** No install needed. Ships with Expo Go.

**Purpose:** Icon set for:
- Diaper status icons (droplet, cloud, combined, dashed)
- Category ghost/watermark icons on cards (moon, breast, bottle, fork, diaper)
- Reminder bell icon on cards with active notifications
- Play/stop icons on nursing L/R buttons and sleep button
- Navigation affordances (chevron, X close, pencil/edit)

**Rule:** Use the `Ionicons` set exclusively for visual consistency. Do not mix icon sets within the app. Icon size and color must always reference `COLORS` — never hardcoded.

**Forbidden:** Using icons as decoration without semantic meaning. Every icon must communicate something.

---

### 3. `@react-native-community/datetimepicker`

**Expo-bundled.** No install needed (included via `expo` package).

**Purpose:** Native time picker for retroactive start-time editing in:
- DiaperModal — "Started at" row, tappable to correct the timestamp
- FeedModal — "Started at" row for both nursing and bottle
- SleepCard active view — "Started at HH:MM AM/PM", tappable

**Rule:**
- Always initialize to the current event's timestamp, not `Date.now()`.
- On iOS: render `mode="time"` inline (spinner style). On Android: render as a native clock dialog.
- On confirm: write a corrected Unix epoch ms. Never store or pass a `Date` object into state — convert immediately: `picker.getTime()` → Unix ms.
- Maximum retroactive edit: 12 hours in the past. Reject values more than 12h ago with an inline error message.

---

### 4. `@react-native-community/slider`

**Expo-bundled.** No install needed (included via `expo` package).

**Purpose:** Thumb-draggable horizontal slider for:
- Bottle amount input (0–300ml in 5ml increments)

**Rule:**
- Display the live value in a floating badge above the thumb using a `View` positioned absolutely — updates on every `onValueChange`.
- Step increments: 5ml (so 0, 5, 10, 15 … 300).
- Minimum tap target for the thumb: 44×44px.
- Store value in component state as `number` (ml). Write to DB as `INTEGER`.
- Color the filled track with `COLORS.feed` (amber). Unfilled track: `COLORS.border`.

---

## Theme System

The existing `src/theme/colors.ts` must be extended to export both a **light** and **dark** palette, plus a `useTheme()` hook that reads `Appearance.getColorScheme()`.

### New structure for `colors.ts`

```ts
// Both palettes share the same token names.
// Components reference COLORS.background, COLORS.surface, etc.
// They never reference "light" or "dark" directly.

const LIGHT: ColorPalette = {
  primary: '#5F7A61',
  primaryLight: '#D5E0D5',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F4F0',      // NEW: card ghost icon tint
  textPrimary: '#2D3748',
  textMuted: '#718096',
  border: '#E2E8F0',
  sleep: '#4A6FA5',
  feed: '#D97706',
  diaper: '#8C6239',
  active: '#10B981',
  error: '#EF4444',
  success: '#10B981',
};

const DARK: ColorPalette = {
  primary: '#7BA67D',         // lighter sage for dark bg readability
  primaryLight: '#2D3D2E',    // dark sage tint
  background: '#0F1117',      // very deep slate
  surface: '#1A1E27',         // card background
  surfaceAlt: '#1E2530',      // card ghost icon tint
  textPrimary: '#E2E8F0',     // near-white
  textMuted: '#718096',       // same muted gray works on dark too
  border: '#2D3748',          // dark divider
  sleep: '#6B9FD4',           // lighter indigo on dark
  feed: '#F59E0B',            // brighter amber on dark
  diaper: '#A07850',          // lighter clay on dark
  active: '#10B981',          // emerald stays the same
  error: '#FC8181',           // lighter red on dark
  success: '#10B981',
};
```

### `useTheme()` hook

Lives in `src/hooks/useTheme.ts`:

```ts
import { Appearance } from 'react-native';
// Returns LIGHT or DARK based on system setting.
// In Phase 5, a user override stored in SettingsContext takes priority.
```

**Rule:** All components must consume `useTheme()` to get their colors. No component may import `LIGHT` or `DARK` directly. No hardcoded color hex values in any component file.

---

## What Is Still Forbidden

These bans are unchanged from `CLAUDE.md` and apply to this spec too:

- HTTP clients (`axios`, `fetch` wrappers, `react-query`)
- Analytics SDKs (`Mixpanel`, `Amplitude`, `Segment`, Firebase Analytics)
- Crash reporting SDKs (`Sentry`, `Bugsnag`, `Crashlytics`)
- UI component libraries (`NativeBase`, `RN Elements`, `Tamagui`, `Gluestack`)
- Date formatting libraries (`date-fns`, `dayjs`, `moment`) — use `Intl.DateTimeFormat`
- Navigation libraries (`react-navigation`, `expo-router`)
- State management libraries (Redux, Zustand, Jotai, MobX, Recoil)
- Any package that requires a server, API key, or user account to function

---

## Dependency Decision Log

| Decision | Rationale |
|---|---|
| Use `@expo/vector-icons` (Ionicons) over a custom SVG icon system | Zero bundle cost (already in Expo), consistent cross-platform rendering, no additional tooling |
| Use `@react-native-community/slider` over a custom Reanimated drag | Battle-tested native slider, correct accessibility semantics, identical look-and-feel on both platforms |
| Use `@react-native-community/datetimepicker` over a custom wheel picker | Native pickers respect the OS accessibility settings (large text, etc.) — critical for sleep-deprived users |
| Use `react-native-reanimated` only for fluid interactions | Avoids the complexity of a gesture library; Reanimated alone covers everything we need |
| No icon library beyond `@expo/vector-icons` | Enforces visual consistency — one icon set, one style |
