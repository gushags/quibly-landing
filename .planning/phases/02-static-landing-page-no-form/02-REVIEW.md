---
phase: 02-static-landing-page-no-form
reviewed: 2026-04-27T20:30:00Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - app/globals.css
  - app/page.tsx
  - components/sections/footer.tsx
  - components/sections/founder-voice.tsx
  - components/sections/hero-mascot.tsx
  - components/sections/hero.tsx
  - components/sections/placeholder-form-section.tsx
  - components/sections/secondary-cta.tsx
  - components/sections/why-quibly.tsx
  - components/ui/button.tsx
  - tests/visual/above-fold.spec.ts
  - tests/visual/button-radius.spec.ts
  - playwright.config.ts
  - .github/workflows/lighthouse.yml
  - .lighthouserc.json
  - package.json
findings:
  blocker: 1
  warning: 8
  info: 6
  total: 15
status: issues_found
---

# Phase 2: Code Review Report

**Reviewed:** 2026-04-27T20:30:00Z
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

| Severity | Count |
|---|---|
| BLOCKER | 1 |
| WARNING | 8 |
| INFO | 6 |
| **Total** | **15** |

The Phase 2 static-landing implementation cleanly satisfies the `pure RSC, zero `'use client'`` invariant and the locked design contracts (D-31 disabled CTAs, D-32 footer tap targets, D-06 28px hero pill). All section components are stateless, server-rendered, and free of XSS sinks. CI tooling (Playwright, Lighthouse) is wired and the local LHCI run reportedly passes the three error-level assertions.

That said, this review found one **BLOCKER** (footer screen-reader output reads "Quibly" twice in succession because the wordmark and the copyright string both contain the word "Quibly" with no separating semantics — accessibility regression vs. the intended footer line), eight **WARNINGS** that span fragile test selectors, missing CI permissions hardening, dead/unrelated CSS carried over from `marketing-app`, and a documented-but-still-real LCP painted-area assumption that may not hold under different font metrics, and six **INFO**-level items covering UX subtleties around the `aria-disabled` button pattern and minor doc/comment drift.

Performance findings (e.g., `globals.css` bloat from leftover marketing-app code, font CSS weight) are explicitly out of v1 scope per the workflow, so they are framed here as code-quality / dead-code findings rather than perf claims.

## Blocker Issues

### CR-01: Footer screen-reader output produces "Quibly … Quibly" duplication

**File:** `components/sections/footer.tsx:35-37`
**Category:** Accessibility / a11y
**Issue:**
The footer renders, in DOM order:
1. `<span class="...">Quibly</span>` — the brand wordmark (line 35)
2. `<span aria-hidden="true">·</span>` — decorative middot
3. `<span>© 2026 Quibly</span>` — the copyright text (line 37, also contains the word "Quibly")

Because the middot is `aria-hidden`, screen readers walk straight from the wordmark to the copyright. The output is approximately:

> "Quibly. © 2026 Quibly. Privacy. Terms."

i.e. the brand name is spoken twice in immediate succession, with no separating phrase, role, or punctuation. This:
- violates WCAG 2.1 SC 1.3.1 (Info and Relationships) by hiding the only thing that distinguished the two spans visually (the middot) without restoring the relationship for AT users
- violates WCAG 2.1 SC 2.4.6 (Headings and Labels) tangentially because the wordmark is functioning as both a brand mark and a heading-style label and is not differentiable from the copyright

The UI-SPEC explicitly calls out (`02-UI-SPEC.md` Footer DOM example) `wordmark · © 2026 Quibly · Privacy · Terms`, but the spec assumed the wordmark would carry a different role than the copyright. As shipped they collapse to one continuous string for AT.

**Fix (one of the following):**

Option A — drop the redundant "Quibly" from the copyright (simplest, preserves every visible character that matters):
```tsx
<span className="font-heading text-base font-bold text-primary">Quibly</span>
<span aria-hidden="true">·</span>
<span>© 2026</span>
```

