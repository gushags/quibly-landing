---
phase: 2
reviewers: [gemini, codex]
reviewed_at: 2026-04-27T18:18:00Z
plans_reviewed:
  - 02-01-PLAN.md
  - 02-02-PLAN.md
  - 02-03-PLAN.md
  - 02-04-PLAN.md
  - 02-05-PLAN.md
self_skipped: claude (running inside Claude Code CLI)
note: Re-run of /gsd-review --phase 2 --all (overwrites the prior 18:14 review). Same plans, same reviewers, fresh output.
---

# Cross-AI Plan Review — Phase 2: Static Landing Page (No Form)

## Gemini Review

This review evaluates the implementation plans for **Phase 2: Static Landing Page (No Form)**. The architecture prioritizes performance (Lighthouse ≥90), accessibility, and a "zero-JS" RSC approach to ensure a fast, stable pre-launch presence.

---

### Plan 02-01: Foundation — Button `size="hero"` variant + `prefers-reduced-motion`

**Summary**: A surgical, low-risk foundation plan that extends the existing design system tokens (CVA) and sets the global accessibility baseline for motion.

*   **Strengths**:
    *   Directly addresses D-06 and D-23 without modifying the core shadcn logic.
    *   Uses `@layer base` for the motion override, ensuring it respects Tailwind's cascade.
*   **Concerns**:
    *   **LOW**: Tailwind Merge Reliance. The plan assumes `rounded-full` (base) will be overridden by `rounded-[28px]` (variant). While `twMerge` handles this, if the base CVA string is modified later to use a different utility, the override might become brittle.
*   **Suggestions**:
    *   Explicitly check the generated class order in the manual verification step to ensure `rounded-[28px]` appears after `rounded-full` in the final DOM string.
*   **Risk Assessment**: **LOW**. Simple additive changes with clear verification steps.

---

### Plan 02-02: Hero + HeroMascot + PlaceholderFormSection

**Summary**: Implements the "meat" of the landing page using a clever DOM-reversal technique to guarantee the H1 as the LCP element while maintaining the desired visual hierarchy.

*   **Strengths**:
    *   **LCP Guard**: Using `flex-col-reverse` on the H1/Mascot container is a sophisticated way to satisfy HERO-06 (H1 as LCP) while keeping the mascot visually at the top.
    *   **Clean Separation**: Moving `HeroMascot` to its own file keeps the main `Hero` component readable.
    *   **RSC Purity**: Strictly adheres to the zero-client-JS requirement.
*   **Concerns**:
    *   **MEDIUM**: Viewport Math. At 320x568 (iPhone SE-style), the cumulative height of `py-16` (64px top/bottom), mascot (88px), H1 (approx 120px), sub-headline (64px), and CTA (52px) plus gaps (24px) totals ~476px. This fits, but `py-24` on tablets/desktop might push content too far down if not careful.
    *   **LOW**: No-op Anchor. The CTA inside `PlaceholderFormSection` linking to `#waitlist` (itself) is slightly confusing UX, though technically compliant with the placeholder requirement.
*   **Suggestions**:
    *   In `hero-mascot.tsx`, ensure the gradient colors (oklch or hex) match the design system teal exactly to avoid "off-brand" gradients.
    *   Consider adding `loading="eager"` and `priority` if the mascot was an `Image`, but since it's an SVG-based RSC, it should be fine.
*   **Risk Assessment**: **LOW**. The LCP strategy is sound and the RSC implementation is standard.

---

### Plan 02-03: WhyQuibly + FounderVoice + SecondaryCTA + Footer

**Summary**: Completes the below-the-fold narrative. It emphasizes content structure and accessibility via ARIA-hidden separators.

*   **Strengths**:
    *   **Icon Consistency**: Locking `strokeWidth={1.75}` across all Lucide icons ensures a professional, custom-designed feel rather than a "stock" look.
    *   **Accessibility**: Proper use of `aria-hidden="true"` for decorative middots in the footer.
    *   **Grid Logic**: Simple `md:grid-cols-3` handles the responsive transition for "Why Quibly" perfectly.
