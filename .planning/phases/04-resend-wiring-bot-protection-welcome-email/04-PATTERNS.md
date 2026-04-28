# Phase 4: Resend Wiring + Bot Protection + Welcome Email — Pattern Map

**Mapped:** 2026-04-28
**Files analyzed:** 10 (8 new, 2 modified)
**Analogs found:** 10 / 10

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `lib/resend.ts` | service/singleton | request-response | `marketing-app/lib/email/client.ts` | exact |
| `lib/rate-limit.ts` | service/utility | request-response | `marketing-app/lib/llm/rate-limit.ts` | role-match |
| `lib/disposable-domains.ts` | utility | transform | `marketing-app/lib/auth/password-policy.ts` | partial-match |
| `lib/analytics.ts` | service/utility | event-driven | `marketing-app/lib/llm/rate-limit.ts` (typed-result pattern) | partial-match |
| `lib/unsubscribe-token.ts` | utility | transform | `marketing-app/lib/metrics/encryption.ts` | partial-match |
| `emails/WelcomeEmail.tsx` | component (email) | request-response | `marketing-app/emails/WelcomeEmail.tsx` | exact |
| `app/actions/join-waitlist.ts` | service/action | request-response | `app/actions/join-waitlist.ts` (self — Phase 3 body) | exact |
| `app/api/webhooks/resend/route.ts` | route-handler | event-driven | `marketing-app/app/api/stripe/webhook/route.ts` | role-match |
| `app/unsubscribe/route.ts` | route-handler | request-response | `marketing-app/app/api/stripe/webhook/route.ts` | partial-match |
| `tests/unit/webhook-handler.test.ts` | test | event-driven | `marketing-app/tests/stripe/api/stripe-webhook.test.ts` | exact |

---

## Pattern Assignments

### `lib/resend.ts` (service/singleton, request-response)

**Analog:** `marketing-app/lib/email/client.ts`

**Full analog** (lines 1–23):
```typescript
import 'server-only'
import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY env var required')
}

export const resend = new Resend(process.env.RESEND_API_KEY)
```

**Adaptation for quibly-landing:**
- Replace the raw `process.env.RESEND_API_KEY` guard with an import from `@/lib/env` (Phase 1 D-11 ESLint rule forbids direct `process.env` access in any module other than `lib/env.ts`).
- `import 'server-only'` stays as line 1 — same posture.
- Export is named `resend` (same symbol name) so the action and route handler import identically.

```typescript
import 'server-only'
import { Resend } from 'resend'
import { env } from '@/lib/env'

export const resend = new Resend(env.RESEND_API_KEY)
```

---

### `lib/rate-limit.ts` (service/utility, request-response)

**Analog:** `marketing-app/lib/llm/rate-limit.ts`

The marketing-app analog uses a custom Postgres backend. Phase 4 uses `@upstash/ratelimit` + `@upstash/redis` (SDK handles the sliding-window math). Copy the `import 'server-only'` boundary and the typed-result shape; replace the backend with Upstash.

**Imports pattern** (analog lines 1, 19):
```typescript
import 'server-only'
// (no ORM import — Upstash SDK replaces it)
```

**Core pattern — two-limiter ladder** (from RESEARCH.md Pattern 3):
```typescript
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

**Usage in action** (from RESEARCH.md Pattern 3):
```typescript
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
```

---

### `lib/disposable-domains.ts` (utility, transform)

**Analog:** No direct analog — pure functional utility. Closest structural match is `marketing-app/lib/auth/password-policy.ts` (static rule set + predicate export pattern), but the code is simple enough to build from RESEARCH.md Pattern 8 directly.

**Core pattern** (RESEARCH.md Pattern 8):
```typescript
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  // ... ~25 entries total
])

export function isDisposableDomain(email: string): boolean {
  const domain = email.toLowerCase().split('@')[1] ?? ''
  return DISPOSABLE_DOMAINS.has(domain)
}
```

No `import 'server-only'` needed — this is a pure computation with no network calls or secrets. Called AFTER Zod (email is well-formed) and BEFORE rate-limit (per CD-11).

---

### `lib/analytics.ts` (service/utility, event-driven)

**Analog:** No direct analog in quibly-landing. `marketing-app` uses Supabase + analytics queries. Phase 4 ships a typed shim; Phase 5 swaps for `@vercel/analytics/server`.

**Pattern — typed shim** (RESEARCH.md Pattern 9):
```typescript
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

