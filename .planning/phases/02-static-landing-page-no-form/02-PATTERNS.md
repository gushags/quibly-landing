# Phase 2: Static Landing Page (No Form) — Pattern Map

**Mapped:** 2026-04-27
**Files analyzed:** 11 (8 new, 3 modified)
**Analogs found:** 10 / 11 (`.lighthouserc.json` and `.github/workflows/lighthouse.yml` have no codebase analog — CI-only files)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog (this repo) | Closest Analog (marketing-app) | Match Quality |
|---|---|---|---|---|---|
| `app/page.tsx` | page, RSC composition | static render | `app/page.tsx` (Phase 1 smoke test) | `app/(public)/page.tsx` | role-match (marketing-app closer) |
| `app/layout.tsx` | layout, RSC | static render | `app/layout.tsx` (Phase 1) | `app/layout.tsx` | exact (no change needed) |
| `app/globals.css` | config, CSS | static | `app/globals.css` (Phase 1) | `app/globals.css` | exact (additive only) |
| `components/sections/hero.tsx` | section component, RSC | static render | none (new dir) | `app/(public)/page.tsx` §Hero | partial |
| `components/sections/hero-mascot.tsx` | sub-component, RSC | static render | `components/quibs/quibs-avatar.tsx` | `components/quibs/quibs-avatar.tsx` | role-match |
| `components/sections/placeholder-form-section.tsx` | section component, RSC | static render | none | `app/(public)/page.tsx` §Section 7 | partial |
| `components/sections/why-quibly.tsx` | section component, RSC | static render | none | `app/(public)/page.tsx` §Section 3 | partial |
| `components/sections/founder-voice.tsx` | section component, RSC | static render | none | `app/(public)/page.tsx` §prose sections | partial |
| `components/sections/secondary-cta.tsx` | section component, RSC | static render | none | `app/(public)/page.tsx` §Section 7 | role-match |
| `components/sections/footer.tsx` | section component, RSC | static render | none | `components/footer.tsx` | role-match |
| `components/ui/button.tsx` | UI primitive, RSC default | static render | `components/ui/button.tsx` (Phase 1) | `components/ui/button.tsx` | exact (additive only) |
| `.lighthouserc.json` | CI config | n/a | none | none | no analog |
| `.github/workflows/lighthouse.yml` | CI workflow | n/a | none | `/.github/workflows/ci.yml` | structural-match only |

---

## Pattern Assignments

### `app/page.tsx` (page composition, RSC)

**Role:** Thin RSC composition. No business logic, no data fetching, no `'use client'`. Renders the six sections in DOM order.

**Analog (this repo):** `app/page.tsx` (Phase 1 smoke test, lines 1–39) — same RSC default export structure and `@/` import aliases, but is a throwaway stub. Phase 2 replaces the file entirely.

**Analog (marketing-app):** `app/(public)/page.tsx` (lines 1–352) — full public landing page; closest match in terms of multi-section composition pattern.

**Imports pattern** (marketing-app `app/(public)/page.tsx` lines 1–8):
```typescript
import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
```

**Core composition pattern** (marketing-app `app/(public)/page.tsx` lines 58–91, condensed to the structural skeleton):
```tsx
export default function LandingPage() {
  return (
    <>
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          {/* hero content */}
        </div>
      </section>
      {/* additional sections */}
    </>
  )
}
```

**Differences to apply for Phase 2:**
- Replace the marketing-app's fragment wrapper with `<main className="min-h-screen flex flex-col">` wrapping sections 1–5 (Hero through SecondaryCTA), and place `<Footer />` outside `<main>` (per UI-SPEC layout contract).
- Import from `@/components/sections/*` instead of inline JSX.
- Use `max-w-6xl` (not `max-w-7xl`) and `px-6 md:px-8` (not `px-4`) per D-17.
- No `metadata` export here — layout.tsx owns metadata.
- No `'use client'` anywhere.

---

### `app/layout.tsx` (layout, RSC)

