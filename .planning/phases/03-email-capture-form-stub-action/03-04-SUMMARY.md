---
phase: 03
plan: 04
id: 03-04
title: Hero + Secondary CTA anchor flips + Phase 2 button-radius spec selector update
subsystem: marketing/landing
tags:
  - cta
  - anchor
  - asChild
  - playwright-spec
  - pitfall-9
requirements:
  - FORM-04
requirements_addressed:
  - FORM-04
dependency_graph:
  requires: []
  provides:
    - "Tag-agnostic [data-slot=button][data-size=hero] selector contract for all hero pills"
    - "Hero + Secondary CTAs ready to scroll users to #waitlist (form anchor target landed in Plan 01)"
  affects:
    - "tests/visual/button-radius.spec.ts (now tag-agnostic — also applies to Plan 03's form submit)"
    - "tests/visual/above-fold.spec.ts (selector also updated — Rule 3 deviation)"
tech_stack:
  added: []
  patterns:
    - "<Button asChild> + Slot.Root anchor-as-pill (radix-ui)"
    - "data-slot + data-size tag-agnostic Playwright selector"
key_files:
  created: []
  modified:
    - components/sections/hero.tsx
    - components/sections/secondary-cta.tsx
    - tests/visual/button-radius.spec.ts
    - tests/visual/above-fold.spec.ts
decisions:
  - "Phase 3 D-01: Hero CTA flips back to <a href=#waitlist> (overrides Phase 2 D-31 for hero only) because the WaitlistFormSection now hosts a real form below the fold"
  - "Phase 3 D-02: Secondary CTA flips to <a href=#waitlist> — scrolling UP to the form is meaningful UX for visitors who scrolled past it"
  - "Pitfall 9: Phase 2's button[aria-disabled=true] selector is replaced by tag-agnostic [data-slot=button][data-size=hero] across BOTH visual specs"
  - "Auto-fix Rule 3 deviation: tests/visual/above-fold.spec.ts also referenced the old selector at line 25; updated as a directly-caused blocking fix (out of scope for Plan 04 baseline scope but in-scope per deviation rules)"
metrics:
  duration_seconds: 370
  duration_minutes: 6.1
  tasks_planned: 3
  tasks_completed: 3
  files_modified: 4
  commits: 4
  completed_at: "2026-04-28T14:12:33Z"
---

# Phase 3 Plan 04: Hero + Secondary CTA anchor flips + Phase 2 button-radius spec selector update Summary

Flipped Hero and Secondary CTAs from Phase 2's disabled `<button aria-disabled>` placeholders to `<Button asChild><a href="#waitlist">` anchor pills (D-01, D-02), and migrated the Phase 2 button-radius regression spec — and an additional above-fold spec discovered during execution — from the `button[aria-disabled="true"]` selector to the tag-agnostic `[data-slot="button"][data-size="hero"]` attribute selector (Pitfall 9), so the `<a>`/`<button>` mix Phase 3 ships on `/` is matched correctly.

## What Shipped

### Hero CTA (`components/sections/hero.tsx`)

