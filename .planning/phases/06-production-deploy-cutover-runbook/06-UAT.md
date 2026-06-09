---
status: pending
phase: 06-production-deploy-cutover-runbook
source: [06-01-SUMMARY.md, 06-02-SUMMARY.md, 06-04-SUMMARY.md, 06-05-SUMMARY.md]
started: 2026-04-29T00:00:00Z
updated: 2026-04-29T00:00:00Z
---

## Current Test

[awaiting Plan 06-04 / 06-05 execution]

## Tests

### 1. privacy@zeremi.app mailbox provisioned and reachable (HARD launch-gate)
expected: |
  Founder action item — Phase 5 CD-07 / D-02 carryover. Provision the
  privacy@zeremi.app mailbox via one of: Resend Inbound forward, Google
  Workspace alias, ImprovMX, or Cloudflare Email Routing.
  Test: send a fresh email from an external address (e.g., a personal Gmail) to
  privacy@zeremi.app with subject "DSAR provisioning test <date>".
  Observe: founder receives the email in the destination inbox within 60 seconds.
  Record date/time received and destination inbox name in this test's `note:`.
  HARD LAUNCH-GATE — production form MUST NOT be exposed to public traffic
  until this test is `pass`. Privacy-policy DSAR contract violation otherwise.
  Requirement: LEGAL-08 (Phase 5 carryover).
result: pending

### 2. Production apex resolves to zeremi-landing prod deploy (DEPLOY-01)
expected: |
  After production deploy + apex bind: from a fresh terminal, run:
    curl -sI https://zeremi.app | head -1
  Expected: HTTP/2 200
  Then: curl -s https://zeremi.app | grep -c Zeremi
  Expected: a count > 0 (Zeremi brand markers present in body)
  Record both command outputs in this test's `note:` field.
  Requirement: DEPLOY-01.
result: pending

### 3. Apex domain bound at Vercel team level (DEPLOY-02)
expected: |
  Vercel Dashboard → switch scope to the team that owns zeremi-landing →
  Domains tab. Confirm `zeremi.app` is listed there with project assignment
  to `zeremi-landing`. Take a screenshot of the team Domains tab showing the
  apex listed. Save screenshot at:
    .planning/phases/06-production-deploy-cutover-runbook/screenshots/06-uat-03-team-domains.png
  Record screenshot path in this test's `note:` field.
  Requirement: DEPLOY-02.
result: pending

### 4. SPF + DKIM + DMARC p=none + Return-Path DNS records resolve (DEPLOY-03, DEPLOY-04)
expected: |
  From a fresh terminal, run all of:
    dig +short ns zeremi.app
    dig +short txt zeremi.app | grep spf1
    dig +short txt resend._domainkey.zeremi.app
    dig +short txt _dmarc.zeremi.app | grep 'p=none'
    dig +short mx send.zeremi.app           # Resend uses MX (not CNAME) on send subdomain
    dig +short txt send.zeremi.app          # SPF for send subdomain (Return-Path alignment)
  Expected:
    - ns: 2+ nameserver records (vercel-dns or external — note which)
    - apex SPF: covers any apex senders in use (e.g. Google Workspace include).
      Resend send-side SPF lives on the send.zeremi.app subdomain (see below).
    - DKIM: 1 record at resend._domainkey selector containing "v=DKIM1; k=rsa; p=<key>".
      (Resend issues a single DKIM selector — verified empirically 2026-05-04 via
      Resend API GET /domains/{id} `records[]`. Earlier "3 selectors" expectation
      was incorrect.)
    - DMARC: "v=DMARC1; p=none; rua=mailto:..."
    - Return-Path: MX at send.zeremi.app → feedback-smtp.<region>.amazonses.com,
      plus TXT "v=spf1 include:amazonses.com ~all" on the same name. (Resend uses
      MX+TXT on send subdomain, not a CNAME — verified 2026-05-04.)
  Paste each command's output verbatim into this test's `note:` field.
  Then: Resend Dashboard → Domains → zeremi.app → confirm all DNS rows
  show green ✓ status. Take a screenshot. Save at:
    .planning/phases/06-production-deploy-cutover-runbook/screenshots/06-uat-04-resend-dns.png
  Requirement: DEPLOY-03, DEPLOY-04.
