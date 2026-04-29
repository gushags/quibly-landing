---
phase: 05-legal-seo-analytics
status: secured
asvs_level: 1
block_on: high
threats_total: 11
threats_closed: 11
threats_open: 0
audit_date: 2026-04-29
---

# Phase 05 Security Audit — Legal / SEO / Analytics

**Phase:** 05-legal-seo-analytics (Plans 01 + 02 + 03)
**ASVS Level:** 1
**Block-on:** high
**Audit date:** 2026-04-29
**Threats Closed:** 11 / 11

## Threat Verification

| Threat ID | Category | Disposition | Evidence |
|-----------|----------|-------------|----------|
| T-05-01 | Tampering — `lib/consent-version.ts` | mitigate | (1) `import 'server-only'` at `lib/consent-version.ts:1`. (2) CRLF normalization preserved at build-time in `scripts/generate-consent-version.mjs:33` (`raw.replace(/\r\n/g, '\n')`). (3) `.gitattributes:3` enforces `*.tsx text eol=lf`. (4) Vitest test `tests/unit/consent-version.test.ts` asserts `/^[0-9a-f]{8}$/` (8-hex) and determinism (3/3 green per 05-03-SUMMARY.md). Note: post-review CR-01 fix moved hashing from runtime `readFileSync` to build-time generation (`scripts/generate-consent-version.mjs` → `lib/consent-version.generated.ts`). The original mitigation intent (deterministic hash, CRLF-safe, server-only) is preserved and *strengthened* — runtime fs reads are now eliminated entirely, removing the threat surface rather than relying on `import 'server-only'` alone. |
| T-05-06 | Information Disclosure — `lib/consent-version.ts` `fs.readFileSync` | mitigate | Build-time hashing (CR-01 fix) means there is no `fs.readFileSync` in the deployed bundle. `lib/consent-version.ts:27` re-exports a build-time constant from `lib/consent-version.generated.ts` (4 lines, plain string export). `import 'server-only'` retained at line 1. The original information-disclosure surface (runtime fs read) no longer exists; closed by elimination. |
| T-05-01.b | Tampering — `app/actions/join-waitlist.ts` consent_version write | mitigate | `app/actions/join-waitlist.ts:13` — `import { CONSENT_VERSION } from '@/lib/consent-version'`. `app/actions/join-waitlist.ts:163` — `const consentVersion = CONSENT_VERSION` (single direct assignment, no `??`, no env-var fallback). Grep confirms `process.env.VERCEL_GIT_COMMIT_SHA` and `'pre-phase-5'` strings are absent from the file. |
| T-05-02 | Tampering / Information Disclosure — `app/robots.ts` | mitigate | `app/robots.ts:13-26` — explicit per-agent `Allow: /` rules for 10 named AI crawlers (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, Google-Extended, PerplexityBot, Perplexity-User, CCBot). Code-only, no env flag. Single source of truth in repo. |
| T-05-05 | Cross-Site Scripting — `app/page.tsx` JSON-LD | mitigate | `app/page.tsx:31-38` — `safeJsonLdScript()` helper centralizes escaping. `JSON.stringify(...)` produces valid JSON (no user input — constants on lines 41-56 are static). Escapes `<` → `<` (line 33), and additionally `>`, `&`, ` `, ` ` (lines 34-37) per OWASP recommendations — *exceeds* the threat-model mitigation requirement. Used in both JSON-LD scripts (page.tsx:64, 68). |
| T-05-02.b | Information Disclosure — `app/sitemap.ts` | accept | `app/sitemap.ts:10-13` lists exactly the 3 intentionally-public URLs (`/`, `/privacy`, `/terms`). Documented in **Accepted Risks** below. |
| (n/a) Repudiation | OG image cache poisoning | accept | `app/opengraph-image.tsx` reads only static assets from `public/fonts/` and `public/quibs-icon.png` and renders server-side constants. No request-derived data flows into the image. Documented in **Accepted Risks** below. |
| T-05-03 | Repudiation / Information Disclosure — `lib/analytics.ts` body swap | mitigate | `lib/analytics.ts:1` — `import 'server-only'`. `lib/analytics.ts:2` — `import { track as vercelTrack } from '@vercel/analytics/server'`. TrackEvent union locked at lines 27-32. Body forwards `(event, properties)` verbatim (lines 51-63). `tests/unit/analytics.test.ts` asserts arg-forwarding for `waitlist_signup`, `welcome_email_send_error`, `signup_rejected` — 3/3 green per 05-03-SUMMARY.md. Strengthened by per-event property typing (TrackEventProperties map, lines 43-49) which prevents PII (e.g., `email`) from being passed at compile time — *exceeds* the threat-model mitigation requirement (CR-02 / privacy-policy contract enforcement). |
| T-05-04 | Tampering — `package.json` dependencies | mitigate | `scripts/check-no-trackers.mjs` — regex-based denylist covering GA/GTM, PostHog, Microsoft Clarity, Hotjar, Meta Pixel, LinkedIn Insight, Mixpanel, Amplitude, Segment, FullStory (lines 20-64). Wired as `package.json` script `check:no-trackers`. Manually executed: exits 0 (`ANLY-06: no prohibited tracking SDKs in package.json`). WR-06 fix improves the original substring matcher to regex patterns covering scoped variants (e.g., `@amplitude/analytics-browser`) — *exceeds* the threat-model mitigation requirement. |
| T-05-03.b | Denial of Service — Server Action `track()` | accept | Welcome-email failure path catches in `after()` callback (`app/actions/join-waitlist.ts:287-300`). Documented in **Accepted Risks** below. |
| (n/a) Information Disclosure | `<Analytics />` script cookielessness | accept | `@vercel/analytics ^1` mounted at `app/layout.tsx`; cookieless by Vercel contract. Documented in **Accepted Risks** below. |

