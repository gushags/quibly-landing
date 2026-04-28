---
phase: 04-resend-wiring-bot-protection-welcome-email
plan: 02
subsystem: api
tags: [analytics, hmac, crypto, server-only, unsubscribe, vitest]

# Dependency graph
requires:
  - phase: 01-scaffold-brand-token-parity
    provides: lib/env.ts with RESEND_WEBHOOK_SECRET schema

provides:
  - lib/analytics.ts — typed track() shim with 5-event TrackEvent union (server-only)
  - lib/unsubscribe-token.ts — HMAC-SHA256 email-encoded token generator + timing-safe verifier (server-only)
  - tests/unit/unsubscribe-token.test.ts — 8-test vitest coverage for token round-trip + tamper detection
  - __mocks__/server-only.js — no-op vitest mock for server-only package
  - vitest.config.ts alias — server-only resolve alias so tests can import server-only-guarded modules

affects:
  - 04-03 (resend singleton + rate-limit — calls track() from analytics.ts)
  - 04-04 (action body swap — imports both track() and generateToken())
  - 04-05 (welcome email — imports generateToken() for unsubscribe URL)
  - 04-06 (webhook handler — calls track('contact_bounced'), track('contact_complained'))
  - 04-07 (unsubscribe route — imports verifyToken())

# Tech tracking
tech-stack:
  added:
    - crypto.subtle (Node 18+ built-in) — HMAC-SHA256 signing and verification
    - __mocks__/server-only.js — vitest no-op mock
  patterns:
    - server-only guard on all server-side utility modules (import 'server-only' as line 1)
    - CryptoKey caching (cachedKey module-level var) to avoid re-import per request
    - Timing-safe HMAC compare via XOR loop (diff |= a[i] ^ b[i]) over full byte length
    - env var injection before dynamic import in beforeAll() for vitest with module-load-time Zod validation
    - vitest resolve.alias for server-only to suppress throw in test context

key-files:
  created:
    - lib/analytics.ts
    - lib/unsubscribe-token.ts
    - tests/unit/unsubscribe-token.test.ts
    - __mocks__/server-only.js
  modified:
    - vitest.config.ts (added server-only alias)

key-decisions:
  - "cachedKey retained: CryptoKey cached at module level to avoid re-import on every token generation call — safe because secret never changes within process lifetime"
  - "Email encoded in token (not contactId): per PATTERNS.md CD-02 simpler alternative — avoids Resend API lookup in unsubscribe route (Plan 07)"
  - "RESEND_WEBHOOK_SECRET reused as HMAC signing key (no separate UNSUBSCRIBE_SECRET): per CD-02 keeps env surface small"
  - "server-only vitest mock via resolve.alias in vitest.config.ts: cleanest approach for vitest (vs. __mocks__/jest-style or installing server-only as dev dep)"
  - "TrackEvent union has exactly 5 events matching Plans 03-06 callers: waitlist_signup, signup_rejected, welcome_email_send_error, contact_bounced, contact_complained"

patterns-established:
  - "server-only modules: import 'server-only' as line 1, never import from client components"
  - "vitest test env setup: set all process.env vars before dynamic import('@/lib/...') in beforeAll()"
  - "timing-safe compare: constant-time XOR loop, never short-circuit on byte mismatch"

requirements-completed: [EMAIL-04, EMAIL-08, ANLY-03, ANLY-04]

# Metrics
duration: 3min
completed: 2026-04-28
---

# Phase 4 Plan 02: Analytics Shim + HMAC Unsubscribe Token Summary

**HMAC-SHA256 email-encoded unsubscribe token (timing-safe XOR verify) + typed server-only analytics shim with 5-event TrackEvent union, 8 vitest tests all green**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-28T14:40:50Z
- **Completed:** 2026-04-28T14:43:50Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Shipped `lib/analytics.ts` with typed `TrackEvent` union and async `track()` shim (Phase 5 swaps the body to `@vercel/analytics/server`)
- Shipped `lib/unsubscribe-token.ts` with `generateToken(email)` / `verifyToken(token)` using HMAC-SHA256 over `RESEND_WEBHOOK_SECRET`, CryptoKey cached, timing-safe comparison
- Added 8 vitest tests covering round-trip, HMAC tamper, email swap tamper, no-separator, empty-string, different-emails, deterministic, and special-char round-trip
- Added `server-only` vitest mock alias so all future tests can import server-only-guarded modules without throwing

## Task Commits

1. **Task 1: Ship lib/analytics.ts typed track() shim** - `82c1d97` (feat)
2. **Task 2: Ship lib/unsubscribe-token.ts HMAC-signed email token** - `8b06237` (feat)
3. **Task 3: Vitest unit coverage for unsubscribe-token** - `ceeb82d` (test)

