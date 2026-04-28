---
phase: 02-static-landing-page-no-form
plan: 01
subsystem: ui
tags:
  - button
  - cva
  - tailwind-v4
  - prefers-reduced-motion
  - rsc
  - design-system
  - a11y

# Dependency graph
requires:
  - phase: 01-foundation
    provides: components/ui/button.tsx (shadcn Button + buttonVariants CVA, Tailwind v4 globals.css with @layer base scroll-behavior smooth)
provides:
  - Button `size="hero"` CVA variant rendering border-radius 28px pill (D-06, design-system §1 .btn-hero)
  - Tailwind-merge override contract: variant `rounded-[28px]` wins over base `rounded-full` because the variant slot is concatenated AFTER the base string in CVA output
  - prefers-reduced-motion guard disabling html { scroll-behavior } at the @layer base level (HERO-07, D-08, D-23, SC #5, WCAG 2.1 SC 2.3.3)
  - Cross-phase contract for the only Phase 2 motion surface (smooth-scroll on future fragment anchors)
affects:
  - 02-02-PLAN (Hero — uses size="hero" on the disabled CTA)
  - 02-03-PLAN (PlaceholderFormSection + SecondaryCTA — uses size="hero" on the disabled CTA)
  - 02-06-PLAN (Playwright runtime computed-style assertion of border-radius: 28px)
  - 03 (Phase 3 form submit + future <a href="#waitlist"> back-link will rely on the reduced-motion override)

# Tech tracking
tech-stack:
  added: []  # Zero new runtime or dev deps; CVA, tailwind-merge, Tailwind v4 already pinned in Phase 1
  patterns:
    - "CVA size variant additive insertion — append new size row before closing brace of `size` object; preserve `defaultVariants` and base CVA string verbatim"
    - "Reduced-motion override as a separate `@layer base` block (Tailwind v4 merges multiple `@layer base` blocks during compile) — keeps diff minimal and review-safe"
    - "Source-ordering invariant for tailwind-merge conflict resolution — when a base utility (`rounded-full`) conflicts with a variant utility (`rounded-[28px]`), the variant must appear LATER in the source so CVA concatenates it last"

key-files:
  created: []
  modified:
    - components/ui/button.tsx (one row added to `size` CVA slot at line 35)
    - app/globals.css (one new @layer base block added at lines 134-140)

key-decisions:
  - "Hero pill button uses `rounded-[28px]` arbitrary value — NOT `rounded-full`, NOT `rounded-3xl` — because design-system §1 locks the literal 28px (D-06)"
  - "prefers-reduced-motion override placed in a NEW @layer base block (not inside the existing one) — keeps the diff minimal and matches the canonical PATTERNS.md excerpt (Tailwind v4 merges multiple @layer base blocks at compile time)"
  - "Static (source-order) guard for tailwind-merge resolution acceptance — runtime computed-style assertion is owned by Plan 02-06 (review concern #6 deferred there per plan revision reviews-2026-04-27)"

patterns-established:
  - "Pattern: CVA size variant append — `<size-key>: \"<utilities>\"` row placed at end of `size` object before closing brace; do not modify base CVA string or defaultVariants"
  - "Pattern: a11y motion guard — `@layer base { @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } } }` as the canonical reduced-motion override, parallel to the unconditional `scroll-behavior: smooth` rule"

requirements-completed:
  - HERO-04
  - HERO-07
  - MOB-02
  - PERF-03

# Metrics
duration: 3min
completed: 2026-04-28
---

# Phase 2 Plan 01: Foundation Summary

**Hero pill `size="hero"` CVA variant (border-radius 28px) and `prefers-reduced-motion: reduce` scroll-behavior override land as the two foundation edits unblocking Phase 2's hero/secondary CTAs and encoding the only motion guard the phase ships.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-28T02:16:24Z
- **Completed:** 2026-04-28T02:19:18Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added `hero: "h-auto rounded-[28px] px-9 py-3.5 text-base"` row to `buttonVariants` CVA `size` slot in `components/ui/button.tsx` (one-line additive change at line 35)
- Added a new `@layer base { @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } } }` block to `app/globals.css` (8-line addition at lines 134-141, including blank separator)
- Verified the source-ordering invariant: `rounded-full` (line 8, offset 257) appears BEFORE `rounded-[28px]` (line 35, offset 2776) in `button.tsx`, so tailwind-merge resolves the conflict in favor of `rounded-[28px]` (review concern #9 — static guard satisfied; runtime guard delegated to Plan 02-06)
- All gates pass: `npm run check` exit 0, `npm run lint` exit 0, `npm run build` exit 0
- T-02-01 invariant preserved: zero `'use client'` matches in `components/ui/button.tsx` or `app/globals.css` (PERF-03 Phase 2 zero-client-JS contract holds)

## Task Commits

1. **Task 1: Add `size="hero"` CVA variant to Button** — `ba599d3` (feat)
2. **Task 2: Add `prefers-reduced-motion` override to globals.css** — `3a5fa7a` (feat)

## Files Created/Modified

- `components/ui/button.tsx` — Inserted `hero: "h-auto rounded-[28px] px-9 py-3.5 text-base",` as the 9th and final entry in the `size` variant object (line 35). `defaultVariants` and the base `buttonVariants` cva string (which still contains `rounded-full`) were left untouched.
- `app/globals.css` — Inserted a new `@layer base` block at lines 134-141 wrapping `@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }`. The pre-existing unconditional `html { scroll-behavior: smooth; }` at line 130 was preserved as the default; the override only applies when the user opts into reduced motion.

### Exact diff — components/ui/button.tsx

```diff
@@ -32,6 +32,7 @@ const buttonVariants = cva(
         "icon-sm":
           "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
         "icon-lg": "size-9",
+        hero: "h-auto rounded-[28px] px-9 py-3.5 text-base",
       },
     },
     defaultVariants: {
```

### Exact diff — app/globals.css

```diff
@@ -131,6 +131,14 @@
   }
 }

+@layer base {
+  @media (prefers-reduced-motion: reduce) {
+    html {
+      scroll-behavior: auto;
+    }
+  }
+}
+
 @layer base {
   /* Icon opacity per D-06 */
   [data-sidebar="menu-button"] svg {
```

## Verification Results

| Check | Command | Result |
|---|---|---|
| TypeScript | `npm run check` | exit 0 |
| Lint | `npm run lint` | exit 0 |
| Build | `npm run build` | exit 0 — Compiled in 1703ms; 3 static pages generated |
| Hero variant present | `grep -F 'hero: "h-auto rounded-[28px] px-9 py-3.5 text-base"' components/ui/button.tsx` | 1 match |
| Base `rounded-full` preserved | `grep -F 'rounded-full' components/ui/button.tsx` | 1 match (line 8 base CVA string) |
| `'use client'` in modified files | `grep -rn "use client" components/ui/button.tsx app/globals.css` | 0 matches (T-02-01 holds) |
| `prefers-reduced-motion: reduce` count | `grep -c "prefers-reduced-motion: reduce" app/globals.css` | 1 |
| `scroll-behavior: smooth` count | `grep -c "scroll-behavior: smooth" app/globals.css` | 1 (existing rule preserved) |
| `scroll-behavior: auto` count | `grep -c "scroll-behavior: auto" app/globals.css` | 1 (new override) |
| Source-ordering (review #9) | `node` script comparing `rounded-full` vs `rounded-[28px]` offsets | `rounded-full @ offset 257 (line 8)` < `rounded-[28px] @ offset 2776 (line 35)` — tailwind-merge will keep `rounded-[28px]` |

## Decisions Made

None beyond what the plan already pinned. Both edits land verbatim per the plan's `<action>` blocks; no implementation latitude was exercised.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking issue] Copied parent repo `.env.local` into worktree to satisfy Zod env validation at build time**
- **Found during:** Task 2 (verifying `npm run build` exits 0)
- **Issue:** Phase 1 wired strict Zod env validation in `lib/env.ts` (D-08, D-10) that crashes the build at page-data-collection time when any of `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`, `RESEND_AUDIENCE_PREVIEW_ID`, `RESEND_WEBHOOK_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` are missing. Worktrees do not inherit gitignored `.env.local` from the parent repo, so the build failed with a `ZodError` listing every missing key — this was reproducible on the worktree base BEFORE either of this plan's edits, confirming it's a pre-existing condition, not a regression introduced here.
- **Fix:** `cp /Users/jeff/repos/quibly-landing/.env.local ./.env.local` so the build can satisfy env validation.
- **Files modified:** None tracked — `.env.local` is gitignored (`.gitignore` line: `.env*.local`). No commit required or made.
- **Verification:** Build re-ran cleanly: "Compiled successfully in 1703ms; 3 static pages generated."
- **Out of scope confirmation:** Tailwind compilation already succeeded BEFORE the env-validation crash on the original run ("✓ Compiled successfully in 1697ms" → then ZodError). The new CSS rule parsed cleanly under Tailwind v4 / `@tailwindcss/postcss ^4`. The env crash was therefore not caused by this plan and the fix is environmental setup only — no code changes.

---

**Total deviations:** 1 environmental (Rule 3) — no code-level deviations
**Impact on plan:** Zero. The two edits land verbatim per the plan's `<action>` blocks. The deviation only restored worktree env state that the parent repo already had.

## Issues Encountered

None during planned work. The env-validation issue (above) was discovered while running the verification gates and resolved environmentally without any code change.

## User Setup Required

None — no external services were configured by this plan, and the `.env.local` copy used existing values from the parent repo.

## Threat Model Compliance

| Threat ID | Disposition | Status |
|---|---|---|
| T-02-01 (Information Disclosure — Button) | mitigate | Verified: `grep -c "'use client'" components/ui/button.tsx` returns 0. CVA-only edit cannot introduce client-bundle leakage. |
| T-02-02 (Tampering / XSS — Button + globals.css) | accept | No `dangerouslySetInnerHTML`, no string interpolation, no user input — Tailwind arbitrary value `rounded-[28px]` is a compile-time literal. |
| T-02-03 (Supply-chain — Button) | accept | Zero new runtime deps added by this plan. `class-variance-authority`, `radix-ui`, `clsx`, `tailwind-merge` already locked in Phase 1. |

No new threat surface introduced. No threat flags to raise.

## Next Phase Readiness

- **Plan 02-02 (Hero):** Unblocked. Can render `<Button size="hero" variant="default" type="button" aria-disabled="true">…</Button>` directly without ad-hoc `rounded-[28px]` overrides.
- **Plan 02-03 (PlaceholderFormSection + SecondaryCTA):** Unblocked. Same `size="hero"` consumer pattern.
- **Plan 02-06 (Visual regression / runtime guard):** Unblocked. Can author the Playwright computed-style assertion proving `border-radius: 28px` at runtime (review concern #6).
- **Phase 3 (Form):** Reduced-motion guard is in place ahead of Phase 3's reintroduction of `<a href="#waitlist">` smooth-scroll anchors.

## Self-Check: PASSED

- [x] `components/ui/button.tsx` exists and contains the new `hero` row at line 35
- [x] `app/globals.css` exists and contains the new `@layer base` block with `@media (prefers-reduced-motion: reduce)`
- [x] Commit `ba599d3` exists in `git log` (Task 1)
- [x] Commit `3a5fa7a` exists in `git log` (Task 2)
- [x] `npm run check` exited 0
- [x] `npm run lint` exited 0
- [x] `npm run build` exited 0
- [x] No `'use client'` introduced in modified files

---

*Phase: 02-static-landing-page-no-form*
*Plan: 01*
*Completed: 2026-04-28*
