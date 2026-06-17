# Lullaby — UI/UX Improvement Mission

> This document defines the north star for Lullaby's v1 UI/UX upgrade pass.
> It supplements `CLAUDE.md` and must not contradict it.
> In any conflict, `CLAUDE.md` wins.

---

## Why This Pass Exists

After analyzing 38 screenshots of Huckleberry — the market leader in baby tracking — a clear picture emerged: Huckleberry has strong interaction patterns but ships with significant friction (premium upsells, mandatory modals, dark-only UI, account requirements, cluttered cards). Lullaby can do everything Huckleberry does for daily tracking and do it better on every dimension that matters to a sleep-deprived parent.

---

## The Three-Axis Competitive Edge

Lullaby must be measurably better than Huckleberry on all three of these axes simultaneously. No tradeoffs between them.

---

### Axis 1 — Speed & Frictionlessness

**What this means:**
Every core log action (sleep toggle, diaper, bottle, feed) must be reachable in **one tap from the dashboard**. Modals exist only when genuinely needed (bottle amount, nursing session save). They must never appear for simple categorical choices.

**Where Huckleberry falls short:**
- Diaper requires opening a full modal and tapping a status.
- All feeds require navigating to a "Add feeding" modal first.
- The dashboard shows status but doesn't act — you must hunt for buttons.

**Lullaby's rule:**
- Sleep: one tap to start, one tap to stop. Nothing else.
- Diaper: one tap opens a compact sheet, one tap on the status logs and closes. Done in 2 taps total.
- Breast feed: LEFT / RIGHT buttons are always visible on the card, no modal to open.
- Bottle: one tap opens a focused amount picker. Slider replaces keyboard. Save in 2 taps.
- Solids: one tap, done.

**The test:** A parent holding a baby in their non-dominant arm must be able to complete any common log in under 3 seconds without reading anything.

---

### Axis 2 — Privacy as a Feature, Not a Footnote

**What this means:**
Lullaby's "no accounts, no cloud, no subscriptions" stance is a premium selling point — not a limitation. Every design decision should reinforce the message: *your data lives on your phone, forever, quietly.*

**Where Huckleberry falls short:**
- Premium upsell banners appear on every screen.
- Account sign-in is required before you can do anything.
- In-app inbox, AI logging, and team collaboration push a server-dependency narrative.

**Lullaby's rule:**
- Zero upsell banners anywhere.
- Zero account prompts anywhere.
- The backup happens silently. Users are never interrupted or asked for cloud permissions after the one-time Android Drive grant.
- Settings shows "Your data is stored locally on this device" as a static informational row — visible, calm, non-defensive.
- The onboarding screen explicitly states the privacy stance as a feature in one sentence.

---

### Axis 3 — Calm, Adaptive Aesthetic

**What this means:**
Lullaby's visual design should feel like it belongs in a well-designed nursery — warm, deliberate, never clinical. Huckleberry is all neon cyan on near-black. Lullaby is sage green and warm slate, available in both light and dark.

**Theme strategy:**
- Ship with **both light and dark themes** from day one, automatically following the device's system setting (`Appearance.getColorScheme()`).
- No manual toggle needed in Phase 1 — the OS decides. A manual override is a Phase 5 settings option.
- **Light palette** = current `colors.ts` (sage on off-white) — the "daytime nursery" feel.
- **Dark palette** = deep slate backgrounds with the same sage/amber/indigo accents, dimmed — the "3am feed" feel. Designed for minimum eye strain.

**Visual hierarchy rules (better than Huckleberry):**
- Cards use **ghost/watermark category icons** (large, same hue, 12% opacity) so the category is scannable without reading text.
- Each card shows **time-since-last-log** ("2h 14m ago") in muted text below the category name — always visible, never requires a tap.
- Last-logged detail shown inline on the card (last diaper status, last bottle amount) — no tapping into history to remember what you just did.
- The active/running state (sleep timer, breast feed side) uses `COLORS.active` (#10B981 emerald) as a glowing accent — immediately scannable from across the room.
- Typography scale: category labels are larger and bolder than in v0. Stats (time-since, duration) are smaller and muted. Clear visual hierarchy without noise.

---

## What "Better Than Huckleberry" Looks Like in Practice

| Feature | Huckleberry | Lullaby target |
|---|---|---|
| Log a diaper | Open app → tap Diaper card → modal opens → tap status → Save | Tap Diaper card → compact sheet with icon buttons → tap status → auto-close (2 taps) |
| See last feed | Must remember or open history | Shown inline on the Feed card: "2h 14m ago • 120ml" |
| Start sleep | Tap Sleep card | Same — already on par |
| Log bottle | Tap Bottle card → modal → keyboard for amount → Save | Tap Bottle card → modal with slider (no keyboard) → Save (faster input) |
| Know baby's age | Navigate to Child Profile | Shown in header: "Oliver • 4 months" |
| Dark mode | Always dark | Follows system (light by day, dark by night) |
| Upsells seen per session | 3–5 banners | Zero |

---

## Non-Negotiables (unchanged from CLAUDE.md)

- No Huckleberry purple. No purple at all.
- No cloud accounts or login flows.
- Single-screen dashboard. No navigation libraries.
- React Context only. No state management libraries.
- Unix timestamps everywhere in the database.
- Strict TypeScript throughout.
