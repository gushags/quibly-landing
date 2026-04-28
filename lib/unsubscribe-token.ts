import 'server-only'
import { env } from '@/lib/env'

/**
 * Phase 4 — RFC 8058 one-click unsubscribe token (CD-02).
 *
 * Encodes email (not contactId) so the unsubscribe route can call
 * `resend.contacts.update({ email, unsubscribed: true })` directly with no
 * Resend API lookup. Token shape: `${base64url(email)}.${base64url(hmac_sha256)}`.
 *
 * Signing key: env.RESEND_WEBHOOK_SECRET (reused per CD-02 — keeps env surface small).
 *
 * Verification is timing-safe (constant-time XOR loop over the full byte length).
 */

const encoder = new TextEncoder()

let cachedKey: CryptoKey | null = null

async function getKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey
  cachedKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(env.RESEND_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
  return cachedKey
}

export async function generateToken(email: string): Promise<string> {
  const key = await getKey()
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(email))
  const hmac = Buffer.from(sig).toString('base64url')
  const encodedEmail = Buffer.from(email).toString('base64url')
  return `${encodedEmail}.${hmac}`
}

/**
 * Returns the original email if the token is valid; null otherwise.
 * Timing-safe — does not short-circuit on first mismatched byte.
 */
export async function verifyToken(token: string): Promise<string | null> {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [encodedEmail, hmacB64] = parts
  if (!encodedEmail || !hmacB64) return null

  let email: string
  try {
    email = Buffer.from(encodedEmail, 'base64url').toString('utf-8')
  } catch {
    return null
  }
  if (!email) return null

  const expected = await generateToken(email)
  const expectedHmac = expected.split('.')[1]
  if (!expectedHmac) return null

  const a = Buffer.from(expectedHmac, 'base64url')
  const b = Buffer.from(hmacB64, 'base64url')
  if (a.length !== b.length) return null

  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0 ? email : null
}
