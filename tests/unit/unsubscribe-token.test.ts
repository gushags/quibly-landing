import { describe, it, expect, beforeAll } from 'vitest'

// env vars must be set before lib/env.ts is loaded by lib/unsubscribe-token.ts
process.env.RESEND_API_KEY = 're_test_dummy_key_for_unit_tests'
process.env.RESEND_AUDIENCE_ID = '00000000-0000-0000-0000-000000000001'
process.env.RESEND_AUDIENCE_PREVIEW_ID = '00000000-0000-0000-0000-000000000002'
process.env.RESEND_WEBHOOK_SECRET = 'whsec_test_secret_unit_only_64_chars_padded_for_realism_xxxx'
process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
process.env.UPSTASH_REDIS_REST_TOKEN = 'test_token_unit_only'
process.env.RESEND_FROM_POSTAL_ADDRESS = 'Test Address, Test City, TS 99999'

let generateToken: (email: string) => Promise<string>
let verifyToken: (token: string) => Promise<string | null>

beforeAll(async () => {
  const mod = await import('@/lib/unsubscribe-token')
  generateToken = mod.generateToken
  verifyToken = mod.verifyToken
})

describe('unsubscribe-token (CD-02)', () => {
  it('generates and verifies a round-trip token for a normal email', async () => {
    const t = await generateToken('user@example.com')
    expect(typeof t).toBe('string')
    expect(t.split('.').length).toBe(2)
    const back = await verifyToken(t)
    expect(back).toBe('user@example.com')
  })

  it('returns null for a token with a tampered HMAC segment', async () => {
    const t = await generateToken('user@example.com')
    const [head, hmac] = t.split('.')
    // Flip last char of HMAC
    const tampered = `${head}.${hmac.slice(0, -1)}${hmac.slice(-1) === 'A' ? 'B' : 'A'}`
    expect(await verifyToken(tampered)).toBeNull()
  })

  it('returns null when the email payload is swapped under the same HMAC', async () => {
    const t = await generateToken('user@example.com')
    const hmac = t.split('.')[1]
    const otherEmail = Buffer.from('attacker@example.com').toString('base64url')
    expect(await verifyToken(`${otherEmail}.${hmac}`)).toBeNull()
  })

  it('returns null for a token with no separator', async () => {
    expect(await verifyToken('no-separator-here')).toBeNull()
  })

  it('returns null for empty string input', async () => {
    expect(await verifyToken('')).toBeNull()
  })

  it('produces different tokens for different emails', async () => {
    const a = await generateToken('a@example.com')
    const b = await generateToken('c@example.com')
    expect(a).not.toBe(b)
  })

  it('produces the same token for the same email (deterministic)', async () => {
    const a = await generateToken('x@y.com')
    const b = await generateToken('x@y.com')
    expect(a).toBe(b)
  })

  it('round-trips emails containing + and . characters', async () => {
    const e = 'user+tag.with-dots@example.com'
    const back = await verifyToken(await generateToken(e))
    expect(back).toBe(e)
  })
})
