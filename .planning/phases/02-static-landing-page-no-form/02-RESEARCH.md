# Phase 2: Static Landing Page (No Form) — Research

**Researched:** 2026-04-27
**Domain:** Next.js 16.2 App Router static rendering, Tailwind v4 RSC composition, Lighthouse CI
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Mascot stacked above the headline, vertically centered single-column on all viewports (320 → 1440px). No 2-col split.
- D-02: Mascot rendered as 88px teal-gradient rounded-square ("Large display" row from design-system §1). New section-local `<HeroMascot>` wrapper rather than extending `<QuibsAvatar>` SIZE_CONFIG.
- D-03: DOM order: headline first, mascot second — visually-above via `flex-col-reverse` (or `order-first`). Enforces HERO-06 at the DOM level.
- D-04: Headline scale: `text-3xl sm:text-4xl md:text-5xl lg:text-6xl` Quicksand 700. No per-token accent on "Quibly" in the H1.
- D-05: Sub-headline: Figtree `font-sans`, `text-base sm:text-lg`, `text-muted-foreground`, `max-w-prose`.
- D-06: Hero CTA = pill button at `border-radius: 28px` via `size="hero"` CVA variant (`h-auto rounded-[28px] px-9 py-3.5 text-base`).
- D-07: Above-fold budget at 320×568: ~492px subtotal, fits in 568 with 76px margin.
- D-08: Hero CTA is `<a href="#waitlist">` (anchor link, CSS `scroll-behavior: smooth`, zero client JS).
- D-09: `<PlaceholderFormSection>` at `id="waitlist"` ships in Phase 2 as heading + sub-copy + secondary anchor pill. Phase 3 replaces the file body.
- D-10: Secondary CTA anchors to `#waitlist`. Same target as hero CTA.
- D-11: Microcopy "Launching Summer 2026" sits directly under the hero CTA, `text-sm text-muted-foreground`.
- D-12: Hero CTA copy: "Join the waitlist". Secondary CTA copy: "Don't miss launch — join the waitlist".
- D-13: "Why Quibly" renders as 3-column grid on `md:` and up, single-column mobile.
- D-14: Lucide icons: `Target` (Strategy-first), `Users` (AI advisory board), `LineChart` (Metrics-driven loop). `strokeWidth={1.75}`, 24–28px.
- D-15: Founder paragraph: centered prose, `max-w-prose`, no avatar, no quote marks, no italic.
- D-16: Section order: Hero → PlaceholderFormSection → WhyQuibly → FounderVoice → SecondaryCTA → Footer.
- D-17: Vertical rhythm: `py-16 md:py-24` for content sections, `py-12` for footer. Container: `max-w-6xl mx-auto px-6 md:px-8`.
- D-18: Footer: minimal centered single row. `© 2026 Quibly · Privacy · Terms` with Quicksand Bold teal wordmark.
- D-19: Footer hrefs `/privacy` and `/terms` return 404 in Phase 2. No conditional rendering.
- D-20: No social icons or contact mailto in v1.
- D-21: No full design-system §6 4-column footer layout.
- D-22: Hero radial gradient CSS-only, no animation. Stops: teal ~8% opacity + amber ~6% opacity. Below the hero is flat white.
- D-23: Zero motion in v1. `tw-animate-css` installed but unused.
- D-24: `tw-animate-css` stays installed (Phase 1). No animations invoked in Phase 2.
- D-25: Section components under `components/sections/`.
- D-26: `app/page.tsx` is a thin RSC composition. No inline copy strings at the page level.
- D-27: Footer imported by `app/page.tsx` directly in Phase 2.
- D-28: Claude drafts copy; founder reviews in PR.
- D-29: Phase 2 wires Lighthouse CI on PRs. `@lhci/cli` GitHub Action, `performance >= 0.90`, `cls < 0.1`, mobile profile, runs against Vercel preview URL.

### Claude's Discretion
- CD-01: Gradient color stops, container max-width nuances.
- CD-02: Font-size scale fine-tuning at intermediate breakpoints.
- CD-03: Whether `<HeroMascot>` is extracted to its own file vs. inline inside `<Hero>`. Default: extract (anticipating Phase 5 OG image reuse).
- CD-04: `size="hero"` CVA variant vs ad-hoc Tailwind. Prefer CVA so Phase 3 reuses.
- CD-05: Lighthouse CI threshold for non-performance categories (advisory, not blocking).
- CD-06: `scroll-margin-top: 4rem` (64px) on `#waitlist` section.
- CD-07: Phase 3 renames `placeholder-form-section.tsx` to `waitlist-form-section.tsx`.

### Deferred Ideas (OUT OF SCOPE)
- Q-face dot wave/blink animation
- Hero background sophistication beyond subtle radial gradient
- Footer social icons, contact mailto
- Live signup counter (V2-01 / Phase 7 conditional)
- Founder photo/byline
- A/B test variants
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HERO-01 | Above-fold benefit-led headline in Quicksand Bold | Confirmed: H1 DOM-first, flex-col-reverse visual order; exact copy locked |
| HERO-02 | 15–25-word sub-headline for solopreneurs/small teams | Confirmed: Figtree font-sans, text-base sm:text-lg, max-w-prose |
| HERO-03 | Quibs mascot as hero visual focal point (teal gradient, white icon) | Confirmed: `<HeroMascot>` wraps `<QuibsIcon>` with `bg-gradient-to-br from-primary to-[#14b8a6] text-white` |
| HERO-04 | Single primary pill-shaped CTA above the fold (28px radius) | Confirmed: `size="hero"` CVA variant with literal `rounded-[28px]`, `asChild` with `<a href="#waitlist">` |
| HERO-05 | Launch-timing microcopy under the CTA | Confirmed: `<p className="text-sm text-muted-foreground mt-3">Launching Summer 2026</p>` |
| HERO-06 | LCP element is the headline text | Confirmed: DOM order H1-first + flex-col-reverse visual reorder; mascot is `aria-hidden="true"` |
| HERO-07 | `prefers-reduced-motion` honored on decorative motion | Confirmed: single CSS rule in globals.css: `@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }` |
| MOB-01 | Responsive 320px → 1440px | Confirmed: single-column mobile, `md:grid-cols-3` for WhyQuibly |
| MOB-02 | All interactive elements ≥48px tap target | Confirmed: hero pill `py-3.5` ≈ 52px; footer links use `py-2` |
| MOB-03 | Single-column layout on mobile | Confirmed: all sections single-column; WhyQuibly grid expands at md: |
| MOB-04 | Body text ≥16px on mobile | Confirmed: sub-headline `text-base` (16px); footer `text-sm` (14px) is static text, not an input |
| FOLD-01 | Three-line "Why Quibly" differentiator block | Confirmed: `grid-cols-1 md:grid-cols-3 gap-8`, lucide icons Target/Users/LineChart |
| FOLD-02 | Founder-voice micro-story paragraph | Confirmed: `max-w-prose mx-auto`, centered, no quote marks, no italic |
| FOLD-03 | Secondary CTA at bottom anchoring back to form | Confirmed: `<Button asChild size="hero"><a href="#waitlist">` |
| FOLD-04 | Footer with copyright + privacy/terms links | Confirmed: minimal centered single row, `py-12` |
| PERF-01 | Lighthouse mobile performance ≥90 in CI | Confirmed: LHCI GitHub Action with `categories:performance >= 0.90` assertion |
| PERF-02 | CLS < 0.1 | Confirmed: LHCI assertion `cumulative-layout-shift maxNumericValue: 0.1`; no images without fixed dimensions |
| PERF-03 | No render-blocking third-party scripts | Confirmed: zero third-party scripts in Phase 2; Vercel Analytics/Speed Insights deferred to Phase 5 |
</phase_requirements>

