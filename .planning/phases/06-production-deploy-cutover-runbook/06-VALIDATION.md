---
phase: 6
slug: production-deploy-cutover-runbook
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-29
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Phase 6 ships almost no new code: 5 lines in `next.config.ts` + a `docs/cutover.md` runbook + a `06-UAT.md` checkpoint artifact. Most validation is **manual checkpoints** — that's the correct sampling rate for platform-configuration + DNS-state deliverables, not a regression from automated coverage.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x (unit) + Playwright (e2e) — already configured by Phase 3 |
| **Config file** | `vitest.config.ts`, `playwright.config.ts` (existing — no Phase 6 changes) |
| **Quick run command** | `npm run test` (Vitest unit) |
| **Full suite command** | `npm run test:e2e` (Playwright e2e) + Lighthouse CI on PR |
| **Estimated runtime** | ~25 s unit / ~90 s e2e (Phase 3 baseline) |

**Phase 6 explicit non-test scope:** the 5-header `headers()` block is verified empirically against the deployed production apex via `curl`, NOT via a Vitest unit test. Mocking Next.js's header pipeline would defeat the purpose — the framework's emission layer is the asset under test.

---

## Sampling Rate

- **After every task commit:** Run `npm run test` (Vitest stays green; no Phase 6 unit tests to add)
- **After every plan wave:** Run header-emission `curl` probes against the latest preview deploy (not the apex — apex only serves after DEPLOY-01 ships); manual
- **Before `/gsd-verify-work`:** All 06-UAT.md manual checkpoints PASS; full Vitest + Playwright suite green; Lighthouse CI green
- **Max feedback latency:** ~25 s for unit; manual UAT checkpoints have no latency target (one-shot human verification)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | DEPLOY-06 | T-06-V9-HSTS | HSTS `max-age=300` literal, NO `includeSubDomains`, NO `preload` | curl-probe | `curl -sI https://useQuibly.com \| grep -i strict-transport` matches `^Strict-Transport-Security: max-age=300\r?$` | ✅ | ⬜ pending |
| 06-01-02 | 01 | 1 | DEPLOY-06 | T-06-V9-XFO | `X-Frame-Options: DENY` | curl-probe | `curl -sI https://useQuibly.com \| grep -i x-frame-options` matches `DENY` | ✅ | ⬜ pending |
| 06-01-03 | 01 | 1 | DEPLOY-06 | T-06-V9-NS | `X-Content-Type-Options: nosniff` | curl-probe | `curl -sI https://useQuibly.com \| grep -i x-content-type-options` matches `nosniff` | ✅ | ⬜ pending |
| 06-01-04 | 01 | 1 | DEPLOY-06 | T-06-V9-RP | `Referrer-Policy: strict-origin-when-cross-origin` | curl-probe | `curl -sI https://useQuibly.com \| grep -i referrer-policy` matches `strict-origin-when-cross-origin` | ✅ | ⬜ pending |
| 06-01-05 | 01 | 1 | DEPLOY-06 | T-06-V9-PP | `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()` | curl-probe | `curl -sI https://useQuibly.com \| grep -i permissions-policy` matches all four directives | ✅ | ⬜ pending |
| 06-02-01 | 02 | 2 | DEPLOY-08 | — | `docs/cutover.md` exists with required sections | smoke | `test -f docs/cutover.md && wc -l docs/cutover.md` returns 200–500; `grep -c '^## ' docs/cutover.md` returns ≥7 (pre-flight, CSV export, broadcast timing, transfer, post-flip, decommission, rollback) | ✅ | ⬜ pending |
| 06-03-01 | 03 | 1 | DEPLOY-01..09 | — | `06-UAT.md` checklist exists with all 9 DEPLOY-XX rows | smoke | `test -f .planning/phases/06-production-deploy-cutover-runbook/06-UAT.md && grep -c 'DEPLOY-0' .planning/phases/06-production-deploy-cutover-runbook/06-UAT.md` returns ≥9 | ✅ | ⬜ pending |
| 06-03-02 | 03 | 1 | DEPLOY-07 | T-06-V9-SW | No Service Worker registered in source | grep | `grep -rE "navigator\.serviceWorker\|register\s*\(.*['\"]\\/(sw\|service-worker)" app/ lib/ components/ 2>/dev/null \| wc -l` returns 0 | ✅ | ⬜ pending |
| 06-04-01 | 04 | 2 | DEPLOY-09 | — | Dry-run cutover transfer back-and-forth on staging.useQuibly.com documented with screenshots | manual-only | None (Vercel UI flow + screenshot evidence pasted into 06-UAT.md) | ⬜ Wave 0 (06-UAT.md) | ⬜ pending |
| 06-05-01 | 05 | 3 | DEPLOY-01 | — | `https://useQuibly.com` resolves to quibly-landing prod deploy (HTTP 200 + brand markers in body) | smoke | `curl -sI https://useQuibly.com \| head -1` returns `HTTP/2 200`; `curl -s https://useQuibly.com \| grep -c Quibly` returns >0 | ✅ | ⬜ pending |
| 06-05-02 | 05 | 3 | DEPLOY-02 | — | Apex bound at Vercel **team** level (not project level) | manual-only | None (Vercel Dashboard → Team → Domains tab — apex listed there, screenshot to 06-UAT.md) | ⬜ Wave 0 (06-UAT.md) | ⬜ pending |
| 06-05-03 | 05 | 3 | DEPLOY-03, DEPLOY-04 | — | SPF + 3× DKIM + DMARC `p=none` + Return-Path resolve from production apex | dns-probe | `dig +short txt useQuibly.com \| grep -c spf1` returns ≥1; `dig +short txt resend._domainkey.useQuibly.com \| wc -l` returns ≥1 (per selector); `dig +short txt _dmarc.useQuibly.com \| grep -c 'p=none'` returns ≥1 | ✅ | ⬜ pending |
| 06-05-04 | 05 | 3 | DEPLOY-05 | — | mail-tester.com 10/10 score from production apex sender | manual-only | None (mail-tester has no API; paste mail-tester URL + 10/10 screenshot into 06-UAT.md) | ⬜ Wave 0 (06-UAT.md) | ⬜ pending |
| 06-05-05 | 05 | 3 | LEGAL-08 (Phase 5 carryover) | — | `privacy@useQuibly.com` mailbox provisioned and reachable | manual-only | None (send test email, founder confirms receipt; record in 06-UAT.md) | ⬜ Wave 0 (06-UAT.md) | ⬜ pending |
| 06-05-06 | 05 | 3 | DEPLOY-07 | T-06-V9-SW | No Service Worker active on production load | manual-only | None (DevTools → Application → Service Workers panel empty; screenshot to 06-UAT.md) | ⬜ Wave 0 (06-UAT.md) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `06-UAT.md` — manual checkpoint artifact under `.planning/phases/06-production-deploy-cutover-runbook/06-UAT.md`. Numbered tests with PASS/FAIL/NOTES columns matching 04-UAT.md / 05-UAT.md format (per CD-07). Covers all 9 DEPLOY-XX requirements as per-row checkpoints, plus the privacy-mailbox carryover (LEGAL-08), no-Service-Worker DevTools spot-check, dry-run transfer documentation, and Resend CSV export inspection (Pitfall 6 / A1).
- [ ] `docs/cutover.md` — covers DEPLOY-08; new file at repo root in newly-created `docs/` directory.
- [ ] Pre-flight: `dig +short ns useQuibly.com` to determine staging-subdomain CD-05 sub-flow (auto-CNAME vs manual CNAME). Output drives a plan-task branch in 06-04 (dry-run plan).
- [ ] Empirical (one-time, in 06-UAT.md): Resend Audience CSV export inspection — verify whether the dashboard CSV export includes the `consent_version` custom property (Pitfall 6 / A1). Outcome decides whether `docs/cutover.md` Step 2 needs an API-fallback snapshot script.
- [ ] Manual checkpoint (one-time, in 06-UAT.md): `privacy@useQuibly.com` mailbox provisioning + receipt test (D-02 carryover). HARD launch-gate before public form exposure.
- [ ] Framework install: NONE — Phase 6 introduces zero new packages.

