# Roadmap: Quibly Landing

## Overview

A six-phase build, derived from 88 v1 requirements, that ships a brand-aligned single-screen waitlist page at `useQuibly.com` and exits cleanly when `marketing-app` takes the apex. Each phase is independently demoable, ordering external-service risk after the UX is proven: brand token parity locks before any UX, the static page proves Lighthouse mobile ≥90 on pure markup before any client JS, the form ships against a stub action before Resend is wired, then Resend + bot protection + welcome email ship together (the highest-risk surface) with Legal/SEO/Analytics running in parallel and gating production. The final phase is the apex go-live and cutover runbook itself, treated as a deliverable rather than a button-press. A conditional Phase 7 — the live signup counter — is deferred post-launch, gated on the audience reaching ≥50 contacts; it is **v2 scope**, not part of this v1 roadmap.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Scaffold + Brand Token Parity** - Next.js 16 + Tailwind v4 + shadcn scaffolded with Quibly tokens, fonts, mascot, and Zod-validated server-only env
- [ ] **Phase 2: Static Landing Page** - Hero + Why Quibly + Footer rendered as pure RSC markup at Lighthouse mobile ≥90 with no client JS
- [ ] **Phase 3: Email Capture Form (Stub Action)** - Single-field form with full UX states wired to a stubbed Server Action validating Zod + honeypot + time-trap
- [ ] **Phase 4: Resend Wiring + Bot Protection + Welcome Email** - Live audience write-path, rate limit, disposable-domain block, and welcome email with one-click unsubscribe headers
- [ ] **Phase 5: Legal + SEO + Analytics** - Privacy/terms, OG/social metadata, sitemap/robots/JSON-LD, and cookieless Vercel Analytics with server-side conversion events
- [ ] **Phase 6: Production Deploy + Cutover Runbook** - Apex bound at Vercel team level with full DNS, mail-tester 10/10, dry-run cutover, and a written `docs/cutover.md`
- [ ] **Phase 6.5: Quibly → Zeremi rebrand & domain cutover** (INSERTED 2026-05-28) - Rename app + character + domain to Zeremi / `zeremi.app`; swap Quicksand → Bree Serif for headings; import Z-mark assets; re-verify Resend sender on the new domain. Must complete before Phase 6 plans 06-04 (staging dry-run) and 06-05 (production go-live).

## Phase Details

### Phase 1: Scaffold + Brand Token Parity
**Goal**: A running Next.js 16 + Tailwind v4 app whose design tokens, fonts, mascot, and secret-handling posture match `marketing-app` exactly, so brand contract drift is impossible from day one.
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06, INFRA-07, INFRA-08
**Success Criteria** (what must be TRUE):
  1. A blank page renders in Quibly teal/amber with Quicksand headings and Figtree body, visually indistinguishable from `marketing-app`'s tokens (oklch primary, radius scale, font CSS variables verbatim).
  2. The Quibs Q-face mascot renders in the page as a reusable React component sourced from `public/`.
  3. shadcn button/input/label/sonner/form components are installed and styled to Quibly tokens (no default shadcn neutral).
  4. The app crashes at boot with a helpful Zod error if any Resend/Upstash env var is missing — never on first signup.
  5. A `gitleaks` pre-commit hook blocks any attempt to commit a string matching `re_*` (Resend key) or other secret patterns.
**Plans**: 6 plans
  - [x] 01-01-PLAN.md — Scaffold + env validation foundation (package.json, configs, lib/utils, lib/env, .env.example)
  - [x] 01-02-PLAN.md — Brand tokens + fonts + mascot port (globals.css, layout.tsx, QuibsIcon, QuibsAvatar, raw SVG)
  - [x] 01-03-PLAN.md — shadcn UI components (button, input, label, sonner — form deferred to Phase 3)
  - [x] 01-04-PLAN.md — Linting + secrets toolchain (ESLint custom rule, husky, gitleaks)
  - [x] 01-05-PLAN.md — Smoke-test page + visual verification + Vercel link (autonomous: false)
  - [x] 01-06-PLAN.md — Gap closure: wire `@/lib/env` into `app/layout.tsx` so SC #4 (boot-crash on missing env) is observable from a production code path

