'use server';

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { headers } from 'next/headers';
import { after } from 'next/server';
import { env } from '@/lib/env';
import { resend } from '@/lib/resend';
import { rateLimitPerMinute, rateLimitPerDay } from '@/lib/rate-limit';
import { isDisposableDomain } from '@/lib/disposable-domains';
import { track } from '@/lib/analytics';
import { CONSENT_VERSION } from '@/lib/consent-version';
import WelcomeEmail, { WORDMARK_CID } from '@/emails/WelcomeEmail';
import { generateToken } from '@/lib/unsubscribe-token';

/**
 * WR-01: hoist the wordmark PNG read to module scope so the file is loaded
 * exactly once on cold-start instead of on every non-duplicate signup, AND
 * so a missing-asset error never throws AFTER `contacts.create` has already
 * succeeded. The promise's `.catch()` resolves to `null`; the action then
 * sends the welcome email without the inline-attached wordmark (decorative
 * only -- the email still renders without it). Failure is logged for ops
 * visibility but does NOT break the user-visible signup flow.
 */
const wordmarkPromise: Promise<Buffer | null> = readFile(
  join(process.cwd(), 'public', 'email', 'wordmark.png'),
).catch((err) => {
  console.error('wordmark_load_failed', err);
  return null;
});

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
});

// D-10: discriminated-union return shape — locked through Phase 4.
export type JoinWaitlistResult =
  | { status: 'success'; duplicate?: boolean }
  | {
      status: 'error';
      message?: string;
      fieldErrors?: Record<string, string>;
      submittedValues?: { email: string };
    };

