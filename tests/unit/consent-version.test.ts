import { describe, it, expect, beforeAll, vi } from 'vitest'

// Env setup BEFORE any module that loads lib/env.ts (copy from unsubscribe-token.test.ts lines 4-10)
process.env.RESEND_API_KEY = 're_test_dummy_key_for_unit_tests'
process.env.RESEND_AUDIENCE_ID = '00000000-0000-0000-0000-000000000001'
process.env.RESEND_AUDIENCE_PREVIEW_ID = '00000000-0000-0000-0000-000000000002'
process.env.RESEND_WEBHOOK_SECRET = 'whsec_test_secret_unit_only_64_chars_padded_for_realism_xxxx'
process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
process.env.UPSTASH_REDIS_REST_TOKEN = 'test_token_unit_only'
process.env.RESEND_FROM_POSTAL_ADDRESS = 'Test Address, Test City, TS 99999'

// Mock node:fs BEFORE the dynamic import — consent-version reads files at module load
vi.mock('node:fs', () => ({
  readFileSync: vi.fn((filePath: string) => {
    if (typeof filePath === 'string' && filePath.includes('privacy')) return 'mock-privacy-content\n'
    if (typeof filePath === 'string' && filePath.includes('terms')) return 'mock-terms-content\n'
    return ''
  }),
}))

describe('lib/consent-version (LEGAL-04 / D-12 / D-14)', () => {
  let CONSENT_VERSION: string

  beforeAll(async () => {
    const mod = await import('@/lib/consent-version')
    CONSENT_VERSION = mod.CONSENT_VERSION
  })

  it('exports an 8-character lowercase hex string', () => {
    expect(CONSENT_VERSION).toMatch(/^[0-9a-f]{8}$/)
  })

  it('is deterministic for the same file contents', async () => {
    const mod2 = await import('@/lib/consent-version')
    expect(mod2.CONSENT_VERSION).toBe(CONSENT_VERSION)
  })
})
