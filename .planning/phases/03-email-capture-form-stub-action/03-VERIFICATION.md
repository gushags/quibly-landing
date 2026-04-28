---
phase: 03-email-capture-form-stub-action
verified: 2026-04-28T16:25:00Z
status: human_needed
score: 5/5 success criteria verified
overrides_applied: 0
human_verification:
  - test: "Visual spec regression: tests/visual/above-fold.spec.ts test 1 fails because Phase 3's WaitlistForm added a second instance of 'Launching Summer 2026' microcopy, making the unscoped text locator non-unique."
    expected: "All Phase 2 visual specs continue to pass after Phase 3 changes. Either (a) scope the locator to the hero section in the Phase 2 spec, OR (b) remove the duplicate microcopy from waitlist-form.tsx, OR (c) accept the regression and re-classify as a Phase 4 follow-up."
    why_human: "This is a known regression documented in deferred-items.md. The form e2e suite (Plan 03-05) is fully green and the Phase 3 goal is achieved end-to-end. However, a previously-green Phase 2 test now fails. Decision needed: fix immediately, defer to Phase 4, or formally accept via override. Test currently fails in CI's playwright job which means D-18 branch protection would block merges."
  - test: "FORM-08 wording deviation: REQUIREMENTS.md FORM-08 specifies '<noscript> fallback so the form remains submittable without JS', but Phase 3 implements D-16 (framework-native progressive enhancement, no <noscript> element). Plan 06 SUMMARY documents that the framework actually renders the in-place success block server-side after no-JS POST."
    expected: "Either (a) accept the deviation via formal override (recommended — empirical evidence shows the framework delivers stronger UX than the literal <noscript> spec required), or (b) add an explicit <noscript> element."
    why_human: "Decision was already made in CONTEXT D-16 and validated empirically in Plan 06. The framework-native approach is functionally superior, but REQUIREMENTS.md still has the literal '<noscript>' wording. Recommend recording an override or updating REQUIREMENTS.md to reflect the chosen approach."
---

# Phase 3: Email Capture Form (Stub Action) Verification Report

**Phase Goal:** The full submit UX — pending, success, error, already-subscribed, idempotent retry — works end-to-end against a stubbed Server Action that validates Zod + honeypot + time-trap, so debugging round-trip ergonomics happens before Resend is in the loop.

**Verified:** 2026-04-28T16:25:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| #   | Truth                                                                                                                                                                                                                              | Status      | Evidence                                                                                                                                                                                                                                          |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | A visitor can type an email, press Enter or tap "Join the waitlist", see a visible loading state, and land on an in-place success message ("You're on the list. Check your inbox (and spam folder) for confirmation") without any full-page navigation. | ✓ VERIFIED  | `tests/form/pending-state.spec.ts` (FORM-05/D-13 visible Joining... + spinner + disabled — passes), `tests/form/enter-key-submit.spec.ts` (FORM-07 — passes), `tests/form/success-state.spec.ts` (POST-01 atomic in-place + POST-02 verbatim — 3/3 pass). All 12 form e2e tests pass against running dev server (verified by executing). |
| 2   | Submitting an invalid email surfaces an inline error that preserves the typed value; submitting the same email twice produces the same success state (idempotent, never reveals duplicate enumeration).                       | ✓ VERIFIED  | `tests/form/validation-error.spec.ts` test 1 asserts `toHaveValue('bad-email')` (Pitfall 1 load-bearing) + `aria-invalid='true'` + inline error (FORM-03/06). `tests/form/success-state.spec.ts` test 2 asserts `dup@example.com` renders identical success block + zero `data-duplicate` attributes + no "duplicate"/"already" text (POST-03 three-layer enumeration defense). `tests/form/idempotent.spec.ts` asserts disabled={pending} no-op on second click (POST-04). All pass. |
| 3   | The form remains submittable with JavaScript disabled via the `<noscript>` fallback and native `<form action={…}>` progressive enhancement.                                                                                       | ⚠️ PARTIAL  | Native `<form action={…}>` progressive enhancement: VERIFIED via `tests/no-js/waitlist-form-progressive.spec.ts` (passes — submits without JS, returns HTTP 200, success block renders server-side). However, the literal `<noscript>` element is NOT present in the WaitlistForm — D-16 substituted "framework-native progressive enhancement, no `<noscript>` banner" for the literal `<noscript>` fallback. Empirical finding (Plan 06 SUMMARY) shows the framework does deliver the in-place success block server-side, exceeding D-16's accepted minimum. **Spirit of the SC met; literal wording deviates.** |
| 4   | A bot that fills the off-screen honeypot field, or a script that submits faster than ~2 seconds after render, is silently rejected without user-visible feedback.                                                                | ✓ VERIFIED  | `tests/unit/join-waitlist-action.test.ts` test 1 (`returns silent success when honeypot is filled`) and test 2 (`returns silent success when submitted faster than 2s`) both pass. Action source `app/actions/join-waitlist.ts:55-66` implements both checks BEFORE Zod parse and returns `{ status: 'success' }` silently. |
| 5   | The Server Action runs Zod validation server-side on every submission and returns typed `useActionState` results that the Client Component renders without prop-drilling.                                                       | ✓ VERIFIED  | `app/actions/join-waitlist.ts:35-39` Zod schema with `z.email()` + `.max(254)`. `components/waitlist/waitlist-form.tsx:47-50` binds `useActionState<JoinWaitlistResult \| null, FormData>(joinWaitlistAction, null)` with the typed discriminated union imported from `@/app/actions/join-waitlist`. No prop-drilling — state lives in the Client Component. 8/8 unit tests for the action pass; 6/6 RTL tests for the form's static surface pass. |

