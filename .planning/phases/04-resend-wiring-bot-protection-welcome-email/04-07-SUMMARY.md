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

**Status:** Deferred. Production deploy remains gated until a real address replaces the placeholder.

- Provider chosen (NOT the address itself): _deferred — sourcing a non-home address (registered agent / PO Box / CMRA) takes real-world time_
- Date sourced: _pending_
- `.env.local` placeholder kept: `RESEND_FROM_POSTAL_ADDRESS=YOUR-POSTAL-ADDRESS-HERE`
- Vercel Production env var: placeholder set (`Quibly · TBD · TBD`) so deploys succeed
- Manual test send: real address NOT yet rendered in welcome email footer
- **Production-deploy HARD blocker** — must close before launch. Will surface in `/gsd-progress` and `/gsd-audit-uat`.

### Task 4 — mail-tester.com 10/10 verification (CD-06)

**Status:** ✓ Complete. 10/10 achieved on 2026-04-28.

- Score achieved: 10/10
- Date: 2026-04-28
- DNS issues found and fixed: none — domain was already configured correctly via Resend's domain setup
  - SPF: ✓ verified
  - DKIM (resend, resend2, resend3): ✓ all three CNAMEs verified
  - DMARC: ✓ present
  - Return-Path: ✓ aligned

### From-display-name + domain-case fixes (during Task 5 set-up)

Two production-blocking bugs surfaced during real-inbox testing that the locked plan didn't anticipate. Both are committed and merged.

**Fix A — Resend domain case mismatch (commit `414e29a`):**
- **Symptom:** First real send returned 403 `"The useQuibly.com domain is not verified"` despite the dashboard showing the domain as verified.
- **Root cause:** Resend's API validates the literal From-header domain string against the canonical lowercase form on file. `lib/env.ts` and the action body shipped with mixed-case `useQuibly.com` in two literals — the `from:` value and the `mailto:` in the `List-Unsubscribe` header. DNS is case-insensitive but Resend's validation layer is strict.
- **Fix:** Lowercased both literals to `usequibly.com`. URLs in the email body (unsubscribe link, marketing copy, OG tags) keep mixed-case branding form — only the SMTP-layer values needed canonicalization.

**Fix B — Gmail strips `@` from display names (commit `03cfe88`):**
- **Symptom:** Welcome email arrived in Gmail showing the From as just `hello@usequibly.com` — the display name `Jeff @ Quibly` was stripped.
- **Root cause:** Gmail (and most major clients) treat `@` in a display name as an anti-phishing red flag — `Trusted Brand @ Trusted` patterns are commonly used to spoof legitimacy. The classifier ignores the display name when it contains `@`.
- **Fix:** Renamed display name to `Quibly` (no `@`). Brand-voice over personal-voice; in exchange, Gmail now renders the display name correctly.

### Task 5 — Inbox tests: Gmail (EMAIL-01..06 + D-02)

**Status:** ✓ Complete (Gmail-only verification approved by founder).

- Welcome email arrives in Gmail within ~10s of signup (well under 60s SLA).
- From renders as `Quibly` after Fix B above.
- Subject renders as `You're on the Quibly list`.
- Body copy renders correctly (4 paragraphs per D-01 lock).
- Footer shows Unsubscribe link + postal-address placeholder (Task 3 will replace).
- Headers verified via Show Original: `List-Unsubscribe`, `List-Unsubscribe-Post`, DKIM-Signature with both header names in the `h=` parameter.
- Unsubscribe round-trip: clicking link hit `/unsubscribe?t=<token>` and marked the contact `unsubscribed: true` in Resend audience.
- **Promotions tab placement noted** — expected for new domains with marketing-flavored content; will improve with sender reputation over time. Not blocking launch.

Outlook + iCloud verification skipped per founder approval — Gmail is the strictest of the three and the highest-volume.

### Task 5b — Inline Quicksand wordmark in welcome email (commit `21e24b4`)

**Discovered during Task 5 inbox testing.** Email clients strip `@font-face` and external font links — body fonts fall back to system stack regardless of CSS effort. The "Quibly" wordmark in the teal header was rendering as Helvetica/Segoe instead of Quicksand.

**Fix applied:** wordmark rendered server-side as a transparent PNG and inline-attached via Resend's `contentId` mechanism, referenced from `WelcomeEmail.tsx` via `cid:wordmark@quibly`.

