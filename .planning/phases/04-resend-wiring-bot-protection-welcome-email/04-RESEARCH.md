# Phase 4: Resend Wiring + Bot Protection + Welcome Email — Research

**Researched:** 2026-04-28
**Domain:** Resend Audiences API, transactional email (React Email), Upstash sliding-window rate limiting, webhook verification (svix), RFC 8058 one-click unsubscribe, HMAC token signing
**Confidence:** HIGH (all critical APIs verified via Context7; one MEDIUM flag on duplicate-contact response shape)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01: Welcome email voice** — Founder note voice, solo framing, transactional shell. From `Jeff @ Quibly <hello@useQuibly.com>`. Subject: `"You're on the Quibly list"`. Body is verbatim locked draft. Claude polishes JSX rendering only — does NOT paraphrase copy.
- **D-02: `List-Unsubscribe` + `List-Unsubscribe-Post: One-Click` headers** — MUST be present on the very first welcome email. HTTPS endpoint at `app/unsubscribe/route.ts` accepts `POST`, processes within 48h. DKIM covers both headers.
- **D-03: Silent rejection for rate-limit AND disposable-domain** — Returns `{ status: 'success' }` shape. No welcome email, no `track('waitlist_signup')`. Server-side `console.warn` + `track('signup_rejected', { reason: 'rate_limit' | 'disposable_domain' })` only.
- **D-04: `fieldErrors` keys MAY be extended** but are NOT surfaced in Phase 4 (silent-success only).
- **D-05: Suppress welcome email on duplicate signup** — Skip `resend.emails.send` when `contacts.create` indicates existing contact. `track('waitlist_signup', { duplicate: true })` still fires.
- **D-06: Fallback if duplicate signal is unclear** — Always send welcome email if probe cannot confirm the duplicate signal.
- **D-07: Webhook handler is `app/api/webhooks/resend/route.ts`** — Next.js route handler, NOT a Server Action.
- **D-08: Differentiated handler logic** — `email.bounced` with `data.bounce.type === 'Permanent'` → mark contact `unsubscribed=true` + `console.error` + `track('contact_bounced', { kind: 'hard' })`; transient bounce → `console.warn` only; `email.complained` → mark unsubscribed + `console.error` + `track('contact_complained')`.
- **D-09: No alerting/Slack in v1** — Defer to v2.
- **D-10: Postal address is a HARD blocker for production deploy** — Plan ships with `YOUR-POSTAL-ADDRESS-HERE` placeholder; last checkpoint task blocks production merge until real address is in `RESEND_FROM_POSTAL_ADDRESS` env var.
- **Phase 3 contract locked:** `app/actions/join-waitlist.ts` file path, `joinWaitlistAction` export name, `JoinWaitlistResult` discriminated-union shape — all stay verbatim. Phase 4 replaces only the stub body (D-11 markers). `components/waitlist/waitlist-form.tsx` is NOT touched.
- **Action pipeline order (from CONTEXT code_context):** honeypot → time-trap → Zod (from Phase 3, kept) → disposable-domain check → rate-limit check → `resend.contacts.create` → fire-and-forget email → `track('waitlist_signup', { duplicate })`.

### Claude's Discretion

- **CD-01:** Disposable-domain blocklist — hand-curated array ~15–30 entries in `lib/disposable-domains.ts`.
- **CD-02:** One-click unsubscribe URL token format — HMAC-signed `contactId` using `RESEND_WEBHOOK_SECRET` (or dedicated `UNSUBSCRIBE_SECRET`). Token: `${contactId}.${hmac}`.
- **CD-03:** `consent_version` stub — `process.env.VERCEL_GIT_COMMIT_SHA ?? 'pre-phase-5'`.
- **CD-04:** Audience routing — `const audienceId = process.env.VERCEL_ENV === 'production' ? env.RESEND_AUDIENCE_ID : env.RESEND_AUDIENCE_PREVIEW_ID`.
- **CD-05:** Webhook signature verification — use Resend's svix-based `resend.webhooks.verify(...)` pattern.
- **CD-06:** Mail-tester.com verification — early-phase checkpoint, before any production-audience write.
- **CD-07:** Delete Phase 3 stub branches and migrate Vitest specs to `vi.mock('@/lib/resend')`.
- **CD-08:** Welcome email JSX layout — adapt `marketing-app/emails/WelcomeEmail.tsx` structure (teal strip, Container, Body, Hr, footer) to D-01 voice.
- **CD-09:** Fire-and-forget mechanics — `.catch((err) => { console.error(...); track(...) })`, NOT awaited.
- **CD-10:** Rate-limit identifier — `request.headers.get('x-forwarded-for')?.split(',')[0]` (Vercel canonical), fallback to `x-real-ip`.
- **CD-11:** Disposable-domain check AFTER Zod, BEFORE rate-limit.

### Deferred Ideas (OUT OF SCOPE)

