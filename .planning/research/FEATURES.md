# Feature Research

**Domain:** SaaS pre-launch waitlist landing page (single-screen, email capture only)
**Researched:** 2026-04-27
**Confidence:** HIGH (waitlist patterns are well-documented; 2026 benchmarks consistent across multiple sources)

## Context Constraints

These constraints drive every feature decision below:

1. **No product screenshots, no demo, no testimonials yet** — the brand and mascot must carry the page.
2. **No prior signups** — social proof must work from a cold start.
3. **Mobile-first** — ~83% of waitlist traffic is mobile (Foundry CRO 2026, Apexure 2026).
4. **Single-screen "minimal-with-personality"** approach already approved.
5. **Pre-launch lifecycle** — page must cleanly hand off to `marketing-app` at launch.
6. **Conversion target:** ≥15% (median landing pages convert at 6.6%; single-field email forms 13–23%; top waitlists 25%+ — daydream, GenesysGrowth, Foundry CRO 2026).

## Feature Landscape

### Table Stakes (Users Expect These / Required by Law)

These cannot be skipped. Missing any of them either bounces visitors, fails legal compliance, or produces an obviously broken experience.

#### Hero / Above-the-Fold

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Benefit-led headline (not feature-led) | Visitors decide in <3 sec whether to read more; vague claims like "Revolutionary new platform" actively kill trust. Use the existing tagline "You know your business. Quibly knows how to market it." | S | Already approved tagline. Keep in Quicksand Bold per design system. |
| 1–2 sentence elaboration / sub-headline | Headline alone rarely communicates the offer; sub-head clarifies who it's for and what it does. ~15–25 words max. | S | Frame for solopreneurs/small teams; mention "strategy-first AI marketing." |
| Single primary CTA (above fold) | Multiple competing CTAs above the fold reduce conversion 2–3× (Apexure 2026). | S | Pill button per design system, 28px radius for hero. |
| Visual focal point that isn't a stock photo | Visitors expect *something* to look at; blank pages feel incomplete. With no product UI, the Quibs Q-face mascot is the right answer (illustrations work specifically when there's no product UI to show — KlientBoost, Design4Users). | S | Quibs SVG already exists (`/Users/jeff/Desktop/quibs-icons.svg`). |
| Mobile-optimized layout (single column, 16px+ body, 44px+ tap targets) | 83% mobile traffic; thumb-reachable form is non-negotiable. | M | Tailwind v4 mobile-first defaults; test at 375px. |

#### Email Capture Form

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Single email field (no name, no company, no role) | Each extra field cuts conversion measurably; single-field forms convert at 13–23% vs. multi-field 6–10%. | S | `<input type="email">` with `inputMode="email"` and `autoComplete="email"`. |
| Action-oriented button text | "Submit" / "Sign up" underperform vs. specific verbs. "Join the waitlist," "Get early access," "Reserve my spot" all outperform generic copy (Bitly, Apexure 2026). | S | Recommended: "Join the waitlist" — clearest, no overselling without product. |
| HTML5 + server-side email validation | Catches typos before submit; bad addresses pollute the list and hurt deliverability. | S | Zod schema on server; HTML5 `type="email"` on client. |
| Loading state on submit | Without it, users double-submit or assume the form broke. | S | Disable button + spinner during request. |
| Inline error messaging | Server errors with no feedback lose the user permanently. | S | Show error below field; preserve typed value. |
| Keyboard submit (Enter key works) | Power users expect it; broken Enter looks amateur. | S | Native `<form>` element handles this for free. |

#### Post-Submit Experience

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Visible success state (not silent / not generic alert) | Without it, users re-submit or doubt it worked. The form should swap to a confirmation block in place. | S | Replace form with success card; keep page structure intact. |
| Clear "what happens next" expectation | "We'll email you when Quibly launches" — silence after signup is the #1 cited waitlist mistake (Waitlister 2026, Flowjam). | S | One-line copy stating launch comms cadence. |
| Already-subscribed handled gracefully | "You're already on the list — we'll see you at launch" not "Error: duplicate." | S | Resend Audiences returns a duplicate signal; treat as success. |
| Welcome email triggered immediately | Visitors expect confirmation in their inbox within 60s; missing email = "did this work?" = unsubscribe-by-forgetting. | S | Resend transactional API on success. |