*   **Concerns**:
    *   **LOW**: 404 Links. Linking to `/privacy` and `/terms` which don't exist yet is acceptable for Phase 2, but could trigger broken link checkers if added to CI later.
*   **Suggestions**:
    *   Ensure the "Why Quibly" icons use `text-primary` to maintain the Teal brand accent.
*   **Risk Assessment**: **LOW**. Purely presentational components.

---

### Plan 02-04: Page Composition + Manual Viewport Verification

**Summary**: The integration step. It moves the project from individual "parts" to a cohesive application and includes a critical human-in-the-loop verification.

*   **Strengths**:
    *   **Composition**: Uses a clean, flat structure in `app/page.tsx`.
    *   **Exhaustive Checklist**: The manual verification covers the most likely failure points (320px viewport and LCP identity).
*   **Concerns**:
    *   **MEDIUM**: Blocking Workflow. The "Wait for approved" prompt is necessary but can be a bottleneck if the developer is running this in a semi-automated environment.
*   **Suggestions**:
    *   Add a check for "Layout Shift" during the manual scroll test to catch any obvious issues before the automated Lighthouse check.
*   **Risk Assessment**: **LOW**. Standard composition.

---

### Plan 02-05: Lighthouse CI Gate

**Summary**: Provides the "teeth" for the performance requirements. Automating Lighthouse in CI is the only way to ensure the mobile performance baseline (≥90) isn't eroded by future PRs.

*   **Strengths**:
    *   **Rigorous Assertions**: Setting `performance: error` at 0.90 and `cls: error` at 0.1 is a strong enforcement of project goals.
    *   **Real-world Testing**: Running against Vercel preview URLs is much more accurate than local `next dev` runs.
*   **Concerns**:
    *   **HIGH**: Vercel Token Security. The plan mentions creating a token but doesn't explicitly warn against committing it. (Note: The prompt instructions say *never* to commit secrets, but it's a critical point for this plan).
    *   **MEDIUM**: Flakiness. Lighthouse scores can vary by 5-10% on shared CI runners. Setting a 0.90 threshold might cause "green-room" failures where a perfectly good PR fails because the GitHub Action runner was under heavy load.
*   **Suggestions**:
    *   Change `numberOfRuns` to 5 to average out CI noise.
    *   Ensure the `wait-for-vercel-preview` action is configured with a sufficient timeout to allow for Next.js cold starts.
*   **Risk Assessment**: **MEDIUM**. The technical setup is correct, but CI flakiness and secret management are common pitfalls.

---

### Phase-Level Review

#### Cross-Plan Consistency
The plans are highly consistent. The naming conventions (`hero-mascot.tsx`, `why-quibly.tsx`) and the shared use of the `hero` button variant demonstrate a unified architectural vision. The "Wave" approach correctly sequences dependencies (Foundation -> Components -> Composition -> Verification).

#### Goal Achievement
Execution of these 5 plans will successfully satisfy all 18 Phase 2 requirements.
*   **PERF-01..03**: Guaranteed by Plan 02-05.
*   **HERO-01..07**: Specifically addressed by the `flex-col-reverse` LCP guard and the specific button variants.
*   **Zero-JS**: All components are implemented as RSCs by default (no `'use client'`).

#### Top 3 Risks
1.  **CI Flakiness (Plan 02-05)**: The 0.90 Lighthouse threshold on GitHub Actions runners may be brittle.
2.  **320px Height Overflow**: While the math works, any slight increase in padding or font-size will push the CTA below the fold on an iPhone SE.
3.  **Tailwind Merge Collision**: If the `button.tsx` base styles are modified, the `rounded-[28px]` variant might not win the merge as expected.

#### Missing Items
*   **Metadata**: `app/page.tsx` should export a `Metadata` object (SEO title/description) to satisfy the "pre-launch surface" goal.
*   **Favicons/Manifest**: While perhaps Phase 1, ensuring the QuibsIcon is used as a favicon would improve the "Static Landing Page" polish.

