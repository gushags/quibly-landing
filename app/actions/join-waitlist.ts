'use server'

import { z } from 'zod'
import { headers } from 'next/headers'
import { env } from '@/lib/env'
import { resend } from '@/lib/resend'
import { rateLimitPerMinute, rateLimitPerDay } from '@/lib/rate-limit'
import { isDisposableDomain } from '@/lib/disposable-domains'
import { track } from '@/lib/analytics'
import WelcomeEmail from '@/emails/WelcomeEmail'
import { generateToken } from '@/lib/unsubscribe-token'

/**
 * Phase 4 Server Action — real Resend pipeline.
 *
 * Defense ordering (CD-11):
 *   1. Honeypot — silent success (SPAM-01 / D-15)
 *   2. Time-trap — silent success (SPAM-02 / D-15)
 *   3. Zod validation — server-side source of truth (FORM-03)
 *   4. Disposable-domain check — silent success (SPAM-04 / D-03)
 *   5. Rate-limit ladder 5/min + 50/day per IP — silent success (SPAM-03 / D-03)
 *   6. Resend audience contact write (STORE-01/03/04)
 *   7. Fire-and-forget welcome email (EMAIL-01..06/08) — first-time signups only
 *   8. Server-side analytics event with duplicate flag (ANLY-03)
 *
 * D-10: discriminated-union return shape is LOCKED:
 *   - { status: 'success'; duplicate?: boolean }
 *   - { status: 'error'; message?: string; fieldErrors?: Record<string,string>; submittedValues?: { email: string } }
 *
 * FORM-06 echo: on validation error, `submittedValues.email` is hoisted to the top-level
 * error variant so the Client Component can pass it as `defaultValue` to defeat React 19's
 * auto-reset of uncontrolled inputs (Pitfall 1).
 *
 * Zod 4 idioms (Pitfall 5):
 *   - top-level `z.email(...)` schema (the chained `.string().email(...)` form is Zod 3)
 *   - Zod 4 error flattening (not `.flatten()` which is Zod 3)
 */

const schema = z.object({
  // WR-03: lowercase so Phase 4's Resend audience write is case-insensitive.
  // Trimming happens in the action before parse,
  // because z.email rejects leading/trailing whitespace before any transform runs.
  email: z
    .email({ error: 'Please enter a valid email address.' })
    .max(254, { error: 'Email address is too long.' })
    .transform((s) => s.toLowerCase()),
})

// D-10: discriminated-union return shape — locked through Phase 4.
export type JoinWaitlistResult =
  | { status: 'success'; duplicate?: boolean }
  | {
      status: 'error'
      message?: string
      fieldErrors?: Record<string, string>
      submittedValues?: { email: string }
    }

