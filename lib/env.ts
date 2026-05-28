import { z } from 'zod';

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
  RESEND_API_KEY: z
    .string()
    .min(
      1,
      'RESEND_API_KEY is required (Resend Dashboard -> API Keys, scope "Sending access")',
    ),
  // Production audience for the live waitlist (Phase 4)
  RESEND_AUDIENCE_ID: z
    .string()
    .min(
      1,
      'RESEND_AUDIENCE_ID is required (Resend Dashboard -> Audiences -> "Zeremi Waitlist")',
    ),
  // Preview/PR audience — separate from production (Phase 4)
  RESEND_AUDIENCE_PREVIEW_ID: z
    .string()
    .min(1, 'RESEND_AUDIENCE_PREVIEW_ID is required'),
  // Webhook signature secret for bounce + complaint events (Phase 4)
  RESEND_WEBHOOK_SECRET: z.string().min(1, 'RESEND_WEBHOOK_SECRET is required'),
  // Upstash Redis REST URL for sliding-window rate limit (Phase 4)
  UPSTASH_REDIS_REST_URL: z
    .string()
    .url(
      'UPSTASH_REDIS_REST_URL must be a valid URL (Upstash Console -> Redis DB -> REST API -> URL)',
    ),
  // Upstash Redis REST API token (Phase 4)
  UPSTASH_REDIS_REST_TOKEN: z
    .string()
    .min(1, 'UPSTASH_REDIS_REST_TOKEN is required'),
  // Physical postal address for welcome-email footer (CAN-SPAM EMAIL-05 / D-10).
  // HARD blocker for production deploy — placeholder ('YOUR-POSTAL-ADDRESS-HERE') is acceptable
  // in dev/preview only; founder must source registered agent / PO box / CMRA before production merge.
  //
  // WR-01: enforce the placeholder block at the schema level when VERCEL_ENV=production.
  // `.min(1)` alone would let 'YOUR-POSTAL-ADDRESS-HERE' (the .env.example placeholder) flow
  // into real welcome emails as a CAN-SPAM-non-compliant footer string. The .refine() guard
  // crashes at module load on any production env with a placeholder still in place — same
  // failure mode (Zod surface) as a missing key.
  RESEND_FROM_POSTAL_ADDRESS: z
    .string()
    .min(
      1,
      'RESEND_FROM_POSTAL_ADDRESS is required (CAN-SPAM EMAIL-05 — source registered agent or PO box per D-10 before production deploy)',
    )
    .refine(
      (s) =>
        process.env.VERCEL_ENV !== 'production' ||
        !/YOUR-POSTAL-ADDRESS|placeholder|test address/i.test(s),
      'RESEND_FROM_POSTAL_ADDRESS still contains a placeholder string (CAN-SPAM EMAIL-05 — set a real postal address before production deploy)',
    ),
  VERCEL_ENV: z.enum(['development', 'preview', 'production']),
});

// Parse at module load — throws ZodError with all missing keys in one message.
export const env = envSchema.parse(process.env);