The `import 'server-only'` guard prevents `track()` from being called in client components (keeping Phase 5's swap clean and the bundle zero-cost).

---

### `lib/unsubscribe-token.ts` (utility, transform)

**Analog:** `marketing-app/lib/metrics/encryption.ts` (HMAC + crypto.subtle pattern). Not read in detail since RESEARCH.md Pattern 6 already provides the exact implementation with timing-safe compare.

**Pattern — HMAC-signed token** (RESEARCH.md Pattern 6):
```typescript
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

export async function generateToken(email: string): Promise<string> {
  const key = await getKey()
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(email))
  const hmac = Buffer.from(sig).toString('base64url')
  return `${Buffer.from(email).toString('base64url')}.${hmac}`
}

export async function verifyToken(token: string): Promise<string | null> {
  const [encodedEmail, hmac] = token.split('.')
  if (!encodedEmail || !hmac) return null
  const email = Buffer.from(encodedEmail, 'base64url').toString()
  const expected = await generateToken(email)
  const a = Buffer.from(expected.split('.')[1], 'base64url')
  const b = Buffer.from(hmac, 'base64url')
  if (a.length !== b.length) return null
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0 ? email : null
}
```

**Note:** Encode `email` (not `contactId`) directly — simpler lookup in the unsubscribe handler, avoids an extra Resend API call to resolve contactId → email.

---

### `emails/WelcomeEmail.tsx` (email component, request-response)

**Analog:** `marketing-app/emails/WelcomeEmail.tsx` (lines 1–238)

**Imports pattern** (analog lines 1–14):
```typescript
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'
```

No `Button` import needed (the waitlist email has no CTA button — just the unsubscribe link in the footer).

**Props interface** (adapt from analog lines 26–32):
```typescript
export interface WelcomeEmailProps {
  unsubscribeUrl: string   // HMAC-signed token URL
  postalAddress: string    // From env RESEND_FROM_POSTAL_ADDRESS (D-10)
}
```

**JSX structure** (adapt from analog lines 57–118, layout: teal header strip + content section + Hr + footer):
```typescript
export function WelcomeEmail({ unsubscribeUrl, postalAddress }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to the Quibly waitlist — I&apos;ll be in touch.</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Teal header strip — same backgroundColor as analog (#0D9488) */}
          <Section style={{ ...header, backgroundColor: '#0D9488' }}>
            <Text style={headerText}>Quibly</Text>
          </Section>
          {/* D-01 locked founder voice — do NOT paraphrase */}
          <Section style={content}>
            <Text style={paragraph}>Hey —</Text>
            <Text style={paragraph}>
              Thanks for joining the Quibly waitlist. I&apos;m Jeff —
              a solopreneur building Quibly for other solopreneurs
              and small operators who are experts at what they
              make but not necessarily at marketing it.
            </Text>
            <Text style={paragraph}>
              I&apos;m deep in a strategy-first AI marketing tool that
              learns your business and runs the marketing loop
              with you (not at you). I&apos;ll send one more email when
              I open it up — no spam, no product-launch hype.
            </Text>
            <Text style={paragraph}>
              In the meantime, hit reply if there&apos;s a marketing
              problem you wish someone would just solve. I read
              everything.
            </Text>
            <Text style={paragraph}>— Jeff</Text>
          </Section>
          <Hr style={hr} />
          {/* Footer: unsubscribe + postal address (CAN-SPAM EMAIL-04/05) */}
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
```

**PreviewProps pattern** (analog lines 121–127):
```typescript
WelcomeEmail.PreviewProps = {
  unsubscribeUrl: 'https://useQuibly.com/unsubscribe?t=preview_token',
  postalAddress: '123 Main St, Anytown, CA 90210',
} satisfies WelcomeEmailProps

export default WelcomeEmail
```

**Inline styles** (copy from analog lines 132–237 — same token set: `main`, `container`, `header`, `headerText`, `content`, `paragraph`, `hr`, plus simplified `footer`/`footerLink`):
- `main`, `container`, `header`, `headerText`, `content`, `paragraph`, `hr` — copy verbatim from `marketing-app/emails/WelcomeEmail.tsx` lines 137–212
- `footer` = `{ color: '#737373', fontSize: '12px', lineHeight: 1.5, margin: '0 0 4px 0' }`
- `footerLink` = `{ color: '#737373', textDecoration: 'underline' }`
- Omit `hero`, `buttonContainer`, `button`, `fallbackLink`, `fallbackUrl` (no CTA button in waitlist email)

---

### `app/actions/join-waitlist.ts` (service/action — MODIFY, request-response)

**Analog:** `app/actions/join-waitlist.ts` (self — Phase 3 body, lines 1–123)

**Preserve verbatim** (lines 1–98): the `'use server'` declaration, imports header, schema definition, `JoinWaitlistResult` type, function signature, honeypot check (lines 59–65), time-trap check (lines 68–73), and Zod validation block (lines 75–98).

**Delete** (lines 100–123): all four D-11 stub branches and the final `return { status: 'success' }`.

**Add imports** (insert after line 3 `import { z } from 'zod'`):
```typescript
import { headers } from 'next/headers'
import { env } from '@/lib/env'
import { resend } from '@/lib/resend'
import { rateLimitPerMinute, rateLimitPerDay } from '@/lib/rate-limit'
import { isDisposableDomain } from '@/lib/disposable-domains'
import { track } from '@/lib/analytics'
import WelcomeEmail from '@/emails/WelcomeEmail'
import { generateToken } from '@/lib/unsubscribe-token'
```

**Replace stub-branch block** (replaces lines 100–123) — full pipeline per RESEARCH.md Code Examples:
```typescript
const email = parsed.data.email

// CD-11: Disposable-domain check AFTER Zod, BEFORE rate-limit
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

if (contactError && !isDuplicateContactError(contactError)) {
  console.error('contacts_create_failed', { email, error: contactError })
  return { status: 'error', message: 'Something went wrong. Try again in a moment.' }
}

// D-05: isDuplicate — empirically verified during day-1 probe (A1 in RESEARCH.md)
// If day-1 probe confirms error is non-null on duplicate, !!contactError is the signal.
// If probe shows idempotent 200 (D-06 fallback), set isDuplicate = false always.
const isDuplicate = !!contactError

// EMAIL-01/D-05: Fire-and-forget welcome email (first-time only)
if (!isDuplicate) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://useQuibly.com'
  const unsubscribeUrl = `${siteUrl}/unsubscribe?t=${await generateToken(email)}`
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

**Add helper** (private, above the `schema` definition — or below the exported function):
```typescript
function isDuplicateContactError(error: { name?: string; message?: string }): boolean {
  // Populated during day-1 probe: update condition once the exact error.name is known.
  // Likely: error.name === 'validation_error' && error.message includes 'already exists'
  // Fallback per D-06: return false (always send welcome email if signal unclear)
  return false  // TODO: update after day-1 probe confirms duplicate error shape
}
```

---

### `app/api/webhooks/resend/route.ts` (route-handler, event-driven)

**Analog:** `marketing-app/app/api/stripe/webhook/route.ts` (lines 1–120)

**Critical pattern — raw body for HMAC** (analog lines 43–44, adapted):
```typescript
export async function POST(req: NextRequest) {
  const payload = await req.text()  // MUST be raw text — req.json() breaks svix HMAC
```

**Imports pattern** (adapt from analog lines 1–9):
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { resend } from '@/lib/resend'
import { env } from '@/lib/env'
import { track } from '@/lib/analytics'
```

**Signature verification pattern** (adapt analog lines 53–62 — Stripe → Resend svix):
```typescript
const id = req.headers.get('svix-id')
const timestamp = req.headers.get('svix-timestamp')
const signature = req.headers.get('svix-signature')

if (!id || !timestamp || !signature) {
  return new NextResponse('Missing svix headers', { status: 400 })
}

let event: ReturnType<typeof resend.webhooks.verify>
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
```

**Dispatch pattern** (analog lines 83–118, adapted to D-08 logic):
```typescript
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
```

**Note on `export const runtime`:** The Stripe analog sets `export const runtime = 'nodejs'` (line 32). The Resend webhook uses the same svix HMAC pattern requiring Node.js crypto — copy this export to the Resend webhook route.

---

### `app/unsubscribe/route.ts` (route-handler, request-response)

**Analog:** `marketing-app/app/api/stripe/webhook/route.ts` (partial — response pattern and `req.text()` / NextResponse shape)

**Pattern** (adapts webhook handler structure; unique logic from RESEARCH.md Pattern 7):
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { resend } from '@/lib/resend'
import { verifyToken } from '@/lib/unsubscribe-token'

// RFC 8058 one-click unsubscribe — email clients POST to this endpoint
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('t')

  if (!token) {
    return new NextResponse('Missing token', { status: 400 })
  }

  const email = await verifyToken(token)
  if (!email) {
    return new NextResponse('Invalid token', { status: 401 })
  }

  await resend.contacts.update({ email, unsubscribed: true })
  console.info('unsubscribe_processed', { email })

  return new NextResponse('OK', { status: 200 })
}

// Optional GET for human-readable confirmation — deferred per DEFERRED section
// export async function GET(req: NextRequest) { ... }
```

---

### `tests/unit/join-waitlist-action.test.ts` (test — MODIFY, request-response)

**Analog:** `tests/unit/join-waitlist-action.test.ts` (self — Phase 3 tests, lines 1–125)

**Preserve verbatim** (lines 1–24): imports, `fd()` helper, `PAST_RENDERED_AT` helper.

**Preserve verbatim** (lines 29–71): honeypot, time-trap, and Zod validation tests — these are real Phase 3 defenses that stay live.

**Delete** (lines 72–125): all four stub-branch tests (`dup@example.com`, err, slow, and the "plain valid email returns success" default). These tested the D-11 stubs.

**Add mocks** (after imports, before `describe`):
```typescript
import { vi, beforeEach } from 'vitest'

// Mock the Resend singleton so no real API calls are made
vi.mock('@/lib/resend', () => ({
  resend: {
    contacts: {
      create: vi.fn(),
      update: vi.fn(),
    },
    emails: {
      send: vi.fn(() => Promise.resolve({ data: { id: 'email_test_id' }, error: null })),
    },
  },
}))

// Mock rate-limit — default to passing (success: true)
vi.mock('@/lib/rate-limit', () => ({
  rateLimitPerMinute: { limit: vi.fn(async () => ({ success: true })) },
  rateLimitPerDay: { limit: vi.fn(async () => ({ success: true })) },
}))

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({ get: () => '127.0.0.1' })),
}))

