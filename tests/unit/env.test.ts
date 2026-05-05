import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

/**
 * WR-01 — RESEND_FROM_POSTAL_ADDRESS placeholder guard.
 *
 * lib/env.ts parses at module load. To exercise the schema with different env
 * combinations across tests we must `vi.resetModules()` and re-import each time.
 * `vi.stubEnv` snapshots and restores process.env automatically.
 */

const baseEnv = {
  RESEND_API_KEY: 're_test_dummy_key',
  RESEND_AUDIENCE_ID: 'aud_prod',
  RESEND_AUDIENCE_PREVIEW_ID: 'aud_preview',
  RESEND_WEBHOOK_SECRET: 'whsec_test_secret_unit_only_64_chars_padded_xxxx_xxxx_xxxx_xx',
  UPSTASH_REDIS_REST_URL: 'https://test.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 'test_token',
}

function setBaseEnv() {
  for (const [k, v] of Object.entries(baseEnv)) {
    vi.stubEnv(k, v)
  }
}

beforeEach(() => {
  vi.resetModules()
  vi.unstubAllEnvs()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('lib/env.ts — RESEND_FROM_POSTAL_ADDRESS placeholder guard (WR-01)', () => {
  it('accepts the .env.example placeholder when VERCEL_ENV is unset (dev/preview)', async () => {
    setBaseEnv()
    vi.stubEnv('RESEND_FROM_POSTAL_ADDRESS', 'YOUR-POSTAL-ADDRESS-HERE')
    vi.stubEnv('VERCEL_ENV', 'development')
    const mod = await import('@/lib/env')
    expect(mod.env.RESEND_FROM_POSTAL_ADDRESS).toBe('YOUR-POSTAL-ADDRESS-HERE')
  })

  it('accepts the .env.example placeholder when VERCEL_ENV=preview', async () => {
    setBaseEnv()
    vi.stubEnv('RESEND_FROM_POSTAL_ADDRESS', 'YOUR-POSTAL-ADDRESS-HERE')
    vi.stubEnv('VERCEL_ENV', 'preview')
    const mod = await import('@/lib/env')
    expect(mod.env.RESEND_FROM_POSTAL_ADDRESS).toBe('YOUR-POSTAL-ADDRESS-HERE')
  })

  it('rejects the .env.example placeholder when VERCEL_ENV=production', async () => {
    setBaseEnv()
    vi.stubEnv('RESEND_FROM_POSTAL_ADDRESS', 'YOUR-POSTAL-ADDRESS-HERE')
    vi.stubEnv('VERCEL_ENV', 'production')
    await expect(import('@/lib/env')).rejects.toThrow(/placeholder/i)
  })

  it('rejects "Test Address" sentinel when VERCEL_ENV=production', async () => {
    setBaseEnv()
    vi.stubEnv('RESEND_FROM_POSTAL_ADDRESS', 'Test Address, Test City, TS 99999')
    vi.stubEnv('VERCEL_ENV', 'production')
    await expect(import('@/lib/env')).rejects.toThrow(/placeholder/i)
  })

  it('accepts a real postal address when VERCEL_ENV=production', async () => {
    setBaseEnv()
    vi.stubEnv('RESEND_FROM_POSTAL_ADDRESS', '1234 Some Real Street, Some City, ST 12345')
    vi.stubEnv('VERCEL_ENV', 'production')
    const mod = await import('@/lib/env')
    expect(mod.env.RESEND_FROM_POSTAL_ADDRESS).toBe('1234 Some Real Street, Some City, ST 12345')
  })
})