### Phase 2: Static Landing Page (No Form)
**Goal**: The full marketing surface — hero, "Why Quibly", founder voice, footer — rendered as pure server-component markup that proves Lighthouse mobile ≥90 before any client JavaScript ships.
**Depends on**: Phase 1
**Requirements**: HERO-01, HERO-02, HERO-03, HERO-04, HERO-05, HERO-06, HERO-07, MOB-01, MOB-02, MOB-03, MOB-04, FOLD-01, FOLD-02, FOLD-03, FOLD-04, PERF-01, PERF-02, PERF-03
**Success Criteria** (what must be TRUE):
  1. A visitor on a 320×568 viewport sees the headline, sub-headline, mascot, and a placeholder CTA above the fold without scrolling, with the headline (not the mascot) as the LCP element.
  2. The page scales cleanly from 320px to 1440px with all interactive elements ≥48px tall and body text ≥16px on mobile.
  3. The "Why Quibly" three-line differentiator block, founder-voice paragraph, secondary CTA, and footer with copyright + privacy/terms links all render below the fold.
  4. Lighthouse mobile performance ≥90, CLS <0.1, with no render-blocking third-party scripts on first paint — verified in CI on every PR.
  5. Users with `prefers-reduced-motion: reduce` see no decorative motion; the page works identically without animation.
