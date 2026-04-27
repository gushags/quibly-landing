# Project Research Summary

**Project:** Quibly Landing (`quibly-landing`)
**Domain:** Pre-launch SaaS waitlist landing page (single-screen email capture, brand-aligned, replaceable by `marketing-app` at launch)
**Researched:** 2026-04-27
**Confidence:** HIGH

## Executive Summary

This is a single-screen pre-launch waitlist page at `useQuibly.com` whose only KPI is "warm, opted-in contacts at launch day." The list itself is the deliverable; the page exists to convert ~83% mobile traffic into that list and then quietly hand the apex domain to `marketing-app` when the real product ships. Modern playbooks (Waitlister, Flowjam, GetLaunchList 2026) converge on the same pattern: minimal hero with personality, single-field form, single opt-in welcome email, no dark patterns. Single-field forms convert at 13–23% versus 6.6% median; the project's ≥15% target is achievable on a Next.js 16 + Tailwind v4 + shadcn/ui + Resend stack reused from `marketing-app` so the brand contract (oklch teal, Quicksand/Figtree, pill radii, Quibs mascot) doesn't drift.

The recommended approach is a Server-Action–driven, statically-rendered Next.js 16 page with one mutation seam (`app/actions/join-waitlist.ts`) that does Zod validation → honeypot check → rate limit → `resend.contacts.create({ audienceId, email })` → fire-and-forget welcome email → server-side analytics. **Resend Audiences is the source of truth** for the waitlist (no proprietary database) — this is the deliberate choice for a pre-launch MVP whose end state is replacement, not graduation; CSV export plus the same Resend account already used by `marketing-app` makes the cutover a one-click Vercel domain transfer rather than a data migration. **Cookieless analytics (Vercel Web Analytics)** lets us skip a consent banner entirely, which is non-negotiable for hitting Lighthouse mobile ≥90.

The biggest risks are deliverability and launch-day cutover, not feature complexity. Welcome emails must ship with `List-Unsubscribe` + `List-Unsubscribe-Post: One-Click` headers and a verified SPF/DKIM/DMARC-aligned sender from day one — otherwise the launch broadcast (the moment the list matters most) bounces at the SMTP level. Bot protection must be layered (honeypot + rate limit + Zod) before the form is publicly indexable so the audience isn't poisoned. The apex-domain handoff to `marketing-app` must happen at the Vercel team level (atomic transfer) with the Resend domain owned by the team, not this repo.

## Key Findings

### Recommended Stack

`marketing-app`'s `package.json` is the spec: every shared technology pins to the same minor so the brand contract transfers verbatim. Astro would buy ~5–10 Lighthouse points but at the cost of forking the design system, which is the single largest source of brand drift. See STACK.md for full rationale.

**Core technologies:**
- **Next.js 16.2.x (App Router)** — static page + one Server Action; matches `marketing-app` 16.2.1
- **TypeScript 5 + React 19.2** — pinned by Next 16
- **Tailwind v4 + shadcn/ui (CLI ^4.1)** — required by token reuse; v3 silently drops `@theme inline`/oklch
- **Resend ^6.12 + `@react-email/components` ^1.0** — Audiences storage + transactional welcome
- **Zod ^4.0 + Vercel Analytics + Speed Insights** — cookieless events, no banner
- **`next/font/google` (Quicksand + Figtree, variable, swap, latin)** — saves ~200ms LCP on mobile
- **`@vercel/og` `ImageResponse`** — dynamic OG image, 2× faster in 16.2

**Explicitly omitted:** Framer Motion, `react-hook-form`, `react-icons`, `next-themes`, `@tailwindcss/typography`, Drizzle/Prisma/Supabase, third-party cookie banner SDKs, GTM, GA4, PostHog, reCAPTCHA.

### Expected Features