Option B — keep the copyright text but mark the wordmark as the brand and the copyright as a separate non-redundant element (preserves visual fidelity verbatim):
```tsx
<span aria-label="Quibly home" className="font-heading text-base font-bold text-primary" role="img">
  Quibly
</span>
<span aria-hidden="true">·</span>
<span>{/* visually identical text but AT-only label avoids duplication */}
  <span aria-hidden="true">© 2026 Quibly</span>
  <span className="sr-only">Copyright 2026</span>
</span>
```

Option C — wrap the entire footer row in a single `<p>` and reorder so the wordmark sits adjacent to a verb that disambiguates it (e.g. "Quibly · made with care · © 2026 · Privacy · Terms"). Larger copy change; only worth it if the founder wants to keep both literal occurrences.

Recommended: **Option A** — removes the duplication with one line of change, no a11y trade-offs, no founder copy review required.

This is classified BLOCKER because the duplicated wordmark is read on every page load by every screen-reader user, and the footer is rendered on every route (including the still-to-ship `/privacy` and `/terms` per D-27). Fixing it later would require a footer change after Phase 5 has shipped, exactly when the file is supposed to be untouched.

## Warnings

### WR-01: LCP painted-area "defense" relies on undocumented font-metric assumption

**File:** `tests/visual/above-fold.spec.ts:44-62`, `components/sections/hero.tsx:30-37`
**Category:** Test reliability / LCP enforcement
**Issue:**
The `above-fold.spec.ts` `hero <h1> painted area exceeds sub-headline painted area at 320px (LCP defense)` test multiplies `width × height` of the bounding boxes. The sub-headline is 24 words at `text-base` (16px × ~1.5 line-height = ~24px per line) inside a `max-w-xs` (320px) cap with `px-6` (272px content). 24 words at ~5 chars/word × 8.5px/char ≈ 1020px of inline text; at 272px content width that wraps to ~4 lines × 24px = ~96px tall.

The H1 ("You know your business. Quibly knows how to market it.") is 10 words ≈ 60 chars at `text-3xl` (~30px font-size × ~1.1 leading ≈ 33px per line). At 272px content with `font-heading` (Quicksand 700) Quicksand renders wider than Figtree, so it wraps to ~3 lines × 33px = ~99px tall.

Painted areas: H1 ~272×99 ≈ 26928 px², sub-headline ~272×96 ≈ 26112 px². The H1 wins by ~3% — within margin of font-metric variance across systems. A 4-line sub-headline (one extra wrap) flips the result and the test starts failing on the first system whose Figtree fallback metric produces slightly wider glyphs (e.g., default macOS Helvetica fallback before web font swaps in).

Additionally, the test runs against `localhost` after `npm run start`. Lighthouse CI runs against the Vercel preview, where the font metrics may match; CI Playwright (if Phase 3 runs the spec in CI) would run against an Ubuntu Chromium with different fallback fonts.

**Fix:**
Replace the heuristic with a direct LCP assertion:
- Use `PerformanceObserver` for `largest-contentful-paint` entries via `page.evaluate(...)` and assert the `element.tagName === 'H1'`. This is what Lighthouse actually scores on, not the painted-area heuristic.
- If keeping the painted-area test as a defense-in-depth: pad the assertion margin (e.g. require H1 area ≥ 1.25× sub-headline area) and document the assumption in the test, so a regression that erodes the margin (e.g., sub-headline copy lengthening to 25 words) produces a meaningful failure rather than an off-by-one font metric.

### WR-02: Lighthouse CI workflow lacks an explicit `permissions:` block

**File:** `.github/workflows/lighthouse.yml`
**Category:** CI security hardening
**Issue:**
The workflow does not declare `permissions:` at the workflow or job level. GitHub falls back to the repository's default `GITHUB_TOKEN` permissions, which (depending on org policy) can be `write` for `contents` and other scopes. A workflow that runs `treosh/lighthouse-ci-action@v12` against a `${{ steps.vercel-preview.outputs.url }}` does not need any write permission on the repo; granting it implicitly broadens the supply-chain blast radius if either pinned action is compromised.

