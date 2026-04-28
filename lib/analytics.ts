import 'server-only'

/**
 * Phase 4 analytics shim.
 *
 * Phase 5 swaps this body for `@vercel/analytics/server` track() call.
 * The TrackEvent union is the contract — adding new event names here
 * requires updating Plan 03/05/06 callers.
 *
 * Events emitted in Phase 4:
 *   - 'waitlist_signup'           — fresh + duplicate signups (action body, Plan 05)
 *   - 'signup_rejected'           — rate-limit + disposable rejections (D-03, Plan 05)
 *   - 'welcome_email_send_error'  — fire-and-forget catch (EMAIL-08, Plan 05)
 *   - 'contact_bounced'           — webhook D-08 (Plan 06)
 *   - 'contact_complained'        — webhook D-08 (Plan 06)
 */
export type TrackEvent =
  | 'waitlist_signup'
  | 'signup_rejected'
  | 'welcome_email_send_error'
  | 'contact_bounced'
  | 'contact_complained'

export async function track(
  event: TrackEvent,
  properties?: Record<string, unknown>,
): Promise<void> {
  // Phase 4 shim — structured log only.
  // Phase 5 swaps this body for `import { track as vercelTrack } from '@vercel/analytics/server'`
  // and calls `vercelTrack(event, properties)`.
  console.log('[analytics]', event, properties ?? {})
}
