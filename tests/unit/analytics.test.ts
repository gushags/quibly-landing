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

describe('lib/analytics (ANLY-03 / T-05-03 — body swap regression)', () => {
  let track: (event: string, properties?: Record<string, unknown>) => Promise<void>

  beforeAll(async () => {
    const mod = await import('@/lib/analytics')
    track = mod.track as typeof track
  })

  afterEach(() => {
    trackMock.mockClear()
  })

  it('forwards event name and properties verbatim', async () => {
    await track('waitlist_signup', { duplicate: false })
    expect(trackMock).toHaveBeenCalledOnce()
    expect(trackMock).toHaveBeenCalledWith('waitlist_signup', { duplicate: false })
  })

  it('handles welcome_email_send_error path', async () => {
    await track('welcome_email_send_error', { contactId: 'abc-123' })
    expect(trackMock).toHaveBeenCalledWith('welcome_email_send_error', { contactId: 'abc-123' })
  })

  it('does not throw on rate-limit rejection event', async () => {
    await expect(track('signup_rejected', { reason: 'rate_limit' })).resolves.toBeUndefined()
    expect(trackMock).toHaveBeenCalled()
  })
})
