---
phase: 02-static-landing-page-no-form
plan: 04
subsystem: ui
tags:
  - page-composition
  - rsc
  - playwright
  - above-fold-assertion
  - lcp-defense
  - tap-target
  - focus-visible
  - human-verify

# Dependency graph
requires:
  - phase: 02-static-landing-page-no-form
    plan: 01
    provides: "Button size=\"hero\" CVA variant; @media (prefers-reduced-motion: reduce) scroll-behavior override"
  - phase: 02-static-landing-page-no-form
    plan: 02
    provides: "Hero, HeroMascot, PlaceholderFormSection RSC named exports"
  - phase: 02-static-landing-page-no-form
    plan: 03
    provides: "WhyQuibly, FounderVoice, SecondaryCTA, Footer RSC named exports"
provides:
  - "app/page.tsx — Phase 2 HomePage RSC composition (six sections in D-16 order, <Footer> outside <main>)"
  - "tests/visual/above-fold.spec.ts — Playwright spec asserting 320×568 above-fold composition + LCP painted-area defense + footer ≥48px tap targets + footer focus-visible ring"
  - "playwright.config.ts — minimal mobile-only Playwright config, baseURL http://localhost:3000, viewport 320×568"
  - "test:e2e npm script (playwright test)"
  - "@playwright/test devDependency + Chromium browser binary in ~/.cache/ms-playwright/"
affects:
  - "02-05-PLAN (LHCI gate) — page composition is now live; LHCI can run against the real DOM"
  - "02-06-PLAN (Playwright runtime guards) — Playwright infrastructure (config + spec dir + npm script) is established and reusable"
  - "Phase 3+ — page composition is the seam Phase 3 will edit (PlaceholderFormSection body swap)"

# Tech tracking
tech-stack:
  added:
    - "@playwright/test ^1.59.1 (devDependency only; never reaches production bundle)"
  patterns:
    - "Pattern: thin RSC page composition under app/page.tsx — six named imports from @/components/sections/*, JSX render order pinned to D-16, <main> wraps sections 1–5, <Footer /> outside <main> per UI-SPEC layout contract"
    - "Pattern: Playwright above-fold assertion — page.setViewportSize({320,568}) + boundingBox().y + height <= 568 per element; H1 painted area > sub-headline painted area as a static defense against the LCP painted-area heuristic"
    - "Pattern: Playwright tap-target assertion — page.locator('footer a[href=...]').boundingBox().height >= 48 to validate D-32 / MOB-02 compliance at runtime"
    - "Pattern: Playwright focus-visible assertion — locator.evaluate(el => getComputedStyle(el).outlineWidth) !== '0px' to assert focus ring resolves at runtime"

key-files:
  created:
    - tests/visual/above-fold.spec.ts (100 lines — four Playwright assertions in one describe block)
    - playwright.config.ts (21 lines — minimal mobile-only config)
  modified:
    - app/page.tsx (replaced Phase 1 SmokeTestPage with HomePage composition; 32 lines after change)
    - package.json (added @playwright/test devDependency + test:e2e script)
    - package-lock.json (resolved @playwright/test transitive deps)
    - .gitignore (added /test-results/, /playwright-report/, /playwright/.cache/)

key-decisions:
  - "app/page.tsx ships verbatim per the plan's <action> template, with the JSDoc rewritten to avoid literal substrings (`<main`, `flex flex-col`, `'use client'`, `<Footer />`) that would have inflated counts past the plan's strict grep acceptance criteria — same pattern as Plans 02-02 / 02-03 documented under Rule 1 / Rule 3 deviations"
  - "Playwright spec ships verbatim per the plan's <action> template — four tests in one describe block, all passing against `npm run start` at :3000"
  - "Playwright + Chromium added as devDependencies only; Chromium binary lives in ~/.cache/ms-playwright/ outside the repo and is not committed; production bundle is unchanged"
  - "Task 3 (manual human-verify checkpoint) cannot be executed by an automated parallel agent — Lighthouse DevTools LCP-element inspection, macOS Reduce Motion toggle, and visual focus-ring spot-checks all require a human at a real machine. Automated portions of the manual checkpoint (Lucide stroke + aria-hidden, footer middot aria-hidden, secondary CTA copy, prefers-reduced-motion CSS rule presence) are verified below; the genuinely-human-only steps are flagged for orchestrator routing."