- **Before (Phase 2 D-31):** `<Button size="hero" variant="default" type="button" aria-disabled="true">Form coming soon</Button>` — disabled placeholder, no destination.
- **After (Phase 3 D-01):** `<Button asChild size="hero" variant="default"><a href="#waitlist">Join the waitlist</a></Button>` — meaningful smooth-scroll anchor to the new `<WaitlistFormSection>` (Plan 01).
- Visual identity (28px radius, teal background, ~52px height) preserved by the `asChild` + `Slot.Root` pattern in `components/ui/button.tsx` — `data-slot="button"`, `data-variant="default"`, `data-size="hero"` and the full CVA class chain are merged onto the `<a>` regardless of `asChild`.
- Copy now matches FORM-04 verbatim with Phase 2 D-12 lock (was the placeholder `Form coming soon` only because Phase 2 wasn't ready to commit to the lock).
- JSDoc rewritten to describe Phase 3 state (no more "Phase 3 will replace…" stale aspiration).
- Surrounding wrapper (`<div className="mt-4 flex flex-col items-center">`), `Launching Summer 2026` microcopy, radial gradient, `<HeroMascot>`, `<h1>`, sub-headline composition, and section padding (`py-8 md:py-16 lg:py-24`) all preserved verbatim.

### Secondary CTA (`components/sections/secondary-cta.tsx`)

- **Before (Phase 2 D-31):** `<Button size="hero" variant="default" type="button" aria-disabled="true">Don&apos;t miss launch — join the waitlist</Button>`.
- **After (Phase 3 D-02):** `<Button asChild size="hero" variant="default"><a href="#waitlist">Don&apos;t miss launch — join the waitlist</a></Button>`.
- Em-dash (literal) and `&apos;` HTML entity preserved — Phase 2 D-12 copy lock is unchanged; only the rendered tag flipped.
- H2 (`Ready to stop guessing at marketing?`), wrapper (`mt-8 flex justify-center`), section padding (`py-16 md:py-24`), and centered max-width container all preserved.
- JSDoc updated to describe the smooth-scroll-back-to-form rationale (form lives several thousand pixels above by the time the user reaches this section).

### Visual spec selector update (`tests/visual/button-radius.spec.ts`)

Phase 3's page composition mixes `<a>` (hero + secondary) with `<button type="submit">` (form submit) for the three `<Button size="hero">` instances. Phase 2's `button[aria-disabled="true"]` selector matches none of them post-flip. The replacement is a tag-agnostic attribute selector that targets the data attributes set unconditionally by the Button component:

- **Selector — old:** `page.locator('button[aria-disabled="true"]')`
- **Selector — new:** `page.locator('[data-slot="button"][data-size="hero"]')`
- Both tests in the file (count assertion + bounding-box height assertion) updated.
- Count assertion: was `expect(count).toBe(3)` (3 disabled placeholders); now `expect(count).toBe(3)` with a Phase 3-aware error message describing the expected mix (`hero anchor + secondary anchor + form submit`). The number of hero pills is the same; the rendered tags differ.
- Load-bearing invariants preserved: `expect(borderRadius).toBe("28px")` (D-06 / 28px lock) and `expect(box.height).toBeGreaterThanOrEqual(48)` (MOB-02).
- JSDoc rewritten to describe Phase 3 state and the rationale for the tag-agnostic selector.

### Auto-fix deviation (`tests/visual/above-fold.spec.ts`) — Rule 3

During final plan-level verification (`grep -rn 'button\[aria-disabled="true"\]' tests/`), the audit revealed a **second** test file using the old selector at line 25 — `tests/visual/above-fold.spec.ts` — which validates that the hero CTA bounding box fits within the 320×568 mobile fold. Without the fix, that test would fail at runtime because `button[aria-disabled="true"]` no longer matches the hero CTA (now an `<a>`).

This is **directly caused** by Plan 04's hero CTA flip (Task 1) — it falls inside the deviation rules' SCOPE BOUNDARY for Rule 3 (auto-fix blocking issues). Action taken:

- Updated line 25 from `page.locator('button[aria-disabled="true"]').first()` to `page.locator('[data-slot="button"][data-size="hero"]').first()`. `.first()` picks the hero CTA in document order (the only hero pill above the fold at 320×568).
- Updated the spec's JSDoc to reference the Phase 3 anchor identity.

Committed separately as `fix(03-04): update above-fold spec selector after hero CTA flip (Rule 3 / Pitfall 9)` so the audit trail clearly distinguishes the planned tasks from the auto-fix.

## Three hero pills that now exist on `/` (for Plan 05's anchor-scroll spec)

After Phase 3 (Plans 01–04) ships, the rendered `<Button size="hero">` instances on `/` will be:

| # | Component                                | Rendered tag                | Source file                                | href / behavior                              |
|---|------------------------------------------|-----------------------------|--------------------------------------------|----------------------------------------------|
| 1 | Hero CTA                                 | `<a>` (via `<Button asChild>`) | `components/sections/hero.tsx`             | `href="#waitlist"` — smooth-scroll DOWN      |
| 2 | Form submit (in `<WaitlistForm>`)        | `<button type="submit">`    | `components/sections/waitlist-form.tsx` (Plan 03) | submits Server Action; only present when form is in idle/error state |
| 3 | Secondary CTA                            | `<a>` (via `<Button asChild>`) | `components/sections/secondary-cta.tsx`    | `href="#waitlist"` — smooth-scroll UP        |

All three carry `data-slot="button"` and `data-size="hero"`. The `[data-slot="button"][data-size="hero"]` selector uniformly addresses them.

The form's pending-state `<button>` will be the only remaining `<button type="submit">` `[data-size="hero"]` on the page during pending — once Plan 03's form ships and a submission is in flight, the disabled-pending state is rendered as `disabled` on the submit `<button>` (NOT `aria-disabled`), which the new selector still matches.

## Confirmation: Pitfall 9 selector update is fully shipped

```
$ grep -rn 'button\[aria-disabled="true"\]' tests/
(no matches)
```

The Phase 2 attribute selector is fully retired across all test files. The full Playwright run (against a running dev server) executes in Plan 05's combined e2e gate, which will exercise both `button-radius.spec.ts` and `above-fold.spec.ts` against the full Phase 3 page composition.

## Verification (gates run during execution)

| Gate                       | Command                          | Result          |
|----------------------------|----------------------------------|-----------------|
| TypeScript                 | `npx tsc --noEmit`               | exit 0          |
| Lint                       | `npm run lint`                   | exit 0          |
| Playwright spec list       | `npx playwright test --list tests/visual/button-radius.spec.ts` | 2 tests listed, no syntax errors |
| Playwright spec list       | `npx playwright test --list tests/visual/above-fold.spec.ts` | 4 tests listed, no syntax errors |
| Selector audit (orphans)   | `grep -rn 'button\[aria-disabled="true"\]' tests/` | 0 matches |
| Anchor presence            | `grep -c 'href="#waitlist"'` in hero.tsx + secondary-cta.tsx | 2 each |
| `aria-disabled` audit      | `grep 'aria-disabled' components/sections/hero.tsx components/sections/secondary-cta.tsx` | 0 matches |

`npm run build` was attempted as plan-level Verification 3 but fails on the **baseline commit** (24d7ef7) due to missing env vars (`RESEND_WEBHOOK_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) at page-collection time. This is **pre-existing** and unrelated to Plan 04 — it is caused by code changes elsewhere (likely Plans 01–03 land env-validating call sites). Per the deviation rules' SCOPE BOUNDARY: this is out of scope for Plan 04 to fix (not directly caused by the CTA flips). Logged below under **Deferred Issues** for a future plan or for Wave 2 to resolve.

The full Playwright run that executes both updated specs against a running dev server happens in Plan 05's combined e2e gate.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] Updated `tests/visual/above-fold.spec.ts` selector**
- **Found during:** Plan-level Verification 4 (`grep -rn 'button\[aria-disabled="true"\]' tests/`)
- **Issue:** The Phase 2 above-fold spec at line 25 used `button[aria-disabled="true"]` to locate the hero CTA. After Task 1's flip, that selector matches nothing — the test would fail at runtime in Plan 05's e2e gate.
- **Why directly caused by Plan 04:** The hero CTA flipped from `<button aria-disabled>` to `<a href="#waitlist">` in Task 1; the spec's selector contract is invalidated by that change.
- **Fix:** Switched the selector to the same `[data-slot="button"][data-size="hero"]` pattern the button-radius spec now uses; `.first()` continues to pick the hero CTA (first hero pill in document order, which is above the fold at 320×568).
- **Files modified:** `tests/visual/above-fold.spec.ts`
- **Commit:** `69e2af8` — `fix(03-04): update above-fold spec selector after hero CTA flip (Rule 3 / Pitfall 9)`

### Deferred Issues

**1. Pre-existing `npm run build` failure on missing env vars (out of scope for Plan 04)**
- **Found during:** Plan-level Verification 3 (`npm run build`)
- **Issue:** `npm run build` fails with `ZodError` for `RESEND_WEBHOOK_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` during Next.js page-data collection.
- **Verified pre-existing:** Built the same baseline commit (24d7ef7) cleanly — same failure occurs without any of Plan 04's changes. Plan 04 does not touch `lib/env.ts`, `next.config.ts`, or any code path that consumes those env vars.
- **Likely cause:** Plans 01–03 (form + server action) introduce code paths that import `env.RESEND_WEBHOOK_SECRET` / `env.UPSTASH_*` for the rate-limit + Resend signature verification, and the new vars haven't been added to the env-default contract yet.
- **Disposition:** Out of scope for Plan 04 (not caused by the CTA flips — the gate would already be failing without Plan 04). Logged here so the orchestrator can route it to the appropriate plan owner (likely Plan 02 server-action-stub) or to a dev-env `.env.local` fixture.
- **No fix attempted** in this plan to honor the SCOPE BOUNDARY rule. `tsc` and `lint` (the gates this plan owns) both pass cleanly.

### Authentication Gates

None. Plan 04 has no auth surface.

## Self-Check: PASSED

- File `components/sections/hero.tsx` exists at `/Users/jeff/repos/quibly-landing/components/sections/hero.tsx` — FOUND
- File `components/sections/secondary-cta.tsx` exists at `/Users/jeff/repos/quibly-landing/components/sections/secondary-cta.tsx` — FOUND
- File `tests/visual/button-radius.spec.ts` exists at `/Users/jeff/repos/quibly-landing/tests/visual/button-radius.spec.ts` — FOUND
- File `tests/visual/above-fold.spec.ts` exists at `/Users/jeff/repos/quibly-landing/tests/visual/above-fold.spec.ts` — FOUND
- Commit `4bfc2d5` (Task 1) — FOUND in git log
- Commit `5a0824c` (Task 2) — FOUND in git log
- Commit `46c1a56` (Task 3) — FOUND in git log
- Commit `69e2af8` (Rule 3 deviation) — FOUND in git log

## Threat Flags

None. No new security-relevant surface introduced. Plan 04 is purely cosmetic + selector hygiene; the form's threat surface lives in Plans 02 and 03 and is covered by their respective threat models.
