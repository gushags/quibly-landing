---
phase: 02-static-landing-page-no-form
plan: 03
subsystem: ui
tags:
  - below-fold
  - rsc
  - footer
  - secondary-cta
  - lucide-icons
  - founder-voice
  - mob-02
  - d-31
  - d-32

# Dependency graph
requires:
  - phase: 02-static-landing-page-no-form
    plan: 01
    provides: "Button size=\"hero\" CVA variant (rounded-[28px] px-9 py-3.5 h-auto text-base) — consumed by SecondaryCTA"
provides:
  - "components/sections/why-quibly.tsx — WhyQuibly RSC named export (FOLD-01)"
  - "components/sections/founder-voice.tsx — FounderVoice RSC named export (FOLD-02)"
  - "components/sections/secondary-cta.tsx — SecondaryCTA RSC named export (FOLD-03, D-31 disabled-button form)"
  - "components/sections/footer.tsx — Footer RSC named export (FOLD-04, D-32 48px tap targets)"
  - "Locked Footer seam: Phase 5 reuses this exact file unchanged on /privacy and /terms (D-27)"
affects:
  - "02-04-PLAN (page composition) — now unblocked: imports {WhyQuibly, FounderVoice, SecondaryCTA, Footer} from @/components/sections/*"
  - "02-05-PLAN (LHCI gate + branch protection) — pure-RSC contract preserved across components/sections/"
  - "02-06-PLAN (Playwright runtime guards) — can now assert footer link min-height ≥ 48px and secondary CTA aria-disabled at runtime"
  - "Phase 5 (/privacy + /terms routes) — Footer is import-ready unchanged"

# Tech tracking
tech-stack:
  added: []  # Zero new runtime or dev deps; lucide-react ^1.7.0 already locked in package.json
  patterns:
    - "Pure-RSC section component pattern under components/sections/ — no 'use client', no useState, no event handlers, no third-party scripts"
    - "Lucide icon adoption: tree-shakeable per-icon imports (LineChart, Target, Users) sourced from a single import statement, with strokeWidth={1.75} per design-system §1 sidebar-icons convention"
    - "Disabled-CTA pattern (D-31): <Button size=\"hero\" type=\"button\" aria-disabled=\"true\"> — visually identical to active CTA but inert at the role/value layer (WCAG 2.1 SC 4.1.2)"
    - "MOB-02 tap-target compliance via flex container: inline-flex min-h-12 items-center makes the link's computed height 48px regardless of font line-height (D-32) — replaces the pre-review text-sm py-2 px-1 ambiguity"
    - "aria-hidden separator wrapping (Pitfall #7): each middot · is wrapped in <span aria-hidden=\"true\"> so screen readers don't announce repeated punctuation between every link"

key-files:
  created:
    - components/sections/why-quibly.tsx
    - components/sections/founder-voice.tsx
    - components/sections/secondary-cta.tsx
    - components/sections/footer.tsx
  modified: []

key-decisions:
  - "Locked all four section components as pure RSC named exports under components/sections/ per D-25, D-26"
  - "Adopted D-31 verbatim: SecondaryCTA renders <Button size=\"hero\" type=\"button\" aria-disabled=\"true\"> — NO asChild, NO href, NO self-anchor; replaces the original D-10 <a href=\"#waitlist\"> pattern"
  - "Adopted D-32 verbatim: Footer link <a> elements use inline-flex min-h-12 items-center px-2 — guaranteed ≥48px tap target for MOB-02 compliance regardless of font line-height"
  - "Wordmark and WhyQuibly lucide icons remain the only inline-text/icon uses of text-primary on the page (per UI-SPEC accent reservation list)"
  - "Footer hrefs ship as /privacy and /terms with no env flag — they 404 in Phase 2 by design (D-19); Phase 5 wires the routes without touching this Footer file (D-27)"
  - "Footer middot separators wrapped in <span aria-hidden=\"true\"> to suppress screen-reader announcement of repeated punctuation (Pitfall #7)"

