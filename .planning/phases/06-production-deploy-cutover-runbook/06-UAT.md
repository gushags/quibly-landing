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

### 1. privacy@useQuibly.com mailbox provisioned and reachable (HARD launch-gate)
expected: |
  Founder action item — Phase 5 CD-07 / D-02 carryover. Provision the
  privacy@useQuibly.com mailbox via one of: Resend Inbound forward, Google
  Workspace alias, ImprovMX, or Cloudflare Email Routing.
  Test: send a fresh email from an external address (e.g., a personal Gmail) to
  privacy@useQuibly.com with subject "DSAR provisioning test <date>".
  Observe: founder receives the email in the destination inbox within 60 seconds.
  Record date/time received and destination inbox name in this test's `note:`.
  HARD LAUNCH-GATE — production form MUST NOT be exposed to public traffic
  until this test is `pass`. Privacy-policy DSAR contract violation otherwise.
  Requirement: LEGAL-08 (Phase 5 carryover).
result: pending

### 2. Production apex resolves to quibly-landing prod deploy (DEPLOY-01)
expected: |
  After production deploy + apex bind: from a fresh terminal, run:
    curl -sI https://useQuibly.com | head -1
  Expected: HTTP/2 200
  Then: curl -s https://useQuibly.com | grep -c Quibly
  Expected: a count > 0 (Quibly brand markers present in body)
  Record both command outputs in this test's `note:` field.
  Requirement: DEPLOY-01.
result: pending

### 3. Apex domain bound at Vercel team level (DEPLOY-02)
expected: |
  Vercel Dashboard → switch scope to the team that owns quibly-landing →
  Domains tab. Confirm `useQuibly.com` is listed there with project assignment
  to `quibly-landing`. Take a screenshot of the team Domains tab showing the
  apex listed. Save screenshot at:
    .planning/phases/06-production-deploy-cutover-runbook/screenshots/06-uat-03-team-domains.png
  Record screenshot path in this test's `note:` field.
  Requirement: DEPLOY-02.
result: pending

### 4. SPF + 3× DKIM + DMARC p=none + Return-Path DNS records resolve (DEPLOY-03, DEPLOY-04)
expected: |
  From a fresh terminal, run all of:
    dig +short ns useQuibly.com
    dig +short txt useQuibly.com | grep spf1
    dig +short txt resend._domainkey.useQuibly.com
    dig +short txt _dmarc.useQuibly.com | grep 'p=none'
    dig +short cname send.useQuibly.com   # exact subdomain per Resend Dashboard
  Expected:
    - ns: 2+ nameserver records (vercel-dns or external — note which)
    - SPF: "v=spf1 include:_spf.resend.com ~all" (or Resend equivalent)
    - DKIM: 3 records across 3 selectors (resend._domainkey, plus 2 others
      named in Resend Dashboard) — each contains "v=DKIM1; k=rsa; p=<key>"
    - DMARC: "v=DMARC1; p=none; rua=mailto:..."
    - Return-Path: CNAME pointing to a Resend-issued host
  Paste each command's output verbatim into this test's `note:` field.
  Then: Resend Dashboard → Domains → useQuibly.com → confirm all DNS rows
  show green ✓ status. Take a screenshot. Save at:
    .planning/phases/06-production-deploy-cutover-runbook/screenshots/06-uat-04-resend-dns.png
  Requirement: DEPLOY-03, DEPLOY-04.
result: pending

### 5. mail-tester.com 10/10 score from production apex sender (DEPLOY-05)
expected: |
  Visit https://www.mail-tester.com → copy the generated single-use email
  address. From the production apex form (https://useQuibly.com), submit a
  signup using the mail-tester address (the single-use address acts as a
  fresh inbox). Wait for the welcome email to arrive at mail-tester (check
  Resend Dashboard → Logs to confirm send), then on mail-tester.com click
  "Then check your score". Expected: 10/10. If <10, debug the specific
  failed check (SPF / DKIM / DMARC / content) before exposing form publicly.
  Paste the mail-tester result URL into this test's `note:`. Save screenshot at:
    .planning/phases/06-production-deploy-cutover-runbook/screenshots/06-uat-05-mailtester.png
  Requirement: DEPLOY-05.
result: pending

### 6. Production real-signup writes to production audience + welcome arrives in Gmail (DEPLOY-08)
expected: |
  From a fresh Gmail inbox (or any real test inbox), submit a fresh email
  through the production form at https://useQuibly.com. Verify:
    a) Form replaces with success message ("You're on the list…")
    b) Resend Dashboard → Audiences → "Quibly Waitlist" (production) → new
       contact row appears with the test email and current created_at
    c) Welcome email arrives at the test inbox within 60 seconds
    d) From: renders as "Quibly <hello@useQuibly.com>"
    e) Subject: "You're on the Quibly list"
    f) Body: 4 D-01 paragraphs render correctly, footer shows real postal
       address (not placeholder), unsubscribe link present
    g) Click unsubscribe → /unsubscribe?t=<token> returns 200 → contact in
       Resend Dashboard now shows unsubscribed: true
  Record test email + Resend contact id + timestamps in this test's `note:`.
  Requirement: DEPLOY-08 (cutover runbook end-to-end smoke).
result: pending