#### Welcome Email (Single Opt-In)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Sent within 60 seconds of signup | Trust signal; expectation set by every modern SaaS. | S | Trigger from API route after Audiences add succeeds. |
| Confirms waitlist spot in plain language | "You're on the list. We'll email you when Quibly launches." | S | One short paragraph; no marketing fluff. |
| One-click unsubscribe link | Required by CAN-SPAM and Gmail/Yahoo bulk-sender rules (2024+). Resend auto-injects List-Unsubscribe headers. | S | Resend handles automatically when sending to an Audience. |
| Valid physical postal address in footer | **Legally required** by CAN-SPAM; non-negotiable. | S | Use Quibly business address (or registered agent); same as `marketing-app` privacy policy. |
| Sender domain matches site | `hello@useQuibly.com` or `team@useQuibly.com`, not `noreply@resend.dev`. SPF/DKIM/DMARC pass required for inbox placement. | S | Reuse existing `marketing-app` Resend Quibly sender domain. |

#### Legal / Compliance

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Live `/privacy` page before launch | **Required** for legal email collection (CAN-SPAM postal-address rule, GDPR transparency). Without it, you cannot legally collect emails from EU/UK visitors. | M | Adapt template from `marketing-app/.planning/`. |
| Live `/terms` page before launch | Standard expectation; reduces dispute surface. | M | Adapt template. Lighter than full app terms — pre-launch only governs waitlist relationship. |
| Privacy + terms links in footer | Discoverability; signals legitimacy (Buffer, Jasper, HubSpot all do this — `marketing-app` competitor research). | S | Two links + copyright line. |
| Visible consent indication near form | "By joining, you agree to our Privacy Policy and Terms" — micro-copy under button. Clear opt-in language is the GDPR baseline (Hustler Marketing 2026). | S | Single line, smaller text, links to legal pages. |
| Explicit "no spam, unsubscribe anytime" reassurance | Reduces hesitation at the form; expected on modern SaaS waitlists. | S | Sub-line under email field or button. |

#### Spam / Bot Protection

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Honeypot field | Stops 70–95% of basic/intermediate bots with **zero user friction** and zero JS overhead (Friendly Captcha, GeeTest 2026). Resolves the "unverified bots polluting the audience" risk without a CAPTCHA banner. | S | Hidden `<input>` with off-screen positioning + `tabIndex={-1}` and `autoComplete="off"`. Reject submission if filled. |
| Server-side rate limiting per IP | Catches what honeypot misses; protects Resend API quota and prevents enumeration attacks. | M | Vercel KV or Upstash Redis sliding window (5 req/min/IP is generous). |
| Email format + disposable-domain check | Filters obvious junk before hitting Resend. Optional but cheap. | S | Zod validator + small disposable-domain list (e.g., `mailinator.com`); skip if scope-creeping. |

#### Analytics / Measurement

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Page-level visitor analytics | Cannot measure conversion rate without it. Conversion-rate target (≥15%) is meaningless without traffic + signup tracking. | S | Vercel Web Analytics — built-in, no PII, no cookie banner needed (Vercel docs). |
| Conversion event on successful signup | Required to compute conversion rate accurately (signups / unique visitors). | S | `track('signup_success')` from success state, or rely on Resend Audience growth + Vercel Analytics traffic. |
| No cookie consent banner needed | Possible *only if* analytics is cookieless. Plausible, Vercel Web Analytics, and Fathom all qualify (Plausible, Vercel docs). | S | Choosing Vercel Web Analytics avoids the banner entirely. |

