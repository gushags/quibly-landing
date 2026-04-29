import { NextRequest, NextResponse } from 'next/server'
import { resend } from '@/lib/resend'
import { env } from '@/lib/env'
import { track } from '@/lib/analytics'

/**
 * Phase 4 — Resend webhook handler (EMAIL-09).
 *
 * Receives `email.bounced` and `email.complained` events from Resend's webhook
 * pipeline. Verifies svix-style HMAC signature (resend.webhooks.verify wraps the
 * svix library) BEFORE any side effect; rejects with 401 on signature mismatch.
 *
 * D-08 dispatch:
 *   - email.bounced + bounce.type === 'Permanent' (hard bounce):
 *       → resend.contacts.update({ audienceId, email, unsubscribed: true })
 *       → console.error + track('contact_bounced', { kind: 'hard' })
 *   - email.bounced + bounce.type !== 'Permanent' (soft bounce — Resend uses 'Transient'
 *     per SES nomenclature; the SDK types `bounce.type` as `string`, so we treat any
 *     non-Permanent value as soft and log the actual value for empirical confirmation):
 *       → log only; do NOT mutate contact (may succeed on retry)
 *       → track('contact_bounced', { kind: 'soft' })
 *   - email.complained (spam-marked):
 *       → resend.contacts.update({ audienceId, email, unsubscribed: true })  — Gmail >0.3% threshold
 *       → console.error + track('contact_complained')
 *   - any other event type: 200 OK with no side effect (forward-compatibility)
 *
 * Pitfall 2 (RESEARCH): MUST use req.text() — req.json() breaks svix HMAC because
 * JSON.stringify(parsed) does not produce the same byte sequence as the original payload.
 */

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // 1. Raw body — required for HMAC verification.
  const payload = await req.text()

  // 2. Required svix headers.
  const id = req.headers.get('svix-id')
  const timestamp = req.headers.get('svix-timestamp')
  const signature = req.headers.get('svix-signature')

  if (!id || !timestamp || !signature) {
    console.warn('webhook_missing_svix_headers', { hasId: !!id, hasTimestamp: !!timestamp, hasSignature: !!signature })
    return new NextResponse('Missing svix headers', { status: 400 })
  }

  // 3. Verify signature — throws on invalid/replay/missing-secret.
  let event: ResendWebhookEvent
  try {
    event = resend.webhooks.verify({
      payload,
      headers: { id, timestamp, signature },
      webhookSecret: env.RESEND_WEBHOOK_SECRET,
    }) as ResendWebhookEvent
  } catch (err) {
    console.error('webhook_signature_invalid', { err: err instanceof Error ? err.message : String(err) })
    return new NextResponse('Invalid signature', { status: 401 })
  }

  // CR-04: extract recipient ONCE up front and guard before any dispatch. Previously the
  // empty-recipient case fell through to a no-op `track('contact_bounced', { kind: 'hard' })`
  // — the analytics event reported a bounce but no remediation happened (silent data loss).
  // Bounce + complaint events without a recipient are malformed; return 4xx so Resend stops
  // retrying, and skip the track call (no contact = no remediation to report).
  const recipientEmail = event.data?.to?.[0] ?? ''
  const isContactEvent = event.type === 'email.bounced' || event.type === 'email.complained'
  if (isContactEvent && !recipientEmail) {
    console.error('webhook_missing_recipient', {
      eventType: event.type,
      eventData: event.data,
    })
    return new NextResponse('Missing recipient', { status: 400 })
  }

  // CR-01: audience routing must mirror app/actions/join-waitlist.ts:142. Resend SDK falls
  // back to the global /contacts/:email endpoint when audienceId is omitted — that endpoint
  // does NOT flip the audience-scoped contact, so omitting audienceId silently leaves the
  // hard-bounced contact subscribed and we keep mailing them, accruing reputation damage.
  // eslint-disable-next-line custom/no-raw-process-env -- Vercel system env var (per PATTERNS.md exception)
  const audienceId = process.env.VERCEL_ENV === 'production'
    ? env.RESEND_AUDIENCE_ID
    : env.RESEND_AUDIENCE_PREVIEW_ID

  // 4. Dispatch per D-08.
  if (event.type === 'email.bounced') {
    const bounceType = event.data?.bounce?.type
    if (bounceType === 'Permanent') {
      // CR-02: inspect { error } envelope. Resend SDK does NOT throw — silent failures here
      // leave hard-bounced contacts subscribed. Return 5xx so Resend retries the webhook.
      const { error: updateError } = await resend.contacts.update({
        audienceId,
        email: recipientEmail,
        unsubscribed: true,
      })
      if (updateError) {
        console.error('webhook_update_failed', {
          email: recipientEmail,
          eventType: event.type,
          error: updateError,
        })
        return new NextResponse('Update failed', { status: 500 })
      }
      console.error('email_hard_bounced', { email: recipientEmail, bounce: event.data?.bounce })
      await track('contact_bounced', { kind: 'hard' })
    } else {
      // CR-03: any non-Permanent value is treated as a soft bounce. Resend uses 'Transient'
      // per SES nomenclature (NOT 'Temporary' — the previous comment was wrong). Log the
      // actual bounceType as a structured field so the empirical casing is observable in
      // production logs. SDK types `bounce.type` as `string` so TS does not help us.
      console.warn('email_soft_bounced', {
        email: recipientEmail,
        bounceType,
        bounce: event.data?.bounce,
      })
      await track('contact_bounced', { kind: 'soft' })
    }
  } else if (event.type === 'email.complained') {
    // CR-02: inspect { error } envelope on complaint flips too — same risk as hard bounce.
    const { error: updateError } = await resend.contacts.update({
      audienceId,
      email: recipientEmail,
      unsubscribed: true,
    })
    if (updateError) {
      console.error('webhook_update_failed', {
        email: recipientEmail,
        eventType: event.type,
        error: updateError,
      })
      return new NextResponse('Update failed', { status: 500 })
    }
    console.error('email_complained', { email: recipientEmail })
    await track('contact_complained')
  }
  // Other event types: no-op (forward-compatible).

  return new NextResponse('OK', { status: 200 })
}

/**
 * Local type — Resend's webhook event payload (subset Phase 4 reads).
 * Cast from `resend.webhooks.verify()` return; full type lives in @types/resend.
 *
 * CR-03: `bounce.type` is typed as `string` in the SDK
 * (node_modules/resend/dist/index.d.mts) — Resend uses 'Transient' for soft bounces (SES
 * nomenclature), NOT 'Temporary'. Do not narrow this field to a string-literal union;
 * doing so misleads future maintainers into adding `else if (bounceType === 'Temporary')`
 * branches that will silently never fire.
 */
type ResendWebhookEvent = {
  type: string
  data?: {
    to?: string[]
    bounce?: { type?: string; subType?: string }
  }
}
