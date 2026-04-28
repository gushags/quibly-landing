---
phase: 04-resend-wiring-bot-protection-welcome-email
plan: "06"
subsystem: email-infrastructure
tags: [phase-4, route-handlers, webhook, unsubscribe, svix, rfc-8058, vitest]
dependency_graph:
  requires: [04-01, 04-02, 04-03]
  provides: [EMAIL-09, EMAIL-04, D-02, D-08]
  affects: [04-07]
tech_stack:
  added: []
  patterns:
    - "Next.js App Router route handler exporting POST with runtime = 'nodejs'"
    - "resend.webhooks.verify() with req.text() raw body (Pitfall 2 satisfied)"
    - "HMAC token verification via Plan 02 verifyToken before contacts.update"
    - "Vitest dynamic import in beforeAll for route handler testing"
key_files:
  created:
    - app/api/webhooks/resend/route.ts
    - app/unsubscribe/route.ts
    - tests/unit/webhook-handler.test.ts
    - tests/unit/unsubscribe-route.test.ts
  modified: []
decisions:
  - "Tamper test uses middle HMAC chars (not last char) — base64url padding bits are discarded during decode, making last-char tamper unreliable"
metrics:
  duration: "~12 minutes"
  completed_date: "2026-04-28"
  tasks_completed: 3
  files_created: 4
  files_modified: 0
---

# Phase 4 Plan 06: Webhook Handler + Unsubscribe Route Summary

Shipped the two Route Handlers completing Phase 4's external surface area: the Resend webhook bounce/complaint handler (EMAIL-09) and the RFC 8058 one-click unsubscribe POST handler (EMAIL-04 / D-02), plus full Vitest coverage for both.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Resend webhook route handler (EMAIL-09) | 69480b5 | app/api/webhooks/resend/route.ts |
| 2 | RFC 8058 unsubscribe route handler (EMAIL-04 / D-02) | e51a6a9 | app/unsubscribe/route.ts |
| 3 | Vitest coverage for both routes | bad43f5 | tests/unit/webhook-handler.test.ts, tests/unit/unsubscribe-route.test.ts |

## Test Counts

- `tests/unit/webhook-handler.test.ts`: **6 tests** — all passing
  - 400 on missing svix headers
  - 401 on invalid signature
  - 200 + contacts.update + track('contact_bounced', { kind: 'hard' }) on email.bounced Permanent
  - 200 + no contacts.update + track('contact_bounced', { kind: 'soft' }) on email.bounced Temporary
  - 200 + contacts.update + track('contact_complained') on email.complained
  - 200 + no contacts.update on unknown event type

- `tests/unit/unsubscribe-route.test.ts`: **5 tests** — all passing
  - 400 on missing `t` query param
  - 400 on empty `t` query param
  - 401 on tampered token
  - 401 on garbage token
  - 200 + contacts.update({ email, unsubscribed: true }) on valid token

- **Full suite**: 6 test files, 42 tests — all green

## Key Technical Confirmations

- **Both routes export `runtime = 'nodejs'`**: required for svix HMAC (webhook) and Resend SDK (unsubscribe).
- **Webhook handler uses `req.text()` (not `req.json()`)**: Pitfall 2 satisfied — raw bytes preserved for svix HMAC verification; confirmed by `grep` check in acceptance criteria.
- **Signature verified BEFORE any side effect**: 400/401 returned immediately on missing/invalid headers; no `contacts.update` called in those paths (verified by tests 1-2 in webhook suite).
- **D-08 dispatch correct**: Permanent → unsubscribe; Temporary → log only; complained → unsubscribe; unknown → no-op (forward-compatible).
- **RFC 8058 token flow**: unsubscribe route uses Plan 02's `verifyToken` (timing-safe HMAC compare); rejects tampered and garbage tokens with 401 before any Resend call.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Tamper test approach unreliable for base64url HMAC**
- **Found during:** Task 3 (first test run)
- **Issue:** The plan's test template used `valid.slice(0, -1) + (valid.slice(-1) === 'A' ? 'B' : 'A')` to tamper the token. HMAC-SHA256 = 32 bytes = 43 base64url chars; the 43rd character encodes only 2 data bits (4 padding bits). Changing `A`↔`B` for the last char flips only padding bits that are discarded during base64url → bytes decoding, so `verifyToken` still computed the same HMAC and returned the email — the test saw 200 instead of 401.
- **Fix:** Changed tamper to `${head}.${hmac.slice(0, -3)}${hmac.slice(-3) === 'AAA' ? 'BBB' : 'AAA'}` — modifies 3 middle HMAC chars (not padding bits), reliably invalidating the signature. This matches the approach in the existing `tests/unit/unsubscribe-token.test.ts` (Plan 02) which splits at `.` before tampering.
- **Files modified:** tests/unit/unsubscribe-route.test.ts
- **Commit:** bad43f5

## Open Items for Plan 07

- Register production webhook URL `https://useQuibly.com/api/webhooks/resend` in Resend Dashboard (manual checkpoint, Plan 07).
- Send test bounce via `bounced@resend.dev` to exercise the webhook in production (Plan 07).
- Day-1 probe for exact `email.bounced` subType values remains unexercised here (RESEARCH §Open Questions #2). The handler treats `bounce.type === 'Permanent'` as the hard-bounce signal per D-08; probe happens in Plan 07.
- `isDuplicateContactError()` stub in `app/actions/join-waitlist.ts` (Plan 05) remains `return false` pending the day-1 Resend probe.

## Threat Surface Scan

No new security-relevant surface beyond what the plan's threat model covers:
- T-04-31: spoofing via webhook impersonation — mitigated (svix verify before any side effect)
- T-04-33: forged unsubscribe URL — mitigated (HMAC token, timing-safe compare)
- T-04-35: token logging — mitigated (only `tokenPrefix: token.slice(0, 12)` logged on invalid attempt)
- T-04-38: Edge vs Node mismatch — mitigated (`runtime = 'nodejs'` on both routes)
- T-04-39: unknown Resend event types — mitigated (no-op for unrecognized types, test 6 confirms)

## Self-Check: PASSED

- app/api/webhooks/resend/route.ts — FOUND
- app/unsubscribe/route.ts — FOUND
- tests/unit/webhook-handler.test.ts — FOUND
- tests/unit/unsubscribe-route.test.ts — FOUND
- commit 69480b5 — FOUND (webhook route)
- commit e51a6a9 — FOUND (unsubscribe route)
- commit bad43f5 — FOUND (test files)