## Accepted Risks

1. **Sitemap exposure (T-05-02.b)** — The 3 sitemap URLs (`/`, `/privacy`, `/terms`) are intentionally public; pre-launch site has no private routes. Listing in sitemap is the intended SEO behavior.
2. **OG image cache** — Generated by Next.js at build/request time from server-side constants and `public/` assets only; no request-derived data. Vercel CDN caches normally.
3. **Server Action analytics DoS (T-05-03.b)** — `vercelTrack()` failure on protected preview deployments (401) is swallowed by existing `.catch()` in the welcome-email tail. Preview-tracking gaps are tolerated pre-launch; Phase 6 will add `VERCEL_AUTOMATION_BYPASS_SECRET` to resolve.
4. **`<Analytics />` cookielessness** — Vercel Web Analytics is contractually cookieless (no `_vercel*` cookies, daily-rotating hash, 24h discard). Cookieless behavior is verifiable by manual UAT (incognito → DevTools → Application → Cookies = 0). 05-HUMAN-UAT.md owns the empirical check.

## Unregistered Flags

None. SUMMARY.md `## Threat Flags` section in 05-02-SUMMARY.md and 05-03-SUMMARY.md both explicitly state "No new threat flags" / "No new network endpoints, auth paths, or schema changes beyond what the threat model covers." 05-01-SUMMARY.md does not declare a `## Threat Flags` block; its scope (legal pages + consent-version) introduced no new attack surface beyond what T-05-01 / T-05-06 / T-05-01.b cover.

## Audit Notes

- **Implementation deviation from plan (informational, not a gap):** T-05-01 / T-05-06 mitigation moved CRLF normalization + SHA-256 hashing from runtime `lib/consent-version.ts` (as planned) to build-time `scripts/generate-consent-version.mjs` (CR-01 post-review fix). The mitigation *intent* (deterministic 8-hex consent_version, CRLF-safe across OSes, no client-bundle leakage) is preserved AND strengthened — runtime fs access is eliminated, so the file-disclosure threat surface no longer exists at runtime. The `import 'server-only'` guard and `.gitattributes` LF rules remain in place exactly as the threat plan specified.
- All "exceeds" notes above (T-05-05 OWASP escapes, T-05-03 typed property shapes, T-05-04 regex denylist) reflect post-review hardening (WR-* fixes) above the minimum mitigation bar.
- Phase 5 implementation files were NOT modified by this audit. Only this SECURITY.md was created.

---

**Verdict:** SECURED. All declared mitigations are present in implemented code or documented as accepted risks. No blockers. Phase 5 cleared for Phase 6 production deploy.
