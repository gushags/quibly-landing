---
phase: 04-resend-wiring-bot-protection-welcome-email
reviewed: 2026-04-28T00:00:00Z
depth: standard
files_reviewed: 19
files_reviewed_list:
  - __mocks__/server-only.js
  - .env.example
  - app/actions/join-waitlist.ts
  - app/api/webhooks/resend/route.ts
  - app/unsubscribe/route.ts
  - emails/WelcomeEmail.tsx
  - lib/analytics.ts
  - lib/disposable-domains.ts
  - lib/env.ts
  - lib/rate-limit.ts
  - lib/resend.ts
  - lib/unsubscribe-token.ts
  - package.json
  - tests/form/success-state.spec.ts
  - tests/unit/disposable-domains.test.ts
  - tests/unit/join-waitlist-action.test.ts
  - tests/unit/unsubscribe-route.test.ts
  - tests/unit/unsubscribe-token.test.ts
  - tests/unit/waitlist-form.test.tsx
  - tests/unit/webhook-handler.test.ts
findings:
  critical: 4
  warning: 7
  info: 4
  total: 15
status: issues_found
---

# Phase 4: Code Review Report

**Reviewed:** 2026-04-28
**Depth:** standard
**Files Reviewed:** 19 (one fewer than configured count because `package.json` shares the wrapper directory with `__mocks__/server-only.js`)
**Status:** issues_found

## Summary

Phase 4 wires the live Resend pipeline (audience write, welcome email, webhook bounce/complaint handling, unsubscribe) plus bot protection (honeypot, time-trap, rate-limit, disposable domains) and the HMAC unsubscribe token. The defense ordering, env validation, and timing-safe HMAC compare are sound. Tests are comprehensive at the unit layer.

The most serious concerns are integration-coupled and would not be caught by the existing mock-based tests:

1. **`resend.contacts.update` is invoked WITHOUT `audienceId`** in both the unsubscribe route and the webhook handler. The Resend SDK's update path falls back to `/contacts/:email` (a global endpoint) when `audienceId` is omitted — this is unlikely to mutate the audience-scoped contact and almost certainly returns an error or no-op against the real API. Tests pass because the resend SDK is mocked. This silently breaks the unsubscribe + bounce-suppression flow in production.
2. **Update errors are completely silent.** Both routes call `await resend.contacts.update(...)` without inspecting the returned `{ data, error }` envelope. If the call fails (auth error, audience mismatch, rate-limit), the route returns 200 OK and the webhook reports success — no observability, no remediation path.
3. **Webhook handler trusts Resend's `bounce.type` casing** (`'Permanent'` / `'Temporary'`) without empirical confirmation. Resend's actual payload uses `'Transient'` for soft bounces (SES nomenclature). The else-branch happens to catch anything non-Permanent so behavior is correct for soft bounces, but the literal `'Temporary'` comment is misleading and any future code that checks for `'Temporary'` explicitly will silently fail.
4. **`generateToken` is called twice on every signup.** In the email-send branch (line 211) and again inside `verifyToken` during unsubscribe (line 59 of `lib/unsubscribe-token.ts`). This is fine functionally but creates a subtle correctness coupling: `verifyToken` recomputes the HMAC by re-running `generateToken(decodedEmail)`. If `generateToken` ever changes its email-normalization behavior (e.g., adds a trim), every previously-issued token in flight breaks. Not a bug today, but a fragility marker.

## Critical Issues

### CR-01: `resend.contacts.update` called without `audienceId` in unsubscribe + webhook routes

**File:** `app/unsubscribe/route.ts:52`, `app/api/webhooks/resend/route.ts:65,76`
**Issue:** Both routes call `resend.contacts.update({ email, unsubscribed: true })` with no `audienceId`. The Resend SDK (`node_modules/resend/dist/index.mjs:544`) falls back to `PATCH /contacts/:email` when `audienceId` is omitted — this top-level path is not the per-audience endpoint and will almost certainly fail to flip `unsubscribed` on the actual audience contact. The unit tests (`tests/unit/unsubscribe-route.test.ts:75`, `tests/unit/webhook-handler.test.ts:77`) only assert the mock was called with the omitted-audienceId payload, so they pass trivially while integration breaks.

The audience routing in `app/actions/join-waitlist.ts:142` correctly uses `env.RESEND_AUDIENCE_ID` vs `env.RESEND_AUDIENCE_PREVIEW_ID` for `contacts.create`. Unsubscribe and webhook must use the same routing.

