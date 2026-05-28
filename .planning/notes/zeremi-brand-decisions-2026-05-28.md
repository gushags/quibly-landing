---
title: Zeremi brand decisions (rename from Quibly)
date: 2026-05-28
context: Captured during /gsd-explore session before Phase 6.5 rebrand work
---

# Zeremi brand decisions

The app has been renamed **Quibly → Zeremi**. The pre-launch domain becomes
`zeremi.app` (replacing `useQuibly.com`). The friendly Q-face mascot ("Quibs")
is replaced by the gradient Z mark; the two dots above the Z serve as the
character's eyes — no separate expressive mascot artwork is needed.

## Naming rules

- **App name:** `Zeremi` (capitalized) everywhere in copy.
- **Wordmark only:** `zeremi` (all lowercase), rendered in Bree Serif.
- **Coach character:** previously "Quibs", now also named **Zeremi**.
- **Domain:** `zeremi.app` (apex). Replaces `useQuibly.com` at production cutover.

## Typography (mirrors marketing-app exactly)

- `--font-heading` → **Bree Serif** (via `next/font/google`, variable `--font-bree-serif`).
  - Applied to all h1/h2/h3 via the `font-heading` Tailwind utility.
  - Typical pairing: `font-heading font-semibold tracking-tight` (occasionally `font-bold`).
- `--font-body` / `--font-sans` → **Figtree** (unchanged; was already in landing's stack).
- **Subheads use plain Figtree** — no separate font family. Differentiation is
  by size/weight/color (`text-sm text-muted-foreground`, `text-base`, etc.),
  same convention as `marketing-app` (see e.g. `app/(auth)/login/page.tsx`,
  `components/paywall/paywall-card.tsx`).
- **Quicksand is retired entirely.** Remove from `app/layout.tsx` font imports
  and from any `--font-quicksand` references in `app/globals.css`.

## Visual identity

- **Colors are unchanged.** The Quibly teal/amber oklch token palette in
  `app/globals.css` carries over without modification — no token swaps.
- **Z mark gradient** is identical to the existing Quibs avatar gradient
  (`linear-gradient(to bottom right, #0D9488, #14b8a6)`) — see
  `/Users/jeff/repos/marketing-app/public/brand/zeremi/README.md`.
  Confirms: no token migration in `globals.css` for brand colors.
- **Mascot personality:** the two dots above the Z function as eyes. The hero
  no longer needs an expressive SVG with animated dots/wave/blink — the
  current `components/sections/hero-mascot.tsx` collapses to a static
  `<Image>` (or inline SVG) of the Z mark. Any keyframe animation on the
  Q-face mouth/dots should be deleted, not ported.

## Asset source

Brand assets live in the sibling `marketing-app` repo:

- **Source SVGs:** `/Users/jeff/repos/marketing-app/public/brand/zeremi/src/`
  - `zeremi-icon-square.svg` (1024×1024, iOS squircle, rx=232)
  - `zeremi-icon-circle.svg` (1024×1024, full circle)
  - `zeremi-mark.svg` (56×88, transparent Z mark)
- **PNG exports:** `/Users/jeff/repos/marketing-app/public/brand/zeremi/png/`
  - Square chip: 16, 32, 48, 64, 96, 128, 180, 192, 256, 512, 1024
  - Circle chip: 16, 32, 48, 64, 96, 128, 180, 192, 256, 512, 1024
  - Mark (transparent): 32, 64, 128, 256, 512, 1024 — preserves 56:88 aspect

Because `marketing-app` is a separate repo, assets must be **copied** into
`quibly-landing/public/brand/zeremi/` (no symlink). Mapping mirrors the
marketing-app README:

- Favicon 16/32 → `zeremi-icon-square-{16,32}.png`
- Apple touch icon → `zeremi-icon-square-180.png`
- PWA / Android → `zeremi-icon-square-{192,512}.png`
- Hero / FAB avatar → `zeremi-icon-circle-{96,128}.png`
- OG image overlay → `zeremi-mark-{256,512}.png`

## Component rename

- `components/quibs/` → `components/zeremi/`
- `components/quibs/quibs-icon.tsx` → `components/zeremi/zeremi-icon.tsx`
- `components/quibs/quibs-avatar.tsx` → `components/zeremi/zeremi-avatar.tsx`
- `components/sections/hero-mascot.tsx` — keep filename (it's a section, not a
  character name); body becomes a static Z-mark render.
- `components/sections/why-quibly.tsx` → `components/sections/why-zeremi.tsx`

## Out of scope for this note

The actual cutover sequence (Resend sender re-verification, Vercel apex bind,
DNS, CSV export, and CAN-SPAM handling of existing Quibly contacts) is tracked
separately — see `[[migrate-quibly-contacts-to-zeremi-audience]]` (seed) and
the inserted Phase 6.5 in `ROADMAP.md`.
