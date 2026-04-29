import 'server-only'
import { track as vercelTrack } from '@vercel/analytics/server'

/**
 * Phase 4 analytics shim — Phase 5 body swap.
 *
 * Phase 5 swaps the Phase 4 shim body for `@vercel/analytics/server` track().
 * The TrackEvent union is the contract — adding new event names here
 * requires updating Plan 03/05/06 callers.
 *
 * @vercel/analytics/server auto-detects the Vercel environment via VERCEL_ANALYTICS_ID
 * and friends; no provider configuration is required. Locally it no-ops.
 *
 * Events emitted in Phase 4 + 5:
 *   - 'waitlist_signup'           — fresh + duplicate signups
 *   - 'signup_rejected'           — rate-limit + disposable rejections
 *   - 'welcome_email_send_error'  — fire-and-forget catch
 *   - 'contact_bounced'           — webhook
 *   - 'contact_complained'        — webhook
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
  // Cast to AllowedPropertyValues — all actual call sites pass string | boolean | null values.
  // The wide Record<string, unknown> signature preserves backward-compat for callers.
  await vercelTrack(event, properties as Record<string, string | number | boolean | null | undefined>)
}