**Plans**: 6 plans
  - [x] 02-01-PLAN.md — Foundation: Button `size="hero"` CVA variant + `prefers-reduced-motion` smooth-scroll override
  - [x] 02-02-PLAN.md — Hero + HeroMascot + PlaceholderFormSection (D-30 spacing tightening, D-31 disabled-button CTA)
  - [x] 02-03-PLAN.md — WhyQuibly + FounderVoice + SecondaryCTA + Footer (D-31 disabled secondary CTA, D-32 footer ≥48px tap targets)
  - [x] 02-04-PLAN.md — Page composition + Playwright above-fold/LCP/tap-target/focus-visible spec + manual viewport sweep checkpoint
  - [x] 02-05-PLAN.md — Lighthouse CI gate (D-33 render-blocking-resources error-level, D-34 branch-protection requirement)
  - [x] 02-06-PLAN.md — Playwright button-radius regression spec (D-06 28px lock — closes review concern #6)
**UI hint**: yes

### Phase 3: Email Capture Form (Stub Action)
**Goal**: The full submit UX — pending, success, error, already-subscribed, idempotent retry — works end-to-end against a stubbed Server Action that validates Zod + honeypot + time-trap, so debugging round-trip ergonomics happens before Resend is in the loop.
**Depends on**: Phase 2
**Requirements**: FORM-01, FORM-02, FORM-03, FORM-04, FORM-05, FORM-06, FORM-07, FORM-08, FORM-09, POST-01, POST-02, POST-03, POST-04, SPAM-01, SPAM-02
**Success Criteria** (what must be TRUE):
  1. A visitor can type an email, press Enter or tap "Join the waitlist", see a visible loading state, and land on an in-place success message ("You're on the list. Check your inbox (and spam folder) for confirmation") without any full-page navigation.
  2. Submitting an invalid email surfaces an inline error that preserves the typed value; submitting the same email twice produces the same success state (idempotent, never reveals duplicate enumeration).
  3. The form remains submittable with JavaScript disabled via the `<noscript>` fallback and native `<form action={…}>` progressive enhancement.
  4. A bot that fills the off-screen honeypot field, or a script that submits faster than ~2 seconds after render, is silently rejected without user-visible feedback.
  5. The Server Action runs Zod validation server-side on every submission and returns typed `useActionState` results that the Client Component renders without prop-drilling.
**Plans**: 7 plans
  - [x] 03-01-PLAN.md — Test infrastructure: Vitest+RTL+happy-dom install, configs, Playwright multi-project extension, .github/workflows/test.yml (Wave 1)
  - [x] 03-02-PLAN.md — Server Action stub at app/actions/join-waitlist.ts: real Zod + honeypot + time-trap; stub branches via deterministic email patterns; Vitest unit suite covering 8 branches (Wave 2)
  - [x] 03-03-PLAN.md — WaitlistForm Client Component, section rename (CD-07), Toaster mount, page wiring, RTL render-time tests (Wave 3)
  - [x] 03-04-PLAN.md — Hero + Secondary CTA anchor flips (D-01/D-02 — overrides Phase 2 D-31); Phase 2 button-radius spec selector update (Pitfall 9) (Wave 1, parallel with 03-01)
  - [x] 03-05-PLAN.md — Playwright e2e form specs (FORM-05/06/07, POST-01/02/03/04, D-01/D-02, D-12) — 7 spec files, ~12 tests (Wave 4)
  - [x] 03-06-PLAN.md — No-JS Playwright spec (FORM-08 graceful degradation acceptance) (Wave 4)
  - [x] 03-07-PLAN.md — Checkpoints: D-18 branch protection + D-04 founder copy review (Wave 4, autonomous: false)
**UI hint**: yes

### Phase 4: Resend Wiring + Bot Protection + Welcome Email
**Goal**: The single highest-risk seam: the form goes live against a real Resend audience, sends a deliverability-correct welcome email, and is defended by layered abuse protection so the audience cannot be poisoned the moment the form is publicly indexable.
**Depends on**: Phase 3
**Requirements**: EMAIL-01, EMAIL-02, EMAIL-03, EMAIL-04, EMAIL-05, EMAIL-06, EMAIL-07, EMAIL-08, EMAIL-09, STORE-01, STORE-02, STORE-03, STORE-04, STORE-05, SPAM-03, SPAM-04
**Success Criteria** (what must be TRUE):
  1. A real signup creates a contact in the "Quibly Waitlist" Resend audience (production), tagged with `consent_version` = the current privacy-policy git SHA, written via the restricted "Sending access" API key only.
  2. A welcome email arrives in Gmail, Outlook, and iCloud inboxes within 60 seconds of signup, sent from `hello@useQuibly.com`, with both `List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers visible in "Show Original", a one-click unsubscribe link in the body, plain-language copy, and a physical postal address in the footer.
  3. Submitting six emails in one minute from one IP, or 51 in one day, results in the sixth/51st being rate-limited; submitting an address ending in a disposable domain (e.g., `mailinator.com`) is silently rejected.
  4. A bounce or spam-complaint event from Resend's webhook reaches our route handler, is logged, and marks the contact unsubscribed; failed welcome-email sends produce both a server log and a `track('welcome_email_send_error')` event.
  5. The "Quibly Waitlist (Preview)" audience receives all PR-preview signups (production audience untouched), and a CSV export round-trip (audience → CSV → re-import) is validated end-to-end.
**Plans**: 8 plans
  - [x] 04-01-PLAN.md — Wave 0 deps + env extension (RESEND_FROM_POSTAL_ADDRESS, NEXT_PUBLIC_SITE_URL) + lib/disposable-domains.ts (SPAM-04) (Wave 1)
  - [x] 04-02-PLAN.md — lib/analytics.ts shim + lib/unsubscribe-token.ts HMAC + Vitest token round-trip (Wave 1, parallel with 04-01)
  - [x] 04-03-PLAN.md — lib/resend.ts singleton + lib/rate-limit.ts two-limiter ladder (Wave 2, depends on 04-01)
  - [x] 04-04-PLAN.md — emails/WelcomeEmail.tsx React Email template (D-01 locked voice) (Wave 2, depends on 04-01)
  - [x] 04-05-PLAN.md — app/actions/join-waitlist.ts body swap to real Resend pipeline + Vitest mock migration (Wave 3)
  - [x] 04-06-PLAN.md — app/api/webhooks/resend/route.ts (svix verify + D-08 dispatch) + app/unsubscribe/route.ts (RFC 8058) + Vitest coverage (Wave 3)
  - [x] 04-07-PLAN.md — Playwright spec migration (3 deletions + 1 modification) + 6 manual checkpoints (day-1 probes, postal address D-10, mail-tester, inbox tests, webhook registration, CSV round-trip) (Wave 4, autonomous: false)
  - [x] 04-08-PLAN.md — Gap closure (UAT 2026-04-28): harden unsubscribe-URL fallback chain (GAP-1 blocker) + Vercel env var checkpoint + UAT methodology section in 04-UAT.md (GAP-2 major) + optional production-audience cleanup (Wave 5, autonomous: false, gap_closure)

### Phase 5: Legal + SEO + Analytics
**Goal**: All compliance, discoverability, and observability surface area required to expose the form to public traffic — privacy/terms live, OG/Twitter previews render correctly, server-side conversion events fire, and zero non-essential cookies are set.
**Depends on**: Phase 1 (can run in parallel with Phases 2–4; gates Phase 6)
**Requirements**: LEGAL-01, LEGAL-02, LEGAL-03, LEGAL-04, LEGAL-05, LEGAL-06, LEGAL-07, LEGAL-08, SEO-01, SEO-02, SEO-03, SEO-04, SEO-05, SEO-06, SEO-07, SEO-08, ANLY-01, ANLY-02, ANLY-03, ANLY-04, ANLY-05, ANLY-06
**Success Criteria** (what must be TRUE):
  1. `/privacy` and `/terms` pages return 200 with project-specific content (Vercel + Resend named as processors, lawful basis = GDPR Art. 6(1)(a) consent, retention policy stated, DSAR contact `privacy@useQuibly.com`); both linked in the footer of every page; consent + "no spam, unsubscribe anytime" microcopy renders below the form button.
  2. Sharing `useQuibly.com` in iMessage, Slack, X, and LinkedIn renders a 1200×630 OG image with the Quibs mascot and tagline, validated through opengraph.xyz / X card validator / LinkedIn Post Inspector.
  3. `/sitemap.xml` lists `/`, `/privacy`, `/terms`; `/robots.txt` declares an explicit allow/deny decision for GPTBot, ClaudeBot, Google-Extended, PerplexityBot, and CCBot; Schema.org JSON-LD (Organization + WebSite) is present on the home page.
  4. A successful signup fires a server-side `track('waitlist_signup', { duplicate })` event; a welcome-email failure fires `track('welcome_email_send_error', { contactId })`; both appear in Vercel's custom-events dashboard.
  5. A fresh-incognito visit to the home page sets zero non-essential cookies in DevTools — no GA4, PostHog, Meta Pixel, LinkedIn Insight, Hotjar, Clarity, GTM, or any other third-party tracker is present in the bundle or network panel.
**Plans**: 6 plans
  - [x] 05-01-PLAN.md — Legal pages + consent-version + microcopy + join-waitlist consent_version swap (LEGAL-01..08, Wave 1)
  - [x] 05-02-PLAN.md — SEO surface: OG image + favicon + robots + sitemap + JSON-LD + metadata extension (SEO-01..08, Wave 2)
  - [x] 05-03-PLAN.md — Analytics wiring: Vercel Analytics + Speed Insights + lib/analytics.ts swap + tracker denylist (ANLY-01..06, Wave 3)
  - [x] 05-04-PLAN.md — Gap closure (UAT 2026-04-29): Terms governing law Delaware → California per D-01 PR confirmation (UAT Gap 1, Wave 1, gap_closure)
  - [x] 05-05-PLAN.md — Gap closure (UAT 2026-04-29): pre-rasterize public/quibs-icon.png + wire mascot into /opengraph-image (UAT Gap 2, Wave 1, gap_closure)
  - [x] 05-06-PLAN.md — Gap closure (UAT 2026-04-29): wire mascot PNG into /icon and /apple-icon for visual consistency (UAT Gap 3, Wave 2, depends on 05-05, gap_closure)

### Phase 6: Production Deploy + Cutover Runbook
**Goal**: Apex go-live at `useQuibly.com` is itself a verified deliverable — domain bound at the Vercel team level for atomic transfer, full DNS verified at mail-tester 10/10, and a written cutover runbook with a dry-run executed against a staging subdomain before launch.
**Depends on**: Phases 4 and 5
**Requirements**: DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04, DEPLOY-05, DEPLOY-06, DEPLOY-07, DEPLOY-08, DEPLOY-09
**Success Criteria** (what must be TRUE):
  1. Visiting `https://useQuibly.com` resolves to this project's production deploy with the apex domain bound at the Vercel **team** level (not project level), so the future transfer to `marketing-app` is a one-click atomic operation.
  2. Full DNS is verified — SPF + 3× DKIM + DMARC `p=none` + Return-Path — with the Resend domain owned at the Vercel team level; `mail-tester.com` returns a 10/10 score before the first production send.
  3. No Service Worker is registered, and `Strict-Transport-Security` is set to `max-age=300` (NOT `preload`), so the cutover to `marketing-app` remains reversible during the swap window.
  4. A complete `docs/cutover.md` exists in the repo covering: verify `marketing-app` ready → CSV export → broadcast timing decision → atomic Vercel domain transfer → legacy redirects → decommission steps (do NOT delete repo / Resend domain / audience) → rollback plan.
  5. The cutover has been dry-run on a staging subdomain (e.g., `staging.useQuibly.com`) end-to-end before the real launch, including a domain transfer back-and-forth between projects.
**Plans**: 5 plans
  - [x] 06-01-PLAN.md — next.config.ts async headers() block: 5-header hardening set with HSTS literal max-age=300 (DEPLOY-06; Wave 1)
  - [x] 06-02-PLAN.md — docs/cutover.md future-oriented runbook: 9 step-numbered sections + Rollback + Checklist, 200–500 lines (DEPLOY-08; Wave 1)
  - [x] 06-03-PLAN.md — 06-UAT.md launch-gating checklist: 12 numbered tests covering all 9 DEPLOY-XX + LEGAL-08 carryover (DEPLOY-01..09; Wave 1)
  - [ ] 06-04-PLAN.md — Cutover dry-run on staging.useQuibly.com: 4-screenshot transfer back-and-forth; updates docs/cutover.md Step 5 if observed UI labels differ (DEPLOY-09; Wave 3, autonomous: false)
  - [ ] 06-05-PLAN.md — Production go-live: privacy@useQuibly.com mailbox HARD launch-gate, apex bind verify, DNS dig, mail-tester 10/10, real-signup smoke, no-SW DevTools (DEPLOY-01..07; Wave 2, autonomous: false)

### Phase 6.5: Quibly → Zeremi rebrand & domain cutover (INSERTED 2026-05-28)
**Goal**: Every visible string, asset, font, component name, env var, metadata URL, sender domain, and test assertion reflects the new "Zeremi" brand on `zeremi.app` — atomically — so the production go-live (Phase 6 plans 06-04 and 06-05) launches as Zeremi and never as Quibly.
**Depends on**: Phase 6 plans 06-01, 06-02, 06-03 (already complete). Must complete BEFORE Phase 6 plans 06-04 (staging dry-run) and 06-05 (production go-live) — both of those plans currently target `useQuibly.com` / `staging.useQuibly.com` and will need their target domain updated to `zeremi.app` / `staging.zeremi.app` as part of this phase.
**Requirements**: To be derived during discuss/plan (no existing REQ-IDs cover the rename — this is net-new scope inserted post-requirements-lock).
**Success Criteria** (what must be TRUE):
  1. The landing page on `localhost` renders the wordmark `zeremi` (lowercase) in Bree Serif, all headings in Bree Serif, body in Figtree, and shows the gradient Z mark in the hero — no Quicksand font is loaded in the network panel, and no string `Quibly` or `Quibs` appears in the rendered DOM.
  2. The `components/quibs/` folder is renamed to `components/zeremi/` with all imports updated; brand assets from `marketing-app/public/brand/zeremi/{src,png}` are copied into `quibly-landing/public/brand/zeremi/`; the OG image, favicon, and Apple touch icon all reference the Z-mark assets.
  3. `useQuibly.com` is replaced with `zeremi.app` in every metadata canonical URL, sitemap entry, robots.txt host, env default, Schema.org JSON-LD, welcome-email From address, unsubscribe-link generator, and legal-page reference; the privacy policy explicitly notes the rename and the date.
  4. Resend has a verified sender on `zeremi.app` (SPF + 3× DKIM + DMARC `p=none`) reaching ≥9/10 on `mail-tester.com`; the welcome email reuses the existing template visually but ships from `hello@zeremi.app` with the new wordmark inline-rendered.
  5. The Vitest + Playwright suites pass with updated assertions; no test in `tests/` greps for `Quibly` or `Quibs`; Phase 6 plans 06-04 and 06-05 have been edited to target `zeremi.app` / `staging.zeremi.app` and their UAT checklists updated accordingly.
**Plans**: 7 plans
  - [x] 06.5-01-PLAN.md — Foundation A: Bree Serif font swap + brand asset import (CD-03)
  - [x] 06.5-02-PLAN.md — Foundation B: ZeremiIcon/ZeremiAvatar components, HeroMascot/WhyZeremi rename, delete components/quibs/ (D-04, CD-04)
  - [x] 06.5-03-PLAN.md — String sweep: app/, sections, lib/, OG/favicon/Apple icon, legal pages with rename notice, delete stale assets (D-09, CD-04, CD-08)
  - [x] 06.5-04-PLAN.md — Email send-path: Pattern D triplet, WelcomeEmail template, regenerate wordmark PNG, update 4 test files
  - [x] 06.5-05-PLAN.md — CI grep guard activation (D-03, CD-05) + Wave 0 branding tests (VALIDATION.md)
  - [ ] 06.5-06-PLAN.md — Resend zeremi.app sender verify + mail-tester ≥9/10 + audience renames (autonomous: false, D-08, SC #4)
  - [ ] 06.5-07-PLAN.md — Phase 6 plan edits in-place (D-02): retarget 06-04/06-05/06-UAT to zeremi.app + add useQuibly.com unbind/delete steps (D-06, D-07, CD-07); STATE.md + PROJECT.md close-phase updates
**UI hint**: yes
**Notes**: See `.planning/notes/zeremi-brand-decisions-2026-05-28.md` for typography decisions, asset paths, and component rename map. The post-launch re-introduction email to existing Quibly contacts is tracked separately as a seed: `.planning/seeds/migrate-quibly-contacts-to-zeremi-audience.md` — do NOT bundle that into this phase; it can only fire after the new sender domain has warmed.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scaffold + Brand Token Parity | 0/6 | Not started | - |
| 2. Static Landing Page | 0/6 | Not started | - |
| 3. Email Capture Form (Stub Action) | 0/TBD | Not started | - |
| 4. Resend Wiring + Bot Protection + Welcome Email | 0/8 | Not started | - |
| 5. Legal + SEO + Analytics | 0/6 | Not started | - |
| 6. Production Deploy + Cutover Runbook | 0/5 | Not started | - |
| 6.5. Quibly → Zeremi rebrand & domain cutover (INSERTED) | 5/7 | In Progress|  |