*No Vitest/Playwright fixtures required. The existing test infrastructure carries over from Phases 2–5; Phase 6 introduces only the `next.config.ts` `headers()` block, which is verified via `curl` against the deployed apex, not via a unit test.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Apex bound at Vercel **team** level (not project level) | DEPLOY-02 | Vercel Dashboard state — no public API for "domain bind level"; only visible in the Team → Domains tab vs Project → Domains tab. | Vercel Dashboard → switch to the team scope → Domains tab → confirm `useQuibly.com` listed there with project assignment to `quibly-landing`. Screenshot into 06-UAT.md. |
| Resend domain DNS verification at production apex | DEPLOY-03 | Resend "Verified ✓" status is a Resend-side state; verifying it requires logging into Resend Dashboard (no public API for the verification status flag — `dig` only confirms the records exist, not that Resend has accepted them). | Resend Dashboard → Domains → `useQuibly.com` → all rows green ✓. Screenshot into 06-UAT.md. (DNS records themselves are also verified by `dig` per the per-task map; this row covers Resend-side acknowledgement.) |
| `mail-tester.com` 10/10 score from production apex | DEPLOY-05 | mail-tester has no public API. The score is bound to a one-time email-to-randomized-address loop; results expire. | Visit https://www.mail-tester.com → copy generated address → from production apex (real prod signup form using a fresh inbox), submit; the welcome email arrives at the mail-tester address → click "Then check your score" → 10/10 expected → paste URL + screenshot into 06-UAT.md. |
| No Service Worker active on production load | DEPLOY-07 | DevTools state is per-browser; not addressable via headless smoke. CD-03 picked manual checkpoint over Playwright assertion to keep it one-shot. | Open `https://useQuibly.com` in a fresh incognito window → DevTools → Application → Service Workers → confirm panel is empty (no entries) → screenshot into 06-UAT.md. |
| Cutover dry-run transfer back-and-forth on staging.useQuibly.com | DEPLOY-09 | Vercel UI flow with cross-project transfer prompt; no API surface that exercises the same prompt. SUMMARY.md flagged this as MEDIUM-confidence research — the dry-run resolves it. | Bind `staging.useQuibly.com` to `quibly-landing` (team-level) → verify HTTP 200 → Vercel Dashboard → quibly-landing → Settings → Domains → click `staging.useQuibly.com` → "Transfer to other Project" → select `marketing-app` → confirm "in-use" prompt → verify 200 from marketing-app → repeat in reverse → screenshot each step into 06-UAT.md. |
| `privacy@useQuibly.com` mailbox provisioned and reachable | LEGAL-08 (Phase 5 D-02 carryover) | Mailbox state is in the founder's email-routing config (Resend Inbound forward / Google Workspace alias / ImprovMX); no codebase artifact to grep. | Send a test email to `privacy@useQuibly.com` from a fresh external address → founder confirms receipt → record date/inbox in 06-UAT.md. **HARD launch-gate** — must be PASS before form exposed publicly. |
| Resend Audience CSV export includes `consent_version` custom property | STORE-04 follow-up / Pitfall A1 | Resend `audiences/contacts/list` API does NOT return custom properties; CSV export changelog is silent on column inclusion. | Resend Dashboard → Audiences → Quibly Waitlist → Export → CSV → open CSV → verify `consent_version` column present and populated. If MISSING, escalate to API-fallback snapshot script (documented in cutover.md). Record outcome in 06-UAT.md. |
| Production OG / sitemap / robots smoke | SEO-04 / SEO-06 / SEO-07 (Phase 5 already validated against preview) | Phase 5 validated against preview; Phase 6 re-validates against production apex once apex resolves. | `curl -sI https://useQuibly.com/opengraph-image | head -1` returns 200; `curl -s https://useQuibly.com/sitemap.xml` returns valid XML containing `useQuibly.com/`; `curl -s https://useQuibly.com/robots.txt` returns expected disallow rules. Record commands + outputs in 06-UAT.md. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies (manual-only items routed to 06-UAT.md)
- [ ] Sampling continuity: Phase 6 tasks alternate automated curl/dig probes with manual UAT checkpoints — no 3 consecutive tasks without observable evidence (each manual task requires screenshot or recorded output)
- [ ] Wave 0 covers all MISSING references (06-UAT.md, docs/cutover.md, dig pre-flight, A1 empirical inspection, privacy mailbox provisioning)
- [ ] No watch-mode flags
- [ ] Feedback latency < 30 s for automated probes; manual UAT one-shot
- [ ] `nyquist_compliant: true` set in frontmatter (flip after planner finalizes per-task verify commands)

**Approval:** pending
