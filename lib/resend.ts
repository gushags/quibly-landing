import 'server-only'
import { Resend } from 'resend'
import { env } from '@/lib/env'

/**
 * Phase 4 Resend SDK singleton.
 *
 * `import 'server-only'` (line 1) crashes the build if any client component
 * transitively imports this module — preventing RESEND_API_KEY from ever
 * bundling into the client bundle (T-04-12 mitigation).
 *
 * The API key is the restricted "Sending access" scope (STORE-02 / D-08 from
 * Phase 1) — sourced from `env.RESEND_API_KEY` via the Phase 1 D-11 single
 * env-reader pattern. NEVER read `process.env.RESEND_API_KEY` directly here —
 * the custom `no-raw-process-env` ESLint rule blocks that pattern.
 *
 * Consumers:
 *   - app/actions/join-waitlist.ts (Plan 05) — contacts.create + emails.send
 *   - app/api/webhooks/resend/route.ts (Plan 06) — webhooks.verify + contacts.update
 *   - app/unsubscribe/route.ts (Plan 06) — contacts.update
 */
export const resend = new Resend(env.RESEND_API_KEY)
