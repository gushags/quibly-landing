---
status: diagnosed
trigger: "Tests 1, 3, 4 in 04-UAT.md — every signup the founder submitted during UAT (5 emails plus follow-ups) landed in the production Resend audience instead of the preview audience."
created: 2026-04-28T22:50:00Z
updated: 2026-04-28T23:05:00Z
---

## Current Focus

hypothesis: CONFIRMED — User has been performing UAT against the Vercel Production deployment at `https://quibly-landing.vercel.app/`. On a Production deployment, `process.env.VERCEL_ENV === 'production'`, so the CD-04 audience-routing logic in `app/actions/join-waitlist.ts:142–144` correctly routes writes to `RESEND_AUDIENCE_ID` (the production audience). This is the documented behavior — but it conflicts with the founder's mental model that "test signups during UAT should land in the preview audience". The mismatch is between UAT methodology and the Vercel-environment-driven routing rule, not a code bug.
test: Confirmed via three converging signals: (1) Plan 04-07 Task 6 explicitly registered the Resend webhook against `https://quibly-landing.vercel.app/api/webhooks/resend` — that's the production-aliased URL bound to the latest Production deployment by Vercel default; (2) Plan 04-07 Tasks 4 + 5 (mail-tester 10/10, Gmail inbox tests) were also conducted against that same URL — every passing-status UAT test ran on the Production deployment; (3) `.env.local` does NOT set `VERCEL_ENV`, RESEND_AUDIENCE_ID and RESEND_AUDIENCE_PREVIEW_ID are distinct values (no config swap), and the routing literal in the action is correct sense.
expecting: Confirmed.
next_action: Return ROOT CAUSE FOUND to orchestrator; do not apply fix (goal: find_root_cause_only). Fix planning happens in next workflow phase.

## Symptoms

expected: Test signups against the deployed app land in the preview Resend audience (RESEND_AUDIENCE_PREVIEW_ID). Production audience (RESEND_AUDIENCE_ID) should only receive writes from the actual Vercel Production environment.
actual: |
  1. "The emails are now populating the production waitlist instead of the preview waitlist. I don't know why. I didn't realize it. Ever since I sent the 5 emails, they've been going there."
  2. (On test 4) "pass, but it's going to production not preview"
errors: None — silent misrouting. The form succeeds and contacts.create writes to the production audience without warning.
reproduction: Submit a fresh email through the deployed waitlist form. Observe that contact lands in the Resend production audience instead of the preview audience.
started: During UAT on 2026-04-28 — first noticed mid-session during test 3.

## Eliminated

- hypothesis: "RESEND_AUDIENCE_ID and RESEND_AUDIENCE_PREVIEW_ID are misconfigured (e.g., both point to the same audience, or the values are swapped)"
  evidence: ".env.local contains two distinct audience IDs (RESEND_AUDIENCE_ID starts e393..., RESEND_AUDIENCE_PREVIEW_ID starts eab3...). Configuration is not duplicated. Whether they're swapped at the Vercel project level cannot be confirmed from the agent environment, but the writes go to the contact ID matching the local-known production ID, so the values are not swapped — they're being correctly distinguished and the code is selecting RESEND_AUDIENCE_ID when VERCEL_ENV='production'."
  timestamp: 2026-04-28T23:00:00Z

- hypothesis: "Conditional sense is reversed (writes production-tier when env is non-production)"
  evidence: "Read app/actions/join-waitlist.ts:142–144 directly. Conditional is `process.env.VERCEL_ENV === 'production' ? env.RESEND_AUDIENCE_ID : env.RESEND_AUDIENCE_PREVIEW_ID` — correct sense. On 'production' it picks production audience; on anything else it picks preview audience. Matches CD-04 verbatim."
  timestamp: 2026-04-28T23:00:00Z

- hypothesis: "Local dev with VERCEL_ENV=production accidentally pulled into .env.local"
  evidence: "grep '^VERCEL_ENV' .env.local returns nothing. VERCEL_ENV is not set in local environment. (Even if it were, the user reported ALL UAT signups during the deployed-app test session, so local dev was not the test surface.)"
  timestamp: 2026-04-28T23:00:00Z

## Evidence

- timestamp: 2026-04-28T22:50:00Z
  checked: app/actions/join-waitlist.ts lines 141-144 (audience routing logic)
  found: |
    const audienceId = process.env.VERCEL_ENV === 'production'
      ? env.RESEND_AUDIENCE_ID
      : env.RESEND_AUDIENCE_PREVIEW_ID
    Logic is correct sense per CD-04: production env → production audience; anything else (preview, dev, local) → preview audience.
  implication: Code is not swapped. The audience routing logic correctly does what CD-04 specifies. The question shifts to: what value of VERCEL_ENV did the user's request carry?

- timestamp: 2026-04-28T22:55:00Z
  checked: 04-07-SUMMARY.md Task 6 (webhook registration)
  found: |
    "Production-deploy URL: `https://quibly-landing.vercel.app/api/webhooks/resend`"
    "Webhook registered in Resend Dashboard for events: email.bounced, email.complained"
    "RESEND_WEBHOOK_SECRET set in Vercel env vars (Production + Preview + Development)"
  implication: The webhook was wired against the production deployment URL. quibly-landing.vercel.app is the auto-aliased production URL on Vercel — that hostname always points to the latest deployment promoted to Production. Strong signal user has been testing against Production.

