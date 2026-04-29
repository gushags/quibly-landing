---
status: diagnosed
trigger: "Unsubscribe sent a unsubscribe+token to the url, but it didn't go to the vercel.app; it went to porkbun's."
created: 2026-04-28T23:00:00Z
updated: 2026-04-28T23:25:00Z
---

## Current Focus

hypothesis: "CONFIRMED — Welcome email constructs unsubscribeUrl from `process.env.NEXT_PUBLIC_SITE_URL ?? 'https://useQuibly.com'` (action line 195). The apex domain `usequibly.com` is still on Porkbun nameservers (`*.ns.porkbun.com`) with A records pointing to Porkbun parking (52.33.207.7 / 44.230.85.241). Phase 6 (DEPLOY-01..02 — apex domain binding at the Vercel team level) has NOT shipped per ROADMAP.md `[ ] Phase 6` checkbox. Production deployment lives at `https://quibly-landing.vercel.app`. Result: every welcome-email unsubscribe link points to a hostname that DNS-routes to Porkbun's pixie-links parking service — clicks land at `https://usequibly-com.l.ink/...`, never reaching the Next.js /unsubscribe handler that DOES exist at app/unsubscribe/route.ts."
test: "Live DNS + HTTP probe confirms the routing."
expecting: "ROOT CAUSE FOUND — handing off to gsd-planner for fix planning."
next_action: "Return ROOT CAUSE FOUND diagnosis to orchestrator."

## Symptoms

expected: |
  Unsubscribe link in welcome email routes to the deployed app domain (e.g.
  usequibly.com or quibly-landing.vercel.app), so clicking it hits
  /unsubscribe?t=<token> on the running Next.js app.
actual: |
  "Unsubscribe sent a unsubscribe+token to the url, but it didn't go to the
  vercel.app; it went to porkbun's." — clicking unsubscribe lands on Porkbun's
  parking page instead of the Next.js app's /unsubscribe handler.
errors: none reported (the click succeeds at DNS, but resolves to the wrong host)
reproduction: |
  1. Submit a fresh email through the production form
  2. Receive welcome email in Gmail
  3. Click "Unsubscribe" link in footer
  4. Browser navigates to https://useQuibly.com/unsubscribe?t=<token>
  5. Page renders Porkbun parking, NOT the Quibly /unsubscribe handler
