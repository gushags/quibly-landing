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
type UpdateResult = {
  data: unknown
  error: { name: string; message: string; statusCode?: number } | null
}
const updateMock = vi.fn<(...args: unknown[]) => Promise<UpdateResult>>(async () => ({
  data: null,
  error: null,
}))
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
    // CR-01: audienceId is REQUIRED — the SDK falls back to the global /contacts/:email
    // endpoint when omitted, which does not flip the audience-scoped contact.
    expect(updateMock).toHaveBeenCalledWith({
      audienceId: 'aud_preview',
      email: 'user@example.com',
      unsubscribed: true,
    })
    expect(track).toHaveBeenCalledWith('contact_bounced', { kind: 'hard' })
  })

  // CR-01: audience routing — production env writes to live audience.
  it('uses live RESEND_AUDIENCE_ID when VERCEL_ENV=production', async () => {
    const original = process.env.VERCEL_ENV
    process.env.VERCEL_ENV = 'production'
    try {
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
      expect(updateMock).toHaveBeenCalledWith({
        audienceId: 'aud_prod',
        email: 'user@example.com',
        unsubscribed: true,
      })
    } finally {
      if (original === undefined) delete process.env.VERCEL_ENV
      else process.env.VERCEL_ENV = original
    }
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

  // CR-03: Resend's actual payload uses 'Transient' (SES nomenclature), not 'Temporary'.
  // The non-Permanent branch must catch 'Transient' identically to 'Temporary'.
  it("does NOT mutate contact on email.bounced 'Transient' (CR-03 — empirical Resend casing)", async () => {
    verifyMock.mockReturnValueOnce({
      type: 'email.bounced',
      data: { to: ['user@example.com'], bounce: { type: 'Transient' } },
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
    expect(updateMock).toHaveBeenCalledWith({
      audienceId: 'aud_preview',
      email: 'user@example.com',
      unsubscribed: true,
    })
    expect(track).toHaveBeenCalledWith('contact_complained')
  })

  // CR-02: when contacts.update returns { error }, the route must return 5xx so Resend
  // retries — NOT 200, which would mark the event delivered with no remediation applied.
  it('returns 500 on email.bounced Permanent when contacts.update returns an error envelope', async () => {
    verifyMock.mockReturnValueOnce({
      type: 'email.bounced',
      data: { to: ['user@example.com'], bounce: { type: 'Permanent' } },
    })
    updateMock.mockResolvedValueOnce({
      data: null,
      error: { name: 'application_error', message: 'boom', statusCode: 500 },
    })
    const r = await POST(makeReq('{}', {
      'svix-id': 'msg_test',
      'svix-timestamp': '1700000000',
      'svix-signature': 'v1,sig',
    }))
    expect(r.status).toBe(500)
    // Track is NOT called when remediation failed — the event has not been "handled".
    expect(track).not.toHaveBeenCalled()
  })

  it('returns 500 on email.complained when contacts.update returns an error envelope', async () => {
    verifyMock.mockReturnValueOnce({
      type: 'email.complained',
      data: { to: ['user@example.com'] },
    })
    updateMock.mockResolvedValueOnce({
      data: null,
      error: { name: 'application_error', message: 'boom', statusCode: 500 },
    })
    const r = await POST(makeReq('{}', {
      'svix-id': 'msg_test',
      'svix-timestamp': '1700000000',
      'svix-signature': 'v1,sig',
    }))
    expect(r.status).toBe(500)
    expect(track).not.toHaveBeenCalled()
  })

  // CR-04: when recipient is missing on a contact event, the route must return 4xx and
  // skip track() — previously the code fell through to a no-op update + track('hard'),
  // reporting a remediation that never happened (silent data loss).
  it('returns 400 with no track on email.bounced when to[] is empty', async () => {
    verifyMock.mockReturnValueOnce({
      type: 'email.bounced',
      data: { to: [], bounce: { type: 'Permanent' } },
    })
    const r = await POST(makeReq('{}', {
      'svix-id': 'msg_test',
      'svix-timestamp': '1700000000',
      'svix-signature': 'v1,sig',
    }))
    expect(r.status).toBe(400)
    expect(updateMock).not.toHaveBeenCalled()
    expect(track).not.toHaveBeenCalled()
  })

  it('returns 400 with no track on email.complained when to[] is missing', async () => {
    verifyMock.mockReturnValueOnce({
      type: 'email.complained',
      data: {},
    })
    const r = await POST(makeReq('{}', {
      'svix-id': 'msg_test',
      'svix-timestamp': '1700000000',
      'svix-signature': 'v1,sig',
    }))
    expect(r.status).toBe(400)
    expect(updateMock).not.toHaveBeenCalled()
    expect(track).not.toHaveBeenCalled()
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