**Fix:**
```ts
// In app/unsubscribe/route.ts and app/api/webhooks/resend/route.ts:
// eslint-disable-next-line custom/no-raw-process-env -- Vercel system env var (per PATTERNS.md exception)
const audienceId = process.env.VERCEL_ENV === 'production'
  ? env.RESEND_AUDIENCE_ID
  : env.RESEND_AUDIENCE_PREVIEW_ID

await resend.contacts.update({
  audienceId,
  email,
  unsubscribed: true,
})
```
Also extend the integration UAT (Plan 04-08 already added live probes) with a one-shot live-call probe that posts a generated unsubscribe token against the preview audience and reads back the `unsubscribed` field — the same pattern used for the contacts.get probe.

---

### CR-02: `resend.contacts.update` errors are silently swallowed in unsubscribe + webhook routes

**File:** `app/unsubscribe/route.ts:52`, `app/api/webhooks/resend/route.ts:65,76`
**Issue:** Both routes await `resend.contacts.update(...)` and discard the returned `{ data, error }` envelope. The Resend SDK does NOT throw on API errors — it returns `{ data: null, error: { name, message, statusCode } }`. So:
- Unsubscribe route returns 200 OK with the "You're unsubscribed" HTML even when the audience write failed (CAN-SPAM exposure: the user is told they're unsubscribed when they aren't).
- Webhook returns 200 OK to Resend, marking the event delivered, even when the contact wasn't actually flipped. The hard-bounce contact stays subscribed and is re-mailed, accruing reputation damage.

Tests do not exercise the error branch.

**Fix:**
```ts
const { error: updateError } = await resend.contacts.update({
  audienceId,
  email,
  unsubscribed: true,
})
if (updateError) {
  console.error('contact_update_failed', { email, error: updateError, via })
  // Webhook: return non-2xx so Resend retries.
  // Unsubscribe: return 500 with a generic apology page + mailto fallback.
  return { status: 500 as const, ... }
}
```
Add unit tests that mock `update` to return `{ data: null, error: { ... } }` and assert the route returns the error path (not 200).

---

### CR-03: `bounce.type` literal `'Temporary'` is wrong — Resend uses `'Transient'`

**File:** `app/api/webhooks/resend/route.ts:69-73,17` (comment + dispatch comment)
**Issue:** The dispatch comment block at lines 17-22 documents `bounce.type === 'Temporary'` as the soft-bounce branch. Resend's webhook payload (SES-backed) uses `'Transient'` for soft bounces, never `'Temporary'`. The else-branch at line 69 catches "anything not Permanent" so the runtime behavior happens to be correct, BUT:

1. The inline comment at line 70 says `// Temporary — log only.` which is empirically wrong.
2. Any future maintainer who adds an explicit `else if (bounceType === 'Temporary')` branch (e.g., for retry-aware logic) will introduce a silent bug — the literal will never match.
3. `EmailBounce.type` is typed as `string` in the SDK (`node_modules/resend/dist/index.d.mts:1873`), so TypeScript provides no help.
4. The `ResendWebhookEvent` local type at line 94 narrows to `'Permanent' | 'Temporary'` — this fabricated type misleads future readers about the real shape.

**Fix:**
```ts
// app/api/webhooks/resend/route.ts
// 1. Fix the dispatch comment + inline comment to read 'Transient' (or just "any non-Permanent").
// 2. Update local type to match SDK reality:
type ResendWebhookEvent = {
  type: string
  data?: {
    to?: string[]
    bounce?: { type?: string; subType?: string }  // type is `string` per SDK
  }
}
// 3. Add a webhook-handler test with bounce.type === 'Transient' to lock the
//    soft-bounce behavior empirically.
```
Bonus: log `bounceType` as a structured field in the soft-bounce path so the actual value is observable in production logs — this is the cheapest way to confirm the empirical casing once webhooks fire.

---

### CR-04: Webhook handler `recipientEmail` derived from `event.data.to[0]` may be wrong field

**File:** `app/api/webhooks/resend/route.ts:59`
**Issue:** `event.data?.to?.[0]` extracts the recipient from the `to` array. Per the Resend SDK type at `node_modules/resend/dist/index.d.mts:1865`, `BaseEmailEventData.to` is `string[]` and the recipient address ends up there. That part is OK. But:

1. The code falls through to a no-op when `recipientEmail === ''` (line 64 `if (recipientEmail)` guard). For a hard bounce with empty `to`, the contact is NEVER unsubscribed, but `track('contact_bounced', { kind: 'hard' })` STILL fires (line 68). The track event reports a hard bounce occurred, but no remediation happened. This is a silent-data-loss case: a hard bounce slips through undetected and the contact stays subscribed.
2. There is no logging at WARN/ERROR for the empty-recipient case — the route returns 200 with no observability.
3. The same `if (recipientEmail)` guard exists for complaints (line 75) with the same silent-skip behavior.

**Fix:**
```ts
if (!recipientEmail) {
  console.error('webhook_missing_recipient', {
    eventType: event.type,
    eventData: event.data,
  })
  // Return 4xx so Resend doesn't keep retrying a malformed payload, but
  // do NOT track 'contact_bounced' / 'contact_complained' — there's no contact.
  return new NextResponse('Missing recipient', { status: 400 })
}
```
Place this guard BEFORE the `if (event.type === ...)` dispatch, and remove the redundant inner `if (recipientEmail)` guards.

---

## Warnings

### WR-01: Env validation crashes the build when any env var is missing — including the placeholder `RESEND_FROM_POSTAL_ADDRESS`

**File:** `lib/env.ts:37-41`, `.env.example:43-47`
**Issue:** `envSchema.parse(process.env)` runs at module load. `RESEND_FROM_POSTAL_ADDRESS` is `z.string().min(1, ...)` — only blocks empty strings. The placeholder `YOUR-POSTAL-ADDRESS-HERE` (set in `.env.example:47`) satisfies `min(1)` and silently flows into the welcome-email footer. The comment at lines 35-37 acknowledges this is a "HARD blocker for production deploy" but the schema does not enforce it — only convention does.

If the founder forgets to swap the placeholder before flipping `VERCEL_ENV=production`, real users receive a CAN-SPAM-non-compliant email with the literal string `YOUR-POSTAL-ADDRESS-HERE`. Test at `tests/unit/join-waitlist-action.test.ts:11` even uses a fake address (`'Test Address, Test City, TS 99999'`) which would also pass production validation.

**Fix:**
Add a runtime guard that refuses to send the welcome email if the placeholder is detected, scoped to production:
```ts
// In app/actions/join-waitlist.ts, before resend.emails.send:
// eslint-disable-next-line custom/no-raw-process-env -- Vercel system env var (per PATTERNS.md exception)
if (process.env.VERCEL_ENV === 'production' &&
    /YOUR-POSTAL-ADDRESS|placeholder|test address/i.test(env.RESEND_FROM_POSTAL_ADDRESS)) {
  console.error('postal_address_placeholder_in_production', {
    addr: env.RESEND_FROM_POSTAL_ADDRESS,
  })
  return { status: 'error', message: 'Service is being configured. Try again shortly.' }
}
```
Or — preferred — make the schema reject the known placeholder string in production: `.refine((s) => process.env.VERCEL_ENV !== 'production' || !/YOUR-POSTAL-ADDRESS/.test(s), ...)`.

---

### WR-02: Unsubscribe URL fallback chain — the fallback to `https://usequibly.com` is misleading pre-Phase-6

**File:** `app/actions/join-waitlist.ts:206-210`
**Issue:** The fourth-level fallback `'https://usequibly.com'` returns a hostname that, per the comments in `.env.example:51-58`, is NOT YET BOUND to Vercel (Phase 6 unshipped). If all three preceding env vars are unset (which would happen on a misconfigured environment), every welcome email gets an unsubscribe link to a domain that returns DNS NXDOMAIN or a parking page. The user has no path to unsubscribe, which is a CAN-SPAM exposure.

The defensive chain comment at line 196-199 acknowledges this ("only useful post-Phase 6") but does not gate the fallback behind `VERCEL_ENV`. In a misconfigured production deploy this manifests as silent dead unsubscribe links.

**Fix:**
Either fail loudly when all env vars are missing in production:
```ts
if (process.env.VERCEL_ENV === 'production' && !explicitSiteUrl && !vercelProdHost && !vercelDeployHost) {
  console.error('site_url_unresolved_in_production')
  return { status: 'error', message: 'Service is being configured. Try again shortly.' }
}
```
Or remove the apex-string fallback entirely until Phase 6 binds the domain — let the action throw rather than silently emit dead links.

---

### WR-03: `await track(...)` blocks the response on every signup but `resend.emails.send` does not