Without explicit `permissions:`, an attacker who manages to inject content into the LHCI report URL or who exploits a transitive dep in `@lhci/cli` can pivot through the runner with whatever the repo default permits.

**Fix:**
Declare least-privilege permissions at the workflow top level:
```yaml
permissions:
  contents: read
  pull-requests: write   # only if LHCI_GITHUB_APP_TOKEN is used to comment on PRs; remove otherwise
  statuses: write        # only if the workflow needs to set commit statuses; remove otherwise
```
If the LHCI app is not yet installed (Plan 02-05 SUMMARY notes it is optional), the minimal block is:
```yaml
permissions:
  contents: read
```

### WR-03: `pull_request:` trigger runs untrusted PR code with internal-branch secrets

**File:** `.github/workflows/lighthouse.yml:5-9`
**Category:** CI / supply-chain
**Issue:**
The workflow triggers on `pull_request:` (not `pull_request_target:`), which is the safer choice for forks (no secrets exposed). However, for **same-repo branches**, the workflow runs the PR's head SHA — including any modifications to `.github/workflows/lighthouse.yml`, `.lighthouserc.json`, or transitive deps — with full access to `secrets.VERCEL_TOKEN` and `secrets.LHCI_GITHUB_APP_TOKEN`.

Because Plan 02-05's checkpoint Step 6 explicitly directs the developer to push branches to the same repo (not a fork), every PR will execute with full secret access. The status check name `Lighthouse CI / lighthouse` is what D-34 plans to make required-for-merge; an attacker with same-repo push rights can author a PR that prints `${{ secrets.VERCEL_TOKEN }}` into a temporary public storage URL the moment the workflow runs.

This is currently mitigated only by the assumption that same-repo push access ≈ trust. Once additional collaborators are added (post-launch), the assumption weakens.

**Fix:**
Two-layer hardening, in priority order:
1. **Add explicit `permissions:` block** (see WR-02) so even if the workflow is hijacked, it can't write to the repo.
2. **Move secrets handling out of `pull_request:`** by either:
   - Splitting LHCI into a `push:` workflow that runs on `main` only (no PR-time secret exposure), OR
   - Restricting `VERCEL_TOKEN` scope to **read-only** on the Vercel team (which already covers the `wait-for-vercel-preview` use case — the action only polls for the preview URL).

Audit `T-02-02 mitigation` in Plan 02-05 — the SUMMARY's grep `'echo.*VERCEL_TOKEN'` test catches the trivial leak case but not arbitrary log-level exfiltration (e.g., setting the token as a job-level `env:` and a malicious step `echo "$RUNNER_OS"` that gets injected into a log path).

### WR-04: Test fixtures use fragile `.first()` selectors that silently shift on DOM changes

**File:** `tests/visual/above-fold.spec.ts:23-25`, `tests/visual/above-fold.spec.ts:44-48`, `tests/visual/button-radius.spec.ts:31`
**Category:** Test reliability
**Issue:**
The Playwright specs use selectors that do not uniquely identify the intended target:
- `page.locator("section p").first()` — matches any `<p>` directly inside any `<section>`. Today this is the hero sub-headline. If a future plan adds a leading `<p>` to the hero (e.g. an "Announcement" eyebrow above the H1) or rearranges the section order, `.first()` silently switches targets and the LCP assertion measures the wrong element.
- `page.locator('button[aria-disabled="true"]').first()` — selects the hero CTA only because of D-31 DOM ordering. Phase 3 changes this order (the SUMMARY of Plan 02-06 documents this as a forcing function). Acceptable as a forcing function, but the broader concern is silent target drift in Phase 2 itself, before Phase 3.
- `page.locator("text=Launching Summer 2026")` — a partial-text selector that would match any element containing that string. If the same string is reused (e.g., the founder paragraph references "Launching Summer 2026"), the locator becomes ambiguous.

