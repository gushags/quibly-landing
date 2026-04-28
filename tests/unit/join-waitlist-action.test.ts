import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

// Set env vars BEFORE any import that transitively loads lib/env.ts.
// Phase 1 D-08 parses env at module load — these must be in place first.
process.env.RESEND_API_KEY = 're_test_dummy_key_for_unit_tests'
process.env.RESEND_AUDIENCE_ID = 'aud_production_test_id'
process.env.RESEND_AUDIENCE_PREVIEW_ID = 'aud_preview_test_id'
process.env.RESEND_WEBHOOK_SECRET = 'whsec_test_secret_unit_only_64_chars_padded_xxxx_xxxx_xxxx_xxxx_x'
process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
process.env.UPSTASH_REDIS_REST_TOKEN = 'test_token_unit_only'
process.env.RESEND_FROM_POSTAL_ADDRESS = 'Test Address, Test City, TS 99999'
process.env.NEXT_PUBLIC_SITE_URL = 'https://test.useQuibly.com'

// ─── Mocks ──────────────────────────────────────────────────────────────────

// Mock the Resend SDK singleton (lib/resend.ts) so no real API calls are made.
// Plan 04-07 Probe 1: contacts.create is idempotent on email — duplicate detection
// happens via contacts.get (returns 404-shape error when contact does not exist).
// Default `get` mock = "not found" → fresh signup path.
vi.mock('@/lib/resend', () => ({
  resend: {
    contacts: {
      get: vi.fn(async () => ({
        data: null,
        error: { name: 'not_found', statusCode: 404, message: 'Contact not found' },
      })),
      create: vi.fn(async () => ({
        data: { id: 'contact_test_id', email: 'real@example.com', unsubscribed: false, createdAt: '' },
        error: null,
      })),
      update: vi.fn(async () => ({ data: null, error: null })),
    },
    emails: {
      send: vi.fn(async () => ({ data: { id: 'email_test_id' }, error: null })),
    },
  },
}))

// Mock the rate-limit ladder — default to passing (success: true).
vi.mock('@/lib/rate-limit', () => ({
  rateLimitPerMinute: { limit: vi.fn(async () => ({ success: true, limit: 5, reset: 0, remaining: 4 })) },
  rateLimitPerDay: { limit: vi.fn(async () => ({ success: true, limit: 50, reset: 0, remaining: 49 })) },
}))

// Mock the analytics shim.
vi.mock('@/lib/analytics', () => ({ track: vi.fn(async () => {}) }))

// Mock next/headers — Next 16.2 async headers().
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({
    get: (name: string) =>
      name === 'x-forwarded-for' ? '127.0.0.1' : null,
  })),
}))

// Mock the WelcomeEmail React Email template so the postalAddress prop wiring
// (EMAIL-05 CAN-SPAM) can be asserted directly. Returning a plain object is fine —
// resend.emails.send is also mocked, so React-element rendering never happens.
vi.mock('@/emails/WelcomeEmail', () => ({
  __esModule: true,
  default: vi.fn((props: { unsubscribeUrl: string; postalAddress: string }) => ({
    type: 'WelcomeEmailMock',
    props,
  })),
}))

// ─── Dynamic imports (after mocks) ─────────────────────────────────────────

let joinWaitlistAction: typeof import('@/app/actions/join-waitlist')['joinWaitlistAction']
let resend: { contacts: { get: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }; emails: { send: ReturnType<typeof vi.fn> } }
let rateLimitPerMinute: { limit: ReturnType<typeof vi.fn> }
let rateLimitPerDay: { limit: ReturnType<typeof vi.fn> }
let track: ReturnType<typeof vi.fn>
let WelcomeEmail: ReturnType<typeof vi.fn>

beforeAll(async () => {
  const action = await import('@/app/actions/join-waitlist')
  joinWaitlistAction = action.joinWaitlistAction
  const r = await import('@/lib/resend')
  resend = r.resend as never
  const rl = await import('@/lib/rate-limit')
  rateLimitPerMinute = rl.rateLimitPerMinute as never
  rateLimitPerDay = rl.rateLimitPerDay as never
  const a = await import('@/lib/analytics')
  track = a.track as never
  const we = await import('@/emails/WelcomeEmail')
  WelcomeEmail = we.default as never
})

