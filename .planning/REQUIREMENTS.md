# Requirements: Quibly Landing

**Defined:** 2026-04-27
**Core Value:** Convert visitors at `useQuibly.com` into a list of warm, opted-in waitlist contacts that can be notified when Quibly launches — without needing product screenshots, demos, or full marketing copy.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Infrastructure & Brand Tokens

- [ ] **INFRA-01**: Project scaffolded with Next.js 16.2, React 19.2, TypeScript, Tailwind v4, App Router (matches `marketing-app` versions exactly)
- [ ] **INFRA-02**: Quibly design tokens copied verbatim from `marketing-app/app/globals.css` (oklch teal primary, radius scale, sidebar/chart tokens)
- [ ] **INFRA-03**: Quicksand (headings) + Figtree (body) loaded via `next/font/google` with `display: 'swap'`, variable axis, `subsets: ['latin']`
- [ ] **INFRA-04**: Quibs Q-face mascot SVG available in `public/` and as a reusable React component
- [ ] **INFRA-05**: shadcn/ui CLI v4 initialized with button, input, label, sonner, form components
- [x] **INFRA-06**: `lib/env.ts` Zod-validated environment variables (no raw `process.env` reads in app code)
- [ ] **INFRA-07**: `import 'server-only'` guard on `lib/resend.ts` and any module touching `RESEND_API_KEY`
- [ ] **INFRA-08**: `gitleaks` pre-commit hook prevents secret commits

### Hero / Above-the-Fold

- [ ] **HERO-01**: Above-fold benefit-led headline ("You know your business. Quibly knows how to market it.") in Quicksand Bold
- [ ] **HERO-02**: 15–25-word sub-headline framing the offer for solopreneurs/small teams
- [ ] **HERO-03**: Quibs Q-face mascot rendered as the hero visual focal point (teal gradient container, white icon)
- [ ] **HERO-04**: Single primary pill-shaped CTA above the fold (28px radius, no competing buttons)
- [ ] **HERO-05**: Specific launch-timing language under the form (e.g., "Launching Summer 2026")
- [ ] **HERO-06**: LCP element is the headline text, not the mascot or any image
- [ ] **HERO-07**: `prefers-reduced-motion` honored on any decorative motion

### Mobile-First Layout

- [ ] **MOB-01**: Layout responsive across 320px → 1440px viewports
- [ ] **MOB-02**: All interactive elements ≥48px tap target on mobile
- [ ] **MOB-03**: Single-column layout on mobile; thumb-reachable form
- [ ] **MOB-04**: Body text ≥16px on mobile (prevents iOS Safari zoom-on-focus)

### Email Capture Form

- [ ] **FORM-01**: Single email input field (no name/company/role)
- [ ] **FORM-02**: `<input type="email" inputMode="email" autoComplete="email">` with HTML5 client validation
- [ ] **FORM-03**: Server-side Zod email validation in the Server Action
- [ ] **FORM-04**: Action-oriented CTA copy ("Join the waitlist")
- [ ] **FORM-05**: Visible loading state during submit (button disabled + spinner)
- [ ] **FORM-06**: Inline error messaging preserves typed value
- [ ] **FORM-07**: Native `<form>` element supports Enter-key submit
- [ ] **FORM-08**: Form remains submittable without JavaScript via framework-native progressive enhancement (Next.js `<form action={serverAction}>` + React 19 `useActionState` thread the action result into the no-JS server render — empirically confirmed Phase 3 Plan 06; supersedes earlier `<noscript>` literal wording per CONTEXT D-16)
- [ ] **FORM-09**: `useActionState` binds the Client Component form to the Server Action

### Post-Submit Experience

- [ ] **POST-01**: In-place success state replaces the form (no full-page navigation)
- [ ] **POST-02**: Success copy includes "Check your inbox (and spam folder) for confirmation"
- [ ] **POST-03**: Already-subscribed treated as success — never reveals enumeration
- [ ] **POST-04**: Idempotent submission (double-submit is safe)

### Welcome Email (Single Opt-In)

