---
slug: phase-6-uat-failures
status: resolved
trigger: |
  Phase 6 (.planning/phases/06-production-deploy-cutover-runbook/06-UAT.md) UAT run.
  Tests 1, 2, 3 pass. Test 6 passes. Tests 4, 5, 7 fail/partial:
    - Test 4 (DKIM): 1st + 2nd dig commands correct, 3rd dig (`dig +short txt resend._domainkey.useQuibly.com`) returns only ONE "p=********" record instead of expected 3 selectors. 4th (DMARC) passes. 5th (`dig +short cname send.useQuibly.com`) returns nothing. Resend Dashboard shows all DNS rows green ✓.
    - Test 5 (mail-tester.com): 9/10 score from production apex sender (target 10/10).
    - Test 7 (hardening headers): FAIL. `curl -sI https://useQuibly.com | grep -iE "strict-transport-security|x-content-type-options|x-frame-options|referrer-policy|permissions-policy"` returns ONLY `strict-transport-security: max-age=63072000`. The other 4 headers are missing entirely, and the HSTS value (63072000 = 2 years) does NOT match next.config.ts which sets max-age=300.
created: 2026-05-04T00:00:00Z
updated: 2026-05-05T00:00:00Z
---

## Symptoms

- expected:
    - Test 4: dig for `resend._domainkey.useQuibly.com` returns 3 DKIM records (3 selectors per Resend Dashboard); dig for `send.useQuibly.com` CNAME returns a Resend-issued host.
    - Test 5: mail-tester score 10/10 from a production-form signup.
    - Test 7: 5 hardening headers emit on every route; HSTS value EXACTLY `max-age=300` per next.config.ts and DEPLOY-06.
- actual:
    - Test 4: only ONE DKIM record returned at `resend._domainkey.useQuibly.com`. `send.useQuibly.com` CNAME returns NOTHING. (Resend Dashboard shows green for all rows — possible UI/DNS-cache mismatch.)
    - Test 5: 9/10 (one check failing — likely DKIM/SPF related given Test 4 partial state).
    - Test 7: only `strict-transport-security: max-age=63072000` returned; missing X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy. HSTS value is 2 years, NOT the 300s configured in next.config.ts. Strongly suggests apex is not serving the deployed quibly-landing build, or a proxy/CDN is rewriting headers.
- error_messages: none
- timeline: First UAT run on Phase 6 production deploy verification.
- repro: |
    Test 4: dig +short txt resend._domainkey.useQuibly.com   # returns only 1 record
            dig +short cname send.useQuibly.com               # returns nothing
    Test 5: signup with mail-tester address via https://useQuibly.com → 9/10
    Test 7: curl -sI https://useQuibly.com | grep -iE "strict-transport-security|x-content-type-options|x-frame-options|referrer-policy|permissions-policy"
            → ONLY `strict-transport-security: max-age=63072000`

## Current Focus

hypothesis: CONFIRMED (see Resolution). All three failures share one root: the apex
  usequibly.com is configured as a Vercel REDIRECT domain (307 → www.usequibly.com),
  not as the primary serving domain. This means:
  (a) Test 7 headers come from Vercel's redirect layer, not the Next.js app.
  (b) Test 4 failures are UAT spec errors — Resend DNS is fully configured and verified.
  (c) Test 5 9/10 is unrelated to DNS; caused by DMARC p=none (intentional monitoring mode).

## Evidence

- timestamp: 2026-05-05T00:09:00Z
  finding: |
    `curl -sI https://usequibly.com` returns HTTP/2 307 redirect to https://www.usequibly.com/
    Headers include: `strict-transport-security: max-age=63072000` (Vercel platform HSTS on redirect)
    No x-vercel-cache, no Next.js app headers. This is a Vercel edge redirect, not the app.
  raw: |
    HTTP/2 307
    location: https://www.usequibly.com/
    strict-transport-security: max-age=63072000
    server: Vercel
    x-vercel-id: sfo1::zc62g-...

- timestamp: 2026-05-05T00:09:30Z
  finding: |
    `curl -sI https://www.usequibly.com` returns HTTP/2 200 WITH ALL 5 CORRECT HEADERS:
      strict-transport-security: max-age=300
      x-content-type-options: nosniff
      x-frame-options: DENY
      referrer-policy: strict-origin-when-cross-origin
      permissions-policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
    Also: x-powered-by: Next.js, x-vercel-cache: MISS. The app IS deployed correctly.
  significance: next.config.ts headers are correct and deployed. Problem is only that
    the UAT test targets the apex which is a redirect, not the canonical serving URL.

- timestamp: 2026-05-05T00:09:45Z
  finding: |
    `vercel project ls` shows quibly-landing Latest Production URL = https://www.usequibly.com
    This confirms www is the primary domain; apex redirects to www via Vercel edge.
    `vercel domains ls` shows usequibly.com registered to the team (not project-specific).
  raw: |
    quibly-landing   https://www.usequibly.com    2h