**File:** `app/actions/join-waitlist.ts:112,132,251`
**Issue:** The action awaits every `track()` call (`await track('signup_rejected', ...)`, `await track('waitlist_signup', ...)`) but fires `resend.emails.send(...)` without `await`. Today this is harmless because `lib/analytics.ts:31` is just `console.log`. After Phase 5 swaps in `@vercel/analytics/server`, every signup will block on a network round-trip to Vercel before returning the success response. Worse, the inconsistency means the welcome email's `.catch` handler can `track('welcome_email_send_error', ...)` AFTER the response has been sent — the unawaited track call may be killed by the Vercel function lifetime cutoff, losing observability for the exact failure mode it was meant to catch (`EMAIL-08`).

**Fix:**
- Pick one strategy and apply consistently. Either: await all tracks (slowest, most reliable) and use `waitUntil()` for the email-send `.catch` handler. Or: never await tracks (treat analytics as fire-and-forget) and accept lost events.
- Recommended: introduce `waitUntil()` once Phase 5 lands so the response can return immediately while track + email continue:
```ts
import { waitUntil } from '@vercel/functions'
waitUntil(track('waitlist_signup', { duplicate: isDuplicate }))
```

---

### WR-04: `existingContact` is dead-checked with `void existingContact` — suppression hides a real questionable read

**File:** `app/actions/join-waitlist.ts:174,254`
**Issue:** Line 174 computes `const isDuplicate = !!existingContact && !getError`. Line 254 has `void existingContact` to suppress an unused-variable warning. But `existingContact` IS used on line 174 — the `void` statement is dead. Reading the comment at line 253 ("Suppress unused variable warning"), the author appears to have misdiagnosed why ESLint complained. The likely real cause is that the destructured `data:` field from `contacts.get` is a fully-typed `Contact` object but only its truthiness is read — TypeScript/ESLint may flag the structural read pattern. `void` on the variable name does nothing useful.

**Fix:**
Delete line 253-254. The variable is already used. If a lint rule still complains, fix it at the lint config level (or use `_existingContact` rename).

---

### WR-05: `verifyToken` calls `generateToken(decodedEmail)` — duplicate work + brittle coupling

**File:** `lib/unsubscribe-token.ts:59-60`
**Issue:** `verifyToken` recomputes the full HMAC by calling `generateToken(email)` and then discarding the email-encoded prefix it just produced (line 60: `const expectedHmac = expected.split('.')[1]`). This:
1. Doubles the per-verify work (encodes email twice, allocates `expected` string to throw it away).
2. Couples verify to generate's exact behavior — if `generateToken` ever lowercases, trims, or normalizes, every in-flight token breaks asymmetrically.
3. Hides what verify actually does. The semantically clearer form is `crypto.subtle.sign('HMAC', key, encoder.encode(email))` and base64url-compare directly.

**Fix:**
```ts
export async function verifyToken(token: string): Promise<string | null> {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [encodedEmail, hmacB64] = parts
  if (!encodedEmail || !hmacB64) return null

  let email: string
  try {
    email = Buffer.from(encodedEmail, 'base64url').toString('utf-8')
  } catch { return null }
  if (!email) return null

  const key = await getKey()
  const expectedSig = await crypto.subtle.sign('HMAC', key, encoder.encode(email))
  const a = Buffer.from(expectedSig)
  const b = Buffer.from(hmacB64, 'base64url')
  if (a.length !== b.length) return null

  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0 ? email : null
}
```
This also exports `getKey` for reuse instead of fan-out via `generateToken`.

---

### WR-06: Unsubscribe route logs token prefix as observability — but token prefix is the email, not the HMAC

**File:** `app/unsubscribe/route.ts:48`
**Issue:** `console.warn('unsubscribe_invalid_token', { tokenPrefix: token.slice(0, 12), via })`. The token format is `${base64url(email)}.${base64url(hmac)}`. The first 12 chars are the leading bytes of the BASE64-encoded email. For most short emails (`a@b.co` → 8 bytes → 12 base64 chars) this is the entire email. This leaks PII into application logs for failed unsubscribes (which can be invoked by an attacker repeatedly to harvest the format).

**Fix:**
```ts
// Log only a non-PII fingerprint — e.g., last few chars of the HMAC, or a hash.
console.warn('unsubscribe_invalid_token', {
  hmacSuffix: token.split('.')[1]?.slice(-6) ?? 'malformed',
  via,
})
```

---

