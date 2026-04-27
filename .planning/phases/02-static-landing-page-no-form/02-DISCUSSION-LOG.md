# Phase 2: Static Landing Page (No Form) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-27
**Phase:** 2-static-landing-page-no-form
**Areas discussed:** Hero composition, Placeholder CTA behavior, Why Quibly + founder voice layout, Footer scope + decorative posture

---

## Hero composition

### Q1: Where does the Quibs mascot sit relative to the headline?

| Option | Description | Selected |
|--------|-------------|----------|
| Above headline, centered | Vertical stack on all viewports: mascot → headline → sub-headline → CTA. Mascot DOM-second so headline = LCP. Lowest layout risk; mirrors modern waitlist heroes. | ✓ |
| Beside headline (2-col on desktop, stacked on mobile) | Desktop split, mobile stacks. Adds responsive surface to test for CLS. | |
| Decorative offset (mascot floats to a corner) | Headline is focal; mascot is small decoration. "Where do I look?" risk on a brand that leans on mascot. | |
| You decide | Claude picks. | |

**User's choice:** Above headline, centered (recommended option)

### Q2: How big is the mascot and what container does it sit in?

| Option | Description | Selected |
|--------|-------------|----------|
| 88px teal-gradient rounded-square (Large display variant) | Matches design-system §1 "Large display" row (48×56 icon in 88px rounded-square, teal gradient bg, white icon). Strong brand presence without dominating. | ✓ |
| 56px circle (FAB variant — `<QuibsAvatar size="fab">`) | Reuse existing variant verbatim. Smaller; even safer for HERO-06. May feel underweight. | |
| Raw `<QuibsIcon>` in `text-primary` at ~120-160px, no container | Maximum personality, no gradient. Risk: bounding box could outsize headline at certain viewports. | |
| Custom XL variant (rounded-square ~120px+, teal gradient, white icon) | Bigger than 88px. Need to verify H1 still wins LCP. | |

**User's choice:** 88px teal-gradient rounded-square (Large display variant) (recommended)

### Q3: How is the headline weighted on mobile vs. desktop?

| Option | Description | Selected |
|--------|-------------|----------|
| Large + responsive scale (3xl mobile → 5xl/6xl desktop) | `text-3xl sm:text-4xl md:text-5xl lg:text-6xl`, Quicksand 700. Standard modern hero typography. | ✓ |
| Mid-range scale (2xl → 4xl) | Smaller, less stretch. Reads less "hero", more "page heading". | |
| Aggressive scale (4xl → 7xl/8xl) | Maximum brand presence. Risk: 7xl Quicksand wraps awkwardly at 320px on 10-word tagline. | |

**User's choice:** Large + responsive scale (3xl → 5xl/6xl) (recommended)

### Q4: How does "Quibly" render in the headline — same color as the rest, or accented?

| Option | Description | Selected |
|--------|-------------|----------|
| All neutral (foreground/text-base color), no accent | Whole headline as one typographic statement. Simplest; brand teal lives in mascot + CTA. | ✓ |
| "Quibly" rendered in teal `text-primary` | Visually emphasized within the headline. Risk: three teal anchors stack vertically (mascot + wordmark + CTA). | |
| "Quibly" gets a subtle accent (amber highlight, underline-thick, weight bump) | Variations: amber `text-secondary` or hand-drawn underline. Adds personality but more design effort. | |

**User's choice:** All neutral (recommended)

---

## Placeholder CTA behavior

### Q1: What does the above-fold pill CTA do in Phase 2?

| Option | Description | Selected |
|--------|-------------|----------|
| Anchor link that smooth-scrolls to a placeholder section ID | `<a href="#waitlist">` + CSS `scroll-behavior: smooth`. Phase 3 swaps the anchor target for the real form. Zero client JS in Phase 2. | ✓ |
| Live `<button>` with no handler (visually identical to Phase 3 button) | Pixel-identical to Phase 3 submit. Looks broken to QA reviewers. | |
| Disabled-state button with launch-timing copy | Pill with `aria-disabled="true"` and "Joining the waitlist — opens soon" copy. Honest but mismatched against Phase 3. | |
| Wireframe email-input lookalike | Render input + button shape with no form action. Phase 3 must remove the wireframe — churn vs anchor-scroll. | |

**User's choice:** Anchor link that smooth-scrolls to a placeholder section ID (recommended)

### Q2: What does the placeholder section at `#waitlist` actually contain in Phase 2?

