---
phase: 03-email-capture-form-stub-action
fixed_at: 2026-04-28T17:00:00Z
review_path: .planning/phases/03-email-capture-form-stub-action/03-REVIEW.md
iteration: 1
findings_in_scope: 11
fixed: 9
skipped: 2
status: partial
---

# Phase 3: Code Review Fix Report

**Fixed at:** 2026-04-28T17:00:00Z
**Source review:** `.planning/phases/03-email-capture-form-stub-action/03-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope (Critical + Warning): 11
- Fixed: 9
- Skipped: 2 (architectural / judgment-call findings deferred for human decision)

## Fixed Issues

### CR-01: CI workflow's "Start Next server" step cannot fail; failure is silently masked

**Files modified:** `.github/workflows/test.yml`, `playwright.config.ts`
**Commit:** `6299d32`
**Applied fix:** Replaced the `npx next start &` + `wait-on` pattern with Playwright's `webServer` config so server-startup failures propagate to the test runner. Added build-time stub env vars (`RESEND_*`, `UPSTASH_*`) for both the `npm run build` and `npm run test:e2e` workflow steps so `lib/env.ts`'s parse-at-module-load does not crash CI. Phase 3 stub action does not exercise Resend/Upstash so syntactically-valid placeholders are sufficient.

### CR-02: `npm run lint` runs ESLint with no target

**Files modified:** `package.json`
**Commit:** `487f1ee`
**Applied fix:** Changed `"lint": "eslint"` to `"lint": "eslint . --max-warnings=0"`. The reviewer's first suggestion (`next lint`) was tried first but failed because Next 16 removed the `next lint` subcommand — Next now treats `lint` as a positional directory argument. Verified `eslint . --max-warnings=0` lints all expected files (confirmed via `--debug`).

### CR-04: `tests/form/idempotent.spec.ts` does not test what its name claims

**Files modified:** `tests/form/idempotent.spec.ts`
**Commit:** `9e367ca`
**Applied fix:** Replaced the no-op `submit.click({ trial: true })` second click with a real `submit.click({ force: true, noWaitAfter: true })` and added a network-request listener that counts Server Action POSTs to `/`. The load-bearing assertion is now `actionPostCount === 1` rather than the tautological `success block toHaveCount(1)`. A regression that removes `disabled={pending}` from the submit button now fails this test.

### WR-01: `useEffect` dependency `[state]` re-fires on every state object identity change

**Files modified:** `components/waitlist/waitlist-form.tsx`
**Commit:** `29d3d12`
**Applied fix:** Track the last-consumed state instance via a ref (`lastToastedStateRef`, `focusedSuccessStateRef`) and bail out when the current `state` matches the ref. Each effect now runs at most once per resolved state, eliminating the double-toast-on-retry-of-same-error case.

### WR-02: Honeypot `name="website"` triggers password-manager autofill on real users

**Files modified:** `components/waitlist/waitlist-form.tsx`, `app/actions/join-waitlist.ts`, `tests/unit/join-waitlist-action.test.ts`, `tests/unit/waitlist-form.test.tsx`
**Commit:** `4d7162c`
**Applied fix:** Renamed the honeypot field from `website` to `hp_field` (no password-manager heuristic match) and added `data-1p-ignore`, `data-bwignore`, `data-lpignore="true"` as belt-and-suspenders. Updated the action's `formData.get('hp_field')` check, the unit test's input field, and the form structure test (renamed assertion + new assertions for the data-*-ignore attrs).

### WR-03: `parsed.data.email` is used un-normalized — bypasses stub branches on mixed-case input

**Files modified:** `app/actions/join-waitlist.ts`, `tests/unit/join-waitlist-action.test.ts`
**Commit:** `74a4d2b`
**Applied fix:** Added `.transform(s => s.toLowerCase())` to the schema's email field. Lowercase-only at the schema level because Zod 4's `z.email()` rejects leading/trailing whitespace before any transform runs; trimming therefore happens in the action on `rawEmail` before parse. Added a unit test covering `  Dup@Example.COM  ` to lock the case-insensitive duplicate path.

### WR-04: `String(formData.get('email') ?? '')` allows File coercion

**Files modified:** `app/actions/join-waitlist.ts`
**Commit:** `a904837`
**Applied fix:** Replaced `String(formData.get('email') ?? '')` with explicit type narrowing — `typeof rawEmailField === 'string' ? rawEmailField : ''`. A malformed multipart POST sending `email` as a file part now rejects cleanly with the standard invalid-email message rather than echoing `"[object File]"` back via submittedValues.

### WR-05: focus-on-success effect can race with the form unmount

**Files modified:** `components/waitlist/waitlist-form.tsx`
**Commit:** `32e78d7`
**Applied fix:** Wrapped the `successHeadingRef.current.focus()` call in `requestAnimationFrame(...)` so the success block has been painted before focus moves. Also handles the rare concurrent-mode case where the ref is still `null` at effect-run time (the inner check survives a re-render between the rAF schedule and the rAF callback).

### WR-07: `vitest.config.ts` exclude entries cannot be matched by the include glob

**Files modified:** `vitest.config.ts`
**Commit:** `3fcc66e`
**Applied fix:** Dropped the redundant `tests/visual/**`, `tests/form/**`, `tests/no-js/**` entries from `exclude` (the `tests/unit/**` include glob already restricts the search) and broadened the include pattern from `*.test.{ts,tsx}` to `*.{test,spec}.{ts,tsx}` so a future contributor naming a unit test `foo.spec.ts` is not silently skipped.

## Skipped Issues

### CR-03: Time-trap is bypassable from any client — SPAM-02 is theater

**File:** `components/waitlist/waitlist-form.tsx:157`, `app/actions/join-waitlist.ts:63-66`
**Reason:** Architectural change with planning-artifact implications — deferred for human decision.

The reviewer presents three mutually-exclusive paths and explicitly frames it as a judgment call:
1. **HMAC-sign the timestamp** with a server secret. This requires (a) provisioning a new env var (e.g. `WAITLIST_TIME_TRAP_SECRET`) which must be added to `lib/env.ts`'s schema and Vercel/GitHub secrets and (b) changing the data flow so the RSC produces a signed token instead of a bare integer. Touches CD-02's "hidden input populated server-side" contract from CONTEXT.md.
2. **Move the timestamp to an httpOnly cookie** set by the RSC's request handler. Changes the timestamp-transport surface from "RSC prop -> hidden input -> formData" to "request cookie -> next/headers cookies()", which has caching implications (cookie reads opt the page out of static generation) that should be evaluated against the Lighthouse ≥90 mobile target in CLAUDE.md.
3. **Remove the time-trap entirely** and accept that Phase 4's Turnstile + Resend rate-limit + Upstash sliding-window cover the abuse axis. This is a planning-artifact rollback of D-15 and CD-02, which were explicitly required by the planner.

Any of these is correct; choosing among them requires confirming with the planner whether (a) Phase 3 is allowed to ship a known-bypassable trap given Turnstile lands in Phase 4, (b) cookie-based state is acceptable in the RSC, or (c) a new env secret is in scope. The current implementation matches D-15 / CD-02 as planned, so the most conservative action is to surface the issue rather than silently change the contract.

**Original issue:** The honeypot/time-trap "defenses" can be bypassed with a single line of trivial JS by any client (`document.querySelector('input[name="renderedAt"]').value = "0"`). The Phase 3 e2e tests use exactly this pattern, which proves the bypass works in production. The "defense in depth" claim in CLAUDE.md is currently honeypot + half-baked time-trap because Turnstile is Phase 4.

### WR-06: `tests/no-js/waitlist-form-progressive.spec.ts` uses `force: true`

**File:** `tests/no-js/waitlist-form-progressive.spec.ts:77`
**Reason:** The test author already evaluated and rejected the reviewer's suggested replacement; the suggestion would likely re-flake the test on CI without addressing the underlying cause.

The current code's JSDoc explicitly documents the failure mode the reviewer suggests substituting in (`waitForLoadState('networkidle')` + `submit.click()` without force) — the executor verified empirically on both `next dev` and `next start` that Playwright's stability check (n consecutive frames of identical bounding box) flakes intermittently when fonts arrive after first paint, even with networkidle. The reviewer's proposed pattern does not cancel font-load-driven layout micro-shifts; it simply moves the wait elsewhere.

The risk-asymmetry of accepting the reviewer's framing here is bad: the test currently passes consistently and locks in the FORM-08 / D-16 acceptance signal, and the reviewer's hypothetical "Phase 4 layout regression hidden by force:true" is mitigated by the visual-regression suite (`tests/visual/above-fold.spec.ts`) which DOES run actionability checks. Removing `force: true` here would convert a stable test into a flaky one to guard against a regression another spec already catches.

If a future Phase 4 change introduces a button-overlay regression that the visual suite doesn't catch, that's the trigger to revisit this — at which point the right fix is probably an explicit `await submit.scrollIntoViewIfNeeded()` + a font-load wait, not removing `force: true`.

**Original issue:** `force: true` bypasses Playwright's element-is-receiving-pointer-events check (catches CSS regressions where another element overlays the button) and element-is-stable check (catches layout-shift bugs). If a Phase 4 change introduces a layout shift that pushes the button under a header on no-JS load, this test passes despite real users never reaching the button.

---

_Fixed: 2026-04-28T17:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