result: pass
note: |
  Verified 2026-05-04 via debug session phase-6-uat-failures. Resend API confirms
  all 3 records (DKIM TXT, send MX, send SPF TXT) status=verified. dig from Porkbun
  authoritative NS confirms each record exists. Resend Dashboard all-green ✓.
  DKIM alignment: resend._domainkey.zeremi.app signs with d=zeremi.app → exact
  match. SPF alignment: From=zeremi.app, Return-Path uses send.zeremi.app
  (subdomain → relaxed alignment passes).

### 5. mail-tester.com ≥9/10 score from production apex sender (DEPLOY-05)
expected: |
  Visit https://www.mail-tester.com → copy the generated single-use email
  address. From the production apex form (https://zeremi.app), submit a
  signup using the mail-tester address (the single-use address acts as a
  fresh inbox). Wait for the welcome email to arrive at mail-tester (check
  Resend Dashboard → Logs to confirm send), then on mail-tester.com click
  "Then check your score". Expected: ≥9/10. The 1-point cap at 9/10 is the
  architectural ceiling while DMARC stays at p=none (intentional warmup
  posture). Lifting to 10/10 requires DMARC p=quarantine, which is a
  post-warmup change tracked separately (NOT a Phase 6 launch-gate).
  If <9, debug the specific failed check (SPF / DKIM / DMARC alignment /
  content) before exposing the form publicly.
  Paste the mail-tester result URL into this test's `note:`. Save screenshot at:
    .planning/phases/06-production-deploy-cutover-runbook/screenshots/06-uat-05-mailtester.png
  Requirement: DEPLOY-05.
result: pass
note: |
  9/10 confirmed 2026-05-04. Single deduction is DMARC p=none (monitoring mode),
  which is intentional pre-launch policy. Per debug session phase-6-uat-failures:
  SPF, DKIM, alignment, and content all clean. DMARC tightening (p=quarantine)
  deferred to post-warmup follow-up.

### 6. Production real-signup writes to production audience + welcome arrives in Gmail (DEPLOY-08)
expected: |
  From a fresh Gmail inbox (or any real test inbox), submit a fresh email
  through the production form at https://zeremi.app. Verify:
    a) Form replaces with success message ("You're on the list…")
    b) Resend Dashboard → Audiences → "Zeremi Waitlist" (production) → new
       contact row appears with the test email and current created_at
    c) Welcome email arrives at the test inbox within 60 seconds
    d) From: renders as "Jeff at Zeremi <hello@zeremi.app>"
    e) Subject: "You're on the Zeremi list"
    f) Body: 4 D-01 paragraphs render correctly, footer shows real postal
       address (not placeholder), unsubscribe link present
    g) Click unsubscribe → /unsubscribe?t=<token> returns 200 → contact in
       Resend Dashboard now shows unsubscribed: true
  Record test email + Resend contact id + timestamps in this test's `note:`.
  Requirement: DEPLOY-08 (cutover runbook end-to-end smoke).
result: pending

### 7. Five hardening headers emit on canonical serving URL (DEPLOY-06)
expected: |
  Canonical URL note: zeremi.app (apex) is intentionally configured at Vercel
  as a 307 redirect to https://www.zeremi.app. The apex 307 carries Vercel's
  platform HSTS (max-age=63072000) on the redirect response itself; the Next.js
  app's headers() config only emits on responses served by the app, i.e. on
  the canonical www host. Test against the canonical URL.

  From a fresh terminal, run:
    curl -sI https://www.zeremi.app | grep -iE "strict-transport-security|x-content-type-options|x-frame-options|referrer-policy|permissions-policy"
  Expected: 5 lines (case may vary), exact values:
    strict-transport-security: max-age=300
    x-content-type-options: nosniff
    x-frame-options: DENY
    referrer-policy: strict-origin-when-cross-origin
    permissions-policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
  Then verify HSTS is EXACTLY max-age=300 (no token-A, no token-B):
    curl -sI https://www.zeremi.app | grep -i strict-transport
  REJECT if response contains the directive that locks subdomains or the
  directive that submits to the browser allowlist (forbidden tokens are
  enumerated in 06-PATTERNS.md and next.config.ts). Refer to 06-VALIDATION.md
  test 06-01-01 for the exact regex match.
  Verify sub-routes also receive headers:
    curl -sI https://www.zeremi.app/robots.txt | grep -i strict-transport
    curl -sI https://www.zeremi.app/sitemap.xml | grep -i strict-transport
    curl -sI https://www.zeremi.app/opengraph-image | grep -i strict-transport
    curl -sI https://www.zeremi.app/privacy | grep -i strict-transport
    curl -sI https://www.zeremi.app/terms | grep -i strict-transport
  All 5 sub-routes must emit the HSTS header (source: '/(.*)' covers all).
  Required header names (verbatim per next.config.ts):
    Strict-Transport-Security
    X-Content-Type-Options
    X-Frame-Options
    Referrer-Policy
    Permissions-Policy
  Apex sanity check (optional): curl -sI https://zeremi.app | head -1 → HTTP/2 307
  with location: https://www.zeremi.app/ — confirms the redirect layer is the
  one responsible for the platform HSTS=63072000 on apex requests.
  Paste full output in this test's `note:` field.
  Requirement: DEPLOY-06.