**Role:** Root layout. Already correct from Phase 1. Phase 2 makes no changes.

**Analog (this repo):** `app/layout.tsx` (Phase 1, lines 1–41) — exact file to leave untouched.

**No change needed.** Document for planner: confirm `lang="en"` is present (line 34 — confirmed), `min-h-full flex flex-col` on `<body>` (line 39 — confirmed), and that `@/lib/env` import at line 4 validates env at startup.

**Current structure** (lines 1–41):
```typescript
import type { Metadata } from "next";
import { Quicksand, Figtree } from "next/font/google";
import "./globals.css";
import "@/lib/env";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-quicksand",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-figtree",
  display: "swap",
});

// ... metadata export, RootLayout function
```

---

### `app/globals.css` (CSS config, additive only)

**Role:** Global CSS. Phase 2 adds exactly one rule block to the existing `@layer base` at line 121. Nothing else changes.

**Analog (this repo):** `app/globals.css` lines 121–132 (the existing `@layer base` block containing `scroll-behavior: smooth` at line 130).

**Existing target block** (lines 121–132) — the addition goes immediately after line 132:
```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans;
    scroll-behavior: smooth;
  }
}
```

**Addition to make** (insert as a new `@layer base` block after line 132):
```css
@layer base {
  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }
  }
}
```

**Differences to apply:** This is the only change. Do not touch any other line. Do not add tokens (all needed tokens confirmed present, see RESEARCH.md Token Parity Audit).

---

### `components/sections/hero.tsx` (section component, RSC)

**Role:** Hero section. Contains the radial gradient backdrop, flex-col-reverse LCP-guard container, H1, sub-headline, CTA anchor pill, and microcopy. Pure RSC — no `'use client'`.

**Analog (this repo):** `app/page.tsx` lines 28–38 (Phase 1 smoke test) — shows the `@/components/quibs/quibs-icon`, `@/components/ui/button` import pattern and `font-heading`/`font-sans`/`text-primary`/`text-muted-foreground` Tailwind token usage.

**Analog (marketing-app):** `app/(public)/page.tsx` lines 62–91 (Section 1: Hero) — closest structural match. Shows `font-heading`, `text-muted-foreground`, `max-w-7xl mx-auto px-4`, and the `<Button asChild>` + `<Link>` CTA pattern.

**Imports pattern** (from marketing-app `app/(public)/page.tsx` lines 3–4, adapted):
```typescript
import { Button } from '@/components/ui/button'
import { HeroMascot } from '@/components/sections/hero-mascot'
```

**LCP-guard core pattern** — H1 DOM-first, mascot visually-above via `flex-col-reverse` (D-03). Source: RESEARCH.md Pattern 6 and UI-SPEC §Hero structure:
```tsx
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden py-16 md:py-24">
      {/* Decorative gradient — aria-hidden, behind everything via -z-10 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10
                   bg-[radial-gradient(at_30%_20%,oklch(0.6002_0.1038_184.704_/_0.08),transparent_60%),radial-gradient(at_75%_80%,oklch(0.78_0.13_70_/_0.06),transparent_55%)]"
      />
      {/* flex-col-reverse: H1 is DOM-first (LCP guard), HeroMascot renders visually above */}
      <div className="max-w-6xl mx-auto px-6 md:px-8 flex flex-col-reverse items-center text-center gap-6">
        <h1 className="font-heading font-bold leading-tight text-foreground
                       text-3xl sm:text-4xl md:text-5xl lg:text-6xl max-w-3xl">
          You know your business. Quibly knows how to market it.
        </h1>
        <HeroMascot />
      </div>
      <p className="font-sans text-base sm:text-lg text-muted-foreground
                    max-w-prose mx-auto mt-4 px-6 text-center">
        {SUB_HEADLINE}
      </p>
      <div className="flex flex-col items-center mt-6">
        <Button asChild size="hero" variant="default">
          <a href="#waitlist">Join the waitlist</a>
        </Button>
        <p className="text-sm text-muted-foreground mt-3">Launching Summer 2026</p>
      </div>
    </section>
  )
}
```

