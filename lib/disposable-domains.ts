/**
 * SPAM-04: Disposable / temporary email domain blocklist.
 *
 * CD-01: Hand-curated list (~25 entries). The npm package `disposable-email-domains`
 * (~3000 entries) is overkill for pre-launch volume and creates a permanent dep we
 * don't need elsewhere. Founder appends to this array if abuse appears post-launch.
 *
 * CD-11: Called AFTER Zod validation (so email is well-formed) and BEFORE rate-limit
 * (cheaper to compute than a network round-trip; avoids charging the rate-limit bucket
 * for free disposable rejections).
 *
 * D-03: A disposable hit returns silent success (`{ status: 'success' }`) with no
 * welcome email and no `track('waitlist_signup')` event — matches honeypot/time-trap
 * defense-in-depth posture from Phase 3 D-15.
 */
const DISPOSABLE_DOMAINS = new Set<string>([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'guerrillamail.info',
  'guerrillamail.biz',
  'guerrillamail.de',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'sharklasers.com',
  'grr.la',
  'yopmail.com',
  'throwawaymail.com',
  'throwam.com',
  'spam4.me',
  'trashmail.me',
  'trashmail.at',
  'dispostable.com',
  'mailnull.com',
  'spamgourmet.com',
  'spamgourmet.net',
  'spamgourmet.org',
  'fakeinbox.com',
  'maildrop.cc',
])

/**
 * Returns true if the email's domain (case-insensitive) is on the disposable blocklist.
 * Returns false for malformed input (no `@`, empty string) — graceful, never throws.
 */
export function isDisposableDomain(email: string): boolean {
  const at = email.lastIndexOf('@')
  if (at === -1) return false
  const domain = email.slice(at + 1).toLowerCase().trim()
  return DISPOSABLE_DOMAINS.has(domain)
}
