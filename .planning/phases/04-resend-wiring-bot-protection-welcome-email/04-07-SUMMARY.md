---
phase: 04-resend-wiring-bot-protection-welcome-email
plan: 07
subsystem: tests
tags: [phase-4, playwright-migration, checkpoints, day-1-probes, mail-tester, postal-address, api-key-scope]
status: in-progress
requires:
  - 04-05 (real action body — stub triggers must be deleted before migration is meaningful)
  - 04-06 (webhook handler — Task 6 registers it in production)
provides:
  - Phase 3 → Phase 4 test migration (3 specs deleted, 1 modified, 3 RTL tests added)
  - 6 manual checkpoint result placeholders (Day-1 probes, postal address, mail-tester,
    inbox tests, webhook + API key scope, CSV round-trip)
affects:
  - tests/form/* (3 specs deleted, 1 modified)
  - tests/unit/waitlist-form.test.tsx (3 RTL tests added)
key-files:
  created: []
  modified:
    - tests/form/success-state.spec.ts
    - tests/unit/waitlist-form.test.tsx
  deleted:
    - tests/form/server-error-toast.spec.ts
    - tests/form/pending-state.spec.ts
    - tests/form/idempotent.spec.ts
decisions:
  - CD-07 per-spec migration: 3 specs to RTL, 1 spec retained with rewritten POST-03
  - sonner mocked at module level in unit tests — assert toast.error spy directly
    rather than mounting <Toaster /> in every render
metrics:
  task-1-completed: 2026-04-28
---

# Phase 4 Plan 07: Phase 3 Spec Migration + Phase 4 Manual Checkpoints Summary

Deletes 3 Phase 3 Playwright specs that depended on stub-action email triggers
(`dup@`, `err@`, `slow@`); migrates the assertions to Vitest RTL with a mocked
Server Action; and gates 6 founder-driven manual checkpoints (day-1 probes,
postal address, mail-tester, inbox tests, webhook + API key scope, CSV round-trip)
that finish phase 4.

## Code Changes (Task 1 — completed)

### tests/form/ — final state

| File | Status | Notes |
|------|--------|-------|
| `tests/form/anchor-scroll.spec.ts` | unchanged | Phase 3, no stub dependency |
| `tests/form/enter-key-submit.spec.ts` | unchanged | Phase 3, no stub dependency |
| `tests/form/validation-error.spec.ts` | unchanged | Phase 3, no stub dependency |
| `tests/form/success-state.spec.ts` | **modified** | POST-03 test rewritten to assert UI invariant on a fresh signup; POST-01 + POST-02 tests unchanged |
| `tests/form/server-error-toast.spec.ts` | **deleted** | Migrated to RTL — see `tests/unit/waitlist-form.test.tsx` |
| `tests/form/pending-state.spec.ts` | **deleted** | Migrated to RTL — see `tests/unit/waitlist-form.test.tsx` |
| `tests/form/idempotent.spec.ts` | **deleted** | Migrated to RTL — see `tests/unit/waitlist-form.test.tsx` |

### tests/unit/waitlist-form.test.tsx — extension

3 new RTL tests appended in a second `describe('<WaitlistForm> state transitions (Phase 4 RTL migrations)')` block:

1. **`surfaces sonner toast with D-12 verbatim copy on server error`** —
   replaces `tests/form/server-error-toast.spec.ts`. Mocks the action with
   `{ status: 'error', message: 'Something went wrong. Try again in a moment.' }`,
   asserts `toast.error` was called with the verbatim copy, and asserts the form
   stays mounted (no `[role=status]` block).

2. **`shows pending UX (Joining..., spinner, disabled input/button) during the action round-trip`** —
   replaces `tests/form/pending-state.spec.ts`. Uses a controlled-delay Promise;
   asserts button disabled, "Joining..." label, `svg.animate-spin` present, input
   disabled (D-13). Resolving the promise mounts the success block (POST-01).

3. **`disabled button during pending makes rapid double-click a no-op — POST-04`** —
   replaces `tests/form/idempotent.spec.ts`. After the first click puts the form
   into pending, `fireEvent.click(submit)` bypasses user-event's disabled gating
   to prove the form's `onSubmit` is not re-invoked even when a click event
   fires. `toHaveBeenCalledTimes(1)` is the load-bearing assertion.

`sonner` is mocked module-level in the test file so the same `toast` singleton
is observed by both the component file and the test assertions — no
`<Toaster />` mount required in render.

### Verification

| Command | Result |
|---------|--------|
| `npm run test:unit` | 6 files / 52 tests passing |
| `npm run check` (tsc --noEmit) | clean |
| `npm run lint` (eslint --max-warnings=0) | clean |
| `npm run test:e2e` | deferred — preview Resend audience required for live success-state spec |

### Commits

| Commit | Message |
|--------|---------|
| `14d99d5` | test(04-07): remove Phase 3 stub-dependent Playwright specs |
| `d7a1a9e` | test(04-07): migrate success-state spec to verify POST-03 on fresh signup |
| `548ab93` | test(04-07): extend waitlist-form RTL with 3 migrated state-transition tests |

### Acceptance criteria audit

- [x] `tests/form/server-error-toast.spec.ts` no longer exists
- [x] `tests/form/pending-state.spec.ts` no longer exists
- [x] `tests/form/idempotent.spec.ts` no longer exists
- [x] `tests/form/success-state.spec.ts` retained; `grep -c "dup@example.com"` returns 0; `grep -c "POST-03"` returns 12
- [x] Migrated assertions in `tests/unit/waitlist-form.test.tsx`:
  - `grep -c "Something went wrong. Try again in a moment"` → 2
  - `grep -cE "Joining|animate-spin|toBeDisabled"` → 11
  - `grep -cE "POST-04|toHaveBeenCalledTimes\(1\)"` → 4
- [x] `npm run test:unit` exits 0
- [x] `npm run check` exits 0
- [x] `npm run lint` exits 0

## Manual Checkpoint Results (Tasks 2–7 — pending)

> The following sections are placeholders. Continuation agents (or the orchestrator)
> fill them in as each manual checkpoint is resolved by the founder.

### Task 2 — Day-1 probes (Resend duplicate response shape + email.bounced subType values)

**Status:** COMPLETE (2026-04-28).

**Probe 1 — Resend duplicate response shape (5 min):**

**Empirical finding (overturned the documented assumption):** `resend.contacts.create({ audienceId, email, ... })` is **idempotent on email**. Submitting the same email twice returns success silently with the existing contact data — `error` is `null`, `data` is populated. **NO error is thrown on duplicate.**

Evidence: two submissions of `probe-third-04-28@example.com` against the preview audience both logged:
```
[analytics] waitlist_signup { duplicate: false }
```
No `contacts_create_failed` console line appeared on the second submission. Resend Dashboard → preview audience showed exactly **1 row** for that email after both submissions.

**Implication:** the prior `isDuplicateContactError()` helper was dead code. Every duplicate submission was firing a redundant welcome email.

**Fix applied (commit `3c42a28`):** replaced the error-shape detector with a **get-then-create** pattern:

```typescript
const { data: existingContact, error: getError } = await resend.contacts.get({
  audienceId,
  email,
})
if (getError && !isContactNotFoundError(getError)) { /* fatal */ }
const isDuplicate = !!existingContact && !getError
if (!isDuplicate) {
  await resend.contacts.create({ audienceId, email, unsubscribed: false, properties: { consent_version } })
}
```

A second probe captured the empirical 404 shape from `contacts.get`:
```
{ name: 'not_found', statusCode: 404, message: 'Contact not found' }
```

New helper `isContactNotFoundError` matches that shape (name-first with statusCode fallback). Tests updated in commit `3bb6865` — `npm run test:unit` exits 0 with 53 tests passing (one new coverage test added for the new branch).

**Probe 2 — email.bounced subType values (15 min):**

Sources read:
- Webhook event docs: https://resend.com/docs/webhooks/emails/bounced
- Bounce Types & Subtypes (Dashboard): https://resend.com/docs/dashboard/emails/email-bounces

**Findings:**

The webhook docs schema for `email.bounced.data.bounce` describes:
- `type` (string) — examples: `Permanent`, `Temporary`
- `subType` (string) — examples: `Suppressed`, `MessageRejected`
- `message` (string) — Detailed bounce message from receiving server

The docs explicitly say "e.g.," for both `type` and `subType` — the examples are not exhaustive enumerations.

The Dashboard "Email Bounces" page enumerates a richer taxonomy:
- `Permanent` (hard bounce):
  - `General` — generic hard bounce
  - `NoEmail` — recipient address not extractable
- `Transient` (soft bounce):  ← **note: docs use `Transient` here, not `Temporary`**
  - `General` — generic soft bounce
  - `MailboxFull`
  - `MessageTooLarge`
  - `ContentRejected`
  - `AttachmentRejected`
- `Undetermined` — bounce message lacked enough information

This Dashboard page mixes display-layer and payload-layer terminology and is **not** the contractual webhook payload reference. The webhook example uses `type: "Permanent"` and `subType: "Suppressed"` — neither of which appears in the Dashboard taxonomy verbatim. Net: the contractual values for the webhook payload `bounce.type` are documented as `Permanent` / `Temporary`; the rest is illustrative.

**Decision: handler NOT extended.** Current logic — treat `bounce.type === 'Permanent'` as hard (mark unsubscribed), anything else as soft (log only) — matches the documented webhook contract. The richer Dashboard taxonomy is illustrative, not contractual. If real-world traffic surfaces `Transient`/`Suppressed`/etc. handling gaps post-launch, extend the handler then with empirical evidence.

`npm run test:unit -- webhook-handler` continues to exit 0 with the existing 6 tests passing.

### Bonus: Bug 2 — welcome email render failure

While testing Probe 1, a second bug surfaced: `welcome_email_send_failed` was firing on every signup with:

```
Error: Failed to render React component. Make sure to install
`@react-email/render` or `@react-email/components`.
```

Root cause: Resend's SDK does `await import("@react-email/render")` directly (`node_modules/resend/dist/index.cjs`) — it does NOT fall back to `@react-email/components` despite the misleading error message. The installed `@react-email/components@^1.0.12` does export a `render` function but Resend never reaches for it.

**Fix applied (commit `3bba2cf`):** `npm install @react-email/render`. No code changes required; the SDK picks it up at runtime.

### Task 3 — Postal address sourced + wired to RESEND_FROM_POSTAL_ADDRESS (D-10)

**Status:** Pending founder action.

- Provider chosen (NOT the address itself): _TBD_ (registered agent / USPS PO Box / CMRA / existing business address)
- Date sourced: _TBD_
- `.env.local` updated with real value (replacing `YOUR-POSTAL-ADDRESS-HERE`): _TBD_
- Vercel Production env var `RESEND_FROM_POSTAL_ADDRESS` set: _TBD_
- Vercel Preview env var `RESEND_FROM_POSTAL_ADDRESS` set (optional): _TBD_
- Manual test send — real address renders in welcome email footer: _TBD_

### Task 4 — mail-tester.com 10/10 verification (CD-06)

**Status:** Pending founder action.

- Score achieved: _TBD_ (target: 10/10)
- Date: _TBD_
- DNS issues found and fixed:
  - SPF: _TBD_
  - DKIM (resend, resend2, resend3): _TBD_
  - DMARC: _TBD_
  - Return-Path: _TBD_
- Screenshot reference (if stored): _TBD_

### Task 5 — Inbox tests: Gmail + Outlook + iCloud (EMAIL-01..06 + D-02)

**Status:** Pending founder action.

| Inbox | Arrival time | From correct? | Subject correct? | List-Unsubscribe header | List-Unsubscribe-Post header | DKIM covers both headers | Unsubscribe round-trip |
|-------|--------------|---------------|------------------|------------------------|-----------------------------|--------------------------|------------------------|
| Gmail | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ |
| Outlook | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ |
| iCloud | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ |

Client-specific rendering quirks: _TBD_

### Task 6 — Resend webhook registration + STORE-02 API key scope verification

**Status:** Pending founder action.

**Part A — Webhook registration + bounce probe:**
- Registered webhook URL: _TBD_ (production or preview Vercel URL)
- `RESEND_WEBHOOK_SECRET` matches between Resend Dashboard and Vercel env vars: _TBD_
- `bounced@resend.dev` test event reached the handler: _TBD_
- `email_hard_bounced` log line observed: _TBD_
- Contact marked `unsubscribed: true` post-bounce in Resend Audience: _TBD_
- (Optional) `complained@resend.dev` test event verified: _TBD_

**Part B — STORE-02 API key scope verification:**
- Confirmed scope of `RESEND_API_KEY` in production: _TBD_ ("Sending access" / "Full access")
- If the key was rotated (Full → Sending):
  - Old key prefix (last 4 chars only): _TBD_
  - New key prefix (last 4 chars only): _TBD_
  - Date rotated: _TBD_
  - Date old key revoked: _TBD_
- Screenshot reference (if stored, redacted): _TBD_

### Task 7 — CSV export round-trip (STORE-05 / SC #5 / RESEARCH A6)

**Status:** Pending founder action.

- Exact CSV column name(s) for `consent_version`: _TBD_ (separate column / flattened JSON / absent — use API workaround)
- Round-trip preserved value verbatim: _TBD_
- Import preserved format (e.g., `'pre-phase-5'` survived as string): _TBD_
- Round-trip-test audience deleted from Resend after verification: _TBD_
- Local CSV file deleted after verification: _TBD_
- API-export workaround documented (if CSV failed): _TBD_

## Phase 4 Gate Status

- [x] Task 1 (test migration) — complete
- [ ] Task 2 (day-1 probes) — pending
- [ ] Task 3 (postal address — D-10 production-deploy HARD blocker) — pending
- [ ] Task 4 (mail-tester 10/10 — CD-06) — pending
- [ ] Task 5 (inbox tests — D-02 / EMAIL-03) — pending
- [ ] Task 6 (webhook registration + STORE-02 API key scope) — pending
- [ ] Task 7 (CSV round-trip — STORE-05 / SC #5) — pending

**Production-deploy blocker count remaining (target: 0):** 6 manual checkpoints.

## Deviations from Plan

None during Task 1. Plan executed exactly as written for the test migration scope.

## Self-Check: PENDING

Self-check will be re-run by the final continuation agent after Tasks 2–7 are recorded.
Task 1 self-check (executed by this agent):

- [x] `tests/form/server-error-toast.spec.ts` confirmed deleted (`ls` returns "No such file")
- [x] `tests/form/pending-state.spec.ts` confirmed deleted
- [x] `tests/form/idempotent.spec.ts` confirmed deleted
- [x] `tests/form/success-state.spec.ts` confirmed exists with 0 occurrences of `dup@example.com`
- [x] `tests/unit/waitlist-form.test.tsx` extended with 3 new RTL tests (state-transition describe block)
- [x] Commits `14d99d5`, `d7a1a9e`, `548ab93` confirmed in `git log`
- [x] `npm run test:unit && npm run check && npm run lint` all exit 0