**Differences to apply vs marketing-app analog:**
- Replace `max-w-7xl px-4` with `max-w-6xl px-6 md:px-8`.
- Use `flex-col-reverse` + H1 DOM-first (marketing-app uses `text-center` without reorder — it has no LCP mascot competing with the headline).
- Use `size="hero"` CVA variant (defined separately) instead of ad-hoc `className="rounded-[28px] px-9 py-3.5"` inline.
- CTA target is `<a href="#waitlist">` (anchor, not `<Link>`) because `#waitlist` is on the same page — `next/link` is for route navigation, not fragment-scroll.
- Add `relative isolate overflow-hidden` on `<section>` to contain the absolute gradient (not present in marketing-app hero).

---

### `components/sections/hero-mascot.tsx` (sub-component, RSC)

**Role:** 88px teal-gradient rounded-square wrapper for `<QuibsIcon>`. Decorative — `aria-hidden="true"` on wrapper. Extracted per CD-03 for potential Phase 5 OG image reuse.

**Analog (this repo):** `components/quibs/quibs-avatar.tsx` (lines 1–41) — the canonical gradient + icon composition pattern.

**Core gradient pattern** (from `components/quibs/quibs-avatar.tsx` lines 27–28):
```typescript
'bg-gradient-to-br from-primary to-[#14b8a6] text-white'
```

**SIZE_CONFIG reference** (from `components/quibs/quibs-avatar.tsx` lines 11–15):
```typescript
const SIZE_CONFIG = {
  message: { container: 'h-7 w-7 rounded-lg', icon: { width: 16, height: 19 } },
  header:  { container: 'h-9 w-9 rounded-lg', icon: { width: 22, height: 26 } },
  fab:     { container: 'h-14 w-14 rounded-full', icon: { width: 28, height: 33 } },
} as const
```

**Core pattern for hero-mascot** (derived from `quibs-avatar.tsx` palette + D-02 88px size):
```tsx
import { QuibsIcon } from '@/components/quibs/quibs-icon'

export function HeroMascot() {
  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-center h-[88px] w-[88px] rounded-3xl
                 bg-gradient-to-br from-primary to-[#14b8a6] text-white"
    >
      <QuibsIcon width={48} height={56} />
    </div>
  )
}
```

**Differences to apply vs `quibs-avatar.tsx`:**
- Fixed size `h-[88px] w-[88px]` (not a size-variant lookup — there is only one hero mascot size).
- `rounded-3xl` (~22px corners) instead of `rounded-lg` or `rounded-full` — design-system §1 "88px rounded-square" (CD-01).
- Icon dimensions: `width={48} height={56}` (design-system §1 "Large display" row).
- No `inverted` prop — hero mascot is always teal-gradient.
- No `cn()` + `className` passthrough needed (not a reusable multi-variant component).
- `aria-hidden="true"` on the container div (mascot is decorative; `QuibsIcon` itself is already `aria-hidden`).

---

### `components/sections/placeholder-form-section.tsx` (section component, RSC)

**Role:** Anchor target `id="waitlist"` for Phase 2 CTA smooth-scroll. Contains heading + sub-copy + a secondary anchor pill. Phase 3 renames this file to `waitlist-form-section.tsx` and replaces the body (CD-07). The outer `<section id="waitlist">` wrapper is the cross-phase seam.

**Analog (this repo):** None — new directory.

**Analog (marketing-app):** `app/(public)/page.tsx` lines 332–349 (Section 7: Final CTA) — same structural role: centered heading + body copy + CTA button.