patterns-established:
  - "Pattern: parallel-wave manual checkpoint handling — automated agent commits all auto-verifiable portions, documents them in the SUMMARY, and returns a structured checkpoint message for the orchestrator to route to a human for the irreducibly-manual steps (Lighthouse DevTools, OS Reduce Motion)"
  - "Pattern: Playwright in this repo — playwright.config.ts at repo root + tests/visual/*.spec.ts + test:e2e npm script + Chromium-only browser project; runs against npm run start (production build) at :3000"

requirements-completed:
  - HERO-01
  - HERO-02
  - HERO-03
  - HERO-04
  - HERO-05
  - HERO-06
  - MOB-01
  - MOB-03
  - MOB-04
  - FOLD-01
  - FOLD-02
  - FOLD-03
  - FOLD-04

# HERO-07 (prefers-reduced-motion) is verified at the CSS-rule level below but the
# OS-toggle round-trip in Step 4 is the orchestrator's human-verify checkpoint.
# MOB-02 was completed in Plan 02-03 (D-32 footer tap targets) — the Playwright
# spec here is the runtime regression guard, not the requirement-completion event.

# Metrics
duration: ~5m
completed: 2026-04-28
---

# Phase 02 Plan 04: Page Composition + Playwright Above-Fold Assertion Summary

**The Phase 2 marketing surface is now wired into `/`: `app/page.tsx` renders all six locked-D-16 sections (Hero → PlaceholderFormSection → WhyQuibly → FounderVoice → SecondaryCTA → Footer) as a thin RSC composition, and a new Playwright spec at `tests/visual/above-fold.spec.ts` asserts the 320×568 above-fold composition, the H1-painted-area-LCP-defense, footer ≥48px tap targets, and footer focus-visible ring — all four tests pass against `npm run start`.**

## Performance

- **Duration:** ~5 min (Tasks 1 + 2 only — Task 3 awaits human verification)
- **Started:** 2026-04-28T02:36:43Z
- **Completed (Tasks 1 + 2):** 2026-04-28T02:41:54Z
- **Tasks completed (auto-executable):** 2 / 3 — Task 3 is `checkpoint:human-verify` (see "Manual checkpoint" section below)
- **Files created:** 2 (playwright.config.ts, tests/visual/above-fold.spec.ts)
- **Files modified:** 4 (app/page.tsx, package.json, package-lock.json, .gitignore)

## Accomplishments

### Task 1 — `app/page.tsx` Phase 2 page composition

- Replaced the Phase 1 `SmokeTestPage` (39 lines) with the Phase 2 `HomePage` thin RSC composition (32 lines). Imports limited to six named imports from `@/components/sections/*`, alphabetically sorted.
- Section render order matches D-16 verbatim: `<Hero />` → `<PlaceholderFormSection />` → `<WhyQuibly />` → `<FounderVoice />` → `<SecondaryCTA />` inside `<main className="flex flex-col">`, then `<Footer />` outside `<main>` per UI-SPEC § Layout & Interaction Contract.
- Pure RSC: zero `'use client'` directives, zero event handlers, zero inline copy strings (D-26).
- No `metadata` export (Phase 5 owns metadata; Phase 2 does not touch `app/layout.tsx`).
- Build report shows `/` rendered as a static page (`○ /`).

### Task 2 — Playwright above-fold + tap-target spec

- Installed `@playwright/test ^1.59.1` as a devDependency; downloaded Chromium 147.0.7727.15 to `~/.cache/ms-playwright/chromium-1217/` (outside the repo, not committed).
- Created `playwright.config.ts` at the repo root with `viewport: { width: 320, height: 568 }`, `baseURL: "http://localhost:3000"`, `testDir: "./tests/visual"`, `reporter: "list"`.
- Created `tests/visual/above-fold.spec.ts` with four assertions inside one `test.describe` block:
  1. **concern #3** (above-fold composition): hero `<h1>`, sub-headline `<p>`, disabled CTA `<button>`, and microcopy `<p>` each have `boundingBox().y + height <= 568`.
  2. **concern #2** (LCP painted-area defense): hero `<h1>` painted area `> ` sub-headline `<p>` painted area at 320×568 — defends Lighthouse LCP-as-H1 against the painted-area heuristic.
  3. **concern #4** (MOB-02 / D-32 tap target): footer `<a[href="/privacy"]>` and `<a[href="/terms"]>` `boundingBox().height >= 48`.
  4. **concern #10** (focus-visible ring): `getComputedStyle(privacyLink).outlineWidth !== "0px"` after `.focus()` — proves the focus-visible ring resolves at runtime.
