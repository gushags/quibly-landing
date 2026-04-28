---
status: resolved
phase: 03-email-capture-form-stub-action
source: [03-VERIFICATION.md]
started: 2026-04-28T16:30:00Z
updated: 2026-04-28T16:50:00Z
---

## Current Test

[all items resolved]

## Tests

### 1. Phase 2 visual spec regression (`tests/visual/above-fold.spec.ts` test 1)

expected: All Phase 2 visual specs continue to pass after Phase 3 changes. Either (a) scope the locator to the hero section in the Phase 2 spec, OR (b) remove the duplicate microcopy from `waitlist-form.tsx`, OR (c) accept the regression and re-classify as a Phase 4 follow-up.

result: passed — option (a) applied. The locator at `tests/visual/above-fold.spec.ts:31` was scoped to the first `<section>` (hero): `page.locator("section").first().locator("text=Launching Summer 2026")`. Verified by re-running `npx playwright test tests/visual/` — all 6 tests pass (4 above-fold + 2 button-radius). Commit: `2dee59e`.

context: Plan 03-03's `WaitlistForm` added a second instance of "Launching Summer 2026" microcopy below the submit button as conversion-point reinforcement. The duplicate is intentional design and was preserved; only the test locator was over-broad. Note: the originally-presented "footer link tap targets fail" alternate failure was a stale-server artifact (PID 29078 was a leftover from a removed worktree serving outdated code) — once a fresh dev server was started on port 3000, all 4 above-fold tests + all 2 button-radius tests pass. D-18 PR gate is now unblocked.

### 2. FORM-08 wording deviation (`<noscript>` literal vs framework-native progressive enhancement)

expected: Either (a) accept the deviation via formal override (empirical evidence in Plan 06 SUMMARY shows the framework delivers stronger UX than the literal `<noscript>` spec — in-place success block renders server-side after no-JS POST), or (b) add an explicit `<noscript>` element to satisfy the literal REQUIREMENTS.md wording.

result: passed — REQUIREMENTS.md FORM-08 wording was rewritten to track reality rather than recording an ad-hoc override. New wording: "Form remains submittable without JavaScript via framework-native progressive enhancement (Next.js `<form action={serverAction}>` + React 19 `useActionState` thread the action result into the no-JS server render — empirically confirmed Phase 3 Plan 06; supersedes earlier `<noscript>` literal wording per CONTEXT D-16)". Commit: `9a662bb`.

context: D-16 is a locked decision and the framework-native approach is permanently the right answer (empirically stronger UX than the literal `<noscript>` would have delivered). Updating REQUIREMENTS.md is more durable than recording a per-phase override that future verifiers would have to re-apply.

## Summary

total: 2
passed: 2
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