#### SEO / Open Graph

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| `<title>` and `<meta name="description">` | Showed in browser tabs, search results, and link previews everywhere. | S | "Quibly — Strategy-first AI marketing for solopreneurs" / use existing tagline. |
| OG tags (og:title, og:description, og:image, og:url, og:type) | Without them, social shares produce empty/ugly previews and CTR drops materially. | S | Next.js `metadata` export. |
| Twitter Card tags (`summary_large_image`) | X/Twitter falls back to OG, but explicit Twitter tags ensure correct rendering. | S | Add alongside OG tags. |
| 1200×630 OG image with brand + tagline | Industry-standard size; works across Facebook, LinkedIn, Slack, Discord, X. | M | Static image generated once with Quibs mascot + tagline + teal/white treatment. Can use Next.js `ImageResponse` for dynamic, but static PNG is simpler. |
| `favicon.ico` + `apple-touch-icon` | Missing favicon = unprofessional in tab bar and bookmarks. | S | Quibs Q-face at 32×32, 180×180. |
| `robots.txt` allowing indexing | Without it, the page is silently invisible to Google. | S | Allow `/`; will need updating at launch handoff. |
| `sitemap.xml` (single URL) | Not strictly required for a single-page site, but cheap and signals intent. | S | Static file. |

#### Performance

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| LCP < 2.5s on mobile | Below this, bounce rate climbs sharply on mobile networks. Project constraint targets Lighthouse ≥90. | M | Self-host fonts via `next/font`, optimize Quibs SVG, no client-side framework heaviness. |
| No layout shift on form submit | CLS > 0.1 hurts both UX and SEO. | S | Reserve form area; success state same height. |
| `<noscript>` fallback message | If JS fails or is disabled, at least show contact email. | S | One-line `<noscript>` block. |

### Differentiators (Lift Conversion Noticeably / Competitive Edge)

These are the levers that move conversion from "median 6.6%" to "≥15% target." Not all are required for v1; pick the ones that reinforce the brand.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Founder-voice micro-story** (1–2 sentences) | Highest-leverage social proof when you have **zero signups, zero logos, zero testimonials**. "Authenticity beats inflation" — a founder photo + one-sentence story converts when counters and testimonials don't exist (Flowjam, Waitlister 2026). | S | One line under "Why Quibly": "Built by [name], a solopreneur who got tired of marketing busywork." Optional founder photo. |
| **Live signup counter (when threshold reached)** | "Join 247 others on the waitlist" creates FOMO and validates the offer. Strongest mobile-friendly social proof short of testimonials. **Only show once N≥50** — small numbers backfire. | M | Resend Audiences API has contact count; cache server-side, render conditionally. Hide block entirely below threshold. |
| **Mascot-led visual personality** (Quibs Q-face prominent) | Carries brand without screenshots; differentiates from generic minimalist waitlist pages. Mascots work *specifically* when there's no product UI to show. | S | Already approved. Lean in — make Quibs the hero, not a logo afterthought. |
| **Below-fold "Why Quibly" 3-line text block** | Gives curious visitors more without requiring screenshots. The three approved differentiators (Strategy-first / AI advisory board / Metrics-driven loop) communicate the wedge. Clear value prop near form lifts conversion (GetResponse, Moosend). | S | Already approved. Three short headlines + 1-line each, no icons needed; typography does the work. |
| **Specific launch-timing language** ("Launching Summer 2026" or "Launching soon — first invites go out before others") | Vague "coming soon" loses to specific framing. Sets expectations and reduces "is this dead?" doubt. | S | One line. Avoid hard date if not committed; soft-quarter is fine. |
| **Sticky form on scroll (mobile)** OR **second CTA at bottom of below-fold block** | If users scroll past the hero to read the "Why Quibly" block, they need a second chance to convert without scrolling back up. Second-CTA pattern lifts conversion 10–20% on longer pages. | S | Easier: secondary CTA at end of below-fold block. Sticky form is more complex on mobile. |
| **Pre-warmed email validation** (typo correction, e.g., "did you mean gmail.com?") | Catches `gmail.con` / `gnail.com` style typos that otherwise become bounced welcome emails. Small but measurable. | M | `mailcheck` library or similar; ~3KB. Defer if scope-tight. |
| **Optimistic success state** (success shows immediately, retries Resend in background) | Perceived performance — users see confirmation in <100ms instead of waiting for Resend round-trip. | M | Show success on client validation pass; queue server submission. Risk: if server fails, you've already said "you're on the list." Worth it only if Resend latency becomes an issue. |
| **Personalized welcome email** (pulls first part of email as greeting) | "Hey alex@..." → "Hey there!" feels less robotic than no greeting. Marginal but free with Resend templates. | S | Default to "Hey there" if parsing is awkward. |
| **`prefers-reduced-motion` and `prefers-color-scheme` respect** | Brand maturity signal; doesn't increase conversion directly but signals quality on devices where it matters. | S | CSS media queries — Tailwind v4 supports natively. |
| **Schema.org `WebSite` + `Organization` JSON-LD** | Helps Google build a knowledge panel earlier; sitelinks; brand SERP appearance. | S | Static JSON-LD `<script>` in `<head>`. |