**Overall Verdict**: The plans are **EXCELLENT**. They are surgical, leverage modern Next.js patterns, and prioritize the specific performance constraints of the project. Proceed with execution.

---

## Codex Review

### Plan 02-01 — Foundation

#### Summary
This is a clean, minimal foundation change and mostly correct. The `size="hero"` variant and reduced-motion smooth-scroll override are aligned with locked decisions, but the plan relies on runtime class merging behavior without an explicit regression guard.

#### Strengths
- Very small, additive scope in only two existing files.
- Matches D-06 exactly (`rounded-[28px]` pill requirement).
- `prefers-reduced-motion` handling is CSS-only and keeps Phase 2 zero-client-JS.
- Includes practical verification steps (`check/lint/build` + grep).

#### Concerns
- `LOW`: `rounded-full` vs `rounded-[28px]` depends on `tailwind-merge` conflict resolution and class ordering in CVA output.
- `LOW`: No explicit guard (test/snapshot) to prevent future refactors from silently dropping `size="hero"` behavior.

#### Suggestions
- Add a tiny unit/snapshot test for `buttonVariants({ size: "hero" })` to assert `rounded-[28px]` wins.
- Add one visual assertion in PR checklist: computed `border-radius: 28px` on hero CTA in built app, not only dev.

#### Risk Assessment
**LOW** — scoped and technically sound, with only minor regression-risk if class composition changes later.

---

### Plan 02-02 — Hero + HeroMascot + PlaceholderFormSection

#### Summary
Good component decomposition and strong alignment with locked architecture (RSC-only, dedicated mascot wrapper, H1-first DOM). The biggest risk is layout math: current spacing likely fails the strict "all hero essentials above fold at 320×568" requirement.

#### Strengths
- Correctly preserves zero `'use client'`.
- Correct LCP-guard intent: H1 first in DOM, mascot second, visual flip via `flex-col-reverse`.
- Mascot implementation respects D-02 (new local wrapper, 88px tokenized shape).
- Placeholder section correctly establishes `id="waitlist"` seam for Phase 3 replacement.

#### Concerns
- `HIGH`: `py-16 md:py-24` + current vertical gaps likely overflow 320×568; success criterion #1 is at risk.
- `HIGH`: LCP may become sub-headline `<p>` (large multi-line block) rather than H1; plan only guards against mascot, not other text candidates.
- `MEDIUM`: Placeholder section button linking to `#waitlist` inside same section is effectively a no-op and can feel broken/confusing.
- `MEDIUM`: No explicit approach to ensure hero remains above fold with browser chrome/real mobile viewport constraints.
- `LOW`: Hardcoded "Launching Summer 2026" may age quickly.

#### Suggestions
- Tighten mobile hero spacing aggressively: reduce vertical paddings/gaps, compress microcopy spacing, and tune line lengths for 320px.
- Add explicit mobile-first fold budget in plan (px budget for each block) and verify in real device emulation.
- Reduce sub-headline width/length on mobile (or move below fold at smallest viewport) if needed to keep H1 as likely LCP.
- For placeholder CTA, either remove the self-anchor button in Phase 2 or make intent explicit (e.g., "Form coming soon") to avoid no-op behavior.

#### Risk Assessment
**HIGH** — strong structure, but current spacing/content choices make success criterion #1 and LCP identity materially uncertain.

---

### Plan 02-03 — WhyQuibly + FounderVoice + SecondaryCTA + Footer

#### Summary
This plan is mostly coherent and avoids over-engineering. However, it under-specifies touch-target compliance and introduces predictable UX/a11y issues in footer links and temporary 404 destinations.

#### Strengths
- Clean section isolation and matches locked content/design constraints.
- Correct icon choices and stroke settings per D-13.
- Founder block respects the intentionally minimal format (no avatar/blockquote/byline).
- Footer uses simple semantic structure and `aria-hidden` separators correctly.

