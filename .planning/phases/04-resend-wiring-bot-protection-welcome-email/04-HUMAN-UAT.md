---
status: partial
phase: 04-resend-wiring-bot-protection-welcome-email
source: [04-VERIFICATION.md]
started: 2026-04-29T00:00:00Z
updated: 2026-04-29T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Postal address — production-deploy gate (Phase 6)

expected: Source a real non-home postal address (registered agent / PO Box / CMRA), set `RESEND_FROM_POSTAL_ADDRESS` in Vercel Production env to that value, redeploy, send a fresh signup against `https://quibly-landing.vercel.app`, verify the welcome-email footer shows the real address (not the current `Quibly · TBD · TBD` placeholder). CAN-SPAM EMAIL-05 satisfied for the live audience.

result: [pending]

why_human: Sourcing the postal address requires a real-world action (registered-agent signup, PO Box rental, or CMRA paperwork). Cannot be performed programmatically. Plan 04-07 Task 3 explicitly deferred sourcing. Phase 6 launch cannot ship until closed. Note: `lib/env.ts` `RESEND_FROM_POSTAL_ADDRESS` refine() rejects the canonical placeholder strings (`YOUR-POSTAL-ADDRESS-HERE`, `Test Address`) when `VERCEL_ENV=production`, but the current value `Quibly · TBD · TBD` slips through that filter — refine pattern can be tightened opportunistically, but the load-bearing gate is the founder closing this human-UAT item.

### 2. Outlook + iCloud inbox verification (ROADMAP SC #2)

expected: Submit fresh emails to (a) one Outlook/Hotmail address and (b) one iCloud address against the production deployment. Confirm for each:
1. Arrival within 60s
2. From shows "Quibly"
3. Both `List-Unsubscribe` and `List-Unsubscribe-Post` headers visible in client's "View Source" / "Show Original"
4. DKIM-Signature line includes both header names in `h=`
5. Body-link unsubscribe round-trip flips the Resend contact to `unsubscribed: true`

result: [pending]

why_human: Email-client rendering and header presentation can only be observed in the actual clients. Founder explicitly approved Gmail-only verification per Plan 04-07 SUMMARY (Task 5). ROADMAP SC #2 names all three (Gmail/Outlook/iCloud). Spot-check is prudent before Phase 6 launch.

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