### Anti-Features (Commonly Added, Actively Hurt Conversion or Trust)

These appear in many waitlist landing pages but should be **explicitly excluded** for Quibly's pre-launch v1.

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| **Fake countdown timer** ("Launching in 4d 12h 03m") | Looks urgent; "creates FOMO." | Modern users spot fake timers instantly; timers that reset destroy trust permanently (Waitlister 2026). If launch date isn't committed, faking it is worse than saying nothing. | "Launching soon — first invites go out before others" or specific quarter. |
| **Multi-field form** (name + email + role + company size) | "We need to qualify leads / personalize comms." | Each field cuts conversion ~10–20%. Pre-launch you don't need to qualify — you need volume. Personalize later via in-app onboarding. | Email-only. Capture role/segment data **after launch** during onboarding. |
| **Double opt-in confirmation email** ("Click to confirm subscription") | "Industry standard for email lists / GDPR safer." | Adds 30–50% drop-off between submit and actual list entry. Industry standard for **waitlists** is single opt-in (Drip, Mailchimp 2026 guidance). Clean the list later if needed. | Single opt-in. Welcome email confirms, doesn't gate. Already an approved decision. |
| **Exit-intent popup** | "Recovers 15% of lost signups." | On a single-screen page where the form is the page, exit-intent popups are redundant and read as desperate. Mobile doesn't support exit intent reliably anyway (~83% of traffic = wasted dev). | None — the form is already the focal point. |
| **Aggressive scroll-triggered popups** | "Engagement / re-engagement." | Same problem as exit-intent on a one-screen page; punished by Google's intrusive-interstitial ranking penalty on mobile. | Skip. Use the bottom CTA at end of below-fold block instead. |
| **Cookie consent banner for analytics** | "GDPR / safe by default." | Required *only* if you're using cookies for tracking. Vercel Web Analytics / Plausible don't set tracking cookies → no banner needed. Adding one anyway tanks first-impression UX. | Cookieless analytics + a sentence in `/privacy` describing what's collected. |
| **reCAPTCHA v2/v3 widget** | "Stop bots." | Adds 200–400ms JS load (hurts Lighthouse mobile score), creates GDPR compliance overhead (third-party tracking disclosure), and adds visible friction. Honeypot stops 70–95% of bots with zero of these costs. | Honeypot field + server-side rate limit. |
| **Referral / "skip the line" mechanics** | "Goes viral, doubles signups (a la Robinhood)." | Builds wrong incentive (fake-emails for referral credit), requires non-trivial backend (referral codes, position tracking, leaderboards), and rarely produces compounding growth without huge launch traffic. Defer to v2 — already explicitly out of scope. | Plain single opt-in. Add referral mechanics post-launch if conversion ≥15% but volume is the bottleneck. |
| **Embedded chatbot / Quibs widget** | "Brand consistency — Quibs is the coach in the app." | The mascot is on the page already; an embedded chatbot before the product exists has nothing to say, breaks expectations, and looks like vaporware. | Static mascot. Save chatbot for the post-launch full marketing site. |
| **Pricing teaser** ("$19/month at launch") | "Sets price expectations / qualifies leads." | Anchors price before users have value context. Pricing belongs on `/pricing` post-launch, not on a waitlist page. | Skip. Talk about the product, not the price. |
| **Feature laundry list / detailed how-it-works** | "Shows what they're getting." | Without screenshots, written feature lists feel hand-wavy and lengthen the page without converting. Three differentiator lines is the right scope. | Three-line "Why Quibly" only. |
| **Fake testimonials or AI-generated faces** | "Looks more credible." | Detected immediately, destroys trust; legally risky in some jurisdictions. | Founder-voice micro-story instead. |
| **Newsletter / blog signup mixed with waitlist** | "Builds the audience." | Confuses the offer; "waitlist" and "newsletter" are different value props. | Single offer: waitlist only. Add newsletter post-launch. |
| **Multiple CTAs above the fold** ("Join Waitlist" + "Learn More" + "See Pricing") | "Gives users options." | Decision paralysis; competing CTAs reduce primary CTA conversion 2–3×. | One pill button: "Join the waitlist." That's it. |
| **Auto-playing video / hero animation** | "More engaging / energetic." | Mobile autoplay is throttled or muted; video adds 100s of KB; distracts from form. Killer Lighthouse mobile score. | Static mascot SVG. Add subtle CSS hover/idle animation if any (cheap, charming, no perf cost). |
| **Newsletter platform branding** ("Powered by ConvertKit / Substack / Beehiiv") | Side-effect of using hosted form embeds. | Looks unprofessional on a domain you own; limited styling control; vendor lock-in. | Self-hosted form → Resend Audiences API directly. Already approved. |

