import 'server-only'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Phase 4 sliding-window rate limit ladder (SPAM-03).
 *
 * Two limiters run in parallel against every signup IP:
 *   - 5 requests / 60s   — burst defense (defeats scripted high-frequency abuse)
 *   - 50 requests / 1d   — sustained-flood defense (defeats slow-drip campaigns)
 *
 * A signup is silently rejected (D-03) only if BOTH `.success` flags are evaluated
 * by the action body; if either limiter fails, the action returns success-shape
 * with no welcome email and no `track('waitlist_signup')` event.
 *
 * Pitfall 5: rate limit is checked AFTER honeypot/time-trap (Phase 3) and AFTER
 * disposable-domain (CD-11) — bots that trip earlier defenses do NOT increment
 * the IP's rate-limit bucket. Order is enforced in Plan 05's action body.
 *
 * `Redis.fromEnv()` reads UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 * from process.env inside the @upstash/redis package. Phase 1 D-08 boot-validation
 * via lib/env.ts guarantees both vars are present before any module loads.
 *
 * `analytics` is omitted (defaults to false) per RESEARCH Pattern 3 — keeps
 * the implementation simple; no `context.waitUntil(pending)` plumbing required.
 *
 * CI mock gate (260504-srf):
 *   When `UPSTASH_MOCK === '1'` (set only in the CI playwright test step, never
 *   in Vercel), both exported limiters are hand-rolled mocks that resolve
 *   `{ success: true, limit: 999, remaining: 999, reset: 0 }`. This prevents the
 *   form e2e tests from failing with `TypeError: fetch failed (cert altname mismatch
 *   on test.upstash.io)` — `Redis.fromEnv()` triggers a TLS fetch even at module
 *   load, so the guard must fire before Redis is ever instantiated. Vitest is
 *   unaffected — its tests use `vi.mock('@/lib/rate-limit')` which replaces this
 *   module before the gate runs. Production deployments never set UPSTASH_MOCK,
 *   so the gate defaults to the real `Redis.fromEnv()` + `new Ratelimit({...})`
 *   path verbatim. The mock satisfies the only caller
 *   (`app/actions/join-waitlist.ts`) which reads `.success` only.
 */

// eslint-disable-next-line custom/no-raw-process-env -- UPSTASH_MOCK is a CI-only test toggle; intentionally NOT in lib/env.ts to avoid forcing production deployments to set it
const isMock = process.env.UPSTASH_MOCK === '1'

function makeMockLimiter() {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- mock; args intentionally ignored
    limit: async (_ip: string) =>
      Promise.resolve({ success: true, limit: 999, remaining: 999, reset: 0 }),
  }
}

const redis = isMock ? null : Redis.fromEnv()

export const rateLimitPerMinute = (
  isMock
    ? makeMockLimiter()
    : new Ratelimit({ redis: redis!, limiter: Ratelimit.slidingWindow(5, '60 s'), prefix: '@zeremi/ratelimit/min' })
) as unknown as Ratelimit

export const rateLimitPerDay = (
  isMock
    ? makeMockLimiter()
    : new Ratelimit({ redis: redis!, limiter: Ratelimit.slidingWindow(50, '1 d'), prefix: '@zeremi/ratelimit/day' })
) as unknown as Ratelimit
