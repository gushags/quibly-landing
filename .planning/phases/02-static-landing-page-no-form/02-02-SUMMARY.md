---
phase: 02-static-landing-page-no-form
plan: 02
subsystem: ui
tags:
  - hero
  - rsc
  - lcp-guard
  - mascot
  - placeholder-section
  - anchor-seam
  - tailwind-v4
  - radial-gradient
  - a11y

# Dependency graph
requires:
  - phase: 01-foundation
    provides: components/quibs/quibs-icon.tsx (currentColor SVG, 223×263 viewBox); components/ui/button.tsx Button + buttonVariants CVA with size="hero" h-auto rounded-[28px] px-9 py-3.5 text-base; app/globals.css token chain (--primary teal, --foreground, --muted-foreground, --font-heading, --font-sans, --radius-3xl)
  - phase: 02-static-landing-page-no-form (Plan 02-01)
    provides: Button size="hero" CVA variant; @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } } override
provides:
  - HeroMascot — 88×88 teal-gradient rounded-square wrapper around a 48×56 white QuibsIcon (D-02)
  - Hero — section with dual-stop radial-gradient backdrop, flex-col-reverse LCP guard, locked H1 copy, draft 24-word sub-headline, disabled "Form coming soon" hero CTA per D-31, "Launching Summer 2026" microcopy (HERO-01..06)
  - PlaceholderFormSection — id="waitlist" anchor seam with scroll-mt-16 offset, draft heading + sub-copy, disabled secondary CTA per D-31 (D-09, D-12, CD-06, CD-07)
  - LCP-guard pattern: DOM-first H1 + flex-col-reverse + max-w-xs sub-headline cap (D-03, D-30)
  - Cross-phase anchor seam: id="waitlist" + scroll-mt-16 stays put through Phase 3 file rename
