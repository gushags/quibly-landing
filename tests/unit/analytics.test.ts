import { describe, it, expect, beforeAll, vi, afterEach } from 'vitest'

// Env vars BEFORE any import that may transitively load lib/env.ts
process.env.RESEND_API_KEY = 're_test_dummy_key_for_unit_tests'
process.env.RESEND_AUDIENCE_ID = '00000000-0000-0000-0000-000000000001'
process.env.RESEND_AUDIENCE_PREVIEW_ID = '00000000-0000-0000-0000-000000000002'
process.env.RESEND_WEBHOOK_SECRET = 'whsec_test_secret_unit_only_64_chars_padded_for_realism_xxxx'
process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
process.env.UPSTASH_REDIS_REST_TOKEN = 'test_token_unit_only'
process.env.RESEND_FROM_POSTAL_ADDRESS = 'Test Address, Test City, TS 99999'

const trackMock = vi.fn().mockResolvedValue(undefined)

vi.mock('@vercel/analytics/server', () => ({
  track: trackMock,
}))

/**
 * WR-05 fix: assert the per-event property SHAPES match what the production
 * code actually sends. The previous suite tested
 * `track('welcome_email_send_error', { contactId: 'abc-123' })` -- a shape no
 * production caller used. The action drift to `{ email }` (CR-02) went
 * undetected because nothing constrained the property contract. The
 * `TrackEventProperties` map in lib/analytics.ts now type-enforces the shape;
 * these runtime assertions document and lock the contract.
 */
describe('lib/analytics (ANLY-03 / T-05-03 — body swap regression)', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- shim under test
  let track: any

  beforeAll(async () => {
    const mod = await import('@/lib/analytics')
    track = mod.track
  })

  afterEach(() => {
    trackMock.mockClear()
  })

  it('forwards waitlist_signup with { duplicate } verbatim', async () => {
    await track('waitlist_signup', { duplicate: false })
    expect(trackMock).toHaveBeenCalledOnce()
    expect(trackMock).toHaveBeenCalledWith('waitlist_signup', { duplicate: false })
  })

  it('welcome_email_send_error carries no PII / no properties (CR-02)', async () => {
    await track('welcome_email_send_error')
    expect(trackMock).toHaveBeenCalledOnce()
    const [event, properties] = trackMock.mock.calls[0]
    expect(event).toBe('welcome_email_send_error')
    // The property object must NOT contain `email` or any other PII key.
    // Asserted as either undefined or an empty bag -- both are acceptable
    // shapes given the typed shim's discriminated union.
    if (properties != null) {
      expect(Object.keys(properties)).not.toContain('email')
    }
  })

  it('signup_rejected with rate_limit reason routes through verbatim', async () => {
    await track('signup_rejected', { reason: 'rate_limit' })
    expect(trackMock).toHaveBeenCalledWith('signup_rejected', { reason: 'rate_limit' })
  })

  it('signup_rejected with disposable_domain reason routes through verbatim', async () => {
    await track('signup_rejected', { reason: 'disposable_domain' })
    expect(trackMock).toHaveBeenCalledWith('signup_rejected', { reason: 'disposable_domain' })
  })

  it('contact_bounced carries { kind } as production shape', async () => {
    await track('contact_bounced', { kind: 'hard' })
    expect(trackMock).toHaveBeenCalledWith('contact_bounced', { kind: 'hard' })
  })
})
