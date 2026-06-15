# Phase 8 — Polish & Store Submission: Validation

A feature is mergeable when **all** of the following checks pass. No partial credit.

---

## Code Quality

- [ ] `tsc --noEmit` exits with zero errors under `strict: true`.
- [ ] `grep -r "any"` (excluding `node_modules` and type declaration files) returns no results in source files.
- [ ] `grep -rE "#[0-9A-Fa-f]{3,6}"` in `src/` returns no results (no hardcoded hex colors).
- [ ] Every `switch` on `BabyLog.type` contains a `default` arm that assigns to `never`, enforcing exhaustiveness at compile time.
- [ ] Every `async` function in `src/services/` and `src/hooks/` has a `try/catch` block; the `catch` calls `console.error`.

---

## UX Completeness

- [ ] The today's log list renders an explicit empty-state message when no events exist for the active baby today.
- [ ] Every modal has an explicit error state (text or visual indicator) for async operation failures.
- [ ] No component in `src/` renders bare `null` as its loading or empty fallback.
- [ ] All touch targets pass the 44×44pt minimum: verified by code review of StyleSheet values.
- [ ] Sleep toggle and breast feed buttons have `minHeight: 90` in their StyleSheet.

---

## Visual Assets

- [ ] App icon is 1024×1024 PNG with no transparency and no purple.
- [ ] Splash screen is configured in `app.json` and renders correctly on 6.9", 6.5", and 5.5" iPhone simulators.
- [ ] No hex value matching `/7[Cc]5[Cc][Bb][Ff]/` or `#7c5cbf` (Huckleberry purple) appears in any asset, stylesheet, or config file.

---

## Background & Multi-Baby Behavior

- [ ] Sleep timer drift after 10 minutes backgrounded: ≤ 2 seconds on iOS physical device.
- [ ] Sleep timer drift after 10 minutes backgrounded: ≤ 2 seconds on Android physical device.
- [ ] Breast feed timer drift after 5 minutes backgrounded: ≤ 2 seconds on both platforms.
- [ ] Log list for Baby A contains only Baby A's logs after creating two profiles and logging under each.
- [ ] Deleting a log under Baby A does not affect Baby B's log list.

---

## Builds

- [ ] `eas build --platform ios --profile production` completes without error and produces a signed `.ipa`.
- [ ] `eas build --platform android --profile production` completes without error and produces a signed `.aab`.
- [ ] The production iOS build installed via TestFlight passes a full manual smoke test (onboarding → sleep → feed → diaper → log list → delete).
- [ ] The production Android build installed via internal track passes the same manual smoke test.
- [ ] Android keystore is backed up securely outside the repository.

---

## Store Submission

- [ ] iOS: app submitted to App Store Review and status is "Waiting for Review" or later.
- [ ] Android: app submitted to Google Play and status is "In Review" or later.
- [ ] Privacy policy URL is live and resolves correctly.
- [ ] App Store pricing is set to $5.00 USD, age rating 4+.
- [ ] Play Store pricing is set to $5.00 USD with regional pricing configured.

---

## Merge Criteria

The branch `phase-8-polish-store-submission` may be merged to `main` when:

1. All checkboxes above are ticked.
2. Both store submissions are in a review state (not draft, not rejected).
3. `tsc --noEmit` passes in CI with zero errors.

If either store rejects the submission, the rejection must be resolved and re-submitted before merge.