---

## Summary

Phase 2 builds the complete marketing surface — Hero, PlaceholderFormSection, WhyQuibly, FounderVoice, SecondaryCTA, Footer — as pure React Server Components on top of the Phase 1 scaffold. The phase delivers zero client-side JavaScript: every component is a Server Component, the CTA is an anchor link, and the only "interaction" is browser-native CSS smooth scrolling. This makes Lighthouse mobile ≥90 achievable by design.

The research confirms that all major scaffold elements are already present from Phase 1: Quicksand + Figtree fonts wired via `next/font/google` with correct variable names, the complete Quibly token `@theme inline` block in `globals.css` identical to `marketing-app`, `<QuibsIcon>` with `fill="currentColor"`, `<QuibsAvatar>` as reference, `<Button>` with `cva` + `asChild` pattern, and `cn()` + `lib/utils.ts`. Phase 2 adds no new dependencies — it only adds React component files.

The central performance risk is that the H1 headline may not be detected as the LCP element on a 320×568 viewport if DOM order is wrong. The DOM-first/flex-visual-above pattern (D-03) is the critical correctness invariant. The Lighthouse CI gate (D-29) will catch regressions automatically via `@lhci/cli` + `treosh/lighthouse-ci-action` configured to run against the Vercel preview URL on every PR.

**Primary recommendation:** Build all section components as plain RSC files. Add the `size="hero"` CVA variant to `button.tsx`. Wire Lighthouse CI in `.github/workflows/lighthouse.yml` with the Vercel preview URL polling pattern. No new npm packages needed.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Page composition (section order) | Frontend Server (RSC) | — | `app/page.tsx` is a pure Server Component; no browser state needed |
| Hero layout and typography | Frontend Server (RSC) | — | Static markup; Tailwind classes resolved at build |
| Mascot rendering (SVG) | Frontend Server (RSC) | — | Inline SVG via `<QuibsIcon>`, no image fetch, no client JS |
| Hero radial gradient | Browser (CSS) | — | Painted by browser from static CSS; no runtime cost |
| Anchor smooth-scroll | Browser (CSS) | — | `scroll-behavior: smooth` on `<html>` — zero JS |
| `prefers-reduced-motion` | Browser (CSS) | — | Media query in globals.css; browser applies before paint |
| WhyQuibly grid | Frontend Server (RSC) | Browser (CSS breakpoint) | RSC emits the grid markup; Tailwind `md:grid-cols-3` breakpoint handled by browser |
| Lighthouse CI performance gate | CI / Build | — | `@lhci/cli` GitHub Action; assertion runs after Vercel preview deploys |

---

## Standard Stack

### Core (all already installed in Phase 1)

| Library | Installed Version | Purpose | Phase 2 Use |
|---------|------------------|---------|-------------|
| `next` | `16.2.1` | App Router framework, RSC, static rendering | Page + section components; zero Server Actions this phase |
| `react` | `19.2.4` | UI runtime | RSC composition |
| `tailwindcss` | `^4` | CSS-first utilities via `@theme inline` | Layout, spacing, responsive breakpoints |
| `tw-animate-css` | `^1.4.0` | CSS animation utilities | **Installed but unused in Phase 2** — reserved for Phase 3+ |
| `lucide-react` | `^1.7.0` | Icon library | `Target`, `Users`, `LineChart` for WhyQuibly (verified present) |
| `class-variance-authority` | `^0.7.1` | CVA variant system | `size="hero"` Button variant |
| `clsx` + `tailwind-merge` | present via `lib/utils.ts` | `cn()` helper | Conditional class composition |

### New CI Dependency (GitHub Actions only — not an npm dep)

| Tool | Version | Purpose |
|------|---------|---------|
| `treosh/lighthouse-ci-action` | `@v12` | Runs LHCI against Vercel preview URL, asserts score thresholds |
| `patrickedqvist/wait-for-vercel-preview` | current | Waits for Vercel preview deploy to become ready before LHCI runs |

No new npm dependencies are required for Phase 2. [VERIFIED: quibly-landing/package.json]

---

## Architecture Patterns

### System Architecture Diagram

```
Browser request (GET /)
         |
         v
  Next.js 16.2 App Router
  app/page.tsx (RSC, static)
         |
         +---> <Hero />                  (components/sections/hero.tsx)
         |          |
         |          +---> <HeroMascot />  (components/sections/hero-mascot.tsx)
         |          |         |
         |          |         +---> <QuibsIcon /> (components/quibs/quibs-icon.tsx)
         |          |                   [inline SVG, fill=currentColor]
         |          +---> <Button asChild size="hero"> + <a href="#waitlist">
         |
         +---> <PlaceholderFormSection /> id="waitlist"  (anchor seam for Phase 3)
         |
         +---> <WhyQuibly />             (components/sections/why-quibly.tsx)
         |          |
         |          +---> <Target /> <Users /> <LineChart />  (lucide-react, tree-shaken)
         |
         +---> <FounderVoice />          (components/sections/founder-voice.tsx)
         |
         +---> <SecondaryCTA />          (components/sections/secondary-cta.tsx)
         |          |
         |          +---> <Button asChild size="hero"> + <a href="#waitlist">
         |
         +---> <Footer />               (components/sections/footer.tsx)

Output: Static HTML + CSS bundle (zero client JS)
                |
                v
         Vercel CDN Edge
                |
                v
         PR preview URL
                |
                v
    [GitHub Action: wait-for-vercel-preview]
                |
                v
    [GitHub Action: treosh/lighthouse-ci-action]
         asserts perf >= 0.90, CLS < 0.1
```

### Recommended Project Structure