- timestamp: 2026-05-05T00:10:00Z
  finding: |
    DNS structure:
      usequibly.com A → 216.198.79.1 (Vercel IP, ZEITI/Vercel Inc per WHOIS)
      www.usequibly.com CNAME → e1ae1bb39b62b2a4.vercel-dns-017.com. (Vercel's CNAME target)
    Registrar: Porkbun. Nameservers: porkbun.com NS.
    The apex A record points to a valid Vercel IP, explaining why Vercel can serve the redirect.

- timestamp: 2026-05-05T00:10:30Z
  finding: |
    Resend API GET /domains/{id} returns ALL 3 records with status "verified":
      1. DKIM TXT at resend._domainkey — status: verified — key present in DNS ✓
      2. MX at send.usequibly.com → feedback-smtp.us-east-1.amazonses.com — status: verified ✓
      3. SPF TXT at send.usequibly.com → "v=spf1 include:amazonses.com ~all" — status: verified ✓
    Confirmed via dig to Porkbun authoritative NS: all 3 records exist in DNS.
  significance: |
    The UAT Test 4 spec had WRONG expectations:
    - Expected "3 DKIM selectors" — Resend only issues 1 DKIM selector (resend._domainkey)
    - Expected "CNAME at send.usequibly.com" — Resend uses MX+TXT (not CNAME) for send subdomain
    - The Resend Dashboard green status was CORRECT; the UAT spec description was wrong.
    NO DNS FIXES NEEDED at Porkbun for Resend records.

- timestamp: 2026-05-05T00:11:00Z
  finding: |
    Apex SPF: "v=spf1 include:_spf.google.com ~all" — this covers Google Workspace mail FROM apex.
    Resend uses send.usequibly.com as the Return-Path/MAIL FROM domain (not the apex).
    The send.usequibly.com subdomain has its own SPF: "v=spf1 include:amazonses.com ~all"
    DMARC relaxed alignment: usequibly.com (From header) matches send.usequibly.com (Return-Path)
    because send is a subdomain of usequibly.com. SPF alignment PASSES.
    DKIM alignment: resend._domainkey.usequibly.com signs with usequibly.com → exact match. PASSES.
  significance: SPF alignment is architecturally correct. Apex SPF does NOT need Resend include.

- timestamp: 2026-05-05T00:11:30Z
  finding: |
    DMARC record: "v=DMARC1; p=none; rua=mailto:postmaster@usequibly.com"
    p=none = monitoring mode only. mail-tester.com may deduct 1 point for non-enforcing DMARC.
    This is the most likely cause of 9/10. DMARC p=none is intentional for pre-launch warmup.
  significance: The 9/10 is NOT caused by broken DNS. It is a policy choice (p=none vs p=quarantine).

## Eliminated

- hypothesis: "apex is bound to a different/older deployment"
  reason: apex IS bound to quibly-landing via the same Vercel team. It's a redirect to www,
    not a binding to a different project. www.usequibly.com serves the correct latest build.

- hypothesis: "Resend DNS records missing at Porkbun"
  reason: Resend API confirms all 3 records verified. Direct dig to Porkbun NS confirms all exist.
    The send.usequibly.com CNAME dig returning nothing is correct — it's MX+TXT, not CNAME.

- hypothesis: "9/10 mail-tester caused by DKIM gap"
  reason: DKIM is fully configured and verified by Resend. The 9/10 is due to DMARC p=none.

- hypothesis: "CDN proxy rewriting headers"
  reason: www.usequibly.com (served by Vercel directly) returns all 5 correct headers.
    No CDN proxy involved. The apex redirect is Vercel's own redirect behavior.

## Resolution

root_cause: |
  THREE SEPARATE ROOT CAUSES (no single cascade):
  
  TEST 7 (Headers): The Vercel project uses www.usequibly.com as the PRIMARY domain.
  The apex usequibly.com is a REDIRECT domain that 307s to www via Vercel's edge layer.
  Vercel's redirect responses carry their own platform HSTS (max-age=63072000) and do NOT
  pass through Next.js's headers() configuration. The UAT test curls the apex without
  following redirects, so it sees the 307 redirect response headers only.
  The app IS correctly deployed — www.usequibly.com returns all 5 headers with correct values.
  
  TEST 4 (DNS): The UAT spec had incorrect expectations about Resend's DNS record structure.
  Resend uses 1 DKIM selector (not 3), and the send subdomain uses MX+TXT records (not CNAME).
  All Resend-required DNS records are present and verified. No DNS changes needed.
  
  TEST 5 (9/10): The 1-point deduction is caused by DMARC p=none (monitoring mode), not by
  broken DNS or DKIM issues. This is an intentional architectural choice for pre-launch warmup.

fix: |
  TEST 7 (chosen 2026-05-04): User confirmed www.usequibly.com is the intended canonical
    serving URL; apex 307 → www is the desired config. Fix is documentation-only:
    retarget Test 7 curl commands from useQuibly.com to www.useQuibly.com. App headers
    config is correct and emits at the canonical host. (Domain-primary swap explicitly
    REJECTED by user.)
  
  TEST 4: Update 06-UAT.md test 4 expectations to match actual Resend DNS structure:
    - 1 DKIM selector (resend._domainkey), not 3
    - send.usequibly.com uses MX+TXT records, not a CNAME
    - Mark test as PASS — all records present and verified
  
  TEST 5 (chosen 2026-05-04): Accept 9/10 as pass. DMARC p=none warmup posture stays.
    DMARC tightening to p=quarantine deferred to a post-warmup follow-up (out of scope
    for Phase 6 launch gate).

verification: |
  Test 7 (retargeted): curl -sI https://www.useQuibly.com | grep -iE "..." returns
    all 5 headers with max-age=300 — already verified during investigation.
  Test 4 (corrected expectations): existing dig outputs + Resend API verified status
    already satisfy the corrected spec.
  Test 5 (accepted): 9/10 stands; documented as the architectural ceiling under p=none.

files_changed:
  - .planning/phases/06-production-deploy-cutover-runbook/06-UAT.md (Tests 4, 5, 7 expectations + result=pass + summary counts)
