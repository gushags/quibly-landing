# Zeremi Landing

## What This Is

A pre-launch waitlist landing page for **Quibly** (strategy-first AI marketing for solopreneurs and small teams) at `useQuibly.com`. A single-screen page that introduces the brand and captures email addresses from people who want to be notified when the app launches. It replaces the full `marketing-app` landing page during the pre-launch window; once Quibly ships, the full marketing site at `marketing-app` takes over the domain.

## Core Value

Convert visitors who land at `useQuibly.com` into a list of warm, opted-in waitlist contacts that can be notified when Quibly launches — without needing product screenshots, demos, or full marketing copy that don't exist yet.

## Requirements

### Validated

- [x] Reuse Quibly design tokens from `marketing-app`: teal (`#0D9488`) + amber (`#F59E0B`), Quicksand (headings) + Figtree (body), pill button radii (24px / 28px hero) — *Validated in Phase 2: tokens applied across every section; 28px hero pill verified at runtime by Playwright regression guard*
- [x] Quibs Q-face mascot prominent on hero (carries personality without screenshots) — *Validated in Phase 2: 88×88 teal-gradient HeroMascot wrapper on hero, DOM-second after H1 to preserve LCP-as-H1*
- [x] Below-the-fold "Why Quibly" section: 3 short text-only differentiator lines pulled from existing brand (Strategy-first / AI advisory board / Metrics-driven loop) — no screenshots needed — *Validated in Phase 2: 3-column FOLD-01 differentiator block shipped*
- [x] Mobile-first responsive layout (~83% of waitlist traffic is mobile) — *Validated in Phase 2 for the marketing surface: 320×568 above-fold composition tested via Playwright; Lighthouse mobile perf 0.96 / CLS 0 / LCP element = `<h1>`*
- [x] Single-screen waitlist hero (Quibs Q-face mascot, tagline, 1–2 sentence elaboration, email field, pill CTA) — *Validated in Phase 3: email field + pill CTA wired into a section below the hero; Hero/Secondary CTAs flipped from disabled placeholders to anchors targeting `#waitlist`*
- [x] Email-only capture form (one field — single-field forms convert ~2–3× higher than multi-field) — *Validated in Phase 3: `<WaitlistForm>` Client Component with single `email` field, `useActionState`-bound to a Server Action with Zod 4 validation; 14 unit tests + 12 form e2e + 1 no-JS spec all green*
- [x] Graceful "thanks, you're on the list" success state (handles already-subscribed gracefully) — *Validated in Phase 3 against a stub Server Action: in-place success block (POST-01), verbatim copy (POST-02), three-layer enumeration defense for duplicates (POST-03), idempotent retry (POST-04). Resend wiring lands in Phase 4.*
- [x] Spam / bot protection on the form (rate-limit or hidden honeypot — simplest viable) — *Validated in Phase 3 (honeypot SPAM-01 + time-trap SPAM-02). Phase 4 added the second tier: 5/min/IP + 50/day/IP Upstash rate-limit (SPAM-03) and a 25-entry disposable-domain blocklist (SPAM-04), both silent-rejection. UAT Tests 5+6 passed: mailinator silently rejected, 6th burst-rejected.*
- [x] Submit emails to Resend Audience (matches `marketing-app` stack) — *Validated in Phase 4: `app/actions/join-waitlist.ts` writes via `resend.contacts.create({ audienceId, email, properties: { consent_version } })` to "Quibly Waitlist" production audience; consent_version tagged with the privacy-policy git SHA. UAT Test 1 confirmed audience row creation. CSV export round-trip working via shipped per-contact GET workaround (`npm run export:audience`).*
- [x] Single opt-in: capture email → success state → automatic welcome email confirming waitlist spot — *Validated in Phase 4: deliverability-correct welcome email from `Quibly <hello@usequibly.com>` with both List-Unsubscribe + List-Unsubscribe-Post one-click headers, DKIM coverage of both, body-link unsubscribe round-trip flips contact in Resend. Mail-tester score: 10/10. Verified empirically in Gmail; Outlook/iCloud spot-check tracked in 04-HUMAN-UAT for pre-launch.*

### Active

- [ ] Live signup counter / "N people on the waitlist" social proof (once signups exist)
- [ ] Footer with privacy policy + terms links
- [ ] Privacy policy and terms pages (legal compliance for email collection — required before going live)
- [ ] Deploy at `useQuibly.com` on Vercel
- [ ] Basic page-level analytics (visits + conversion rate)
- [ ] Open Graph / metadata for social sharing

### Out of Scope

- App functionality, dashboard, coach, generation — *this is a landing page only*
- Authentication / login flows — no accounts pre-launch
- Pricing page — defer to full `marketing-app` post-launch
- Full landing-page sections (hero screenshots, walkthrough, FAQ) — no screenshot/demo material exists yet, and minimal pages convert higher
- Blog and guides — handled by `marketing-app` post-launch
- Onboarding flow — no app to onboard into
- Referral / "invite friends to skip the line" mechanics — defer to v2 if early conversion is below target
- A/B testing infrastructure — defer; brand is consistent enough that single-variant ships first
- Double opt-in — industry standard for waitlists is single opt-in (lower friction, can clean later)
- Internationalization — English only for v1
- Cookie consent banner beyond what's legally required (no marketing cookies → minimal banner)