**Score:** 5/5 success criteria verified (4 fully, 1 spirit-met with deviation note).

### Required Artifacts

| Artifact                                          | Expected                                                          | Status     | Details                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| `app/actions/join-waitlist.ts`                    | Server Action with Zod + honeypot + time-trap + stub branches    | ✓ VERIFIED | 109 lines; `'use server'` line 1; exports `joinWaitlistAction` + `JoinWaitlistResult`; all 8 unit tests pass; 5× `PHASE-3-STUB` markers. |
| `components/waitlist/waitlist-form.tsx`           | Client Component with useActionState + sonner + honeypot         | ✓ VERIFIED | 179 lines; `"use client"` line 1; uses useActionState bound to action; honeypot inline-styled off-screen; pending state with Loader2 + disabled; success block with role=status + CircleCheck + verbatim POST-02 copy. |
| `components/sections/waitlist-form-section.tsx`   | RSC parent computing renderedAt + composing form                 | ✓ VERIFIED | 65 lines; no client directive; computes `Date.now()` at request time; passes `renderedAt: number` prop; preserves Phase 2 outer wrapper (id="waitlist", scroll-mt-16) verbatim. |
| `components/sections/placeholder-form-section.tsx`| DELETED (renamed to waitlist-form-section.tsx)                   | ✓ VERIFIED | Confirmed absent. `app/page.tsx` has no PlaceholderFormSection references. |
| `app/page.tsx`                                    | Imports + renders WaitlistFormSection                            | ✓ VERIFIED | Line 4 import + line 24 JSX both correct. |
| `app/layout.tsx`                                  | Toaster mounted inside `<body>` after `{children}`               | ✓ VERIFIED | Line 5 import; line 41 `<Toaster />` after `{children}`. |
| `vitest.config.ts`                                | happy-dom env + @/* alias + segregated include/exclude           | ✓ VERIFIED | Includes `tests/unit/**/*.test.{ts,tsx}`; excludes `tests/visual/**`, `tests/form/**`, `tests/no-js/**`. Alias mirror `path.resolve(__dirname, './')`. |
| `tests/setup.ts`                                  | jest-dom matchers + RTL cleanup                                  | ✓ VERIFIED | Imports `@testing-library/jest-dom/vitest` + cleanup() in afterEach. |
| `playwright.config.ts`                            | Multi-project (visual-and-form + no-js with javaScriptEnabled:false) | ✓ VERIFIED | Both projects configured; no-js project sets `javaScriptEnabled: false`. |
| `.github/workflows/test.yml`                      | Two parallel jobs (vitest + playwright) named "Tests"             | ✓ VERIFIED | `name: Tests` + jobs `vitest` and `playwright`; status check names `Tests / vitest` and `Tests / playwright`. |
| `tests/unit/join-waitlist-action.test.ts`         | 8 unit tests covering all action branches                        | ✓ VERIFIED | 8 `it()` blocks; all 8 pass via `npm run test:unit`. |
| `tests/unit/waitlist-form.test.tsx`               | 6 RTL tests covering form static surface                         | ✓ VERIFIED | 6 `it()` blocks; all 6 pass. |
| `tests/form/pending-state.spec.ts`                | FORM-05 pending UX coverage                                       | ✓ VERIFIED | 1 test, passes. |
| `tests/form/success-state.spec.ts`                | POST-01 atomic + POST-02 verbatim + POST-03 enumeration defense   | ✓ VERIFIED | 3 tests; first test pairs `toHaveCount(0)` AND `startURL` same-URL check (W-04 atomic enforcement); all pass. |
| `tests/form/validation-error.spec.ts`             | FORM-03 + FORM-06 (Pitfall 1 load-bearing toHaveValue)            | ✓ VERIFIED | 2 tests; `toHaveValue('bad-email')` present; both pass. |
| `tests/form/server-error-toast.spec.ts`           | D-12 sonner routing on err@example.com                           | ✓ VERIFIED | 1 test, passes. |
| `tests/form/idempotent.spec.ts`                   | POST-04 disabled={pending} double-submit prevention               | ✓ VERIFIED | 1 test, passes. Documents Dimension-8 boundary (browser-level, not audience-level). |
| `tests/form/enter-key-submit.spec.ts`             | FORM-07 Enter-key submit                                          | ✓ VERIFIED | 1 test, passes. |
| `tests/form/anchor-scroll.spec.ts`                | D-01 + D-02 hero/secondary CTAs scroll to #waitlist               | ✓ VERIFIED | 3 tests, all pass. |
| `tests/no-js/waitlist-form-progressive.spec.ts`   | FORM-08 graceful degradation acceptance                           | ✓ VERIFIED | 1 test, passes; encodes empirical finding that success block actually renders server-side (stronger than D-16 minimum). |
| `components/sections/hero.tsx`                    | Hero CTA flipped to `<Button asChild><a href="#waitlist">`        | ✓ VERIFIED | Line 43-45: `<Button asChild size="hero" variant="default"><a href="#waitlist">Join the waitlist</a></Button>`. No `aria-disabled`. |
| `components/sections/secondary-cta.tsx`           | Secondary CTA flipped to anchor                                   | ✓ VERIFIED | Line 24-26: `<Button asChild size="hero" variant="default"><a href="#waitlist">Don&apos;t miss launch — join the waitlist</a></Button>`. |
| `tests/visual/button-radius.spec.ts`              | Selector updated to tag-agnostic `[data-slot=button][data-size=hero]` (Pitfall 9) | ✓ VERIFIED | New selector present; old `button[aria-disabled="true"]` selector fully retired. 28px radius invariant + 48px MOB-02 height invariant preserved. Passes. |

### Key Link Verification

| From                                                | To                                          | Via                                          | Status     | Details                                                                                                  |
| --------------------------------------------------- | ------------------------------------------- | -------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `components/waitlist/waitlist-form.tsx`             | `@/app/actions/join-waitlist`               | named import + useActionState binding        | ✓ WIRED    | Line 9-12 imports `joinWaitlistAction` + `JoinWaitlistResult`; line 47-50 `useActionState(joinWaitlistAction, null)`. |
| `components/sections/waitlist-form-section.tsx`     | `components/waitlist/waitlist-form.tsx`     | renderedAt prop via RSC composition          | ✓ WIRED    | Line 1 import; line 61 `<WaitlistForm renderedAt={renderedAt} />`. `renderedAt = Date.now()` at line 49. |
| `app/layout.tsx`                                    | `components/ui/sonner`                      | Toaster import + mount inside body           | ✓ WIRED    | Line 5 imports `Toaster`; line 41 mounts `<Toaster />` after `{children}` inside `<body>`. |
| `app/page.tsx`                                      | `components/sections/waitlist-form-section` | import + render                              | ✓ WIRED    | Line 4 import; line 24 `<WaitlistFormSection />`. No orphaned PlaceholderFormSection refs. |
| `app/actions/join-waitlist.ts`                      | `zod`                                       | Zod 4 schema (z.email() + z.flattenError)    | ✓ WIRED    | Line 3 import; line 35-39 schema using `z.email`; line 72 `z.flattenError`. No deprecated Zod 3 idioms. |
| `tests/unit/join-waitlist-action.test.ts`           | `@/app/actions/join-waitlist`               | named import + FormData fixtures             | ✓ WIRED    | Test imports correctly; 8/8 pass exercising all action branches. |
| `components/sections/hero.tsx` `<a href="#waitlist">` | `#waitlist` anchor in waitlist-form-section.tsx | `<a href>` + CSS scroll-behavior:smooth | ✓ WIRED    | Anchor present in hero; target section has `id="waitlist"`. anchor-scroll.spec.ts verifies behavior. |
| `components/sections/secondary-cta.tsx`             | `#waitlist`                                 | `<a href>` + smooth-scroll                   | ✓ WIRED    | Same as above; secondary CTA scrolls UP to form. |

### Data-Flow Trace (Level 4)

| Artifact                                            | Data Variable        | Source                                                        | Produces Real Data | Status      |
| --------------------------------------------------- | -------------------- | ------------------------------------------------------------- | ------------------ | ----------- |
| `components/waitlist/waitlist-form.tsx`             | `state` (JoinWaitlistResult) | `useActionState(joinWaitlistAction, null)` — typed action | Yes — action returns success/error/duplicate per branch | ✓ FLOWING |
| `components/waitlist/waitlist-form.tsx`             | `renderedAt: number` | RSC parent prop from `waitlist-form-section.tsx:49 Date.now()` | Yes — fresh value per request | ✓ FLOWING |
| `components/waitlist/waitlist-form.tsx`             | `pending` (boolean)  | `useActionState` returns `[state, action, pending]`           | Yes — true during in-flight action | ✓ FLOWING |
| Toast on D-12 error                                 | `state.message`      | `state.status === 'error' && state.message && !state.fieldErrors` guard | Yes — wired via useEffect; e2e verified | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior                                                                      | Command                                              | Result                | Status |
| ----------------------------------------------------------------------------- | ---------------------------------------------------- | --------------------- | ------ |
| Vitest unit suite passes                                                      | `npm run test:unit`                                  | 14/14 pass, ~2.18s    | ✓ PASS |
| TypeScript clean                                                              | `npx tsc --noEmit`                                   | exit 0                | ✓ PASS |
| Production build succeeds                                                     | `npm run build`                                      | exit 0; 3 static pages | ✓ PASS |
| Form e2e suite passes against dev server                                      | `npx playwright test --project=visual-and-form tests/form/` (with port override) | 12/12 pass, ~7.7s | ✓ PASS |
| No-JS spec passes                                                             | `npx playwright test --project=no-js`                | 1/1 pass              | ✓ PASS |
| Phase 2 button-radius spec still green                                        | `npx playwright test tests/visual/button-radius.spec.ts` | 2/2 pass        | ✓ PASS |
| Phase 2 above-fold spec still green                                            | `npx playwright test tests/visual/above-fold.spec.ts` | 1/4 fail (microcopy locator non-unique) | ✗ FAIL |

### Requirements Coverage

| Requirement | Source Plan(s) | Description                                          | Status      | Evidence                                                                                                       |
| ----------- | -------------- | ---------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------- |
| FORM-01     | 03-03          | Single email input field                              | ✓ SATISFIED | `components/waitlist/waitlist-form.tsx:111` `<Input id="email" name="email">` — single field. |
| FORM-02     | 03-03          | type=email, inputMode, autoComplete, HTML5 validation | ✓ SATISFIED | `waitlist-form.tsx:113-118` all attrs present (type, inputMode, autoComplete, required); RTL test passes. |
| FORM-03     | 03-02          | Server-side Zod email validation                      | ✓ SATISFIED | `app/actions/join-waitlist.ts:35-39` schema; line 71-84 safeParse + flattenError. Unit test passes. |
| FORM-04     | 03-03, 03-04   | Action-oriented CTA "Join the waitlist"              | ✓ SATISFIED | Verbatim in form submit, hero anchor, and microcopy chain. RTL test asserts. |
| FORM-05     | 03-03, 03-05   | Visible loading state during submit                  | ✓ SATISFIED | `Joining...` label, Loader2 spinner, disabled state. e2e pending-state.spec.ts passes. |
| FORM-06     | 03-02, 03-05   | Inline error preserves typed value                   | ✓ SATISFIED | `submittedValues.email` echo + `defaultValue`; e2e `toHaveValue('bad-email')` load-bearing assertion passes. |
| FORM-07     | 03-05          | Native form Enter-key submit                          | ✓ SATISFIED | enter-key-submit.spec.ts passes. |
| FORM-08     | 03-06          | `<noscript>` fallback or progressive enhancement      | ⚠️ DEVIATED | Literal `<noscript>` element NOT present (D-16 substituted with framework-native progressive enhancement). Empirical finding shows the framework actually delivers in-place success block server-side. Spirit met, literal wording deviates. **Recommend override.** |
| FORM-09     | 03-03          | useActionState binds Client Component to Server Action | ✓ SATISFIED | `waitlist-form.tsx:47-50` typed binding to `JoinWaitlistResult`. |
| POST-01     | 03-03, 03-05   | In-place success replaces form, no full-page nav      | ✓ SATISFIED | success-state.spec.ts test 1 (atomic enforcement: toHaveCount(0) + startURL.toBe(endURL)). Empirically verified for no-JS path too. |
| POST-02     | 03-03, 03-05   | Success copy verbatim                                  | ✓ SATISFIED | `Check your inbox (and spam folder) for confirmation.` exactly in waitlist-form.tsx:94 + asserted in e2e. |
| POST-03     | 03-02, 03-03, 03-05 | Already-subscribed treated as success (no enumeration) | ✓ SATISFIED | Render code does NOT branch on state.duplicate (grep audit clean); POST-03 three-layer e2e enforcement passes (no data-duplicate attr, no "duplicate"/"already" text, identical content). |
| POST-04     | 03-02, 03-03, 03-05 | Idempotent submission                                  | ✓ SATISFIED | disabled={pending} on input + button (browser-level idempotency); idempotent.spec.ts asserts single transition on rapid double-click. Documented as browser-level (Phase 4 audience-level). |
| SPAM-01     | 03-02          | Hidden honeypot field, silent rejection on fill        | ✓ SATISFIED | `<input name="website">` with inline off-screen style (NOT display:none); action returns silent success when filled. Unit test passes. |
| SPAM-02     | 03-02          | Time-trap rejects submissions <2s after render         | ✓ SATISFIED | `renderedAt` hidden input + action check `Date.now() - renderedAt < 2000`. Unit test passes. |

**Coverage:** 14/15 requirements fully satisfied; 1 (FORM-08) satisfied in spirit but deviates from literal `<noscript>` wording. No orphaned requirements.

### Anti-Patterns Found

| File                                                | Line | Pattern                              | Severity  | Impact                                                                                                                                            |
| --------------------------------------------------- | ---- | ------------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/actions/join-waitlist.ts`                      | 86, 91, 95, 102, 107 | `// PHASE-3-STUB — DELETE IN PHASE 4` | ℹ️ Info  | INTENTIONAL stub markers (5× per spec; T-03-06 mitigation enabling grep-based removal in Phase 4). Documented in Plan 02 SUMMARY. NOT a defect. |
| `components/sections/waitlist-form-section.tsx`     | 48   | `eslint-disable-next-line react-hooks/purity` | ℹ️ Info | INTENTIONAL inline disable for `Date.now()` in RSC body — per-request impurity is the design (CD-02 + Pitfall 2). Justified comment present.   |

No blocker or warning anti-patterns found.

### Deferred Items (from Phase artifacts)

The phase explicitly deferred one item:

- **`tests/visual/above-fold.spec.ts` regression** — `text=Launching Summer 2026` locator is no longer unique because Phase 3's WaitlistForm added a second instance below the form. Documented in `deferred-items.md`. **Currently fails: 1 of 4 tests in `tests/visual/above-fold.spec.ts` fails** (verified by execution). This means D-18 branch protection (`Tests / playwright` job) would block PR merges until fixed. Suggested fix: scope locator to `section:first` or remove duplicate microcopy.

### Human Verification Required

#### 1. Phase 2 Visual Spec Regression

**Test:** Decide how to handle the `tests/visual/above-fold.spec.ts` regression. Currently `text=Launching Summer 2026` resolves to 2 elements (hero microcopy + waitlist-form microcopy) — Playwright strict-mode violation.

**Expected:** All Phase 2 visual specs continue to pass. Choose one:
- **(a)** Patch the spec to scope the locator to the hero `<section>` only (e.g., `page.locator("section").first().locator("text=Launching Summer 2026")`).
- **(b)** Remove the duplicate `<p>Launching Summer 2026</p>` from `components/waitlist/waitlist-form.tsx:174-176`.
- **(c)** Accept the regression with a written deferral note (and update `deferred-items.md` to clarify).

**Why human:** This is a known regression intentionally deferred by the executor (per execute-plan SCOPE BOUNDARY rule — out of Plan 03-05's scope). The Phase 3 GOAL is achieved end-to-end. However, the broken Phase 2 spec lives in the same Playwright suite that is now a required PR gate (D-18). Decision needed before Phase 4 plans can be merged.

#### 2. FORM-08 Literal Wording vs D-16 Substitution

**Test:** Decide how to record the FORM-08 deviation. REQUIREMENTS.md says `<noscript>` fallback; implementation uses framework-native progressive enhancement (D-16 decision; empirically validated to render success block server-side).

**Expected:** Either record an override entry in this VERIFICATION.md frontmatter, or update REQUIREMENTS.md to reflect the chosen approach.

**Why human:** Decision to substitute was made during planning (CONTEXT D-16) and validated during execution (Plan 06 SUMMARY). The implementation is functionally superior to the literal requirement. Recording an override formalizes the deviation; updating REQUIREMENTS.md changes the contract. Either is reasonable; this is a documentation/traceability choice.

### Gaps Summary

The Phase 3 GOAL is achieved end-to-end:

1. The full submit UX (pending → success → error → already-subscribed → idempotent retry) works against the stub Server Action.
2. The Server Action implements real Zod validation, real honeypot, and real time-trap.
3. The Client Component binds to the action via `useActionState` with the typed discriminated union.
4. All 14 unit tests pass; all 12 form e2e tests pass; the 1 no-JS test passes; the 2 visual button-radius tests pass; production build succeeds.
5. Branch protection is configured on `main` per D-18.
6. Founder copy review approved with one revision (sub-copy trimmed).

Two human-verification items prevent automatic `passed` status:

1. **Phase 2 above-fold spec regression** — known-broken Phase 2 invariant caused by Phase 3 component change. Currently fails in CI. Decision required before Phase 4 PRs can pass D-18 branch protection.
2. **FORM-08 literal vs D-16 substitution** — implementation deviates from REQUIREMENTS.md literal wording in a way that delivers stronger UX. Override recommended.

Once these two items are resolved (either via override entries here or follow-up commits), the phase achieves `passed`.

---

_Verified: 2026-04-28T16:25:00Z_
_Verifier: Claude (gsd-verifier)_