- timestamp: 2026-04-28T22:55:00Z
  checked: 04-07-SUMMARY.md Tasks 4 + 5 (mail-tester + Gmail inbox tests)
  found: |
    Task 4: "10/10 achieved on 2026-04-28" — mail-tester requires sending a real email from the deployed app to a one-off mail-tester address.
    Task 5: "Welcome email arrives in Gmail within ~10s of signup… Unsubscribe round-trip: clicking link hit /unsubscribe?t=<token> and marked the contact unsubscribed: true in Resend audience."
    The from-display-name and domain-case fixes (commits 414e29a, 03cfe88) were diagnosed against real send 403s — only happens on a deployed environment with production-tier sending.
  implication: Multiple Plan 04-07 tasks executed against a deployed Vercel environment, with the same URL surface that the webhook was registered against — which is the Production deployment.

- timestamp: 2026-04-28T22:55:00Z
  checked: UAT.md test-3 / test-4 reports + STATE.md note about Plan 04-07 Task 6 webhook setup
  found: |
    User reports come from the SAME UAT session that exercised tests 1–8, all run against the deployed app. Webhook was registered against quibly-landing.vercel.app for the same session. UAT test 3's other gap (unsubscribe link going to porkbun parking page) is also consistent with testing against a deployed surface that has DNS routed to a registrar parking page — on Production where useQuibly.com may not yet be bound to Vercel via apex DNS, but quibly-landing.vercel.app IS resolving to Production.
  implication: All 8 UAT tests, including the 5 signups noted by the founder, were performed against the production-aliased deployment URL — therefore VERCEL_ENV was 'production' for every one of them, and the action correctly routed every write to RESEND_AUDIENCE_ID per the documented CD-04 routing rule.

- timestamp: 2026-04-28T23:00:00Z
  checked: .env.local audience IDs distinctness
  found: "RESEND_AUDIENCE_ID = e393… (distinct prefix); RESEND_AUDIENCE_PREVIEW_ID = eab3… (distinct prefix). Two different IDs, not duplicated. VERCEL_ENV not set locally."
  implication: Local config is sane. Eliminates the misconfigured-env-var hypothesis. Whatever happened, it isn't a config dup. The Vercel-side env vars cannot be inspected from this agent (would require `vercel env ls`), but if the production audience ID at Vercel matches the one in .env.local prefix `e393…` and the user IS seeing rows appear in that audience, then Vercel's RESEND_AUDIENCE_ID IS the production audience — values are not swapped at the Vercel level either.

## Resolution

root_cause: |
  No code bug. The CD-04 audience-routing rule in app/actions/join-waitlist.ts:142–144 is working exactly as documented:
    - Vercel Production deployment → VERCEL_ENV='production' → writes to RESEND_AUDIENCE_ID (production audience)
    - Vercel Preview / local dev / vercel pull → writes to RESEND_AUDIENCE_PREVIEW_ID (preview audience)
  
  The founder performed UAT against the Production-aliased Vercel URL `https://quibly-landing.vercel.app/`. That hostname is bound by Vercel to whichever deployment is currently promoted to Production, so VERCEL_ENV resolved to 'production' on every UAT submission and writes correctly went to the production audience.
  
  The mismatch is between UAT methodology and the routing rule: tests intended to land in the preview audience MUST be performed against a Vercel Preview deployment URL (e.g., `https://quibly-landing-git-<branch>-<team>.vercel.app/`) or against local dev (`npm run dev`), not against the production-aliased URL. Multiple Plan 04-07 tasks (mail-tester 10/10 verification, Gmail inbox tests, unsubscribe round-trip, webhook registration) were also performed against the production deployment in the same session — those paths required a deployed surface with verified DNS, and quibly-landing.vercel.app is the production-aliased deployment URL.
  
  This is a documentation / UAT-methodology gap, not a code defect.
fix: |
  No code change required to the routing logic — it correctly implements CD-04.
  
  Suggested fix directions for the next workflow phase to choose between (in priority order):
  
  1. **UAT methodology fix (lowest cost, recommended).** Document in 04-UAT.md and any future UAT template that "deployed app" tests must be performed against a Preview deployment URL, not the production-aliased URL. Surface a one-line guidance: "For UAT against the preview audience, use the latest preview deployment URL from the PR's Vercel comment, or `npm run dev` locally — NOT quibly-landing.vercel.app (that is the Production deployment and writes to the live audience)."
  
  2. **Pre-launch routing override (defensive).** Until the founder explicitly cuts over to live (e.g., apex DNS bound to Vercel), force ALL writes to the preview audience by either: (a) flipping the VERCEL_ENV check to `process.env.NEXT_PUBLIC_LAUNCHED === 'true'` with the env var unset until launch day; (b) hard-coding `audienceId = env.RESEND_AUDIENCE_PREVIEW_ID` with a TODO marker that gates the production-deploy on flipping back. Trade-off: changes documented CD-04 behavior; extra step required at launch.
  
  3. **Move 5 UAT signups out of production audience.** Use the now-shipped `npm run export:audience -- --target=production` to identify and manually delete the UAT-test contacts from the production audience via the Resend Dashboard (or a small `contacts.remove` script). Restores audience cleanliness for launch metrics.
  
  Option 1 is recommended unless the founder also wants Option 3 cleanup. Option 2 has a launch-day failure mode (forgetting to flip the flag) and is overkill given CD-04 is already correct.
verification: "Diagnosis only — no fix applied per goal: find_root_cause_only. Verification will be performed by the next workflow phase after a fix is selected and applied."
files_changed: []
