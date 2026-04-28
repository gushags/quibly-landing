---
phase: 04-resend-wiring-bot-protection-welcome-email
plan: "05"
subsystem: server-action
tags: [phase-4, action-body-swap, resend-pipeline, vitest-mocks, can-spam]

dependency_graph:
  requires: [04-01, 04-02, 04-03, 04-04]
  provides: [real-resend-pipeline, unit-test-coverage-phase4]
  affects: [app/actions/join-waitlist.ts, tests/unit/join-waitlist-action.test.ts]

tech_stack:
  added: []
  patterns:
    - vi.mock with dynamic import in beforeAll for Server Action isolation
    - fire-and-forget .catch() for welcome email observability (CD-09)
    - isDuplicateContactError() D-06 fallback helper (regex-based)
    - eslint-disable-next-line for Vercel system env var exceptions (PATTERNS.md)

key_files:
  modified:
    - app/actions/join-waitlist.ts
    - tests/unit/join-waitlist-action.test.ts
    - tests/unit/waitlist-form.test.tsx

decisions:
  - "isDuplicateContactError() ships with regex fallback: `/already (exists|subscribed)|duplicate/i.test(error.message)` — covers the most common error message shapes without empirical probe data. D-06 still technically applies until the probe runs."
  - "waitlist-form.test.tsx mocks @/app/actions/join-waitlist to prevent lib/env.ts from loading in RTL render-only tests — Rule 2 auto-fix since Phase 4 action now imports env at module load."
  - "Three Vercel system env vars (VERCEL_ENV, VERCEL_GIT_COMMIT_SHA, NEXT_PUBLIC_SITE_URL) use inline eslint-disable-next-line per PATTERNS.md exception — these are NOT in lib/env.ts because Vercel runtime-injects them."
  - "Rate-limit failure mode (T-04-26): fail-closed posture maintained — Upstash error throws, Next.js surfaces as 500, user retries. No outer try/catch added per CONTEXT decision. Documented for Plan 07 monitoring."

metrics:
  duration_seconds: 583
  tasks_completed: 2
  files_modified: 3
  completed_date: "2026-04-28"
---

# Phase 4 Plan 05: Action Body Swap + Test Migration Summary

Real Resend pipeline replaces Phase 3 stub branches in `app/actions/join-waitlist.ts`; Vitest suite migrated from email-pattern triggers to `vi.mock('@/lib/resend')` with 16 tests covering all Phase 4 requirement IDs including a dedicated EMAIL-05 CAN-SPAM postalAddress assertion.

## What Was Built

### Task 1: Real Resend pipeline in `app/actions/join-waitlist.ts`

The four Phase 3 stub branches (`dup@example.com`, `err@example.com`, `slow@example.com`, default) were deleted and replaced with the real pipeline:

```
honeypot → time-trap → Zod → disposable-domain → rate-limit → contacts.create → welcome email → track
```

New imports added: `headers` from `next/headers`, `env`, `resend`, `rateLimitPerMinute`, `rateLimitPerDay`, `isDisposableDomain`, `track`, `WelcomeEmail`, `generateToken`.

Key implementation details:
- Disposable-domain check runs before rate-limit (CD-11: cheaper computation first)
- Rate-limit runs both minute + day checks in parallel via `Promise.all`
- `audienceId` routes to production vs preview based on `process.env.VERCEL_ENV === 'production'` (CD-04)
- `consentVersion` uses `process.env.VERCEL_GIT_COMMIT_SHA ?? 'pre-phase-5'` (CD-03)
- Welcome email is fire-and-forget (NOT awaited), `.catch()` fires `track('welcome_email_send_error')` (CD-09 / EMAIL-08)
- `isDuplicateContactError()` helper ships with regex matching `Contact already exists`, `already subscribed`, or `duplicate` case-insensitively

Phase 3 contracts preserved verbatim:
- File path: `app/actions/join-waitlist.ts`
- Export name: `joinWaitlistAction`
- Discriminated-union shape: `{ status: 'success'; duplicate?: boolean } | { status: 'error'; ... }`
- Honeypot, time-trap, Zod validation blocks untouched

### Task 2: Migrated Vitest suite `tests/unit/join-waitlist-action.test.ts`

Full replacement of Phase 3 stub-trigger tests with mocked pipeline tests.

**Mock setup:**
- `vi.mock('@/lib/resend')` — Resend SDK singleton
- `vi.mock('@/lib/rate-limit')` — rate-limit ladder (default: passing)
- `vi.mock('@/lib/analytics')` — analytics shim
- `vi.mock('next/headers')` — Next 16.2 async headers()
- `vi.mock('@/emails/WelcomeEmail')` — template mock for postalAddress assertion

**Test count: 16 (4 preserved + 12 new)**

Preserved Phase 3 tests:
1. Honeypot fills → silent success, no Resend calls (SPAM-01)
2. Submitted <2s → silent success, no Resend calls (SPAM-02)
3. Invalid email → fieldErrors + submittedValues echo (FORM-03 + FORM-06)
4. Empty email → fieldErrors (FORM-03)

