---
status: diagnosed
phase: 04-resend-wiring-bot-protection-welcome-email
source: [04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md, 04-04-SUMMARY.md, 04-05-SUMMARY.md, 04-06-SUMMARY.md, 04-07-SUMMARY.md]
started: 2026-04-28T22:30:00Z
updated: 2026-04-28T23:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Real signup adds contact to Resend audience
expected: |
  Submit a fresh email through the form. Form replaced by success block.
  Resend Dashboard → Preview audience shows the new email as a row with a
  recent created_at. No duplicate, no error toast.
result: pass

### 2. Welcome email arrives in Gmail with correct branding
expected: |
  Within ~60s of the signup above, a welcome email arrives in Gmail.
  From renders as `Quibly <hello@usequibly.com>`. Subject is
  `You're on the Quibly list`. Header strip is teal with the Quicksand
  "Quibly" wordmark (rendered as inline PNG, NOT system Helvetica).
  Body shows the four D-01 paragraphs ("Thanks for joining…", "I'm Jeff",
  "strategy-first AI marketing tool", "hit reply if there's…"). Footer
  shows Unsubscribe link + a postal-address line (placeholder is OK for
  now — Task 3 will replace).
result: pass

### 3. Unsubscribe link round-trip
expected: |
  In the Gmail welcome email, click the Unsubscribe link in the footer.
  Browser navigates to `/unsubscribe?t=<token>` and returns 200.
  Refresh Resend Dashboard → Preview audience: the contact row now shows
  `unsubscribed: true`.
result: issue
reported: "Unsubscribe sent a unsubscribe+token to the url, but it didn't go to the vercel.app; it went to porkbun's. (Also flagged during this test: emails are populating the production waitlist instead of the preview waitlist — see separate gap.)"
severity: blocker

### 4. Duplicate email is silently idempotent
expected: |
  Submit the SAME email from test 1 a second time. Form shows the same
  success block (no "already subscribed" wording — anti-enumeration).
  Resend Dashboard still shows exactly ONE row for that email (no
  duplicate). Gmail inbox: no second welcome email arrives. (Empirical
  Probe 1 finding: contacts.create is idempotent on email; get-then-create
  pattern in action body suppresses the second welcome.)
result: pass
note: "User confirmed pass for idempotency, but reiterated that writes are landing in production audience not preview — tracked under the separate test-3 gap."

### 5. Disposable domain is silently rejected
expected: |
  Submit `uat-test@mailinator.com` (mailinator is in the 25-entry blocklist).
  Form shows the SAME success block as a real signup (no rejection wording
  surfaced — silent-success posture). Resend Dashboard → Preview audience:
  NO new row for the mailinator address. No welcome email is generated.
result: pass

### 6. Rate limit trips after burst
expected: |
  From the same client/IP, rapidly submit 6+ unique fresh emails within
  60 seconds (e.g., `burst-1@…` through `burst-6@…`). Each submission
  shows the same success block (silent-success posture). Resend Dashboard:
  exactly 5 contacts created in that window — submissions 6+ were
  rate-limit-rejected (5/min sliding window). Logs would show
  `signup_rejected` with `reason: rate_limit` for the rejected ones.
result: pass

### 7. Webhook bounce marks contact unsubscribed
expected: |
  Already empirically verified in Task 6 — submitting `bounced@resend.dev`
  (or any address routed through Amazon SES bounce simulator) triggers
  Resend's `email.bounced` webhook with `bounce.type: 'Permanent'`. Vercel
  logs show `email_hard_bounced` with the `subType: 'General'` payload.
  Resend Dashboard shows the bounced contact marked `unsubscribed: true`.
  Confirm this still holds (or re-run the probe).
result: pass

### 8. CSV export round-trip preserves consent_version
expected: |
  Run `npm run export:audience -- --target=preview --format=csv` from the
  repo root. Output is a CSV containing all contacts in the preview
  audience with columns including `email`, `created_at`, `unsubscribed`,
  AND `consent_version` (flattened from the typed Resend property shape).
  No errors. ~7.7 req/sec pacing under Resend's 10 req/sec limit.
result: pass

## Summary