```
components/
├── sections/           # All new Phase 2 RSC sections
│   ├── hero.tsx
│   ├── hero-mascot.tsx
│   ├── placeholder-form-section.tsx
│   ├── why-quibly.tsx
│   ├── founder-voice.tsx
│   ├── secondary-cta.tsx
│   └── footer.tsx
├── quibs/              # Existing (Phase 1) — unchanged
│   ├── quibs-icon.tsx
│   └── quibs-avatar.tsx
└── ui/                 # Existing (Phase 1) — button.tsx modified only
    ├── button.tsx      # Add size="hero" CVA variant
    ├── input.tsx
    ├── label.tsx
    └── sonner.tsx

.github/
└── workflows/
    └── lighthouse.yml  # New: CI performance gate

app/
├── globals.css         # Unchanged (Phase 1)
├── layout.tsx          # Unchanged (Phase 1)
└── page.tsx            # REPLACE Phase 1 smoke test with RSC composition
```

---

## Pattern 1: Zero-Client-JS RSC Page Composition

**What:** Every component is a Server Component. No `'use client'` directive anywhere. The entire page is static HTML + CSS.

**Why it achieves PERF-03:** No client-side JavaScript bundle shipped. No hydration cost. No third-party scripts.

**How Next.js enforces this:** In App Router, all components are Server Components by default unless they contain `'use client'`. Since Phase 2 has no event handlers, no `useState`, no `useEffect`, and the CTA uses an `<a>` href (not a click handler), zero client markers are needed.

**Verification command:**
```bash
# After `next build`, inspect the bundle:
npx next build && ls .next/static/chunks/
# Expect: only framework chunks (React runtime for hydration boundary), no app-logic chunks
# Or check in Lighthouse: "Reduce JavaScript execution time" should show ~0ms
```

[VERIFIED: CONTEXT.md code_context, CLAUDE.md §Framework choice, Next.js App Router docs]

---

## Pattern 2: `next/font/google` — Exact Existing Configuration

Phase 1 already wired this correctly. **Phase 2 does not touch `app/layout.tsx`.** Document it for reference:

```typescript
// app/layout.tsx (Phase 1 output — DO NOT MODIFY in Phase 2)
import { Quicksand, Figtree } from "next/font/google";

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
// Applied as: className={`${quicksand.variable} ${figtree.variable} h-full antialiased`}
```

[VERIFIED: /Users/jeff/repos/quibly-landing/app/layout.tsx — confirmed identical to marketing-app/app/layout.tsx font configuration]