New Phase 4 tests:
5. Disposable domain → silent success, no Resend, track('signup_rejected', disposable_domain) (SPAM-04)
6. Rate-limit minute exceeded → silent success, no Resend, track('signup_rejected', rate_limit) (SPAM-03)
7. Rate-limit day exceeded → silent success, no Resend (SPAM-03)
8. contacts.create called with audienceId + consent_version (STORE-01/03/04)
9. Preview audience when VERCEL_ENV != production (CD-04)
10. Production audience when VERCEL_ENV === production (STORE-01)
11. Welcome email: from, to, subject, List-Unsubscribe-Post header, List-Unsubscribe header (EMAIL-01/02/03)
12. postalAddress wiring to WelcomeEmail (EMAIL-05 CAN-SPAM) — dedicated test
13. Duplicate suppression: no emails.send + track('waitlist_signup', { duplicate: true }) (D-05)
14. Non-duplicate Resend error → user-facing error response (D-12)
15. Fire-and-forget send rejection → track('welcome_email_send_error') (EMAIL-08)
16. Fresh signup → track('waitlist_signup', { duplicate: false }) (ANLY-03)

### Rule 2 Auto-fix: `tests/unit/waitlist-form.test.tsx`

Phase 4's action now imports `lib/env.ts` at module load time. The Phase 3 `waitlist-form.test.tsx` directly imports `@/components/waitlist/waitlist-form`, which transitively loads the action, which loads `lib/env.ts`. Since this RTL test only exercises render-time DOM invariants (not action submission), the fix was to mock `@/app/actions/join-waitlist` at the top of the test file, preventing `lib/env.ts` from loading in the test environment.

## Requirement Coverage

| Requirement | Test | Status |
|------------|------|--------|
| EMAIL-01 (fire-and-forget send) | Test 11 | Covered |
| EMAIL-02 (from address locked) | Test 11 | Covered |
| EMAIL-03 (subject + headers) | Test 11 | Covered |
| EMAIL-04 (unsubscribe URL in List-Unsubscribe) | Test 11 | Covered |
| EMAIL-05 (postal address CAN-SPAM) | Test 12 | Covered — dedicated test |
| EMAIL-06 (unsubscribeUrl prop wired) | Test 11+12 | Covered |
| EMAIL-08 (send error observability) | Test 15 | Covered |
| STORE-01 (audience routing) | Tests 8,9,10 | Covered |
| STORE-03 (contacts.create single write path) | Test 8 | Covered |
| STORE-04 (consent_version on contact) | Test 8 | Covered |
| SPAM-03 (rate-limit rejection) | Tests 6,7 | Covered |
| SPAM-04 (disposable-domain rejection) | Test 5 | Covered |

## Verification

- `npm run check` exits 0
- `npm run lint` exits 0 (3 inline disable comments for VERCEL_ENV, VERCEL_GIT_COMMIT_SHA, NEXT_PUBLIC_SITE_URL — the ONLY `custom/no-raw-process-env` suppressions in the action file)
- `npm run test:unit` exits 0 — 38 tests across 4 files all green
- `grep -c "PHASE-3-STUB" app/actions/join-waitlist.ts` returns 0 (CD-07 satisfied)
- `grep -c "postalAddress" tests/unit/join-waitlist-action.test.ts` returns 16 (>= 2 per EMAIL-05 requirement)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] waitlist-form.test.tsx env dependency after Phase 4 action changes**
- **Found during:** Task 2 — running full test suite after test migration
- **Issue:** Phase 4 action now imports `lib/env.ts` at module load. `waitlist-form.test.tsx` transitively loads the action via the component import. Since the test doesn't set env vars, `lib/env.ts` throws ZodError on missing vars.
- **Fix:** Added `vi.mock('@/app/actions/join-waitlist', ...)` to `waitlist-form.test.tsx` to prevent transitive env loading. The mock returns a stub `{ status: 'success' }` — appropriate since this test only covers render-time DOM invariants, not action behavior.
- **Files modified:** `tests/unit/waitlist-form.test.tsx`
- **Commit:** 5a98356

## Known Stubs

- `isDuplicateContactError()` in `app/actions/join-waitlist.ts` ships with regex-based detection rather than empirically proven Resend error shape. This is intentional per D-06: the exact duplicate error shape is verified during the Phase 4 day-1 probe (5 minutes). After the probe, the regex condition may need updating. This does NOT prevent the plan's goal — the D-06 fallback means welcome emails are sent on duplicates until the probe confirms the correct signal.

## Deferred Items

- **Playwright e2e suite (`npm run test:e2e`)** is NOT run here — Plan 07 migrates the e2e specs. The `dup@example.com`, `err@example.com`, `slow@example.com` addresses are no longer special-cased; they're now treated as fresh signups. Plan 07 must update Playwright specs accordingly.
- **Plan 07 reminder:** Verify Phase 3 `tests/form/success-state.spec.ts` POST-03 spec behavior against the real action. The spec uses `dup@example.com` as input — with the stub gone, this becomes a fresh signup that fires a real welcome email against the preview audience. Plan 07 must update or isolate this test.
- **Day-1 probe:** Run `resend.contacts.create` with a duplicate email on the live Resend API and record the exact error response shape. Update `isDuplicateContactError()` in `app/actions/join-waitlist.ts` with the real condition.
- **Rate-limit failure mode (T-04-26):** Upstash error → action throws → Next.js 500. No outer try/catch added per CONTEXT decision. Revisit in Plan 07 monitoring if Upstash outages observed.

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `app/actions/join-waitlist.ts` exists | FOUND |
| `tests/unit/join-waitlist-action.test.ts` exists | FOUND |
| `04-05-SUMMARY.md` exists | FOUND |
| Task 1 commit `e22d912` exists | FOUND |
| Task 2 commit `5a98356` exists | FOUND |
| `PHASE-3-STUB` grep count = 0 | 0 |
| `npm run test:unit` — 38 tests, all passing | PASSED |