## Files Created/Modified

- `lib/analytics.ts` — server-only typed `track()` shim; Phase 5 swaps body only
- `lib/unsubscribe-token.ts` — HMAC-SHA256 token generator + timing-safe verifier; encodes email (not contactId)
- `tests/unit/unsubscribe-token.test.ts` — 8 vitest tests for token round-trip and tamper detection
- `__mocks__/server-only.js` — no-op module for vitest to satisfy `import 'server-only'`
- `vitest.config.ts` — added `server-only` resolve alias pointing to the no-op mock

## Decisions Made

**cachedKey retained:** The `CryptoKey` is cached at module level in a `cachedKey` variable. This avoids re-importing on every `generateToken()` call. Safe because the key (derived from `RESEND_WEBHOOK_SECRET`) never changes within a process lifetime.

**Email encoded (not contactId):** Per PATTERNS.md "Simpler alternative" note, the token encodes the email directly. This means the unsubscribe route (Plan 07) can call `resend.contacts.update({ email, unsubscribed: true })` without a Resend API lookup to resolve contactId → email.

**RESEND_WEBHOOK_SECRET reused:** Per CD-02, the same secret used for webhook signature verification is reused as the HMAC signing key for unsubscribe tokens. Avoids adding a new `UNSUBSCRIBE_SECRET` env var.

**Token shape confirmed:** `dXNlckBleGFtcGxlLmNvbQ.AbCdEfGh...` — base64url(email).base64url(hmac_sha256). Tested in 8 unit tests.

**TrackEvent union literals confirmed (matches Plan 03/05/06 callers):**
- `'waitlist_signup'` — Plan 05 (action body)
- `'signup_rejected'` — Plan 05 (rate-limit + disposable rejections)
- `'welcome_email_send_error'` — Plan 05 (fire-and-forget catch)
- `'contact_bounced'` — Plan 06 (webhook handler)
- `'contact_complained'` — Plan 06 (webhook handler)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added server-only vitest mock**
- **Found during:** Task 3 (test authoring)
- **Issue:** `import 'server-only'` throws `"This module cannot be imported from a Client Component module"` in vitest's happy-dom environment. The `server-only` package is not in the project's `package.json` devDependencies, and no mock existed.
- **Fix:** Created `__mocks__/server-only.js` (empty no-op) and added `resolve.alias` in `vitest.config.ts` mapping `'server-only'` to that file. This is the correct vitest approach (vs. jest's `__mocks__` convention or installing the package as a devDep).
- **Files modified:** `vitest.config.ts`, `__mocks__/server-only.js`
- **Verification:** All 23 unit tests pass; `npm run check` and `npm run lint` both exit 0
- **Committed in:** `82c1d97` (Task 1 commit — included with analytics.ts since analytics.ts was first to require it)

---

**Total deviations:** 1 auto-fixed (Rule 3 - Blocking)
**Impact on plan:** Necessary infrastructure fix. The mock is the correct vitest approach and is zero-cost at runtime (no bundle impact). All Phase 4+ plans that ship server-only modules will benefit from this mock without further changes.

## Issues Encountered

None beyond the blocking server-only mock issue documented above.

## User Setup Required

None — no external service configuration required. All utilities are pure server-side code with no new env vars beyond what lib/env.ts already declares.

## Next Phase Readiness

- `lib/analytics.ts` ready for Plan 05 (action body swap) — `track()` callable, TrackEvent union enforces type safety
- `lib/unsubscribe-token.ts` ready for Plans 05 + 07 — `generateToken()` for welcome email footer, `verifyToken()` for unsubscribe route
- vitest server-only mock ready for Plan 03 (resend singleton), Plan 04 (rate-limit), Plan 05 (action body) — all ship server-only modules

## Self-Check: PASSED

All created files verified present:
- FOUND: `lib/analytics.ts`
- FOUND: `lib/unsubscribe-token.ts`
- FOUND: `tests/unit/unsubscribe-token.test.ts`
- FOUND: `__mocks__/server-only.js`

All task commits verified in git log:
- FOUND: `82c1d97` feat(04-02): ship lib/analytics.ts typed track() shim
- FOUND: `8b06237` feat(04-02): ship lib/unsubscribe-token.ts HMAC-signed email token
- FOUND: `ceeb82d` test(04-02): add unsubscribe-token unit coverage (8 tests)

---
*Phase: 04-resend-wiring-bot-protection-welcome-email*
*Completed: 2026-04-28*
