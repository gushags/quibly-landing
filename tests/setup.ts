// Seed env vars required by `lib/env.ts` (parsed at module load via z.parse(process.env)).
// Use `??=` so any developer with a real `.env.local` exporting these is not overridden.
// VERCEL_ENV=development keeps the production-only placeholder refine on
// RESEND_FROM_POSTAL_ADDRESS dormant; the stub below also avoids the
// /YOUR-POSTAL-ADDRESS|placeholder|test address/i pattern as defense-in-depth.
process.env.RESEND_API_KEY ??= 're_test_stub'
process.env.RESEND_AUDIENCE_ID ??= 'aud_test_stub'
process.env.RESEND_AUDIENCE_PREVIEW_ID ??= 'aud_test_preview_stub'
process.env.RESEND_WEBHOOK_SECRET ??= 'whsec_test_stub'
process.env.UPSTASH_REDIS_REST_URL ??= 'https://test.upstash.io'
process.env.UPSTASH_REDIS_REST_TOKEN ??= 'test_token_stub'
process.env.RESEND_FROM_POSTAL_ADDRESS ??= '123 Example St, Exampleville, EX 00000'
process.env.VERCEL_ENV ??= 'development'

import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