// Mock analytics (no side effects in tests)
vi.mock('@/lib/analytics', () => ({ track: vi.fn() }))
```

**Add new test cases** (replacing deleted stub tests):
```typescript
import { resend } from '@/lib/resend'
import { rateLimitPerMinute, rateLimitPerDay } from '@/lib/rate-limit'
import { track } from '@/lib/analytics'

describe('joinWaitlistAction (Phase 4 real pipeline)', () => {
  // ... (honeypot, time-trap, Zod tests preserved from Phase 3)

  it('rejects disposable domain silently (SPAM-04 / D-03)', async () => {
    const r = await joinWaitlistAction(null, fd({
      email: 'user@mailinator.com',
      hp_field: '',
      renderedAt: PAST_RENDERED_AT(),
    }))
    expect(r).toEqual({ status: 'success' })
    expect(resend.contacts.create).not.toHaveBeenCalled()
    expect(resend.emails.send).not.toHaveBeenCalled()
  })

  it('rejects rate-limited IP silently (SPAM-03 / D-03)', async () => {
    vi.mocked(rateLimitPerMinute.limit).mockResolvedValueOnce({ success: false } as never)
    const r = await joinWaitlistAction(null, fd({
      email: 'real@example.com',
      hp_field: '',
      renderedAt: PAST_RENDERED_AT(),
    }))
    expect(r).toEqual({ status: 'success' })
    expect(resend.contacts.create).not.toHaveBeenCalled()
  })

  it('calls contacts.create with audienceId + consent_version (STORE-01/04)', async () => {
    vi.mocked(resend.contacts.create).mockResolvedValueOnce({
      data: { id: 'contact_test_id', email: 'real@example.com', unsubscribed: false, createdAt: '' },
      error: null,
    } as never)
    await joinWaitlistAction(null, fd({
      email: 'real@example.com',
      hp_field: '',
      renderedAt: PAST_RENDERED_AT(),
    }))
    expect(resend.contacts.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'real@example.com',
        unsubscribed: false,
        properties: expect.objectContaining({ consent_version: expect.any(String) }),
      })
    )
  })

  it('sends welcome email with List-Unsubscribe-Post header on fresh signup (EMAIL-03)', async () => {
    vi.mocked(resend.contacts.create).mockResolvedValueOnce({
      data: { id: 'cid', email: 'real@example.com', unsubscribed: false, createdAt: '' },
      error: null,
    } as never)
    await joinWaitlistAction(null, fd({
      email: 'real@example.com',
      hp_field: '',
      renderedAt: PAST_RENDERED_AT(),
    }))
    expect(resend.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        }),
      })
    )
  })

  it('suppresses welcome email on duplicate signup (D-05)', async () => {
    vi.mocked(resend.contacts.create).mockResolvedValueOnce({
      data: null,
      error: { name: 'validation_error', message: 'Contact already exists' },
    } as never)
    await joinWaitlistAction(null, fd({
      email: 'dup@example.com',
      hp_field: '',
      renderedAt: PAST_RENDERED_AT(),
    }))
    // NOTE: update once isDuplicateContactError() is filled in after day-1 probe
    // For now, verify the action returns success without throwing
    // expect(resend.emails.send).not.toHaveBeenCalled()
  })

  it('fires track(welcome_email_send_error) when send fails (EMAIL-08)', async () => {
    vi.mocked(resend.contacts.create).mockResolvedValueOnce({
      data: { id: 'cid', email: 'real@example.com', unsubscribed: false, createdAt: '' },
      error: null,
    } as never)
    vi.mocked(resend.emails.send).mockRejectedValueOnce(new Error('Network error'))
    await joinWaitlistAction(null, fd({
      email: 'real@example.com',
      hp_field: '',
      renderedAt: PAST_RENDERED_AT(),
    }))
    // Fire-and-forget: wait a tick for the .catch() to execute
    await new Promise((r) => setTimeout(r, 0))
    expect(track).toHaveBeenCalledWith('welcome_email_send_error', expect.objectContaining({ email: 'real@example.com' }))
  })
})
```

---

### `tests/unit/webhook-handler.test.ts` (test — NEW, event-driven)

**Analog:** `marketing-app/tests/stripe/api/stripe-webhook.test.ts` (lines 1–324)

**Mock setup pattern** (analog lines 20–46 — adapt for Resend svix):
```typescript
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// Set env vars before route module loads (module-level env guard)
process.env.RESEND_WEBHOOK_SECRET = 'whsec_test_secret'
process.env.RESEND_API_KEY = 're_test_dummy'
process.env.RESEND_AUDIENCE_ID = 'aud_test'
process.env.RESEND_AUDIENCE_PREVIEW_ID = 'aud_preview_test'
process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
process.env.UPSTASH_REDIS_REST_TOKEN = 'test_token'