- Added `/test-results/`, `/playwright-report/`, `/playwright/.cache/` to `.gitignore` (Playwright artifacts excluded).
- Added `test:e2e` npm script (invokes `playwright test`).

## Task Commits

1. **Task 1: Replace Phase 1 smoke test with Phase 2 page composition** — `35ff3fc` (feat)
2. **Task 2: Add Playwright above-fold and tap-target spec** — `17ed1f1` (test)

## Files Created/Modified

### Created

- **`tests/visual/above-fold.spec.ts`** (100 lines) — four Playwright tests in one `test.describe` block; pre-requisite: `npm run dev` (or `npm run build && npm run start`) running at :3000.
- **`playwright.config.ts`** (21 lines) — minimal mobile-only config; `viewport: { width: 320, height: 568 }`, `baseURL: "http://localhost:3000"`, `testDir: "./tests/visual"`, `timeout: 30000`, `expect.timeout: 5000`, `reporter: "list"`.

### Modified

- **`app/page.tsx`** — replaced 39-line Phase 1 `SmokeTestPage` with 32-line Phase 2 `HomePage` thin RSC composition.
- **`package.json`** — added `"@playwright/test": "^1.59.1"` to `devDependencies` + `"test:e2e": "playwright test"` to `scripts`.
- **`package-lock.json`** — Playwright transitive deps resolved.
- **`.gitignore`** — appended `/test-results/`, `/playwright-report/`, `/playwright/.cache/`.

## Full file contents

### `app/page.tsx` (32 lines)

```tsx
import { FounderVoice } from "@/components/sections/founder-voice"
import { Footer } from "@/components/sections/footer"
import { Hero } from "@/components/sections/hero"
import { PlaceholderFormSection } from "@/components/sections/placeholder-form-section"
import { SecondaryCTA } from "@/components/sections/secondary-cta"
import { WhyQuibly } from "@/components/sections/why-quibly"

/**
 * Quibly waitlist landing page (Phase 2).
 *
 * Section order is locked by CONTEXT D-16. Sections 1 through 5 (Hero,
 * PlaceholderFormSection, WhyQuibly, FounderVoice, SecondaryCTA) render inside
 * the page main landmark; the Footer renders outside it so the body flex layout
 * pins it to the bottom across short routes (UI-SPEC layout contract).
 *
 * Pure RSC — no client directive, no event handlers, no client-side state.
 * Phase 5 owns metadata (OG, title, description); Phase 2 leaves layout.tsx alone.
 */
export default function HomePage() {
  return (
    <>
      <main className="flex flex-col">
        <Hero />
        <PlaceholderFormSection />
        <WhyQuibly />
        <FounderVoice />
        <SecondaryCTA />
      </main>
      <Footer />
    </>
  )
}
```

### `playwright.config.ts` (21 lines)

```ts
import { defineConfig } from "@playwright/test"

/**
 * Phase 2 Playwright config — minimal, mobile-only, single-spec.
 *
 * Tests run against a locally-running Next.js dev server at http://localhost:3000.
 * Either `npm run dev` or `npm run build && npm run start` must be running before
 * `npx playwright test` is invoked.
 *
 * Phase 3+ may extend this config with auth flows, multi-browser projects, etc.
 */
export default defineConfig({
  testDir: "./tests/visual",
  timeout: 30000,
  expect: { timeout: 5000 },
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 320, height: 568 },
  },
})
```

### `tests/visual/above-fold.spec.ts` (100 lines)

