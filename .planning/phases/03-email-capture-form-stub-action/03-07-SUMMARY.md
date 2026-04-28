---
plan: 03-07
title: Checkpoints — branch protection (D-18) + founder copy review (D-04)
status: complete
tasks_complete: 2
tasks_total: 2
---

# Plan 03-07 — Phase 3 Manual Gates

Two founder-only gates closed Phase 3. Both checkpoints resolved without deferral.

## Task 1: D-18 Branch Protection — APPROVED

Founder added both new status checks from `.github/workflows/test.yml` to the
`main` branch protection rule:

- `Tests / vitest`
- `Tests / playwright`
- `Lighthouse CI / lighthouse` (Phase 2 D-34 — confirmed already configured)

D-18 enforcement is now live on `main`. Future PRs will be blocked from merge
until both Tests jobs report green.

## Task 2: D-04 Copy Review — REVISED AND LANDED

Founder edited `components/sections/waitlist-form-section.tsx` directly and
saved. The diff was committed as part of this plan.

Final shipped strings:

- **H2** (unchanged from draft): `Be first when Quibly opens up.`
  *5 words.*
- **Sub-copy** (revised, trimmed from 14 words to 11): `Drop your email and we'll ping you the moment Quibly's ready.`
  *Removed trailing "for the world." JSDoc DRAFT comment updated to reflect the shipped string.*

Verification after the edit:

- `npx tsc --noEmit` → exit 0
- `npm run lint` → exit 0
- `npm run test:unit` → 14/14 pass

The Plan 03-03 RTL spec asserts form-internal copy (FORM-04 placeholder, POST-02
success copy) but does not assert the section H2 or sub-copy strings, so the
copy revision did not break any unit test (as anticipated by the plan's
verification section).

## Commits

- `23efcf1` — `feat(03-07): land founder copy revision (D-04 / Task 2)`

## STATE.md Deferred Items added

None. Both gates resolved cleanly:

- D-18: enforced on `main` (no deferral needed)
- D-04: copy revised in-PR and committed (no deferral needed)

## Bonus finding worth surfacing to Phase 4 / future planning

Plan 03-06's empirical Playwright validation refuted RESEARCH Pitfall 3 /
Open Question 1 / VALIDATION Dimension-8: Next 16.2.1 + React 19.2.4 thread
`useActionState`'s return value into the no-JS server render natively. The
in-place success block (POST-01) is satisfied for no-JS users without a
`redirect('/?signup=success')` workaround. The "scope a redirect-based no-JS
success surface" follow-up workstream tentatively tracked in CONTEXT can be
**dropped** — the framework already delivers the desired behavior.

## Phase 4 handoff

Decisions Phase 4 inherits from Phase 3:

- Server Action surface (`app/actions/join-waitlist.ts`) is locked at
  D-09/D-10 shape: `(_prev, formData) => Promise<JoinWaitlistResult>` returning
  the discriminated union from `JOIN_WAITLIST_RESULT`.
- The 4 PHASE-3-STUB branches (`dup@`, `err@`, `slow@`, plain valid) are tagged
  `// PHASE-3-STUB — DELETE IN PHASE 4` and must be replaced (not extended)
  when Phase 4 wires real Resend Audiences.
- The two unit tests in `tests/unit/join-waitlist-action.test.ts` will need to
  be rewritten alongside that Phase 4 swap — they currently assert stub
  behavior, not real Resend behavior.
- All 12 Playwright form specs and the 1 no-js spec rely on the stub triggers
  and will need their email seeds remapped against real Resend Audience state
  (or Resend's API mocked at the network layer) when the stub is removed.
- D-18 enforcement is live — Phase 4 PRs will be blocked from merge until the
  Vitest and Playwright suites pass on the PR. Plan accordingly.

Phase 4 prerequisite carried forward from earlier intel:

- Physical postal address required for welcome-email footer (CAN-SPAM) — founder
  must source registered agent / PO box / CMRA before Phase 4 ships welcome
  email.

## Files modified

- `components/sections/waitlist-form-section.tsx` (sub-copy + JSDoc; cosmetic
  formatting changes from founder's editor, lint-clean)

## Issues Encountered

None. Both manual gates resolved at first ask.
