import { NextRequest, NextResponse } from 'next/server'
import { resend } from '@/lib/resend'
import { verifyToken } from '@/lib/unsubscribe-token'

/**
 * Phase 4 — RFC 8058 one-click unsubscribe POST endpoint (EMAIL-04 / D-02).
 *
 * Email clients (Gmail, Outlook, iCloud Mail) honor the welcome email's
 *   `List-Unsubscribe-Post: List-Unsubscribe=One-Click`
 * header by POSTing directly to the URL in the `List-Unsubscribe` header.
 * This handler accepts that POST, verifies the HMAC-signed token, and marks
 * the Resend contact unsubscribed.
 *
 * Token format (CD-02): `${base64url(email)}.${base64url(hmac_sha256(email))}`
 * Signed with env.RESEND_WEBHOOK_SECRET.
 *
 * The HTTP 200 response is plain text — RFC 8058 doesn't require any specific
 * body. A GET handler returning a confirmation HTML page is deferred per
 * CONTEXT §Deferred Ideas.
 *
 * Runtime pinned to Node — `verifyToken` uses `crypto.subtle` which works on
 * both Edge and Node, but the Resend SDK requires Node.
 */

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('t')

  if (!token) {
    return new NextResponse('Missing token', { status: 400 })
  }

  const email = await verifyToken(token)
  if (!email) {
    console.warn('unsubscribe_invalid_token', { tokenPrefix: token.slice(0, 12) })
    return new NextResponse('Invalid token', { status: 401 })
  }

  await resend.contacts.update({ email, unsubscribed: true })
  console.info('unsubscribe_processed', { email })

  return new NextResponse('OK', { status: 200 })
}