## Feature Dependencies

```
Domain + DNS (useQuibly.com)
    └── Resend sender domain verified (SPF/DKIM/DMARC)
            └── Welcome email deliverability
                    └── Email capture form value prop holds

Privacy Policy + Terms pages (LIVE)
    └── Legal email collection
            └── Email capture form (cannot launch without this)

Hero (mascot + tagline + form)
    └── requires → Quibs SVG asset (exists)
    └── requires → Quicksand + Figtree fonts loaded
    └── requires → Pill button styles from design tokens

Email Capture Form
    └── requires → Honeypot (spam protection)
    └── requires → Server-side validation + rate limit
    └── requires → Resend Audiences API integration
            └── triggers → Welcome email (Resend transactional)
            └── on success → Success state UI

Success State
    └── enhances → Already-subscribed graceful handling
    └── triggers → Conversion analytics event

Live Signup Counter (differentiator)
    └── requires → Resend Audiences contact count read
    └── requires → Threshold gate (≥50 contacts before showing)
    └── conflicts with → Showing "0" or "12" (kills conversion)

OG Image (social shares)
    └── requires → Static OG PNG generated once (1200×630)
    └── requires → og:* and twitter:* meta tags
    └── enhances → Organic share traffic conversion

Below-fold "Why Quibly" block
    └── enhances → Hero (gives skimmers more without requiring screenshots)
    └── requires → Secondary CTA at end (catch scrollers)

Analytics (Vercel Web Analytics)
    └── requires → Vercel deployment
    └── enables → Conversion rate measurement
    └── enables → No cookie banner needed (cookieless)

Post-Launch Migration (off-ramp)
    └── requires → Resend Audience export (CSV)
    └── requires → Domain handoff plan to marketing-app
    └── requires → 301 strategy for any indexed paths
```

### Critical Dependency Notes

- **Privacy + Terms must ship before any email is collected.** Hard-block on launch. Single most-likely-to-be-forgotten item.
- **Resend sender domain must be verified before welcome emails fire.** Otherwise welcome emails go to spam → unsubscribe-by-disappointment. Reuse existing `marketing-app` setup; verify it points at `useQuibly.com`.
- **Honeypot must precede live launch.** Without it, scrapers will pollute the Audience within hours of going live.
- **Live signup counter is conditionally activated.** Build the threshold gate as part of v1 even if counter shows nothing — flipping it on later requires no deploy.
- **Migration off-ramp is an architectural choice, not an end-of-life feature.** Build it in from day one (Resend Audiences as source of truth, no proprietary database) so the cutover at full-app launch is a DNS swap + CSV export, not a rewrite.

## MVP Definition

### Launch With (v1) — Required for Going Live

**Hero:**
- [ ] Quibs Q-face mascot prominent
- [ ] Headline (existing tagline) + 1-sentence elaboration
- [ ] Single email field + pill CTA "Join the waitlist"
- [ ] "By joining you agree to..." micro-copy with privacy/terms links
- [ ] Mobile-first responsive (test 375px → 1440px)

