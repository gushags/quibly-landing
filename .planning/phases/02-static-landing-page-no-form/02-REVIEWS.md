---
phase: 2
reviewers: [gemini, codex]
reviewed_at: 2026-04-27T18:14:00Z
plans_reviewed:
  - 02-01-PLAN.md
  - 02-02-PLAN.md
  - 02-03-PLAN.md
  - 02-04-PLAN.md
  - 02-05-PLAN.md
self_skipped: claude (running inside Claude Code CLI)
---

# Cross-AI Plan Review — Phase 2: Static Landing Page (No Form)

## Gemini Review

This review evaluates the Phase 2 implementation plans for the Quibly Landing project against the provided requirements and technical constraints.

---

### Plan 02-01: Foundation — Button `size="hero"` variant + `prefers-reduced-motion` override

**Summary**: A surgical plan to prepare the design system and global styles for Phase 2. It introduces the specific pill-style CTA variant required for the landing page and ensures accessibility compliance for users with motion sensitivities.

**Strengths**:
- **Surgical Additions**: Zero impact on existing logic; additive-only approach minimizes regression risk.
- **Accessibility-First**: Proactively handles `prefers-reduced-motion` at the base layer.
- **CVA Best Practices**: Correctly utilizes shadcn's `buttonVariants` pattern rather than creating a one-off component.

**Concerns**:
- **`tailwind-merge` Conflict (LOW)**: The plan assumes `rounded-[28px]` will override `rounded-full`. While `tw-merge` is designed for this, if `rounded-full` is hardcoded in the component's `className` rather than the CVA base, the override behavior depends on the order of arguments passed to `cn()`.
- **Media Query Placement (LOW)**: Standard practice for v4 is to keep `@media` queries within the utility or component definitions, though placing it in `@layer base` is acceptable for a "global" behavior.

**Suggestions**:
- Verify that `rounded-full` is indeed in the `buttonVariants` base string. If it is in the component's `className` prop within `button.tsx`, ensure `size` variants are passed correctly through `cn()`.

**Risk Assessment: LOW**. The changes are purely stylistic and follow established project patterns.

---

### Plan 02-02: Hero + HeroMascot + PlaceholderFormSection

**Summary**: Implements the core above-the-fold experience. It utilizes a clever DOM-reordering trick to ensure the H1 is the LCP element while maintaining the visual mascot-first design. It also establishes the `#waitlist` anchor seam for Phase 3.

**Strengths**:
- **SEO/Perf Alignment**: The `flex-col-reverse` pattern is a high-signal engineering choice to force H1 as LCP (HERO-06).
- **Asset Hygiene**: `HeroMascot` is appropriately scoped as a section-local RSC, avoiding design system bloat.
- **Future-Proofing**: The `PlaceholderFormSection` establishes the `id="waitlist"` ID now, ensuring Phase 3 integration is a "swap-in" operation.

**Concerns**:
- **Mobile Fold Height (HIGH)**: The requirement is headline + subheadline + mascot + CTA above the fold at **320×568**.
  - *Math*: `py-16` (128px) + Mascot (88px) + Gap (24px) + Headline (~120px) + Subheadline (~80px) + Gap (24px) + CTA (52px) + Microcopy (24px) = **540px**.
  - Mobile Safari/Chrome viewports at 568px height usually only have **~460px–480px** of usable height after browser chrome. This plan will likely result in the CTA being cut off or requiring a scroll.
- **Gradient Identity (LOW)**: The radial gradient in `Hero` uses hardcoded OKLCH values. Ensure these match the Phase 1 tokens if they were intended to be brand-linked.

**Suggestions**:
- Reduce mobile vertical padding on the Hero section (e.g., `py-10` or `py-12`) to recover vertical space for the 320px viewport.
- Consider moving the background gradient to a global utility or a more reusable `BackgroundGlow` component if other pages are planned.

**Risk Assessment: MEDIUM**. The visual requirement for "no scroll at 320x568" is at high risk of failure due to vertical stack height and browser chrome.

---

### Plan 02-03: WhyQuibly + FounderVoice + SecondaryCTA + Footer

**Summary**: Completes the below-the-fold content using pure RSC markup. The plan adheres strictly to the locked design decisions regarding icon stroke widths, grid layouts, and minimal footer presentation.