export async function joinWaitlistAction(
  _prevState: JoinWaitlistResult | null,
  formData: FormData,
): Promise<JoinWaitlistResult> {
  // 1. Honeypot — silent success (SPAM-01 / D-15). Bot fills the hidden field; user never sees it.
  // WR-02: field name avoids password manager auto-fill (D-15).
  if (formData.get('hp_field')) {
    return { status: 'success' };
  }

  // 2. Time-trap — silent success (SPAM-02 / D-15). Submits faster than 2s after render
  //    are almost certainly bots. The `renderedAt` value is planted by the parent RSC at
  //    request time and passed to the Client Component as a stable prop (RESEARCH Pitfall 2).
  const renderedAt = Number(formData.get('renderedAt') ?? 0);
  if (renderedAt > 0 && Date.now() - renderedAt < 2000) {
    return { status: 'success' };
  }

  // 3. Zod validation — server-side source of truth (FORM-03).
  // WR-04: explicitly narrow `string | File | null` to string so a malformed
  // multipart POST sending `email` as a file part rejects with the standard
  // invalid-email message rather than echoing `"[object File]"` back to the
  // client via submittedValues.
  // WR-03: trim before parse since z.email rejects surrounding whitespace
  // before any schema-level transform runs.
  const rawEmailField = formData.get('email');
  const rawEmail = (
    typeof rawEmailField === 'string' ? rawEmailField : ''
  ).trim();
  const parsed = schema.safeParse({ email: rawEmail });
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error); // Zod 4 idiom — NOT .flatten()
    const fieldErrors: Record<string, string> = {};
    for (const [key, msgs] of Object.entries(flat.fieldErrors)) {
      if (msgs?.[0]) fieldErrors[key] = msgs[0];
    }
    // Echo the raw typed value back so the Client Component can preserve it
    // via <Input defaultValue={state.submittedValues?.email} /> (Pitfall 1 / FORM-06).
    return {
      status: 'error',
      fieldErrors,
      submittedValues: { email: rawEmail },
    };
  }

  // ─── Phase 4: real pipeline (replaces D-11 stub branches) ─────────────────

  const email = parsed.data.email;

  // CD-11: Disposable-domain check AFTER Zod, BEFORE rate-limit (cheaper than network).
  // D-03 / SPAM-04: silent success matches honeypot/time-trap defense-in-depth posture.
  if (isDisposableDomain(email)) {
    console.warn('disposable_domain_rejected', { email });
    await track('signup_rejected', { reason: 'disposable_domain' });
    return { status: 'success' };
  }

  // SPAM-03: sliding-window rate limit ladder (5/min + 50/day per IP).
  // CD-10: x-forwarded-for first segment is Vercel-canonical; x-real-ip is fallback.
  // Pitfall 5: order matters — honeypot/time-trap rejections never reach this code,
  //   so legitimate-looking-but-bot traffic does NOT charge legitimate users' IP buckets.
  const reqHeaders = await headers();
  const ip =
    reqHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    reqHeaders.get('x-real-ip') ??
    'unknown';

  const [minResult, dayResult] = await Promise.all([
    rateLimitPerMinute.limit(ip),
    rateLimitPerDay.limit(ip),
  ]);
  if (!minResult.success || !dayResult.success) {
    console.warn('rate_limit_rejected', { ip });
    await track('signup_rejected', { reason: 'rate_limit' });
    return { status: 'success' };
  }

  // STORE-01 / CD-04: audience routing — production env writes to live audience;
  // every other env (preview, dev, vercel pull) writes to preview audience.
  const audienceId =
    env.VERCEL_ENV === 'production'
      ? env.RESEND_AUDIENCE_ID
      : env.RESEND_AUDIENCE_PREVIEW_ID;
  // STORE-04 / D-12 / D-14: consent_version is now the SHA-256 prefix of
  // privacy.tsx + terms.tsx contents (lib/consent-version.ts). Bumps ONLY when
  // policy text changes; recorded on every contact for audit traceability.
  const consentVersion = CONSENT_VERSION;

  // STORE-03: contacts.create is the SINGLE write path to the audience, BUT the
  // Phase 4 day-1 probe (Plan 04-07 Task 2 / RESEARCH Open Question #1) revealed
  // that resend.contacts.create is **idempotent on email**: a duplicate-email
  // submission returns success silently with the existing contact data
  // (`{ data: contact, error: null }`) — NO error is raised. This means the prior
  // error-shape-based duplicate detector was dead code: every duplicate-suppression
  // branch (welcome-email skip, ANLY-03 duplicate flag) was unreachable.
  //
  // Fix: get-then-create. resend.contacts.get returns
  //   { data: contact, error: null }                        when the contact exists
  //   { data: null,    error: { name: 'not_found', ... } }  when it does not
  // confirmed empirically via two probes against the preview audience (Plan 04-07).
  // Any other error from get() is treated as fatal — same handling as before.
  const { data: existingContact, error: getError } = await resend.contacts.get({
    audienceId,
    email,
  });

  if (getError && !isContactNotFoundError(getError)) {
    console.error('contacts_get_failed', { email, error: getError });
    return {
      status: 'error',
      message: 'Something went wrong. Try again in a moment.',
    };
  }

  const isDuplicate = !!existingContact && !getError;

  if (!isDuplicate) {
    const { error: createError } = await resend.contacts.create({
      audienceId,
      email,
      unsubscribed: false,
      properties: { consent_version: consentVersion },
    });
    if (createError) {
      console.error('contacts_create_failed', { email, error: createError });
      return {
        status: 'error',
        message: 'Something went wrong. Try again in a moment.',
      };
    }
  }

  // EMAIL-01 / D-05: fire-and-forget welcome email — first-time signups only.
  if (!isDuplicate) {
    // GAP-1 (Plan 04-08) — defensive fallback chain to prevent unsubscribe links from
    // routing to an unbound apex. Order: explicit user-set > Vercel-injected production
    // canonical > Vercel-injected per-deployment > apex string (only useful post-Phase 6).
    // VERCEL_PROJECT_PRODUCTION_URL / VERCEL_URL are bare hostnames (no protocol) per
    // Vercel docs — prefix `https://` when used. NEXT_PUBLIC_SITE_URL must include protocol.
    // PATTERNS.md §"env import convention" exception applies to all four reads.
    // eslint-disable-next-line custom/no-raw-process-env -- NEXT_PUBLIC_* runtime injected by Next/Vercel
    const explicitSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    // eslint-disable-next-line custom/no-raw-process-env -- Vercel system env var (per PATTERNS.md exception)
    const vercelProdHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    // eslint-disable-next-line custom/no-raw-process-env -- Vercel system env var (per PATTERNS.md exception)
    const vercelDeployHost = process.env.VERCEL_URL;
    const resolvedSiteUrl =
      explicitSiteUrl ??
      (vercelProdHost ? `https://${vercelProdHost}` : undefined) ??
      (vercelDeployHost ? `https://${vercelDeployHost}` : undefined);
    // WR-02: in production, refuse to emit a welcome email with a dead unsubscribe link.
    // The apex `zeremi.app` is not bound to Vercel pre-Phase-6, so falling through to it
    // returns NXDOMAIN/parking and the recipient cannot unsubscribe (CAN-SPAM exposure).
    if (env.VERCEL_ENV === 'production' && !resolvedSiteUrl) {
      console.error('site_url_unresolved_in_production', {
        explicitSiteUrl: !!explicitSiteUrl,
        vercelProdHost: !!vercelProdHost,
        vercelDeployHost: !!vercelDeployHost,
      });
      return {
        status: 'error',
        message: 'Service is being configured. Try again shortly.',
      };
    }
    const siteUrl = resolvedSiteUrl ?? 'https://zeremi.app';
    const unsubscribeUrl = `${siteUrl}/unsubscribe?t=${await generateToken(email)}`;

    // CD-09: fire-and-forget — NOT awaited. .catch() handles EMAIL-08 observability.
    // The Promise typically resolves within the request lifecycle on Vercel; if
    // aborted-send patterns appear, swap to waitUntil() per CONTEXT deferred items.
    // Inline-attached wordmark PNG. Referenced from WelcomeEmail.tsx via cid:
    // (RFC 2392) — embedded in the email body, no external image fetch, works
    // in Gmail/Outlook/Apple Mail with images-on or images-off.
    //
    // WR-01: wordmarkPromise is hoisted to module scope so the file is read
    // once on cold-start (not per-signup) AND a missing/unreadable asset never
    // throws AFTER contacts.create succeeded. If null, send without attachment
    // -- the wordmark is decorative; the email body renders without it.
    const wordmark = await wordmarkPromise;

    // WR-02: wrap the send + analytics tail in `after()` from `next/server`.
    // The Server Action returns immediately after this branch (line below),
    // and on Vercel serverless any pending I/O the function holds open after
    // the response is sent can be killed mid-flight. `after()` is the App
    // Router primitive for guaranteed post-response work -- it keeps the
    // execution context alive until the Promise settles, so the
    // `welcome_email_send_error` track call actually reaches Vercel Analytics
    // (EMAIL-08 ops observability that was previously unreliable).
    after(
      resend.emails
        .send({
          from: 'Jeff at Zeremi <hello@zeremi.app>',
          to: email,
          subject: "You're on the Zeremi list",
          react: WelcomeEmail({
            unsubscribeUrl,
            postalAddress: env.RESEND_FROM_POSTAL_ADDRESS,
          }),
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:unsubscribe@zeremi.app>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
          attachments: wordmark
            ? [
                {
                  filename: 'wordmark.png',
                  content: wordmark,
                  contentId: WORDMARK_CID,
                },
              ]
            : [],
        })
        .catch((err) => {
          // CR-02: do NOT pass `email` (PII) to track(). Vercel Analytics persists
          // and indexes custom-event properties; forwarding the user's email to
          // the analytics dashboard would directly contradict app/(legal)/privacy
          // ("your email address is not stored by Vercel") and exceed the GDPR
          // Art. 5(1)(b) purpose-limitation basis the policy is built on. The
          // server-side console.error below still captures the email for ops
          // debugging; the analytics call only counts the failure.
          console.error('welcome_email_send_failed', { email, err });
          // EMAIL-08: ops observability for welcome-email send failures.
          // Return the analytics promise so `after()` waits on it, not just
          // on the email send.
          return track('welcome_email_send_error');
        }),
    );
  }

  // ANLY-03: server-side analytics — duplicate flag for Phase 5 dashboard.
  await track('waitlist_signup', { duplicate: isDuplicate });

  return { status: 'success', duplicate: isDuplicate };
}

/**
 * Empirically-confirmed shape of the not-found response from resend.contacts.get
 * against a preview audience (Plan 04-07 Task 2 Probe 1, 2026-04-28):
 *   { name: 'not_found', statusCode: 404, message: 'Contact not found' }
 *
 * The check is name-first (most stable) with a statusCode fallback. Anything
 * else from contacts.get (network error, auth error, etc.) is treated as fatal.
 */
function isContactNotFoundError(error: {
  name?: string | null;
  statusCode?: number | null;
  message?: string | null;
}): boolean {
  return error.name === 'not_found' || error.statusCode === 404;
}