**Form:**
- [ ] Single email field, single button
- [ ] HTML5 + server Zod validation
- [ ] Loading state on submit, inline error state
- [ ] Honeypot field (hidden)
- [ ] Server-side rate limit (5 req/min/IP)
- [ ] Submit to Resend Audiences (existing Quibly audience or new)

**Post-submit:**
- [ ] Success state (in-place form swap)
- [ ] Already-subscribed handled as success
- [ ] Welcome email fires within 60s with unsubscribe + postal address

**Below the fold:**
- [ ] "Why Quibly" 3-line text block (Strategy-first / AI advisory board / Metrics-driven loop)
- [ ] Secondary "Join the waitlist" CTA at end (anchor to top form)

**Legal:**
- [ ] `/privacy` page live
- [ ] `/terms` page live
- [ ] Footer with privacy + terms links + copyright

**Compliance:**
- [ ] Welcome email contains unsubscribe link (Resend auto-handles)
- [ ] Welcome email contains valid physical postal address
- [ ] Sender domain verified (SPF/DKIM/DMARC pass)

**SEO / Social:**
- [ ] Title + meta description
- [ ] OG tags (title, description, image, url, type)
- [ ] Twitter Card tags
- [ ] 1200×630 OG image (Quibs + tagline)
- [ ] Favicon + apple-touch-icon
- [ ] `robots.txt` (allow indexing)
- [ ] `sitemap.xml`

**Analytics:**
- [ ] Vercel Web Analytics enabled
- [ ] Conversion event on signup success

**Performance:**
- [ ] Lighthouse mobile ≥90 (constraint)
- [ ] Self-hosted Google fonts via `next/font`
- [ ] Optimized SVG (no embedded raster)
- [ ] `<noscript>` fallback

**Migration readiness (built-in from v1):**
- [ ] Emails live in Resend Audience (exportable to CSV any time)
- [ ] No proprietary DB → DNS swap is the cutover
- [ ] `marketing-app` deployment ready to take over `useQuibly.com` apex when full app ships

### Add After Validation (v1.x) — Activate When Trigger Met

- [ ] **Live signup counter** — activate once Audience has ≥50 contacts
- [ ] **Founder-voice micro-story** — add if v1 conversion is below target after 1 week
- [ ] **Email typo correction (mailcheck)** — add if welcome-email bounce rate >2%
- [ ] **Specific launch quarter language** — add when launch quarter is confirmed
- [ ] **`prefers-reduced-motion` polish** — if any motion is added in iteration

### Future Consideration (v2+) — Defer Until Needed

- [ ] **Referral / skip-the-line mechanics** — only if v1 hits target conversion but volume bottlenecks growth
- [ ] **A/B testing infrastructure** — already deferred in PROJECT.md; only if iteration slows
- [ ] **Localization (i18n)** — already deferred; only if non-English traffic >10%
- [ ] **Update emails to waitlist** (build/launch progress) — useful for retention but not pre-launch conversion
- [ ] **Internationalized timezone-aware launch countdown** — only if launch has a hard committed date

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Single-field email capture form | HIGH | LOW | P1 |
| Quibs mascot hero + tagline | HIGH | LOW | P1 |
| Privacy + Terms pages | HIGH (legal) | MEDIUM | P1 |
| Welcome email (single opt-in) | HIGH | LOW | P1 |
| Honeypot spam protection | MEDIUM | LOW | P1 |
| Server-side rate limit | MEDIUM | MEDIUM | P1 |
| Success state (in-place) | HIGH | LOW | P1 |
| Already-subscribed graceful handling | MEDIUM | LOW | P1 |
| OG / Twitter Card metadata | MEDIUM | LOW | P1 |
| OG image (1200×630) | MEDIUM | MEDIUM | P1 |
| Vercel Web Analytics | HIGH | LOW | P1 |
| Footer + legal links | MEDIUM | LOW | P1 |
| Mobile-first responsive | HIGH | MEDIUM | P1 |
| Below-fold "Why Quibly" block | MEDIUM | LOW | P1 |
| Secondary CTA at bottom of below-fold | MEDIUM | LOW | P1 |
| Lighthouse mobile ≥90 | HIGH | MEDIUM | P1 |
| Live signup counter (gated ≥50) | HIGH | MEDIUM | P2 |
| Founder-voice micro-story | MEDIUM | LOW | P2 |
| Email typo correction | LOW | LOW | P2 |
| Schema.org JSON-LD | LOW | LOW | P3 |
| Referral mechanics | (out of scope) | HIGH | P3 |
| A/B testing infra | (out of scope) | HIGH | P3 |