### 7. Five hardening headers emit on production apex (DEPLOY-06)
expected: |
  From a fresh terminal, run:
    curl -sI https://useQuibly.com | grep -iE "strict-transport-security|x-content-type-options|x-frame-options|referrer-policy|permissions-policy"
  Expected: 5 lines (case may vary), exact values:
    strict-transport-security: max-age=300
    x-content-type-options: nosniff
    x-frame-options: DENY
    referrer-policy: strict-origin-when-cross-origin
    permissions-policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
  Then verify HSTS is EXACTLY max-age=300 (no token-A, no token-B):
    curl -sI https://useQuibly.com | grep -i strict-transport
  REJECT if response contains the directive that locks subdomains or the
  directive that submits to the browser allowlist (forbidden tokens are
  enumerated in 06-PATTERNS.md and next.config.ts). Refer to 06-VALIDATION.md
  test 06-01-01 for the exact regex match.
  Verify sub-routes also receive headers:
    curl -sI https://useQuibly.com/robots.txt | grep -i strict-transport
    curl -sI https://useQuibly.com/sitemap.xml | grep -i strict-transport
    curl -sI https://useQuibly.com/opengraph-image | grep -i strict-transport
    curl -sI https://useQuibly.com/privacy | grep -i strict-transport
    curl -sI https://useQuibly.com/terms | grep -i strict-transport
  All 5 sub-routes must emit the HSTS header (source: '/(.*)' covers all).
  Required header names (verbatim per next.config.ts):
    Strict-Transport-Security
    X-Content-Type-Options
    X-Frame-Options
    Referrer-Policy
    Permissions-Policy
  Paste full output in this test's `note:` field.
  Requirement: DEPLOY-06.
result: pending

### 8. No Service Worker registered on production load (DEPLOY-07)
expected: |
  Per CD-03 (manual DevTools checkpoint chosen over CI grep / Playwright spec).
  Steps:
    1. Open https://useQuibly.com in a fresh incognito/private window
    2. Open DevTools (Cmd-Opt-I / Ctrl-Shift-I)
    3. Application tab → Storage section → Service Workers
    4. Confirm panel is empty for the useQuibly.com origin (no entries; or
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
    curl -sI https://useQuibly.com/opengraph-image | head -1   # → HTTP/2 200
    curl -s https://useQuibly.com/sitemap.xml                  # → valid XML, includes useQuibly.com/, /privacy, /terms
    curl -s https://useQuibly.com/robots.txt                   # → 10 AI-crawler Allow rules + Sitemap line
    curl -sI https://useQuibly.com/icon | head -1              # → HTTP/2 200
    curl -sI https://useQuibly.com/apple-icon | head -1        # → HTTP/2 200
  Paste each command's output in this test's `note:` field.
  Requirement: Phase 5 SEO-04 / SEO-06 / SEO-07 carryover re-verify on production apex.
result: pending

### 10. Resend Audience CSV export includes consent_version column (Pitfall 6 / A1 empirical)
expected: |
  Resend Dashboard → Audiences → "Quibly Waitlist" (production) → Export
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

### 11. Cutover dry-run transfer back-and-forth on staging.useQuibly.com (DEPLOY-09 / D-05/D-06/D-07)
expected: |
  Pre-flight: dig +short ns useQuibly.com → if response is ns1.vercel-dns.com
  / ns2.vercel-dns.com, sub-flow A (auto-CNAME) applies. Else sub-flow B
  (manual CNAME at external provider: staging → cname.vercel-dns.com).
  Steps (verbatim 06-RESEARCH.md lines 635–671):
    1. Vercel Dashboard → quibly-landing → Settings → Domains → Add Domain
       → enter staging.useQuibly.com → confirm
       (auto-CNAME if Vercel NS, else add CNAME at external provider first)
       Wait until status shows "Valid Configuration".
       Smoke test: curl -sI https://staging.useQuibly.com | head -5 → 200
       SCREENSHOT 1: staging.useQuibly.com bound to quibly-landing,
       Valid Configuration. Save at:
         .planning/phases/06-production-deploy-cutover-runbook/screenshots/06-uat-11-1-bound.png
    2. Vercel Dashboard → marketing-app → Settings → Domains → Add Domain
       → enter staging.useQuibly.com → in-use prompt: "This domain is
       currently in use by another project. Move it here?" → Confirm
       SCREENSHOT 2: capture the in-use prompt verbatim. Save at:
         .planning/phases/06-production-deploy-cutover-runbook/screenshots/06-uat-11-2-prompt.png
       Smoke test: curl -sI https://staging.useQuibly.com | head -5 → 200
       served from marketing-app
       SCREENSHOT 3: marketing-app loading at staging.useQuibly.com. Save at:
         .planning/phases/06-production-deploy-cutover-runbook/screenshots/06-uat-11-3-marketing-load.png
    3. Vercel Dashboard → quibly-landing → Settings → Domains → Add Domain
       → enter staging.useQuibly.com → in-use prompt → Confirm (transfer back)
       Smoke test: curl -sI https://staging.useQuibly.com | head -5 → 200
       served from quibly-landing
       SCREENSHOT 4: quibly-landing serving at staging.useQuibly.com. Save at:
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
    curl -sI https://useQuibly.com | head -1
  Expected: HTTP/2 200 from quibly-landing (the production apex was untouched
  by the staging.useQuibly.com transfer flow — different subdomain).
  curl -sI https://useQuibly.com | grep -i strict-transport
  Expected: strict-transport-security: max-age=300 (still emits, dry-run
  did not regress the headers config).
  Requirement: DEPLOY-01 (apex stability post-dry-run regression check).
result: pending

## Summary

total: 12
passed: 0
issues: 0
pending: 12
skipped: 0
blocked: 0
note: "Phase 6 launch-gating checklist; populated by Plan 06-04 (dry-run, tests 10–12) and Plan 06-05 (production go-live, tests 1–9 + 12)."

## Gaps

[populated only after execution if any test result is `issue` or `fail` — schema per 05-UAT.md lines 133–212]
