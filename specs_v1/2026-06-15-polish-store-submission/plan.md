# Phase 8 — Polish & Store Submission: Plan

Each group is independently completable. Groups 1–3 (code quality) and Group 4 (visual assets) can be worked in parallel. Groups 5–7 must follow in order.

---

## Group 1 — TypeScript & Color Audit

1.1 Run `tsc --noEmit` with `strict: true`. Fix every error to zero.
1.2 Search the codebase for `any` type annotations. Replace each with a proper type or `unknown` with a type guard.
1.3 Search all component files for hardcoded hex strings or named colors. Move every one to `COLORS` in `src/theme/colors.ts`.
1.4 Verify every `switch` on `BabyLog.type` has an `exhaustive` default that is unreachable (use a `never` assignment to enforce at compile time).
1.5 Verify every `async` function touching `expo-sqlite` or `expo-notifications` has a `try/catch` that calls `console.error` on failure.

---

## Group 2 — Empty States & Error Boundaries

2.1 Audit every screen and modal: what renders when data is loading? When the list is empty? When an operation fails? Document any gaps.
2.2 Implement explicit empty state views for: today's log list (no events yet), onboarding (no babies — already exists, verify), add-baby modal.
2.3 Add explicit error fallback text to any modal that calls an async operation (e.g., bottle save failure, backup failure paths).
2.4 Confirm no component renders `null` as its sole loading/empty state.

---

## Group 3 — Touch Target & Layout Audit

3.1 Walk through every interactive element in the app. Measure or verify via StyleSheet that `minHeight`/`minWidth` ≥ 44 on all buttons, tappable rows, and ✕ delete targets.
3.2 Confirm sleep toggle and breast feed buttons are ≥ 90px tall.
3.3 Check that diaper inline buttons are spaced correctly for one-handed use — no targets closer than 8px apart.
3.4 Review log list delete targets: swipe or ✕ tap must be easy to hit without disturbing adjacent items.
3.5 Test layout on small screen (iPhone SE / similar compact Android) to ensure no overflow or clipping.

---

## Group 4 — Visual Assets

4.1 Design app icon: 1024×1024 PNG, Sage Green (`#5F7A61`) palette, no purple, no transparency. A simple mark — e.g. a moon or leaf motif — on a white or off-white background.
4.2 Export icon at all required sizes via EAS / Expo image pipeline (do not manually generate every size; configure `icon` in `app.json` and let EAS handle resizing).
4.3 Design splash screen: centered icon/wordmark on `#F8F9FA`. Configure `splash.backgroundColor` in `app.json`.
4.4 Verify splash looks correct on 6.9", 6.5", and 5.5" iPhone screen sizes and at least one common Android screen size.
4.5 Confirm no Huckleberry purple (`#7C5CBF` or variants) appears anywhere in icon or splash assets.

---

## Group 5 — Background Timer & Multi-Baby Testing

5.1 On a physical iPhone: start sleep timer → background app for 10 minutes → return → confirm elapsed time is within 2 seconds of actual elapsed.
5.2 On a physical iPhone: start breast feed timer (one side) → background for 5 minutes → return → confirm elapsed is correct.
5.3 Repeat 5.1 and 5.2 on a physical Android device.
5.4 Create two baby profiles. Log a sleep event under Baby A. Switch to Baby B — confirm log list shows no events. Log a diaper under Baby B. Switch back to Baby A — confirm only Baby A's events appear.
5.5 Delete a log under Baby A. Confirm it does not affect Baby B's logs.
5.6 Full manual walkthrough on each platform: onboarding → sleep → breast feed → bottle → solids → diaper → notifications fire → backup file written → all log cards display correctly → delete works.

---

## Group 6 — EAS Build Setup

6.1 Configure `eas.json` with a `production` build profile: `distribution: store`, `ios.credentialsSource: remote`, `android.buildType: app-bundle`.
6.2 Register app identifier in Apple Developer portal. Generate Distribution certificate and provisioning profile via `eas credentials`.
6.3 Generate Android keystore via `eas credentials`. Store the keystore and credentials backup in a secure location external to the repo (not committed to git).
6.4 Set `bundleIdentifier` (iOS) and `package` (Android) in `app.json`. Choose values that will not conflict with existing apps.
6.5 Run `eas build --platform ios --profile production`. Confirm build succeeds and produces a signed `.ipa`.
6.6 Run `eas build --platform android --profile production`. Confirm build succeeds and produces a signed `.aab`.
6.7 Install the `.ipa` via TestFlight or direct install and smoke-test on device. Install the `.aab` via internal track and smoke-test.

---

## Group 7 — Store Assets & Submission

7.1 Write App Store listing copy: app name ("Lullaby"), subtitle (≤30 chars), description (≤4000 chars, no claims of medical accuracy), keywords (≤100 chars comma-separated).
7.2 Capture iPhone screenshots: 6.9", 6.5", and 5.5" sizes. At least 3 per size class. Show: dashboard with active sleep timer, log list with multiple entries, diaper buttons, onboarding modal.
7.3 Set App Store pricing to $5.00 USD. Set age rating to 4+. Add support URL and privacy policy URL (must be live before submission).
7.4 Submit iOS build to App Store Review via App Store Connect.
7.5 Write Play Store listing: short description (≤80 chars), full description (≤4000 chars). Upload feature graphic (1024×500 PNG).
7.6 Capture Android screenshots. At least 2. Upload to Play Console.
7.7 Complete Play Store content rating questionnaire. Set pricing to $5.00 USD with regional pricing enabled.
7.8 Submit Android build to Play Review via Google Play Console (internal → production track).