**Priority key:**
- **P1:** Must ship in v1 — required for going live or hitting conversion target
- **P2:** Activate post-launch as conditions warrant
- **P3:** Defer indefinitely unless validated need emerges

## Competitor / Reference Pattern Analysis

Modern reference patterns from 2026 waitlist landing page roundups (Flowjam, Waitlister, GetLaunchList, Magic UI):

| Pattern | Common Implementation | Quibly Approach |
|---------|----------------------|-----------------|
| Hero visual | Product screenshot in device frame | **Quibs mascot** (no product UI exists; mascot carries personality) |
| CTA copy | "Join the Waitlist" / "Get Early Access" / "Reserve My Spot" | **"Join the waitlist"** — clearest, no overpromise without a product |
| Social proof | Live counter ("Join 1,243 others") + testimonials + logos | **Founder-voice micro-story** at zero signups; **counter activates at ≥50** |
| Form | Single email field + button | **Same** — already approved |
| Below-fold | Screenshot walkthrough OR feature grid OR FAQ | **Text-only 3-line differentiator block** (no screenshots exist) |
| Spam protection | reCAPTCHA, Cloudflare Turnstile | **Honeypot + rate limit** (zero JS, zero friction, GDPR-clean) |
| Email backend | Mailchimp embed / ConvertKit / Beehiiv | **Resend Audiences direct API** (matches `marketing-app`, owns the data) |
| Analytics | Google Analytics (with cookie banner) | **Vercel Web Analytics** (cookieless, no banner needed) |
| Legal | Generic boilerplate or missing | **Customized privacy + terms** before launch (legal requirement) |

## Sources

### Conversion Benchmarks (HIGH confidence — multiple 2026 sources agree)