- Cloudflare Turnstile (V2-07) — signal-driven only
- Live signup counter (Phase 7) — gated audience ≥50
- Slack/email complaint-rate alert (D-09) — v2
- `waitUntil()` from `@vercel/functions` — only if fire-and-forget shows aborted sends
- `disposable-email-domains` npm package — only if hand-curated list shows leaks
- One-click unsubscribe confirmation HTML page — deferred
- Surfaced rate-limit/disposable-domain UX — D-04 silent in v1
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EMAIL-01 | Welcome email sent fire-and-forget within 60s of successful signup | Resend `emails.send()` fire-and-forget pattern with `.catch()` verified |
| EMAIL-02 | Sent from `hello@useQuibly.com` (NOT `noreply@`) | Resend `from:` parameter; sender domain already verified in marketing-app |
| EMAIL-03 | `List-Unsubscribe` AND `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers | Resend `headers:` parameter in `emails.send()` accepts both; see Code Examples |
| EMAIL-04 | One-click unsubscribe link in body | HMAC-signed token URL in `<Link>` component of React Email template; POST handler at `app/unsubscribe/route.ts` |
| EMAIL-05 | Physical postal address in footer (CAN-SPAM) | `postalAddress` prop in `WelcomeEmail`; reads from `RESEND_FROM_POSTAL_ADDRESS` env (via `lib/env.ts`); gated by D-10 checkpoint |
| EMAIL-06 | Plain-language confirmation paragraph | D-01 locked draft — JSX rendering only |
| EMAIL-07 | React Email JSX template (`emails/WelcomeEmail.tsx`) | `@react-email/components@1.0.12` verified; layout from `marketing-app/emails/WelcomeEmail.tsx` |
| EMAIL-08 | Server-side observability for welcome-email failures | `.catch((err) => { console.error('welcome_email_send_failed', { err }); track('welcome_email_send_error', { contactId }) })` |
| EMAIL-09 | Resend webhook for `email.bounced` + `email.complained` with route handler | Webhook event names confirmed: `email.bounced` (with `data.bounce.type: 'Permanent'/'Temporary'`) and `email.complained`; svix headers verified |
| STORE-01 | Production audience + separate preview audience | `VERCEL_ENV === 'production'` → `RESEND_AUDIENCE_ID`, else `RESEND_AUDIENCE_PREVIEW_ID`; both env vars already in `lib/env.ts` |
| STORE-02 | Restricted "Sending access" Resend API key | Already specified in `.env.example`; `lib/resend.ts` to read from `env.RESEND_API_KEY` |
| STORE-03 | `resend.contacts.create({ audienceId, email, properties })` is the single write path | Verified `POST /contacts` with `audienceId`, `email`, `properties` map |
| STORE-04 | `consent_version` property on each contact | Passed as `properties: { consent_version: process.env.VERCEL_GIT_COMMIT_SHA ?? 'pre-phase-5' }` |
| STORE-05 | CSV export workflow validated end-to-end | Manual checkpoint: Resend dashboard export → CSV → re-import; `consent_version` is a custom property — round-trip behavior must be verified empirically (LOW confidence on exact CSV column names) |
| SPAM-03 | Upstash Redis sliding-window: 5/min/IP and 50/day/IP | `Ratelimit.slidingWindow(5, '60 s')` and `Ratelimit.slidingWindow(50, '1 d')` ladder pattern; `Redis.fromEnv()` reads env vars automatically |
| SPAM-04 | Disposable-domain blocklist | Static array in `lib/disposable-domains.ts`; `isDisposableDomain(email)` helper; checked after Zod, before rate-limit |
</phase_requirements>

---

## Summary

Phase 4 replaces the Phase 3 stub body in `app/actions/join-waitlist.ts` with a real Resend Audience write, sends a deliverability-correct welcome email, and layers Upstash sliding-window rate limiting and a disposable-domain blocklist on top of the existing honeypot/time-trap defenses. It also ships a webhook handler for bounce/complaint events and an RFC 8058-compliant one-click unsubscribe endpoint.

All critical API shapes are confirmed through Context7 and official Resend docs. The webhook signature scheme uses Resend's built-in `resend.webhooks.verify()` which wraps the svix library — three headers (`svix-id`, `svix-timestamp`, `svix-signature`) are required. The Upstash `Ratelimit.slidingWindow()` API is straightforward; `Redis.fromEnv()` picks up the two env vars already present in `lib/env.ts`. The update-contact API (`PATCH /contacts/{contact_id_or_email}` with `{ unsubscribed: true }`) is the correct mechanism for webhook-triggered unsubscribes.

The one remaining MEDIUM-confidence item is the **duplicate-contact response shape** from `resend.contacts.create`. Official docs show a clean 200 success response but do not document the error payload on duplicate email submission. A 5-minute day-1 probe is required. The fallback (D-06: always send welcome email) is safe at pre-launch volumes.

**Primary recommendation:** Wire the full action pipeline per the execution order in `## Architecture Patterns`. The webhook and unsubscribe routes are independent of the form pipeline and can be developed/tested in parallel.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Email audience storage | Backend (Server Action) | — | Resend write goes through `lib/resend.ts` singleton; never touches client |
| Welcome email send | Backend (Server Action) | — | Fire-and-forget from server; `import 'server-only'` guards |
| Rate limiting | Backend (Server Action) | — | Upstash Redis check keyed on Vercel `x-forwarded-for` header; runs server-side |
| Disposable-domain check | Backend (Server Action) | — | Pure synchronous function; zero latency; runs before network call |
| Webhook handling (bounces/complaints) | Backend (Route Handler) | — | External caller (Resend) POSTs to `/api/webhooks/resend` — must be Route Handler, not Server Action |
| One-click unsubscribe | Backend (Route Handler) | — | RFC 8058 requires `POST` endpoint; email clients POST directly to it |
| Consent version snapshot | Backend (Server Action) | — | Written at `contacts.create` time; reads `VERCEL_GIT_COMMIT_SHA` server-side |
| Audience routing (prod vs preview) | Backend (Server Action) | — | `VERCEL_ENV` env var available server-side only |

---

## Standard Stack

### Core — Phase 4 additions

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `resend` | `6.12.2` [VERIFIED: npm registry] | Audience contact create + transactional email send | Already in `marketing-app`; verified `contacts.create`, `emails.send`, `contacts.update`, `webhooks.verify` in Context7 |
| `@react-email/components` | `1.0.12` [VERIFIED: npm registry] | React Email JSX template rendering | Same library `marketing-app` uses; `Html`, `Head`, `Body`, `Container`, `Section`, `Text`, `Hr`, `Link`, `Preview` confirmed |
| `@upstash/ratelimit` | `2.0.8` [VERIFIED: npm registry] | Sliding-window per-IP rate limiting | `Ratelimit.slidingWindow(N, 'Xs')` API confirmed; serverless-native, HTTP-based |
| `@upstash/redis` | `1.37.0` [VERIFIED: npm registry] | Redis client for Upstash (`Redis.fromEnv()`) | Pairs with `@upstash/ratelimit`; reads `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` automatically |

### Already installed (no changes needed)

| Library | Version | Purpose |
|---------|---------|---------|
| `resend` | `6.12.2` | Already in `marketing-app`; must add to `quibly-landing/package.json` |
| `zod` | `^4.0.0` | Already installed from Phase 3 |
| `next` | `16.2.1` | App Router, Server Actions, Route Handlers |

**New packages to install:**
```bash
npm install resend@^6.12 @react-email/components@^1.0 @upstash/ratelimit@^2.0 @upstash/redis@^1.37
```

**Note:** `@react-email/components` and `@upstash/ratelimit` + `@upstash/redis` are NOT yet in `quibly-landing/package.json`. Must be installed in Phase 4 Wave 0.

---

## Architecture Patterns

### System Architecture Diagram