| Option | Description | Selected |
|--------|-------------|----------|
| Compact "Coming in Phase 3" placeholder + secondary CTA | Heading + 1-line elaboration + secondary pill CTA inside same section. Phase 3 replaces section body with form. Lighthouse measures real DOM shape. | ✓ |
| Just an empty anchor (`<div id="waitlist" />`) | Smooth-scroll lands on empty anchor. FOLD-03 has nothing to attach to. UX: page jumps for no apparent reason. | |
| Pre-rendered `<noscript>` fallback shape from Phase 3 | Render Phase 3's noscript form shape with action pointed at `/api/coming-soon`. Scope creep into Phase 3. | |

**User's choice:** Compact "Coming in Phase 3" placeholder + secondary CTA (recommended)

### Q3: What does the FOLD-03 secondary CTA at page bottom do?

| Option | Description | Selected |
|--------|-------------|----------|
| Anchors back to `#waitlist` (same target as hero CTA) | One placeholder section serves both CTAs. Copy can differ; anchor target is shared. DRY. | ✓ |
| Anchors back to `#top` (page header) | Mismatches FOLD-03 spec ("anchoring back to the form" — form is mid-page, not top). | |
| Renders a duplicate placeholder section above the footer | Two separate placeholders. Phase 3 has to wire both. More implementation surface. | |

**User's choice:** Anchors back to `#waitlist` (recommended)

### Q4: What's the exact launch-timing microcopy under the CTA (HERO-05)?

| Option | Description | Selected |
|--------|-------------|----------|
| "Launching Summer 2026" | Matches REQUIREMENTS.md HERO-05 example verbatim. Specific season but not hard date. ~2-3 months out as of 2026-04-27. | ✓ |
| "Launching Q3 2026" | More precise (July–September). Reads slightly more corporate. | |
| "Coming 2026" | Maximally vague. Underwhelming for waitlist signup pitch. | |
| "Launching soon — join to be notified first" | Copy-driven, no specific date. Conversion language but commits to nothing. | |

**User's choice:** "Launching Summer 2026" (recommended)

---

## Why Quibly + founder voice layout

### Q1: How are the three "Why Quibly" differentiators presented?

| Option | Description | Selected |
|--------|-------------|----------|
| 3-column grid on desktop, stacked on mobile, with leading lucide icon | `grid grid-cols-1 md:grid-cols-3`. Icon → bold label → 1–2 line description. Adds visual structure without screenshots. | ✓ |
| Stacked paragraphs (no columns), bold lead phrase + flowing description | Bold first phrase + sentence. Reads like manifesto/founder note. | |
| Numbered list (1. 2. 3.), serif-style numerals, no icons | Quicksand numerals as visual anchors. No external icon dependencies. | |
| 3-column grid, no icons, just label + description | Grid without icons. Eye has nothing to anchor on. | |

**User's choice:** 3-column grid with leading lucide icon (recommended)

### Q2: Which lucide icons map to the three differentiators?

| Option | Description | Selected |
|--------|-------------|----------|
| Target / Users / LineChart | Strategy → Target. AI advisory → Users. Metrics → LineChart. Common, low-ambiguity, render at 24-32px. | ✓ |
| Compass / Sparkles / Repeat | More figurative. `Sparkles` is overused for AI in 2026. | |
| MapPin / Bot / RefreshCw | Most literal. `Bot` is on-the-nose for AI brands. | |

**User's choice:** Target / Users / LineChart (recommended)

### Q3: How is the founder-voice paragraph (FOLD-02) presented?

| Option | Description | Selected |
|--------|-------------|----------|
| Centered prose, max-width ~600px, no avatar, no quote marks | Single short paragraph reading directly to reader. No quote marks, no avatar, no name byline visually. | ✓ |
| Quote-styled card (left vertical bar, indented italic, attribution byline) | Pull-quote: teal left border, italic Figtree, byline. Risk: feels like fake testimonial of self-praise. | |
| Inline with body content, left-aligned, normal paragraph styling | Just another paragraph. Maximum minimalism. | |
| Boxed card with avatar + name + paragraph | Card with founder photo + paragraph. Requires real founder photo asset; CLS surface. | |

**User's choice:** Centered prose, no avatar, no quote marks (recommended)

### Q4: Where does Phase 2 source the actual copy for these blocks?

| Option | Description | Selected |
|--------|-------------|----------|
| Claude drafts plausible copy aligned with brand tone, founder reviews/edits in PR | Claude drafts: sub-headline, 3 differentiator descriptions, founder paragraph. Founder edits in PR before merge. | ✓ |
| Founder writes copy now, before planning | Block planning until founder writes copy. Highest fidelity but blocks Phase 2 on copywriting. | |
| Use placeholder text (lorem ipsum or `[TODO: copy]`), fill in Phase 5 | Placeholder text; Lighthouse + visual layout still verifiable. Risk: placeholder leaks past review. | |