- [Landing Page Conversion Rate Benchmarks for SaaS — daydream](https://www.withdaydream.com/library/insights/average-landing-page-conversion-rate)
- [40 Landing Page Conversion Statistics 2026 — Genesys Growth](https://genesysgrowth.com/blog/landing-page-conversion-stats-for-marketing-leaders)
- [Landing Page Conversion Rate Benchmarks by Industry 2026 — Foundry CRO](https://foundrycro.com/blog/landing-page-conversion-rate-benchmarks-2026/)
- [Landing Page Conversion Rate Benchmarks 2026 — Apexure](https://www.apexure.com/blog/landing-page-conversion-rate-benchmarks-by-industry)
- [Landing Page Conversion Rate Benchmarks 2026 — LanderLab](https://landerlab.io/blog/landing-page-conversion-rate)

### Waitlist-Specific Patterns (HIGH confidence)

- [How to Create a Waitlist Landing Page That Converts (2026) — Waitlister](https://waitlister.me/growth-hub/guides/waitlist-landing-page-optimization-guide)
- [10 High-Converting Pre-Launch Designs — Flowjam](https://www.flowjam.com/blog/waitlist-landing-page-examples-10-high-converting-pre-launch-designs-how-to-build-yours)
- [Waitlist Landing Page Best Practices — Moosend](https://moosend.com/blog/waitlist-landing-page/)
- [How to Design a High-Converting Waitlist Landing Page — GetResponse](https://www.getresponse.com/blog/waitlist-landing-page)
- [High Converting Waitlist Landing Page Examples — Magic UI](https://magicui.design/blog/waitlist-landing-page)
- [15 Waitlist Landing Page Examples That Actually Convert (2026) — LaunchList](https://getlaunchlist.com/blog/waitlist-landing-page-examples-that-convert)
- [Waitlist Strategy — Beyond Labs](https://beyondlabs.io/blogs/how-to-build-a-waitlist-that-turns-into-customers)

### Legal / Compliance (HIGH confidence)

- [Email Marketing Compliance 2026: GDPR, CAN-SPAM — Hustler Marketing](https://www.hustlermarketing.com/email-marketing-compliance-in-2026-gdpr-can-spam-privacy-laws-explained/)
- [CAN-SPAM Act Compliance Guide — FTC](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business)
- [Email Privacy Laws & Regulations 2026 — Mailbird](https://www.getmailbird.com/email-privacy-laws-regulations-compliance/)
- [Email Compliance Guide — WPMailSMTP](https://wpmailsmtp.com/email-compliance-guide-to-can-spam-gdpr-and-more/)
- [Single vs Double Opt-In — Drip](https://www.drip.com/blog/single-opt-in-vs-double-opt-in)

### Spam Protection (HIGH confidence)

- [Honeypot CAPTCHA: An Alternative to CAPTCHA — Friendly Captcha](https://friendlycaptcha.com/insights/honeypot-captcha/)
- [CAPTCHA vs Honeypot 2026 — GeeTest](https://www.geetest.com/en/article/captcha-vs-honeypot)
- [Honeypot vs reCAPTCHA — Dataprixa](https://dataprixa.com/honeypot-captcha-vs-recaptcha/)
- [Anti-Spam Honeypots & Modern Bot Protection — DataDome](https://datadome.co/guides/captcha/honeypot/)

### Social Proof (MEDIUM confidence — patterns consistent across waitlist guides)

- [Waitlist Landing Page Examples — Flowjam](https://www.flowjam.com/blog/waitlist-landing-page-examples-10-high-converting-pre-launch-designs-how-to-build-yours)
- [What is a Waitlist Landing Page (2026) — LaunchList](https://getlaunchlist.com/blog/what-is-a-waitlist-landing-page)
- [How to Build a Waitlist that Generates Viral Buzz — Viral Loops](https://viral-loops.com/blog/how-to-build-a-waitlist/)

### OG / SEO (HIGH confidence)

- [Open Graph and Twitter Card Metadata — DigitalOcean](https://www.digitalocean.com/community/tutorials/how-to-add-twitter-card-and-open-graph-social-metadata-to-your-webpage-with-html)
- [Open Graph and X Card Optimization — Coywolf](https://coywolf.com/guides/open-graph-twitter-card-image-optimization/)
- [Ultimate Guide to Social Meta Tags — EverywhereMarketer](https://www.everywheremarketer.com/blog/ultimate-guide-to-social-meta-tags-open-graph-and-twitter-cards)

### Analytics (HIGH confidence)

- [Privacy-focused web analytics — Plausible](https://plausible.io/privacy-focused-web-analytics)
- [Privacy-First Analytics Alternatives 2026 — LegalForge](https://www.legal-forge.com/en/blog/privacy-first-analytics-alternatives-2026/)
- [9 Best GDPR-Compliant Analytics Tools — PostHog](https://posthog.com/blog/best-gdpr-compliant-analytics-tools)

### Resend (HIGH confidence — official docs)

- [Resend Audiences Introduction](https://resend.com/docs/dashboard/audiences/introduction)
- [Manage subscribers with Resend Audiences — Resend Blog](https://resend.com/blog/manage-subscribers-using-resend-audiences)

### Thank You Page / Post-Submit (HIGH confidence)

- [Thank You Page Examples 2026 — Apexure](https://www.apexure.com/blog/thank-you-page-after-form-submission-examples)
- [5 Thank You Pages Examples — Unbounce](https://unbounce.com/conversion-rate-optimization/thank-you-pages/)

### CTA Copy (MEDIUM confidence — A/B test data exists but not published per-phrase)

- [Landing Page CTA Button Best Practices — Bitly](https://bitly.com/blog/cta-button-best-practices-for-landing-pages/)
- [Landing Page CTA Button: 15 Tips That Convert (2026) — Apexure](https://www.apexure.com/blog/landing-page-call-to-action-button-tips)

---
*Feature research for: SaaS pre-launch waitlist landing page (Quibly)*
*Researched: 2026-04-27*