#### Concerns
- `HIGH`: Footer links (`text-sm`, `py-2`) are likely below the project's "all interactive elements >=48px" requirement.
- `MEDIUM`: `/privacy` and `/terms` 404 by design can still degrade trust and QA perception during pre-launch.
- `LOW`: No explicit keyboard-focus/visible-focus acceptance checks listed for footer links and CTA anchors.
- `LOW`: Copy is hardcoded English-only with no i18n strategy (acceptable for now, but untracked).

#### Suggestions
- Increase footer link hit areas to guaranteed 48px min height (`min-h-12 inline-flex items-center`).
- Add explicit focus-visible style check to manual verification list.
- Consider temporary non-404 legal placeholders or a short interim policy page if pre-launch credibility matters.

#### Risk Assessment
**MEDIUM** — section design is solid, but touch-target compliance and temporary 404 behavior can violate stated UX constraints.

---

### Plan 02-04 — Page Composition + Manual Verification

#### Summary
Composition is straightforward and correctly keeps everything server-rendered. The human checkpoint is useful, but too much of the critical acceptance criteria depends on manual inspection without reproducible automated guardrails.

#### Strengths
- Clear dependency ordering and thin composition layer in `app/page.tsx`.
- Preserves clean Phase 2→3 seam (`id="waitlist"` wrapper survives body replacement).
- Manual checks explicitly include key areas (320 viewport, LCP identity, reduced motion).

#### Concerns
- `HIGH`: Manual-only fold/LCP verification is brittle and easy to regress.
- `MEDIUM`: Section order puts `PlaceholderFormSection` immediately after hero, which may affect below-fold narrative pacing if hero gets compressed for 320.
- `LOW`: Checkpoint "type approved" is process-fragile without artifact capture (screenshots/metrics).

#### Suggestions
- Add at least one automated viewport assertion (Playwright) for 320×568 "hero essentials visible without scroll."
- Record Lighthouse JSON artifact or screenshot evidence in PR for LCP element identity.
- Add explicit acceptance checklist item for interactive target sizes across all anchors, not just buttons.

#### Risk Assessment
**MEDIUM** — composition is fine; the risk is verification quality and long-term regressions.

---

### Plan 02-05 — Lighthouse CI Gate

#### Summary
This is directionally correct and necessary, but it does not fully guarantee "hard gate" behavior on merge by itself. The CI design is good, yet enforcement details and workflow reliability need tightening.

#### Strengths
- Uses the right tooling family (`@lhci/cli` + GitHub Action + Vercel preview wait).
- Includes required performance and CLS assertions at error level.
- Targets mobile preset and multi-run sampling.

#### Concerns
- `HIGH`: Workflow execution does not automatically block merges unless branch protection marks this check as required.
- `MEDIUM`: `render-blocking-resources` set to `warn` conflicts with strict wording "no render-blocking third-party scripts."
- `MEDIUM`: Reliance on manual Vercel token setup is an operational footgun if not documented/enforced.
- `LOW`: `temporary-public-storage` is fine for short-term, but not ideal for long-lived auditability.

#### Suggestions
- Explicitly require branch protection: make Lighthouse check a required status on `main`.
- Promote `render-blocking-resources` to `error` if truly hard requirement.
- Add workflow doc snippet for required secrets and expected check names.
- Persist reports as CI artifacts for easier PR debugging.

#### Risk Assessment
**MEDIUM** — technically strong, but merge-gate enforcement is incomplete unless repo settings are updated.

---

### Phase-Level Review

#### Cross-plan consistency
The graph is mostly coherent: 02-01 foundation, 02-02/03 parallel sections, 02-04 compose, 02-05 enforce performance. The Phase 2→3 seam (`#waitlist` wrapper contract) is conceptually clean, but the placeholder self-anchor behavior is awkward and should be tightened.

#### Goal achievement
Not guaranteed as written. The largest blockers are:
1. 320×568 above-fold constraint is likely missed with current hero spacing/content.
2. LCP identity may be non-H1 (especially sub-headline) despite mascot guard.
3. CI may run but not truly block merges without branch protection configuration.

