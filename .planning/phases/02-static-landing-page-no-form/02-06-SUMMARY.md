---
phase: 02-static-landing-page-no-form
plan: 06
subsystem: testing
tags:
  - playwright
  - regression-test
  - cva-merge-guard
  - button
  - mob-02
  - d-06
  - d-31

# Dependency graph
requires:
  - phase: 02-static-landing-page-no-form
    plan: 01
    provides: 'Button size="hero" CVA variant rendering border-radius 28px (rounded-[28px] px-9 py-3.5 h-auto text-base)'
  - phase: 02-static-landing-page-no-form
    plan: 02
    provides: 'Hero + PlaceholderFormSection rendering <Button size="hero" type="button" aria-disabled="true"> instances per D-31'
  - phase: 02-static-landing-page-no-form
    plan: 03
    provides: 'SecondaryCTA rendering the third <Button size="hero" type="button" aria-disabled="true"> instance per D-31'
  - phase: 02-static-landing-page-no-form
    plan: 04
    provides: '@playwright/test devDependency + playwright.config.ts (testDir tests/visual, baseURL http://localhost:3000) — landed in same wave-3 worktree merge'
provides:
  - 'tests/visual/button-radius.spec.ts — Playwright runtime regression guard asserting every <Button size="hero"> instance computes border-radius: 28px (review concern #6)'
  - 'Phase 2 runtime regression-guard surface complete: above-fold + LCP-area + tap-target + focus-visible (Plan 02-04) AND button-radius + ≥48px hero-CTA height (Plan 02-06) all assertable via npm run test:e2e'
affects:
  - 'Phase 3 (form): when the disabled hero CTA is replaced by the form submit, this spec''s .toBe(3) count assertion will need to update (the failure is a deliberate forcing-function so future plans confirm intent)'
  - 'Future Tailwind / tailwind-merge upgrades: now caught at runtime if conflict resolution between rounded-full (base) and rounded-[28px] (variant) regresses'

# Tech tracking
tech-stack:
  added: []  # Zero new runtime or dev deps; @playwright/test arrives via Plan 02-04 (same-wave parallel worktree)
  patterns:
    - 'Pattern: Playwright runtime computed-style regression guard — page.locator(...).evaluate((el) => window.getComputedStyle(el).borderRadius) read against the live DOM'
    - 'Pattern: defense-in-depth on CVA conflict resolution — Plan 02-01''s static source-order check (rounded-full vs rounded-[28px] offsets in source) is paired with this Plan 02-06 runtime check on the actual rendered DOM'
    - 'Pattern: viewport-pinning for layout-invariant assertions — page.setViewportSize({ width: 1280, height: 800 }) so the radius assertion runs at a single deterministic breakpoint (border-radius doesn''t change at breakpoints in this design)'
    - 'Pattern: count-as-forcing-function — expect(count).toBe(3) is a literal-3 not >= 1 so when Phase 3 reduces the disabled-button population to one (the form submit), this assertion fails on purpose and forces the future plan to confirm intent before updating'
    - 'Pattern: bounding-box height as MOB-02 sanity — read button.boundingBox().height once the radius is asserted; covers the case where py-3.5 is dropped and the height regresses below 48px without the radius itself changing'

key-files:
  created:
    - tests/visual/button-radius.spec.ts
  modified: []

key-decisions:
  - 'Spec ships with the plan''s verbatim content — zero implementation latitude exercised'
  - 'Selector button[aria-disabled="true"] chosen to match all three D-31 disabled CTAs in one query (hero + placeholder + secondary) — single selector, count assertion pinned to exactly 3'
  - '@playwright/test import is the only import — no Next.js imports, no useState, no client-side React (the spec runs in the Node-side Playwright runner against the rendered DOM)'
  - 'Strict equality .toBe("28px") not threshold — D-06 locks the literal 28px value per design-system §1; any drift means the hero pill is no longer the design-system-locked shape'
  - 'Two-test split inside one describe block: (1) radius equality across all three buttons, (2) hero-CTA height MOB-02 sanity — keeps each assertion''s failure mode self-explanatory in test output'