**Must have (table stakes):**
- Single email field; action-oriented CTA copy; HTML5 + Zod validation; loading + inline error states
- Visible in-place success state; already-subscribed handled as success (never reveals enumeration)
- Welcome email within 60s with one-click unsubscribe + physical postal address
- Privacy + terms pages live before form goes live; consent microcopy below button
- Honeypot + rate limit (no CAPTCHA in v1 — see Conflict #2)
- Mobile-first 320 → 1440px; 48px+ tap targets
- Cookieless Vercel Web Analytics; OG/Twitter Card metadata + 1200×630 OG image
- Lighthouse mobile ≥90

**Should have (differentiators):**
- Founder-voice micro-story (highest-leverage social proof at zero signups)
- Below-fold "Why Quibly" 3-line block + secondary CTA at bottom
- Quibs mascot as hero
- Live signup counter, gated ≥50 contacts, floored to nearest 50
- Specific launch-timing language ("Launching Summer 2026")
- `prefers-reduced-motion` + Schema.org JSON-LD

**Defer (v2+):**
- Referral mechanics, A/B testing infra, i18n, build-progress update emails, email typo correction

**Anti-features (excluded):** fake countdown timers, multi-field forms, double opt-in, exit-intent popups, cookie consent banners, reCAPTCHA, embedded chatbot, pricing teaser, fake testimonials, autoplay video.

### Architecture Approach

Static-first Next.js 16 page with one Client Component island for the form, one Server Action for the entire submit pipeline, and Resend Audiences as source of truth. The Server Action is the only seam between browser-trusted input and external services — `import 'server-only'` on `lib/resend.ts` enforces this at build time.

**Major components:**
1. **`app/page.tsx` (RSC)** — `<Hero>` + `<WhyQuibly>` + `<Footer>`, server-rendered
2. **`<WaitlistForm>` (Client Component)** — single field + honeypot, `useActionState`-bound
3. **`app/actions/join-waitlist.ts` (Server Action)** — single mutation: validate → spam-check → store → fire-and-forget email → track
4. **`emails/welcome-email.tsx`** — React Email JSX with `List-Unsubscribe-Post` header + postal address
5. **`lib/{resend,rate-limit,env,analytics}.ts`** — singleton clients with `server-only` guard
6. **`app/(legal)/{privacy,terms}/page.tsx`** — RSCs
7. **`app/{opengraph-image,robots,sitemap}.ts`** — Next.js file conventions

**Storage:** ONE Resend audience "Quibly Waitlist" (created in dashboard pre-deploy). Preview env uses separate "Quibly Waitlist (Preview)" audience.

### Critical Pitfalls

1. **Welcome email missing `List-Unsubscribe-Post: List-Unsubscribe=One-Click`** — Gmail/Yahoo bounce at SMTP level. Fix: both headers in first welcome email rendered; verify in Gmail "Show Original."
2. **Sender domain SPF/DKIM/DMARC misalignment** — `dkim=pass` but `dmarc=fail` silently destroys list value. Fix: full DNS verified at `mail-tester.com` 10/10 before first production send.
3. **No bot protection → audience poisoning** — flips Gmail's >0.3% complaint threshold. Fix: layered honeypot + time-trap + Upstash sliding-window (5/min/IP, 50/day/IP) + disposable-domain blocklist from day one.
4. **`RESEND_API_KEY` exposure** — GDPR Art. 33 reportable breach. Fix: restricted "Sending access" key; `import 'server-only'`; `gitleaks` pre-commit; grep audit.
5. **Apex-domain cutover breakage** — both Vercel projects fight for apex; Resend domain bound to wrong owner. Fix: bind apex + Resend domain at Vercel **team** level; one-click `vercel domains transfer`; no Service Worker; `Strict-Transport-Security: max-age=300` initially.

## Conflict Resolution

### 1. Storage source of truth — Resend Audiences only, no proprietary database in v1

ARCHITECTURE.md says "Resend as source of truth"; PITFALLS.md says "dual-write to a primary DB from day one."

**Decision:** ARCHITECTURE.md wins. **No proprietary database in v1.**

**Rationale:** This is a pre-launch MVP **expected to be replaced cleanly** when `marketing-app` takes the domain. PROJECT.md's lifecycle constraint is "captured emails must be exportable / portable" — Resend's CSV export satisfies that. PITFALLS.md's dual-write argument optimizes for a long-lived ESP migration that is not the cutover path here. Both projects share the same Resend account; at cutover `marketing-app` reads the same audience or imports the CSV. A Postgres/Neon table introduces a database to a project with zero other DB needs, an admin UI requirement, a migration burden at handoff, and an additional secret to rotate.

GDPR consent-record concern is mitigated **at the form level**: snapshot the privacy-policy git SHA / version string into Resend's contact `properties` field at signup time. IP/UA/UTM stay in Vercel's standard 30-day log retention; not legally required to persist beyond that.

**Trade-off accepted:** if the project pivots and `marketing-app` ships a Postgres-backed waitlist, we re-import the CSV with null `ip_address`/`utm_*` columns. One-time cost; building dual-write now is a permanent cost.

### 2. Bot protection layers — Honeypot + Zod + Upstash rate limit. No CAPTCHA in v1.

**Decision:** ARCHITECTURE.md/PITFALLS.md win. **Ship v1 with honeypot + time-trap + Upstash sliding-window rate limit + Zod email validation + small disposable-domain blocklist. No Turnstile.**

**Rationale:** CAPTCHAs measurably depress conversion (1–5 points on mobile); the ≥15% target is at the lower edge of single-field range. Turnstile breaks on iOS Safari with strict tracking protection, on browsers with privacy extensions, and on mobile emulators (Cloudflare's own troubleshooting docs confirm) — wrong audience to friction for indie/privacy-conscious operators. The four-layer defense catches >95% of automated abuse at zero friction cost.

**Signals that justify upgrading to Turnstile in v1.x:**
- Welcome-email **bounce rate >2%** for >48 hours
- Audience growth **vertical spike inconsistent with traffic**
- Resend dashboard shows **spam-complaint rate approaching 0.1%** (Gmail enforces at 0.3%)
- Same IP bucket appears in rate-limit rejections at >100/day for 3+ days
- Audience contains high proportion of unfamiliar-TLD addresses inconsistent with target audience

If any fire, add `@marsidev/react-turnstile` as Layer 4. Plan the wiring in v1's Server Action signature so it can be added without restructuring.

### 3. Welcome email timing — Fire-and-forget is the v1 default

**Decision:** Welcome email is **fire-and-forget** — `resend.emails.send(...).catch(console.error)` invoked but not awaited.

**Rationale:** User's success criterion is "I'm on the list," not "I have an email." `resend.contacts.create` is the load-bearing operation; the welcome email is reinforcement. Awaiting couples user-visible UX to a non-critical side effect. On Vercel serverless, the Promise resolves before the function instance is frozen because Server Actions await React's render flush. (If aborted-send logs ever appear, switch to `waitUntil()` from `@vercel/functions` — but do not pre-build this.)

**Failure observability we need (must ship in v1):**
- `console.error('welcome_email_send_failed', { contactId, error })` on the `.catch()`
- Server-side `track('welcome_email_send_error', { contactId })` so failures are countable
- Resend webhook subscription to `email.bounced` and `email.complained` events → Vercel route handler that logs and (optionally) marks contact `unsubscribed=true`
- Weekly manual check of Resend's "Emails" dashboard during pre-launch
- Success-state copy: **"Check your inbox (and spam folder) for confirmation"** so a missing email is recoverable from the user's side

### 4. Cookie consent — Explicit commitment: no marketing cookies, no banner, ever in v1

**Decision (load-bearing):**
- **No non-essential cookies on the landing page, period.** v1 constraint, not a default.
- **Analytics:** Vercel Web Analytics (cookieless, daily-rotating hash) + Vercel Speed Insights. **No GA4, no PostHog, no Meta Pixel, no LinkedIn Insight, no Hotjar, no Microsoft Clarity, no any-other-tracking-pixel.**
- **The only cookie-like state allowed** is (a) Cloudflare Turnstile's `__cf_bm` if/when added (strictly necessary, exempt from consent), (b) any rate-limit/honeypot signed cookie used by the Server Action (also strictly necessary).
- **Privacy policy must disclose** Vercel Analytics + Speed Insights + Resend as processors, with cookieless-by-design called out — disclosure, not consent.
- **No third-party cookie-banner SDK ever** (Cookiebot, OneTrust, Termly, CookieYes).
- **If a future requirement adds Meta/LinkedIn pixels for paid acquisition, that requirement must also add a banner at the same time.** They come together or neither comes. Roadmap should not list "add PostHog" or "add GA4" as incremental v1.x improvements without the corresponding banner work.

## Implications for Roadmap

Six phases, each independently demoable, ordering external-service risk after the UX is proven.

### Phase 1: Scaffold + Brand Token Parity
**Rationale:** Brand contract is the load-bearing constraint; lock parity on day one.
**Delivers:** `create-next-app` (Next 16.2 + TS + Tailwind v4 + App Router); `app/globals.css` copied verbatim from `marketing-app`; Quicksand + Figtree via `next/font/google` (variable, swap, latin); shadcn CLI v4 init + button/input/label/sonner/form; `lib/utils.ts`; Quibs mascot SVG in `public/`; `lib/env.ts` with Zod-validated env; hello-world page in brand colors.
**Avoids:** API key exposure (env scaffolded with `server-only` from start), font-swap layout shift.

### Phase 2: Static Landing Page (No Form)
**Rationale:** Prove Lighthouse mobile ≥90 on pure markup before any client JS.
**Delivers:** `app/page.tsx` with `<Hero>` + `<WhyQuibly>` + `<Footer>`; responsive 320 → 1440; Lighthouse ≥90 verified in CI; CLS <0.1; LCP element is the headline (not the mascot).

### Phase 3: Email Capture Form + Server Action (No External Services)
**Rationale:** Wire full UX against a stub action; debugging round-trip + already-subscribed branch is fastest before Resend is in the loop.
**Delivers:** `<WaitlistForm>` Client Component with `useActionState`; in-place success/error/pending states; `app/actions/join-waitlist.ts` with Zod + honeypot + time-trap returning stubbed success; consent microcopy linking to placeholder `/privacy` and `/terms`; `<noscript>` fallback; idempotent submit.

### Phase 4: Resend Wiring + Bot Protection + Welcome Email
**Rationale:** Highest-risk phase (deliverability, key handling, abuse) — after UX is proven so debugging is bounded. Welcome email + bot protection ship together because the welcome email is the abuse vector.
**Delivers:** Resend domain `useQuibly.com` verified at Vercel **team** level with full DNS (SPF + 3× DKIM + DMARC `p=none` + Return-Path); `mail-tester.com` 10/10 verified before first send; "Quibly Waitlist" audience created with restricted "Sending access" API key; `lib/resend.ts` singleton with `server-only`; Upstash sliding-window (5/min/IP, 50/day/IP); disposable-domain blocklist; Server Action wired end-to-end; `emails/welcome-email.tsx` with `List-Unsubscribe-Post: One-Click` header, physical postal address, `From: hello@useQuibly.com` (NOT `noreply@`); inbox tests against Gmail + Outlook + iCloud; honeypot + rate-limit + duplicate-email tests; `gitleaks` pre-commit; preview env points to separate audience.

### Phase 5: Legal + SEO + Analytics (parallel-completable with Phase 4)
**Rationale:** Doesn't depend on form pipeline being live, but all of it gates production deploy under GDPR/CAN-SPAM.
**Delivers:** `/privacy` page (real, customized — lists Vercel + Resend as processors, lawful basis = consent under GDPR Art. 6(1)(a), retention "until unsubscribe or 12 months post-launch," DSAR contact `privacy@useQuibly.com`); `/terms` page; consent microcopy finalized; **privacy-policy version snapshot** wired into Server Action so each Resend contact gets `properties.consent_version`; `app/opengraph-image.tsx` (Quibs + tagline 1200×630) tested in opengraph.xyz / X validator / LinkedIn Inspector; `app/twitter-image.tsx`; metadata; favicon + apple-touch-icon; `robots.ts` (with explicit AI-crawler decision); `sitemap.ts` (`/`, `/privacy`, `/terms`); Schema.org JSON-LD; Vercel Web Analytics + Speed Insights mounted; server-side `track('waitlist_signup', { duplicate })` and `track('welcome_email_send_error')`; **zero non-Vercel cookies in DevTools verified.**

### Phase 6: Production Deploy + Cutover Runbook
**Rationale:** Apex go-live is a deliverable in its own right because the cutover runbook is itself a deliverable.
**Delivers:** Apex bound at Vercel **team** level; production deploy; smoke test; Speed Insights field-data dashboard reviewed; **written cutover runbook** (`docs/cutover.md`) covering verify `marketing-app` ready → CSV export → broadcast timing decision → atomic Vercel transfer → legacy redirects → decommission (do NOT delete repo / Resend domain / audience) → rollback plan; preview deploy of `marketing-app` at `staging.useQuibly.com` to dry-run; explicit decisions documented to NOT ship Service Worker and NOT enable HSTS preload (use `max-age=300` initially).

### Phase 7 (post-launch, conditional): Live Signup Counter
**Rationale:** Activated after audience crosses 50 contacts; small RSC change, not a launch-gating phase.
**Delivers:** Server Component reads cached count, revalidate 60s; renders "Join 200+ others" floored to nearest 50 only when ≥50; never exact number; never names/emails.

### Phase Ordering Rationale

- Brand tokens (P1) before everything → token drift is #1 launch-handoff risk
- Static page (P2) before any JS → Lighthouse ≥90 must be provable on pure markup
- Form UX (P3) before Resend (P4) → debugging `useActionState` round-trip is fastest against a stub
- Resend + bot protection (P4) together → audience is poisoned the moment the form is indexable without protection
- Legal/SEO/Analytics (P5) parallel with P4 but **all of it gates production deploy**
- Production + cutover (P6) explicit and last → "deploy" as a single button-click is how cutover bugs happen
- Counter (P7) gated post-launch → no audience to count until there is one; threshold gate built in P5 means flipping on is a constant change

### Research Flags

Phases needing deeper research:
- **Phase 4** — Resend duplicate-email response shape (5-min day-1 probe); Resend webhook event names for `email.bounced`/`email.complained` (15-min docs check)
- **Phase 5** — privacy-policy version snapshot mechanism design decision (recommend build-time git SHA from privacy MDX file)
- **Phase 6** — cross-team Vercel domain transfer UI flow (verify dry-run on staging subdomain before real cutover)

Standard patterns (skip `/gsd-research-phase`):
- **Phase 1** (scaffold + tokens), **Phase 2** (static page), **Phase 3** (form UX with documented Next 16 patterns), **Phase 7** (cached RSC counter)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified against `marketing-app` package.json + official Next 16.2 / Tailwind v4 / shadcn / Resend / Upstash docs via Context7. One MEDIUM flag: Resend duplicate-email response shape. |
| Features | HIGH | 2026 patterns consistent across 7+ recent waitlist sources; conversion benchmarks corroborated across 5 industry studies. |
| Architecture | HIGH | Server Action pattern verified against official Next.js 16 docs; Resend Audiences flow against SDK docs; same-team Vercel domain transfer verified atomic. MEDIUM only on cross-team UI flow. |
| Pitfalls | HIGH | Deliverability pitfalls verified against RFC 8058 + Gmail/Yahoo bulk-sender requirements + Postmark/Mailgun/SocketLabs guidance. Bot-protection efficacy across Friendly Captcha / GeeTest / DataDome 2026. |

**Overall confidence:** HIGH

### Gaps to Address

- **Resend duplicate-email response shape** — verify empirically on day 1 of Phase 4 (5 min)
- **Resend webhook event names for `email.bounced`/`email.complained`** — verify against webhook docs at start of Phase 4 (15 min)
- **Physical postal address for welcome email** — sourced before Phase 4 (registered agent / USPS PO box / commercial mail receiving agency); business decision, flag for founder
- **Privacy-policy text and ToS text** — adapt from `marketing-app/.planning/` templates with `useQuibly.com` substitutions; customize data-collection list (email, IP/UA/UTM analytics) and processor list (Vercel, Resend); 2–3 hours including legal review
- **AI-crawler decision** in `robots.txt` for `GPTBot`/`ClaudeBot`/`Google-Extended`/`PerplexityBot`/`CCBot` — defaults to "allow" unless founder specifies; flag during Phase 5
- **Privacy-policy versioning mechanism** — recommend build-time git SHA from privacy MDX file
- **Launch broadcast timing** (pre- vs post-cutover) — recommend pre-cutover; runbook decision in Phase 6

## Sources

### Primary (HIGH confidence)
- `/vercel/next.js`, `/websites/resend`, `/marsidev/react-turnstile`, `/colinhacks/zod` (Context7)
- Next.js 16.2 release notes; Next.js fonts API; shadcn Tailwind v4 guide
- Resend create-contact API; "New API Key Permissions" changelog; "Exports as CSV" changelog
- Vercel "Instantly Transfer Domains" changelog; Vercel custom events; Vercel Web Analytics privacy policy
- RFC 8058 (One-Click List-Unsubscribe); FTC CAN-SPAM Compliance Guide; Cloudflare Turnstile docs
- `/Users/jeff/repos/marketing-app/{package.json,app/globals.css,lib/email/client.ts,docs/superpowers/specs/2026-04-14-quibly-design-system.md}`
- `/Users/jeff/repos/quibly-landing/.planning/PROJECT.md`

### Secondary (MEDIUM confidence)
- 5 conversion-benchmark sources (daydream, GenesysGrowth, Foundry CRO, Apexure, LanderLab) — agree on 13–23% / 6.6% median / 25%+ top
- 7 waitlist-pattern sources (Waitlister, Flowjam, Moosend, GetResponse, Magic UI, GetLaunchList, Beyond Labs)
- Bot-protection efficacy: Friendly Captcha, GeeTest 2026, Dataprixa, DataDome
- Cookie-banner conversion impact: Consenteo, iubenda
- Astro vs Next.js performance — eastondev 2025-12-02

### Tertiary (LOW confidence — needs runtime validation)
- Resend duplicate-email response shape (Phase 4 day-1 probe)
- Resend webhook event names (Phase 4 verification)
- Vercel cross-team domain transfer UI flow (Phase 6 dry-run)

---
*Research completed: 2026-04-27*
*Ready for roadmap: yes*