**Core pattern** (from marketing-app `app/(public)/page.tsx` lines 332–349, adapted):
```tsx
import { Button } from '@/components/ui/button'

export function PlaceholderFormSection() {
  return (
    <section id="waitlist" className="py-16 md:py-24 scroll-mt-16">
      <div className="max-w-prose mx-auto px-6 text-center">
        <h2 className="font-heading font-bold text-3xl md:text-4xl leading-tight
                       text-foreground mb-4">
          Get notified the moment Quibly opens up.
        </h2>
        <p className="font-sans text-base text-muted-foreground mb-6">
          One email. Zero spam. We'll only ping you when there's something real to try.
        </p>
        <Button asChild size="hero" variant="default">
          <a href="#waitlist">Join the waitlist</a>
        </Button>
      </div>
    </section>
  )
}
```

**Differences to apply vs marketing-app analog:**
- Add `id="waitlist"` and `scroll-mt-16` (64px = 4rem per CD-06) on the `<section>` — the anchor seam for Phase 3.
- Use `max-w-prose` inner constraint (not `max-w-7xl`) per D-17.
- CTA is `<a href="#waitlist">` anchor (no client JS), not `<Link href="/login">`.
- Do not add a second outer container with `max-w-6xl` — the `max-w-prose` constraint on the inner `<div>` is sufficient for this centered text-block section.
- This file's outer wrapper and `id` attribute MUST NOT change in Phase 3 — only the inner body is replaced.

---

### `components/sections/why-quibly.tsx` (section component, RSC)

**Role:** 3-column differentiator grid. Lucide icons + Quicksand labels + Figtree descriptions. Single-column on mobile, 3-column at `md:`.

**Analog (this repo):** None — new directory.

**Analog (marketing-app):** `app/(public)/page.tsx` lines 123–200 (Section 3: Differentiators) — same role. Key differences: marketing-app uses `<Card>` wrappers and letter-badge icons; Phase 2 uses raw `<div>` items with lucide icons per D-13/D-14.

**Imports pattern** (lucide icons per D-14):
```typescript
import { Target, Users, LineChart } from 'lucide-react'
```

**Grid container pattern** (from marketing-app `app/(public)/page.tsx` lines 129–130, adapted):
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
```

**Full core pattern** (from RESEARCH.md Pattern 8):
```tsx
const DIFFERENTIATORS = [
  {
    icon: Target,
    label: 'Strategy-first',
    description: '90-day plans before posts. Strategy drives execution; you stop guessing what to publish.',
  },
  {
    icon: Users,
    label: 'AI advisory board',
    description: 'Five AI specialists weigh in on every move — like having a marketing team in your pocket.',
  },
  {
    icon: LineChart,
    label: 'Metrics-driven loop',
    description: 'Real platform metrics flow back into the strategy so the next 90 days beat the last.',
  },
]