patterns-established:
  - 'Pattern: tests/visual/*.spec.ts as the canonical location for Playwright runtime regression guards in this project (sibling-of above-fold.spec.ts)'
  - 'Pattern: page.locator(selector).evaluate(callback) for browser-context computed-style reads — the evaluate callback runs in the Chromium context with full window/document access while the test framework lives in Node'
  - 'Pattern: aria-disabled="true" selector as the canonical D-31 disabled-CTA matcher for the duration of Phase 2 (Phase 3 will need to update the selector OR the count when the disabled-button population changes)'

requirements-completed:
  - HERO-04

# Metrics
duration: 3min
completed: 2026-04-28
---

# Phase 02 Plan 06: Button-Radius Playwright Regression Guard Summary

**One new Playwright spec file lands the runtime regression-guard for the design-system-locked 28px hero CTA pill — closing cross-AI review concern #6 by reading `getComputedStyle(...).borderRadius` against the live DOM for every `<Button size="hero">` instance on `/`, paired with a `≥48px` hero-CTA height check (MOB-02 sanity).**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-28T02:36:00Z (after worktree base reset to expected commit `599cd35`)
- **Completed:** 2026-04-28T02:38:55Z
- **Tasks:** 1
- **Files created:** 1 (69 lines)
- **Files modified:** 0

## Accomplishments

- Created `tests/visual/button-radius.spec.ts` (69 lines): single Playwright spec with one `test.describe` block and exactly two `test(...)` blocks.
- Test #1 (`every <Button size="hero"> instance computes border-radius: 28px`): selects `button[aria-disabled="true"]`, asserts `count === 3` (the three D-31 disabled CTAs on Phase 2's `/` — hero + placeholder + secondary), then iterates each instance and asserts `getComputedStyle(el).borderRadius === "28px"` against the live DOM. Strict equality, NOT `>= 28` or `~ 28`.
- Test #2 (`hero CTA bounding-box height >= 48px`): reads `boundingBox().height` of the first `button[aria-disabled="true"]` (the hero CTA — DOM order) and asserts `>= 48` (MOB-02 indirect — pairs with the 28px radius lock so a future plan dropping `py-3.5` is caught even if the radius itself stays 28).
- Both tests share a single `beforeEach` that pins viewport to `1280×800` and navigates to `/` — keeps tests independent / runnable in any order.
- Zero source-code changes, zero new dependencies. The spec imports only `expect` and `test` from `@playwright/test` — that devDep arrives via the same-wave Plan 02-04 worktree merge.

## Spec File — Full Contents (per `<output>` requirement)

