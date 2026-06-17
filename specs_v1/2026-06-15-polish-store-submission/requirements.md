# Phase 8 — Polish & Store Submission: Requirements

## Goal

Bring all in-scope features to production quality and publish Lullaby to both the Apple App Store and Google Play Store as a paid ($5.00) app.

---

## Scope

### In Scope

**Code Quality Audits**
- Zero TypeScript errors under `strict: true`. No `any` casts anywhere in the codebase.
- All `BabyLog` discriminated union arms handled exhaustively in every switch statement.
- All `async` functions touching SQLite or notifications wrapped in `try/catch` with at minimum `console.error` on failure.
- Zero hardcoded color strings in component files — every color reference goes through `COLORS` from `src/theme/colors.ts`.

**UX Completeness**
- Every screen and modal must have an explicit empty/loading/error state. No component renders `null` as a default fallback.
- All interactive elements are minimum 44×44 logical pixels. Primary action buttons (sleep toggle, feed buttons) are minimum 90px tall.
- No side effects inside render functions. No incomplete `useEffect` dependency arrays.

**Visual Assets**
- App icon (1024×1024 PNG, no transparency, no rounded corners — stores apply masking). Must use the Sage Green / Slate palette. No purple.
- Splash screen. Centered logo mark on `#F8F9FA` (background off-white). Must look correct on all common phone sizes.

**Testing**
- Background/resume timer accuracy: sleep and feed timers remain accurate after the app is backgrounded for 10+ minutes on both iOS and Android.
- Two-baby scoping: all logs are correctly isolated to the active baby. Switching baby profiles updates the log list immediately with no cross-contamination.
- Manual end-to-end walkthrough of the full v1 feature set on a physical device for each platform.

**EAS Build**
- Production `.ipa` signed with a valid Apple Distribution certificate and provisioning profile.
- Production `.aab` signed with a valid Android keystore.
- Both builds use `NODE_ENV=production` and have no debug tooling enabled.

**Store Submission — iOS**
- App Store Connect listing: app name, subtitle, description, keywords, support URL, privacy policy URL.
- At least 3 screenshots per device class (6.9", 6.5", 5.5" iPhone).
- Age rating: 4+.
- Submit for App Store Review.

**Store Submission — Android**
- Google Play Console listing: short description, full description, feature graphic (1024×500), at least 2 screenshots.
- Content rating questionnaire completed.
- Pricing set to $5.00 (USD) with regional pricing.
- Submit for Play review.

### Out of Scope for This Phase

- Data restore / import UI (deferred to v2 per CLAUDE.md)
- History view, charts, pattern analysis
- Growth tracking, doctor appointments, baby photo
- Any new features not present in Phases 0–7

---

## Key Decisions

| Decision | Resolution |
|---|---|
| Platform target | Both iOS (App Store) and Android (Google Play) submitted in this phase |
| App icon style | Sage green mark on white/off-white background. No purple. Exact asset TBD during implementation. |
| Privacy policy | Required by both stores. Must be hosted at a stable URL before submission. |
| Paid pricing | $5.00 USD on both stores. Paid upfront, no IAP. |
| Android keystore | Generated fresh during EAS setup. Must be stored securely — loss means inability to push updates. |
| Physical test devices | At minimum one iPhone and one Android device for manual testing. Simulators alone are insufficient for background timer validation. |

---

## Constraints (from CLAUDE.md and tech-stack.md)

- `StyleSheet.create()` only — no styled-components, no UI libraries.
- All colors via `COLORS` object, no inline hex strings.
- No new dependencies may be added without updating `CLAUDE.md` and `specs/tech-stack.md`.
- System font only — no custom font loading.
- The backup Android OAuth flow (`expo-auth-session`) remains the only exception to the no-accounts rule.