started: |
  Discovered during UAT 2026-04-28. Test 5 in Phase 4-07 SUMMARY claims the
  unsubscribe round-trip worked ("clicking link hit `/unsubscribe?t=<token>`
  and marked the contact `unsubscribed: true`"). However Test 3 in 04-UAT.md
  reports the user clicking the link landed on Porkbun. Possible explanation:
  Task 5's earlier verification was performed when site_url was a vercel.app
  preview URL, OR the welcome-email render had a different fallback then.

## Eliminated

(none yet — ruling out alternates next)

## Evidence

- timestamp: 2026-04-28T23:00:00Z
  checked: app/actions/join-waitlist.ts lines 192-196 (welcome email send block)
  found: |
    Line 195: const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://useQuibly.com'
    Line 196: const unsubscribeUrl = `${siteUrl}/unsubscribe?t=${await generateToken(email)}`
    The hostname comes from NEXT_PUBLIC_SITE_URL with fallback to the apex
    domain (mixed-case 'useQuibly.com'). DNS is case-insensitive so case isn't
    the issue, but if NEXT_PUBLIC_SITE_URL is unset OR set to `https://useQuibly.com`
    (apex), and the apex is still on Porkbun parking, the link routes there.
  implication: |
    The action body assumes `useQuibly.com` apex is pointed at Vercel. If
    Phase 6 (apex binding) hasn't shipped, this assumption is false and every
    welcome-email link goes to Porkbun.

- timestamp: 2026-04-28T23:00:00Z
  checked: emails/WelcomeEmail.tsx lines 105-107 (Unsubscribe Link element)
  found: |
    The <Link href={unsubscribeUrl}> uses the URL prop verbatim — no second
    construction layer. Whatever the action sends becomes the click target.
  implication: |
    Email template is not the source of mismatch — the URL is constructed
    upstream in the action. Single point of truth for the hostname.

- timestamp: 2026-04-28T23:00:00Z
  checked: .planning/phases/04-resend-wiring-bot-protection-welcome-email/04-07-SUMMARY.md Task 6
  found: |
    Production deployment is at https://quibly-landing.vercel.app/api/webhooks/resend
    The webhook is registered at the .vercel.app subdomain — strong implication
    that the apex domain useQuibly.com is NOT yet bound at the Vercel team
    level (per CONTEXT: "Apex domain binding at Vercel team level
    (DEPLOY-01..02) — Phase 6").
  implication: |
    useQuibly.com apex is still on Porkbun's nameservers / parking page.
    Welcome-email links pointing to that hostname WILL land on Porkbun.

- timestamp: 2026-04-28T23:00:00Z
  checked: .planning/phases/04-resend-wiring-bot-protection-welcome-email/04-07-SUMMARY.md Task 5 (Inbox tests)
  found: |
    Task 5 reports unsubscribe round-trip as PASS with the comment "clicking
    link hit /unsubscribe?t=<token> and marked the contact unsubscribed: true
    in Resend audience." This contradicts the user's UAT report unless: (a)
    Task 5 was tested against a preview URL (NEXT_PUBLIC_SITE_URL pointed to
    vercel.app at the time), OR (b) Task 5's verification was performed
    differently / on a different environment than what the user just hit.
  implication: |
    Possible drift: NEXT_PUBLIC_SITE_URL was set to a vercel.app URL during
    Task 5 testing, then changed (or never updated) for production deploy.
    Or the production deploy uses the fallback `'https://useQuibly.com'`
    because NEXT_PUBLIC_SITE_URL is unset in Vercel Production env. Need to
    check Vercel env vars (cannot do from this session — surface as evidence
    needed in the diagnosis).

- timestamp: 2026-04-28T23:00:00Z
  checked: .env.example line 51-52
  found: |
    # Public site URL for unsubscribe link construction in welcome email (Phase 4)
    # Production: https://useQuibly.com  | Preview: https://your-preview.vercel.app
    NEXT_PUBLIC_SITE_URL=https://useQuibly.com
    The example explicitly documents that production should use
    https://useQuibly.com — so the production env var (if set) is most
    likely set to that value, and the apex isn't on Vercel yet.
  implication: |
    Strong corroboration that the welcome email's link is constructed as
    https://useQuibly.com/unsubscribe?t=... in production AND that the
    apex isn't bound to Vercel. Both halves of the bug confirmed.

## Evidence (continued — direct DNS + HTTP measurement)

- timestamp: 2026-04-28T23:21:00Z
  checked: dig +short usequibly.com NS
  found: |
    curitiba.ns.porkbun.com.
    fortaleza.ns.porkbun.com.
    maceio.ns.porkbun.com.
    salvador.ns.porkbun.com.
  implication: |
    Apex domain still uses Porkbun nameservers. To bind usequibly.com to
    Vercel, the nameservers (or at minimum the A/CNAME records) must be
    delegated to Vercel — this hasn't happened.

- timestamp: 2026-04-28T23:21:00Z
  checked: dig +short usequibly.com A
  found: |
    52.33.207.7
    44.230.85.241
  implication: |
    A records point to Porkbun's parking infrastructure (NOT Vercel's
    76.76.21.21 / Cloudflare-fronted IP space).

- timestamp: 2026-04-28T23:21:00Z
  checked: curl -sI -L https://usequibly.com/unsubscribe?t=test
  found: |
    HTTP/2 302
    server: openresty
    location: https://usequibly-com.l.ink/unsubscribe?t=test
    x-service: pixie-links
  implication: |
    Definitive: the apex redirects to Porkbun's "pixie-links" parking
    service. This is exactly the user-reported symptom — clicking unsubscribe
    in the welcome email lands at Porkbun, not the Next.js handler.

- timestamp: 2026-04-28T23:21:00Z
  checked: ROADMAP.md Phase 6 checkbox state
  found: |
    Line 20: "- [ ] **Phase 6: Production Deploy + Cutover Runbook** -
    Apex bound at Vercel team level with full DNS, mail-tester 10/10,
    dry-run cutover, and a written `docs/cutover.md`"
    Phase 6 contains DEPLOY-01..09 — apex binding has not shipped.
  implication: |
    The infrastructure prerequisite for the welcome-email link to work is
    a future phase. Welcome-email URL construction was written assuming
    apex would already be live — that assumption is wrong for the current
    pre-Phase-6 deployment window.

- timestamp: 2026-04-28T23:21:00Z
  checked: app/unsubscribe/route.ts existence
  found: "File exists (ls confirms `route.ts` in app/unsubscribe/)"
  implication: |
    The /unsubscribe handler is real and live at the .vercel.app deployment.
    The bug is purely in the URL hostname construction — not the route.

- timestamp: 2026-04-28T23:21:00Z
  checked: Task 5 vs Test 3 contradiction in 04-07-SUMMARY.md
  found: |
    Task 5 (inbox tests) reports unsubscribe round-trip PASSED. Test 3
    (current UAT) reports it FAILED. Likely explanation: at Task 5 time,
    NEXT_PUBLIC_SITE_URL in Vercel Preview env was set to the deploy's
    .vercel.app URL — so the welcome-email link routed correctly. For the
    current production-target test, NEXT_PUBLIC_SITE_URL is either unset
    in Vercel Production (falling back to 'https://useQuibly.com') OR
    explicitly set to that apex per .env.example's documented production
    value. Either way, the apex isn't bound, so the link breaks.
  implication: |
    The bug is environment-specific (Vercel Production env), not a code
    regression. The fallback default `'https://useQuibly.com'` (action
    line 195) was correct *as a future state* but premature for the
    current pre-Phase-6 reality.

## Resolution

root_cause: |
  Welcome-email unsubscribe URL is constructed at app/actions/join-waitlist.ts
  line 195-196 from `process.env.NEXT_PUBLIC_SITE_URL ?? 'https://useQuibly.com'`.
  The apex domain `usequibly.com` is not yet bound to Vercel — Phase 6
  (DEPLOY-01..02 apex-domain binding at Vercel team level) has not shipped
  (ROADMAP.md line 20 shows `[ ]`). DNS for the apex still resolves to
  Porkbun's parking infrastructure (nameservers `*.ns.porkbun.com`, A records
  `52.33.207.7` / `44.230.85.241`, redirected by `pixie-links` to
  `usequibly-com.l.ink`). The Next.js /unsubscribe handler is live but only
  at `https://quibly-landing.vercel.app/unsubscribe` (per the Task 6 webhook
  URL in Plan 04-07 SUMMARY). Therefore every welcome-email unsubscribe link
  hits Porkbun's parking page instead of the Next.js handler. The bug is a
  premature production-default in the URL fallback combined with an unfinished
  Phase 6 prerequisite — not a code defect in the action's logic, the route
  handler, or the email template per se.
fix: (TBD — gsd-planner will plan in next workflow phase. Two viable directions: A) override Vercel Production env var NEXT_PUBLIC_SITE_URL=https://quibly-landing.vercel.app until apex is bound, then flip to https://usequibly.com when Phase 6 ships; B) replace the fallback in action with VERCEL_URL-based default that always tracks the live deployment and only uses the apex when an explicit env var is set; C) ship Phase 6 apex-binding now.)
verification: (TBD — must verify a click on the welcome-email unsubscribe link in production lands at the Next.js handler and 200s, AND that the Resend contact gets marked unsubscribed.)
files_changed: []