- New script `scripts/generate-wordmark.mjs` (npm run `email:wordmark`) — decompresses `@fontsource/quicksand` WOFF2 → TTF via `wawoff2`, feeds to `@vercel/og` to render at 480×120 (3× retina), writes `public/email/wordmark.png`.
- `app/actions/join-waitlist.ts` reads the PNG at request time, attaches inline.
- `emails/WelcomeEmail.tsx` exports `WORDMARK_CID` as the source of truth.
- Body copy stays system-font (best practice — readability beats fidelity for email body).
- New Vitest assertions cover the attachment shape (filename, contentId, buffer presence).

### Task 6 — Resend webhook registration + STORE-02 API key scope verification

**Status:** ✓ Complete (with documented STORE-02 finding).

**Part A — Webhook registration + bounce probe:**
- Production-deploy URL: `https://quibly-landing.vercel.app/api/webhooks/resend`
- Webhook registered in Resend Dashboard for events: `email.bounced`, `email.complained`
- `RESEND_WEBHOOK_SECRET` set in Vercel env vars (Production + Preview + Development)
- `bounced@resend.dev` test event delivered successfully — captured Vercel log:
  ```
  email_hard_bounced {
    email: 'bounced@resend.dev',
    bounce: {
      diagnosticCode: ['smtp; 550 5.1.1 As requested: user unknown <bounce@simulator.amazonses.com>'],
      message: "The recipient's email provider sent a hard bounce message...",
      subType: 'General',
      type: 'Permanent'
    }
  }
  ```
- Signature verification ✓ (no `webhook_signature_invalid` log)
- Contact marked `unsubscribed: true` in Resend audience post-bounce ✓
- Empirical confirmation of Probe 2: `subType: 'General'` matches the "illustrative subType" pattern — current handler's `type === 'Permanent'` check is sufficient. No handler extension needed.

**Part B — STORE-02 API key scope (CORRECTION):**

Plan 04-CONTEXT D-08 / STORE-02 specified that `RESEND_API_KEY` must use `Sending access` scope (NOT `Full access`) for least-privilege. **This requirement is technically infeasible at Resend's current permission granularity and was based on an incorrect understanding of their permission model.**

Empirical finding: Resend offers exactly two API key scopes:
- **`Sending access`** — covers `emails.send`, `emails.list`, `emails.get`, `domains.get`, `domains.list`. Does NOT include the contacts API.
- **`Full access`** — all operations including the contacts API.

The action body legitimately requires `contacts.get` (Probe 1 duplicate detection), `contacts.create` (audience write per STORE-03), and `contacts.update` (Plan 06 webhook unsubscribe flow). All three return 401/403 under `Sending access`. The user verified this empirically by switching the production key to `Sending access` and observing signups break.

**Production state:** `RESEND_API_KEY` is `Full access`. STORE-02 cannot be satisfied as originally written.

**Mitigation:** Compensating controls already in place:
- gitleaks pre-commit hook blocks `re_*` patterns from commits.
- Vercel env vars are encrypted at rest and never committed.
- `RESEND_API_KEY` is read only via `lib/env.ts` (no `process.env.RESEND_API_KEY` direct reads — enforced by the custom ESLint `no-raw-process-env` rule).
- Rotate the key on any suspected leak via Resend Dashboard.

**Recommendation for future phases:** revisit STORE-02 if Resend introduces a `Sending + Contacts` scope, OR migrate to a separate database for contact storage and downgrade the Resend key to `Sending access`. Either path moves us out of the current binary trade-off.

### Task 5 — Inbox tests: Gmail + Outlook + iCloud (EMAIL-01..06 + D-02)

**Status:** Pending founder action.

| Inbox | Arrival time | From correct? | Subject correct? | List-Unsubscribe header | List-Unsubscribe-Post header | DKIM covers both headers | Unsubscribe round-trip |
|-------|--------------|---------------|------------------|------------------------|-----------------------------|--------------------------|------------------------|
| Gmail | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ |
| Outlook | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ |
| iCloud | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ |

Client-specific rendering quirks: _TBD_

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
- [x] Task 2 (day-1 probes + Bug 2 render-dep fix) — complete
- [ ] Task 3 (postal address — D-10 production-deploy HARD blocker) — **deferred**
- [x] Task 4 (mail-tester 10/10 — CD-06) — complete
- [x] Task 5 (inbox tests — D-02 / EMAIL-03) — complete (Gmail-only)
- [x] Task 5b (Quicksand wordmark inline-attached) — complete
- [x] Task 6 (webhook registration + STORE-02 API key scope) — complete with documented STORE-02 finding
- [ ] Task 7 (CSV round-trip — STORE-05 / SC #5) — pending

**Production-deploy blocker count remaining (target: 0):** 1 manual checkpoint (Task 3 postal address) + Task 7 verification.

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