```
[User Browser]
    │  form POST (progressive enhancement — no JS needed)
    ▼
[Server Action: joinWaitlistAction()]   ← app/actions/join-waitlist.ts
    │
    ├─[1] Honeypot check (hp_field)     → silent success if filled (Phase 3, preserved)
    ├─[2] Time-trap check (renderedAt)  → silent success if <2s (Phase 3, preserved)
    ├─[3] Zod validation                → error return if invalid (Phase 3, preserved)
    ├─[4] Disposable-domain check       → silent success (D-03); track('signup_rejected')
    ├─[5] Rate-limit check (Upstash)    → silent success (D-03); track('signup_rejected')
    │       └── lib/rate-limit.ts (2× limiters: 5/min + 50/day, keyed on x-forwarded-for)
    │
    ├─[6] resend.contacts.create({ audienceId, email, unsubscribed:false, properties:{consent_version} })
    │       └── lib/resend.ts (singleton, import 'server-only')
    │           audienceId = VERCEL_ENV === 'production' ? RESEND_AUDIENCE_ID : RESEND_AUDIENCE_PREVIEW_ID
    │
    ├─[7] If NOT duplicate: fire-and-forget resend.emails.send({ react: <WelcomeEmail/>, headers:{...} })
    │           .catch(err => { console.error; track('welcome_email_send_error') })
    │
    ├─[8] track('waitlist_signup', { duplicate: bool })   ← lib/analytics.ts shim
    │
    └─[9] return { status: 'success' } | { status: 'error', message, fieldErrors, submittedValues }

[Resend webhook: POST /api/webhooks/resend]
    │  svix-id, svix-timestamp, svix-signature headers
    ▼
[Route Handler: app/api/webhooks/resend/route.ts]
    │
    ├─ resend.webhooks.verify({ payload, headers, webhookSecret })  → 401 if fails
    │
    ├─ event.type === 'email.bounced' && bounce.type === 'Permanent'
    │       → resend.contacts.update({ email: to[0], unsubscribed: true })
    │       → console.error + track('contact_bounced', { kind: 'hard' })
    │
    ├─ event.type === 'email.bounced' && bounce.type === 'Temporary'
    │       → console.warn + track('contact_bounced', { kind: 'soft' })
    │
    └─ event.type === 'email.complained'
            → resend.contacts.update({ email: to[0], unsubscribed: true })
            → console.error + track('contact_complained')

[Email client one-click: POST /unsubscribe?t=TOKEN]
    ▼
[Route Handler: app/unsubscribe/route.ts]
    ├─ Parse token: split on '.', verify HMAC (crypto.subtle, RESEND_WEBHOOK_SECRET)
    ├─ resend.contacts.update({ email: decodedEmail, unsubscribed: true })
    └─ return 200 OK
```

### Recommended Project Structure (Phase 4 additions)

```
quibly-landing/
├── app/
│   ├── actions/
│   │   └── join-waitlist.ts        # [MODIFY] Replace stub body with real pipeline
│   ├── api/
│   │   └── webhooks/
│   │       └── resend/
│   │           └── route.ts        # [NEW] Bounce + complaint webhook handler
│   └── unsubscribe/
│       └── route.ts                # [NEW] RFC 8058 one-click POST handler
├── emails/
│   └── WelcomeEmail.tsx            # [NEW] React Email JSX template
├── lib/
│   ├── resend.ts                   # [NEW] Resend SDK singleton (import 'server-only')
│   ├── rate-limit.ts               # [NEW] Upstash sliding-window rate limiter
│   ├── disposable-domains.ts       # [NEW] Static blocklist + isDisposableDomain()
│   └── analytics.ts                # [NEW] console.log shim + typed track() signature
├── tests/
│   └── unit/
│       ├── join-waitlist-action.test.ts  # [MODIFY] Migrate from stub to Resend mocks
│       └── webhook-handler.test.ts       # [NEW] Webhook route handler unit tests
└── .env.example                    # [MODIFY] Add RESEND_FROM_POSTAL_ADDRESS
```

### Pattern 1: Resend SDK Singleton with `server-only`

[VERIFIED: Context7 /websites/resend + marketing-app/lib/email/client.ts]

```typescript
// lib/resend.ts
import 'server-only'
import { Resend } from 'resend'
import { env } from '@/lib/env'

export const resend = new Resend(env.RESEND_API_KEY)
```

**Critical:** `import 'server-only'` as line 1 (NOT comment). Crashes the build if any client component transitively imports this module.

### Pattern 2: `resend.contacts.create()` with `properties` and `audienceId`

[VERIFIED: Context7 /websites/resend, create-contact API]

```typescript
// Inside joinWaitlistAction — after validation, rate-limit, disposable checks
const audienceId = process.env.VERCEL_ENV === 'production'
  ? env.RESEND_AUDIENCE_ID
  : env.RESEND_AUDIENCE_PREVIEW_ID

const consentVersion = process.env.VERCEL_GIT_COMMIT_SHA ?? 'pre-phase-5'

const { data, error } = await resend.contacts.create({
  audienceId,
  email,
  unsubscribed: false,
  properties: {
    consent_version: consentVersion,
  },
})

// data.id is the contact ID (needed for unsubscribe token generation)
// error is non-null on failure; duplicate detection via day-1 probe
const isDuplicate = !!error  // ASSUMED until empirically verified — see Open Questions
```

**Duplicate response probe required** — official docs show 200 success only; error shape on duplicate is NOT documented. [ASSUMED: `error` is non-null with a `validation_error` or similar message on duplicate. Fallback D-06: if unclear, set `isDuplicate = false` and always send welcome email.]

### Pattern 3: Upstash Rate Limit Ladder (5/min + 50/day)

[VERIFIED: Context7 /websites/upstash_redis_sdks_ratelimit-]

```typescript
// lib/rate-limit.ts
import 'server-only'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()  // reads UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN

export const rateLimitPerMinute = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '60 s'),
  prefix: '@quibly/ratelimit/min',
})

export const rateLimitPerDay = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, '1 d'),
  prefix: '@quibly/ratelimit/day',
})
```

```typescript
// In joinWaitlistAction — after disposable-domain check:
const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim()
  ?? (await headers()).get('x-real-ip')
  ?? 'unknown'

const [minResult, dayResult] = await Promise.all([
  rateLimitPerMinute.limit(ip),
  rateLimitPerDay.limit(ip),
])

if (!minResult.success || !dayResult.success) {
  console.warn('rate_limit_hit', { ip, minSuccess: minResult.success, daySuccess: dayResult.success })
  await track('signup_rejected', { reason: 'rate_limit' })
  return { status: 'success' }  // silent success per D-03
}
```

**Note on `pending` promise:** The `limit()` call may return a `pending` Promise for analytics. For `analytics: false` (default), this is not needed. If `analytics: true` is passed to the `Ratelimit` constructor, use `context.waitUntil(pending)` to prevent serverless truncation. Default for Phase 4: omit `analytics` (defaults to false) to keep it simple. [VERIFIED: Context7 /websites/upstash_redis_sdks_ratelimit-]

### Pattern 4: Resend Webhook Verification (svix)

[VERIFIED: Context7 /websites/resend — webhook signature docs]