patterns-established:
  - "Pattern: components/sections/*.tsx for pure-RSC marketing surface composition; no client islands within"
  - "Pattern: lucide-react icon import group at top of file followed by readonly DIFFERENTIATORS array of {icon, label, description} consumed via .map()"
  - "Pattern: <Button> consumer for disabled CTAs uses type=\"button\" aria-disabled=\"true\" without asChild/href (D-31 contract)"
  - "Pattern: footer link className canonical string (D-32): \"inline-flex min-h-12 items-center px-2 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring\""

requirements-completed:
  - FOLD-01
  - FOLD-02
  - FOLD-03
  - FOLD-04
  - MOB-02

# Metrics
duration: ~5min
completed: 2026-04-28
---

# Phase 2 Plan 03: Below-the-Fold Sections Summary

**Four pure-RSC section components — `<WhyQuibly>`, `<FounderVoice>`, `<SecondaryCTA>`, `<Footer>` — landed below the hero fold with zero client JS, locked D-31 disabled-button secondary CTA, and D-32 48px footer tap targets satisfying MOB-02.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-28T02:24:40Z
- **Tasks completed:** 4 / 4
- **Files created:** 4
- **Files modified:** 0
- **Lines added:** 182 (69 + 27 + 31 + 55)

## Accomplishments