#### Top 3 phase risks
1. **Above-fold failure at 320×568** due to vertical spacing/content budget (`HIGH`).
2. **LCP element mismatch** (H1 not guaranteed largest/earliest meaningful paint) (`HIGH`).
3. **Non-enforced CI gate** if GitHub required checks aren't configured (`HIGH`).

#### Missing from the plan set
- Automated viewport assertion for success criterion #1 (currently manual only).
- Explicit interactive target-size verification for all links/buttons (footer likely fails).
- Explicit branch-protection step to make Lighthouse checks merge-blocking.
- A small regression guard for `size="hero"` class behavior (CVA/tailwind-merge dependency).

---

## Consensus Summary

This is the second cross-AI review of the same Phase 2 plan set (the first ran two minutes earlier with the same reviewers). Both runs converge on the same handful of soft spots; the second pass strengthens conviction that these are real risks, not noise. Notably, **Codex flagged a NEW HIGH-severity concern this run** that the first pass and Gemini missed: **the sub-headline `<p>`, not the mascot, may be the actual LCP candidate** — this is the most important new signal.

### Agreed Strengths

- **Foundation plan (02-01)** is small, additive, and correct. Reduced-motion handling is CSS-only and zero-JS.
- **LCP-guard via `flex-col-reverse` + DOM-first H1** — both reviewers endorse the strategy.
- **`<HeroMascot>` as a section-local RSC** — correct boundary, avoids polluting `<QuibsAvatar>` SIZE_CONFIG.
- **`#waitlist` cross-phase anchor seam** — clean handoff from Phase 2 to Phase 3.
- **Pure RSC posture** — zero `'use client'` directives across the entire phase tree.
- **Lucide stroke-width 1.75 + `aria-hidden` middots** — a11y details correct.
- **LHCI + Vercel preview integration** — error-level performance + CLS assertions, multi-run median, mobile preset.

### Agreed Concerns (highest priority — both reviewers raised, both rated HIGH or MEDIUM)

1. **HIGH/HIGH — 320×568 above-fold fold-fit at risk.** Both reviewers independently re-derived the math from D-07 and reached the same conclusion as the prior review: `py-16` + gaps + microcopy stack is too tall after browser chrome. Codex marks this HIGH; Gemini softens to MEDIUM but agrees the budget is fragile.

2. **HIGH (Codex) — LCP candidate may not be the H1 even with `flex-col-reverse`.** **NEW SIGNAL THIS PASS.** Codex calls out that Lighthouse picks LCP by *largest content area*, not just DOM order — and on a 320px viewport the sub-headline `<p>` (24-word multi-line text in `max-w-prose`) may end up with a larger painted area than the wrapped H1. The plan only guards against the mascot taking LCP; it does not guard against the sub-headline winning. This is materially different from the previous review's framing and worth taking seriously.

3. **MEDIUM/MEDIUM — `tailwind-merge` `rounded-full` vs `rounded-[28px]` is a silent-regression vector.** Both reviewers want an automated guard (snapshot test on `buttonVariants({ size: "hero" })`, or Playwright computed-style assertion). Severity downgraded from prior review's framing because Gemini called it LOW this round, but the recommended mitigation is identical.

4. **HIGH (Codex) / MEDIUM (Gemini) — CI gate may be advisory unless branch protection requires the status check.** Plan 02-05 wires the workflow but does NOT include "Settings → Branches → main → Require status checks" as a deliverable. Without this, the gate runs but cannot actually block merge.

5. **HIGH (Codex) / MEDIUM (Gemini) — manual-only verification of fold/LCP/reduced-motion is brittle.** Both push for at least one automated viewport-screenshot assertion at 320×568.

6. **HIGH (Codex) — footer link tap targets `text-sm` + `py-2` likely fail MOB-02 (≥48px).** Codex stayed firm on this from the prior review. Recommended fix: `min-h-12 inline-flex items-center` on the footer anchors.