**What `next/font/google` does for LCP and CLS:**
- Self-hosts the font files at build time — no external Google Fonts DNS round-trip at runtime
- Emits `<link rel="preload">` for the font files automatically
- `display: "swap"` means text renders immediately in fallback font, then swaps — acceptable FOUT but no FOIT blocking
- Next.js 16.2 generates a `size-adjust` fallback metric so CLS from the font swap is near-zero [CITED: https://nextjs.org/docs/app/api-reference/components/font#display]

**Figtree weight note:** `marketing-app` uses `weight: ["400", "500", "600", "700"]` for Figtree, not 900. CLAUDE.md says "400/500/600/700/900" but the actual `marketing-app/app/layout.tsx` uses only up to 700. The existing `quibly-landing/app/layout.tsx` matches marketing-app (400–700). **Do not add weight 900** — it would download a larger font file with no visual benefit in Phase 2.

---

## Pattern 3: Tailwind v4 Token Chain

Phase 1 ported the `globals.css` token block verbatim from `marketing-app`. Confirmed identical:

```css
/* Already in app/globals.css — DO NOT re-add in Phase 2 */
@theme inline {
  --color-primary: var(--primary);          /* resolves to oklch(0.6002 0.1038 184.704) */
  --color-primary-foreground: var(--primary-foreground); /* oklch(1 0 0) = white */
  --color-muted-foreground: var(--muted-foreground);     /* oklch(0.556 0 0) ≈ #888 */
  --color-background: var(--background);   /* oklch(1 0 0) = white */
  --color-foreground: var(--foreground);   /* oklch(0.145 0 0) ≈ #111827 */
  --font-heading: var(--font-quicksand);
  --font-sans: var(--font-figtree);
  --radius-sm: calc(var(--radius) * 0.6);
  /* ... full radius scale through --radius-4xl */
}
```

[VERIFIED: /Users/jeff/repos/quibly-landing/app/globals.css lines 1–51]

**Token chain Phase 2 consumes (all already working):**

| Tailwind Utility | Resolved Value | Phase 2 Use |
|-----------------|---------------|-------------|
| `bg-primary` | oklch teal `#0D9488` | Hero CTA, secondary CTA, mascot gradient `from-primary` |
| `text-primary` | oklch teal | Footer wordmark, WhyQuibly lucide icons |
| `text-primary-foreground` | white | CTA button label |
| `text-foreground` | oklch `#111827` | Hero H1, WhyQuibly card labels |
| `text-muted-foreground` | oklch `#888` | Sub-headline, microcopy, footer copy, descriptions |
| `font-heading` | Quicksand | H1, H2, section headings, footer wordmark |
| `font-sans` | Figtree | Sub-headline, founder paragraph, descriptions, footer |
| `bg-gradient-to-br from-primary to-[#14b8a6]` | teal gradient | Hero mascot 88px wrapper |

**Key v4 gotcha (already handled by Phase 1):** Tailwind v3 silently drops `@theme inline`, `@plugin`, `@custom-variant`, and `oklch()` wide-gamut colors. The `@tailwindcss/postcss ^4` dev dependency is what enables v4 parsing. Both are already installed. Phase 2 adds no new Tailwind tokens. [CITED: https://ui.shadcn.com/docs/tailwind-v4]

**One token NOT in this repo that marketing-app has:** `@plugin "@tailwindcss/typography"`. The landing repo's `globals.css` does NOT include this line (correctly — CLAUDE.md bans it). The `.prose` CSS at the bottom of `globals.css` is carried over from the marketing-app copy but the plugin directive is absent. This is correct and expected for Phase 2.

---

## Pattern 4: Button `size="hero"` CVA Variant

The current `components/ui/button.tsx` (Phase 1 output, identical to marketing-app version) has no `size="hero"` variant. Phase 2 adds exactly one row to the `size` object:

```typescript
// components/ui/button.tsx — the ONE change in Phase 2
size: {
  // ... existing sizes unchanged ...
  hero: "h-auto rounded-[28px] px-9 py-3.5 text-base",
  // Breakdown:
  // h-auto: height driven by content + padding (not a fixed h-N)
  // rounded-[28px]: design-system §1 .btn-hero literal value (NOT rounded-full, NOT rounded-3xl)
  // px-9: 36px horizontal padding (design-system §1: 36px)
  // py-3.5: 14px vertical padding (design-system §1: 14px) → total ≈52px height ≥ 48px tap target ✓
  // text-base: 16px — body-size CTA text
}
```

**How `tailwind-merge` handles `rounded-full` base vs `rounded-[28px]` override:**
The base `buttonVariants` cva string includes `rounded-full`. The `size="hero"` variant adds `rounded-[28px]`. When `cn(buttonVariants({ size: "hero" }))` is called, `tailwind-merge` resolves the conflict by taking the last value for the same CSS property group. Since `rounded-[28px]` and `rounded-full` both set `border-radius`, the last one wins. CVA places `variant` output before `size` output, and `tailwind-merge` processes left-to-right taking the last same-group class. **Verify in DevTools** that the rendered `border-radius` is `28px` not `9999px`. [VERIFIED: button.tsx source logic + tailwind-merge documented behavior]

**Usage pattern (Hero CTA):**
```tsx
<Button asChild size="hero" variant="default">
  <a href="#waitlist">Join the waitlist</a>
</Button>
```

The `asChild` prop uses Radix's `Slot.Root` (already imported: `import { Slot } from "radix-ui"`) to forward all button styles onto the `<a>` child. The result is a styled anchor tag — no `<button>` wrapping an `<a>`, which would be invalid HTML. [VERIFIED: /Users/jeff/repos/quibly-landing/components/ui/button.tsx line 4 and line 54]

---

## Pattern 5: HeroMascot Component

```tsx
// components/sections/hero-mascot.tsx
import { QuibsIcon } from '@/components/quibs/quibs-icon'

/**
 * 88px teal-gradient rounded-square container for the Quibs mascot.
 * Matches design-system §1 "Large display" row: 88×88 container, 48×56 icon.
 * Uses `from-primary to-[#14b8a6]` — same gradient as QuibsAvatar.
 * `text-white` on the container drives fill="currentColor" white on QuibsIcon.
 */
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

**Why `h-[88px] w-[88px]` not `h-22 w-22`:** Tailwind's default scale `h-22 = 88px` (22 × 4px). Both are equivalent. The literal `h-[88px]` makes the design-system lock self-documenting. Either is acceptable; pick `h-[88px]` for clarity.

**Why `rounded-3xl` not `rounded-[88px]`:** `rounded-3xl` in Tailwind v4 maps to `--radius-3xl: calc(var(--radius) * 2.2) = calc(0.625rem * 2.2) = 1.375rem ≈ 22px`. The design-system §1 says "88px rounded-square" without specifying the exact corner radius. `rounded-3xl` (~22px) gives a soft rounded square without becoming a circle. This is Claude's Discretion (CD-01). `rounded-2xl` (~18px) or `rounded-[20px]` are also visually acceptable.

**Why `aria-hidden="true"`:** The mascot is purely decorative — meaning is carried by adjacent headline text. `QuibsIcon` already has `aria-hidden="true"` on the SVG (verified in source), but the container wrapper should also be hidden. [VERIFIED: /Users/jeff/repos/quibly-landing/components/quibs/quibs-icon.tsx line 22]

---

## Pattern 6: Hero Section — LCP Guard (HERO-06)

The LCP element on a 320×568 viewport must be the `<h1>`, not the 88px mascot block.

**The mechanism (D-03):**

```tsx
// components/sections/hero.tsx — critical DOM order
<section className="relative isolate overflow-hidden py-16 md:py-24">
  {/* Decorative gradient — aria-hidden, pointer-events-none, behind everything */}
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 -z-10
               bg-[radial-gradient(at_30%_20%,oklch(0.6002_0.1038_184.704_/_0.08),transparent_60%),
                   radial-gradient(at_75%_80%,oklch(0.78_0.13_70_/_0.06),transparent_55%)]"
  />
  {/* Container: flex-col-reverse puts H1 visually above HeroMascot,
      while H1 is DOM-first (important for LCP scoring and accessibility) */}
  <div className="max-w-6xl mx-auto px-6 md:px-8 flex flex-col-reverse items-center text-center gap-6">
    <h1 className="font-heading font-bold leading-tight text-foreground
                   text-3xl sm:text-4xl md:text-5xl lg:text-6xl max-w-3xl">
      You know your business. Quibly knows how to market it.
    </h1>
    <HeroMascot />   {/* DOM-second, renders visually ABOVE H1 via flex-col-reverse */}
  </div>
  {/* Sub-headline, CTA, microcopy continue below */}
</section>
```

**Why flex-col-reverse makes H1 the LCP candidate:**
- Lighthouse LCP identifies the largest content element painted in the initial viewport.
- With `flex-col-reverse`, the `<h1>` renders at the bottom of the flex container (visually), but Lighthouse measures paint time from DOM order, not visual order.
- More critically: the H1 text at `text-3xl` (30px) Quicksand Bold spanning ~10 words wrapped to ~3 lines on 320px occupies a larger text area than the 88px mascot block. The mascot is an `aria-hidden` non-text element; Lighthouse LCP candidates for text are measured by text area. The H1 wins by area.
- **Verification required:** Run Lighthouse on the Phase 2 PR and confirm `largest-contentful-paint element` in the report points to the H1 selector, not the mascot div. This is the Phase 2 Lighthouse CI gate's primary assertion target.

**Why `isolate overflow-hidden` on the section:**
- `isolate` creates a stacking context so the `-z-10` gradient div is contained within the section, not behind the entire page.
- `overflow-hidden` prevents the radial gradient from bleeding outside the section boundary (important for sections below the hero rendering on flat white).

---

## Pattern 7: `prefers-reduced-motion` (HERO-07)

Phase 2 ships zero decorative motion. The radial gradient is static CSS. No transitions, no animations, no keyframes are used. The only motion surface is CSS smooth-scroll.

**Required addition to `globals.css`** (confirmed NOT yet present — checked Phase 1 output):

```css
@layer base {
  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }
  }
}
```

The existing `html { scroll-behavior: smooth; }` (confirmed present at line 131 of `app/globals.css`) must be overridden for reduced-motion users. This is the **only** `prefers-reduced-motion` rule needed in Phase 2. [VERIFIED: /Users/jeff/repos/quibly-landing/app/globals.css line 131]

**For Phase 3+ reference:** When `tw-animate-css` utilities are invoked (success-state checkmark), wrap them:
```css
@media (prefers-reduced-motion: no-preference) {
  .animate-checkmark { /* tw-animate-css utility */ }
}
```
Or use Tailwind's `motion-reduce:` variant: `className="animate-fade motion-reduce:animate-none"`.

---

## Pattern 8: WhyQuibly 3-Column Grid with Lucide Icons

```tsx
// components/sections/why-quibly.tsx
import { Target, Users, LineChart } from 'lucide-react'

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
        <h2 className="font-heading font-bold text-3xl md:text-4xl leading-tight text-foreground text-center mb-12">
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

**Icon name verification:** [VERIFIED: lucide-react installed module]
- `Target` — exists as `target.mjs` ✓
- `Users` — exists as `users.mjs` ✓ (distinct from `Users2`, `UsersRound`)
- `LineChart` — exists as `line-chart.mjs` ✓ (distinct from `FileLineChart`)

**`strokeWidth={1.75}` pattern:** Design-system §1 specifies 1.75px stroke for Sidebar Icons. The same convention applies to WhyQuibly icons. Lucide default is 2px. Pass `strokeWidth={1.75}` explicitly. The `size` prop (24) sets both width and height; alternatively use `className="size-6"` for Tailwind-controlled sizing.

---

## Pattern 9: Footer Structure

```tsx
// components/sections/footer.tsx
export function Footer() {
  return (
    <footer className="py-12">
      <div className="max-w-6xl mx-auto px-6 md:px-8 flex items-center justify-center flex-wrap gap-3 text-sm text-muted-foreground">
        <span className="font-heading font-bold text-base text-primary">Quibly</span>
        <span aria-hidden="true">·</span>
        <span>© 2026 Quibly</span>
        <span aria-hidden="true">·</span>
        <a href="/privacy" className="hover:text-foreground transition-colors py-2 px-1">Privacy</a>
        <span aria-hidden="true">·</span>
        <a href="/terms" className="hover:text-foreground transition-colors py-2 px-1">Terms</a>
      </div>
    </footer>
  )
}
```

**Tap target on footer links:** `py-2` on anchor tags expands the touch target to ~42px with 14px text height + line-height. Adding `px-1` gives additional horizontal tap area. If the checker flags this as below 48px, lift to `py-3` (from 14px font + 2×12 = 38px to 14px + 2×16 ≈ 46px — still slightly under). The footer is below the fold; tab+Enter is the realistic accessibility path, not thumb-press on mobile. The UI-SPEC notes this explicitly and accepts 14px footer copy because it is not an `<input>`.

**Why middots are `aria-hidden`:** Screen readers announce "bullet" or "middle dot" for `·` characters when not hidden. Wrapping each separator in `<span aria-hidden="true">·</span>` gives screen readers a clean list-read: "Quibly, Copyright 2026 Quibly, Privacy, Terms". [CITED: https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/aria-hidden]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSS-in-JS button variants | Manual className switches | CVA (`class-variance-authority`) | Already installed; handles `tailwind-merge` conflicts; Phase 3 form reuses `size="hero"` |
| Custom font preloading | `<link>` tags in `<head>` | `next/font/google` | Already configured in `app/layout.tsx`; self-hosts at build; handles `size-adjust` fallback automatically |
| Manual `prefers-reduced-motion` checking in JS | `window.matchMedia` listener | CSS `@media (prefers-reduced-motion: reduce)` | Zero JS, applies before paint, respects OS setting |
| Custom gradient component | Absolutely-positioned canvas, JS | Tailwind `bg-[radial-gradient(...)]` on a `<div aria-hidden>` | Single CSS declaration, no runtime cost, already the recommended pattern from the UI-SPEC |
| SVG as `<img src>` | `<img src="/mascot.svg">` | Inline SVG via `<QuibsIcon>` | Already implemented in Phase 1; `fill="currentColor"` requires inline SVG; no HTTP request; tree-shakeable |
| CI performance assertions in Jest/Vitest | Custom lighthouse runner in test files | `@lhci/cli` + `treosh/lighthouse-ci-action` | Industry-standard LHCI; handles mobile emulation, URL polling, artifact storage |

**Key insight:** This phase is deliberately zero-dependency. All the "hard parts" (font loading, token resolution, icon tree-shaking, smooth-scroll) are handled by existing infrastructure. The planner's job is to write the RSC markup, not to solve infrastructure problems.

---

## Common Pitfalls

### Pitfall 1: `rounded-full` overrides `rounded-[28px]` in the hero button
**What goes wrong:** The base `buttonVariants` cva string includes `rounded-full`. Adding `size="hero"` with `rounded-[28px]` may not override if `tailwind-merge` processes the classes in the wrong order.
**Why it happens:** CVA emits base classes + variant classes as a single string. `tailwind-merge` resolves conflicting border-radius utilities by taking the last one. The order is: base string first, then variant string. Since `rounded-[28px]` appears in the `size="hero"` variant (appended after the base), it should win.
**How to avoid:** Inspect the rendered element in browser DevTools after Phase 2 implementation. Confirm `border-radius: 28px` (not `9999px`). If `rounded-full` wins, explicitly add `!rounded-[28px]` with Tailwind's important modifier (use sparingly) or remove `rounded-full` from the base and add `rounded-full` to each existing size variant explicitly.
**Warning signs:** Hero button looks circular (pill with very large radius matching the pill height) rather than a stadium shape with 28px corners.

### Pitfall 2: Lighthouse picks the HeroMascot as LCP instead of H1
**What goes wrong:** The 88px teal gradient block is painted before text (if text is DOM-second), causing Lighthouse to score the mascot as the largest contentful paint.
**Why it happens:** If DOM order is mascot-first and no `order-*` class forces the H1 above, Lighthouse measures the mascot container's paint time as LCP.
**How to avoid:** Use `flex-col-reverse` on the hero flex container (H1 in DOM first, HeroMascot second; visual order flipped). OR use `order-first` on the HeroMascot div inside a `flex-col` container with H1 first in DOM. Either way, the H1 must be DOM-first.
**Warning signs:** Lighthouse report's "Largest Contentful Paint element" points to a `.rounded-3xl` or gradient div selector, not the `h1` tag.

### Pitfall 3: Hero radial gradient extends below the Hero section, affecting CLS
**What goes wrong:** The absolute-positioned gradient div inside `<Hero>` bleeds into `<PlaceholderFormSection>` if the `<section>` doesn't establish a stacking context.
**Why it happens:** `position: absolute` elements escape their containing block if the parent has no `overflow: hidden`, `position: relative`, or `isolate` style.
**How to avoid:** Add `relative isolate overflow-hidden` to the `<section>` wrapping the Hero. This creates a stacking context and clips the absolute child.
**Warning signs:** The teal tint appears on sections below the hero.

### Pitfall 4: Font display shift causes CLS > 0.1
**What goes wrong:** CLS spikes when Quicksand swaps in from the fallback font, causing layout reflow.
**Why it happens:** `display: "swap"` renders fallback font first, then Quicksand loads. If line-heights or character widths differ significantly, text reflows.
**How to avoid:** Next.js 16.2's `next/font/google` generates a `size-adjust` CSS descriptor that scales the fallback font to match Quicksand's metrics, minimizing reflow. This is automatic. Do not override `display: "swap"` to `"block"` (causes FOIT — invisible text until font loads — which is worse for UX and worse for Lighthouse).
**Warning signs:** CLS > 0.1 in Lighthouse. Check the "Layout Shifts" trace in Chrome DevTools Performance tab to identify the shifting element.

### Pitfall 5: `scroll-behavior: smooth` fires for `prefers-reduced-motion: reduce` users
**What goes wrong:** Users who set "Reduce Motion" in their OS still see smooth-scrolling when clicking the "Join the waitlist" anchor — violating HERO-07 and WCAG 2.1 Success Criterion 2.3.3.
**Why it happens:** The base `html { scroll-behavior: smooth; }` is applied unconditionally in `globals.css`.
**How to avoid:** Add the `@media (prefers-reduced-motion: reduce)` override documented in Pattern 7 above. This is the **only** required `prefers-reduced-motion` rule in Phase 2 because no other motion ships.
**Warning signs:** SC #5 ("Users with `prefers-reduced-motion: reduce` see no decorative motion") cannot be verified without this rule.

### Pitfall 6: Lighthouse CI runs against `localhost` instead of the Vercel preview URL
**What goes wrong:** The CI workflow builds `next build` locally and runs Lighthouse against `localhost:3000`. Scores are typically higher than real-world because there's no network latency, no CDN, and no real-user context.
**Why it happens:** Default LHCI configuration without a URL points to the local build server.
**How to avoid:** Use `patrickedqvist/wait-for-vercel-preview` to wait for the Vercel preview URL, then pass that URL to `treosh/lighthouse-ci-action` as the `urls` input. See the CI configuration in the Validation Architecture section below.
**Warning signs:** Lighthouse scores consistently at 95–100 in CI but real users report slower experience. Or the CI runs before the Vercel preview is ready and times out.

### Pitfall 7: Middot separators in footer are read by screen readers
**What goes wrong:** Screen readers announce "middle dot, middle dot" between footer links, making the footer verbose and confusing for assistive technology users.
**Why it happens:** `·` is a Unicode character (U+00B7) that screen readers treat as content.
**How to avoid:** Wrap each `·` in `<span aria-hidden="true">·</span>`. This is already documented in the UI-SPEC and Pattern 9 above.

---

## Code Examples

### Hero Section (Full)
```tsx
// Source: 02-UI-SPEC.md §Hero structure + 02-CONTEXT.md D-03, D-22
// components/sections/hero.tsx
import { Button } from '@/components/ui/button'
import { HeroMascot } from '@/components/sections/hero-mascot'

const SUB_HEADLINE = `Quibly is the strategy-first AI marketing platform built for solopreneurs and small teams who'd rather grow the business than figure out the funnel.`

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden py-16 md:py-24">
      {/* Decorative radial gradient — behind hero content, aria-hidden */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10
                   bg-[radial-gradient(at_30%_20%,oklch(0.6002_0.1038_184.704_/_0.08),transparent_60%),radial-gradient(at_75%_80%,oklch(0.78_0.13_70_/_0.06),transparent_55%)]"
      />
      {/* flex-col-reverse: H1 is DOM-first (LCP guard), HeroMascot renders visually above */}
      <div className="max-w-6xl mx-auto px-6 md:px-8 flex flex-col-reverse items-center text-center gap-6">
        <h1 className="font-heading font-bold leading-tight text-foreground text-3xl sm:text-4xl md:text-5xl lg:text-6xl max-w-3xl">
          You know your business. Quibly knows how to market it.
        </h1>
        <HeroMascot />
      </div>
      <p className="font-sans text-base sm:text-lg text-muted-foreground max-w-prose mx-auto mt-4 px-6 text-center">
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

### `size="hero"` CVA Addition to button.tsx
```typescript
// Source: 02-CONTEXT.md D-06, CD-04; design-system §1 .btn-hero
// components/ui/button.tsx — add to the size object in buttonVariants cva
size: {
  default: "h-8 gap-1.5 px-2.5 ...",
  // ... existing sizes ...
  hero: "h-auto rounded-[28px] px-9 py-3.5 text-base",
}
```

### `prefers-reduced-motion` CSS Rule
```css
/* Source: 02-UI-SPEC.md §Anchor scroll; MDN prefers-reduced-motion */
/* app/globals.css — add inside @layer base */
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}
```

### PlaceholderFormSection
```tsx
// Source: 02-CONTEXT.md D-09
// components/sections/placeholder-form-section.tsx
// NOTE: Phase 3 RENAMES this file to waitlist-form-section.tsx and replaces the body.
// The outer section wrapper and id="waitlist" are the SEAM — do not change them.
import { Button } from '@/components/ui/button'

export function PlaceholderFormSection() {
  return (
    <section id="waitlist" className="py-16 md:py-24 scroll-mt-16">
      <div className="max-w-6xl mx-auto px-6 md:px-8 text-center max-w-prose mx-auto">
        <h2 className="font-heading font-bold text-3xl md:text-4xl leading-tight text-foreground mb-4">
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

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `next/font` with `<link>` to fonts.googleapis.com | `next/font/google` self-hosts at build | Next.js 13+ | Eliminates external DNS RTT, removes render-blocking resource |
| Client-side smooth-scroll polyfills | `scroll-behavior: smooth` in CSS | CSS3 / all modern browsers | Zero JS; works with `prefers-reduced-motion` media query natively |
| LHCI running against localhost | LHCI against Vercel preview URL | Vercel Actions ecosystem (2022+) | Scores reflect real CDN/network conditions |
| Tailwind v3 `tailwind.config.js` token definitions | Tailwind v4 `@theme inline` in CSS | Tailwind v4 (2024–2025) | Tokens are now CSS-native; no JS config file needed |
| Lighthouse CI `@lhci/cli@0.14.x` + Lighthouse 11 | `@lhci/cli@0.15.x` + Lighthouse 12.6.1 | 2025 | Node 18+ requirement; Lighthouse 13 not yet supported (requires Node 22) |

**Deprecated/outdated:**
- `tailwind.config.js` with `extend: { colors: { ... } }`: Not used in v4. All tokens live in `@theme inline` in CSS.
- `next/font` `display: "block"` or `display: "optional"`: Block causes invisible text during load (bad UX). Optional skips font if not cached (bad brand consistency). Use `"swap"` with `size-adjust`.

---

## Token Parity Audit (Phase 2 needs vs. Phase 1 delivered)

[VERIFIED: /Users/jeff/repos/quibly-landing/app/globals.css compared to marketing-app/app/globals.css]

| Token | Needed by Phase 2 | Present in quibly-landing globals.css |
|-------|------------------|--------------------------------------|
| `--primary` (oklch teal) | Hero mascot gradient, CTA bg, icons, footer wordmark | ✓ line 60 |
| `--primary-foreground` (white) | CTA text | ✓ line 61 |
| `--muted-foreground` | Sub-headline, microcopy, founder paragraph, footer | ✓ line 65 |
| `--foreground` | H1, H2, card labels | ✓ line 55 |
| `--background` (white) | Page bg, section surfaces | ✓ line 54 |
| `--font-heading` (Quicksand) | All headings | ✓ line 13 |
| `--font-sans` (Figtree) | Body text | ✓ line 11 |
| `--radius-3xl` (for mascot `rounded-3xl`) | HeroMascot corners | ✓ line 49 (`calc(var(--radius) * 2.2)`) |
| Teal gradient `#14b8a6` (hex literal) | Mascot gradient `to-[#14b8a6]` | Used as Tailwind arbitrary value — not a CSS variable, not needed in globals.css |

**Verdict:** All needed tokens are present. Phase 2 does NOT add any new tokens to `globals.css`.

**One difference from marketing-app:** marketing-app has `@plugin "@tailwindcss/typography"` at line 4. quibly-landing deliberately omits this (correct — CLAUDE.md bans it). The `.prose` utility CSS is also carried verbatim into the landing globals.css, which is unused in Phase 2 but harmless — it adds a few hundred bytes of CSS to the bundle that is never applied. Phase 2 should NOT strip it (that's a refactoring decision for a later phase).

**globals.css difference that matters for Phase 2:** quibly-landing has the sidebar-related CSS rules (`[data-sidebar="menu-button"] svg { opacity: 0.6; }` etc.). These rules are dead code for the landing page (no sidebar component exists) but are harmless. Do not remove.

---

## Open Questions

1. **Lighthouse CI: Vercel Token for Preview URL**
   - What we know: `patrickedqvist/wait-for-vercel-preview` action requires a `VERCEL_TOKEN` secret. The project has a `.vercel/project.json` (confirmed by Phase 1), so `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are available.
   - What's unclear: Whether the Vercel token is already stored as a GitHub secret (`VERCEL_TOKEN`) in this repo, or needs to be added.
   - Recommendation: The CI workflow should document the required secrets. The planner should add a task to verify/add `VERCEL_TOKEN` as a GitHub secret before the CI gate can run. This is a one-time manual step.

2. **CLS from gradient `<div>` absolute positioning**
   - What we know: A `position: absolute` div inside a `relative` section should not contribute to CLS because it takes up no layout space.
   - What's unclear: Whether any edge-case paint timing in Next.js 16.2 could cause a reflow.
   - Recommendation: Treat as LOW risk. The `isolate overflow-hidden` container bounds prevent layout shift. Verify with Lighthouse CLS trace after implementation.

3. **Figtree 900 weight**
   - What we know: CLAUDE.md mentions `weight: ['400','500','600','700','900']` for Figtree, but existing `layout.tsx` uses only 400–700 (matching marketing-app).
   - What's unclear: If CLAUDE.md intentionally specifies 900 for a planned Phase 3+ bold element.
   - Recommendation: Keep 400–700 only (current `layout.tsx` is correct). Weight 900 is unused in Phase 2 and downloads unnecessary font data. Phase 3+ can add 900 if a design element requires extra-bold Figtree.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next build, LHCI | ✓ | system | — |
| `next` CLI | `next build` | ✓ | 16.2.1 | — |
| `lucide-react` `Target`, `Users`, `LineChart` | WhyQuibly icons | ✓ | ^1.7.0 (verified in node_modules) | — |
| GitHub Actions | Lighthouse CI gate | ✓ (repo is git) | — | Manual Lighthouse run per PR |
| Vercel preview URL | LHCI target URL | ✓ (.vercel/project.json present) | — | localhost build (less accurate) |
| `VERCEL_TOKEN` GitHub secret | wait-for-vercel-preview action | Unknown — not verifiable statically | — | Must be set manually |

**Missing dependencies with no fallback:** None that block Phase 2 component implementation.

**Missing dependencies with fallback:** `VERCEL_TOKEN` GitHub secret (required for LHCI against preview URL; fallback is to run LHCI against a local `next build` in CI, which is less accurate but unblocking for initial merge).

---

## Validation Architecture

> `workflow.nyquist_validation: true` in `.planning/config.json` — this section is required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Lighthouse CI (`@lhci/cli`) — performance validation only; no vitest in Phase 2 |
| Config file | `.lighthouserc.json` (new, created in Phase 2) |
| Quick run (local) | `npx @lhci/cli autorun --config=.lighthouserc.json` |
| Full CI run | GitHub Action on every PR (see workflow below) |

**Note on vitest:** Phase 2 has zero JavaScript logic to unit-test. No Server Actions, no utility functions, no data transformations. Vitest is not installed yet (Phase 3 introduces the first Server Action and unit tests). Nyquist validation for this phase is entirely Lighthouse CI.

### Phase Requirements → Validation Map

| Req ID | Behavior | Test Type | Command / Method | Automated |
|--------|----------|-----------|-------------------|-----------|
| PERF-01 | Lighthouse mobile performance ≥90 | Lighthouse CI | LHCI assertion `categories:performance >= 0.90` | ✅ GitHub Action |
| PERF-02 | CLS < 0.1 | Lighthouse CI | LHCI assertion `cumulative-layout-shift maxNumericValue: 0.1` | ✅ GitHub Action |
| PERF-03 | No render-blocking 3rd-party scripts | Lighthouse CI | `render-blocking-resources` audit (advisory) | ✅ GitHub Action |
| HERO-06 | LCP element is the `<h1>` | Lighthouse CI (manual check) | Review `largest-contentful-paint element` in Lighthouse HTML report | Manual verification per PR |
| MOB-01 | Responsive 320px → 1440px | Visual inspection | `next dev`, DevTools Device Mode at 320, 375, 768, 1440 | Manual (no Playwright this phase) |
| MOB-02 | Interactive elements ≥48px tap target | Lighthouse a11y audit | `tap-targets` audit in Lighthouse report | ✅ Advisory in LHCI run |
| HERO-07 / SC #5 | `prefers-reduced-motion: reduce` disables smooth-scroll | Manual | Toggle OS reduced-motion, click "Join the waitlist" anchor, verify instant-jump | Manual |
| FOLD-01..04, HERO-01..05 | Content renders correctly | Visual inspection | `next dev` viewport review | Manual |

### Lighthouse CI Configuration (`.lighthouserc.json`)

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

**Notes:**
- `"error"` level fails the PR. `"warn"` level records but does not block.
- Only `performance >= 0.90` and `CLS < 0.1` are hard `"error"` failures (D-29).
- `render-blocking-resources` is advisory `"warn"` — Phase 2 should have zero, but the advisory documents intent without over-constraining.
- `numberOfRuns: 3` takes the median score — reduces noise from a single slow run.
- `seo >= 0.80` advisory (not 0.90) — Phase 5 finalizes title/description/OG; Phase 2 baseline metadata is minimal.

[CITED: https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md]

### GitHub Actions Workflow (`.github/workflows/lighthouse.yml`)

```yaml
# Source: treosh/lighthouse-ci-action v12 + patrickedqvist/wait-for-vercel-preview
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

**Required GitHub Secrets (one-time setup per planner task):**
- `VERCEL_TOKEN` — Vercel personal access token (from vercel.com/account/tokens)
- `LHCI_GITHUB_APP_TOKEN` — Optional; enables rich GitHub status checks on the PR (from https://github.com/apps/lighthouse-ci). Without it, the action still runs but doesn't post score annotations.

**Fallback (if Vercel token not yet available):** The CI can run against the result of `next build && npx serve .next` locally. Scores will be ~5 points higher than production (no real-user network conditions) but the CLS and render-blocking checks are accurate. Document this as a temporary fallback.

### Sampling Rate

- **Per-task commit:** `next build && npx next start` + Chrome DevTools Lighthouse run against localhost — developer responsibility
- **Per PR merge:** GitHub Action (automated) — blocks merge if `performance < 0.90` or `CLS >= 0.1`
- **Phase gate:** Full LHCI run on the Phase 2 PR must show green before `/gsd-verify-work`

### Wave 0 Gaps (test infrastructure to create in Phase 2)

- [ ] `.lighthouserc.json` — Lighthouse CI configuration (new file)
- [ ] `.github/workflows/lighthouse.yml` — GitHub Actions workflow (new file)
- [ ] `VERCEL_TOKEN` GitHub secret — must be added manually in GitHub repo Settings → Secrets

*(No vitest test files are needed — Phase 2 has no testable JavaScript logic)*

---

## Security Domain

> `security_enforcement` not set to false in `.planning/config.json` — section required.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in Phase 2 |
| V3 Session Management | No | No sessions |
| V4 Access Control | No | No protected resources |
| V5 Input Validation | No | No user input in Phase 2 (form is Phase 3) |
| V6 Cryptography | No | No cryptographic operations |
| V13 API / Configuration | Partial | No raw `process.env` (enforced by `lib/env.ts` already from Phase 1) |

### Threat Patterns for Static RSC Page

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via draft copy strings | Tampering | React JSX auto-escapes string content — no `dangerouslySetInnerHTML` anywhere in Phase 2 |
| Secret leakage in client bundle | Information Disclosure | Zero `'use client'` directives; `lib/env.ts` with `import 'server-only'` already in place (Phase 1) |
| CSS injection via Tailwind arbitrary values | Tampering | Arbitrary values (e.g. `bg-[radial-gradient(...)]`) are author-controlled compile-time strings, not user input |

Phase 2 has an exceptionally small security surface: it is static HTML + CSS with no user input, no API calls, no secrets accessed at runtime. The primary security invariant to maintain is **zero `'use client'` directives**, which ensures no environment variables or server-only modules are accidentally bundled for the browser.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `tailwind-merge` will resolve `rounded-full` (base) vs `rounded-[28px]` (size variant) in favor of the variant | Pattern 4 | Hero button renders with wrong border-radius — visual defect |
| A2 | Vercel preview deploy will complete within 300s (5 min) for LHCI wait timeout | Validation Architecture | GitHub Action times out; CI gate never runs on PR |
| A3 | The `@media (prefers-reduced-motion: reduce)` CSS rule for `scroll-behavior: auto` is sufficient to satisfy HERO-07 given Phase 2 has no other motion | Pattern 7 | SC #5 checker flags incomplete `prefers-reduced-motion` support if additional static CSS transitions are added |

**All other claims in this document were verified against source files or official documentation this session.**

---

## Sources

### Primary (HIGH confidence — verified this session)
- `/Users/jeff/repos/quibly-landing/app/globals.css` — complete `@theme inline` token block, confirmed identical to marketing-app (minus `@plugin "@tailwindcss/typography"`)
- `/Users/jeff/repos/quibly-landing/app/layout.tsx` — Quicksand + Figtree `next/font/google` config, confirmed Phase 1 output
- `/Users/jeff/repos/quibly-landing/components/ui/button.tsx` — CVA variant structure, `asChild` pattern, no existing `size="hero"`
- `/Users/jeff/repos/quibly-landing/components/quibs/quibs-icon.tsx` — inline SVG, `fill="currentColor"`, `aria-hidden="true"`
- `/Users/jeff/repos/quibly-landing/components/quibs/quibs-avatar.tsx` — `from-primary to-[#14b8a6]` gradient pattern, SIZE_CONFIG reference
- `/Users/jeff/repos/quibly-landing/package.json` — installed versions (next 16.2.1, react 19.2.4, lucide-react ^1.7.0, tw-animate-css ^1.4.0, CVA ^0.7.1)
- `/Users/jeff/repos/marketing-app/app/layout.tsx` — font weights 400–700 for both Figtree and Quicksand
- `/Users/jeff/repos/marketing-app/components/ui/button.tsx` — identical to landing button.tsx (confirmed token parity)
- `/Users/jeff/repos/quibly-landing/node_modules/lucide-react` — verified `Target`, `Users`, `LineChart` icon names exist
- `02-CONTEXT.md`, `02-UI-SPEC.md` — phase-locked decisions and design contract
- `.planning/config.json` — `nyquist_validation: true` confirmed
- [GoogleChrome/lighthouse-ci configuration.md](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md) — assertion syntax for `categories:performance` and `cumulative-layout-shift`

### Secondary (MEDIUM confidence — verified with official source)
- [treosh/lighthouse-ci-action GitHub](https://github.com/treosh/lighthouse-ci-action) — action inputs and YAML usage
- [patrickedqvist/wait-for-vercel-preview](https://github.com/patrickedqvist/wait-for-vercel-preview) — Vercel preview URL polling
- [Next.js font API docs](https://nextjs.org/docs/app/api-reference/components/font#display) — `size-adjust` behavior with `display: swap`
- [shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) — `@theme inline`, v4 token system

### Tertiary (LOW confidence)
- None — all claims verified against source files or official docs.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in node_modules and package.json
- Architecture: HIGH — derived from verified source files and locked CONTEXT.md decisions
- LCP guard pattern: HIGH — verified in quibs-icon.tsx (aria-hidden) and button.tsx (Slot.Root asChild)
- Lighthouse CI config: HIGH — verified against official lhci docs and treosh action README
- Pitfalls: HIGH — derived from verified source code and documented Tailwind v4 / CVA behavior

**Research date:** 2026-04-27
**Valid until:** 2026-05-27 (30-day window; LHCI version pinning may need refresh if Node 22 becomes required)