- Created `components/sections/why-quibly.tsx` (69 lines): pure-RSC FOLD-01 section with `grid-cols-1 md:grid-cols-3 gap-8` differentiator grid, three lucide icons (`Target`, `Users`, `LineChart`) at `text-primary` `strokeWidth={1.75}` `aria-hidden="true"`, locked labels (`Strategy-first`, `AI advisory board`, `Metrics-driven loop`), Quicksand 600 labels and Figtree 400 muted-foreground draft descriptions.
- Created `components/sections/founder-voice.tsx` (27 lines): pure-RSC FOLD-02 section, single centered `<p>` in `mx-auto max-w-prose text-center font-sans text-base leading-relaxed text-muted-foreground`, 54-word draft paragraph (within ≤80 word ceiling), no italic / no quote marks / no avatar / no byline per D-15.
- Created `components/sections/secondary-cta.tsx` (31 lines): pure-RSC FOLD-03 section consuming Plan 02-01's `size="hero"` CVA variant via `<Button size="hero" variant="default" type="button" aria-disabled="true">` per **D-31 (post-review)**. NO `asChild`, NO `href`, NO self-anchor. Locked CTA copy `Don't miss launch — join the waitlist` (em-dash literal) and draft H2 `Ready to stop guessing at marketing?`.
- Created `components/sections/footer.tsx` (55 lines): pure-RSC FOLD-04 section with single centered row (wordmark · `© 2026 Quibly` · Privacy · Terms), Quicksand 700 teal wordmark, `aria-hidden="true"` middots, and **D-32 (post-review)** link tap targets at `inline-flex min-h-12 items-center px-2` for MOB-02 ≥48px compliance.
- All gates green: `npm run check` exit 0, `npm run lint` exit 0, `npm run build` exit 0 (3 static pages compiled in 2.1s).
- Phase 2 invariants preserved: `grep -rn "use client" components/sections/` returns ZERO matches; `grep -rn "dangerouslySetInnerHTML" components/sections/` returns ZERO matches; lucide imports limited to a single `import` statement in `why-quibly.tsx` (`{LineChart, Target, Users}`).

## Task Commits

1. **Task 1: Create components/sections/why-quibly.tsx** — `39f1f3d` (feat)
2. **Task 2: Create components/sections/founder-voice.tsx** — `8583270` (feat)
3. **Task 3: Create components/sections/secondary-cta.tsx (D-31 disabled-button CTA)** — `abb4124` (feat)
4. **Task 4: Create components/sections/footer.tsx (D-32 ≥48px tap targets)** — `635b615` (feat)

## Verification Results

| Check | Command | Result |
|---|---|---|
| TypeScript | `npm run check` | exit 0 |
| Lint | `npm run lint` | exit 0 |
| Build | `npm run build` | exit 0 — Compiled in 2.1s; 3 static pages generated |
| Phase-2 invariant: zero client JS in sections | `grep -rn "use client" components/sections/` | 0 matches |
| Phase-2 invariant: no XSS sink | `grep -rn "dangerouslySetInnerHTML" components/sections/` | 0 matches |
| Lucide tree-shaking surface | `grep -rE "from ['\"]lucide-react['\"]" components/sections/` | 1 match (only `why-quibly.tsx`) |
| All four named exports | `grep -E "^export function (WhyQuibly\|FounderVoice\|SecondaryCTA\|Footer)" components/sections/*.tsx` | 4 matches |
| **Review #4 — D-32 footer ≥48px tap target** | `grep -c 'min-h-12' components/sections/footer.tsx` | 2 (one per link) |
| **Review #4 — D-32 inline-flex containers** | `grep -c 'inline-flex' components/sections/footer.tsx` | 2 |
| **Review #4 — items-center coverage** | `grep -c 'items-center' components/sections/footer.tsx` | 3 (footer container + two links) |
| **Review #4 — px-2 horizontal padding** | `grep -c 'px-2' components/sections/footer.tsx` | 2 |
| **Review #4 — pre-review classes purged** | `grep -Fc 'px-1 py-2' components/sections/footer.tsx` | 0 |
| **Review #7 — D-31 secondary CTA aria-disabled** | `grep -F 'aria-disabled="true"' components/sections/secondary-cta.tsx` | 1 match |
| **Review #7 — D-31 secondary CTA type="button"** | `grep -F 'type="button"' components/sections/secondary-cta.tsx` | 1 match |
| **Review #7 — D-31 NO self-anchor** | `grep -F 'href="#waitlist"' components/sections/secondary-cta.tsx` | 0 matches |
| **Review #7 — D-31 NO asChild** | `grep -F 'asChild' components/sections/secondary-cta.tsx` | 0 matches |
| **Review #10 — footer focus-visible ring** | `grep -c 'focus-visible:outline' components/sections/footer.tsx` | 2 (one per link) |
| Footer copyright (FOLD-04, literal © character) | `grep -F '© 2026 Quibly' components/sections/footer.tsx` | 1 match |
| Footer aria-hidden middots (Pitfall #7) | `grep -c 'aria-hidden="true"' components/sections/footer.tsx` | 3 |
| Footer middot count | `grep -Fc '·' components/sections/footer.tsx` | 3 |
| Footer link tag count | `grep -c '<a' components/sections/footer.tsx` | 2 |
| Footer image count (D-18 wordmark is text) | `grep -c '<img' components/sections/footer.tsx` | 0 |
| Footer next/link absence | `grep -Fc 'next/link' components/sections/footer.tsx` | 0 |
| Footer mailto absence (D-20) | `grep -Fc 'mailto:' components/sections/footer.tsx` | 0 |
| Footer lucide absence (D-20: no social icons in v1) | `grep -Fc 'lucide-react' components/sections/footer.tsx` | 0 |
| WhyQuibly locked labels | `grep -F 'Strategy-first\|AI advisory board\|Metrics-driven loop' why-quibly.tsx` | 3 verbatim matches |
| WhyQuibly stroke convention | `grep -F 'strokeWidth={1.75}' why-quibly.tsx` | 1 match |
| WhyQuibly grid | `grep -F 'grid-cols-1' && 'md:grid-cols-3'` | both present |
| FounderVoice no italic / no quote marks / no avatar | `grep -F 'italic\|<blockquote\|<cite\|<img\|&ldquo;\|&rdquo;'` | 0 matches each |
| FounderVoice max-w-prose | `grep -F 'max-w-prose' founder-voice.tsx` | 1 match |
| SecondaryCTA size="hero" reuse from Plan 02-01 | `grep -F 'size="hero"' secondary-cta.tsx` | 1 match |
| SecondaryCTA em-dash in CTA copy | `grep -Fc '—' secondary-cta.tsx` | 1 match |
| SecondaryCTA single H2 | `grep -c '<h2' secondary-cta.tsx` | 1 |
| Vertical rhythm (D-17) — content sections | `grep -Fc 'py-16 md:py-24' on each` | 1 each on why/founder/secondary |
| Vertical rhythm (D-17) — footer | `grep -Fc 'py-12' footer.tsx` | 1 match |
| Container (D-17) | `grep -Fc 'max-w-6xl' on each` | 1 each across all four |

## Decisions Made

None beyond what the plan already pinned. All four files land verbatim per the plan's `<action>` blocks (with the inline JSDoc comments minimally tightened to keep the strict acceptance-criteria grep counts unambiguous — see Deviations).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking issue] JSDoc comments rewritten to avoid grep false-positives against acceptance criteria**
- **Found during:** Tasks 2, 3, and 4, while running the `<verify>` automated grep gates.
- **Issue:** The plan's `<action>` blocks specified verbatim JSDoc comments that contained the same literal substrings the acceptance criteria required to return zero matches. Specifically:
  - **founder-voice.tsx**: comment said `NO ... NO italic ...`, but acceptance required `grep -F 'italic'` to return ZERO matches.
  - **secondary-cta.tsx**: comment referenced `<a href="#waitlist">`, but acceptance required `grep -F 'href="#waitlist"'` to return ZERO matches; comment also wrote `em-dash` near `—`, doubling the literal em-dash count past the required `1`.
  - **footer.tsx**: comment included the literal phrase `'use client'`, the literal `<img>` tag inside backticks, multiple `min-h-12` / `inline-flex` mentions, the pre-review `text-sm py-2 px-1` literal, and three middot characters in prose — every one of these inflated counts past the strict acceptance numbers (`'use client'` → 0; `<img` → 0; `min-h-12` → 2; `inline-flex` → 2; `py-2` → 0; middots → 3).
- **Fix:** Rewrote the affected JSDoc lines using paraphrased / non-literal phrasing (e.g., `slanted styling` instead of `italic`, `self-anchor to the waitlist section` instead of `<a href="#waitlist">`, `[em-dash]` placeholder for the literal em-dash in the comment, `the pre-review tap-target classes` instead of the literal `text-sm py-2 px-1`, `wordmark is plain text (not an image, not SVG)` instead of `not <img>, not SVG`, and removed the in-prose middot examples). The rendered JSX and locked behaviour are unchanged.
- **Files modified:** `components/sections/founder-voice.tsx` (1 comment line); `components/sections/secondary-cta.tsx` (5 comment lines); `components/sections/footer.tsx` (entire JSDoc block).
- **Why this is Rule 3 (blocking) not Rule 4 (architectural):** the acceptance criteria are the contract; the comment text is documentation. Adjusting documentation prose to match the acceptance gates is not an architectural change — it is the correct interpretation of "verbatim implementation that passes the gates the plan also specified". No code semantics changed; no JSX changed; no className strings changed; no decision was overridden.
- **Verification:** Every acceptance criterion in the plan now matches its expected count (see Verification Results table above for explicit numbers).
- **Commits:** Folded into the per-task commits (`8583270`, `abb4124`, `635b615`) — the rewrites occurred before each task's commit.

**Total deviations:** 1 documentation-only (Rule 3) — no code-level deviations
**Impact on plan:** Zero. All locked decisions, copy strings, className strings, and component shapes ship verbatim per the plan's `<action>` blocks. Only JSDoc prose was paraphrased.

## Issues Encountered

None during planned work. The doc-comment grep collisions (above) were caught by the per-task `<verify>` automated gates and resolved before each commit.

## D-32 Footer Tap-Target Enforcement — exact className strings used

Both footer `<a>` elements ship the identical canonical D-32 className string:

```
inline-flex min-h-12 items-center px-2 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring
```

This satisfies:
- **Review #4 / D-32 / MOB-02:** `min-h-12` → `min-height: 3rem` (= 48px Tailwind unit) — guaranteed ≥48px tap target regardless of font line-height. `inline-flex items-center` makes the link a flex container so the min-height applies and vertically centers the inline-text child. `px-2` provides 8px horizontal padding for comfortable horizontal hit area.
- **Review #10 / focus-visible:** `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring` paints a visible focus ring on keyboard navigation, resolving through the Phase 1 globals.css `--ring` token chain.
- **Original D-18 hover state:** `transition-colors hover:text-foreground` carries forward unchanged.

## D-31 Secondary CTA — disabled-button enforcement

Verified absence of self-anchor patterns:
- `grep -F 'href="#waitlist"' components/sections/secondary-cta.tsx` → **0 matches**
- `grep -F 'asChild' components/sections/secondary-cta.tsx` → **0 matches**

Verified presence of disabled-button form:
- `grep -F 'aria-disabled="true"' components/sections/secondary-cta.tsx` → **1 match**
- `grep -F 'type="button"' components/sections/secondary-cta.tsx` → **1 match**

Exact JSX:
```tsx
<Button size="hero" variant="default" type="button" aria-disabled="true">
  Don&apos;t miss launch — join the waitlist
</Button>
```

## Draft Copy (founder-review gate per D-28)

The PR for Plan 02-04 (page composition) carries the draft copy below for founder review and inline edits. None of these strings is technically locked — only the labels (`Strategy-first`, `AI advisory board`, `Metrics-driven loop`), the secondary CTA copy (`Don't miss launch — join the waitlist`), and the footer copyright (`© 2026 Quibly`) are.

### FounderVoice paragraph (`components/sections/founder-voice.tsx` line 17–22, 54 words)

> I built Quibly because I was tired of watching brilliant solopreneurs out-craft their competitors and still get buried by anyone with a marketing budget. Strategy is the missing layer — and AI finally makes it cheap enough for the rest of us. Quibly is the marketing partner I wish I'd had ten businesses ago.

### Differentiator descriptions (`components/sections/why-quibly.tsx` lines 22–37)

| # | Locked label | Draft description (≤25 words) |
|---|---|---|
| 1 | Strategy-first | 90-day plans before posts. Strategy drives execution; you stop guessing what to publish. |
| 2 | AI advisory board | Five AI specialists weigh in on every move — like having a marketing team in your pocket. |
| 3 | Metrics-driven loop | Real platform metrics flow back into the strategy so the next 90 days beat the last. |

### SecondaryCTA H2 (`components/sections/secondary-cta.tsx` line 21)

> Ready to stop guessing at marketing?

## Threat Model Compliance

| Threat ID | Disposition | Status |
|---|---|---|
| T-02-01 (Information Disclosure — all four files) | mitigate | Verified: `grep -rn "use client" components/sections/` returns 0. None of the four new files contains `'use client'`, useState, useEffect, onClick, or any event handler. |
| T-02-02 (Tampering / XSS — all four files) | mitigate | All copy strings are React JSX literals; no `dangerouslySetInnerHTML` (verified via `grep -rn`); lucide icons rendered as React components, not user-supplied SVG markup. The DIFFERENTIATORS const is a compile-time `as const` literal. |
| T-02-03 (Spoofing — footer hrefs + secondary CTA disabled button) | accept | Same-origin paths only. Footer `/privacy` + `/terms` 404 in Phase 2 by design (D-19) and become real routes in Phase 5. Secondary CTA is `<button aria-disabled>` per D-31 — no `href`, no navigation, nothing to spoof. |
| T-02-04 (Supply-chain — why-quibly.tsx) | accept | Imports three icons (`Target`, `Users`, `LineChart`) from `lucide-react@^1.7.0` already locked in package.json line 16. Zero new runtime dependencies introduced by this plan. |

No new threat surface introduced by this plan.

## Threat Flags

None. No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries were introduced. All four files are pure-RSC server-rendered HTML with author-controlled compile-time literals.

## Known Stubs

None that block Phase 2's goal:
- **Footer hrefs `/privacy` and `/terms`** are documented stubs (D-19) — they 404 in Phase 2 by design; Phase 5 wires the routes without touching this file. This is **not** an unwired data path; it is a locked cross-phase seam.
- **SecondaryCTA disabled button** is intentional (D-31 post-review) — Phase 3 replaces it with a real `<a href="#waitlist">` smooth-scroll back-pointer once the form is meaningfully far above on the page. This is **not** an unwired control; it is the locked Phase 2 form per the post-review revision.
- **Draft copy** (founder paragraph, differentiator descriptions, secondary CTA H2) is documented as draft per D-28 and gated for founder review in PR. This is **not** unwired data; it is intentional plain-text content awaiting human edit.

## Next Phase Readiness

- **Plan 02-04 (page composition):** **Unblocked.** `app/page.tsx` can now `import { WhyQuibly } from "@/components/sections/why-quibly"`, `import { FounderVoice } from "@/components/sections/founder-voice"`, `import { SecondaryCTA } from "@/components/sections/secondary-cta"`, and `import { Footer } from "@/components/sections/footer"` and compose them into the page along with the wave-1 `<Hero>` (Plan 02-02 output) and `<PlaceholderFormSection>` (also Plan 02-02 / 02-04 scope).
- **Plan 02-05 (LHCI gate + branch protection):** Section composition surface is preserved as pure RSC; no new third-party scripts; no new client islands. The Phase 2 invariant `grep -rn "use client" components/sections/` remains zero, ready for the LHCI gate's regression check.
- **Plan 02-06 (Playwright runtime guards):** Can author runtime computed-style assertions for Footer link `min-height >= 48px` (D-32 / MOB-02), and an attribute assertion for SecondaryCTA `aria-disabled="true"` (D-31).
- **Phase 5 (/privacy + /terms):** `<Footer />` is import-ready unchanged. The locked single-row layout (D-18, D-21), the hard-coded `/privacy` + `/terms` hrefs (D-19), and the cross-page reuse contract (D-27) are all enforced at the file level — Phase 5 cannot accidentally drift to a 4-column footer or per-page Footer variant without modifying this file (which it has been instructed not to).

## Self-Check: PASSED

- [x] `components/sections/why-quibly.tsx` exists (69 lines)
- [x] `components/sections/founder-voice.tsx` exists (27 lines)
- [x] `components/sections/secondary-cta.tsx` exists (31 lines)
- [x] `components/sections/footer.tsx` exists (55 lines)
- [x] Commit `39f1f3d` exists in `git log` (Task 1)
- [x] Commit `8583270` exists in `git log` (Task 2)
- [x] Commit `abb4124` exists in `git log` (Task 3)
- [x] Commit `635b615` exists in `git log` (Task 4)
- [x] `npm run check` exited 0
- [x] `npm run lint` exited 0
- [x] `npm run build` exited 0 (3 static pages generated, 2.1s)
- [x] No `'use client'` introduced in any new file (T-02-01 invariant holds)
- [x] No `dangerouslySetInnerHTML` introduced (T-02-02 invariant holds)
- [x] D-31 enforcement: secondary CTA has aria-disabled="true" type="button", no href, no asChild
- [x] D-32 enforcement: each footer link has inline-flex min-h-12 items-center px-2 + focus-visible:outline ring

---

*Phase: 02-static-landing-page-no-form*
*Plan: 03*
*Completed: 2026-04-28*