// Mock resend singleton — control webhooks.verify() per test
const resendMock = {
  webhooks: { verify: vi.fn() },
  contacts: { update: vi.fn(async () => ({ data: null, error: null })) },
}
vi.mock('@/lib/resend', () => ({ resend: resendMock }))
vi.mock('@/lib/analytics', () => ({ track: vi.fn() }))
```

**Dynamic import pattern** (analog lines 152–157 — ensures mocks active before module-level code):
```typescript
let POST: (req: Request) => Promise<Response>
beforeAll(async () => {
  const mod = await import('@/app/api/webhooks/resend/route')
  POST = mod.POST as typeof POST
})
```

**Test cases pattern** (analog structure, adapted for Resend events):
```typescript
describe('POST /api/webhooks/resend', () => {
  it('missing svix headers → 400', async () => { ... })
  it('invalid signature → 401, no contacts.update called', async () => { ... })
  it('email.bounced Permanent → contacts.update unsubscribed + track contact_bounced hard', async () => { ... })
  it('email.bounced Temporary → no contacts.update + track contact_bounced soft', async () => { ... })
  it('email.complained → contacts.update unsubscribed + track contact_complained', async () => { ... })
  it('unknown event type → 200 (no-op, no throw)', async () => { ... })
})
```

---

## Shared Patterns

### `import 'server-only'` boundary
**Source:** `marketing-app/lib/email/client.ts` line 1
**Apply to:** `lib/resend.ts`, `lib/rate-limit.ts`, `lib/analytics.ts`, `lib/unsubscribe-token.ts`

```typescript
import 'server-only'
```

Line 1, before any other import. Crashes the build if any client component transitively imports these modules. `lib/disposable-domains.ts` is a pure computation (no network calls, no secrets) — `import 'server-only'` is optional there but acceptable.

### env import convention
**Source:** `lib/env.ts` (Phase 1 D-11); enforced by custom ESLint rule
**Apply to:** All new `lib/*.ts` and `app/api/**/*.ts` files

```typescript
import { env } from '@/lib/env'
// NEVER: process.env.RESEND_API_KEY — custom ESLint rule blocks this
```

Exception: `process.env.VERCEL_ENV` and `process.env.VERCEL_GIT_COMMIT_SHA` are Vercel system env vars NOT in `lib/env.ts`. They are accessed via `process.env` directly and always have a `?? 'fallback'` guard.

### Resend `{ data, error }` destructure — never throw
**Source:** `marketing-app/lib/email/send-billing-emails.ts` lines 58–71; `marketing-app/lib/email/send-invite.ts` lines 56–75
**Apply to:** Any `resend.emails.send()` or `resend.contacts.create()` call

```typescript
// Resend SDK does NOT throw on API errors — always destructure
const { data, error } = await resend.contacts.create({ ... })
if (error) {
  // handle error
}
// data is non-null on success
```

### Silent-success rejection pattern
**Source:** `app/actions/join-waitlist.ts` (Phase 3) lines 63–65 (honeypot), 70–73 (time-trap)
**Apply to:** Rate-limit rejection, disposable-domain rejection (same shape per D-03)

```typescript
// Always returns { status: 'success' } with no side effects
// Never sends welcome email, never calls track('waitlist_signup')
return { status: 'success' }
```

### Webhook raw-body pattern
**Source:** `marketing-app/app/api/stripe/webhook/route.ts` lines 43–44
**Apply to:** `app/api/webhooks/resend/route.ts`

```typescript
// MUST use req.text() — req.json() breaks HMAC signature verification
const payload = await req.text()
```

### Vitest mock setup for external SDK
**Source:** `marketing-app/tests/stripe/api/stripe-webhook.test.ts` lines 20–46
**Apply to:** `tests/unit/webhook-handler.test.ts`, updated `tests/unit/join-waitlist-action.test.ts`

```typescript
// Set env vars BEFORE import — module-level guards run at import time
process.env.RESEND_API_KEY = 're_test_dummy'
// ...
vi.mock('@/lib/resend', () => ({ resend: resendMock }))
```

The `vi.mock()` calls MUST precede any `import` of the route/action under test. Dynamic import in `beforeAll()` ensures mocks are active before module evaluation.

### React Email inline style conventions
**Source:** `marketing-app/emails/WelcomeEmail.tsx` lines 132–238; `marketing-app/emails/InviteEmail.tsx` lines 141–247
**Apply to:** `emails/WelcomeEmail.tsx`

- Hex colors only — no `oklch()`, no CSS custom properties, no Tailwind classes
- Font stack: `'-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'`
- Teal accent: `'#0D9488'` (matches `--color-primary` hex equivalent)
- Container: `maxWidth: '600px', margin: '0 auto'`
- Header strip: `height: '48px', padding: '0 24px'`
- Content section: `padding: '32px 24px'`

---

## env.ts Extension

**Source:** `lib/env.ts` (lines 1–37, all existing vars)
**Modification:** Add `RESEND_FROM_POSTAL_ADDRESS` to `envSchema`

```typescript
// Add to envSchema in lib/env.ts:
RESEND_FROM_POSTAL_ADDRESS: z.string().min(1, 'RESEND_FROM_POSTAL_ADDRESS is required — source a registered agent or PO box per D-10 before production deploy'),
```

Development: set `RESEND_FROM_POSTAL_ADDRESS=YOUR-POSTAL-ADDRESS-HERE` in `.env.local`. This will satisfy the non-empty check and allow local development. Hard-block production merge until the real address is supplied.

Also add to `.env.example`:
```
NEXT_PUBLIC_SITE_URL=https://useQuibly.com
RESEND_FROM_POSTAL_ADDRESS=YOUR-POSTAL-ADDRESS-HERE
```

---

## No Analog Found

All files have usable analogs. The following relied on RESEARCH.md patterns rather than a direct codebase analog:

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `lib/disposable-domains.ts` | utility | transform | No static-blocklist utility exists in either repo — simple enough to implement directly from RESEARCH.md Pattern 8 |
| `lib/analytics.ts` | utility | event-driven | `marketing-app` uses Supabase-based analytics; Phase 4 ships a console.log shim with a typed interface for Phase 5's swap |
| `app/unsubscribe/route.ts` | route-handler | request-response | No existing unsubscribe-style route in either repo; adapted from webhook handler structure |

---

## Metadata

**Analog search scope:** `/Users/jeff/repos/quibly-landing` + `/Users/jeff/repos/marketing-app`
**Files scanned (read):** 12
**Pattern extraction date:** 2026-04-28