**Fix:**
Add explicit `data-testid` or `id` attributes to the testable elements:
```tsx
// hero.tsx
<h1 data-testid="hero-headline" ...>...</h1>
<p data-testid="hero-subheadline" ...>...</p>
<Button data-testid="hero-cta" ...>...</Button>
<p data-testid="hero-microcopy" ...>...</p>
```
```ts
// above-fold.spec.ts
const h1 = page.getByTestId("hero-headline")
const subHeadline = page.getByTestId("hero-subheadline")
```
This is more robust than CSS selector indexing and survives DOM reorganization across phases.

### WR-05: `globals.css` carries ~140 lines of dead/unrelated CSS from `marketing-app`

**File:** `app/globals.css:142-329`
**Category:** Code quality / dead code
**Issue:**
The file imports cleanly but ships substantial CSS that is unreachable on the Phase 2 page:
- `.dark` rules (lines 87-119) — the project explicitly disables dark mode in v1 (D-23 in 02-CONTEXT.md, "no `next-themes`, no `.dark` toggle in v1"). The `<html>` element never gets the `.dark` class. ~33 lines of unused tokens.
- `[data-sidebar="…"]` rules (lines 142-160) — there is no sidebar component on the landing page; these target a marketing-app sidebar that does not exist here. ~19 lines.
- `.bg-warning`, `.bg-scarcity` utilities (lines 175-180) — comments explicitly reference "Phase 26 Plan 10" and "Phase 26 Plan 11" of `marketing-app`; not used on the landing page. ~6 lines.
- Schedule-X calendar overrides (lines 182-219) — `marketing-app` has a calendar; this project does not. ~38 lines, ~700 bytes minified.
- `.prose` typography rules (lines 221-329) — the only `.prose` consumer in this repo would be future `/privacy` and `/terms` pages (Phase 5). Phase 2 ships them as dead CSS regardless. ~109 lines, ~2KB minified.
- Lines 162-164 comment about "Each brand's accentColor from the DB drives --brand-dot, --brand-accent" — references multi-brand DB-driven theming that this project does not have.

This is BOTH a code-quality issue (dead code, misleading comments) AND a Lighthouse render-blocking-resources concern (the `render-blocking-resources maxLength: 1` gate is currently met, but every byte added to the global CSS chunk pushes wastedMs higher; LHCI reports `wastedMs: 159-178` already, mostly from this CSS).

Performance is out of v1 scope per the review charter, so the framing here is **dead-code removal**, not perf — but the perf benefit is a happy side-effect.

**Fix:**
Remove unused blocks. Suggested deletions:
- Drop the entire `.dark { … }` block (lines 87-119) until dark mode ships.
- Drop the `[data-sidebar=…]` rules (lines 142-160).
- Drop the `.bg-warning` / `.bg-scarcity` block (lines 173-180).
- Drop the entire Schedule-X section (lines 182-219).
- Defer the `.prose` block to Phase 5 — add it to a route-group `globals` or scope it to `/privacy` and `/terms` when those ship.
- Update or remove the misleading "(D-14)" / "Each brand's accentColor from the DB" comment block (line 162-164).

If any of these will be needed in a near-term phase, comment them with the phase number that will reintroduce them, e.g. `/* phase-5: prose styles for /privacy and /terms */`.

### WR-06: Footer `flex-wrap` produces orphaned middots on narrow viewports

**File:** `components/sections/footer.tsx:34`
**Category:** Layout / mobile UX
**Issue:**
The footer's outer flex container uses `flex-wrap`. With `gap-3` (12px) and items including `min-h-12` link tap targets at `text-sm` (14px) baseline plus middot spans, total content width on a 320px viewport is approximately:
- Wordmark "Quibly" ~50px + middot ~10px + "© 2026 Quibly" ~110px + middot + "Privacy" link (px-2 + ~50px content = ~66px) + middot + "Terms" link (~58px) + 5 × `gap-3` (60px) = ~414px