export async function joinWaitlistAction(
  _prevState: JoinWaitlistResult | null,
  formData: FormData,
): Promise<JoinWaitlistResult> {
  // 1. Honeypot — silent success (SPAM-01 / D-15). Bot fills the hidden field; user never sees it.
  // WR-02: field name avoids password manager auto-fill (D-15).
  if (formData.get('hp_field')) {
    return { status: 'success' }
  }

  // 2. Time-trap — silent success (SPAM-02 / D-15). Submits faster than 2s after render
  //    are almost certainly bots. The `renderedAt` value is planted by the parent RSC at
  //    request time and passed to the Client Component as a stable prop (RESEARCH Pitfall 2).
  const renderedAt = Number(formData.get('renderedAt') ?? 0)
  if (renderedAt > 0 && Date.now() - renderedAt < 2000) {
    return { status: 'success' }
  }

  // 3. Zod validation — server-side source of truth (FORM-03).
  // WR-04: explicitly narrow `string | File | null` to string so a malformed
  // multipart POST sending `email` as a file part rejects with the standard
  // invalid-email message rather than echoing `"[object File]"` back to the
  // client via submittedValues.
  // WR-03: trim before parse since z.email rejects surrounding whitespace
  // before any schema-level transform runs.
  const rawEmailField = formData.get('email')
  const rawEmail = (typeof rawEmailField === 'string' ? rawEmailField : '').trim()
  const parsed = schema.safeParse({ email: rawEmail })
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error)  // Zod 4 idiom — NOT .flatten()
    const fieldErrors: Record<string, string> = {}
    for (const [key, msgs] of Object.entries(flat.fieldErrors)) {
      if (msgs?.[0]) fieldErrors[key] = msgs[0]
    }
    // Echo the raw typed value back so the Client Component can preserve it
    // via <Input defaultValue={state.submittedValues?.email} /> (Pitfall 1 / FORM-06).
    return {
      status: 'error',
      fieldErrors,
      submittedValues: { email: rawEmail },
    }
  }

  // ─── Phase 4: real pipeline (replaces D-11 stub branches) ─────────────────

  const email = parsed.data.email

  // CD-11: Disposable-domain check AFTER Zod, BEFORE rate-limit (cheaper than network).
  // D-03 / SPAM-04: silent success matches honeypot/time-trap defense-in-depth posture.
  if (isDisposableDomain(email)) {
    console.warn('disposable_domain_rejected', { email })
    await track('signup_rejected', { reason: 'disposable_domain' })
    return { status: 'success' }
  }

  // SPAM-03: sliding-window rate limit ladder (5/min + 50/day per IP).
  // CD-10: x-forwarded-for first segment is Vercel-canonical; x-real-ip is fallback.
  // Pitfall 5: order matters — honeypot/time-trap rejections never reach this code,
  //   so legitimate-looking-but-bot traffic does NOT charge legitimate users' IP buckets.
  const reqHeaders = await headers()
  const ip =
    reqHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    reqHeaders.get('x-real-ip') ??
    'unknown'

  const [minResult, dayResult] = await Promise.all([
    rateLimitPerMinute.limit(ip),
    rateLimitPerDay.limit(ip),
  ])
  if (!minResult.success || !dayResult.success) {
    console.warn('rate_limit_rejected', { ip })
    await track('signup_rejected', { reason: 'rate_limit' })
    return { status: 'success' }
  }

  // STORE-01 / CD-04: audience routing — production env writes to live audience;
  // every other env (preview, dev, vercel pull) writes to preview audience.
  // STORE-04 / CD-03: consent_version snapshot at signup time. Phase 4 ships a
  // deterministic stub (git SHA on Vercel; 'pre-phase-5' fallback in local dev).
  // Phase 5 swaps this for the real privacy-MDX → git-SHA mechanism.
  // eslint-disable-next-line custom/no-raw-process-env -- Vercel system env vars (per PATTERNS.md exception)
  const audienceId = process.env.VERCEL_ENV === 'production'
    ? env.RESEND_AUDIENCE_ID
    : env.RESEND_AUDIENCE_PREVIEW_ID
  // eslint-disable-next-line custom/no-raw-process-env -- Vercel system env var
  const consentVersion = process.env.VERCEL_GIT_COMMIT_SHA ?? 'pre-phase-5'

  // STORE-03: contacts.create is the SINGLE write path to the audience.
  const { data: contact, error: contactError } = await resend.contacts.create({
    audienceId,
    email,
    unsubscribed: false,
    properties: { consent_version: consentVersion },
  })

  // D-05 / D-06: duplicate detection. The Phase 4 day-1 probe (5 min) confirms
  // the exact error shape on duplicate. Until the helper is updated post-probe,
  // isDuplicateContactError() returns false → D-06 fallback (always send welcome).
  // Acceptable at pre-launch volume; tighten after probe.
  if (contactError && !isDuplicateContactError(contactError)) {
    console.error('contacts_create_failed', { email, error: contactError })
    return {
      status: 'error',
      message: 'Something went wrong. Try again in a moment.',
    }
  }

  const isDuplicate = !!contactError && isDuplicateContactError(contactError)

  // EMAIL-01 / D-05: fire-and-forget welcome email — first-time signups only.
  if (!isDuplicate) {
    // eslint-disable-next-line custom/no-raw-process-env -- NEXT_PUBLIC_* runtime injected by Next/Vercel
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://useQuibly.com'
    const unsubscribeUrl = `${siteUrl}/unsubscribe?t=${await generateToken(email)}`

    // CD-09: fire-and-forget — NOT awaited. .catch() handles EMAIL-08 observability.
    // The Promise typically resolves within the request lifecycle on Vercel; if
    // aborted-send patterns appear, swap to waitUntil() per CONTEXT deferred items.
    resend.emails
      .send({
        from: 'Jeff @ Quibly <hello@useQuibly.com>',
        to: email,
        subject: "You're on the Quibly list",
        react: WelcomeEmail({
          unsubscribeUrl,
          postalAddress: env.RESEND_FROM_POSTAL_ADDRESS,
        }),
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:unsubscribe@useQuibly.com>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })
      .catch((err) => {
        console.error('welcome_email_send_failed', { email, err })
        // EMAIL-08: ops observability for welcome-email send failures.
        track('welcome_email_send_error', { email })
      })
  }

  // ANLY-03: server-side analytics — duplicate flag for Phase 5 dashboard.
  await track('waitlist_signup', { duplicate: isDuplicate })

  // Suppress unused variable warning — contact data unused at this stage
  void contact

  return { status: 'success', duplicate: isDuplicate }
}

/**
 * D-06 fallback shape. Day-1 probe (5 min) updates this body once the exact
 * Resend duplicate response is empirically known. Until then, returns false →
 * always send welcome email on contactError. Acceptable at pre-launch volume.
 */
function isDuplicateContactError(
  error: { name?: string; message?: string },
): boolean {
  // After day-1 probe, expected to be something like:
  //   error.name === 'validation_error' &&
  //   /already exists|duplicate/i.test(error.message ?? '')
  // For now: D-06 fallback — return false (always send welcome on contactError path
  // means duplicates get a re-confirmation, which is bounded by Gmail's 0.3% complaint
  // threshold and acceptable at <100 signups/day).
  return /already (exists|subscribed)|duplicate/i.test(error.message ?? '')
}
