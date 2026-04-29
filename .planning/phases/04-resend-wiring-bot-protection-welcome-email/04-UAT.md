---
status: complete
phase: 04-resend-wiring-bot-protection-welcome-email
source: [04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md, 04-04-SUMMARY.md, 04-05-SUMMARY.md, 04-06-SUMMARY.md, 04-07-SUMMARY.md]
started: 2026-04-28T22:30:00Z
updated: 2026-04-28T22:46:00Z
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
  artifacts: []
  missing: []

- truth: "Test signups against the deployed app land in the preview Resend audience, not production"
  status: failed
  reason: "User reported: The emails are now populating the production waitlist instead of the preview waitlist. I don't know why. I didn't realize it. Ever since I sent the 5 emails, they've been going there. Reiterated on test 4: 'pass, but it's going to production not preview'."
  severity: major
  test: 3
  artifacts: []
  missing: []
