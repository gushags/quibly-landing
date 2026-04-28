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
 *       → resend.contacts.update({ email, unsubscribed: true })
 *       → console.error + track('contact_bounced', { kind: 'hard' })
 *   - email.bounced + bounce.type === 'Temporary' (soft bounce):
 *       → log only; do NOT mutate contact (may succeed on retry)
 *       → track('contact_bounced', { kind: 'soft' })
 *   - email.complained (spam-marked):
 *       → resend.contacts.update({ email, unsubscribed: true })  — Gmail >0.3% threshold
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

  // 4. Dispatch per D-08.
  const recipientEmail = event.data?.to?.[0] ?? ''

  if (event.type === 'email.bounced') {
    const bounceType = event.data?.bounce?.type
    if (bounceType === 'Permanent') {
      if (recipientEmail) {
        await resend.contacts.update({ email: recipientEmail, unsubscribed: true })
      }
      console.error('email_hard_bounced', { email: recipientEmail, bounce: event.data?.bounce })
      await track('contact_bounced', { kind: 'hard' })
    } else {
      // Temporary — log only.
      console.warn('email_soft_bounced', { email: recipientEmail, bounce: event.data?.bounce })
      await track('contact_bounced', { kind: 'soft' })
    }
  } else if (event.type === 'email.complained') {
    if (recipientEmail) {
      await resend.contacts.update({ email: recipientEmail, unsubscribed: true })
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
 */
type ResendWebhookEvent = {
  type: string
  data?: {
    to?: string[]
    bounce?: { type?: 'Permanent' | 'Temporary'; subType?: string }
  }
}