- [ ] **EMAIL-01**: Welcome email sent fire-and-forget within 60s of successful signup
- [ ] **EMAIL-02**: Sent from `hello@useQuibly.com` (NOT `noreply@`), Resend-verified domain
- [ ] **EMAIL-03**: `List-Unsubscribe` AND `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers present
- [ ] **EMAIL-04**: One-click unsubscribe link in body
- [ ] **EMAIL-05**: Physical postal address in footer (CAN-SPAM requirement)
- [ ] **EMAIL-06**: Plain-language confirmation paragraph (no marketing fluff)
- [ ] **EMAIL-07**: React Email JSX template (`emails/welcome-email.tsx`)
- [ ] **EMAIL-08**: Server-side observability for welcome-email failures (`console.error` + `track('welcome_email_send_error')`)
- [ ] **EMAIL-09**: Resend webhook subscription to `email.bounced` and `email.complained` events with route handler that logs and marks contact unsubscribed

### Email Storage (Resend Audiences)

- [ ] **STORE-01**: One Resend audience "Quibly Waitlist" created (production); separate audience for preview env
- [ ] **STORE-02**: Restricted "Sending access" Resend API key (NOT full-access key)
- [ ] **STORE-03**: `resend.contacts.create({ audienceId, email, properties })` is the single write path
- [ ] **STORE-04**: Each contact carries a `consent_version` property (privacy-policy git SHA) at signup time
- [ ] **STORE-05**: CSV export workflow validated end-to-end (audience → CSV → re-import)

### Legal / Compliance

- [ ] **LEGAL-01**: `/privacy` page live before the form is exposed to public traffic
- [ ] **LEGAL-02**: `/terms` page live before the form is exposed to public traffic
- [ ] **LEGAL-03**: Privacy policy lists Vercel (Analytics + Speed Insights) and Resend as data processors
- [ ] **LEGAL-04**: Privacy policy declares lawful basis = consent under GDPR Art. 6(1)(a) and retention policy
- [ ] **LEGAL-05**: Privacy + terms links present in footer on every page
- [ ] **LEGAL-06**: Consent microcopy under the form button ("By joining, you agree to our Privacy Policy and Terms")
- [ ] **LEGAL-07**: "No spam, unsubscribe anytime" reassurance copy near the form
- [ ] **LEGAL-08**: DSAR contact published in privacy policy (e.g., `privacy@useQuibly.com`)

### Spam / Bot Protection

- [ ] **SPAM-01**: Hidden honeypot field (off-screen, `tabIndex={-1}`, `autoComplete="off"`); filled honeypot rejects submission silently
- [ ] **SPAM-02**: Time-trap rejects submissions completed faster than human-plausible (~2s)
- [ ] **SPAM-03**: Upstash Redis sliding-window rate limit: 5/min/IP and 50/day/IP
- [ ] **SPAM-04**: Disposable-domain blocklist (small built-in list, e.g., `mailinator.com`, `tempmail.com`, `10minutemail.com`)

### Analytics & Cookie Posture

- [ ] **ANLY-01**: Vercel Web Analytics mounted (cookieless, no consent banner needed)
- [ ] **ANLY-02**: Vercel Speed Insights mounted
- [ ] **ANLY-03**: Server-side `track('waitlist_signup', { duplicate })` event fires on every successful contact-create
- [ ] **ANLY-04**: Server-side `track('welcome_email_send_error', { contactId })` event on welcome failures
- [ ] **ANLY-05**: Zero non-essential cookies verified in DevTools on a fresh-incognito visit
- [ ] **ANLY-06**: No GA4, PostHog, Meta Pixel, LinkedIn Insight, Hotjar, Microsoft Clarity, GTM, or any third-party tracking SDK

### SEO / Open Graph

- [ ] **SEO-01**: `<title>` and `<meta name="description">` set via Next.js metadata API
- [ ] **SEO-02**: Open Graph tags (og:title, og:description, og:image, og:url, og:type)
- [ ] **SEO-03**: Twitter Card tags (`summary_large_image`)
- [ ] **SEO-04**: 1200×630 OG image with Quibs mascot + tagline (dynamic via `app/opengraph-image.tsx`)
- [ ] **SEO-05**: `favicon.ico` and `apple-touch-icon` derived from the Quibs Q-face
- [ ] **SEO-06**: `robots.ts` with explicit AI-crawler decision (allow or block GPTBot, ClaudeBot, Google-Extended, PerplexityBot, CCBot)
- [ ] **SEO-07**: `sitemap.ts` listing `/`, `/privacy`, `/terms`
- [ ] **SEO-08**: Schema.org JSON-LD (Organization + WebSite)

### Below-the-Fold Content

- [ ] **FOLD-01**: Three-line "Why Quibly" differentiator block (text-only, no screenshots) — strategy-first / AI advisory board / metrics-driven loop
- [ ] **FOLD-02**: Founder-voice micro-story (one short paragraph) as zero-signup social proof
- [ ] **FOLD-03**: Secondary CTA at the bottom of the page anchoring back to the form
- [ ] **FOLD-04**: Footer with copyright line, privacy + terms links

### Performance

- [ ] **PERF-01**: Lighthouse mobile performance ≥90 verified in CI
- [ ] **PERF-02**: CLS < 0.1
- [ ] **PERF-03**: No render-blocking third-party scripts on first paint

### Production Deploy & Cutover

- [ ] **DEPLOY-01**: Production deployed on Vercel at `useQuibly.com` apex
- [ ] **DEPLOY-02**: Apex domain bound at Vercel **team** level (not project level) — enables atomic transfer to `marketing-app` later
- [ ] **DEPLOY-03**: Resend domain verified at Vercel team level (so `marketing-app` inherits it at cutover)
- [ ] **DEPLOY-04**: Full DNS verification: SPF + 3× DKIM + DMARC `p=none` + Return-Path
- [ ] **DEPLOY-05**: `mail-tester.com` 10/10 score verified before first production send
- [ ] **DEPLOY-06**: HSTS `max-age=300` initially (NOT preload) — keeps cutover reversible
- [ ] **DEPLOY-07**: No Service Worker registered (would persist past cutover and break `marketing-app`)
- [ ] **DEPLOY-08**: `docs/cutover.md` written: verify `marketing-app` ready → CSV export → broadcast timing → atomic Vercel transfer → legacy redirects → decommission steps → rollback plan
- [ ] **DEPLOY-09**: Cutover dry-run executed on a staging subdomain before launch

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Social Proof

- **V2-01**: Live signup counter, gated to render only when audience ≥50 contacts, floored to nearest 50 ("Join 200+ others"). Server Component reads cached count, revalidate 60s.

### Engagement

- **V2-02**: Periodic "build progress" update emails to keep waitlist warm pre-launch
- **V2-03**: Referral mechanics ("invite friends to skip the line")
- **V2-04**: Email typo auto-correction (e.g., `gmial.com` → `gmail.com` suggestion)

### Optimization

- **V2-05**: A/B testing infrastructure (variant copy on hero, CTA, sub-headline)
- **V2-06**: Internationalization / multi-locale support
- **V2-07**: Cloudflare Turnstile as Layer 4 spam defense (added only if signal-driven thresholds documented in research SUMMARY.md fire)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| App functionality (dashboard, coach, generation) | This is a landing page, not the product |
| Authentication / login flows | No accounts pre-launch; everything happens via Resend Audience subscription |
| Pricing page | Deferred to `marketing-app` post-launch; pricing is not finalized publicly |
| Hero screenshots, product walkthrough, demo video | No screenshot/demo material exists yet, and minimal pages convert higher |
| Blog / guides / resource center | Owned by `marketing-app`'s Phase 18 roadmap, not this repo |
| Onboarding flow | No app to onboard into |
| Pricing teaser / "From $X/mo" hint | Resend cancellations spike when pre-launch pricing changes; pricing belongs to launch |
| Double opt-in confirmation flow | Industry standard for waitlists is single opt-in; lower friction → higher conversion; cleaner if needed later |
| Cookie consent banner / GDPR cookie modal | Achieved by *not* setting non-essential cookies — banners measurably tank conversion (30-50%) |
| Cloudflare Turnstile / hCaptcha / reCAPTCHA in v1 | Depresses conversion 1-5pts on mobile; honeypot+rate-limit catches >95% of abuse at zero friction |
| GA4 / PostHog / Meta Pixel / GTM | Cookie-bearing trackers force a banner; Vercel Analytics suffices for the only metric we need (conversion rate) |
| Proprietary database (Postgres/Supabase) for waitlist storage | Resend Audiences + CSV export satisfies portability; an additional DB introduces migration cost at cutover for zero v1 benefit |
| Exit-intent popups, fake countdown timers, fake testimonials, autoplay video, embedded chatbot | Anti-features documented in research FEATURES.md; trust-eroding on a brand-led landing page |
| Internationalization | English only for v1 |
| Service Workers / offline support | Persists past cutover and breaks `marketing-app` takeover |
| HSTS preload | Permanent commitment; cutover must remain reversible during the swap window |
| Pricing tiers, feature comparison, sales copy | All deferred to `marketing-app`'s Phase 17 (Landing Page & Legal Pages) post-launch |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Pending |
| INFRA-02 | Phase 1 | Pending |
| INFRA-03 | Phase 1 | Pending |
| INFRA-04 | Phase 1 | Pending |
| INFRA-05 | Phase 1 | Pending |
| INFRA-06 | Phase 1 | Complete |
| INFRA-07 | Phase 1 | Pending |
| INFRA-08 | Phase 1 | Pending |
| HERO-01 | Phase 2 | Pending |
| HERO-02 | Phase 2 | Pending |
| HERO-03 | Phase 2 | Pending |
| HERO-04 | Phase 2 | Pending |
| HERO-05 | Phase 2 | Pending |
| HERO-06 | Phase 2 | Pending |
| HERO-07 | Phase 2 | Pending |
| MOB-01 | Phase 2 | Pending |
| MOB-02 | Phase 2 | Pending |
| MOB-03 | Phase 2 | Pending |
| MOB-04 | Phase 2 | Pending |
| FOLD-01 | Phase 2 | Pending |
| FOLD-02 | Phase 2 | Pending |
| FOLD-03 | Phase 2 | Pending |
| FOLD-04 | Phase 2 | Pending |
| PERF-01 | Phase 2 | Pending |
| PERF-02 | Phase 2 | Pending |
| PERF-03 | Phase 2 | Pending |
| FORM-01 | Phase 3 | Pending |
| FORM-02 | Phase 3 | Pending |
| FORM-03 | Phase 3 | Pending |
| FORM-04 | Phase 3 | Pending |
| FORM-05 | Phase 3 | Pending |
| FORM-06 | Phase 3 | Pending |
| FORM-07 | Phase 3 | Pending |
| FORM-08 | Phase 3 | Pending |
| FORM-09 | Phase 3 | Pending |
| POST-01 | Phase 3 | Pending |
| POST-02 | Phase 3 | Pending |
| POST-03 | Phase 3 | Pending |
| POST-04 | Phase 3 | Pending |
| SPAM-01 | Phase 3 | Pending |
| SPAM-02 | Phase 3 | Pending |
| EMAIL-01 | Phase 4 | Pending |
| EMAIL-02 | Phase 4 | Pending |
| EMAIL-03 | Phase 4 | Pending |
| EMAIL-04 | Phase 4 | Pending |
| EMAIL-05 | Phase 4 | Pending |
| EMAIL-06 | Phase 4 | Pending |
| EMAIL-07 | Phase 4 | Pending |
| EMAIL-08 | Phase 4 | Pending |
| EMAIL-09 | Phase 4 | Pending |
| STORE-01 | Phase 4 | Pending |
| STORE-02 | Phase 4 | Pending |
| STORE-03 | Phase 4 | Pending |
| STORE-04 | Phase 4 | Pending |
| STORE-05 | Phase 4 | Pending |
| SPAM-03 | Phase 4 | Pending |
| SPAM-04 | Phase 4 | Pending |
| LEGAL-01 | Phase 5 | Pending |
| LEGAL-02 | Phase 5 | Pending |
| LEGAL-03 | Phase 5 | Pending |
| LEGAL-04 | Phase 5 | Pending |
| LEGAL-05 | Phase 5 | Pending |
| LEGAL-06 | Phase 5 | Pending |
| LEGAL-07 | Phase 5 | Pending |
| LEGAL-08 | Phase 5 | Pending |
| SEO-01 | Phase 5 | Pending |
| SEO-02 | Phase 5 | Pending |
| SEO-03 | Phase 5 | Pending |
| SEO-04 | Phase 5 | Pending |
| SEO-05 | Phase 5 | Pending |
| SEO-06 | Phase 5 | Pending |
| SEO-07 | Phase 5 | Pending |
| SEO-08 | Phase 5 | Pending |
| ANLY-01 | Phase 5 | Pending |
| ANLY-02 | Phase 5 | Pending |
| ANLY-03 | Phase 5 | Pending |
| ANLY-04 | Phase 5 | Pending |
| ANLY-05 | Phase 5 | Pending |
| ANLY-06 | Phase 5 | Pending |
| DEPLOY-01 | Phase 6 | Pending |
| DEPLOY-02 | Phase 6 | Pending |
| DEPLOY-03 | Phase 6 | Pending |
| DEPLOY-04 | Phase 6 | Pending |
| DEPLOY-05 | Phase 6 | Pending |
| DEPLOY-06 | Phase 6 | Pending |
| DEPLOY-07 | Phase 6 | Pending |
| DEPLOY-08 | Phase 6 | Pending |
| DEPLOY-09 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 88 total
- Mapped to phases: 88 (100%)
- Unmapped: 0

---
*Requirements defined: 2026-04-27*
*Last updated: 2026-04-27 after roadmap creation (88/88 mapped to 6 phases)*