**User's choice:** Claude drafts copy, founder reviews in PR (recommended)

---

## Footer scope + decorative posture

### Q1: What's in the footer?

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal centered: copyright + Privacy + Terms + small Quibly wordmark | One row, centered, middot/pipe separated. ~50–60px tall. Same shape on /privacy + /terms in Phase 5. | ✓ |
| Two-zone: copyright/legal left, contact/social right | Adds contact mailto and social icons. Need confirmed handles or links die. | |
| Multi-column (Product / Resources / Legal / Company) per design-system §6 | Mirrors full Quibly design system. Wrong fit for waitlist; columns would be empty. | |
| Bare copyright only (no legal links) | Just copyright. LEGAL-05 requires Privacy + Terms in footer. Would need re-templating in Phase 5. | |

**User's choice:** Minimal centered (recommended)

### Q2: Phase 2 ships before /privacy and /terms exist (those land in Phase 5). What do the footer links point to?

| Option | Description | Selected |
|--------|-------------|----------|
| Hard-coded `/privacy` and `/terms` hrefs that 404 until Phase 5 wires the pages | Phase 5 makes the links work without touching Footer component. Lighthouse runs on `/` only. | ✓ |
| Conditional rendering: hide links until Phase 5 sets a flag | Adds code path nobody else needs. Phase 5 has to remove the flag. | |
| Coming-soon hash anchors (e.g., `#privacy-coming-soon`) | Worse UX than 404; Phase 5 has to rewrite Footer anyway. | |

**User's choice:** Hard-coded hrefs that 404 until Phase 5 (recommended)

### Q3: Decorative posture — background and motion?

| Option | Description | Selected |
|--------|-------------|----------|
| Pure flat white surfaces, NO decorative motion in v1 | No gradient overlays. Static mascot. Maximum Lighthouse safety. | |
| Subtle background only — soft teal/amber radial gradient behind hero, no motion | Barely-there radial gradient breaks all-white. CSS-only, ships at parse time, no LCP impact, no motion edge cases. | ✓ |
| Subtle background + Q-face dot wave/blink animation, gated by prefers-reduced-motion | CLAUDE.md flagged dot animation. Adds verification surface (Lighthouse motion checks, a11y QA). | |
| Subtle background + dot animation + slow-fade on headline at load | Headline-fade delays LCP timing. CLAUDE.md bans Framer Motion. | |

**User's choice:** Subtle background only — radial gradient behind hero, no motion

### Q4: Component organization — where do these section components live?

| Option | Description | Selected |
|--------|-------------|----------|
| `components/sections/{hero,why-quibly,founder,footer,placeholder-form-section}.tsx` | Idiomatic App Router. Footer reused on /privacy + /terms in Phase 5. | ✓ |
| `components/{Hero,WhyQuibly,Footer,...}.tsx` flat at top level | Mixes with `components/quibs/` and `components/ui/`. Less organized as components grow. | |
| Inline in `app/page.tsx` — no separate component files for sections | Smallest file count. Footer can't be reused on /privacy + /terms without extraction — Phase 5 refactor. | |

**User's choice:** `components/sections/*.tsx` (recommended)

---

## Claude's Discretion

Items where the user explicitly delegated, or where the question was answered with "you decide" or implementation-level (not vision-level):

- Exact gradient color stops, gradient size/positioning, container max-width nuances (CD-01)
- Font-size scale fine-tuning at intermediate breakpoints (CD-02)
- `<HeroMascot>` as separate component file vs. inline inside `<Hero>` (CD-03)
- Implementation of `size="hero"` Button variant via CVA vs. ad-hoc Tailwind (CD-04)
- Lighthouse CI threshold for non-performance categories (a11y, best-practices, SEO) (CD-05)
- Anchor smooth-scroll target offset / `scroll-margin-top` value (CD-06)
- Whether `<PlaceholderFormSection>` is renamed in Phase 3 vs. edited in place (CD-07)

## Deferred Ideas

Items raised or implied during discussion that were redirected out of Phase 2:

- Q-face dot wave/blink animation — CLAUDE.md flagged; deferred to post-launch polish
- Hero background sophistication beyond a radial gradient (SVG decorations, brand patterns)
- Footer maturity signals (social icons, contact mailto, status page) — deferred until accounts exist
- Live signup counter (V2-01 / Phase 7 conditional)
- Founder photo / explicit byline on founder-voice paragraph
- A/B test variants of headline / sub-headline / CTA copy (V2-05)
- Sub-headline word-count experiments
- Generalized `size="hero"` Button CVA variant (Phase 3 may revisit if Phase 2 ships ad-hoc)
- Placeholder section copy is intentionally throwaway — Phase 3 wholesale-replaces
