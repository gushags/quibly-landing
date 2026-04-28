---
phase: 02-static-landing-page-no-form
fixed_at: 2026-04-27T21:22:00Z
review_path: .planning/phases/02-static-landing-page-no-form/02-REVIEW.md
iteration: 1
findings_in_scope: 9
fixed: 3
skipped: 6
status: partial
---

# Phase 2: Code Review Fix Report

**Fixed at:** 2026-04-27T21:22:00Z
**Source review:** `.planning/phases/02-static-landing-page-no-form/02-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope (Critical + Warning): 9
- Fixed: 3 (CR-01, WR-02, WR-05)
- Skipped: 6 (WR-01, WR-03, WR-04, WR-06, WR-07, WR-08)
- Info findings (IN-01 … IN-06) intentionally outside this fix scope per `fix_scope: critical_warning`.

## Fixed Issues

### CR-01: Footer screen-reader output produces "Quibly … Quibly" duplication

**Files modified:** `components/sections/footer.tsx`
**Commit:** `577f6c2`
**Applied fix:** Adopted Option A from the review — dropped the redundant "Quibly" from the copyright span so it now reads `<span>© 2026</span>`. Screen-reader output is now `Quibly · 2026 · Privacy · Terms` (the middot remains aria-hidden) instead of `Quibly · 2026 Quibly · Privacy · Terms`. No change to layout, no other a11y trade-offs. Verified file content post-edit; `tsc --noEmit` passes; ESLint clean.

### WR-02: Lighthouse CI workflow lacks an explicit `permissions:` block

**Files modified:** `.github/workflows/lighthouse.yml`
**Commit:** `73cc5b0`
**Applied fix:** Added a workflow-level `permissions:` block declaring least-privilege scopes — `contents: read` (checkout), `pull-requests: write` and `statuses: write` (LHCI status reporting). Included a brief explanatory comment block above the declaration so the intent is discoverable to future maintainers. This also serves as the primary defense-in-depth mitigation for WR-03 (a hijacked workflow can no longer write to repo content). YAML validated via `python3 -c 'import yaml; yaml.safe_load(...)'`.

### WR-05: `globals.css` carries ~140 lines of dead/unrelated CSS from `marketing-app`

**Files modified:** `app/globals.css`
**Commit:** `c045ad7`
**Applied fix:** Stripped 222 lines of unreachable styles after grep-confirming zero references across `app/`, `components/`, and `tests/`:

- `.dark { … }` token block (no `.dark` class on `<html>` or `<body>`; v1 explicitly disables dark mode per D-23).
- `[data-sidebar="…"]` rules (no sidebar component exists in this project).
- `.bg-warning` / `.bg-scarcity` utilities (comments referenced "Phase 26 Plan 10/11" of marketing-app; not used here).
- Schedule-X (`.sx__*`) calendar overrides (no calendar in this project).
- `.prose` / `.prose-lg` typography rules (only future consumers would be `/privacy` and `/terms` in Phase 5; re-add scoped to those routes when they ship).
- Misleading "Each brand's accentColor from the DB" comment block referencing marketing-app's `deriveBrandCssVars()`.

`max-w-prose` Tailwind utility usages in `hero.tsx`, `founder-voice.tsx`, and `placeholder-form-section.tsx` are unaffected (max-width based on `ch` units — distinct from the deleted `.prose` typography class). `tsc --noEmit` passes; ESLint clean. File reduced from 328 → 106 lines.

## Skipped Issues

### WR-01: LCP painted-area "defense" relies on undocumented font-metric assumption

**File:** `tests/visual/above-fold.spec.ts:44-62`, `components/sections/hero.tsx:30-37`
**Reason:** Skipped — manual judgment required. The reviewer's preferred fix is to replace the heuristic with a `PerformanceObserver`-based direct LCP assertion, which is a non-trivial test rewrite (new API surface, new tagName check, requires runtime LCP entry to be observable in Playwright). The fallback (pad assertion margin to 1.25×) hard-codes a magic ratio that may itself drift. Both options are reasonable but require human validation against the actual Phase 2 LCP behavior on Vercel preview vs. CI Chromium. Defer to a follow-up plan.
**Original issue:** The painted-area test's H1-vs-subheadline assertion has only ~3% margin on 320px viewports. A single extra wrap on the sub-headline (font-metric variance across systems) flips the result, producing a flaky failure unrelated to a real LCP regression.

### WR-03: `pull_request:` trigger runs untrusted PR code with internal-branch secrets

**File:** `.github/workflows/lighthouse.yml:5-9`
**Reason:** Partially mitigated by WR-02 fix (explicit least-privilege `permissions:` block now applied — a hijacked workflow can no longer write to the repo). The remaining hardening — splitting LHCI into a `push:`-only workflow on `main` OR restricting `VERCEL_TOKEN` to read-only on the Vercel team — touches infrastructure outside this repo (Vercel team scopes) and changes when LHCI runs (PR vs. post-merge), which is a CI-strategy decision the user/founder should make. Skipping the structural change.
**Original issue:** Same-repo PR branches execute with full access to `secrets.VERCEL_TOKEN` and `secrets.LHCI_GITHUB_APP_TOKEN`. The trust assumption "same-repo push access ≈ trust" weakens once additional collaborators are added.

### WR-04: Test fixtures use fragile `.first()` selectors that silently shift on DOM changes

**File:** `tests/visual/above-fold.spec.ts:23-25, 44-48`, `tests/visual/button-radius.spec.ts:31`
**Reason:** Skipped — multi-file change with cross-component coupling. The fix requires adding `data-testid` attributes to multiple production components (`hero.tsx`, `placeholder-form-section.tsx`, `secondary-cta.tsx`) AND updating both Playwright spec files to use the new selectors AND verifying the spec still passes against a running production build (`npm run build && npm run start && npm run test:e2e`). The `expect(count).toBe(3)` Phase-3 forcing function is also documented in Plan 02-06 as intentional. Better executed as a focused follow-up plan with full test verification rather than mechanical edit + tsc check.
**Original issue:** `page.locator("section p").first()`, `button[aria-disabled="true"]`, and `text=Launching Summer 2026` are fragile selectors that silently switch targets on DOM changes.

### WR-06: Footer `flex-wrap` produces orphaned middots on narrow viewports

**File:** `components/sections/footer.tsx:34`
**Reason:** Skipped — requires layout / design judgment. The reviewer offered three fixes (drop "© 2026" copyright entirely, tighten gaps, or stack `flex-col sm:flex-row`). Each changes the visual rhythm of the footer differently and the founder/design-spec preference is not codified anywhere I can verify mechanically. Additionally, the suggested follow-up (add a Playwright assertion for footer total height ≤ 80px on 320×568) would be a sensible companion test to lock in whatever shape is chosen — best done in the same pass as the layout decision. Defer to a small follow-up plan that picks the visual variant.
**Original issue:** With `flex-wrap` and ~414px of content at 320px viewport, items wrap and orphan middots can appear on narrow rows.

### WR-07: SUMMARY documentation diverges from actual `tsconfig.json` state

**File:** `tsconfig.json`, `02-04-SUMMARY.md`, `02-06-SUMMARY.md`
**Reason:** Skipped — the **code state already matches the preferred outcome** identified in the orchestrator context note ("install `@playwright/test` types so type-checking the tests passes — preferred since it provides real coverage"). `@playwright/test ^1.59.1` is already in `package.json` devDependencies, and `tsconfig.json` already type-checks `tests/` (no exclusion). The actual divergence is in the historical 02-06-SUMMARY.md text claiming an exclusion that was never added. Plan SUMMARY files are historical records and editing them retroactively is undesirable; the orchestrator can decide whether to add a documentation addendum, but no source-code change is appropriate.
**Original issue:** Plan 02-06 SUMMARY claims "the `tsconfig.json` exclusion of `tests/` from `tsc --noEmit` … ship via Plan 02-04". `tsconfig.json` has no `tests/` exclusion. Type-checking succeeds because `@playwright/test` types are present in `node_modules`, not because tests are excluded.

### WR-08: Hero `<p>` sub-headline lives outside the inner flex container, decoupled from H1 layout

**File:** `components/sections/hero.tsx:29-37`
**Reason:** Skipped per orchestrator context note — the reviewer's own analysis concludes "the current decoupled structure is therefore the correct trade-off to satisfy the LCP guard". The proposed fix is purely an inline explanatory comment. Per CLAUDE.md / project convention preference for not adding explanatory comments unless they materially improve correctness, and per the context note ("If the fix is just an inline doc/comment, prefer NOT adding it … Skip."), no source change applied.
**Original issue:** The hero `<p>` and CTA cluster are siblings of the inner flex container rather than children, decoupling them from the H1's width/padding system. Working today but fragile to future width adjustments.

---

_Fixed: 2026-04-27T21:22:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