```typescript
// app/api/webhooks/resend/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { resend } from '@/lib/resend'
import { env } from '@/lib/env'

export async function POST(req: NextRequest) {
  const payload = await req.text()  // MUST use raw text for signature verification

  const id = req.headers.get('svix-id')
  const timestamp = req.headers.get('svix-timestamp')
  const signature = req.headers.get('svix-signature')

  if (!id || !timestamp || !signature) {
    return new NextResponse('Missing headers', { status: 400 })
  }

  let event: ReturnType<typeof resend.webhooks.verify>
  try {
    event = resend.webhooks.verify({
      payload,
      headers: { id, timestamp, signature },
      webhookSecret: env.RESEND_WEBHOOK_SECRET,
    })
  } catch {
    return new NextResponse('Invalid signature', { status: 401 })
  }

  // Dispatch per D-08...
}
```

**Three required headers:** `svix-id`, `svix-timestamp`, `svix-signature`. Resend's `webhooks.verify()` uses the svix signing library internally. `RESEND_WEBHOOK_SECRET` format starts with `whsec_` — already in `.env.example`. [VERIFIED: Context7]

### Pattern 5: Welcome Email with RFC 8058 Headers

[VERIFIED: Context7 /websites/resend — emails.send docs; RFC 8058 from PITFALLS.md]

```typescript
// Fire-and-forget from joinWaitlistAction:
const unsubscribeUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe?t=${generateToken(data.id)}`

resend.emails.send({
  from: `Jeff @ Quibly <hello@useQuibly.com>`,
  to: email,
  subject: `You're on the Quibly list`,
  react: WelcomeEmail({
    unsubscribeUrl,
    postalAddress: env.RESEND_FROM_POSTAL_ADDRESS,
  }),
  headers: {
    'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:unsubscribe@useQuibly.com>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  },
}).catch((err) => {
  console.error('welcome_email_send_failed', { contactId: data?.id, err })
  track('welcome_email_send_error', { contactId: data?.id })
})
```

**DKIM note:** Resend automatically signs all headers including custom ones when the sender domain is verified. Both `List-Unsubscribe*` headers will be covered by the DKIM signature if the domain is verified in Resend. Verify with Gmail "Show Original" → search `List-Unsubscribe-Post`.

### Pattern 6: HMAC-Signed Unsubscribe Token (CD-02)

[ASSUMED — `crypto.subtle` is available in Next.js Route Handlers / Node.js 18+]

```typescript
// lib/unsubscribe-token.ts (server-only)
import 'server-only'
import { env } from '@/lib/env'

const encoder = new TextEncoder()

async function getKey() {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(env.RESEND_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

export async function generateToken(contactId: string): Promise<string> {
  const key = await getKey()
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(contactId))
  const hmac = Buffer.from(sig).toString('base64url')
  return `${Buffer.from(contactId).toString('base64url')}.${hmac}`
}

export async function verifyToken(token: string): Promise<string | null> {
  const [encodedId, hmac] = token.split('.')
  if (!encodedId || !hmac) return null
  const contactId = Buffer.from(encodedId, 'base64url').toString()
  const expected = await generateToken(contactId)
  // Timing-safe compare:
  const a = Buffer.from(expected.split('.')[1], 'base64url')
  const b = Buffer.from(hmac, 'base64url')
  if (a.length !== b.length) return null
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0 ? contactId : null
}
```

The unsubscribe route uses `email` (extracted from the Resend contact via `resend.contacts.retrieve`) rather than the raw contactId when calling `resend.contacts.update`. Alternatively, store the email address directly in the token payload for a simpler verification path.

**Simpler alternative:** Encode `email` directly (not `contactId`) — `generateToken(email)` → token in URL → decode + verify → call `resend.contacts.update({ email, unsubscribed: true })`. Avoids a Resend API lookup. Slightly less private (email in URL, though base64url-encoded), but acceptable since the token is HMAC-signed.

### Pattern 7: `resend.contacts.update()` for Unsubscribe

[VERIFIED: Context7 /websites/resend — update-contact API]

```typescript
// In webhook handler (D-08) and unsubscribe route:
await resend.contacts.update({
  email: recipientEmail,  // can use email OR id
  unsubscribed: true,
})
```

The `PATCH /contacts/{contact_id_or_email}` endpoint accepts either `id` or `email` as the identifier. For the webhook handler, `event.data.to[0]` is the recipient email address — use that directly. [VERIFIED: Context7]

### Pattern 8: Disposable-Domain Blocklist

[VERIFIED: Pattern established in CONTEXT.md CD-01; hand-curated list]

```typescript
// lib/disposable-domains.ts
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'yopmail.com',
  'throwawaymail.com',
  'sharklasers.com',
  'guerrillamailblock.com',
  'grr.la',
  'guerrillamail.info',
  'guerrillamail.biz',
  'guerrillamail.de',
  'guerrillamail.net',
  'guerrillamail.org',
  'spam4.me',
  'trashmail.me',
  'trashmail.at',
  'dispostable.com',
  'mailnull.com',
  'spamgourmet.com',
  'spamgourmet.net',
  'spamgourmet.org',
  'fakeinbox.com',
  'maildrop.cc',
  'throwam.com',
])

export function isDisposableDomain(email: string): boolean {
  const domain = email.toLowerCase().split('@')[1] ?? ''
  return DISPOSABLE_DOMAINS.has(domain)
}
```

**Order in action:** Called AFTER Zod validation (email is well-formed at this point) and BEFORE rate-limit check (avoids incrementing the rate-limit bucket for a free disposable-check). Per CD-11.

### Pattern 9: `lib/analytics.ts` Shim (Phase 4 stub)

Phase 5 mounts `@vercel/analytics` properly. Phase 4 ships a typed shim so the `track()` call signature is established and Phase 5's swap is body-only.

```typescript
// lib/analytics.ts
import 'server-only'

type TrackEvent =
  | 'waitlist_signup'
  | 'signup_rejected'
  | 'welcome_email_send_error'
  | 'contact_bounced'
  | 'contact_complained'

