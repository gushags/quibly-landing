import { NextRequest, NextResponse } from 'next/server';
import { resend } from '@/lib/resend';
import { env } from '@/lib/env';
import { verifyToken } from '@/lib/unsubscribe-token';

/**
 * Phase 4 — Unsubscribe endpoint (EMAIL-04 / D-02).
 *
 * Two entry points share the same HMAC-token verification + Resend contact update:
 *
 * - POST: RFC 8058 one-click. Email clients (Gmail, Outlook, iCloud Mail) honor
 *   `List-Unsubscribe-Post: List-Unsubscribe=One-Click` by POSTing directly to
 *   the URL in the `List-Unsubscribe` header. RFC 8058 says senders MUST honor
 *   without confirmation — response body is irrelevant.
 *
 * - GET: human-clickable body link in the welcome email. Surfaces a minimal
 *   HTML confirmation page so a recipient who clicks the link sees feedback
 *   rather than a 405. Deferred-GET decision in 04-CONTEXT.md was flipped by
 *   plan 04-08 Task 5 after empirical UAT showed the body link is the
 *   primary unsubscribe UX (Gmail's header-driven button only surfaces for
 *   senders with sustained bulk-mail reputation, which a pre-launch waitlist
 *   does not yet have).
 *
 *   Prefetch risk (link-previewers / scanners issuing GETs) is bounded: tokens
 *   are HMAC-signed and unique per recipient, so a prefetch can only
 *   unsubscribe the original recipient, who already received the email. If
 *   post-launch reflection surfaces false-unsubscribe patterns, swap to a
 *   two-step confirm-form pattern (~15 LOC delta).
 *
 * Token format (CD-02): `${base64url(email)}.${base64url(hmac_sha256(email))}`
 * Signed with env.RESEND_WEBHOOK_SECRET.
 *
 * Runtime pinned to Node — `verifyToken` uses `crypto.subtle` which works on
 * both Edge and Node, but the Resend SDK requires Node.
 */

export const runtime = 'nodejs';

async function processUnsubscribe(req: NextRequest, via: 'GET' | 'POST') {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('t');

  if (!token) {
    return { status: 400 as const, body: 'Missing token', email: null };
  }

  const email = await verifyToken(token);
  if (!email) {
    // WR-06: log a non-PII fingerprint of the rejected token. The token format is
    // `${base64url(email)}.${base64url(hmac)}` — base64-encoded email leaks PII for
    // short addresses, so log only the trailing HMAC suffix (random bytes, no PII).
    console.warn('unsubscribe_invalid_token', {
      hmacSuffix: token.split('.')[1]?.slice(-6) ?? 'malformed',
      via,
    });
    return { status: 401 as const, body: 'Invalid token', email: null };
  }

  // CR-01: audience routing must mirror app/actions/join-waitlist.ts:142 — production env writes
  // to live audience; every other env (preview, dev, vercel pull) writes to preview audience.
  // The Resend SDK's contacts.update path falls back to the global /contacts/:email endpoint
  // when audienceId is omitted — that endpoint does NOT flip the audience-scoped contact, so
  // omitting audienceId silently breaks the unsubscribe flow against the real API.
  const audienceId =
    env.VERCEL_ENV === 'production'
      ? env.RESEND_AUDIENCE_ID
      : env.RESEND_AUDIENCE_PREVIEW_ID;

  // CR-02: inspect the { data, error } envelope. Resend's SDK does NOT throw on API errors;
  // it returns { data: null, error: { ... } }. Returning 200 OK on a silent failure tells the
  // recipient they're unsubscribed when the audience write actually failed (CAN-SPAM exposure).
  const { error: updateError } = await resend.contacts.update({
    audienceId,
    email,
    unsubscribed: true,
  });
  if (updateError) {
    console.error('unsubscribe_update_failed', {
      email,
      via,
      error: updateError,
    });
    return { status: 500 as const, body: 'Update failed', email };
  }

  console.info('unsubscribe_processed', { email, via });

  return { status: 200 as const, body: 'OK', email };
}

export async function POST(req: NextRequest) {
  const result = await processUnsubscribe(req, 'POST');
  return new NextResponse(result.body, { status: result.status });
}

export async function GET(req: NextRequest) {
  const result = await processUnsubscribe(req, 'GET');

  if (result.status === 500) {
    // CR-02: audience write failed against the Resend API. Surface a generic apology page
    // with a mailto fallback so the recipient has a manual path to unsubscribe.
    return new NextResponse(
      `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">` +
        `<meta name="viewport" content="width=device-width,initial-scale=1">` +
        `<meta name="robots" content="noindex"><title>Unsubscribe — Quibly</title>` +
        `<link rel="preconnect" href="https://fonts.googleapis.com">` +
        `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` +
        `<link href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300..900;1,300..900&family=Quicksand:wght@300..700&display=swap" rel="stylesheet">` +
        `<style>body{font-family:Figtree,system-ui,-apple-system,Segoe UI,sans-serif;max-width:480px;margin:80px auto;padding:0 24px;color:#1a1a1a}h1{color:#0d9488;font-family:Quicksand,system-ui;font-weight:600}p{line-height:1.5}</style>` +
        `</head><body><h1>Something went wrong</h1>` +
        `<p>We couldn't process your unsubscribe right now. Please email <a href="mailto:unsubscribe@usequibly.com">unsubscribe@usequibly.com</a> and we'll remove you manually.</p>` +
        `</body></html>`,
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }

  if (result.status !== 200) {
    return new NextResponse(
      `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">` +
        `<meta name="viewport" content="width=device-width,initial-scale=1">` +
        `<meta name="robots" content="noindex"><title>Unsubscribe — Quibly</title>` +
        `<link rel="preconnect" href="https://fonts.googleapis.com">` +
        `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` +
        `<link href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300..900;1,300..900&family=Quicksand:wght@300..700&display=swap" rel="stylesheet">` +
        `<style>body{font-family:Figtree,system-ui,-apple-system,Segoe UI,sans-serif;max-width:480px;margin:80px auto;padding:0 24px;color:#1a1a1a}h1{color:#0d9488;font-family:Quicksand,system-ui;font-weight:600}p{line-height:1.5}</style>` +
        `</head><body><h1>Unsubscribe link is invalid</h1>` +
        `<p>This link is missing or no longer valid. If you meant to unsubscribe, reply to any Quibly email or write to <a href="mailto:unsubscribe@usequibly.com">unsubscribe@usequibly.com</a> and we'll handle it manually.</p>` +
        `</body></html>`,
      {
        status: result.status,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      },
    );
  }

  return new NextResponse(
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">` +
      `<meta name="viewport" content="width=device-width,initial-scale=1">` +
      `<meta name="robots" content="noindex"><title>Unsubscribed — Quibly</title>` +
      `<link rel="preconnect" href="https://fonts.googleapis.com">` +
      `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` +
      `<link href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300..900;1,300..900&family=Quicksand:wght@300..700&display=swap" rel="stylesheet">` +
      `<style>body{font-family:Figtree,system-ui,-apple-system,Segoe UI,sans-serif;max-width:480px;margin:80px auto;padding:0 24px;color:#1a1a1a;text-align:center}h1{color:#0d9488;font-family:Quicksand, system-ui;font-weight:600}p{line-height:1.5}a{color:#0d9488}</style>` +
      `</head><body><h1>You're unsubscribed</h1>` +
      `<p>You won't receive any further Quibly emails. If this was a mistake, you can re-join the waitlist anytime at <a href="https://usequibly.com">usequibly.com</a>.</p>` +
      `</body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}