total: 8
passed: 7
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Unsubscribe link in welcome email points to the deployed app domain (e.g. usequibly.com or quibly-landing.vercel.app), not the registrar/parking page"
  status: failed
  reason: "User reported: Unsubscribe sent a unsubscribe+token to the url, but it didn't go to the vercel.app; it went to porkbun's."
  severity: blocker
  test: 3
  root_cause: |
    Environment/infrastructure bug, not a code logic bug. The welcome-email
    unsubscribe URL is constructed at app/actions/join-waitlist.ts:195-196 from
    `process.env.NEXT_PUBLIC_SITE_URL ?? 'https://useQuibly.com'`. The apex
    domain `usequibly.com` is NOT yet bound to Vercel (Phase 6 DEPLOY-01..02
    apex-domain binding is unshipped). DNS for the apex still points at
    Porkbun's parking nameservers (`*.ns.porkbun.com` → IPs 52.33.207.7 /
    44.230.85.241), so links to that hostname land on Porkbun's pixie-links
    parking redirector (HTTP 302 → `usequibly-com.l.ink/...`, header
    `x-service: pixie-links`) rather than the live Next.js /unsubscribe route
    (which is correctly deployed at quibly-landing.vercel.app/unsubscribe).
    The action's URL construction, the unsubscribe route handler, and the
    email template are all correct — only the fallback hostname is premature.
  artifacts:
    - path: "app/actions/join-waitlist.ts"
      issue: "Line 195 fallback `'https://useQuibly.com'` constructs unsubscribeUrl against an apex that isn't bound to Vercel yet"
    - path: ".env.example"
      issue: "Line 52 documents NEXT_PUBLIC_SITE_URL=https://useQuibly.com as the production default, premature given apex isn't bound"
    - path: ".planning/ROADMAP.md"
      issue: "Phase 6 (DEPLOY-01..02 apex binding) unshipped — see line 20"
  missing:
    - "Either: set NEXT_PUBLIC_SITE_URL=https://quibly-landing.vercel.app in Vercel Production env vars (quick env-only fix, no code change)"
    - "Or: change the action fallback to derive from VERCEL_PROJECT_PRODUCTION_URL / VERCEL_URL so links track the actual deployment host until apex binds"
    - "Or: accelerate Phase 6 — bind useQuibly.com to Vercel team-level (DEPLOY-01..02) so the existing fallback works as documented"
  debug_session: .planning/debug/unsubscribe-url-routes-to-porkbun.md

- truth: "Test signups against the deployed app land in the preview Resend audience, not production"
  status: failed
  reason: "User reported: The emails are now populating the production waitlist instead of the preview waitlist. I don't know why. I didn't realize it. Ever since I sent the 5 emails, they've been going there. Reiterated on test 4: 'pass, but it's going to production not preview'."
  severity: major
  test: 3
  root_cause: |
    No code bug. The CD-04 audience-routing logic in
    app/actions/join-waitlist.ts:142-144 is implemented correctly:
    `process.env.VERCEL_ENV === 'production' ? RESEND_AUDIENCE_ID :
    RESEND_AUDIENCE_PREVIEW_ID`. The founder ran UAT against the
    Production-aliased Vercel URL `quibly-landing.vercel.app/`. On any
    deployment promoted to Production, VERCEL_ENV='production', so the action
    correctly routes writes to RESEND_AUDIENCE_ID. The mismatch is between
    UAT methodology and the documented routing rule, not a defect — the same
    deployment URL was used for all of Plan 07's mail-tester / Gmail / wordmark
    testing. To exercise the preview audience, UAT must run against a Vercel
    Preview deployment URL or local `npm run dev`. Local `.env.local` has
    distinct preview/production audience IDs and no VERCEL_ENV override —
    eliminating config-swap and accidental-VERCEL_ENV hypotheses.
  artifacts:
    - path: "app/actions/join-waitlist.ts"
      issue: "Lines 142-144 routing logic verified correct (CD-04) — no code change required"
    - path: ".planning/phases/04-resend-wiring-bot-protection-welcome-email/04-UAT.md"
      issue: "UAT lacks methodology guidance about which URL routes to which audience — caused the founder to misinterpret routing as a bug"
  missing:
    - "Add UAT methodology guidance: preview-audience tests must run against a Vercel Preview URL or `npm run dev`, NOT the Production-aliased `quibly-landing.vercel.app`"
    - "Optional: clean up the ~5 UAT-test contacts from the production audience using `npm run export:audience -- --target=production` to enumerate, then remove via Resend Dashboard or a `contacts.remove` script — restores audience cleanliness for launch metrics"
    - "Optional defensive: introduce a NEXT_PUBLIC_LAUNCHED gate so pre-launch writes always go to preview regardless of VERCEL_ENV (changes CD-04 behavior; introduces a launch-day flip step)"
  debug_session: .planning/debug/signups-land-in-production-audience.md