beforeEach(() => {
  vi.clearAllMocks()
  // Restore default mock returns after clearAllMocks resets implementations
  // Default contacts.get = "not found" → fresh-signup path
  vi.mocked(resend.contacts.get).mockResolvedValue({
    data: null,
    error: { name: 'not_found', statusCode: 404, message: 'Contact not found' },
  } as never)
  vi.mocked(resend.contacts.create).mockResolvedValue({
    data: { id: 'contact_test_id', email: 'real@example.com', unsubscribed: false, createdAt: '' } as never,
    error: null,
  } as never)
  vi.mocked(resend.emails.send).mockResolvedValue({ data: { id: 'email_test_id' }, error: null } as never)
  vi.mocked(rateLimitPerMinute.limit).mockResolvedValue({ success: true, limit: 5, reset: 0, remaining: 4 } as never)
  vi.mocked(rateLimitPerDay.limit).mockResolvedValue({ success: true, limit: 50, reset: 0, remaining: 49 } as never)
  vi.mocked(WelcomeEmail).mockImplementation((props: { unsubscribeUrl: string; postalAddress: string }) => ({
    type: 'WelcomeEmailMock',
    props,
  }) as never)
})

// ─── Helpers ───────────────────────────────────────────────────────────────

function fd(entries: Record<string, string>): FormData {
  const f = new FormData()
  for (const [k, v] of Object.entries(entries)) f.append(k, v)
  return f
}

const PAST_RENDERED_AT = () => String(Date.now() - 5000)

// ─── PRESERVED: Phase 3 honeypot/time-trap/Zod (real defenses) ─────────────

describe('joinWaitlistAction (Phase 3 defenses preserved)', () => {
  it('returns silent success when honeypot is filled (SPAM-01 / D-15)', async () => {
    const r = await joinWaitlistAction(null, fd({
      email: 'real@example.com',
      hp_field: 'https://bot.example.com',
      renderedAt: PAST_RENDERED_AT(),
    }))
    expect(r).toEqual({ status: 'success' })
    expect(resend.contacts.create).not.toHaveBeenCalled()
    expect(resend.emails.send).not.toHaveBeenCalled()
  })

  it('returns silent success when submitted faster than 2s (SPAM-02 / D-15)', async () => {
    const r = await joinWaitlistAction(null, fd({
      email: 'real@example.com',
      hp_field: '',
      renderedAt: String(Date.now()),
    }))
    expect(r).toEqual({ status: 'success' })
    expect(resend.contacts.create).not.toHaveBeenCalled()
  })

  it('returns fieldErrors and echoes typed value on invalid email (FORM-03 + FORM-06)', async () => {
    const r = await joinWaitlistAction(null, fd({
      email: 'not-an-email',
      hp_field: '',
      renderedAt: PAST_RENDERED_AT(),
    }))
    expect(r.status).toBe('error')
    if (r.status === 'error') {
      expect(r.fieldErrors?.email).toBeTruthy()
      expect(r.submittedValues?.email).toBe('not-an-email')
    }
    expect(resend.contacts.create).not.toHaveBeenCalled()
  })

  it('returns fieldErrors when email is empty (FORM-03)', async () => {
    const r = await joinWaitlistAction(null, fd({
      email: '',
      hp_field: '',
      renderedAt: PAST_RENDERED_AT(),
    }))
    expect(r.status).toBe('error')
  })
})

// ─── NEW: Phase 4 real-pipeline branches ────────────────────────────────────