**Strengths**:
- **Semantic HTML**: Proper use of `<footer/>`, `aria-hidden` on icons, and middot separators.
- **Copy Accuracy**: Directly implements the "founder voice" and "secondary CTA" requirements without over-engineering with client-side state.
- **Icon Consistency**: Adheres to the specific `strokeWidth={1.75}` requirement which distinguishes the brand's aesthetic.

**Concerns**:
- **Footer Links (LOW)**: Linking to `/privacy` and `/terms` (which 404) is correct per plan, but ensure `next.config.ts` or a custom 404 page is ready to handle this professionally if a user clicks them during the preview.
- **Icon Sizing (LOW)**: Ensure Lucide icons in `WhyQuibly` have a consistent `size={24}` (or similar) to avoid layout shifts if they load at different times (though they are bundled SVG strings).

**Suggestions**:
- Wrap the footer links in a `nav` or ensure the flex-gap is sufficient for a 48px touch target (MOB-02). Currently, `gap-3` (12px) with `px-1` padding might be tight for mobile accessibility.

**Risk Assessment: LOW**. Straightforward implementation of static content.

---

### Plan 02-04: Page Composition + Manual Verification

**Summary**: Aggregates all sections into the main entry point and establishes a "Human-in-the-loop" verification gate. This is the critical quality control step before CI.

**Strengths**:
- **Compositional Simplicity**: `app/page.tsx` remains a clean manifest of sections.
- **Comprehensive Verification**: The list of manual checks (LCP identity, viewport scaling, reduced motion) is exhaustive and covers the highest-risk requirements.

**Concerns**:
- **Scroll Margin (MEDIUM)**: `PlaceholderFormSection` has `scroll-mt-16`. If the page has no fixed header (none is mentioned), this might create an odd gap when jumping to `#waitlist`.
- **Fragment usage (LOW)**: The use of `<main>` and `<Footer>` outside the main container is correct for semantic structure.

**Suggestions**:
- Add a check for "Over-scroll behavior" on mobile to ensure the radial gradients don't "clip" awkwardly during bounce.

**Risk Assessment: LOW**. This plan is a coordination effort with no logic of its own.

---

### Plan 02-05: Lighthouse CI Gate

**Summary**: Implements automated enforcement of performance and layout stability. This is the most critical plan for satisfying the project's technical "Success Criteria."

**Strengths**:
- **CI Enforcement**: Moving from "vibe-check" to "exit-code check" for Performance >= 90 is excellent.
- **Vercel Integration**: Using `wait-for-vercel-preview` ensures the CI runs against the actual production-like build rather than a local dev server.
- **Strict CLS Assertion**: A `maxNumericValue: 0.1` assertion directly enforces the core requirement.

**Concerns**:
- **Local LHCI Complexity (MEDIUM)**: Running `npm run start &` in the background can be flaky in CI environments if the process doesn't start fast enough.
- **Github Action Timeout (LOW)**: `max_timeout: 300` is generous, but the wait-for-vercel-preview can sometimes exceed this if Vercel is having a slow build day.

**Suggestions**:
- In Task 2, use `npx wait-on http://localhost:3000` before running LHCI to ensure the server is ready.
- Ensure the GitHub Action is configured to "Fail on error" so that PRs cannot be merged if Lighthouse scores drop.

**Risk Assessment: MEDIUM**. CI configuration is notoriously prone to "it works on my machine" failures during initial setup.

---

### Phase-Level Review

**Cross-Plan Consistency**: The plan set is highly cohesive. The "Foundation" (01) enables the "Sections" (02, 03), which are composed in the "Page" (04), and finally validated by the "CI" (05). The use of the `#waitlist` anchor as a thread through all plans is well-executed.

**Goal Achievement**:
- **Criterion 1 (320px Fold)**: **RISK**. As noted in Plan 02-02, the vertical stack is very tall for a 320x568 device.
- **Criterion 2 (Scaling)**: **LIKELY**. Tailwind's responsive prefixes are correctly applied throughout.
- **Criterion 3 (Below Fold)**: **SUCCESS**. Covered extensively by 02-03.
- **Criterion 4 (Lighthouse)**: **SUCCESS**. Plan 02-05 provides the necessary automation.
- **Criterion 5 (Reduced Motion)**: **SUCCESS**. Covered in 02-01.