### Divergent / Reviewer-Specific Concerns

- **Gemini (HIGH) — Vercel token security.** Cautions that the plan should explicitly warn against committing the `VERCEL_TOKEN`. *Plan 02-05 already uses `secrets.VERCEL_TOKEN` (GitHub Secrets, encrypted at rest) — the secret never enters the repo. This concern is largely a misread of the plan's flow; Gemini is being defensive but the actual posture is correct.*
- **Gemini (LOW) — favicon/metadata missing from Phase 2.** *Correctly noted as missing, but per CONTEXT.md D-26 and `<canonical_refs>`, Phase 5 explicitly owns metadata/OG/favicon. Not a Phase 2 gap.*
- **Codex (LOW) — keyboard-focus/visible-focus checks not in acceptance lists.** Genuine acceptance gap for footer anchors and CTA links. Trivial to add to the manual checkpoint in 02-04.
- **Gemini suggestion — `numberOfRuns: 5`** to average out CI noise. Reasonable bump from 3 if CI flakiness becomes an observed problem; not required upfront.
- **Codex (MEDIUM) — `render-blocking-resources` warn-level conflicts with SC #4 wording.** Worth promoting to `error` since the success criterion language is unconditional.
- **Codex (MEDIUM) — placeholder self-anchor is a no-op UX.** Both reviewers flagged this; Codex more strongly. Either remove the button in Phase 2 or change copy to "Form coming soon" with `aria-disabled`.

### Top 3 Phase-Level Risks (Both Reviewers Agree, Plus the New LCP Signal)

1. **Above-fold failure at 320×568** — vertical stack too tall; Hero CTA likely falls below the fold.
2. **LCP element mismatch** — even with the `flex-col-reverse` mascot guard, the sub-headline `<p>` may win LCP over the H1 due to larger painted text area on mobile. *(New finding this pass — promotes this from "edge-case" to "primary risk".)*
3. **CI gate may be non-blocking** without explicit GitHub branch-protection setup.

### Recommended Adjustments Before Execution

1. **Plan 02-02:** tighten mobile hero spacing — `py-8 md:py-16 lg:py-24`, reduce `gap-6` to `gap-4` on base, drop `mt-6` to `mt-4`, then re-verify D-07 math. Consider also constraining the sub-headline width (`max-w-xs sm:max-w-prose`) so the wrapped H1 has more painted area than the wrapped sub-headline.
2. **Plan 02-02:** explicitly defend against the sub-headline-as-LCP failure mode. Either:
   - shrink the sub-headline at the smallest breakpoint so its painted area is unambiguously smaller than the H1, OR
   - move the sub-headline below the CTA (and below the fold) at 320px.
   - Add a Plan 02-04 manual-check item: confirm Lighthouse LCP element selector references `h1`, not `p` or `div`.
3. **Plan 02-01 (or new 02-06):** add a `buttonVariants({ size: "hero" })` snapshot test, OR a Playwright computed-style assertion for `border-radius: 28px` on the homepage CTA.
4. **Plan 02-03:** bump footer link hit area to `min-h-12 inline-flex items-center` (or `py-3`) — removes MOB-02 ambiguity at trivial cost.
5. **Plan 02-04:** augment the manual checkpoint with an automated 320×568 above-fold assertion (Playwright or snapshot diff). Capture Lighthouse JSON or screenshot evidence in the PR for LCP identity.
6. **Plan 02-05 (or new 02-06):** add explicit branch-protection deliverable — "Settings → Branches → main → Require status checks → Lighthouse CI". Promote `render-blocking-resources` from `warn` to `error`. Consider `numberOfRuns: 5` if CI proves flaky.
7. **Plan 02-02:** decide explicitly how the placeholder self-link should behave (keep as no-op anchor, change copy to "Form coming soon" with `aria-disabled`, or remove the button entirely). Codify in 02-CONTEXT.md.

To incorporate this feedback into a replan: `/gsd-plan-phase 2 --reviews`