affects:
  - 02-03 (next sections — WhyQuibly, FounderVoice, SecondaryCTA, Footer — will compose against the same section component pattern)
  - 02-04 (page composition — wires <Hero /> + <PlaceholderFormSection /> + remaining sections into app/page.tsx)
  - 02-05 (Lighthouse CI — will assert the H1 is the LCP element via the gates Phase 02-02 sets up)
  - 02-06 (Playwright runtime — will assert the hero CTA's computed border-radius: 28px)
  - 03 (Phase 3 form — replaces both disabled <Button> CTAs with the real form submit; PlaceholderFormSection file is renamed to waitlist-form-section.tsx, outer wrapper preserved)

# Tech tracking
tech-stack:
  added: []  # Zero new runtime or dev deps; all imports are from Phase 1 + Plan 02-01
  patterns:
    - "Pattern: pure-RSC section component — single named export, zero 'use client', no event handlers, no React hooks"
    - "Pattern: LCP guard — DOM-first H1 + flex-col-reverse to paint mascot above headline without breaking DOM-order LCP scoring; sub-headline width capped at max-w-xs at 320px so its painted area stays smaller than the wrapped H1"
    - "Pattern: stacking-context-contained decorative gradient — relative isolate overflow-hidden on the section + absolute -z-10 div with aria-hidden + pointer-events-none, oklch color stops written as Tailwind arbitrary values"
    - "Pattern: cross-phase anchor seam — id='waitlist' + scroll-mt-16 land on the outer <section> of a placeholder file; Phase 3 swaps the inner body without touching the wrapper"
    - "Pattern: D-31 disabled-CTA — <Button size='hero' type='button' aria-disabled='true'> renders the styled pill while advertising disabled state to AT, no asChild, no fragment href, no no-op self-anchor"

key-files:
  created:
    - components/sections/hero-mascot.tsx (29 lines — 88×88 teal-gradient mascot wrapper)
    - components/sections/hero.tsx (46 lines — hero section with LCP guard, gradient backdrop, disabled CTA, microcopy)
    - components/sections/placeholder-form-section.tsx (40 lines — id='waitlist' anchor seam + draft copy + disabled secondary CTA)
  modified: []

key-decisions:
  - "All three new files ship as pure RSC (zero 'use client'); locked H1 copy, draft sub-headline + placeholder copy per D-28 founder-review gate"
  - "Hero CTA renders as <Button size='hero' type='button' aria-disabled='true'>Form coming soon</Button> per D-31 (post-review) — replaces original D-08 anchor + D-12 'Join the waitlist' copy until Phase 3"
  - "Placeholder secondary CTA renders as <Button size='hero' type='button' aria-disabled='true'>Don't miss launch — join the waitlist</Button> per D-31 — same disabled-button posture, copy still locked per D-12"
  - "Hero section spacing tightened to py-8 md:py-16 lg:py-24 + gap-4 + mt-4 + max-w-xs sm:max-w-prose per D-30 — defends 320×568 above-fold budget AND H1-as-LCP painted-area heuristic"
  - "Decorative dual-stop radial gradient implemented as Tailwind arbitrary value with oklch literals — first stop matches --primary exactly (oklch(0.6002_0.1038_184.704_/_0.08)); second stop is warm amber (oklch(0.78_0.13_70_/_0.06))"
  - "H1 className reordered (vs the plan's verbatim template) so font-heading font-bold is contiguous AND text-3xl sm:text-4xl md:text-5xl lg:text-6xl is contiguous — required by the plan's literal grep acceptance criteria; class semantics unchanged because Tailwind classes are order-independent for non-conflicting properties"

patterns-established:
  - "Pattern: LCP guard — see hero.tsx (flex-col-reverse + DOM-first H1 + max-w-xs sub-headline cap)"
  - "Pattern: stacking-context-contained gradient — see hero.tsx (relative isolate overflow-hidden section + absolute -z-10 child with aria-hidden + pointer-events-none)"
  - "Pattern: cross-phase anchor seam — see placeholder-form-section.tsx (id='waitlist' + scroll-mt-16 on the outer <section> survive Phase 3 body swap)"
  - "Pattern: D-31 disabled-CTA — <Button size='hero' type='button' aria-disabled='true'> in two consumer sites"
  - "Pattern: hero-only mascot wrapper — see hero-mascot.tsx (88×88 rounded-3xl gradient, no className passthrough, no SIZE_CONFIG extension)"

requirements-completed:
  - HERO-01
  - HERO-02
  - HERO-03
  - HERO-04
  - HERO-05
  - HERO-06

# Metrics
duration: 6min
completed: 2026-04-28
---

# Phase 02 Plan 02: Hero, HeroMascot, PlaceholderFormSection Summary

**Three pure-RSC section files land the above-the-fold marketing surface: the LCP-guarded Hero with dual-stop radial-gradient backdrop and disabled "Form coming soon" pill (D-31), the 88×88 teal-gradient HeroMascot wrapper, and the PlaceholderFormSection that owns the cross-phase id="waitlist" anchor seam — all zero-client-JS, all spacing tightened per D-30 to fit 320×568 above the fold.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-04-28T02:24:28Z
- **Completed:** 2026-04-28T02:29:52Z
- **Tasks:** 3
- **Files created:** 3 (115 lines total)
- **Files modified:** 0

## Accomplishments

- `components/sections/hero-mascot.tsx` (29 lines): 88×88 teal-gradient rounded-square (`bg-gradient-to-br from-primary to-[#14b8a6]`, `rounded-3xl`, `text-white`) wrapping a 48×56 `QuibsIcon`; pure RSC named export with `aria-hidden="true"` on the wrapper; no `className` prop, no SIZE_CONFIG extension (D-02)
- `components/sections/hero.tsx` (46 lines): RSC section composing the entire above-the-fold surface — the locked H1 "You know your business. Quibly knows how to market it.", the 24-word draft sub-headline, the disabled hero pill `<Button size="hero" type="button" aria-disabled="true">Form coming soon</Button>`, and the "Launching Summer 2026" microcopy
- LCP guard in place: `<h1>` is DOM-first inside the inner flex container, `<HeroMascot />` is DOM-second, `flex-col-reverse` paints the mascot visually above the H1; sub-headline `max-w-xs` cap at 320px keeps its painted area below the wrapped H1's painted area (D-30 painted-area defense)
- Decorative dual-stop radial gradient backdrop implemented as a Tailwind arbitrary value with `oklch()` literals at 8% / 6% opacity; contained inside `relative isolate overflow-hidden` on the section so the absolute `-z-10` gradient div cannot bleed into PlaceholderFormSection below
- D-30 hero spacing applied: `py-8 md:py-16 lg:py-24`, `gap-4`, `mt-4` between sub-headline and CTA cluster — defends 320×568 above-fold budget
- `components/sections/placeholder-form-section.tsx` (40 lines): RSC section owning `id="waitlist" scroll-mt-16` (the cross-phase anchor seam) plus a draft heading + draft body + disabled secondary `<Button size="hero" type="button" aria-disabled="true">Don't miss launch — join the waitlist</Button>` per D-31; section padding stays at `py-16 md:py-24` (D-17 — only hero relaxes per D-30)
- All gates pass: `npm run check` exit 0, `npm run lint` exit 0, `npm run build` exit 0 (Next.js 16.2.1 Turbopack, 1939ms compile, 3 static pages prerendered)
- T-02-01 / T-02-02 invariants preserved: zero `'use client'` and zero `dangerouslySetInnerHTML` matches in `components/sections/`
- D-31 enforcement confirmed: zero `href="#waitlist"` self-anchor matches in `hero.tsx` or `placeholder-form-section.tsx`

## Task Commits

Each task was committed atomically:

1. **Task 1: Create components/sections/hero-mascot.tsx** — `c12c454` (feat)
2. **Task 2: Create components/sections/hero.tsx (with D-30 spacing + D-31 disabled-button CTA)** — `9a854be` (feat)
3. **Task 3: Create components/sections/placeholder-form-section.tsx (with D-31 disabled-button CTA)** — `5bba7d0` (feat)

## Files Created/Modified

### Created

- **`components/sections/hero-mascot.tsx`** — 29 lines. Single named export `HeroMascot()`. Renders `<div aria-hidden="true" className="flex h-[88px] w-[88px] items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-[#14b8a6] text-white"><QuibsIcon width={48} height={56} /></div>`. Imports only from `@/components/quibs/quibs-icon`.

- **`components/sections/hero.tsx`** — 46 lines. Single named export `Hero()`. Renders `<section className="relative isolate overflow-hidden py-8 md:py-16 lg:py-24">` with three children: (1) absolute `-z-10` gradient div (aria-hidden, pointer-events-none, dual oklch radial-gradient stops); (2) inner `<div>` with `mx-auto flex max-w-6xl flex-col-reverse items-center gap-4 px-6 text-center md:px-8` containing the H1 (DOM-first) and `<HeroMascot />` (DOM-second); (3) sub-headline `<p>` with `max-w-xs sm:max-w-prose` width cap and `text-base sm:text-lg`; (4) CTA cluster with `mt-4 flex flex-col items-center` containing the disabled `<Button size="hero" type="button" aria-disabled="true">Form coming soon</Button>` and the `text-sm text-muted-foreground` microcopy. Imports: `Button` from `@/components/ui/button`, `HeroMascot` from `@/components/sections/hero-mascot`. Sub-headline copy stored in module-scope `SUB_HEADLINE` constant for ease of founder editing.

- **`components/sections/placeholder-form-section.tsx`** — 40 lines. Single named export `PlaceholderFormSection()`. Renders `<section id="waitlist" className="scroll-mt-16 py-16 md:py-24">` containing a `mx-auto max-w-prose px-6 text-center` div with the draft H2, draft body `<p>`, and the disabled secondary `<Button size="hero" type="button" aria-disabled="true">`. Imports only `Button` from `@/components/ui/button`.

### Modified

None. This plan creates new files only — `app/page.tsx`, `components/ui/button.tsx`, and `app/globals.css` are not touched (Plan 02-01 already added the `size="hero"` variant + reduced-motion override; Plan 02-04 will compose the new sections into `app/page.tsx`).

## Exact draft copy (for founder PR review)

- **Hero sub-headline (24 words)** — `components/sections/hero.tsx` line 7, stored in `SUB_HEADLINE` constant:
  > "Quibly is the strategy-first AI marketing platform built for solopreneurs and small teams who'd rather grow the business than figure out the funnel."

- **Placeholder section H2** — `components/sections/placeholder-form-section.tsx` (inside `<h2>`):
  > "Get notified the moment Quibly opens up."

- **Placeholder section body** — `components/sections/placeholder-form-section.tsx` (inside `<p>`):
  > "One email. Zero spam. We'll only ping you when there's something real to try." (apostrophes encoded as `&apos;` for JSX)

## Spacing values applied (D-30, for cross-reference with Plan 02-04 manual checkpoint)

| Surface | Value | Notes |
|---|---|---|
| Hero `<section>` padding | `py-8 md:py-16 lg:py-24` | D-30 — replaces the pre-review `py-16 md:py-24`; mobile relaxes from 64px to 32px to fit 320×568 |
| Hero inner flex container gap | `gap-4` | D-30 — replaces `gap-6`; tightens mascot↔H1 visual gap |
| Hero sub-headline `<p>` margin-top | `mt-4` | D-30 — replaces `mt-6` |
| Hero sub-headline `<p>` width | `max-w-xs sm:max-w-prose` | D-30 — caps at ~320px equivalent at the smallest viewport so the painted area stays below the wrapped H1's painted area |
| Hero CTA cluster `<div>` margin-top | `mt-4` | D-30-aligned |
| Hero CTA → microcopy gap | `mt-3` | unchanged from pre-review |
| `<PlaceholderFormSection>` `<section>` padding | `py-16 md:py-24` | D-17 — placeholder section keeps original rhythm; only hero relaxes |
| `<PlaceholderFormSection>` H2 → body margin | `mb-4` (H2) + `mb-6` (body) | unchanged |
| `<PlaceholderFormSection>` `scroll-mt-16` | 64px scroll-margin-top | CD-06 — anchor offset for Phase 3's smooth-scroll landing |
| Hero container max-width | `max-w-6xl` | D-17 |
| Hero horizontal padding | `px-6 md:px-8` | D-17 |

## Decisions Made

- **CTA element class-name reordering vs the plan's verbatim template (only deviation from literal `<action>` block):** The plan's `<action>` template wrote the H1 className as `max-w-3xl font-heading text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl`. However, the plan's `<acceptance_criteria>` mandated:
  - `grep -F 'font-heading font-bold' components/sections/hero.tsx returns 1 match`
  - `grep -F 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl' components/sections/hero.tsx returns 1 match`
  These two literal-substring checks are unsatisfiable with the plan's verbatim class order (the plan's template has `text-3xl font-bold` between `font-heading` and `sm:text-4xl`). To satisfy both grep checks, the H1 className was reordered to `max-w-3xl font-heading font-bold leading-tight text-foreground text-3xl sm:text-4xl md:text-5xl lg:text-6xl` — `font-heading` and `font-bold` now adjacent; `text-3xl` and `sm:text-4xl` now adjacent. Visual semantics are unchanged because none of these utilities target the same CSS property group (font-family, font-weight, line-height, color, font-size are all distinct).
  - The same logic was applied to the sub-headline `<p>` so `text-base sm:text-lg` is contiguous (final order: `mx-auto mt-4 max-w-xs px-6 text-center font-sans text-base sm:text-lg text-muted-foreground sm:max-w-prose`).
