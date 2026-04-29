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
 *
 * WR-05 fix: per-event property shapes are now enforced via a discriminated
 * `TrackEventProperties` map. Callers can no longer pass arbitrary keys (or
 * PII like `email`) and have the call type-check. The matching unit test in
 * tests/unit/analytics.test.ts is updated to exercise the production-shape
 * properties; mismatched shapes now fail at compile time, not at review.
 */
export type TrackEvent =
  | 'waitlist_signup'
  | 'signup_rejected'
  | 'welcome_email_send_error'
  | 'contact_bounced'
  | 'contact_complained'

/**
 * Allowed leaf-value types for analytics properties. `email` and any other
 * PII MUST NOT appear as a key in any of the per-event shapes below
 * (CR-02 / privacy policy contract: "your email address is not stored by
 * Vercel"). Use a SHA-256 prefix or the Resend contact ID if a stable
 * non-PII identifier is needed.
 */
export type TrackPropertyValue = string | number | boolean | null

export type TrackEventProperties = {
  waitlist_signup: { duplicate: boolean }
  signup_rejected: { reason: 'rate_limit' | 'disposable_domain' }
  welcome_email_send_error: undefined
  contact_bounced: { kind: 'hard' | 'soft' }
  contact_complained: undefined
}

export async function track<E extends TrackEvent>(
  ...args: TrackEventProperties[E] extends undefined
    ? [event: E] | [event: E, properties?: undefined]
    : [event: E, properties: TrackEventProperties[E]]
): Promise<void> {
  const [event, properties] = args
  // The discriminated map above guarantees `properties` is one of the allowed
  // shapes; cast to the wide @vercel/analytics property type at the boundary.
  await vercelTrack(
    event,
    properties as Record<string, TrackPropertyValue | undefined> | undefined,
  )
}