```ts
import { expect, test } from "@playwright/test"

/**
 * Button radius regression guard (concern #6 from cross-AI review).
 *
 * Asserts that every <Button size="hero"> instance rendered on `/` has a
 * computed `border-radius` of exactly `28px`. Catches silent regressions in:
 *   - components/ui/button.tsx (CVA size object — if `hero` row is reordered or removed)
 *   - tailwind-merge (if a future Tailwind upgrade changes conflict resolution)
 *   - the consuming components (if a caller adds className="rounded-full" post-hoc)
 *
 * Phase 2 has THREE rendered <Button size="hero"> instances on `/`:
 *   1. Hero CTA        (components/sections/hero.tsx — "Form coming soon")
 *   2. Placeholder CTA (components/sections/placeholder-form-section.tsx)
 *   3. Secondary CTA   (components/sections/secondary-cta.tsx)
 *
 * Per D-31 all three are <button type="button" aria-disabled="true"> with no href.
 * The selector button[aria-disabled="true"] matches all three.
 *
 * Pre-requisite: `npm run dev` (or `npm run build && npm run start`) running at :3000.
 */
test.describe("Phase 2 hero button radius (D-06 / 28px lock)", () => {
  test.beforeEach(async ({ page }) => {
    // Use desktop viewport so all three CTAs are reachable; the radius assertion is
    // viewport-independent (border-radius doesn't change at breakpoints in this design).
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto("/")
  })

  test("every <Button size=\"hero\"> instance computes border-radius: 28px", async ({ page }) => {
    const heroButtons = page.locator('button[aria-disabled="true"]')

    // Phase 2 ships exactly three disabled hero buttons.
    // Phase 3 will reduce this to one (the form's submit) — at that time this assertion's
    // expected count will need to update.
    const count = await heroButtons.count()
    expect(
      count,
      `Phase 2 should render exactly 3 disabled hero <button> instances; found ${count}`,
    ).toBe(3)

    for (let i = 0; i < count; i++) {
      const button = heroButtons.nth(i)
      const borderRadius = await button.evaluate(
        (el) => window.getComputedStyle(el).borderRadius,
      )
      expect(
        borderRadius,
        `<Button size="hero"> instance #${i} computed border-radius (was '${borderRadius}') must be exactly '28px' per D-06. Common regression values to investigate: '9999px' (rounded-full leaked through tailwind-merge), '22px' (rounded-3xl), '16px' (rounded-2xl), '0px' (the variant didn't apply at all).`,
      ).toBe("28px")
    }
  })

  test("hero CTA bounding-box height >= 48px (MOB-02 indirect — pairs with the 28px radius)", async ({
    page,
  }) => {
    // Sanity check: the 28px radius is paired with py-3.5 (14px top + 14px bottom)
    // and text-base (~24px line-height). Total height should be >= 48px.
    // If a future change drops py-3.5, this catches the resulting <48px regression.
    const heroCta = page.locator('button[aria-disabled="true"]').first()
    const box = await heroCta.boundingBox()
    expect(box).not.toBeNull()
    if (!box) return
    expect(
      box.height,
      `Hero CTA bounding-box height (${box.height}) must be >= 48 per MOB-02`,
    ).toBeGreaterThanOrEqual(48)
  })
})
```

## Task Commits

1. **Task 1: Create Playwright button-radius regression spec** — `9dfb8f4` (test)

## Verification Results

| Check | Command | Result |
|---|---|---|
| File exists | `test -f tests/visual/button-radius.spec.ts` | PASS |
| Spec contains `border-radius` references | `grep -F 'border-radius'` | 4 matches (in JSDoc + comment + test title + assertion message) |
| Strict 28px assertion present | `grep -F '"28px"'` | 1 match (the `.toBe("28px")` literal) |
| D-31 disabled-CTA selector present | `grep -F 'button[aria-disabled='` | 3 matches (1 in JSDoc, 2 in `page.locator(...)` calls) |
| Computed-style read pattern present | `grep -F 'getComputedStyle'` | 1 match |
| Count assertion `.toBe(3)` | `grep -cF '.toBe(3)'` | 1 match |
| Height assertion `.toBeGreaterThanOrEqual(48)` | `grep -cF '.toBeGreaterThanOrEqual(48)'` | 1 match |
| Phase 2 invariant — zero `'use client'` | `grep -cF "'use client'"` | 0 matches |
| `test.describe` count | `grep -c 'test.describe('` | 1 |
| `test(...)` block count inside describe | `grep -cE '^  test\('` | 2 |
| Imports limited to `@playwright/test` | `grep -E '^import '` | 1 line: `import { expect, test } from "@playwright/test"` |

All `<verify>` automated chain commands AND all `<acceptance_criteria>` static checks PASS.

## Verification Note — Live Run Deferred to Post-Merge Wave

The plan's `<acceptance_criteria>` includes one runtime gate that cannot be exercised inside this worktree alone:

> Running `npm run test:e2e -- tests/visual/button-radius.spec.ts` against a live local server exits 0

The `@playwright/test` devDependency, the `test:e2e` npm script, the `playwright.config.ts` (`testDir: "./tests/visual"`, `baseURL: "http://localhost:3000"`), and the `tsconfig.json` exclusion of `tests/` from `tsc --noEmit` all ship via Plan 02-04 in the **same wave-3 parallel worktree**. The orchestrator merges both worktrees (02-04 + 02-06) into a single phase commit, after which the runtime gate becomes exercisable.

This is by design and matches the plan's wave-assignment rationale ("Wave 3, after Plan 02-04 lands the Playwright config and the composed page").

**Static gates exercisable in this worktree:** ALL PASS (table above).
**`tsc --noEmit` (in this worktree alone):** fails with 5 errors — all from this single new spec file due to missing `@playwright/test` types. **NO other source files regress.** Verified via `npm run check 2>&1 | grep -v 'tests/visual/button-radius.spec.ts'` returning zero residual errors. Once Plan 02-04's worktree merges (adds the devDep + tsconfig exclusion), `npm run check` returns to exit 0 across the whole project.

**Runtime gate:** to be exercised by `/gsd-verify-work` after the wave-3 merge:
```bash
npm run dev &  # or npm run build && npm run start
sleep 5
npm run test:e2e -- tests/visual/button-radius.spec.ts
# Expected: 2 passed, 0 failed; exit 0
```

## Decisions Made

None beyond what the plan already pinned. The spec ships verbatim per the plan's `<action>` block — every line of the embedded code template was copied without modification.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Worktree base hard-reset from `3774ec7` to `599cd35`**
- **Found during:** Worktree start protocol (the `<worktree_branch_check>` step)
- **Issue:** The merge-base of HEAD against the orchestrator-provided base commit `599cd35` was `3774ec7` (a Phase 1 commit), meaning the worktree branch was diverged from the expected wave-3 base. Without resetting, this plan's commit would have included unintended deltas from Phase 1 work that already merged into main.
- **Fix:** `git reset --hard 599cd358be2e2b02faf49c6d85bb13f3dad2f5ef`. Verified `git rev-parse HEAD` matches the expected base before any further work.
- **Files modified:** None (this is a pre-task setup operation).
- **Why this is Rule 3 (blocking):** Without the reset, the worktree would have committed Phase-1 file changes alongside the Phase 2 plan deliverable, polluting the merge. The orchestrator's `<worktree_branch_check>` block explicitly mandates this reset. No code semantics changed by this operation — only the worktree branch pointer.

---

**Total deviations:** 1 setup-only (Rule 3 — worktree base alignment) — no code-level deviations.
**Impact on plan:** Zero. The spec file ships verbatim per the plan's `<action>` block.

## Issues Encountered

None during planned work. The TS errors from `npm run check` (5 errors, all from missing `@playwright/test` types) are anticipated cross-worktree dependencies that resolve when Plan 02-04's worktree merges in the same wave-3 orchestrator step. No source-file regressions outside the new spec file (verified via grep audit).

## Threat Model Compliance

| Threat ID | Disposition | Status |
|---|---|---|
| T-02-01 (Tampering — spec file) | accept | **PASS by design.** The spec is a regression guard; its purpose is to fail when source code is tampered with in a way that breaks the 28px radius lock. A malicious actor weakening the assertion (e.g., `expect(borderRadius).toBe(anything)`) would be caught in code review. The spec ships as-shipped — strict equality `.toBe("28px")` retained. |
| T-02-02 (Information Disclosure — spec file) | accept | **PASS.** No secrets, no env vars, no production URLs. Only `localhost:3000` (via Plan 02-04's `playwright.config.ts` `baseURL`) and a hardcoded `1280×800` viewport. `grep -E "(API_KEY\|SECRET\|TOKEN\|password)"` returns 0 matches. |
| T-02-03 (Supply-chain — `@playwright/test`) | accept | **PASS.** This plan introduces ZERO new dependencies. `@playwright/test` is added by Plan 02-04 in the same wave; that plan vetted the supply-chain risk. This plan only consumes the type imports. |
| T-02-04 (Resource exposure — test artifacts) | accept | **PASS.** No artifacts are committed. Plan 02-04's `.gitignore` (sibling) excludes `/test-results/` and `/playwright-report/`. This plan adds zero gitignored artifacts. `git status --short` confirms only `tests/visual/button-radius.spec.ts` was touched. |

No new threat surface introduced. No threat flags to raise.

## Threat Flags

None. The spec file is a regression guard — it reads from the rendered DOM and compares against design-system-locked literal values. It does not introduce new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries.

## Known Stubs

None. The spec is fully wired against the three rendered `<Button size="hero">` instances that already exist on `/` (hero, placeholder, secondary CTAs from waves 1 and 2). The single test count `expect(count).toBe(3)` is a deliberate forcing-function for Phase 3 — when the form submit replaces the hero CTA's disabled button, this test will fail and force the Phase 3 plan to confirm intent before updating the count or selector.

This is **not** an unwired stub; it is a locked cross-phase contract documented in the spec's inline comment ("Phase 3 will reduce this to one (the form's submit) — at that time this assertion's expected count will need to update").

## User Setup Required

None. No external service configuration required for this plan. Once the wave-3 worktree merge completes, the spec runs as part of `npm run test:e2e` (script wired in Plan 02-04) without any user action.

## Next Phase Readiness

- **Phase 2 verifier (`/gsd-verify-work`):** Unblocked. After wave-3 merge, runs `npm run test:e2e` to exercise both `tests/visual/above-fold.spec.ts` (Plan 02-04) AND `tests/visual/button-radius.spec.ts` (this plan) in a single command. Both must pass for Phase 2 acceptance.
- **Plan 02-05 (LHCI gate):** Unaffected — runs in CI against the Vercel preview, not against local Playwright. The two test surfaces are complementary (LHCI = production-shaped runtime metrics; Playwright = local computed-style + dimensional regression).
- **Phase 3 (form):** When the form submit replaces the hero CTA's disabled button, Plan 03's planner MUST:
  1. Update this spec's `expect(count).toBe(3)` to the new disabled-button population (probably `.toBe(2)` if only placeholder + secondary remain disabled).
  2. OR change the selector from `button[aria-disabled="true"]` to a shape-based selector if Phase 3 removes all disabled CTAs.
  3. Confirm the form submit retains `border-radius: 28px` — the spec's iteration logic still applies if it picks up the form submit too.

## Self-Check: PASSED

- [x] `tests/visual/button-radius.spec.ts` exists (69 lines).
- [x] File contains exactly one `test.describe(...)` block.
- [x] File contains exactly two `test(...)` blocks inside the describe.
- [x] Strict assertion `.toBe("28px")` present.
- [x] Selector `button[aria-disabled="true"]` present.
- [x] Computed-style read `getComputedStyle` present.
- [x] Count assertion `.toBe(3)` present (1 match).
- [x] Height assertion `.toBeGreaterThanOrEqual(48)` present (1 match).
- [x] Zero `'use client'` directives.
- [x] Imports limited to `expect` and `test` from `@playwright/test`.
- [x] Commit `9dfb8f4` exists in `git log` (Task 1).
- [x] No file deletions in commit.
- [x] No source-file regressions outside the new spec file (`tsc --noEmit` errors localized to the new file's `@playwright/test` import — resolved by Plan 02-04's same-wave merge).
- [x] Cross-AI review concern #6 (silent-regression vector from CVA / tailwind-merge resolution) now formally guarded at runtime.

---

*Phase: 02-static-landing-page-no-form*
*Plan: 06*
*Completed: 2026-04-28*
