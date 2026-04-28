import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

// Env vars must be set before lib/env.ts is loaded by the route module.
process.env.RESEND_API_KEY = 're_test_dummy_key'
process.env.RESEND_AUDIENCE_ID = 'aud_prod'
process.env.RESEND_AUDIENCE_PREVIEW_ID = 'aud_preview'
process.env.RESEND_WEBHOOK_SECRET = 'whsec_test_secret_unit_only_64_chars_padded_xxxx_xxxx_xxxx_xx'
process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
process.env.UPSTASH_REDIS_REST_TOKEN = 'test_token'
process.env.RESEND_FROM_POSTAL_ADDRESS = 'Test Address'

// Mock the Resend SDK singleton — we control webhooks.verify() per test.
const verifyMock = vi.fn()
const updateMock = vi.fn(async () => ({ data: null, error: null }))
vi.mock('@/lib/resend', () => ({
  resend: {
    webhooks: { verify: verifyMock },
    contacts: { update: updateMock },
  },
}))
vi.mock('@/lib/analytics', () => ({ track: vi.fn(async () => {}) }))

let POST: (req: Request) => Promise<Response>
let track: ReturnType<typeof vi.fn>

beforeAll(async () => {
  const mod = await import('@/app/api/webhooks/resend/route')
  POST = mod.POST as never
  const a = await import('@/lib/analytics')
  track = a.track as never
})

beforeEach(() => {
  vi.clearAllMocks()
  updateMock.mockResolvedValue({ data: null, error: null })
})

function makeReq(body: string, headers: Record<string, string> = {}): Request {
  return new Request('https://test/api/webhooks/resend', {
    method: 'POST',
    headers,
    body,
  })
}

describe('POST /api/webhooks/resend', () => {
  it('returns 400 when svix headers are missing', async () => {
    const r = await POST(makeReq('{}', {}))
    expect(r.status).toBe(400)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('returns 401 when signature verification fails', async () => {
    verifyMock.mockImplementationOnce(() => {
      throw new Error('Invalid signature')
    })
    const r = await POST(makeReq('{}', {
      'svix-id': 'msg_test',
      'svix-timestamp': '1700000000',
      'svix-signature': 'v1,bogus',
    }))
    expect(r.status).toBe(401)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('marks contact unsubscribed on email.bounced Permanent (D-08 hard bounce)', async () => {
    verifyMock.mockReturnValueOnce({
      type: 'email.bounced',
      data: { to: ['user@example.com'], bounce: { type: 'Permanent' } },
    })
    const r = await POST(makeReq('{}', {
      'svix-id': 'msg_test',
      'svix-timestamp': '1700000000',
      'svix-signature': 'v1,sig',
    }))
    expect(r.status).toBe(200)
    expect(updateMock).toHaveBeenCalledWith({ email: 'user@example.com', unsubscribed: true })
    expect(track).toHaveBeenCalledWith('contact_bounced', { kind: 'hard' })
  })

  it('does NOT mutate contact on email.bounced Temporary (D-08 soft bounce)', async () => {
    verifyMock.mockReturnValueOnce({
      type: 'email.bounced',
      data: { to: ['user@example.com'], bounce: { type: 'Temporary' } },
    })
    const r = await POST(makeReq('{}', {
      'svix-id': 'msg_test',
      'svix-timestamp': '1700000000',
      'svix-signature': 'v1,sig',
    }))
    expect(r.status).toBe(200)
    expect(updateMock).not.toHaveBeenCalled()
    expect(track).toHaveBeenCalledWith('contact_bounced', { kind: 'soft' })
  })

  it('marks contact unsubscribed on email.complained (D-08 spam-complaint)', async () => {
    verifyMock.mockReturnValueOnce({
      type: 'email.complained',
      data: { to: ['user@example.com'] },
    })
    const r = await POST(makeReq('{}', {
      'svix-id': 'msg_test',
      'svix-timestamp': '1700000000',
      'svix-signature': 'v1,sig',
    }))
    expect(r.status).toBe(200)
    expect(updateMock).toHaveBeenCalledWith({ email: 'user@example.com', unsubscribed: true })
    expect(track).toHaveBeenCalledWith('contact_complained')
  })

  it('returns 200 with no side effect on unknown event type', async () => {
    verifyMock.mockReturnValueOnce({
      type: 'email.delivery_delayed',
      data: { to: ['user@example.com'] },
    })
    const r = await POST(makeReq('{}', {
      'svix-id': 'msg_test',
      'svix-timestamp': '1700000000',
      'svix-signature': 'v1,sig',
    }))
    expect(r.status).toBe(200)
    expect(updateMock).not.toHaveBeenCalled()
  })
})