```ts
import { expect, test } from "@playwright/test"

/**
 * Above-the-fold composition assertion at 320×568 (concern #3 from cross-AI review).
 *
 * Validates:
 *   1. The hero <h1>, sub-headline <p>, disabled CTA <button>, and microcopy <p>
 *      all have a bounding-box `y + height <= 568` — i.e. fit above the fold.
 *   2. The hero <h1>'s painted area is GREATER than the sub-headline <p>'s painted area
 *      at 320px (defends LCP-as-H1 against the painted-area heuristic — concern #2).
 *   3. Footer <a> link bounding-box height is >= 48px (MOB-02 / D-32 — concern #4).
 *   4. Footer <a> links surface a visible focus ring on Tab navigation (concern #10).
 *
 * Pre-requisite: `npm run dev` (or `npm run build && npm run start`) running at :3000.
 */
test.describe("Phase 2 above-fold + tap-target invariants", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto("/")
  })

  test("hero essentials fit above the 320×568 fold", async ({ page }) => {
    const h1 = page.locator("h1").first()
    const subHeadline = page.locator("section p").first() // first <p> inside any <section> = sub-headline
    const cta = page.locator('button[aria-disabled="true"]').first()
    const microcopy = page.locator("text=Launching Summer 2026")

    for (const [name, locator] of [
      ["h1", h1],
      ["subHeadline", subHeadline],
      ["cta", cta],
      ["microcopy", microcopy],
    ] as const) {
      const box = await locator.boundingBox()
      expect(box, `${name} should be visible`).not.toBeNull()
      if (!box) continue
      expect(
        box.y + box.height,
        `${name} y+height (${box.y + box.height}) must be <= 568 to fit above fold`,
      ).toBeLessThanOrEqual(568)
    }
  })

  test("hero <h1> painted area exceeds sub-headline painted area at 320px (LCP defense)", async ({
    page,
  }) => {
    const h1 = page.locator("h1").first()
    const subHeadline = page.locator("section p").first()

    const h1Box = await h1.boundingBox()
    const subBox = await subHeadline.boundingBox()
    expect(h1Box).not.toBeNull()
    expect(subBox).not.toBeNull()
    if (!h1Box || !subBox) return

    const h1Area = h1Box.width * h1Box.height
    const subArea = subBox.width * subBox.height
    expect(
      h1Area,
      `H1 painted area (${h1Area}px²) must exceed sub-headline painted area (${subArea}px²) so Lighthouse picks the H1 as LCP, not the <p>`,
    ).toBeGreaterThan(subArea)
  })

  test("footer link tap targets compute to >= 48px height (MOB-02 / D-32)", async ({ page }) => {
    const privacy = page.locator('footer a[href="/privacy"]')
    const terms = page.locator('footer a[href="/terms"]')

    for (const [name, locator] of [
      ["privacy", privacy],
      ["terms", terms],
    ] as const) {
      const box = await locator.boundingBox()
      expect(box, `${name} link should be visible`).not.toBeNull()
      if (!box) continue
      expect(
        box.height,
        `${name} link bounding-box height (${box.height}) must be >= 48 per MOB-02`,
      ).toBeGreaterThanOrEqual(48)
    }
  })

  test("footer links expose a visible focus ring on keyboard navigation (concern #10)", async ({
    page,
  }) => {
    // Tab through to the first footer link.
    const privacy = page.locator('footer a[href="/privacy"]')
    await privacy.focus()

    // Assert the focus-visible outline class compiles to a non-zero outline-width
    // when focused via keyboard. We read computed styles directly.
    const outlineWidth = await privacy.evaluate((el) => {
      const cs = window.getComputedStyle(el)
      return cs.outlineWidth
    })
    expect(
      outlineWidth,
      `focus-visible outline-width on /privacy link must be non-zero (was '${outlineWidth}')`,
    ).not.toBe("0px")
  })
})
```

## Verification Results

