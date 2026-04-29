import { NextRequest, NextResponse } from 'next/server'
import { resend } from '@/lib/resend'
import { verifyToken } from '@/lib/unsubscribe-token'

/**
 * Phase 4 — Unsubscribe endpoint (EMAIL-04 / D-02).
 *
 * Two entry points share the same HMAC-token verification + Resend contact update:
 *
 * - POST: RFC 8058 one-click. Email clients (Gmail, Outlook, iCloud Mail) honor
 *   `List-Unsubscribe-Post: List-Unsubscribe=One-Click` by POSTing directly to
 *   the URL in the `List-Unsubscribe` header. RFC 8058 says senders MUST honor
 *   without confirmation — response body is irrelevant.
 *
 * - GET: human-clickable body link in the welcome email. Surfaces a minimal
 *   HTML confirmation page so a recipient who clicks the link sees feedback
 *   rather than a 405. Deferred-GET decision in 04-CONTEXT.md was flipped by
 *   plan 04-08 Task 5 after empirical UAT showed the body link is the
 *   primary unsubscribe UX (Gmail's header-driven button only surfaces for
 *   senders with sustained bulk-mail reputation, which a pre-launch waitlist
 *   does not yet have).
 *
 *   Prefetch risk (link-previewers / scanners issuing GETs) is bounded: tokens
 *   are HMAC-signed and unique per recipient, so a prefetch can only
 *   unsubscribe the original recipient, who already received the email. If
 *   post-launch reflection surfaces false-unsubscribe patterns, swap to a
 *   two-step confirm-form pattern (~15 LOC delta).
 *
 * Token format (CD-02): `${base64url(email)}.${base64url(hmac_sha256(email))}`
 * Signed with env.RESEND_WEBHOOK_SECRET.
 *
 * Runtime pinned to Node — `verifyToken` uses `crypto.subtle` which works on
 * both Edge and Node, but the Resend SDK requires Node.
 */

export const runtime = 'nodejs'

async function processUnsubscribe(req: NextRequest, via: 'GET' | 'POST') {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('t')

  if (!token) {
    return { status: 400 as const, body: 'Missing token', email: null }
  }

  const email = await verifyToken(token)
  if (!email) {
    console.warn('unsubscribe_invalid_token', { tokenPrefix: token.slice(0, 12), via })
    return { status: 401 as const, body: 'Invalid token', email: null }
  }

  await resend.contacts.update({ email, unsubscribed: true })
  console.info('unsubscribe_processed', { email, via })

  return { status: 200 as const, body: 'OK', email }
}

export async function POST(req: NextRequest) {
  const result = await processUnsubscribe(req, 'POST')
  return new NextResponse(result.body, { status: result.status })
}

export async function GET(req: NextRequest) {
  const result = await processUnsubscribe(req, 'GET')

  if (result.status !== 200) {
    return new NextResponse(
      `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">` +
        `<meta name="viewport" content="width=device-width,initial-scale=1">` +
        `<meta name="robots" content="noindex"><title>Unsubscribe — Quibly</title>` +
        `<style>body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:480px;margin:80px auto;padding:0 24px;color:#1a1a1a}h1{color:#0d9488;font-weight:600}p{line-height:1.5}</style>` +
        `</head><body><h1>Unsubscribe link is invalid</h1>` +
        `<p>This link is missing or no longer valid. If you meant to unsubscribe, reply to any Quibly email or write to <a href="mailto:unsubscribe@usequibly.com">unsubscribe@usequibly.com</a> and we'll handle it manually.</p>` +
        `</body></html>`,
      { status: result.status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    )
  }

  return new NextResponse(
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">` +
      `<meta name="viewport" content="width=device-width,initial-scale=1">` +
      `<meta name="robots" content="noindex"><title>Unsubscribed — Quibly</title>` +
      `<style>body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:480px;margin:80px auto;padding:0 24px;color:#1a1a1a;text-align:center}h1{color:#0d9488;font-weight:600}p{line-height:1.5}a{color:#0d9488}</style>` +
      `</head><body><h1>You're unsubscribed</h1>` +
      `<p>You won't receive any further Quibly emails. If this was a mistake, you can re-join the waitlist anytime at <a href="https://usequibly.com">usequibly.com</a>.</p>` +
      `</body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}