export function WhyQuibly() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <h2 className="font-heading font-bold text-3xl md:text-4xl leading-tight
                       text-foreground text-center mb-12">
          Why Quibly
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {DIFFERENTIATORS.map(({ icon: Icon, label, description }) => (
            <div key={label} className="flex flex-col items-center text-center gap-4">
              <Icon
                className="text-primary"
                size={24}
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <p className="font-heading font-semibold text-lg text-foreground">{label}</p>
              <p className="font-sans text-base text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

**Differences to apply vs marketing-app analog:**
- Use plain `<div>` items with lucide icons, not `<Card>` components (no card borders/shadows per Phase 2 flat white surface rule).
- `strokeWidth={1.75}` on all icons (design-system §1 Sidebar Icons convention — marketing-app uses default 2px).
- `max-w-6xl px-6 md:px-8` not `max-w-7xl px-4`.
- Labels in Quicksand 600 (`font-heading font-semibold`) — marketing-app uses `font-heading font-semibold text-base` on `<CardTitle>`.
- Descriptions in Figtree 400 (`font-sans text-base text-muted-foreground`).
- No accent color on labels — `text-foreground` only (D-04 applies to all headings, not just H1).

---

### `components/sections/founder-voice.tsx` (section component, RSC)

**Role:** Centered single-paragraph founder-voice text. No avatar, no quote marks, no italic. `max-w-prose` constraint.

**Analog (this repo):** None — new directory.

**Analog (marketing-app):** No direct analog (marketing-app has no founder-voice section). The closest structural pattern is the section container + centered prose found throughout `app/(public)/page.tsx`. The sub-headline pattern in the hero (lines 69–73) is the closest typography match.

**Core pattern** (derived from marketing-app hero sub-headline pattern + D-15):
```tsx
export function FounderVoice() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <p className="font-sans text-base text-muted-foreground max-w-prose mx-auto
                      text-center leading-relaxed">
          {/* Draft copy — founder edits in PR (D-28) */}
          I built Quibly because I was tired of watching brilliant solopreneurs
          out-craft their competitors and still get buried by anyone with a marketing
          budget. Strategy is the missing layer — and AI finally makes it cheap enough
          for the rest of us. Quibly is the marketing partner I wish I&apos;d had ten
          businesses ago.
        </p>
      </div>
    </section>
  )
}
```

**Differences to apply:**
- No italic, no `<blockquote>`, no quote mark pseudo-elements (D-15).
- `max-w-prose mx-auto` is the inner constraint; the outer container still uses `max-w-6xl px-6 md:px-8` for consistent page padding.
- `font-sans` (Figtree), not `font-heading`.
- `text-muted-foreground` — founder text is body-level, not a heading.

---

### `components/sections/secondary-cta.tsx` (section component, RSC)

**Role:** Bottom-of-page CTA section. H2 heading + `<Button size="hero">` anchoring to `#waitlist`.

**Analog (this repo):** None — new directory.

**Analog (marketing-app):** `app/(public)/page.tsx` lines 332–349 (Section 7: Final CTA) — exact structural match.

**Core pattern** (from marketing-app `app/(public)/page.tsx` lines 332–349):
```tsx
// marketing-app original (lines 332–349):
<section className="bg-white py-24">
  <div className="max-w-7xl mx-auto px-4 text-center">
    <h2 className="font-heading text-3xl md:text-4xl font-bold">
      Ready to stop guessing at marketing?
    </h2>
    <p className="text-muted-foreground text-center mt-4">
      Start your 14-day free trial. No credit card required.
    </p>
    <div className="flex justify-center mt-8">
      <Button
        className="rounded-[28px] px-9 py-3.5 text-base bg-primary hover:bg-primary/90 text-white font-heading font-semibold"
        asChild
      >
        <Link href="/login">Start your free trial</Link>
      </Button>
    </div>
  </div>
</section>
```

**Adapted for Phase 2:**
```tsx
import { Button } from '@/components/ui/button'

export function SecondaryCTA() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6 md:px-8 text-center">
        <h2 className="font-heading font-bold text-3xl md:text-4xl leading-tight
                       text-foreground mb-4">
          Ready to stop guessing at marketing?
        </h2>
        <div className="flex justify-center mt-8">
          <Button asChild size="hero" variant="default">
            <a href="#waitlist">Don&apos;t miss launch — join the waitlist</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
```

**Differences to apply vs marketing-app:**
- Use `size="hero"` CVA variant instead of ad-hoc `className="rounded-[28px] px-9 py-3.5 ..."` inline.
- Target `<a href="#waitlist">` (same-page anchor), not `<Link href="/login">`.
- CTA copy: "Don't miss launch — join the waitlist" (D-12).
- Remove the sub-paragraph ("No credit card required") — not applicable pre-launch.
- `max-w-6xl px-6 md:px-8` not `max-w-7xl px-4`.

---

### `components/sections/footer.tsx` (section component, RSC)

**Role:** Minimal centered single-row footer. Quicksand Bold teal wordmark + copyright + Privacy + Terms. No `'use client'` (unlike marketing-app's `Footer` which requires `'use client'` for Tooltip). Reused unchanged on `/privacy` and `/terms` in Phase 5.

**Analog (this repo):** None — new directory.

**Analog (marketing-app):** `components/footer.tsx` (lines 1–159) — same role but 4-column full site footer. The legal link pattern (lines 71–88) and copyright row (lines 151–154) are the closest excerpts.

**Legal links pattern** (from marketing-app `components/footer.tsx` lines 72–88):
```tsx
<Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary">
  Privacy Policy
</Link>
<Link href="/terms" className="text-sm text-muted-foreground hover:text-primary">
  Terms of Service
</Link>
```

**Core pattern for Phase 2** (from RESEARCH.md Pattern 9 + UI-SPEC footer structure):
```tsx
export function Footer() {
  return (
    <footer className="py-12">
      <div className="max-w-6xl mx-auto px-6 md:px-8 flex items-center justify-center
                      flex-wrap gap-3 text-sm text-muted-foreground">
        <span className="font-heading font-bold text-base text-primary">Quibly</span>
        <span aria-hidden="true">·</span>
        <span>© 2026 Quibly</span>
        <span aria-hidden="true">·</span>
        <a href="/privacy" className="hover:text-foreground transition-colors py-2 px-1">
          Privacy
        </a>
        <span aria-hidden="true">·</span>
        <a href="/terms" className="hover:text-foreground transition-colors py-2 px-1">
          Terms
        </a>
      </div>
    </footer>
  )
}
```

**Differences to apply vs marketing-app:**
- NO `'use client'` — Phase 2 footer has no `<Tooltip>` or click handlers.
- Use plain `<a>` hrefs (not `next/link` `<Link>`) — `/privacy` and `/terms` are same-site but don't need prefetch in Phase 2 (they 404 until Phase 5). Either is acceptable; plain `<a>` is simpler and avoids hydration cost.
- Minimal single row, not 4-column grid (D-18, D-21).
- Middot separators wrapped in `<span aria-hidden="true">·</span>` (accessibility — screen reader skips decorative separators).
- Footer wordmark: `font-heading font-bold text-base text-primary` (not an `<img>` or SVG — pure text per D-18).
- `py-2 px-1` on `<a>` tags for ≥48px effective tap target (MOB-02).
- No social icons, no contact mailto (D-20).

---

### `components/ui/button.tsx` (UI primitive, additive modification)

**Role:** shadcn Button. Phase 2 adds exactly one row to the `size` object in `buttonVariants`. Everything else is unchanged.

**Analog (this repo):** `components/ui/button.tsx` (Phase 1, lines 1–67) — the exact file to modify.

**Current CVA size object** (lines 23–35):
```typescript
size: {
  default:
    "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
  xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
  sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
  lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
  icon: "size-8",
  "icon-xs":
    "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
  "icon-sm":
    "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
  "icon-lg": "size-9",
},
```

**The one change** (insert after `"icon-lg": "size-9"` at line 34, before the closing `},`):
```typescript
hero: "h-auto rounded-[28px] px-9 py-3.5 text-base",
```

**Breakdown of the hero variant:**
- `h-auto` — height driven by content + padding, not a fixed Tailwind h-N step.
- `rounded-[28px]` — design-system §1 `.btn-hero` literal. NOT `rounded-full` (9999px), NOT `rounded-3xl` (~22px). Literal `28px`.
- `px-9` — 36px horizontal padding (design-system §1: 36px horizontal).
- `py-3.5` — 14px vertical padding (design-system §1: 14px vertical). Total ~52px height ≥ 48px tap target.
- `text-base` — 16px body-size CTA copy.

**tailwind-merge conflict note:** The base `buttonVariants` cva string includes `rounded-full` (line 8). Adding `rounded-[28px]` in the `size="hero"` variant: `tailwind-merge` resolves border-radius conflicts by keeping the last same-group class. CVA emits the base string first, then the variant string — so `rounded-[28px]` wins. Verify in DevTools after implementation that `border-radius` is `28px` not `9999px`.

**Usage pattern (for hero CTA and secondary CTA):**
```tsx
<Button asChild size="hero" variant="default">
  <a href="#waitlist">Join the waitlist</a>
</Button>
```

`asChild` uses `Slot.Root` (already imported at line 3: `import { Slot } from "radix-ui"`) to forward button styles onto the `<a>` child — results in a styled anchor, not a `<button>` wrapping an `<a>` (which would be invalid HTML).

---

### `.lighthouserc.json` (CI config, new file)

**Role:** Lighthouse CI configuration consumed by `@lhci/cli` and `treosh/lighthouse-ci-action`.

**Analog:** None in either codebase.

**Canonical source:** [GoogleChrome/lighthouse-ci configuration docs](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md). Use the configuration verbatim from RESEARCH.md Validation Architecture:

```json
{
  "ci": {
    "collect": {
      "settings": {
        "preset": "mobile"
      },
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.90 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "render-blocking-resources": ["warn", { "maxLength": 0 }],
        "categories:accessibility": ["warn", { "minScore": 0.90 }],
        "categories:best-practices": ["warn", { "minScore": 0.90 }],
        "categories:seo": ["warn", { "minScore": 0.80 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

**Key constraint:** Only `"error"` level blocks PRs. `"warn"` records but does not block. Only `categories:performance >= 0.90` and `cumulative-layout-shift < 0.1` are hard errors (D-29). All other assertions are advisory.

---

### `.github/workflows/lighthouse.yml` (CI workflow, new file)

**Role:** GitHub Actions workflow — waits for the Vercel preview deploy, then runs Lighthouse CI against the preview URL.

**Structural analog (marketing-app):** `/.github/workflows/ci.yml` (lines 1–50) — shows the `on: push/pull_request` trigger pattern, `actions/checkout@v4`, `actions/setup-node@v4 with cache: 'npm'` step structure, and the env-secrets pattern. Does NOT contain Lighthouse CI steps — that portion has no codebase analog.

**Structural pattern** (from marketing-app `.github/workflows/ci.yml` lines 1–26):
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
```

**Lighthouse-specific pattern** (from RESEARCH.md Validation Architecture, sourced from `treosh/lighthouse-ci-action@v12` and `patrickedqvist/wait-for-vercel-preview`):
```yaml
name: Lighthouse CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Wait for Vercel Preview
        id: vercel-preview
        uses: patrickedqvist/wait-for-vercel-preview@v1.3.1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          max_timeout: 300
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}

      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v12
        with:
          urls: ${{ steps.vercel-preview.outputs.url }}
          configPath: .lighthouserc.json
          uploadArtifacts: true
          temporaryPublicStorage: true
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

**Required GitHub Secrets (manual setup step — one-time per repo):**
- `VERCEL_TOKEN` — Vercel personal access token (from vercel.com/account/tokens).
- `LHCI_GITHUB_APP_TOKEN` — Optional; enables PR score annotations (from https://github.com/apps/lighthouse-ci).

**Note from RESEARCH.md Open Questions #1:** Whether `VERCEL_TOKEN` is already stored as a GitHub secret is unknown at pattern-map time. The planner must add a task to verify/add this secret before the CI gate can run.

---

## Shared Patterns

### RSC Default (no `'use client'`)

**Source:** `app/page.tsx` (Phase 1, line 28), `app/layout.tsx` (Phase 1) — both are RSC by default.

**Apply to:** All section files in `components/sections/`, `app/page.tsx`.

```typescript
// No 'use client' directive at the top of the file.
// No useState, useEffect, useRef, or event handlers.
// No onClick, onChange, onSubmit.
// CTA uses <a href="#waitlist"> (browser-native), not a click handler.
```

### `@/` Import Alias

**Source:** `app/page.tsx` (Phase 1, lines 1–2).

**Apply to:** All new files.

```typescript
import { Button } from '@/components/ui/button'
import { QuibsIcon } from '@/components/quibs/quibs-icon'
import { cn } from '@/lib/utils'
```

### Tailwind Token Usage (not raw CSS values)

**Source:** `app/page.tsx` (Phase 1, lines 31–36), `components/quibs/quibs-avatar.tsx` (lines 27–28).

**Apply to:** All new files. Never use raw hex/oklch values in className — always use the Tailwind utility that resolves through the `@theme inline` token chain.

```tsx
// Correct:
className="bg-primary text-primary-foreground font-heading text-muted-foreground"

// Incorrect (bypasses token chain):
className="bg-[#0D9488] text-white"
```

**Exception:** The gradient second stop `to-[#14b8a6]` is the one legitimate arbitrary value — it references "Primary light" which is not a named CSS variable in the token block. It is the same literal used in `components/quibs/quibs-avatar.tsx` line 28 and is approved per RESEARCH.md Pattern 5.

### Section Container Pattern

**Source:** `app/(public)/page.tsx` (marketing-app, e.g. lines 63–64) — adapted to Phase 2's narrower max-width.

**Apply to:** All `components/sections/*.tsx` files (hero, why-quibly, founder-voice, secondary-cta, footer).

```tsx
<section className="py-16 md:py-24">
  <div className="max-w-6xl mx-auto px-6 md:px-8">
    {/* section content */}
  </div>
</section>
```

Exception: Hero uses `relative isolate overflow-hidden` on `<section>` (for gradient containment). Footer uses `py-12` (not `py-16 md:py-24`).

### `<Button asChild size="hero">` CTA Pattern

**Source:** `components/ui/button.tsx` (Phase 1, lines 48–54) + marketing-app `app/(public)/page.tsx` (lines 75–80).

**Apply to:** `components/sections/hero.tsx`, `components/sections/placeholder-form-section.tsx`, `components/sections/secondary-cta.tsx`.

```tsx
<Button asChild size="hero" variant="default">
  <a href="#waitlist">Join the waitlist</a>
</Button>
```

`asChild` + `Slot.Root` (already imported in button.tsx line 3) renders the `<a>` as the DOM element with all Button styles applied — no invalid `<button><a>` nesting.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `.lighthouserc.json` | CI config | n/a | No Lighthouse CI exists in either codebase. Use RESEARCH.md Validation Architecture configuration verbatim. |
| `.github/workflows/lighthouse.yml` | CI workflow | n/a | No Lighthouse CI workflow exists. Use RESEARCH.md Validation Architecture YAML verbatim. `treosh/lighthouse-ci-action@v12` and `patrickedqvist/wait-for-vercel-preview` are the canonical external sources. |
| `components/sections/founder-voice.tsx` | section, RSC | static | No founder-voice or testimonial section exists in marketing-app. Pattern is derived from the sub-headline prose pattern in the marketing-app hero (centered `max-w-prose` `text-muted-foreground` paragraph). |

---

## Metadata

**Analog search scope:** `/Users/jeff/repos/quibly-landing/` (all files) and `/Users/jeff/repos/marketing-app/` (public-facing components and pages).

**Files scanned:** 15 source files read across both repos.

**Key patterns identified:**
1. All section components are pure RSC — no `'use client'` directive. The entire Phase 2 page tree produces zero client JS.
2. The `from-primary to-[#14b8a6]` gradient string is the single approved pattern for teal-gradient containers — sourced from `components/quibs/quibs-avatar.tsx` line 28 and used verbatim in `HeroMascot`.
3. The `<Button asChild size="hero">` + `<a href="#waitlist">` pattern is the only interactive CTA pattern — no onClick, no client state.
4. `max-w-6xl mx-auto px-6 md:px-8` is the universal section container for this repo (differs from marketing-app's `max-w-7xl px-4`).
5. The LCP guard (`flex-col-reverse` with H1 DOM-first, mascot DOM-second) has no direct analog in either codebase — it is Phase 2's primary correctness invariant and must be verified in the Lighthouse run.

**Pattern extraction date:** 2026-04-27