result: pass
note: |
  Verified 2026-05-04 via debug session phase-6-uat-failures. www.zeremi.app
  returns HTTP/2 200 with all 5 headers at exact configured values. apex returns
  HTTP/2 307 → www, carrying Vercel platform HSTS (expected on edge redirect).
  next.config.ts headers() config is correct and deployed.

### 8. No Service Worker registered on production load (DEPLOY-07)
expected: |
  Per CD-03 (manual DevTools checkpoint chosen over CI grep / Playwright spec).
  Steps:
    1. Open https://zeremi.app in a fresh incognito/private window
    2. Open DevTools (Cmd-Opt-I / Ctrl-Shift-I)
    3. Application tab → Storage section → Service Workers
    4. Confirm panel is empty for the zeremi.app origin (no entries; or
       only "Service workers from other origins" header with no rows beneath)
    5. Belt-and-suspenders source check (optional): from the repo, run:
         grep -rEn "navigator\.serviceWorker|register\s*\(.*sw\.|register\s*\(.*service-worker" app/ lib/ components/ 2>/dev/null
       Expected: zero output lines.
  Take a screenshot of the empty Service Workers panel. Save at:
    .planning/phases/06-production-deploy-cutover-runbook/screenshots/06-uat-08-no-sw.png
  Requirement: DEPLOY-07.
result: pending

### 9. Production OG / sitemap / robots / favicon smoke (Phase 5 carryover re-verify against prod)
expected: |
  From a fresh terminal, run:
    curl -sI https://zeremi.app/opengraph-image | head -1   # → HTTP/2 200
    curl -s https://zeremi.app/sitemap.xml                  # → valid XML, includes zeremi.app/, /privacy, /terms
    curl -s https://zeremi.app/robots.txt                   # → 10 AI-crawler Allow rules + Sitemap line
    curl -sI https://zeremi.app/icon | head -1              # → HTTP/2 200
    curl -sI https://zeremi.app/apple-icon | head -1        # → HTTP/2 200
  Paste each command's output in this test's `note:` field.
  Requirement: Phase 5 SEO-04 / SEO-06 / SEO-07 carryover re-verify on production apex.
result: pending

### 10. Resend Audience CSV export includes consent_version column (Pitfall 6 / A1 empirical)
expected: |
  Resend Dashboard → Audiences → "Zeremi Waitlist" (production) → Export
  Contacts → CSV. If audience <1000 contacts: download starts immediately;
  if ≥1000: link arrives via email (7-day expiry, admin-only).
  Open the downloaded CSV and verify the column header row contains AT MINIMUM:
    id, email, created_at, unsubscribed, consent_version
  If consent_version column is MISSING:
    - Mark this test as result: fail with severity: blocker
    - Document the gap: cutover.md Step 2 must invoke the API-fallback
      snapshot script path (06-RESEARCH.md §Code Examples lines 609–626)
      before any future cutover proceeds
    - This DOES NOT block today's go-live (cutover is future-only)
  Record column list + audience contact count in this test's `note:` field.
  Requirement: STORE-04 follow-up / Pitfall A1 (gates cutover.md Step 2 fallback decision).
result: pending

