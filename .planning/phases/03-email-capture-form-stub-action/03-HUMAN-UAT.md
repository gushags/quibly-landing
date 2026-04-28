---
status: partial
phase: 03-email-capture-form-stub-action
source: [03-VERIFICATION.md]
started: 2026-04-28T16:30:00Z
updated: 2026-04-28T16:30:00Z
---

## Current Test

[awaiting human decision]

## Tests

### 1. Phase 2 visual spec regression (`tests/visual/above-fold.spec.ts` test 1)

expected: All Phase 2 visual specs continue to pass after Phase 3 changes. Either (a) scope the locator to the hero section in the Phase 2 spec, OR (b) remove the duplicate microcopy from `waitlist-form.tsx`, OR (c) accept the regression and re-classify as a Phase 4 follow-up.

result: [pending]

context: Plan 03-03's `WaitlistForm` added a second instance of "Launching Summer 2026" microcopy below the submit button. The Phase 2 spec at `tests/visual/above-fold.spec.ts:31` uses an unscoped `text=Launching Summer 2026` locator that now resolves to 2 elements, triggering Playwright strict-mode failure. Logged in `deferred-items.md` by Plan 03-05 with a suggested patch (scope to the hero section). Critical: the playwright job is now a required PR gate (D-18), so this currently blocks all Phase 4 PRs from merging.

### 2. FORM-08 wording deviation (`<noscript>` literal vs framework-native progressive enhancement)

expected: Either (a) accept the deviation via formal override (empirical evidence in Plan 06 SUMMARY shows the framework delivers stronger UX than the literal `<noscript>` spec — in-place success block renders server-side after no-JS POST), or (b) add an explicit `<noscript>` element to satisfy the literal REQUIREMENTS.md wording.

result: [pending]

context: REQUIREMENTS.md FORM-08 says `<noscript>` fallback. Phase 3 implementation followed CONTEXT D-16 ("framework-native progressive enhancement, no `<noscript>` banner") which Plan 06 then validated empirically — the framework actually renders the in-place success block server-side, exceeding D-16's accepted minimum. ROADMAP success criterion #3 is met in spirit but not in literal wording.

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