### WR-07: Webhook handler uses `as ResendWebhookEvent` cast that masks SDK type drift

**File:** `app/api/webhooks/resend/route.ts:48-52,90-96`
**Issue:** `resend.webhooks.verify()` returns a typed `WebhookEventPayload` per the SDK (`index.d.mts:2108`). The code re-types the result with a hand-rolled local `ResendWebhookEvent` via `as`. This:
1. Discards SDK type information — adding a new event variant in a future Resend SDK doesn't surface as a TS error.
2. Misrepresents the SDK shape (`BaseEmailEventData.to: string[]` is required, not optional — but the local type marks it `to?: string[]`).
3. Hides the structured `bounce.subType` field, used in observability today only as a log line.

**Fix:**
Use the SDK's exported type directly:
```ts
import type { WebhookEventPayload, EmailBouncedEvent, EmailComplainedEvent } from 'resend'

const event = resend.webhooks.verify({ payload, headers: { id, timestamp, signature }, webhookSecret: env.RESEND_WEBHOOK_SECRET })
// Switch on event.type with TS narrowing — no cast needed.
```
If `WebhookEventPayload` is not directly importable, raise an issue against the SDK and use a wrapping type guard rather than a cast.

---

## Info

### IN-01: Disposable-domain check trims AFTER lowercasing — order is meaningless but inverted from intuition

**File:** `lib/disposable-domains.ts:51`
**Issue:** `email.slice(at + 1).toLowerCase().trim()` — `.toLowerCase()` does not introduce or remove whitespace, so `.trim()` after vs before is functionally identical. Reads more naturally with trim first.

**Fix:** `email.slice(at + 1).trim().toLowerCase()` — same result, reads as "extract → normalize whitespace → normalize case".

---

### IN-02: `WelcomeEmail.PreviewProps` postal-address placeholder is a real-looking address

**File:** `emails/WelcomeEmail.tsx:127`
**Issue:** `'123 Main St, Anytown, CA 90210'` is the React Email dev-preview placeholder. If a developer accidentally screenshots the email preview and the screenshot ends up in marketing material, this address — which IS a real ZIP code in Beverly Hills — could be confusing. A clearly fake placeholder is safer.

**Fix:**
```ts
WelcomeEmail.PreviewProps = {
  unsubscribeUrl: 'https://useQuibly.com/unsubscribe?t=preview_token',
  postalAddress: '[Postal address — set RESEND_FROM_POSTAL_ADDRESS]',
}
```

---

### IN-03: Test mock — `resend.contacts.get` mock returns `data: null, error: { ... }` together

**File:** `tests/unit/join-waitlist-action.test.ts:23-26,106-109`
**Issue:** The mock returns BOTH `data: null` AND `error: { name: 'not_found', ... }` for the not-found case. The action's `isDuplicate` computation (`!!existingContact && !getError`) handles this correctly because `existingContact` is null. But the test's mock shape is technically inconsistent with the empirical Probe-1 finding documented at lines 261-264 of `app/actions/join-waitlist.ts` — that probe found "data: null, error: { name: 'not_found', ... }", which IS what's mocked. So this is consistent with the documented empirical shape. Verify by reading the Probe 1 evidence file to be sure the mock matches.

**Fix:** Add a comment in the test pointing to `app/actions/join-waitlist.ts:260-264` so future maintainers know where the empirical confirmation lives. Consider adding a probe re-runner script that verifies this every CI run.

---

### IN-04: `lib/rate-limit.ts` — `Redis.fromEnv()` reads env directly, bypassing `lib/env.ts`

**File:** `lib/rate-limit.ts:28`
**Issue:** `Redis.fromEnv()` reads `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` from `process.env` inside the Upstash SDK. The codebase has a "single env reader" convention (D-11) enforced by a custom ESLint rule (`custom/no-raw-process-env`). The comment at lines 21-23 acknowledges this and relies on `lib/env.ts` running first to validate. Two minor concerns:
1. Module load order in tests is fragile — if `lib/rate-limit.ts` is imported before env vars are set in a test file, `Redis.fromEnv()` will fail with cryptic Upstash errors rather than the friendly Zod errors `lib/env.ts` provides.
2. Disposing `Redis.fromEnv()` in favor of `new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN })` would route through the validated env and surface the same friendly Zod errors.

**Fix:**
```ts
import 'server-only'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { env } from '@/lib/env'

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
})
```

---

_Reviewed: 2026-04-28_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