**Top 3 Risks**:
1. **Vertical Space (320px Viewport)**: The hero content will likely require scrolling on small devices, violating the "above the fold" requirement.
2. **LCP Misidentification**: While the DOM order is correct, a slow-loading font or a heavy gradient paint could still delay the H1 paint-time enough for Lighthouse to flag the Mascot if the Mascot paints instantly.
3. **CI Flakiness**: The Lighthouse CI gate depends on external Vercel previews which can introduce latency or non-deterministic failures in the PR pipeline.

**Missing Elements**:
- **Favicon/Metadata**: The plan doesn't mention updating `app/layout.tsx` metadata (Title, Description, Favicon) which is critical for the SEO score in Lighthouse.
- **Image Optimization**: While the Mascot is a CSS/Icon combo, any future use of `next/image` should be pre-emptively discussed to maintain the `CLS < 0.1` goal.

**Final Verdict**: Executing these plans will result in a high-quality, high-performance landing page. The only significant concern is the 320px viewport "fold" constraint, which should be mitigated by tightening vertical spacing in Plan 02-02.

---

## Codex Review

### Plan 02-01 — Foundation

**Summary**
Good, tightly scoped foundation work. The reduced-motion override is correct and low risk. The `size="hero"` variant is directionally right, but the plan relies on class-merging behavior that should be proven once in code/tests, not only manually.

**Strengths**
- Minimal, additive edits to shared primitives.
- Uses CSS media query for `prefers-reduced-motion` with zero client JS.
- Keeps smooth-scroll default while honoring reduced-motion users.
- Introduces reusable CTA size token (`hero`) for Phase 2 and Phase 3 continuity.

**Concerns**
- [MEDIUM] `rounded-[28px]` overriding base `rounded-full` depends on `tailwind-merge` grouping behavior and class order through `cva` + `cn`; if order changes later, radius can silently regress.
- [LOW] Acceptance is mostly manual grep/checks; no regression guard for border-radius value.

**Suggestions**
- Add a tiny unit assertion on `buttonVariants({ size: "hero" })` output (or snapshot) to ensure `rounded-[28px]` survives.
- Add a visual/DOM check in CI (Playwright or simple computed-style test) for CTA border radius on homepage.
- Keep the reduced-motion override exactly as proposed; it is correct.

**Risk Assessment**
**LOW-MEDIUM** — small scope, but one silent styling regression vector exists without an automated guard.

---

### Plan 02-02 — Hero + HeroMascot + PlaceholderFormSection

**Summary**
Architecture is strong: pure RSC, clean section boundaries, and the H1-first DOM pattern is the right way to bias LCP toward the headline. Main risk is layout math on 320×568; current spacing likely makes "all required hero elements above fold" fail on small mobile.

**Strengths**
- Correct LCP-guard strategy: H1 appears before mascot in DOM, visual order handled by `flex-col-reverse`.
- `HeroMascot` extracted as a local wrapper, matching locked decision to avoid extending global avatar size config.
- No client components; good Phase 2 purity.
- Anchor seam (`id="waitlist"`) is explicitly established for Phase 3 replacement.

**Concerns**
- [HIGH] 320×568 above-fold target is likely missed with `py-16`, `gap-6`, `mt-4`, `mt-6`, and extra launch microcopy line; vertical stack is too tall.
- [MEDIUM] LCP can still be non-H1 in edge cases (unexpected wrapping/layout shifts, font timing), though current sizing strongly favors H1.
- [LOW-MEDIUM] Placeholder section CTA linking to `#waitlist` from inside `#waitlist` is a no-op interaction; not fatal, but it can feel broken.
- [HIGH] If requirement "all interactive elements ≥48px" is strict, this plan is fine for hero CTA but does not cover later small links in footer (cross-plan dependency risk).
- [HIGH] If "body text ≥16px on mobile" is strict, planned `text-sm` usage (in this and other plans) may violate criteria.

**Suggestions**
- Reduce mobile hero vertical budget aggressively: e.g. `py-6`/`py-8` on base, tighter gaps, possibly move launch microcopy below fold or hide at smallest breakpoint.
- Explicitly verify fold-fit with a deterministic screenshot check at 320×568 (not only manual eyeballing).
- Keep H1 as the largest element in viewport; avoid oversized mascot/shadow/background effects that could compete.
- For the placeholder CTA no-op, either:
  - replace with non-link button-style text (`aria-disabled="true"`), or
  - point to a meaningful anchor (if allowed), while preserving Phase 3 seam.