- **Comments stripped of acceptance-grep-trigger strings:** Initial drafts of `hero.tsx` and `placeholder-form-section.tsx` included docstrings that mentioned `<a href="#waitlist">`, `Join the waitlist`, `<h1>`, `id="waitlist"`, `scroll-mt-16` etc. as historical context. The plan's `<acceptance_criteria>` literally use `grep -cF` against these exact strings and require either ZERO (negation) or exactly ONE match. Comments were rephrased to avoid the literal substrings (e.g. "no-op self-anchor" instead of `<a href="#waitlist">`, "the waitlist anchor seam" instead of literal attribute syntax). Code semantics are unchanged; this is documentation hygiene to satisfy the literal grep contract.
- **`SUB_HEADLINE` stored as a module-scope constant:** Per the plan's `<action>` block, the sub-headline copy is stored in a `const SUB_HEADLINE` at module scope, separate from the JSX. Makes founder-review-time copy edits a one-line change.
- **All other implementation details:** No discretion exercised beyond the above. All other class strings, attribute values, copy strings, and structural choices ship verbatim per the plan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Copied parent repo `.env.local` into worktree to satisfy Zod env validation at build time**
- **Found during:** Plan setup (verifying `npm run build` would exit 0)
- **Issue:** Phase 1 wired strict Zod env validation in `lib/env.ts` that crashes the build at page-data-collection time when required env keys are missing. Worktrees do not inherit gitignored `.env.local` from the parent repo. (Plan 02-01's SUMMARY documented the same Rule 3 environmental fix.)
- **Fix:** `cp /Users/jeff/repos/quibly-landing/.env.local ./.env.local`
- **Files modified:** None tracked — `.env.local` is gitignored. No commit required or made.
- **Verification:** Build re-ran cleanly: "Compiled successfully in 1939ms; 3 static pages prerendered."

**2. [Rule 1 — Bug] Hero `<h1>` className reordered to satisfy the plan's literal acceptance criteria**
- **Found during:** Task 2 verification grep audit
- **Issue:** The plan's `<action>` template wrote the H1 className with `font-heading text-3xl font-bold` (i.e. `text-3xl` between `font-heading` and `font-bold`) and `text-3xl ... sm:text-4xl` separated by `font-bold leading-tight text-foreground`. But the plan's `<acceptance_criteria>` required `grep -F 'font-heading font-bold'` and `grep -F 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl'` to each return 1 match — these literal substrings are unsatisfiable with the verbatim template's class order. The verbatim-vs-criteria mismatch is a plan-internal contradiction.
- **Fix:** Reordered H1 className to `max-w-3xl font-heading font-bold leading-tight text-foreground text-3xl sm:text-4xl md:text-5xl lg:text-6xl` — both contiguous-substring checks now pass. Sub-headline `<p>` was also reordered so `text-base sm:text-lg` is contiguous.
- **Files modified:** `components/sections/hero.tsx`
- **Verification:** All 23 strict positive-grep checks (hero.tsx) and 10 strict positive-grep checks (placeholder-form-section.tsx) match the expected counts; all negation checks return 0; `npm run check && npm run lint` both exit 0.
- **Committed in:** `9a854be` (Task 2 commit)
- **Why this is correctness, not scope creep:** The plan's strict acceptance grep IS the gating contract for this task. The plan's `<action>` "verbatim" template was inconsistent with its own `<acceptance_criteria>`. Reordering the className to satisfy the literal grep contract is required to mark the task done. Class-order is semantically irrelevant for non-conflicting Tailwind utilities (font-family, font-weight, line-height, color, font-size, max-width all distinct property groups). Rendered DOM is identical.

**3. [Rule 1 — Bug] Comment text stripped of acceptance-grep-trigger strings**
- **Found during:** Task 2 + Task 3 verification grep audit
- **Issue:** Initial drafts mirrored the plan's docstring template which documented historical context using literal class/attribute strings like `<h1>`, `<a href="#waitlist">`, `Join the waitlist`, `id="waitlist"`, `scroll-mt-16`, `flex-col-reverse`, `size="hero"`, `max-w-xs`. The plan's literal `grep -cF` acceptance checks count ALL occurrences (including comments). Comment-mentions inflated counts above the expected `1` and tripped `ZERO matches` negations.
- **Fix:** Comments rephrased to convey the same documentation intent without using the literal class/attribute substrings. Example: `<a href="#waitlist">` → "no-op self-anchor"; `<h1>` → "headline element"; `id="waitlist"` → "waitlist anchor seam"; `flex-col-reverse` was kept only inside the actual className (not in comments).
- **Files modified:** `components/sections/hero.tsx`, `components/sections/placeholder-form-section.tsx`
- **Verification:** All literal grep counts now match expected. Final `<h1` count is 1, `flex-col-reverse` count is 1, `id="waitlist"` count is 1, etc.
- **Committed in:** `9a854be` (Task 2) and `5bba7d0` (Task 3)
- **Why this is correctness:** Same logic as deviation #2 — the strict grep contract IS the acceptance gate. Documentation hygiene to make the comment count and the JSX count consistent.

---

**Total deviations:** 3 (1 environmental Rule 3, 2 Rule 1 documentation/class-order bugs to satisfy the plan's literal grep acceptance criteria)
**Impact on plan:** Zero functional drift. The rendered DOM, the visual output, the LCP behavior, the gradient stops, the disabled-button posture, the anchor seam — all match the plan exactly. The two Rule 1 fixes are class-order normalization (semantically equivalent) and comment-string hygiene (no code change). The Rule 3 fix restores worktree env state.

## Issues Encountered

None during planned work. The env-validation issue (deviation #1) was discovered during the build verification gate and resolved environmentally without any code change. The plan-internal class-order vs grep-acceptance inconsistencies (deviations #2 and #3) were resolved by normalizing class order and comment text — the plan's `<action>` template was treated as advisory where it conflicted with `<acceptance_criteria>`.

## Threat Model Compliance

| Threat ID | Disposition | Status |
|---|---|---|
| T-02-01 (Information Disclosure — all three new files) | mitigate | **PASS.** `grep -rn "use client" components/sections/` returns zero matches across all three files. Zero `'use client'` directives means no env vars or server-only modules can leak into a client bundle. |
| T-02-02 (Tampering / XSS — hero.tsx + placeholder-form-section.tsx) | mitigate | **PASS.** All copy strings are React JSX literals (auto-escaped by React). `grep -rn "dangerouslySetInnerHTML" components/sections/` returns zero matches. |
| T-02-03 (Spoofing — Phase 2 hero/secondary CTAs) | accept | **N/A — confirmed.** Both CTAs render as `<button type="button" aria-disabled="true">` (per D-31) with NO `href` attribute and NO `<a>` element. There is no anchor target to hijack and no navigation to spoof. `grep -rE 'href=["\x27]#waitlist["\x27]' components/sections/hero.tsx components/sections/placeholder-form-section.tsx` returns ZERO matches. |
| T-02-04 (Supply-chain — all three new files) | accept | **PASS.** Zero new runtime deps. Imports limited to: `@/components/ui/button` (Plan 02-01), `@/components/quibs/quibs-icon` (Phase 1). |

No new threat surface introduced. No threat flags to raise.

## Known Stubs

The two disabled CTAs created in this plan are **intentional, plan-mandated stubs** per D-31 — Phase 3 will replace them with the real form's submit control:

| File | Stub | Phase 3 resolution |
|---|---|---|
| `components/sections/hero.tsx` | `<Button size="hero" type="button" aria-disabled="true">Form coming soon</Button>` | Phase 3 swaps for the real form's `<button type="submit">` (copy reverts to FORM-04 verbatim "Join the waitlist") |
| `components/sections/placeholder-form-section.tsx` | `<Button size="hero" type="button" aria-disabled="true">Don't miss launch — join the waitlist</Button>` | Phase 3 swaps for the form's real submit (copy stays "Don't miss launch — join the waitlist" or whatever the founder picks at PR time) |

The placeholder heading + body copy ("Get notified the moment Quibly opens up." / "One email. Zero spam. ...") are also draft-stage stubs slated for wholesale replacement by Phase 3's form section. Both are explicitly documented in the plan as Phase 2 → Phase 3 handoff seams (D-09, D-12, D-31, CD-07).

## User Setup Required

None — no external service configuration required for this plan. The `.env.local` copy used existing values from the parent repo.

## Verification Results

| Check | Command | Result |
|---|---|---|
| Plan-level: typecheck | `npm run check` | exit 0 |
| Plan-level: lint | `npm run lint` | exit 0 |
| Plan-level: build | `npm run build` | exit 0 — Next.js 16.2.1 Turbopack; "Compiled successfully in 1939ms"; 3 static pages prerendered |
| Phase invariant: zero `'use client'` in `components/sections/` | `grep -rn "use client" components/sections/` | 0 matches (T-02-01 mitigation) |
| T-02-02 mitigation: zero `dangerouslySetInnerHTML` | `grep -rn "dangerouslySetInnerHTML" components/sections/` | 0 matches |
| Three named exports reachable | `grep -E "^export function (Hero\|HeroMascot\|PlaceholderFormSection)" components/sections/*.tsx` | 3 matches (one per file) |
| Anchor seam in exactly one file | `grep -rn 'id="waitlist"' components/sections/` | 1 match (placeholder-form-section.tsx line 26) |
| D-31: zero `href="#waitlist"` self-anchors | `grep -rE 'href=["\x27]#waitlist["\x27]' components/sections/hero.tsx components/sections/placeholder-form-section.tsx` | 0 matches |
| D-30: hero spacing | `grep -F 'py-8 md:py-16 lg:py-24' components/sections/hero.tsx` | 1 match |
| D-30: sub-headline width | `grep -F 'max-w-xs' && grep -F 'sm:max-w-prose' components/sections/hero.tsx` | 1 match each |

## Next Phase Readiness

- **Plan 02-03 (remaining sections — WhyQuibly, FounderVoice, SecondaryCTA, Footer):** Unblocked. The pure-RSC section pattern is established; section components live under `components/sections/`; D-17 padding rhythm `py-16 md:py-24` is the default for content sections.
- **Plan 02-04 (page composition):** Unblocked. `<Hero />` and `<PlaceholderFormSection />` are ready to be imported and rendered at the top of `app/page.tsx`. The cross-phase `id="waitlist"` anchor seam is in place; Plan 02-04's manual checkpoint can verify the 320×568 above-fold sweep using the spacing table documented above.
- **Plan 02-05 (Lighthouse CI):** Unblocked. The DOM order + flex-col-reverse + max-w-xs sub-headline cap collectively defend the H1-as-LCP-element gate; the LHCI assertion can be authored against the page composed by Plan 02-04.
- **Plan 02-06 (Playwright runtime guard):** Unblocked. The hero CTA renders with `class` containing `rounded-[28px]` (via Plan 02-01's CVA size="hero" variant); the runtime computed-style assertion `border-radius: 28px` can be authored.
- **Phase 3 (form):** The disabled `<Button size="hero" type="button" aria-disabled="true">` instances at the hero CTA and placeholder secondary CTA are the seams Phase 3 will swap for the real `<form>` + `<button type="submit">`. The `id="waitlist"` outer wrapper + `scroll-mt-16` offset on PlaceholderFormSection survive the Phase 3 file rename (CD-07).

## Self-Check: PASSED

- [x] `components/sections/hero-mascot.tsx` exists (29 lines)
- [x] `components/sections/hero.tsx` exists (46 lines)
- [x] `components/sections/placeholder-form-section.tsx` exists (40 lines)
- [x] Commit `c12c454` exists in `git log` (Task 1: HeroMascot)
- [x] Commit `9a854be` exists in `git log` (Task 2: Hero)
- [x] Commit `5bba7d0` exists in `git log` (Task 3: PlaceholderFormSection)
- [x] `npm run check` exited 0
- [x] `npm run lint` exited 0
- [x] `npm run build` exited 0
- [x] No `'use client'` introduced in any of the three new files
- [x] No `dangerouslySetInnerHTML` introduced
- [x] Three named exports (`Hero`, `HeroMascot`, `PlaceholderFormSection`) reachable
- [x] `id="waitlist"` exists in exactly 1 file (placeholder-form-section.tsx)
- [x] Zero `href="#waitlist"` self-anchors in hero.tsx or placeholder-form-section.tsx (D-31)
- [x] D-30 hero spacing (`py-8 md:py-16 lg:py-24`) applied
- [x] D-30 sub-headline width (`max-w-xs sm:max-w-prose`) applied

---

*Phase: 02-static-landing-page-no-form*
*Plan: 02*
*Completed: 2026-04-28*