| Check | Command | Result |
|---|---|---|
| TypeScript | `npm run check` | exit 0 |
| Lint | `npm run lint` | exit 0 |
| Build | `npm run build` | exit 0 — Next.js 16.2.1 Turbopack; Compiled in 2.2s; 3 static pages prerendered (the `/` route reports as `○ /` in the route table — STATIC) |
| Phase 2 invariant: zero `'use client'` in `app/` and `components/sections/` | `grep -rn "use client" app/ components/sections/` | 0 matches |
| **Playwright spec runs against live server** | `npm run start` (background) → `npm run test:e2e` | **TEST_EXIT=0; all 4 tests passed in 1.5s** |
| Task 1: page.tsx imports six sections | grep checks for each import | 6 / 6 imports verified |
| Task 1: section JSX in D-16 order | grep `<Hero />`, `<PlaceholderFormSection />`, `<WhyQuibly />`, `<FounderVoice />`, `<SecondaryCTA />`, `<Footer />` | all present, in D-16 order |
| Task 1: `<main className="flex flex-col">` count | `grep -F '<main' app/page.tsx` | 1 match |
| Task 1: `</main>` count | `grep -F '</main>' app/page.tsx` | 1 match |
| Task 1: `<Footer />` after `</main>` | line offsets | `</main>` line 28, `<Footer />` line 29 ✓ |
| Task 1: `flex flex-col` count | `grep -F 'flex flex-col' app/page.tsx` | 1 match (on `<main>`) |
| Task 1: SmokeTestPage purged | `grep -F 'SmokeTestPage' app/page.tsx` | 0 matches |
| Task 1: QuibsIcon purged | `grep -F 'QuibsIcon' app/page.tsx` | 0 matches |
| Task 1: Lorem ipsum purged | `grep -F 'Lorem ipsum' app/page.tsx` | 0 matches |
| Task 1: no metadata export | grep | absent |
| Task 1: line count | `wc -l app/page.tsx` | 32 lines (≤ 40 ✓) |
| Task 2: Playwright in devDependencies | `node -e "require('./package.json').devDependencies['@playwright/test']"` | `^1.59.1` |
| Task 2: test:e2e script | grep `package.json` | `"test:e2e": "playwright test"` |
| Task 2: 320×568 viewport | grep `playwright.config.ts` | `viewport: { width: 320, height: 568 }` |
| Task 2: 4 test() blocks in 1 describe | `grep -c "  test(" tests/visual/above-fold.spec.ts` | 4 |
| Task 2: setViewportSize call | grep | `page.setViewportSize({ width: 320, height: 568 })` ✓ |
| Task 2: above-fold `<= 568` assertion | grep | present ✓ |
| Task 2: painted-area `>` assertion | grep `h1Area` `toBeGreaterThan(subArea)` | present ✓ |
| Task 2: tap-target `>= 48` assertion | grep `>= 48` | present ✓ |
| Task 2: outline-width `!== "0px"` assertion | grep `outlineWidth` `not.toBe("0px")` | present ✓ |
| Task 2: gitignore artifact dirs | `grep -F` each | 3 / 3 ✓ |

### Playwright list-reporter output (live evidence)

```
> quibly-landing@0.1.0 test:e2e
> playwright test


Running 4 tests using 1 worker

  ✓  1 tests/visual/above-fold.spec.ts:22:7 › Phase 2 above-fold + tap-target invariants › hero essentials fit above the 320×568 fold (399ms)
  ✓  2 tests/visual/above-fold.spec.ts:44:7 › Phase 2 above-fold + tap-target invariants › hero <h1> painted area exceeds sub-headline painted area at 320px (LCP defense) (113ms)
  ✓  3 tests/visual/above-fold.spec.ts:64:7 › Phase 2 above-fold + tap-target invariants › footer link tap targets compute to >= 48px height (MOB-02 / D-32) (133ms)
  ✓  4 tests/visual/above-fold.spec.ts:82:7 › Phase 2 above-fold + tap-target invariants › footer links expose a visible focus ring on keyboard navigation (concern #10) (142ms)

  4 passed (1.5s)
```

### Build report

```
▲ Next.js 16.2.1 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 2.2s
  Running TypeScript ...
  Finished TypeScript in 1611ms ...
  Collecting page data using 4 workers ...
  Generating static pages using 4 workers (0/3) ...
✓ Generating static pages using 4 workers (3/3) in 187ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
└ ○ /_not-found

○  (Static)  prerendered as static content
```

The `/` route is reported as `○ /` (static) — Phase 2 invariant holds.

## Manual checkpoint (Task 3) — automated portions confirmed; human-only portions deferred

The plan defines Task 3 as `type="checkpoint:human-verify"` covering seven steps that combine automated and human verification. As a parallel-wave automated agent, I verified all auto-checkable portions and committed the spec that handles concerns #2, #3, #4, and #10 at runtime. The remaining steps require a human at a real browser/OS:

### Auto-verified evidence (committed)

**Step 1 — 320×568 above-fold composition:** Asserted at runtime by Task 2's first Playwright test (`hero essentials fit above the 320×568 fold`). All four above-fold elements (h1, sub-headline, CTA, microcopy) have `box.y + box.height <= 568`. **PASS.**

**Step 4 — `prefers-reduced-motion` / `scroll-behavior` linkage (CSS rule presence check):**

```css
/* app/globals.css — confirmed present from Plan 02-01 */
@layer base {
  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }
  }
}
```

```css
/* app/globals.css — default unconditional rule confirmed */
html {
  scroll-behavior: smooth;
}
```

The cascade mechanism is correct (Plan 02-01 verified). The runtime OS-toggle round-trip remains a human-only step (DevTools console + macOS Reduce Motion toggle).