**Risk Assessment**
**MEDIUM-HIGH** — core structure is good, but fold-fit and strict success criteria compliance are at real risk.

---

### Plan 02-03 — WhyQuibly + FounderVoice + SecondaryCTA + Footer

**Summary**
Component split and content constraints are clean and aligned to locked decisions. Biggest issue is compliance drift against mobile usability criteria: footer links and small text sizing likely violate the stated minimums.

**Strengths**
- Correct section decomposition and clear ownership.
- Uses locked icon set/stroke width and avoids unnecessary shadcn Card abstraction.
- Founder block and footer simplicity match scope (no over-engineering).
- Footer accessibility detail (`aria-hidden` middots) is a good touch.

**Concerns**
- [HIGH] Footer link tap targets (`px-1 py-2`, `text-sm`) likely do not meet ≥48px interactive-height requirement.
- [HIGH] `text-sm` in footer (and possibly other body copy) may violate "body text ≥16px on mobile."
- [MEDIUM] `/privacy` and `/terms` intentional 404s are acceptable per decision, but still user-visible broken links (trust/UX cost).
- [LOW] Hardcoded copy and year reduce future i18n/content flexibility (probably acceptable for Phase 2).

**Suggestions**
- Enforce mobile minimums explicitly:
  - use `min-h-12` / `h-12` on all link-like controls,
  - set body copy to `text-base` on mobile; only reduce at larger breakpoints if needed.
- Add a small checklist/test for touch-target sizing in PR validation.
- Consider temporary stub pages for `/privacy` and `/terms` to avoid dead-end UX, even if full legal pages come later.

**Risk Assessment**
**MEDIUM** — structurally solid, but likely misses explicit mobile/touch/text success constraints unless adjusted.

---

### Plan 02-04 — Page Composition + Manual Verification

**Summary**
Composition order and dependencies are sensible. The major gap is that key acceptance conditions are verified manually only; this is vulnerable to drift and reviewer inconsistency.

**Strengths**
- Clean RSC composition, no extra logic.
- Good dependency ordering across waves.
- Human checkpoint includes the right high-value validations (viewport, LCP identity, reduced motion, a11y spot checks).

**Concerns**
- [MEDIUM-HIGH] Manual-only verification for fold fit and LCP identity is brittle; repeated PR confidence is low.
- [MEDIUM] "LCP element = h1" checked in DevTools can differ from CI/runtime conditions.
- [LOW] HALT/approval workflow can slow throughput if not tightly integrated with team process.

**Suggestions**
- Add automated viewport screenshot/assertion at 320×568 for required above-fold elements.
- Add scripted Lighthouse run in CI for PRs before merge (Plan 02-05 does part of this; tie it directly to required checks).
- Keep manual checkpoint, but only as secondary confirmation after automated gates.

**Risk Assessment**
**MEDIUM** — good orchestration, insufficient automation for hard success criteria.

---

### Plan 02-05 — Lighthouse CI Gate

**Summary**
This is the right direction and largely matches locked decision D-29. The largest risk is governance: workflow presence alone does not block merges unless branch protection requires the check.

**Strengths**
- Uses LHCI with explicit `performance` and `CLS` error-level assertions matching success criteria.
- Runs against preview deployment, which reflects production-like conditions.
- Multiple runs (`numberOfRuns: 3`) reduces single-run noise.
- Good addition of local checkpoint before CI rollout.

**Concerns**
- [HIGH] No explicit branch-protection requirement in scope; CI may be advisory and non-blocking.
- [MEDIUM] `render-blocking-resources` is warning-level despite success criterion language ("no render-blocking third-party scripts"); not enforced as fail.
- [MEDIUM] Preview wait and external integration can be flaky; false negatives/positives possible.
- [LOW-MEDIUM] Temporary public report upload may expose preview metadata; usually acceptable but worth acknowledging.

**Suggestions**
- Make GitHub branch protection configuration explicit deliverable: require Lighthouse job status on `main` PRs.
- Promote `render-blocking-resources` to error if it is truly a hard requirement.
- Add retry/backoff around preview readiness, and pin action versions carefully.
- Document required secrets and failure modes in repo `README`/`CONTRIBUTING`.

**Risk Assessment**
**MEDIUM-HIGH** — technically strong gate, but merge-blocking is not guaranteed without branch protection.