## Context

- **Quibly brand is already fully established** in the `marketing-app` repo (`/Users/jeff/repos/marketing-app`) — design system, fonts, color tokens, mascot SVG, tone of voice, tagline, target audience, privacy/terms templates all exist and should be reused, not re-invented.
- The full Quibly marketing site (hero with screenshots, differentiators, pricing, FAQ, blog, guides) is *planned* in `marketing-app/.planning/` (Phases 16–18) but cannot ship yet because the product itself isn't launched and screenshots/demo material don't exist.
- This separate `quibly-landing` repo exists so the public-facing pre-launch page can ship and iterate independently from the full app codebase, on its own deployment lifecycle.
- **Tagline (existing):** "You know your business. Quibly knows how to market it."
- **Audience:** Solopreneurs and small-team operators who are experts at what they build/sell but not at marketing.
- **Tone:** Conversational, modern, friendly, confident — playful and energetic, "upstart" not corporate.
- **Key brand assets to pull from `marketing-app`:**
  - `lib/brands/quibly.ts` — brand ID and reference
  - `app/globals.css` — design tokens (oklch primary `0.6002 0.1038 184.704` ≈ teal `#0D9488`, radius scale, font CSS variables)
  - Quibs Q-face SVG (referenced in design spec at `/Users/jeff/Desktop/quibs-icons.svg`, viewBox `0 0 223 263`)
  - `docs/superpowers/specs/2026-04-14-quibly-design-system.md` — full design contract
  - `docs/superpowers/specs/2026-04-14-quibly-design-reference.html` — visual mockup reference
- **Conversion benchmarks (2026):** median landing page = 6.6%, single-field email forms = 13–23%, top waitlists = 25%+. Target: ≥15% for v1 (single-field, mobile-first, brand-aligned).

## Constraints

- **Tech stack**: Next.js 16+ on the App Router (matches `marketing-app`'s Next 16.2.1 / React 19.2.4 baseline). TypeScript. Tailwind v4 with shadcn/ui tokens — same as `marketing-app` so design tokens transfer cleanly.
- **Email infrastructure**: Resend (Audiences API for storage, transactional API for welcome email). Reuse the existing `marketing-app` Resend account and Quibly sender domain.
- **Domain**: `useQuibly.com` apex (production). Once the full app ships, this repo's deployment must be cleanly replaceable by `marketing-app`'s deployment at the same domain.
- **Hosting**: Vercel.
- **Legal**: Email collection requires a published privacy policy + terms before going live (CAN-SPAM, GDPR-friendly minimum). Welcome email must include unsubscribe / mailto contact.
- **Performance**: Landing page must hit Lighthouse mobile performance ≥90 (mobile traffic is the majority).
- **Lifecycle**: Pre-launch only. When `marketing-app` launches at `useQuibly.com`, captured emails must be exportable / portable so the waitlist can be migrated cleanly.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Separate `quibly-landing` repo (vs. shipping a `pre-launch` route inside `marketing-app`) | Independent deployment lifecycle; can iterate without touching the full app codebase; smaller surface area to deploy and secure | — Pending |
| Replaces `marketing-app` landing page pre-launch (single tenant on `useQuibly.com`) | Avoids duplicate domains; clean cutover at launch | — Pending |
| Minimal-with-personality (vs. bare email box or feature-detailed) | No screenshots/demos exist yet; brand assets carry the weight; minimal forms convert higher in 2026 benchmarks | — Pending |
| Resend Audiences for email storage (vs. Supabase, ConvertKit, Mailchimp) | Already used by `marketing-app`; one account, one sender domain; transactional + audience API in one product | — Pending |
| Single opt-in (vs. double opt-in) | Industry standard for waitlists; lower friction → higher conversion; clean the list later if needed | — Pending |
| Below-the-fold "Why Quibly" text-only block (vs. nothing, or full screenshot section) | Gives curious visitors more before they commit, without requiring screenshot assets that don't exist | — Pending |
| Live signup counter as social proof (only when signups > some threshold) | Strongest mobile-friendly form of social proof short of testimonials; no logos / press exist yet | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-29 after Phase 4 (resend-wiring-bot-protection-welcome-email) completed — live Resend audience write-path with consent_version git-SHA tagging, deliverability-correct welcome email (mail-tester 10/10, DKIM covers both List-Unsubscribe headers), layered abuse defenses (honeypot + time-trap from Phase 3, plus rate-limit + disposable-domain blocklist), webhook-driven bounce/complaint suppression, body-link + RFC-8058 one-click unsubscribe both wired and audience-scoped. 8/8 plans executed; Plan 04-08 closed two UAT-discovered gaps (defensive 4-source siteUrl fallback chain, GET-handler addition for body-link UX). Code review: 4/4 critical + 4/7 warning fixed; 3 warnings deferred with rationale. Two human-UAT items tracked for Phase 6 launch gate: real non-home postal address (Plan 04-07 Task 3 deferred) and Outlook/iCloud inbox spot-check (Plan 04-07 Task 5 founder-approved Gmail-only). 74/74 unit tests green.*
