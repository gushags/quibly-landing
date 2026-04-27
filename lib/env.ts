import { z } from 'zod'

/**
 * Per D-07: enumerate every env var any future phase will touch, even though
 * Phase 1 doesn't consume them yet — Phase 4 will read RESEND_*, UPSTASH_*.
 *
 * Per D-08: parse at module load. `.parse()` throws ZodError listing all
 * missing/invalid keys in one error if any are absent.
 *
 * Per D-10: no NODE_ENV-aware leniency. Same hard-crash in dev, preview, prod —
 * "works on my machine, breaks in preview" is the failure mode this prevents.
 *
 * Per D-11: every other module imports `{ env }` from here — NEVER reads
 * `process.env.X` directly. Plan 04 enforces this with a custom ESLint rule.
 *
 * `import 'server-only'` is intentionally NOT added in Phase 1 — env validation
 * needs to run at build time too (RSC pages will import it). Phase 4's
 * `lib/resend.ts` adds 'server-only' as line 1 because that file touches the
 * actual Resend client and must not bundle to the client.
 */
const envSchema = z.object({
  // Resend transactional + audience client (Phase 4)
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required (Resend Dashboard -> API Keys, scope "Sending access")'),
  // Production audience for the live waitlist (Phase 4)
  RESEND_AUDIENCE_ID: z.string().min(1, 'RESEND_AUDIENCE_ID is required (Resend Dashboard -> Audiences -> "Quibly Waitlist")'),
  // Preview/PR audience — separate from production (Phase 4)
  RESEND_AUDIENCE_PREVIEW_ID: z.string().min(1, 'RESEND_AUDIENCE_PREVIEW_ID is required'),
  // Webhook signature secret for bounce + complaint events (Phase 4)
  RESEND_WEBHOOK_SECRET: z.string().min(1, 'RESEND_WEBHOOK_SECRET is required'),
  // Upstash Redis REST URL for sliding-window rate limit (Phase 4)
  UPSTASH_REDIS_REST_URL: z.string().url('UPSTASH_REDIS_REST_URL must be a valid URL (Upstash Console -> Redis DB -> REST API -> URL)'),
  // Upstash Redis REST API token (Phase 4)
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, 'UPSTASH_REDIS_REST_TOKEN is required'),
})

// Parse at module load — throws ZodError with all missing keys in one message.
export const env = envSchema.parse(process.env)