describe('joinWaitlistAction (Phase 4 real pipeline)', () => {
  it('rejects disposable domain silently (SPAM-04 / D-03)', async () => {
    const r = await joinWaitlistAction(null, fd({
      email: 'user@mailinator.com',
      hp_field: '',
      renderedAt: PAST_RENDERED_AT(),
    }))
    expect(r).toEqual({ status: 'success' })
    expect(resend.contacts.create).not.toHaveBeenCalled()
    expect(resend.emails.send).not.toHaveBeenCalled()
    expect(track).toHaveBeenCalledWith('signup_rejected', { reason: 'disposable_domain' })
  })

  it('rejects rate-limited IP silently — minute limit exceeded (SPAM-03 / D-03)', async () => {
    vi.mocked(rateLimitPerMinute.limit).mockResolvedValueOnce({ success: false, limit: 5, reset: 0, remaining: 0 } as never)
    const r = await joinWaitlistAction(null, fd({
      email: 'real@example.com',
      hp_field: '',
      renderedAt: PAST_RENDERED_AT(),
    }))
    expect(r).toEqual({ status: 'success' })
    expect(resend.contacts.create).not.toHaveBeenCalled()
    expect(track).toHaveBeenCalledWith('signup_rejected', { reason: 'rate_limit' })
  })

  it('rejects rate-limited IP silently — day limit exceeded (SPAM-03)', async () => {
    vi.mocked(rateLimitPerDay.limit).mockResolvedValueOnce({ success: false, limit: 50, reset: 0, remaining: 0 } as never)
    const r = await joinWaitlistAction(null, fd({
      email: 'real@example.com',
      hp_field: '',
      renderedAt: PAST_RENDERED_AT(),
    }))
    expect(r).toEqual({ status: 'success' })
    expect(resend.contacts.create).not.toHaveBeenCalled()
  })

  it('calls contacts.create with audienceId + properties.consent_version (STORE-01/03/04)', async () => {
    await joinWaitlistAction(null, fd({
      email: 'real@example.com',
      hp_field: '',
      renderedAt: PAST_RENDERED_AT(),
    }))
    expect(resend.contacts.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'real@example.com',
        unsubscribed: false,
        properties: expect.objectContaining({
          consent_version: expect.any(String),
        }),
      }),
    )
    const callArg = vi.mocked(resend.contacts.create).mock.calls[0][0] as { audienceId: string; properties: { consent_version: string } }
    expect(typeof callArg.audienceId).toBe('string')
    expect(callArg.audienceId.length).toBeGreaterThan(0)
    expect(callArg.properties.consent_version.length).toBeGreaterThan(0)
  })

  it('routes to preview audience when VERCEL_ENV is not production (CD-04)', async () => {
    const prev = process.env.VERCEL_ENV
    delete process.env.VERCEL_ENV
    try {
      await joinWaitlistAction(null, fd({
        email: 'real@example.com',
        hp_field: '',
        renderedAt: PAST_RENDERED_AT(),
      }))
      const callArg = vi.mocked(resend.contacts.create).mock.calls[0][0] as { audienceId: string }
      expect(callArg.audienceId).toBe('aud_preview_test_id')
    } finally {
      if (prev !== undefined) process.env.VERCEL_ENV = prev
    }
  })

  it('routes to production audience when VERCEL_ENV === production (STORE-01)', async () => {
    const prev = process.env.VERCEL_ENV
    process.env.VERCEL_ENV = 'production'
    try {
      await joinWaitlistAction(null, fd({
        email: 'real@example.com',
        hp_field: '',
        renderedAt: PAST_RENDERED_AT(),
      }))
      const callArg = vi.mocked(resend.contacts.create).mock.calls[0][0] as { audienceId: string }
      expect(callArg.audienceId).toBe('aud_production_test_id')
    } finally {
      if (prev === undefined) delete process.env.VERCEL_ENV
      else process.env.VERCEL_ENV = prev
    }
  })

  it('sends welcome email with full RFC 8058 headers + locked from/subject (EMAIL-01/02/03)', async () => {
    await joinWaitlistAction(null, fd({
      email: 'real@example.com',
      hp_field: '',
      renderedAt: PAST_RENDERED_AT(),
    }))
    expect(resend.emails.send).toHaveBeenCalledTimes(1)
    const sendArg = vi.mocked(resend.emails.send).mock.calls[0][0] as {
      from: string
      to: string
      subject: string
      headers: Record<string, string>
      react: { props: { postalAddress: string; unsubscribeUrl: string } }
    }
    expect(sendArg.from).toBe('Quibly <hello@usequibly.com>')
    expect(sendArg.to).toBe('real@example.com')
    expect(sendArg.subject).toBe("You're on the Quibly list")
    expect(sendArg.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click')
    expect(sendArg.headers['List-Unsubscribe']).toMatch(/<https?:\/\/[^>]+\/unsubscribe\?t=[^>]+>/)
    expect(sendArg.headers['List-Unsubscribe']).toContain('<mailto:unsubscribe@usequibly.com>')
    // Belt-and-suspenders: react arg carries postalAddress (covered in detail by the next test)
    expect(sendArg.react.props.postalAddress).toBeTruthy()
  })

  it('passes non-empty postalAddress to WelcomeEmail (EMAIL-05 CAN-SPAM)', async () => {
    await joinWaitlistAction(null, fd({
      email: 'real@example.com',
      hp_field: '',
      renderedAt: PAST_RENDERED_AT(),
    }))
    // Assert WelcomeEmail mock was invoked with a truthy, non-empty postalAddress.
    // EMAIL-05 CAN-SPAM compliance depends on this prop being wired from
    // env.RESEND_FROM_POSTAL_ADDRESS through to the email template's footer.
    // Without this assertion, env-load crash + manual inbox checkpoint were the
    // only protections — easy to silently regress.
    expect(WelcomeEmail).toHaveBeenCalledTimes(1)
    expect(WelcomeEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        postalAddress: expect.stringMatching(/.+/),
        unsubscribeUrl: expect.stringMatching(/^https?:\/\/.+\/unsubscribe\?t=.+/),
      }),
    )
    const welcomeProps = vi.mocked(WelcomeEmail).mock.calls[0][0] as { postalAddress: string }
    expect(typeof welcomeProps.postalAddress).toBe('string')
    expect(welcomeProps.postalAddress.length).toBeGreaterThan(0)
    // The wired value comes from env.RESEND_FROM_POSTAL_ADDRESS — verify the
    // exact value matches what was set at the top of this test file (parity
    // catches regressions where a placeholder string would silently flow through).
    expect(welcomeProps.postalAddress).toBe('Test Address, Test City, TS 99999')
    // Cross-check: the resend.emails.send react arg carries the same prop.
    const sendArg = vi.mocked(resend.emails.send).mock.calls[0][0] as {
      react: { props: { postalAddress: string } }
    }
    expect(sendArg.react.props.postalAddress).toBe('Test Address, Test City, TS 99999')
    expect(sendArg.react.props.postalAddress.length).toBeGreaterThan(0)
  })

  it('suppresses welcome email on duplicate signup (contacts.get returns existing contact) and tracks waitlist_signup with duplicate flag (D-05 / Probe 1)', async () => {
    // Probe 1 finding: contacts.create is idempotent on email — duplicate detection
    // moved to contacts.get. When the contact already exists, get() returns the contact
    // and create() must NOT be called (avoids the redundant idempotent write) and the
    // welcome email must NOT be sent (avoids re-confirmation spam).
    vi.mocked(resend.contacts.get).mockResolvedValueOnce({
      data: { id: 'existing_contact', email: 'dup@example.com', unsubscribed: false, createdAt: '' },
      error: null,
    } as never)
    const r = await joinWaitlistAction(null, fd({
      email: 'dup@example.com',
      hp_field: '',
      renderedAt: PAST_RENDERED_AT(),
    }))
    expect(r).toEqual({ status: 'success', duplicate: true })
    expect(resend.contacts.create).not.toHaveBeenCalled()
    expect(resend.emails.send).not.toHaveBeenCalled()
    expect(track).toHaveBeenCalledWith('waitlist_signup', { duplicate: true })
  })

  it('returns user-facing error when contacts.get fails with non-404 error (Probe 1 / D-12)', async () => {
    // Any non-404 error from contacts.get is treated as fatal — same handling as
    // a previous-architecture contacts.create failure.
    vi.mocked(resend.contacts.get).mockResolvedValueOnce({
      data: null,
      error: { name: 'rate_limit_exceeded', statusCode: 429, message: 'Too many requests to Resend' },
    } as never)
    const r = await joinWaitlistAction(null, fd({
      email: 'real@example.com',
      hp_field: '',
      renderedAt: PAST_RENDERED_AT(),
    }))
    expect(r.status).toBe('error')
    if (r.status === 'error') {
      expect(r.message).toMatch(/something went wrong/i)
    }
    expect(resend.contacts.create).not.toHaveBeenCalled()
    expect(resend.emails.send).not.toHaveBeenCalled()
  })

  it('returns user-facing error when contacts.create fails on a fresh signup (D-12)', async () => {
    // contacts.get → 404 (default), then contacts.create returns an error → fatal.
    vi.mocked(resend.contacts.create).mockResolvedValueOnce({
      data: null,
      error: { name: 'validation_error', message: 'Invalid audience' },
    } as never)
    const r = await joinWaitlistAction(null, fd({
      email: 'real@example.com',
      hp_field: '',
      renderedAt: PAST_RENDERED_AT(),
    }))
    expect(r.status).toBe('error')
    if (r.status === 'error') {
      expect(r.message).toMatch(/something went wrong/i)
    }
    expect(resend.emails.send).not.toHaveBeenCalled()
  })

  it('fires track(welcome_email_send_error) when fire-and-forget send rejects (EMAIL-08)', async () => {
    vi.mocked(resend.emails.send).mockRejectedValueOnce(new Error('Network error'))
    await joinWaitlistAction(null, fd({
      email: 'real@example.com',
      hp_field: '',
      renderedAt: PAST_RENDERED_AT(),
    }))
    // Fire-and-forget — wait a tick so the .catch() handler executes.
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(track).toHaveBeenCalledWith('welcome_email_send_error', { email: 'real@example.com' })
  })

  it('fires track(waitlist_signup, { duplicate: false }) on fresh successful signup (ANLY-03)', async () => {
    await joinWaitlistAction(null, fd({
      email: 'real@example.com',
      hp_field: '',
      renderedAt: PAST_RENDERED_AT(),
    }))
    expect(track).toHaveBeenCalledWith('waitlist_signup', { duplicate: false })
  })
})
