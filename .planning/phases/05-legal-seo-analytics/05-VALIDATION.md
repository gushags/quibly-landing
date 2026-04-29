---
phase: 5
slug: legal-seo-analytics
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-29
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x (unit) + @testing-library/react + Playwright 1.x (e2e) |
| **Config file** | `vitest.config.ts` (exists), `playwright.config.ts` (exists) |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run && npx playwright test --project=chromium` |
| **Estimated runtime** | ~45 seconds (unit ~8s, Playwright chromium ~35s) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run` (related test files only when scoped)
- **After every plan wave:** Run `npx vitest run && npx playwright test --project=chromium`
- **Before `/gsd-verify-work`:** Full suite (chromium + firefox + webkit) must be green; manual UAT for SC #2, SC #5 documented in `05-HUMAN-UAT.md`
- **Max feedback latency:** 45 seconds for full suite

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | LEGAL-01 | T-05-01 (consent integrity) | `/privacy` returns 200 + project-specific copy | e2e | `npx playwright test tests/legal.spec.ts -g "privacy 200"` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | LEGAL-02 | T-05-01 | `/terms` returns 200 + waitlist scope | e2e | `npx playwright test tests/legal.spec.ts -g "terms 200"` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 1 | LEGAL-03 | T-05-01 | Privacy names Vercel + Resend processors | e2e | `npx playwright test tests/legal.spec.ts -g "processors"` | ❌ W0 | ⬜ pending |
| 05-01-04 | 01 | 1 | LEGAL-04 | T-05-01 | Privacy declares GDPR Art. 6(1)(a) consent + retention | e2e | `npx playwright test tests/legal.spec.ts -g "gdpr"` | ❌ W0 | ⬜ pending |
| 05-01-05 | 01 | 1 | LEGAL-05 | — | Footer `/privacy` + `/terms` resolve | e2e (existing) | `npx playwright test tests/footer.spec.ts` | ✅ (Phase 2) | ⬜ pending |
| 05-01-06 | 01 | 1 | LEGAL-06 | T-05-01 | Consent microcopy below form button | e2e | `npx playwright test tests/legal.spec.ts -g "consent-copy"` | ❌ W0 | ⬜ pending |
| 05-01-07 | 01 | 1 | LEGAL-07 | — | "No spam, unsubscribe anytime" copy near form | e2e | `npx playwright test tests/legal.spec.ts -g "no spam"` | ❌ W0 | ⬜ pending |
| 05-01-08 | 01 | 1 | LEGAL-08 | T-05-01 | DSAR `mailto:privacy@useQuibly.com` in privacy page | e2e | `npx playwright test tests/legal.spec.ts -g "dsar"` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | SEO-01 | — | `<title>` + `<meta description>` present + length budget | e2e | `npx playwright test tests/seo.spec.ts -g "title-description"` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 2 | SEO-02 | — | `og:title`, `og:description`, `og:image`, `og:url`, `og:type` present | e2e | `npx playwright test tests/seo.spec.ts -g "og-tags"` | ❌ W0 | ⬜ pending |
| 05-02-03 | 02 | 2 | SEO-03 | — | `twitter:card=summary_large_image` + `twitter:image` present | e2e | `npx playwright test tests/seo.spec.ts -g "twitter-card"` | ❌ W0 | ⬜ pending |
| 05-02-04 | 02 | 2 | SEO-04 | — | `/opengraph-image` returns 200 PNG, ~1200×630 | e2e | `npx playwright test tests/seo.spec.ts -g "og-image-200"` | ❌ W0 | ⬜ pending |
| 05-02-05 | 02 | 2 | SEO-05 | — | `/favicon.ico` + `/apple-touch-icon.png` return 200 | e2e | `npx playwright test tests/seo.spec.ts -g "favicon"` | ❌ W0 | ⬜ pending |
| 05-02-06 | 02 | 2 | SEO-06 | T-05-02 (AI crawler policy) | `/robots.txt` lists each named AI bot with explicit Allow | e2e | `npx playwright test tests/seo.spec.ts -g "robots"` | ❌ W0 | ⬜ pending |
| 05-02-07 | 02 | 2 | SEO-07 | — | `/sitemap.xml` lists `/`, `/privacy`, `/terms` (3 entries) | e2e | `npx playwright test tests/seo.spec.ts -g "sitemap"` | ❌ W0 | ⬜ pending |
| 05-02-08 | 02 | 2 | SEO-08 | — | JSON-LD Organization + WebSite parses without error | e2e | `npx playwright test tests/seo.spec.ts -g "json-ld"` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 2 | ANLY-01 | — | `<Analytics />` mount renders Vercel script tag | e2e | `npx playwright test tests/analytics.spec.ts -g "analytics-mount"` | ❌ W0 | ⬜ pending |
| 05-03-02 | 03 | 2 | ANLY-02 | — | `<SpeedInsights />` mount renders speed-insights script tag | e2e | `npx playwright test tests/analytics.spec.ts -g "speed-insights-mount"` | ❌ W0 | ⬜ pending |
| 05-03-03 | 03 | 2 | ANLY-03 | T-05-03 (event integrity) | `track('waitlist_signup')` invokes `@vercel/analytics/server` track with `{ duplicate }` | unit | `npx vitest run lib/analytics.test.ts` | ❌ W0 | ⬜ pending |
| 05-03-04 | 03 | 2 | ANLY-04 | T-05-03 | `track('welcome_email_send_error')` still fires after body swap (regression) | unit | `npx vitest run app/api/webhooks/resend/__tests__/route.test.ts` | ✅ (Phase 4) | ⬜ pending |
| 05-03-05 | 03 | 2 | ANLY-06 | T-05-04 (no third-party trackers) | `package.json` does not contain prohibited tracking deps | build/lint | `node scripts/check-no-trackers.mjs` (or grep) | ❌ W0 | ⬜ pending |
| 05-04-01 | 04 | 1 | LEGAL-04 (extends) | T-05-01 | `lib/consent-version.ts` exports `CONSENT_VERSION` 8-hex hash, deterministic | unit | `npx vitest run lib/consent-version.test.ts` | ❌ W0 | ⬜ pending |
| 05-04-02 | 04 | 2 | LEGAL-04 | T-05-01 | `app/actions/join-waitlist.ts` consent_version sourced from `CONSENT_VERSION` import (not env) | unit | `npx vitest run app/actions/__tests__/join-waitlist.test.ts -t "consent-version"` | ✅ (Phase 4 has test; extend) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/legal.spec.ts` — covers LEGAL-01..04, LEGAL-06..08 (Playwright e2e)
- [ ] `tests/seo.spec.ts` — covers SEO-01..08 (Playwright e2e)
- [ ] `tests/analytics.spec.ts` — covers ANLY-01..02 mount checks (Playwright e2e)
- [ ] `lib/analytics.test.ts` — Vitest unit test mocking `@vercel/analytics/server` track for ANLY-03
- [ ] `lib/consent-version.test.ts` — Vitest unit test verifying deterministic 8-hex SHA-256 prefix for LEGAL-04
- [ ] `scripts/check-no-trackers.mjs` — Node script that fails if `package.json` references `ga4`, `posthog`, `@gtag`, `gtm`, `clarity`, `hotjar`, `pixel`, `meta-pixel`, `linkedin-insight` (ANLY-06)
- [ ] `npm install @vercel/analytics@^1 @vercel/speed-insights@^1` (no test framework install needed — both Vitest and Playwright already configured)
- [ ] `public/fonts/Quicksand-Bold.ttf` + `public/fonts/Figtree-Medium.ttf` checked in (binary deps for ImageResponse)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| OG image renders correctly in iMessage / Slack / X / LinkedIn | SEO-02 / SC #2 | Third-party platform rendering cannot be automated; each platform fetches `og:image` and applies its own crop/scale | After Vercel preview deploy: 1) opengraph.xyz with preview URL → mascot-left + tagline-right + teal gradient correct; 2) cards-dev.twitter.com/validator with preview URL → `summary_large_image` card renders; 3) linkedin.com/post-inspector with preview URL → image + description correct. All three must pass before merge. |
| Zero non-essential cookies on fresh visit | ANLY-05 / SC #5 | DevTools cookie inspection cannot be reliably automated cross-browser; verifies Vercel Analytics cookieless guarantee empirically | 1) Fresh incognito window; 2) Visit production / preview URL; 3) DevTools → Application → Cookies → select domain → confirm 0 cookies; 4) Submit test email; 5) Confirm 0 cookies post-submit. |
| Track events appear in Vercel custom-events dashboard | ANLY-03 / ANLY-04 / SC #4 | Requires production-deployed Vercel Analytics dashboard; staging/preview may not show events with Deployment Protection | 1) After production deploy: submit one signup with a fresh email; 2) Open Vercel project → Analytics → Custom Events; 3) Confirm `waitlist_signup` event with `{ duplicate: false }` property; 4) Trigger a welcome-email failure (revoke RESEND_API_KEY temporarily on a preview); 5) Confirm `welcome_email_send_error` event appears. |
| DSAR mailbox `privacy@useQuibly.com` receives mail | LEGAL-08 | Requires DNS/forwarding provisioning outside this phase | Founder provisions Resend Inbound forward / Google Workspace alias / ImprovMX before Phase 6 launch checklist; sends test email to `privacy@useQuibly.com` and confirms receipt. |
| Quicksand + Figtree TTF SIL OFL license attribution | SEO-04 | Source license terms require attribution in repo, not testable | Verify SIL OFL license texts present at `public/fonts/Quicksand-OFL.txt` + `public/fonts/Figtree-OFL.txt` before merge. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