---

### Phase-Level Review

**Cross-plan consistency**
The plan graph is coherent and dependency ordering is sound. The Phase 2→3 seam (`id="waitlist"` wrapper retained, inner body replaced later) is mostly clean, though the current placeholder self-link creates minor UX awkwardness.

**Goal achievement (5 success criteria)**
Executing all 5 plans will likely satisfy most architecture/perf goals, but not reliably all criteria as written without adjustments:
- Criterion 1 (320×568 above-fold with required hero elements): at risk due to vertical spacing budget.
- Criterion 2 (≥48px interactive + ≥16px body text): at risk due to footer/text-sm patterns.
- Criterion 3 (below-fold sections): likely satisfied.
- Criterion 4 (CI-verified perf/CLS): partially satisfied unless branch protection makes checks required.
- Criterion 5 (reduced motion): satisfied for smooth scroll; no decorative motion present.

**Top 3 phase risks**
1. Hard mobile-fit requirement at 320×568 fails due to hero spacing/content stack height.
2. Accessibility/mobile usability constraints (48px targets, 16px body text) are violated in footer/copy styles.
3. Lighthouse workflow may not actually gate merges without required status checks in branch protection.

**Anything missing**
- Explicit branch-protection setup as a deliverable for true CI enforcement.
- Automated viewport/assertion test for 320×568 above-fold composition.
- Automated/style-level guard for CTA `28px` radius and mobile tap-target/text-size constraints.
- Clear decision on placeholder self-link behavior to avoid shipping a perceived broken control.

---

## Consensus Summary

Both reviewers find the plan-graph structurally sound — the wave dependencies, the LCP-guard pattern (DOM-first H1 + `flex-col-reverse`), the section-local `<HeroMascot>` boundary, and the cross-phase `id="waitlist"` anchor are all called out as correct. The biggest disagreement is severity assignment, not direction; both flag the same handful of soft spots.

### Agreed Strengths

- **Surgical, additive Plan 02-01** — minimal risk to existing primitives; correct `prefers-reduced-motion` handling with zero client JS.
- **LCP-guard via `flex-col-reverse` + DOM-first H1** — both reviewers explicitly endorse this as the right way to bias LCP toward the headline.
- **`<HeroMascot>` as a section-local RSC** — avoids polluting `<QuibsAvatar>`'s SIZE_CONFIG with hero-only tokens.
- **Cross-phase `id="waitlist"` seam** — explicitly enables Phase 3 swap-in without re-architecting.
- **Pure RSC posture** — zero `'use client'` directives, no client-side state, no third-party scripts.
- **Lucide stroke-width 1.75 + `aria-hidden` middots** — a11y details are correctly handled.
- **LHCI + Vercel preview integration** — running against a real preview URL (not localhost) is the right choice; multi-run median reduces noise.

### Agreed Concerns (highest priority — both reviewers raised, both rated HIGH or MEDIUM)

1. **HIGH — 320×568 above-fold fold-fit is at real risk.** Both reviewers independently did the height math and concluded the current `py-16` + gaps + microcopy stack pushes the vertical budget over the usable viewport (after browser chrome) on a 320×568 device. **Codex pushes for `py-6/py-8` on mobile + tighter gaps; Gemini suggests `py-10/py-12`.** Either way, Plan 02-02's spacing needs to be tightened on the smallest breakpoint, and SC #1 verification needs to be more rigorous than D-07's optimistic budget math.

2. **MEDIUM — `tailwind-merge` `rounded-full` (base) vs `rounded-[28px]` (variant) is a silent-regression vector.** Both reviewers note that the override depends on class order through `cva` + `cn()`. If the order ever changes, the hero pill silently becomes a stadium shape (`rounded-full`) instead of the design-system-locked 28px corners. Mitigation: add an automated guard — a unit assertion on `buttonVariants({ size: "hero" })` output, or a Playwright computed-style check for `border-radius: 28px` on the homepage CTA.

3. **MEDIUM-HIGH — manual-only verification for hard requirements is brittle.** Plan 02-04's checkpoint relies on developer eyeballing for fold-fit, LCP identity, and reduced-motion. Repeated PR confidence is low. **Codex specifically recommends an automated viewport-screenshot assertion at 320×568.** Plan 02-05's LHCI catches performance/CLS but not above-fold composition.