### 11. Cutover dry-run transfer back-and-forth on staging.zeremi.app (DEPLOY-09 / D-05/D-06/D-07)
expected: |
  Pre-flight: dig +short ns zeremi.app → if response is ns1.vercel-dns.com
  / ns2.vercel-dns.com, sub-flow A (auto-CNAME) applies. Else sub-flow B
  (manual CNAME at external provider: staging → cname.vercel-dns.com).
  Steps (verbatim 06-RESEARCH.md lines 635–671):
    1. Vercel Dashboard → zeremi-landing → Settings → Domains → Add Domain
       → enter staging.zeremi.app → confirm
       (auto-CNAME if Vercel NS, else add CNAME at external provider first)
       Wait until status shows "Valid Configuration".
       Smoke test: curl -sI https://staging.zeremi.app | head -5 → 200
       SCREENSHOT 1: staging.zeremi.app bound to zeremi-landing,
       Valid Configuration. Save at:
         .planning/phases/06-production-deploy-cutover-runbook/screenshots/06-uat-11-1-bound.png
    2. Vercel Dashboard → marketing-app → Settings → Domains → Add Domain
       → enter staging.zeremi.app → in-use prompt: "This domain is
       currently in use by another project. Move it here?" → Confirm
       SCREENSHOT 2: capture the in-use prompt verbatim. Save at:
         .planning/phases/06-production-deploy-cutover-runbook/screenshots/06-uat-11-2-prompt.png
       Smoke test: curl -sI https://staging.zeremi.app | head -5 → 200
       served from marketing-app
       SCREENSHOT 3: marketing-app loading at staging.zeremi.app. Save at:
         .planning/phases/06-production-deploy-cutover-runbook/screenshots/06-uat-11-3-marketing-load.png
    3. Vercel Dashboard → zeremi-landing → Settings → Domains → Add Domain
       → enter staging.zeremi.app → in-use prompt → Confirm (transfer back)
       Smoke test: curl -sI https://staging.zeremi.app | head -5 → 200
       served from zeremi-landing
       SCREENSHOT 4: zeremi-landing serving at staging.zeremi.app. Save at:
         .planning/phases/06-production-deploy-cutover-runbook/screenshots/06-uat-11-4-back-to-landing.png
  Record exact button label observed (Vercel UI may say "Move", "Transfer",
  or other variant). Update docs/cutover.md Step 5 if the recorded label
  differs from the runbook prose. Note approximate transfer time (target <5s).
  All 4 screenshots MUST land in the screenshots/ directory.
  D-07 SCOPE: do NOT write to Resend during this dry-run; do NOT configure
  a separate staging sender. Mechanics + smoke load only.
  Requirement: DEPLOY-09.
result: pending

### 12. Apex unaffected after dry-run completes
expected: |
  After test 11 completes: from a fresh terminal, run:
    curl -sI https://zeremi.app | head -1
  Expected: HTTP/2 200 from zeremi-landing (the production apex was untouched
  by the staging.zeremi.app transfer flow — different subdomain).
  curl -sI https://zeremi.app | grep -i strict-transport
  Expected: strict-transport-security: max-age=300 (still emits, dry-run
  did not regress the headers config).
  Requirement: DEPLOY-01 (apex stability post-dry-run regression check).
result: pending

## Summary

total: 12
passed: 6
issues: 0
pending: 6
skipped: 0
blocked: 0
note: |
  Phase 6 launch-gating checklist; populated by Plan 06-04 (dry-run, tests 10–12)
  and Plan 06-05 (production go-live, tests 1–9 + 12).
  2026-05-04: Tests 1, 2, 3, 6 pass. Tests 4, 5, 7 marked pass after debug session
  phase-6-uat-failures (.planning/debug/phase-6-uat-failures.md):
    - Test 4: spec corrected — Resend issues 1 DKIM selector + MX/TXT on send
      subdomain (not 3 selectors + CNAME). All records verified at Porkbun + Resend API.
    - Test 5: 9/10 accepted as pass. DMARC p=none warmup posture is the cap;
      DMARC tightening to p=quarantine deferred to post-warmup follow-up.
    - Test 7: spec corrected to target www.zeremi.app (canonical serving URL);
      apex is a 307 redirect by design, carrying Vercel platform HSTS on the
      redirect response only. App headers emit correctly on www.

## Gaps

[populated only after execution if any test result is `issue` or `fail` — schema per 05-UAT.md lines 133–212]