export async function track(
  event: TrackEvent,
  properties?: Record<string, unknown>,
): Promise<void> {
  // Phase 4 shim: structured log only.
  // Phase 5 swaps this body for @vercel/analytics/server track() call.
  console.log('[analytics]', event, properties)
}
```

### Pattern 10: env.ts Extension (RESEND_FROM_POSTAL_ADDRESS)

The existing `lib/env.ts` already validates all Phase 4 env vars except `RESEND_FROM_POSTAL_ADDRESS`. Phase 4 adds it:

```typescript
// lib/env.ts — add to envSchema:
RESEND_FROM_POSTAL_ADDRESS: z.string().min(1, 'RESEND_FROM_POSTAL_ADDRESS is required (source per D-10 — registered agent or PO box)'),
```

**Checkpoint:** This will cause the app to crash on startup until the founder provides the real address. Plan includes a placeholder (`YOUR-POSTAL-ADDRESS-HERE`) during development and a hard-stop before production merge (D-10).

### Anti-Patterns to Avoid

- **Awaiting the welcome email send** — Couples user-visible success to a non-critical side effect. Use `.catch()`, NOT `await`.
- **Using `process.env.RESEND_API_KEY` directly in `lib/resend.ts`** — Import from `@/lib/env` per Phase 1 D-11 ESLint rule.
- **Using `req.json()` in the webhook handler** — MUST use `req.text()` (raw body) for svix signature verification. JSON parsing changes the string and breaks the HMAC.
- **Returning 200 before signature verification** — The 401 must be returned if `resend.webhooks.verify()` throws.
- **Exposing `contactId` in unsubscribe URL without HMAC** — Allows anyone to unsubscribe any contact via guessable IDs.
- **Calling `resend.contacts.update` by email without audience scoping** — The update endpoint works on the global contact, which is what we want (unsubscribes from all broadcasts, not just one audience).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Webhook signature verification | Custom HMAC check on raw headers | `resend.webhooks.verify({ payload, headers, webhookSecret })` | Resend uses svix; timing-safe, handles header replay attacks |
| Email rendering to HTML | Custom template string | `@react-email/components` rendered by Resend SDK (`react:` prop) | Inline styles, client compatibility, dark-mode passthrough |
| Rate limit state | Redis key/value with manual expiry | `@upstash/ratelimit` `Ratelimit.slidingWindow()` | Sliding-window math is non-trivial; handles distributed concurrency |
| Per-IP extraction on Vercel | Custom header parser | `x-forwarded-for` first segment (Vercel canonical) | Vercel sets this; multi-proxy chains need split-on-comma |

---

## Common Pitfalls

### Pitfall 1: `List-Unsubscribe-Post` header missing from welcome email

**What goes wrong:** Without `List-Unsubscribe-Post: List-Unsubscribe=One-Click`, Gmail shows the email as non-RFC-8058-compliant for bulk sends. At launch broadcast volume (>5,000/day to Gmail), messages bounce at SMTP level.

**How to avoid:** Both `List-Unsubscribe` and `List-Unsubscribe-Post` must be in the `headers:` object of `resend.emails.send()`. The HTTPS endpoint in `List-Unsubscribe` must accept `POST` (not just `GET`).

**Verification:** Gmail "Show Original" → search for `List-Unsubscribe-Post`. Must be present before Phase 4 is declared complete. [VERIFIED: PITFALLS.md Pitfall 1]

### Pitfall 2: Webhook handler parses JSON body before signature verification

**What goes wrong:** `const body = await req.json()` then `JSON.stringify(body)` does not produce the same bytes as the original payload. Svix HMAC fails on every request.

**How to avoid:** Always `const payload = await req.text()` as the very first body read. Never call `req.json()` in the webhook handler. [VERIFIED: Context7 /websites/resend webhook docs]

### Pitfall 3: `env.RESEND_FROM_POSTAL_ADDRESS` not added to `lib/env.ts` before Phase 4 env pull

**What goes wrong:** `WelcomeEmail` receives `undefined` as `postalAddress`, renders a blank footer, and the first welcome email violates CAN-SPAM.

**How to avoid:** Add `RESEND_FROM_POSTAL_ADDRESS` to `envSchema` in Wave 0. App crashes at boot until real value is present — this is intentional (hard-crash on missing env).

### Pitfall 4: Resend `contacts.create()` called without `audienceId`

**What goes wrong:** The contact is created in the global Contacts namespace, not the "Quibly Waitlist" audience. It won't appear in the audience for broadcasts. The audience remains empty.

**How to avoid:** Always pass `audienceId` — never call `resend.contacts.create({ email })` without it. The audience ID is sourced from `env.RESEND_AUDIENCE_ID` (or preview variant). [VERIFIED: Context7]

### Pitfall 5: Rate limit incremented for honeypot/time-trap hits

**What goes wrong:** Bots that trip the honeypot also increment the IP's rate-limit bucket, potentially blocking legitimate users who share a NAT IP.

**How to avoid:** The execution order in Pattern 3 applies the rate-limit AFTER honeypot and time-trap checks. Returning early from honeypot/time-trap never reaches the rate-limit code. [VERIFIED: CONTEXT.md D-03 + action pipeline order]

### Pitfall 6: Fire-and-forget send executed after action returns (serverless truncation)

**What goes wrong:** On Vercel, the serverless function instance may be frozen after the response is sent. If the `resend.emails.send()` Promise is still in-flight, the send is aborted with no error log.

**How to avoid:** In practice, Next.js Server Actions await the React render flush before the function instance is frozen — the fire-and-forget Promise typically resolves within the request lifecycle. Monitor Vercel logs for aborted-send patterns in week 1. If observed, switch to `waitUntil()` from `@vercel/functions` (deferred per CD-09). [CITED: CONTEXT.md CD-09 + SUMMARY.md Conflict #3]

### Pitfall 7: Using `audienceId` scoped `contacts.update` for unsubscribe

**What goes wrong:** If audience-scoped update syntax is used, the contact may remain subscribed in other contexts. The correct path for unsubscribe is the global `PATCH /contacts/{id_or_email}` with `{ unsubscribed: true }`.

**How to avoid:** Use `resend.contacts.update({ email: recipientEmail, unsubscribed: true })` — this updates the global subscription state. [VERIFIED: Context7 update-contact docs]

---

## Code Examples

### Full action pipeline (Phase 4 body replacement)

```typescript
// app/actions/join-waitlist.ts — Phase 4 replacement block
// (lines after Zod validation, replacing D-11 stub branches)
'use server'

import { z } from 'zod'
import { headers } from 'next/headers'
import { env } from '@/lib/env'
import { resend } from '@/lib/resend'
import { rateLimitPerMinute, rateLimitPerDay } from '@/lib/rate-limit'
import { isDisposableDomain } from '@/lib/disposable-domains'
import { track } from '@/lib/analytics'
import WelcomeEmail from '@/emails/WelcomeEmail'
import { generateToken } from '@/lib/unsubscribe-token'

// [After Zod validation produces `email` ...]

// CD-11: Disposable-domain check BEFORE rate-limit
if (isDisposableDomain(email)) {
  console.warn('disposable_domain_rejected', { email })
  await track('signup_rejected', { reason: 'disposable_domain' })
  return { status: 'success' }  // D-03 silent success
}

// SPAM-03: Rate-limit ladder (5/min + 50/day per IP)
const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim()
  ?? (await headers()).get('x-real-ip')
  ?? 'unknown'