4. **MEDIUM-HIGH — CI gate may be advisory unless branch protection requires it.** Plan 02-05 wires the workflow but does NOT put GitHub branch-protection rule "require Lighthouse CI status on PR to main" in scope. Both reviewers flag this as the difference between "we have a gate" and "the gate actually blocks merge." Codex calls this out as a HIGH-severity governance gap.

5. **MEDIUM — Placeholder self-link is a perceived UX defect.** The placeholder section's `<a href="#waitlist">` targets the section it lives inside. Clicking it is a no-op. Codex pushes for either `aria-disabled` styling, a different anchor target, or replacement with non-link button-style text. Gemini didn't flag this directly but mentioned scroll-margin oddness in 02-04. CONTEXT.md explicitly accepts this for Phase 2 (D-09 deferred-section commentary), but the cost is "a perceived broken control on the live site between Phase 2 ship and Phase 3 ship."

### Divergent / Reviewer-Specific Concerns

- **Codex (HIGH) — footer `text-sm` (14px) may violate MOB-04 ("body text ≥16px on mobile").** *Note: MOB-04's actual scope is iOS-Safari zoom-on-focus prevention, which applies to inputs, not static text. UI-SPEC and Plan 02-03 explicitly accept 14px for non-`<input>` footer copy. This concern likely overreads MOB-04. Worth confirming explicitly during review and recording the decision in CONTEXT.md.*
- **Codex (HIGH) — footer link tap targets `px-1 py-2` likely under 48px.** *Genuine concern. Plan 02-03 acknowledges (~30–46px effective) and accepts because footer is below the fold and keyboard is the realistic accessibility path. Worth bumping to `py-3` (~46–50px) or `min-h-12` to remove ambiguity, since the cost is one extra Tailwind class.*
- **Gemini — favicon/metadata work is missing from Phase 2.** *Correct that it's missing, but per CONTEXT.md D-26 and `<canonical_refs>` Phase 5 explicitly owns metadata/OG/favicon. Not a Phase 2 gap.*
- **Codex (MEDIUM) — `render-blocking-resources` is warn-level rather than error-level despite SC language.** Worth promoting to `error` since the success criterion language is unconditional.
- **Codex (LOW) — temporary-public-storage report upload exposes preview metadata.** Acceptable for a pre-launch landing page, but worth acknowledging.

### Top 3 Phase-Level Risks (Both Reviewers Agree)

1. **320×568 above-fold fail.** Hero vertical stack is too tall once browser chrome is subtracted; hero CTA likely falls below the fold.
2. **CI gate may be advisory, not blocking.** Branch-protection setup is not in any plan; without it Plan 02-05's workflow runs but cannot block merge.
3. **Manual verification of hard SC items.** Fold-fit, LCP-identity, and reduced-motion all rely on developer eyeballing in Plan 02-04; high drift risk PR-over-PR.

### Recommended Adjustments Before Execution

1. **Plan 02-02:** tighten mobile hero spacing — start with `py-8 md:py-16 lg:py-24`, reduce `gap-6` to `gap-4` on base, drop `mt-6` to `mt-4` on the CTA wrapper, then reverify D-07's budget math against the new totals.
2. **Plan 02-01 or new Plan 02-06:** add an automated regression guard for the `size="hero"` border-radius (Vitest snapshot of `buttonVariants({ size: "hero" })` output, or a Playwright computed-style assertion in CI).
3. **Plan 02-03:** bump footer link `py-2` to `py-3` or add `min-h-12` for unambiguous MOB-02 compliance; document the 14px footer copy decision explicitly in CONTEXT.md.
4. **Plan 02-04:** augment the manual checkpoint with an automated 320×568 screenshot assertion (Playwright or `@vercel/blob`-style snapshot diff) so SC #1 has CI coverage.
5. **Plan 02-05 or new Plan 02-06:** add explicit branch-protection deliverable — "Settings → Branches → main → Require status checks → Lighthouse CI" — and promote `render-blocking-resources` to error-level.
6. **Plan 02-02:** decide explicitly how the placeholder self-link should behave (accept, `aria-disabled`, or change anchor target). Codify in 02-CONTEXT.md so Phase 3's swap-in doesn't get blamed for the no-op feel.

To incorporate this feedback into a replan: `/gsd-plan-phase 2 --reviews`
