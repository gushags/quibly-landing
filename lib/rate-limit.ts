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
 */

const redis = Redis.fromEnv()

export const rateLimitPerMinute = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '60 s'),
  prefix: '@quibly/ratelimit/min',
})

export const rateLimitPerDay = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, '1 d'),
  prefix: '@quibly/ratelimit/day',
})
