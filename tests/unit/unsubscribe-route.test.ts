import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

process.env.RESEND_API_KEY = 're_test_dummy_key'
process.env.RESEND_AUDIENCE_ID = 'aud_prod'
process.env.RESEND_AUDIENCE_PREVIEW_ID = 'aud_preview'
process.env.RESEND_WEBHOOK_SECRET = 'whsec_test_secret_unit_only_64_chars_padded_xxxx_xxxx_xxxx_xx'
process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
process.env.UPSTASH_REDIS_REST_TOKEN = 'test_token'
process.env.RESEND_FROM_POSTAL_ADDRESS = 'Test Address'

const updateMock = vi.fn(async () => ({ data: null, error: null }))
vi.mock('@/lib/resend', () => ({
  resend: { contacts: { update: updateMock } },
}))

let POST: (req: Request) => Promise<Response>
let GET: (req: Request) => Promise<Response>
let generateToken: (email: string) => Promise<string>

beforeAll(async () => {
  const mod = await import('@/app/unsubscribe/route')
  POST = mod.POST as never
  GET = mod.GET as never
  const tok = await import('@/lib/unsubscribe-token')
  generateToken = tok.generateToken
})

beforeEach(() => {
  vi.clearAllMocks()
  updateMock.mockResolvedValue({ data: null, error: null })
})

function makeReq(url: string): Request {
  return new Request(url, { method: 'POST' })
}

function makeGetReq(url: string): Request {
  return new Request(url, { method: 'GET' })
}

describe('POST /unsubscribe (RFC 8058 / D-02)', () => {
  it('returns 400 when t query param is missing', async () => {
    const r = await POST(makeReq('https://test/unsubscribe'))
    expect(r.status).toBe(400)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('returns 400 when t query param is empty', async () => {
    const r = await POST(makeReq('https://test/unsubscribe?t='))
    expect(r.status).toBe(400)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('returns 401 on tampered token', async () => {
    const valid = await generateToken('user@example.com')
    // Split at '.' and modify the HMAC segment (not the padding bits at the tail)
    // to reliably invalidate the signature.
    const [head, hmac] = valid.split('.')
    const tampered = `${head}.${hmac.slice(0, -3)}${hmac.slice(-3) === 'AAA' ? 'BBB' : 'AAA'}`
    const r = await POST(makeReq(`https://test/unsubscribe?t=${tampered}`))
    expect(r.status).toBe(401)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('returns 401 on garbage token', async () => {
    const r = await POST(makeReq('https://test/unsubscribe?t=garbage'))
    expect(r.status).toBe(401)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('returns 200 and marks contact unsubscribed on valid token', async () => {
    const token = await generateToken('user@example.com')
    const r = await POST(makeReq(`https://test/unsubscribe?t=${encodeURIComponent(token)}`))
    expect(r.status).toBe(200)
    expect(updateMock).toHaveBeenCalledWith({ email: 'user@example.com', unsubscribed: true })
  })
})

describe('GET /unsubscribe (body-link UX / Plan 04-08)', () => {
  it('returns 400 with HTML when t query param is missing', async () => {
    const r = await GET(makeGetReq('https://test/unsubscribe'))
    expect(r.status).toBe(400)
    expect(r.headers.get('Content-Type')).toContain('text/html')
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('returns 401 with HTML on tampered token', async () => {
    const valid = await generateToken('user@example.com')
    const [head, hmac] = valid.split('.')
    const tampered = `${head}.${hmac.slice(0, -3)}${hmac.slice(-3) === 'AAA' ? 'BBB' : 'AAA'}`
    const r = await GET(makeGetReq(`https://test/unsubscribe?t=${tampered}`))
    expect(r.status).toBe(401)
    expect(r.headers.get('Content-Type')).toContain('text/html')
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('returns 200 HTML confirmation and marks contact unsubscribed on valid token', async () => {
    const token = await generateToken('user@example.com')
    const r = await GET(makeGetReq(`https://test/unsubscribe?t=${encodeURIComponent(token)}`))
    expect(r.status).toBe(200)
    expect(r.headers.get('Content-Type')).toContain('text/html')
    const body = await r.text()
    expect(body).toContain("You're unsubscribed")
    expect(updateMock).toHaveBeenCalledWith({ email: 'user@example.com', unsubscribed: true })
  })
})