This exceeds 320px viewport, so items wrap. When they wrap, a middot can end up at the start of a new visual row (orphan separator), or two middots can stack vertically (the middot before "Privacy" wraps to its own row with the link). This is a visual regression vs the design-spec single-row expectation (D-18 "minimal centered single row, … Footer height ≤ ~60px").

The Playwright above-fold spec only asserts each link's `boundingBox().height >= 48`, which still holds when items wrap (each link is still 48px tall) — it does not catch the ugly wrap.

**Fix:**
Remove `flex-wrap` and ensure content fits at 320px, e.g.:
- Drop "© 2026" copyright text from the inline row, surface it as a hover-tooltip or a sub-row, or
- Tighten gaps to `gap-2`, or
- Stack as `flex-col sm:flex-row` so mobile gets vertical, desktop gets horizontal:

```tsx
<div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 text-sm text-muted-foreground sm:flex-row sm:justify-center md:px-8">
  …
</div>
```

Add a Playwright assertion for the footer total height on 320×568 (`<= 80px` or similar) to lock the contract.

### WR-07: SUMMARY documentation diverges from actual `tsconfig.json` state

**File:** `tsconfig.json`, `.planning/phases/02-static-landing-page-no-form/02-04-SUMMARY.md`, `.planning/phases/02-static-landing-page-no-form/02-06-SUMMARY.md`
**Category:** Documentation accuracy
**Issue:**
Plan 02-06 SUMMARY claims (line 193): "the `tsconfig.json` exclusion of `tests/` from `tsc --noEmit` … ship via Plan 02-04". The actual `tsconfig.json` has no `tests/` exclusion — its `include` covers `**/*.ts`, which DOES include `tests/visual/*.spec.ts`. Type-checking succeeds because `@playwright/test` types are available in `node_modules`, not because tests are excluded.

This is a documentation defect, not a code defect, but it matters because:
- Future plans that read these SUMMARYs will assume `tests/` is excluded and may write tests that rely on dev-only types or imports
- The "5 errors all from missing `@playwright/test` types" claim in Plan 02-06 SUMMARY ("npm run check 2>&1 | grep -v ...") was a one-time pre-merge observation that no longer reflects reality post-merge

**Fix:**
Either:
1. Add the documented exclusion to make doc and code agree: in `tsconfig.json`, add `"exclude": ["node_modules", "tests"]` if tests should not be type-checked, OR
2. Correct the SUMMARYs (Plan 02-04 and Plan 02-06) to remove the false claim about `tsconfig.json` exclusion. The docs were committed; they survive in the planning record indefinitely.

If staying with current behavior (tests are type-checked), the SUMMARYs need an addendum. If moving to excluded, the type-check coverage of test files is lost — pick consciously.

### WR-08: Hero `<p>` sub-headline lives outside the inner flex container, decoupled from H1 layout

**File:** `components/sections/hero.tsx:29-37`
**Category:** Layout fragility
**Issue:**
The hero structure is:
```
<section relative isolate overflow-hidden py-8 md:py-16 lg:py-24>
  <div aria-hidden ... gradient />
  <div mx-auto flex max-w-6xl flex-col-reverse items-center gap-4 px-6 ...>
    <h1>...</h1>
    <HeroMascot />
  </div>
  <p mx-auto mt-4 max-w-xs px-6 ...>...</p>          ← outside the flex
  <div mt-4 flex flex-col items-center>...CTA cluster...</div>   ← outside the flex
</section>
```

The H1 is inside an `mx-auto flex max-w-6xl px-6 md:px-8` container. The sub-headline `<p>` is a direct child of the section with its own `mx-auto max-w-xs sm:max-w-prose px-6` constraints. The `mt-4` on the `<p>` measures from the bottom of the inner flex container, NOT from the H1 — they are siblings. On viewports between the breakpoints, this couples to two different width systems, with two different sources of horizontal padding (`px-6` on the flex parent, `px-6` on the `<p>` itself).