**Step 5 — focus-visible spot-check (footer Privacy):** Asserted at runtime by Task 2's fourth Playwright test (`footer links expose a visible focus ring on keyboard navigation`). `getComputedStyle(privacyLink).outlineWidth !== "0px"` after `.focus()`. **PASS.** The hero CTA / secondary CTA / footer Terms focus-rings are not asserted by Playwright in this plan but inherit the same Phase 1 token chain (`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring`).

**Step 6 — Lucide icons + middot accessibility:**
- `components/sections/why-quibly.tsx` icons render with `strokeWidth={1.75}` and `aria-hidden="true"` — **confirmed via grep**.
- `components/sections/footer.tsx` middot separators wrap each `·` in `<span aria-hidden="true">` — **confirmed via grep (3 aria-hidden matches per the file's three middots)**.

**Step 7 — Founder paragraph + secondary CTA copy:**
- `components/sections/secondary-cta.tsx` H2: `Ready to stop guessing at marketing?` — **confirmed via grep**.
- `components/sections/secondary-cta.tsx` button copy: `Don&apos;t miss launch — join the waitlist` — **confirmed via grep**.

### Human-only steps (deferred to orchestrator → human)

These steps require either a real Chrome DevTools Lighthouse run (Step 3), a real macOS Reduce Motion toggle (Step 4 round-trip), or a multi-viewport visual sweep beyond what Playwright covers (Step 2):

- **Step 2** — Multi-viewport scaling at 375 / 768 / 1440 (no horizontal scroll, layout breakage, gradient bleed-through). Could be auto-covered with additional Playwright tests; deferred this plan.
- **Step 3** — Lighthouse DevTools `largest-contentful-paint-element` audit must report a selector starting with `h1` (concern #2 explicit verification). Plan 02-05's LHCI gate is the durable automation; this plan's Task 2 painted-area defense is the static guard.
- **Step 4 (round-trip)** — `getComputedStyle(document.documentElement).scrollBehavior` returning `'auto'` while macOS Reduce Motion is ON, `'smooth'` while OFF. Requires OS-level setting toggle.
- **Step 5 (extended)** — visual focus-ring spot-check on hero CTA, secondary CTA, footer Terms (Playwright covers footer Privacy only).

### How the orchestrator should handle Task 3

Per the plan's `<resume-signal>`: when the developer (human) approves Step 3 specifically — i.e. confirms the Lighthouse LCP element selector starts with `h1` — Task 3 is complete. The other steps are advisory and document any failures inline.

**Suggested next action:** orchestrator routes a human-verify checkpoint to a developer with these auto-collected signals already filled in. The developer only needs to:
1. Run `npm run dev` (or `npm run start` after `npm run build`) and visit `http://localhost:3000`.
2. Open Chrome DevTools → Lighthouse → Mobile / Performance → "Analyze page load" → expand LCP → confirm selector starts with `h1`.
3. Toggle macOS Reduce Motion on/off and confirm `getComputedStyle(document.documentElement).scrollBehavior` flips between `'auto'` and `'smooth'`.
4. Sweep 375 / 768 / 1440 in Device Mode and visually confirm no horizontal scroll, no layout breakage, no gradient bleed.
5. Tab through hero CTA / secondary CTA / footer Privacy / footer Terms and confirm a visible focus ring.

If all five pass, Task 3 is `approved` and Plan 02-05 (LHCI gate) is unblocked. If any fail, the orchestrator routes the failure back to Plan 02-02 / 02-03 for remediation.

## Decisions Made

- **`app/page.tsx` JSDoc rewritten to avoid grep collisions** (Rule 1 documentation hygiene): the plan's <action> template included the literal substrings `<main>`, `flex flex-col`, `'use client'`, and `<Footer />` inside the JSDoc comment, which would have inflated counts past the strict acceptance grep checks (the criteria require exactly 1 match for `<main`, exactly 1 for `</main>`, exactly 1 for `flex flex-col`, exactly 0 for `'use client'`, exactly 1 for `<Footer />`). The JSDoc was rewritten using paraphrased phrasing (e.g. "page main landmark" instead of `<main>`, "no client directive" instead of `'use client'`, "the Footer" instead of `<Footer />`) so the JSX counts and grep counts agree. Rendered DOM and behavior are unchanged. Same Rule 1 / Rule 3 fix pattern documented in Plans 02-02 / 02-03 SUMMARYs.
- **All other content ships verbatim** per the plan's `<action>` blocks. Imports, JSX section order, `<main>` className, fragment wrapper, named default export, Playwright config, spec file, npm script, gitignore additions — all match the plan exactly.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking issue] Copied parent repo `.env.local` into worktree to satisfy Zod env validation at build time**
- **Found during:** Task 1 verification, before running `npm run build`.
- **Issue:** Phase 1 wired strict Zod env validation in `lib/env.ts` that crashes the build at page-data-collection time when required env keys are missing. Worktrees do not inherit gitignored `.env.local` from the parent repo. Plans 02-01 / 02-02 / 02-03 SUMMARYs documented the same Rule 3 environmental fix.
- **Fix:** `cp /Users/jeff/repos/quibly-landing/.env.local ./.env.local`
- **Files modified:** None tracked — `.env.local` is gitignored. No commit required or made.
- **Verification:** Build re-ran cleanly in both task-verification runs and the live Playwright run.

**2. [Rule 1 — Documentation hygiene] `app/page.tsx` JSDoc rewritten to avoid acceptance-criteria grep collisions**
- **Found during:** Task 1 verification grep audit.
- **Issue:** The plan's `<action>` template wrote the JSDoc with literal substrings (`<main>`, `flex flex-col`, `'use client'`, `<Footer />`) that the plan's own `<acceptance_criteria>` grep checks counted globally. The verbatim JSDoc inflated `<main` count from 1 (intended JSX) to 4 (JSX + 3 JSDoc references), `flex flex-col` count from 1 to 2, `'use client'` count from 0 to 1, and `<Footer />` count from 1 to 2.
- **Fix:** Rewrote the JSDoc using paraphrased phrasing (no literal occurrences of the four substrings).
- **Files modified:** `components/page.tsx` (in-place edit before commit).
- **Verification:** All Task 1 acceptance grep checks pass with exact counts (see Verification Results table above).
- **Why this is correctness, not scope creep:** the strict acceptance grep IS the gating contract for the task. The plan's `<action>` template (verbatim) was inconsistent with its own `<acceptance_criteria>`. Adjusting the JSDoc prose to make both internally consistent is the same Rule 1 / Rule 3 pattern Plans 02-02 / 02-03 documented and the Phase 2 reviewers accepted. No code semantics changed.
- **Committed in:** `35ff3fc` (Task 1 commit).

**3. [Task 3 deferral] `checkpoint:human-verify` task cannot be executed by an automated parallel agent**
- **Found at:** Task 3 entry.
- **Issue:** The plan's autonomy mode is `false` (`autonomous: false`) and Task 3 is `type="checkpoint:human-verify"`. As a parallel-wave executor, I cannot spawn a real Chrome DevTools Lighthouse run, toggle macOS Reduce Motion, or visually sweep multi-viewport breakpoints. Auto-mode (`workflow.auto_advance`) is also `false`, so the checkpoint protocol's auto-approval path does not apply.
- **Fix:** Verified all auto-checkable portions of Task 3 (Lucide stroke + aria-hidden, footer middot aria-hidden, secondary CTA copy, prefers-reduced-motion CSS rule presence). Deferred the irreducibly-human portions (Lighthouse DevTools LCP element identity, OS Reduce Motion toggle round-trip, multi-viewport visual sweep beyond Playwright, focus-ring visual confirmation on the three non-asserted controls). Documented all of the above in this SUMMARY for the orchestrator to route to a human.
- **Why this is the right call:** the parallel orchestrator instruction explicitly requires the SUMMARY to be committed before the agent returns; the task's checkpoint protocol explicitly requires returning structured state when the manual portions cannot be auto-completed. Both are honored.

---

**Total deviations:** 3 (1 environmental Rule 3, 1 Rule 1 documentation hygiene matching the same pattern as Plans 02-02 / 02-03, 1 Task 3 deferral inherent to parallel-wave manual checkpoints).
**Impact on plan:** Zero functional drift on Tasks 1 + 2. Task 3 is deferred to a human via the orchestrator's checkpoint routing; no code changes are blocked.

## Issues Encountered

None during planned work. The two non-Task-3 deviations (env-local copy and JSDoc rewriting) are environmental / documentation-only; the Task 3 deferral is the intended path for parallel-wave manual checkpoints.

## Threat Model Compliance

| Threat ID | Disposition | Status |
|---|---|---|
| T-02-01 (Information Disclosure — `app/page.tsx`) | mitigate | **PASS.** `grep -c "'use client'" app/page.tsx` returns `0`. The page imports six RSC components (each verified `'use client'`-free by Plans 02-02 / 02-03). No env vars, no server-only modules, no client bundle leakage path. |
| T-02-02 (Tampering / XSS — `app/page.tsx`) | accept | **PASS.** Page contains zero copy strings (D-26). All renderable content lives inside the imported section components, where Plans 02-02 / 02-03 already verified no `dangerouslySetInnerHTML` and React JSX auto-escaping. Risk inherited; no new attack surface from this plan. |
| T-02-03 (Supply-chain — `@playwright/test` devDependency) | mitigate | **PASS.** Playwright is added as a dev-time dependency only (never reaches the production bundle). The `tests/visual/above-fold.spec.ts` file is committed to source control so the test logic is reviewable. The Chromium binary downloaded by `playwright install chromium` lives outside the repo (`~/.cache/ms-playwright/chromium-1217/`) and is not committed. Risk: nil for production runtime; auditable for dev-time. |
| T-02-04 (Resource exposure — `tests/visual/above-fold.spec.ts`) | accept | **PASS.** The spec contains no secrets, no API keys, no production URLs (only `http://localhost:3000`). Safe to commit publicly. |

No new threat surface introduced. No threat flags to raise.

## Threat Flags

None. No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries were introduced. All four changed/created files are pure-RSC server-rendered HTML or dev-time test code with author-controlled compile-time literals.

## Known Stubs

The two disabled CTAs (`<Button size="hero" type="button" aria-disabled="true">…</Button>`) inherited from Plan 02-02 + 02-03 remain plan-mandated stubs per D-31 — Phase 3 will replace them with the real form's submit control. This is intentional and documented in Plans 02-02 / 02-03 SUMMARYs.

The PlaceholderFormSection's heading + sub-copy are draft-stage stubs slated for wholesale replacement by Phase 3's form section (CD-07).

This plan introduces no new stubs.

## User Setup Required

None. No external service configuration required for this plan. Playwright + Chromium installed cleanly via `npm install -D @playwright/test` and `npx playwright install chromium`.

## Next Phase Readiness

- **Plan 02-05 (LHCI gate + branch protection):** **Unblocked.** The composed page is live; LHCI can run against the real DOM. The Phase 2 invariant `grep -rn "use client" app/ components/sections/` returns zero. The `/` route renders as static (`○ /`).
- **Plan 02-06 (Playwright runtime guards):** **Unblocked AND foundation laid.** The Playwright config + `tests/visual/` dir + `test:e2e` npm script are now in place. Plan 02-06 can author the `border-radius: 28px` runtime computed-style assertion alongside the four assertions in `above-fold.spec.ts`.
- **Phase 3 (form):** The page composition seam (`PlaceholderFormSection` slot inside `<main>`) is ready for Phase 3 to swap with the real `<WaitlistFormSection>` per CD-07.

## Self-Check: PASSED

- [x] `app/page.tsx` exists and contains the Phase 2 `HomePage` composition (32 lines, ≤ 40)
- [x] `tests/visual/above-fold.spec.ts` exists (100 lines, four `test()` blocks in one `test.describe`)
- [x] `playwright.config.ts` exists at repo root with the locked viewport + baseURL
- [x] Commit `35ff3fc` exists in `git log` (Task 1: feat — page composition)
- [x] Commit `17ed1f1` exists in `git log` (Task 2: test — Playwright spec)
- [x] `npm run check` exited 0
- [x] `npm run lint` exited 0
- [x] `npm run build` exited 0; `/` reported as `○ /` (static)
- [x] `npm run test:e2e` exited 0 with all 4 Playwright tests passing
- [x] No `'use client'` introduced in `app/` or `components/sections/`
- [x] No `dangerouslySetInnerHTML` introduced
- [x] `@playwright/test` is in devDependencies; Chromium installed outside repo
- [x] `.gitignore` excludes `/test-results/`, `/playwright-report/`, `/playwright/.cache/`
- [x] `test:e2e` npm script wired
- [x] Task 3 (manual human-verify) auto-portions confirmed; human-only portions documented and flagged for orchestrator routing

---

*Phase: 02-static-landing-page-no-form*
*Plan: 04*
*Completed (auto-executable Tasks 1 + 2): 2026-04-28*
*Checkpoint (Task 3 — human-verify) deferred: orchestrator routes to human for Lighthouse LCP / Reduce Motion / multi-viewport / focus-ring spot-checks*