const [minResult, dayResult] = await Promise.all([
  rateLimitPerMinute.limit(ip),
  rateLimitPerDay.limit(ip),
])
if (!minResult.success || !dayResult.success) {
  console.warn('rate_limit_rejected', { ip })
  await track('signup_rejected', { reason: 'rate_limit' })
  return { status: 'success' }  // D-03 silent success
}

// STORE-01/04: Audience routing + consent version
const audienceId = process.env.VERCEL_ENV === 'production'
  ? env.RESEND_AUDIENCE_ID
  : env.RESEND_AUDIENCE_PREVIEW_ID
const consentVersion = process.env.VERCEL_GIT_COMMIT_SHA ?? 'pre-phase-5'

const { data: contact, error: contactError } = await resend.contacts.create({
  audienceId,
  email,
  unsubscribed: false,
  properties: { consent_version: consentVersion },
})

if (contactError && !isDuplicateError(contactError)) {
  console.error('contacts_create_failed', { email, error: contactError })
  return { status: 'error', message: 'Something went wrong. Try again in a moment.' }
}

const isDuplicate = !!contactError  // Day-1 probe determines exact condition — see Open Questions

// EMAIL-01/D-05: Fire-and-forget welcome email (first-time only)
if (!isDuplicate) {
  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://useQuibly.com'}/unsubscribe?t=${await generateToken(email)}`
  resend.emails.send({
    from: 'Jeff @ Quibly <hello@useQuibly.com>',
    to: email,
    subject: "You're on the Quibly list",
    react: WelcomeEmail({
      unsubscribeUrl,
      postalAddress: env.RESEND_FROM_POSTAL_ADDRESS,
    }),
    headers: {
      'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:unsubscribe@useQuibly.com>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  }).catch((err) => {
    console.error('welcome_email_send_failed', { email, err })
    track('welcome_email_send_error', { email })
  })
}

await track('waitlist_signup', { duplicate: isDuplicate })
return { status: 'success', duplicate: isDuplicate }
```

### Webhook handler (bounce + complaint differentiation)

```typescript
// app/api/webhooks/resend/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { resend } from '@/lib/resend'
import { env } from '@/lib/env'
import { track } from '@/lib/analytics'

export async function POST(req: NextRequest) {
  const payload = await req.text()  // raw body required for signature verification

  const id = req.headers.get('svix-id')
  const timestamp = req.headers.get('svix-timestamp')
  const signature = req.headers.get('svix-signature')

  if (!id || !timestamp || !signature) {
    return new NextResponse('Missing svix headers', { status: 400 })
  }

  let event: any
  try {
    event = resend.webhooks.verify({
      payload,
      headers: { id, timestamp, signature },
      webhookSecret: env.RESEND_WEBHOOK_SECRET,
    })
  } catch (err) {
    console.error('webhook_signature_invalid', { err })
    return new NextResponse('Invalid signature', { status: 401 })
  }

  const recipientEmail: string = event.data?.to?.[0] ?? ''

  if (event.type === 'email.bounced') {
    const bounceType: string = event.data?.bounce?.type ?? ''
    if (bounceType === 'Permanent') {
      await resend.contacts.update({ email: recipientEmail, unsubscribed: true })
      console.error('email_hard_bounced', { email: recipientEmail, bounce: event.data?.bounce })
      await track('contact_bounced', { kind: 'hard' })
    } else {
      console.warn('email_soft_bounced', { email: recipientEmail })
      await track('contact_bounced', { kind: 'soft' })
    }
  } else if (event.type === 'email.complained') {
    await resend.contacts.update({ email: recipientEmail, unsubscribed: true })
    console.error('email_complained', { email: recipientEmail })
    await track('contact_complained')
  }

  return new NextResponse('OK', { status: 200 })
}
```

### React Email template structure (WelcomeEmail.tsx)

```typescript
// emails/WelcomeEmail.tsx
import {
  Body, Container, Head, Hr, Html, Link, Preview, Section, Text,
} from '@react-email/components'
import * as React from 'react'

export interface WelcomeEmailProps {
  unsubscribeUrl: string   // HMAC-signed token URL
  postalAddress: string    // From env RESEND_FROM_POSTAL_ADDRESS
}

export function WelcomeEmail({ unsubscribeUrl, postalAddress }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to the Quibly waitlist — I&apos;ll be in touch.</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Teal header strip */}
          <Section style={header}>
            <Text style={headerText}>Quibly</Text>
          </Section>
          {/* D-01 locked founder voice — body paragraphs */}
          <Section style={content}>
            <Text style={paragraph}>Hey —</Text>
            {/* ... full D-01 draft copy ... */}
            <Text style={paragraph}>— Jeff</Text>
          </Section>
          <Hr style={hr} />
          {/* Footer: unsubscribe + postal address + disclosure */}
          <Section style={content}>
            <Text style={footer}>
              <Link href={unsubscribeUrl} style={footerLink}>Unsubscribe</Link>
              {' · '}
              {postalAddress}
            </Text>
            <Text style={footer}>
              You&apos;re receiving this because you signed up for the Quibly waitlist.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

WelcomeEmail.PreviewProps = {
  unsubscribeUrl: 'https://useQuibly.com/unsubscribe?t=preview_token',
  postalAddress: '123 Main St, Anytown, CA 90210',
} satisfies WelcomeEmailProps

export default WelcomeEmail

// Email-safe inline styles (hex colors only — no oklch)
const main: React.CSSProperties = { backgroundColor: '#ffffff', fontFamily: '-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', margin: 0, padding: 0 }
const container: React.CSSProperties = { maxWidth: '600px', margin: '0 auto' }
const header: React.CSSProperties = { height: '48px', padding: '0 24px', backgroundColor: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const headerText: React.CSSProperties = { color: '#ffffff', fontSize: '16px', fontWeight: 600, margin: 0 }
const content: React.CSSProperties = { padding: '32px 24px' }
const paragraph: React.CSSProperties = { color: '#404040', fontSize: '14px', lineHeight: 1.5, margin: '0 0 16px 0' }
const hr: React.CSSProperties = { borderColor: '#e5e5e5', margin: '24px 0' }
const footer: React.CSSProperties = { color: '#737373', fontSize: '12px', lineHeight: 1.5, margin: '0 0 4px 0' }
const footerLink: React.CSSProperties = { color: '#737373', textDecoration: 'underline' }
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual webhook HMAC check | `resend.webhooks.verify()` (wraps svix) | Resend SDK ~6.x | No more manual svix setup; one SDK method |
| `contacts.create` with audience-scope only | Global `/contacts` endpoint (no audience param needed for storage) | Resend 2024 contacts update | Can also use global contacts; for Phase 4, audience param is still preferred for broadcast targeting |
| `resend.contacts.update` by id only | Can update by email OR id | Resend PATCH /contacts/{id_or_email} | Simplifies webhook handler — no contact lookup step needed |

**Note on bounce `subType` field:** The Context7 docs for `email.bounced` show `data.bounce.type` as `'Permanent'` or `'Temporary'`, with a `subType` field (`'Suppressed'`, `'MessageRejected'`, etc.). The D-08 differentiation logic uses `type` (not `subType`) to distinguish hard vs soft. `subType` provides additional context for logging.

---

## Runtime State Inventory

> Skipped — this is a greenfield backend wiring phase. No rename/migration operations.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `resend.contacts.create()` returns `{ data: null, error: {...} }` on duplicate email (non-null `error`) | Pattern 2 / Code Examples | If error is null on duplicate (idempotent 200), `isDuplicate` is always false → duplicate users receive a second welcome email (acceptable per D-06 fallback) |
| A2 | `data.bounce.type === 'Permanent'` identifies hard bounces | Pattern 4 / Code Examples | Context7 confirms `type: 'Permanent'` field; if Resend changes the capitalization/enum, hard-bounce handler silently skips. Verify against test email `bounced@resend.dev` in day-1 probe. |
| A3 | `VERCEL_GIT_COMMIT_SHA` is available in all Vercel environments (production, preview, local dev with `vercel env pull`) | Pattern 2 | If undefined in local dev, falls back to `'pre-phase-5'` per CD-03 — acceptable |
| A4 | `crypto.subtle` is available in Next.js Route Handlers and Server Actions on Node.js 24 | Pattern 6 (HMAC token) | Node 18+ includes `crypto.subtle` globally; Node 24 confirmed in env audit — HIGH confidence, but marked ASSUMED because this wasn't explicitly tested |
| A5 | Resend `contacts.update({ email, unsubscribed: true })` works without `audienceId` and unsubscribes from all broadcasts | Pattern 7 | If it requires `audienceId`, the webhook handler needs to pass the audience ID. Context7 update-contact docs show `email` alone is sufficient. |
| A6 | CSV export of Resend audience preserves `consent_version` custom property as a column | STORE-05 research flag | If Resend flattens or omits custom properties in CSV export, the consent record is lost on migration. Must verify empirically during Phase 4 STORE-05 checkpoint. |

**If A1 is wrong (resend returns 200 on duplicate):** D-06 fallback applies — always send welcome email. Acceptable at pre-launch volume.

---

## Open Questions

1. **Resend duplicate-contact response shape (day-1 probe, 5 minutes)**
   - What we know: `contacts.create()` returns `{ data, error }` pattern (standard Resend SDK shape). On success: `{ data: { id, email, ... }, error: null }`. On failure: `{ data: null, error: { name, message, ... } }`.
   - What's unclear: Does a duplicate email return a non-null `error` (probe the exact `error.name` value), or does it return a 200 with the existing contact in `data`?
   - Recommendation: Day-1 probe — call `contacts.create()` twice with the same email against the preview audience and log the full response. If `error` is non-null: use `!!error` as `isDuplicate` signal. If `error` is null on duplicate (idempotent): use D-06 fallback (always send welcome email, never suppress).

2. **`email.bounced` bounce subtype values (day-1 docs check, 15 minutes)**
   - What we know: `data.bounce.type` is `'Permanent'` or `'Temporary'` per Context7 webhook docs. `data.bounce.subType` is `'Suppressed'`, `'MessageRejected'`, etc.
   - What's unclear: Are these values stable? Are there additional subtypes that should be classified as hard bounces?
   - Recommendation: Verify against Resend's webhook event docs during setup. Test with `bounced@resend.dev` (Resend's built-in bounce test address, confirmed in Context7).

3. **`NEXT_PUBLIC_SITE_URL` availability for unsubscribe URL construction**
   - What we know: The existing `.env.example` does not yet include `NEXT_PUBLIC_SITE_URL`.
   - What's unclear: Should Phase 4 add this env var, or hardcode `https://useQuibly.com` with a dev override?
   - Recommendation: Add `NEXT_PUBLIC_SITE_URL=https://useQuibly.com` to `.env.example` in Wave 0 (Phase 5 may need it for canonical URLs too). Fallback to hardcoded value avoids another env var crash during early development.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | `crypto.subtle`, Resend SDK, Upstash | ✓ | 24.7.0 [VERIFIED: node --version] | — |
| npm | Package installation | ✓ | 11.5.1 [VERIFIED: npm --version] | — |
| `resend` package | All Resend API calls | NOT YET INSTALLED | — | Install in Wave 0 |
| `@react-email/components` | Welcome email template | NOT YET INSTALLED | — | Install in Wave 0 |
| `@upstash/ratelimit` | SPAM-03 rate limiting | NOT YET INSTALLED | — | Install in Wave 0 |
| `@upstash/redis` | SPAM-03 (Upstash Redis client) | NOT YET INSTALLED | — | Install in Wave 0 |
| Upstash Redis instance | Rate limit state | Unknown — env vars in `.env.example` but not `.env.local` | — | Create free Upstash Redis instance; add env vars |
| Resend audience (production) | STORE-01 | Unknown — needs dashboard creation | — | Create in Resend Dashboard |
| Resend audience (preview) | STORE-01 | Unknown — needs dashboard creation | — | Create in Resend Dashboard |
| `RESEND_FROM_POSTAL_ADDRESS` | EMAIL-05, WelcomeEmail | NOT YET SET (D-10 blocker) | — | Placeholder value for dev; hard blocks production merge |

**Missing dependencies with no fallback:** None (all have install/create paths)

**Missing dependencies with fallback:**
- `RESEND_FROM_POSTAL_ADDRESS`: Dev proceeds with placeholder `YOUR-POSTAL-ADDRESS-HERE`; production merge blocked until real address supplied

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.5 + `@testing-library/react` 16.3.2 + `happy-dom` 20.9.0 |
| Config file | `vitest.config.ts` (exists, no changes needed for Phase 4) |
| Quick run command | `npm run test:unit` |
| Full suite command | `npm run test:unit && npm run test:e2e` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SPAM-03 | Rate-limit rejects 6th submission in 1 min (silent success) | unit | `npm run test:unit -- --reporter=verbose` | ❌ Wave 0: add to `join-waitlist-action.test.ts` |
| SPAM-04 | Disposable-domain returns silent success | unit | `npm run test:unit` | ❌ Wave 0: add to `join-waitlist-action.test.ts` + new `disposable-domains.test.ts` |
| EMAIL-01 | Welcome email fires on successful signup (mocked) | unit | `npm run test:unit` | ❌ Wave 0: add to `join-waitlist-action.test.ts` |
| EMAIL-08 | `track('welcome_email_send_error')` on send failure | unit | `npm run test:unit` | ❌ Wave 0: add to `join-waitlist-action.test.ts` |
| EMAIL-09 | Webhook handler: valid payload → bounce/complained logic | unit | `npm run test:unit` | ❌ Wave 0: new `tests/unit/webhook-handler.test.ts` |
| EMAIL-09 | Webhook handler: invalid signature → 401 | unit | `npm run test:unit` | ❌ Wave 0: new `tests/unit/webhook-handler.test.ts` |
| STORE-03 | `contacts.create` called with `audienceId` + `properties` | unit | `npm run test:unit` | ❌ Wave 0: add to `join-waitlist-action.test.ts` |
| STORE-04 | `consent_version` is non-empty string | unit | `npm run test:unit` | ❌ Wave 0: add to `join-waitlist-action.test.ts` |
| D-05 | Duplicate: contacts.create error → no email send | unit | `npm run test:unit` | ❌ Wave 0: add to `join-waitlist-action.test.ts` |
| EMAIL-03 | `List-Unsubscribe-Post` header present in send call | unit | `npm run test:unit` | ❌ Wave 0: add to `join-waitlist-action.test.ts` |
| STORE-05 | CSV export round-trip | manual | Manual checkpoint | N/A |
| EMAIL-03 | Headers visible in Gmail "Show Original" | manual | Inbox test | N/A |

### Sampling Rate

- **Per task commit:** `npm run test:unit`
- **Per wave merge:** `npm run test:unit && npm run test:e2e`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/unit/join-waitlist-action.test.ts` — migrate stub-branch tests to `vi.mock('@/lib/resend')` + add SPAM-03, SPAM-04, STORE-03, STORE-04, EMAIL-01/08, D-05, EMAIL-03 branches
- [ ] `tests/unit/disposable-domains.test.ts` — unit test `isDisposableDomain()` helper
- [ ] `tests/unit/webhook-handler.test.ts` — tests for `POST /api/webhooks/resend`: valid bounce (hard/soft), valid complaint, invalid signature → 401
- [ ] `package.json` devDependencies — no new test deps needed (Vitest + RTL already installed)
- [ ] Install new runtime deps: `npm install resend@^6.12 @react-email/components@^1.0 @upstash/ratelimit@^2.0 @upstash/redis@^1.37`

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No user auth in Phase 4 |
| V3 Session Management | No | No sessions |
| V4 Access Control | Yes — webhook endpoint | Signature verification via `resend.webhooks.verify()` (svix HMAC) |
| V5 Input Validation | Yes | Zod + disposable-domain + rate-limit (already in pipeline) |
| V6 Cryptography | Yes — unsubscribe token | `crypto.subtle` HMAC-SHA256 (Node built-in; never hand-roll) |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Webhook replay attack | Spoofing | svix `svix-timestamp` checked against current time window (handled by `resend.webhooks.verify()`) |
| Mass unsubscribe via guessable contact IDs | Tampering | HMAC-signed token; timing-safe compare |
| Resend API key exposure | Information Disclosure | `import 'server-only'` + restricted key scope + `gitleaks` pre-commit hook (already configured) |
| Form spam poisoning audience | Tampering | Honeypot + time-trap + disposable-domain + rate-limit (layered defense) |
| Webhook endpoint abuse (non-Resend POSTs) | Tampering | 401 on invalid signature before any processing |
| Email enumeration via "already subscribed" response | Information Disclosure | D-05 returns identical `{ status: 'success' }` regardless of duplicate status |

---

## Sources

### Primary (HIGH confidence)
- Context7 `/websites/resend` — `contacts.create` (with `audienceId`, `properties`), `contacts.update` (PATCH by email), `emails.send` (with `headers:`, `react:` prop), `webhooks.verify` (svix headers: `svix-id`, `svix-timestamp`, `svix-signature`), webhook event payloads (`email.bounced` with `data.bounce.type`, `email.complained`)
- Context7 `/websites/upstash_redis_sdks_ratelimit-` — `Ratelimit.slidingWindow()`, `Redis.fromEnv()`, `limit()` return shape, serverless environment notes
- `/Users/jeff/repos/quibly-landing/app/actions/join-waitlist.ts` — Phase 3 stub (existing honeypot/time-trap/Zod to preserve)
- `/Users/jeff/repos/quibly-landing/lib/env.ts` — existing env vars confirmed (all Phase 4 env vars already enumerated)
- `/Users/jeff/repos/quibly-landing/.env.example` — env var names confirmed
- `/Users/jeff/repos/marketing-app/lib/email/client.ts` — Resend singleton + `import 'server-only'` pattern reference
- `/Users/jeff/repos/marketing-app/emails/WelcomeEmail.tsx` — React Email layout reference (teal header strip, Container, Body, Hr, footer inline style patterns)
- `npm view resend version` → `6.12.2` [VERIFIED]
- `npm view @react-email/components version` → `1.0.12` [VERIFIED]
- `npm view @upstash/ratelimit version` → `2.0.8` [VERIFIED]
- `npm view @upstash/redis version` → `1.37.0` [VERIFIED]

### Secondary (MEDIUM confidence)
- `.planning/research/PITFALLS.md` — Pitfall 1 (List-Unsubscribe-Post RFC 8058), Pitfall 4 (API key exposure), Pitfall 5 (duplicate handling), integration gotchas table
- `.planning/research/ARCHITECTURE.md` — action pipeline, server-action boundary rule
- `.planning/research/SUMMARY.md` — Conflict #3 (fire-and-forget), bot protection decisions
- `.planning/phases/04-resend-wiring-bot-protection-welcome-email/04-CONTEXT.md` — all locked decisions and discretion areas
- `.planning/phases/04-resend-wiring-bot-protection-welcome-email/04-UI-SPEC.md` — email template design contract (teal `#0D9488`, hex palette, spacing)

### Tertiary (LOW confidence — needs runtime validation)
- Resend duplicate-contact response shape — requires Phase 4 day-1 probe (5 min)
- `email.bounced` bounce subtype values — verify against Resend docs + `bounced@resend.dev` test
- CSV export preserves `consent_version` custom property — verify during STORE-05 checkpoint

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all package versions verified via npm registry; APIs confirmed via Context7
- Architecture: HIGH — action pipeline, webhook handler, unsubscribe route all have verified API signatures
- Pitfalls: HIGH — verified from multiple prior research phases + Context7 docs
- Duplicate contact handling: MEDIUM — response shape not in public docs; D-06 fallback is safe

**Research date:** 2026-04-28
**Valid until:** 2026-05-28 (30 days; Resend API is stable)