Today the layout works because at narrow viewports both end up the same effective content width. But:
- A future plan that adjusts the inner flex container's max-width or padding will not propagate to the sub-headline (the `<p>` is decoupled)
- A future plan that adjusts the `<p>` width assumes the flex parent's max-width is the same — easy to break
- A reader of the file has to manually trace the two parallel layout systems to understand alignment

The CTA cluster `<div>` has the same issue (line 38).

This is technically not a bug — it works — but it's a structural quality issue that makes the file fragile.

**Fix:**
Move the sub-headline `<p>` and the CTA cluster `<div>` inside the inner flex container. Since the flex is `flex-col-reverse`, source order to render `mascot, h1, subheadline, cta, microcopy` visually requires either:
- Flip the container to `flex-col` and place children in render order: `<HeroMascot />`, `<h1>`, `<p>`, `<CtaCluster>`. The DOM order then leads with mascot. This breaks D-03 (LCP guard requires H1 DOM-first).
- Keep `flex-col-reverse` and order children in reverse-render order: `<CtaCluster>`, `<p>` subheadline, `<h1>`, `<HeroMascot>`. Visual: mascot top, h1, subheadline, cta cluster (bottom). DOM: CTA first, h1 third — H1 not DOM-first, also breaks D-03.

The current decoupled structure is therefore **the correct trade-off** to satisfy the LCP guard, but it should carry an inline comment explaining *why* the sub-headline lives outside the flex (so future maintainers don't "fix" it):

```tsx
{/* Sub-headline + CTA live OUTSIDE the inner flex container by design.
    Inside, flex-col-reverse keeps the <h1> DOM-first (LCP guard, D-03)
    while painting the mascot above. Moving sub-headline inside would
    require either breaking the LCP guard or putting the CTA before
    the h1 in DOM. Both worse than the visual decoupling. */}
```

## Info

### IN-01: `aria-disabled="true"` buttons remain visually-active and clickable

**File:** `components/sections/hero.tsx:39`, `components/sections/placeholder-form-section.tsx:34`, `components/sections/secondary-cta.tsx:24`
**Category:** UX / a11y nuance
**Issue:**
The three D-31 disabled CTAs use `aria-disabled="true"` (correct for AT awareness) but NOT the native `disabled` attribute. As a result:
- The CSS rules `disabled:pointer-events-none disabled:opacity-50` in `buttonVariants` (button.tsx:8) do NOT match — the buttons stay fully opaque and remain hover/active responsive (`active:not-aria-[haspopup]:translate-y-px` still fires on click).
- Visual indicators of "this is dimmed/inactive" are absent. UI-SPEC and CONTEXT explicitly chose this ("renders visually identical to the locked Phase 2 styling but cannot be clicked to a no-op self-anchor"), but the trade-off is that **sighted users get no signal** that the button is disabled. Click → translate-y animation fires → nothing happens → user wonders if it broke.
- Keyboard users tabbing in get the focus-visible ring AND the `aria-disabled` announcement. They at least know it's disabled.
- Pointer users and touchscreen users get only the lack-of-feedback signal.

This is a deliberate design decision per D-31, but it borders on a **dark pattern**: the button is styled as the primary call-to-action, has the brand teal background, and is fully animated, yet does nothing. Users hammering the CTA may bounce.

**Fix (optional, suggest discussing with founder):**
Either:
- Accept the trade-off and add a `title="Form coming soon"` attribute to surface a tooltip on long-hover (mobile users still get nothing).
- Rename the visible CTA to clearly indicate disabled state: "Form opens soon ➜" with no `bg-primary`, no `aria-disabled` (just plain non-interactive text). Loses the "primary CTA shape" but gains honesty.
- Replace the three buttons with a single non-interactive marquee like "Waitlist opens summer 2026 — check back soon" centered on the page. Phase 3 lays the form on top.

If the design intent really is "preserve pixel-perfect button shape until Phase 3 swaps it", at minimum add `cursor-not-allowed` to the variant when `aria-disabled="true"`:
```tsx
// in button.tsx CVA size: hero entry
hero: "h-auto rounded-[28px] px-9 py-3.5 text-base aria-disabled:cursor-not-allowed aria-disabled:opacity-70"
```

### IN-02: `<Button>` `data-size="hero"` exposes a more reliable test selector than `aria-disabled`

**File:** `components/ui/button.tsx:61`, `tests/visual/button-radius.spec.ts:31`
**Category:** Test reliability
**Issue:**
The Button component already sets `data-size={size}` on the rendered element. `tests/visual/button-radius.spec.ts` selects via `button[aria-disabled="true"]` instead of `button[data-size="hero"]`. The latter is the load-bearing attribute for the radius assertion (the variant carries `rounded-[28px]`); using it would:
- Match exactly the buttons whose radius is being tested, regardless of disabled state
- Be stable across phases (Phase 3's form submit will still be `data-size="hero"`)
- Avoid the documented `expect(count).toBe(3)` Phase-3 forcing function (which is correct as a forcing function for D-31, but `data-size="hero"` count would also serve)

**Fix:**
Update test selector:
```ts
const heroButtons = page.locator('button[data-size="hero"]')
```

This complements rather than replaces the count-as-forcing-function decision; the Phase 3 transition still requires the count to be reviewed.

### IN-03: `--radius` in `globals.css` is `0.625rem` (10px), but design system locks 28px hero pill — token chain unused

**File:** `app/globals.css:76`, `components/ui/button.tsx:35`
**Category:** Design-system / token consistency
**Issue:**
`globals.css` defines `--radius: 0.625rem` and a derived scale (`--radius-3xl` = `var(--radius) * 2.2` = ~22px). The hero CTA bypasses this scale entirely with the literal arbitrary value `rounded-[28px]`. This is correct per D-06 (which locks the literal 28px), but it means:
- The radius scale's `--radius-4xl` = `var(--radius) * 2.6` = ~26px — close to but not 28px.
- A future maintainer trying to add a "wider hero pill" cannot extend a scale; they'd have to add another arbitrary value.
- The rest of the codebase uses scale tokens (`rounded-lg`, `rounded-3xl` in HeroMascot), but the locked hero pill is an outlier.

**Fix (deferred — not blocking):**
Add a phase-level token to the `:root` block:
```css
:root {
  --radius-hero: 1.75rem; /* 28px — locked by design system §1, used by btn-hero */
}
```
Then in `button.tsx`:
```ts
hero: "h-auto rounded-[var(--radius-hero)] px-9 py-3.5 text-base"
```

Same rendered output, but the magic number lives in one place and is named.

### IN-04: `.prose` block in `globals.css` references `--primary` but uses raw color `#111827`/`#6b7280` for text

**File:** `app/globals.css:226-323`
**Category:** Token consistency
**Issue:**
Lines 228 (`color: #111827`) and 285 (`color: #6b7280`) hard-code colors that already exist as tokens (`var(--foreground)` and `var(--muted-foreground)`). Lines 281 and 317 correctly use `var(--primary)`.

If the `--foreground` or `--muted-foreground` tokens shift (e.g., a tone adjustment in Phase 5), the `.prose` text will drift away from the rest of the site.

This is INFO because `.prose` is dead code in Phase 2 (see WR-05). If Phase 5 ships it as-is, the inconsistency lands then.

**Fix:**
Replace literals with tokens:
```css
.prose { line-height: 1.75; color: var(--foreground); }
.prose :where(blockquote)…  { color: var(--muted-foreground); }
```

### IN-05: Plan 02-05 SUMMARY says `numberOfRuns is 3` — verify against `.lighthouserc.json` literal

**File:** `.lighthouserc.json:19`
**Category:** Documentation cross-check
**Issue:**
`numberOfRuns: 3` is correct in `.lighthouserc.json`, matching the SUMMARY. But Plan 02-05's median assertion is sensitive to small-N noise — Run #1 scored 82, Run #2 and #3 scored 92 each, median 92. If a future change pushes Run #2 down to 89, the median fails. With only 3 runs, one outlier is enough to swing the gate.

This is INFO because increasing `numberOfRuns` increases CI time linearly; the SUMMARY documents this is intentional.

**Fix (optional):**
Bump to `numberOfRuns: 5` if CI runtime budget permits. With 5 runs, median is more stable and one outlier no longer swings the assertion.

### IN-06: No `<title>` or per-page metadata for `/` — relies on layout default

**File:** `app/page.tsx`, `app/layout.tsx:20-29`
**Category:** SEO / metadata (deferred to Phase 5 by spec)
**Issue:**
`app/page.tsx` exports no `metadata`. The layout's `metadata.title.default = "Quibly"` is what renders. So the page `<title>` is just `"Quibly"`, not the conventional descriptive title (e.g., "Quibly — Strategy-first AI marketing for solopreneurs"). The Lighthouse SEO advisory warn was 100, so technically passing.

This is documented as deferred to Phase 5 in CONTEXT (`Phase 5 owns metadata`). **No action required for Phase 2** — flagging only so Phase 5 doesn't forget.

**Fix (Phase 5):**
Add `metadata` export to `app/page.tsx`:
```tsx
export const metadata: Metadata = {
  title: "Strategy-first AI marketing for solopreneurs and small teams",
  description: "Quibly is the AI marketing partner that builds your strategy first, then executes. Join the waitlist.",
  openGraph: { /* ... */ },
}
```

---

## Notes / Context

**Strengths observed (not findings):**
- Pure-RSC discipline holds: zero `'use client'` across `app/`, `components/sections/`, `components/quibs/` confirmed by inspection.
- No XSS sinks: zero `dangerouslySetInnerHTML` across all reviewed files. All copy is React JSX literal (auto-escaped).
- `cn()` and `tailwind-merge` integration is correct — the `rounded-full` (base) vs `rounded-[28px]` (hero variant) source order produces the expected merge behavior, and the Playwright runtime spec catches regressions.
- D-32 footer tap targets implemented correctly with `inline-flex min-h-12 items-center px-2`. Computed height is ≥48px regardless of the `text-sm` font line-height.
- D-31 disabled CTAs use `aria-disabled="true" type="button"` with no `href`, no `asChild`, no fragment self-anchor — matching the post-review decision.
- Lucide icons in `WhyQuibly` correctly set `strokeWidth={1.75}` and `aria-hidden="true"` per design-system §1 sidebar-icons rule.
- Middot separators in footer correctly use `<span aria-hidden="true">` to suppress AT announcement (Pitfall #7 from cross-AI review).
- `prefers-reduced-motion: reduce` override in `globals.css` is correctly placed in a separate `@layer base` block and disables `scroll-behavior: smooth` as expected.
- Phase 2 Lighthouse mobile run reportedly scores median 92 (target ≥90), CLS 0, LCP element confirmed as `<h1>` per Plan 02-05 evidence.

**Out-of-scope items deliberately not flagged:**
- The `render-blocking-resources maxLength: 1` deviation (vs the plan's `0`) is documented in 02-CONTEXT.md and 02-05-SUMMARY.md as a deliberate threshold. Reviewer agrees with the rationale.
- D-19 "footer hrefs 404 in Phase 2" is a locked cross-phase seam, not a defect.
- Phase 1 carryover in `globals.css` (oklch tokens, `@theme inline`, font wiring) was reviewed in Phase 1; only Phase-2 incremental adds are scoped here (the `@layer base` reduced-motion block).

**Verification commands run during review:**
- Read each file under review at full content via Read tool.
- Inspected `node_modules/shadcn/dist/tailwind.css` and `node_modules/radix-ui/dist/index.d.ts` to verify the unusual import paths resolve.
- Cross-checked `components/quibs/quibs-icon.tsx` for `aria-hidden` posture (already set on the SVG).
- Cross-checked `app/layout.tsx` body classes (`min-h-full flex flex-col`) for layout consistency with the page composition.
- Cross-checked `tsconfig.json` `include` against the SUMMARY claim of test exclusion.

---

_Reviewed: 2026-04-27T20:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
