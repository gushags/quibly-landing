# Pitfalls Research

**Domain:** SaaS pre-launch waitlist landing page (Next.js 16 + Tailwind v4 + Resend Audiences + Vercel)
**Researched:** 2026-04-27
**Confidence:** HIGH (deliverability, legal, Resend specifics verified against official sources; design pitfalls verified across multiple 2026 conversion-data sources)

This catalogues the specific failure modes that wreck waitlist landing pages built on this stack. Each pitfall is scoped to **conversion**, **deliverability**, **legal posture**, **launch hygiene**, or **migration** — i.e. risks that are existential for a pre-launch waitlist whose only KPI is "list of warm contacts at launch day."

The defining property of this project is that **the list itself is the deliverable**. Anything that poisons, leaks, or strands the list is a critical pitfall. Anything that suppresses signups (form friction, slow LCP, blocking consent UI) is a major pitfall. Anything that breaks the cutover to `marketing-app` later is a critical pitfall.

---

## Critical Pitfalls

### Pitfall 1: Welcome email ships without `List-Unsubscribe` + `List-Unsubscribe-Post` headers

**What goes wrong:**
The waitlist welcome email is sent via Resend's transactional API and reaches Gmail/Yahoo without one-click unsubscribe headers. As soon as the list crosses ~5,000 sends/day at launch (a realistic spike when the "we're live" announcement goes out), Gmail starts rejecting messages outright — not spam-foldering, **bouncing at the SMTP level with 550 errors**. The launch announcement reaches a fraction of the list, and the rest get permanent bounces that further damage sender reputation.

**Why it happens:**
Developers treat the welcome email as "transactional" and assume bulk-sender rules don't apply. They do — Gmail/Yahoo's February 2024 rules + the November 2025 enforcement update apply to **any** domain sending ≥5,000/day to Gmail addresses, *regardless of message classification*. RFC 8058 one-click is required for promotional messaging, and a "thanks for joining the waitlist, here's what's coming" email is promotional even if it's triggered by an action. Worse: the launch announcement broadcast from the same domain is unambiguously bulk marketing and inherits the reputation damage.

**How to avoid:**
- Welcome email MUST include both headers from day one:
  - `List-Unsubscribe: <https://useQuibly.com/unsubscribe?t=TOKEN>, <mailto:unsubscribe@useQuibly.com>`
  - `List-Unsubscribe-Post: List-Unsubscribe=One-Click`
- The HTTPS endpoint must accept `POST` and process the unsubscribe within 48 hours (sync removal from Resend Audience is fine).
- DKIM signature must cover both headers (Resend handles this if domain is verified — verify in DNS).
- Use Resend's Broadcasts feature for the launch announcement (it sets these headers automatically); do NOT roll your own marketing send.
- Treat the welcome email and the launch broadcast as the **same** deliverability surface — both flow through the same DKIM key and reputation.

**Warning signs:**
- Welcome email source has only `List-Unsubscribe: <mailto:...>` and no `-Post` header.
- Manually constructing emails via `resend.emails.send()` rather than letting Broadcasts handle headers.
- "We'll add unsubscribe later" in the roadmap.
- DMARC policy at `p=none` and never reviewed (means failures are silently accepted).

**Phase to address:** Email infrastructure phase (before any send goes out). Headers must be in the very first welcome email rendered, before the form is wired to production.

**Severity:** **CRITICAL** — list becomes undeliverable at the exact moment it matters most (launch).

---

### Pitfall 2: Sender domain ships without proper SPF/DKIM/DMARC alignment

**What goes wrong:**
`useQuibly.com` is configured in Resend but DNS is incomplete or misaligned: DKIM record present but SPF missing the Resend `include`, or `From: noreply@useQuibly.com` while DKIM signs as `useQuibly.com` but SPF authorizes only `mail.useQuibly.com`. Result: DMARC alignment fails. Gmail rejects, Yahoo rejects, and inboxed recipients see a "this email may be a spoof" banner. Bounce rate spikes, and the domain's reputation enters a hole that takes weeks to climb out of.

**Why it happens:**
Resend's onboarding shows DKIM and Return-Path records prominently, but SPF for the apex (or aligned subdomain) and DMARC are easy to skip — especially if the domain is brand-new. Developers verify "DKIM passed" in a test send and ship. The real test is `From:` alignment with the domain DKIM signs, which only fails when sending volume picks up and Gmail starts enforcing.

**How to avoid:**
- Required DNS records on `useQuibly.com` before the first production send:
  - **SPF:** `v=spf1 include:amazonses.com ~all` (Resend uses Amazon SES infrastructure; check the exact `include:` value in the Resend domain page — it can be `_spf.resend.com`)
  - **DKIM:** the CNAME records Resend provides (typically 3 records: `resend._domainkey`, `resend2._domainkey`, etc.)
  - **DMARC:** `v=DMARC1; p=none; rua=mailto:dmarc@useQuibly.com; aspf=r; adkim=r;` to start (relaxed alignment, monitoring only). Tighten to `p=quarantine` after 30 days of clean reports.
  - **MX (for List-Unsubscribe mailto):** point `unsubscribe@useQuibly.com` to a real inbox or Resend's inbound parsing.
- Use a sender identity that aligns: `From: hello@useQuibly.com` (root domain) — do NOT send from `noreply@em.useQuibly.com` while DKIM signs `useQuibly.com`.
- Verify alignment with `mail-tester.com` before shipping and after every DNS change. Target score 10/10.
- Set up the DMARC `rua` mailbox **before** going live — first week of reports surfaces every misalignment.

**Warning signs:**
- Resend domain status shows green but `mail-tester` shows DMARC fail.
- Test email's source headers show `dkim=pass` but `dmarc=fail` (the giveaway is alignment).
- No `_dmarc` TXT record at all.
- DMARC `rua` going to a mailbox no one reads.

**Phase to address:** Pre-deploy infrastructure phase. DNS must be propagated and aligned before the form accepts a single live email. Block deploy on a passing `mail-tester.com` score.

**Severity:** **CRITICAL** — undermines every email sent and silently destroys list value.

---

### Pitfall 3: No bot protection → list is poisoned before launch

**What goes wrong:**
Form ships with no rate limiting and no honeypot. Within hours of indexing, automated scrapers and form-spammers start submitting:
- **Mailbomb-as-a-service** abuse: attackers submit a target's real email to dozens of waitlists to drown a victim's inbox; the victim then reports `useQuibly.com` as spam.
- **Random injected emails:** `aaa@aaa.com`, `test@test.com`, valid-syntax-but-fake addresses that bounce hard at launch.
- **Disposable domains:** `mailinator.com`, `guerrillamail.com`, `10minutemail.com` flooding the audience.

By launch the audience contains a high percentage of poisoned, bouncing, or hostile addresses. The launch broadcast hits Gmail with a high bounce rate and a high spam-complaint rate, **flips Gmail's bulk-sender threshold (>0.3% complaints)**, and the domain is permanently classified as a spammer.

**Why it happens:**
Single-field forms are the easiest target on the internet. The PROJECT.md spec says "rate-limit OR hidden honeypot — simplest viable" — and "OR" is the trap. Honeypot alone catches naive bots; rate-limit alone catches volume bots; sophisticated form-spammers defeat both individually. And there's no validation step that catches mailbomb abuse (where the email itself is real, just unconsented).

**How to avoid:**
Layer four cheap defenses, not one:
1. **Honeypot field** — a `<input name="company_website" tabindex="-1" autocomplete="off">` hidden via CSS (NOT `type="hidden"`, which is now bot-detected). Reject on submit if filled.
2. **Time-trap** — record form-render timestamp in a signed cookie or hidden field; reject submissions <2s old (humans don't fill forms that fast).
3. **Rate limit** — Upstash Redis sliding window: 5 submissions per IP per 10 minutes, 50 per IP per day. Use `@upstash/ratelimit` with the request IP from `headers().get('x-forwarded-for')`.
4. **Disposable-domain blocklist** — a small static list of the top 50 disposable domains; reject silently (200 OK with "thanks!" so bots don't iterate). Update from `disposable-email-domains` package quarterly.
5. **Optional: Cloudflare Turnstile** — only if 1–4 prove insufficient. Turnstile is the lowest-friction CAPTCHA but **breaks on devices with privacy extensions, on browsers with strict tracking protection, and on mobile emulators**. Add only when bot signal warrants the conversion cost.

**Warning signs:**
- Audience growth chart shows a vertical spike inconsistent with traffic.
- High proportion of emails from `@*.ru`, `@*.cn`, or unfamiliar TLDs.
- Same IP submitting 100+ different emails (sign of mailbomb abuse — those emails are real victims).
- Resend dashboard shows bounce rate >2% on welcome emails.

**Phase to address:** Form implementation phase. All four layers ship together with the form's first deploy — adding them later means cleaning a poisoned audience, which is hard.

**Severity:** **CRITICAL** — directly causes the launch-day deliverability collapse described in Pitfalls 1 and 2.

---

### Pitfall 4: `RESEND_API_KEY` exposed via `NEXT_PUBLIC_` or client-side fetch

**What goes wrong:**
The API key is prefixed `NEXT_PUBLIC_` (or referenced from a Client Component), Next.js bundles it into the browser JavaScript, and within hours of indexing it's harvested by a key-scanner. Attackers use the key to:
- Send spam from `useQuibly.com` (destroying domain reputation).
- Read the entire audience (all opt-in emails are now leaked — **this is a GDPR Article 33 reportable breach**).
- Delete the audience entirely.

**Why it happens:**
Next.js App Router's developer ergonomics blur the client/server line. Server Actions look like client code. A junior dev adds `'use client'` to a form and pulls in `import { Resend } from 'resend'` to "make it simpler." Or someone builds an `/api/subscribe` route but tests with a bookmarklet that exposes the key in localStorage during dev. Or a `.env.local` with the live key gets committed.

**How to avoid:**
- The API key lives ONLY in Vercel environment variables, NEVER prefixed `NEXT_PUBLIC_`.
- The Resend SDK is imported ONLY in: (a) Server Actions, (b) Route Handlers (`app/api/*/route.ts`), (c) Server Components. Audit with grep before shipping: `rg "from ['\"]resend['\"]"` should return only files with `'use server'` or in `app/api/`.
- Use Resend's **restricted API key** with "Sending access" only, scoped to `useQuibly.com`. The form submission needs `audiences:contacts:create` and `emails:send` — nothing else. Create a separate full-access key for migration/admin work, never deploy it.
- Store the audience ID in env (`RESEND_AUDIENCE_ID=...`) so it's not hard-coded in source.
- Add a pre-commit hook (`gitleaks` or `trufflehog`) that blocks commits containing `re_*` patterns (Resend keys start with `re_`).
- Add `.env*` to `.gitignore` (and `.env.local` is git-ignored by Next.js's default — verify).

**Warning signs:**
- `NEXT_PUBLIC_RESEND_API_KEY` anywhere in the codebase.
- `import { Resend }` in a file with `'use client'` directive.
- API key visible in Vercel build logs (Vercel masks `*_KEY` and `*_SECRET` patterns; renaming to `RESEND_TOKEN` would expose it).
- Form submission visible in the browser Network tab making a request directly to `api.resend.com`.

**Phase to address:** Form implementation phase, hard gate. Pre-deploy checklist must include "grep audit + restricted key verified."

**Severity:** **CRITICAL** — opt-in PII leak is a regulatory breach under GDPR (CNIL has issued €20M+ fines for less). Also wrecks domain reputation if exploited.

---

### Pitfall 5: Captured emails are stored ONLY in Resend, with no migration path

**What goes wrong:**
Every signup goes straight to Resend Audiences. Six months later, `marketing-app` launches and needs to:
- Move the list to a richer ESP for sequences (Postmark, Loops, Mailchimp).
- Cross-reference signups with sign-ups in the actual app.
- Run analytics on signup-to-conversion.
- Honor a GDPR Article 15 access request or Article 17 deletion request.

But Resend's data model is thin: email + first/last name + a few custom fields. Signup timestamp, source UTM, IP, user-agent, consent text version — all are either missing or live ONLY in the welcome email's `X-` headers. Export-as-CSV is in beta and rate-limited. The audience is functionally trapped.

**Why it happens:**
Resend Audiences is fast to integrate — `resend.contacts.create({ email, audienceId })` is one line — and skipping a database feels like "shipping faster." But the implicit assumption is that Resend is the source of truth. It isn't, because Resend doesn't store the consent metadata GDPR requires (when, how, what they agreed to) or the analytics fields needed for migration.

**How to avoid:**
- **Dual-write from day one**: every signup goes to BOTH Resend Audiences AND a row in a primary store. Recommended: Vercel Postgres (Neon) or Supabase — same Vercel workflow, ~free at this scale.
- Required columns in the primary store:
  - `id`, `email` (unique, lowercased)
  - `created_at`, `ip_address` (for fraud forensics; keep ≤30 days then null per GDPR data minimization)
  - `user_agent`, `referrer`, `utm_source`, `utm_medium`, `utm_campaign`
  - `consent_text_version` (string ID like `"2026-04-v1"`) and `consent_text_snapshot` (the actual privacy text shown at signup)
  - `resend_contact_id` (returned by Resend; lets us reconcile)
  - `unsubscribed_at` (nullable; sync from Resend webhook)
  - `source` (string — `"waitlist-landing"` so post-cutover the row is identifiable)
- If dual-writing feels heavy, the absolute minimum is a daily cron that exports Resend CSV → S3/Vercel Blob with versioning. But this is fragile; prefer the DB.
- Document the migration runbook BEFORE launch: how to dump → import into the next ESP → map fields → preserve unsubscribe state.
- On the cutover, the `marketing-app` deployment reads the same database — emails don't need to "migrate," they're already in the canonical store.

**Warning signs:**
- Schema diagram has no `subscribers` / `waitlist_signups` table.
- All signup logic is `await resend.contacts.create(...)` with no preceding DB write.
- "We'll export from Resend when we need to" in design notes.
- No record of *what* the user consented to (only that they did).

**Phase to address:** Backend infrastructure phase, before form goes live. Dual-write must be the very first version of the submit handler — retrofitting is painful because you can't reconstruct timestamps for already-captured emails.

**Severity:** **CRITICAL** — failure to migrate cleanly is the literal end-state failure mode of this project per PROJECT.md constraints.

---

### Pitfall 6: Apex domain cutover from `quibly-landing` to `marketing-app` breaks DNS or sessions

**What goes wrong:**
On launch day, `useQuibly.com` is supposed to switch from this repo's Vercel deployment to `marketing-app`'s Vercel deployment. Without coordination:
- Both Vercel projects fight for the apex domain (Vercel allows only one) — DNS propagation goes sideways for hours.
- `_dmarc`, SPF, and DKIM TXT records are scoped to the domain, not a project, so changing the apex project doesn't reset them — but if `marketing-app` adds *its own* Resend DNS records to a *different* sender domain, the records collide.
- Edge config or middleware on the old project keeps responding to stale traffic.
- Browsers cache HSTS, Service Workers, or the favicon for hours, showing the wrong page.
- Old `og:image` URLs (`useQuibly.com/og.png`) 404 on social sites that already cached the link, breaking re-shares of the launch announcement.

**Why it happens:**
Two Vercel projects + one apex + a Resend domain that was bound to this repo's "team" creates a tangle. The cutover is treated as "delete one project, add another," which is correct but has a 1-hour window of disaster.

**How to avoid:**
- **Domain assignment lives at the Vercel team level, not the project level.** Both projects are in the same team. The cutover is `vercel domains transfer useQuibly.com` between projects — this is a single atomic operation.
- **Resend domain stays put.** The Resend domain `useQuibly.com` is bound to the *team*, not this repo. `marketing-app` uses the same Resend domain after cutover — DKIM keys and DMARC records survive. **Do NOT delete the Resend domain on tear-down.**
- **Plan the cutover at low-traffic time** (e.g. 03:00 ET on a Tuesday). Pre-deploy `marketing-app` to a preview URL, smoke-test, then flip.
- **Keep this repo's deployment alive on a backup subdomain** (`waitlist.useQuibly.com` or `archive.useQuibly.com`) for 30 days post-cutover so DNS hiccups have a fallback.
- **Don't ship a Service Worker** from this landing page (it's a single-screen page; SW gives nothing and can serve stale shells for days after cutover).
- **Don't enable HSTS preload** until `marketing-app` is the long-term tenant — once preloaded, you cannot serve HTTP for testing. Use `Strict-Transport-Security: max-age=300` initially, ramp later.
- **Maintain `og:image` URL stability**: `marketing-app` must serve the same `/og.png` path (or 301 it), or pre-coordinate that the launch announcement uses an image hosted on a CDN that survives the cutover.

**Warning signs:**
- This repo's Vercel project owns the Resend domain (it should be team-owned).
- Service Worker registered (check `app/sw.ts` or `next.config.js`).
- HSTS preload enabled in `next.config.js` (`Strict-Transport-Security` with `preload`).
- No documented cutover runbook in the repo.

**Phase to address:** Initial setup phase (DNS/Resend at team level), then cutover runbook documented in a final phase before launch readiness.

**Severity:** **CRITICAL** — a botched cutover at launch is a public-facing failure visible to every person on the waitlist on the day they're highest intent.

---

## Major Pitfalls

### Pitfall 7: Welcome email has no physical mailing address (CAN-SPAM violation)

**What goes wrong:**
The welcome email, however small and friendly, is a commercial email under CAN-SPAM (it's promoting Quibly). It must include a valid physical postal address. Missing → FTC fines up to $51,744 per email. The Resend default template doesn't add this; it has to be in the email body.

**Why it happens:**
A solopreneur project has no office. Founders don't want to put their home address in every email. They omit it and hope.

**How to avoid:**
- Use a **registered agent** address, a **PO box** (USPS-registered), or a **commercial mail receiving agency** address (UPS Store mailbox, Earth Class Mail, iPostal1). All three satisfy CAN-SPAM.
- Bake the address into the email footer template at the React Email / template layer; never optional.
- Same address on the website footer + privacy policy + terms.

**Warning signs:**
- Welcome email body has no address.
- Privacy policy says "[Your Address]" or similar placeholder.
- Founder considering using their home address (legal but not advisable).

**Phase to address:** Email template phase. Block welcome-email implementation on having an address.

**Severity:** **MAJOR** — fines are unlikely at this scale, but exposure is real and the fix is cheap.

---

### Pitfall 8: GDPR — collecting from EU visitors with no consent record

**What goes wrong:**
A French visitor signs up. Six months later, they file a GDPR Article 15 access request: "what data do you have on me, and what did I consent to?" The site has the email and Resend has the timestamp, but no record of *the privacy text the user saw at signup*. The privacy policy has been updated three times since. The DPA fines under Article 5(2) for failure to demonstrate lawful basis.

Worse: the form has no consent checkbox at all and relies on "by submitting you agree" microcopy below the button. This is potentially valid for the email itself (email collection for the purpose stated, narrowly construed, can be legitimate-interest-adjacent), but is **not** valid for any marketing/analytics overlay.

**Why it happens:**
"Single-field form converts higher" is true and is fighting "consent must be specific, informed, and unambiguous." Founders read CookieYes once, conclude legitimate interest covers email collection, and skip the consent record.

**How to avoid:**
- **Below the submit button**, microcopy: *"By joining, you agree to the [Privacy Policy](/privacy) and to receive launch updates from Quibly. Unsubscribe anytime."* — This is "unambiguous indication" by submission for a narrowly-scoped purpose (waitlist for one product). DO NOT rely on legitimate interest as the sole basis.
- Snapshot the **consent text version** at signup and store it in the DB row (Pitfall 5). When the privacy policy changes, the version string captures what *that* user agreed to.
- Privacy policy must explicitly cover:
  - What's collected (email, IP, UA, UTM)
  - Lawful basis (consent, GDPR Art. 6(1)(a))
  - Retention period (e.g. "until you unsubscribe or until 12 months after Quibly launches, whichever first")
  - Data processors (Resend, Vercel, the analytics provider, the database host) with subprocessor list
  - Data subject rights (access, rectification, erasure, portability)
  - Contact for DPO/privacy: `privacy@useQuibly.com`
- Add a `/privacy` and `/terms` page from day one. Both linked in the footer + below the submit button.
- Honor unsubscribe and deletion requests within 30 days (CAN-SPAM is 10 business days, GDPR is 30 days — comply with the stricter window).

**Warning signs:**
- No consent microcopy near submit button.
- Privacy policy is generic boilerplate not customized for waitlist context.
- DB schema has no `consent_text_version` column.
- Form ships without `/privacy` and `/terms` routes returning real content.

**Phase to address:** Legal compliance phase, gates the production deploy. Privacy policy + terms must be live the moment the form goes live — this is in PROJECT.md constraints already.

**Severity:** **MAJOR** — GDPR fines can reach 4% of revenue, but for a pre-launch with no revenue the realistic risk is reputational + a forced shutdown if a regulator is provoked.

---

### Pitfall 9: Cookie consent banner blocks LCP and tanks conversion

**What goes wrong:**
A "GDPR cookie banner" overlay is dropped in via a third-party script (Cookiebot, OneTrust, Termly). It:
- Renders late, causing CLS (banner appears after paint, shifts content).
- Is the actual largest-contentful-paint element on mobile (it covers the hero).
- Blocks the form until consent — but visitors don't consent, they bounce.
- Loads 200KB of third-party JS that wasn't needed (you don't even use cookies for tracking).
- Itself sets a `cookieconsent_status` cookie BEFORE consent, which is illegally ironic.

Conversion drops 30–50%. Mobile Lighthouse score crashes from 95 to 60. CWV "Poor" rating in Search Console hurts SEO.

**Why it happens:**
Consent banners are sold as "GDPR-compliant in 5 minutes" plug-ins. Devs assume any privacy posture requires one. They don't realize: **if you don't set non-essential cookies and don't run third-party trackers, you don't need a banner.**

**How to avoid:**
- **Set zero non-essential cookies on the landing page.** No Google Analytics, no Facebook Pixel, no LinkedIn Insight, no Hotjar.
- **Use cookieless analytics**: Vercel Web Analytics (uses a daily-rotating hash, no cookies, GDPR-compliant by design) OR Plausible (cookieless, EU-hosted, GDPR-compliant by design). Both are explicitly designed to avoid the banner question.
- The privacy policy still discloses analytics — it's just disclosure, not consent.
- The ONLY cookie-like state is the rate-limit / honeypot signed cookie, which is "strictly necessary" under ePrivacy and exempt from consent.
- If you absolutely must add Meta/LinkedIn pixels later for paid acquisition, *then* add a banner — but defer that until paid acquisition exists.

**Warning signs:**
- `<script src="cookiebot.com/...">` or similar in `<head>`.
- Cookies in DevTools when the page loads (other than the rate-limit cookie).
- LCP is the cookie banner's overlay.
- CLS jumps after the banner injects.

**Phase to address:** Analytics phase. Decide cookieless analytics up front; never add cookie-banner middleware.

**Severity:** **MAJOR** — directly suppresses conversion, the project's only KPI.

---

### Pitfall 10: Hero is below the fold on mobile because of font loading + CSS layout

**What goes wrong:**
Mobile traffic (~83% of waitlist visitors) hits the page. The hero's H1 + tagline + email field need to be visible in the first viewport. But:
- Quicksand and Figtree are loading via `next/font/google` with `display: 'block'` (default for some setups), causing FOIT (flash of invisible text).
- The Quibs SVG mascot is sized at `h-64 w-64` (256px) and sits ABOVE the headline, pushing the form below the iPhone SE viewport (568px).
- A 1px-extra `padding-top` from `safe-area-inset-top` on iPhone Notch devices pushes everything down 30–60px.
- LCP element ends up being the mascot SVG, not the headline — so LCP timing is whatever-the-SVG-takes, not the text.

Result: visitors land on what looks like a blank page or a giant mascot, never see the form, bounce. Conversion drops by half.

**Why it happens:**
Designers prototype on desktop at 1440×900. The mascot looks gorgeous at that size. Nobody simulates the iPhone SE / iPhone 12 mini viewports. Tailwind's responsive prefixes (`md:`, `lg:`) make it easy to *not* design mobile-first — defaults inherited from desktop classes can break the small-screen layout silently.

**How to avoid:**
- **Design the mobile layout first, then scale up.** Default classes (no prefix) target ≤640px; `sm:`, `md:`, `lg:` only enlarge.
- Mobile hero element order on a 568px viewport: small mascot (≤96px) → H1 (2–3 lines max) → 1-line tagline → email field → CTA → consent microcopy. All visible without scroll.
- Use `next/font/google` with `display: 'swap'` (default in Next.js 16) so text renders immediately in the fallback, swaps in the custom font when ready.
- Use **variable fonts** (`Quicksand` and `Figtree` both have variable versions on Google Fonts) — single file, all weights, faster TTFB.
- Subset fonts to the Latin range only (`subsets: ['latin']`) in `next/font` config — drops file size ~70%.
- Preload only the **two critical fonts** used above the fold; do NOT preload italic / weight variants used later.
- The headline (H1) should be the LCP candidate, not an image. Either inline the mascot SVG (so it's painted with the HTML) and keep it small, OR `loading="eager"` + `priority` on a small `<Image>` so it doesn't compete with text.
- Test in Chrome DevTools at iPhone SE (375×667) AND iPhone 16 Pro (393×852, with notch) before every deploy.
- Run Lighthouse mobile in CI; gate at ≥90 (PROJECT.md constraint).

**Warning signs:**
- Lighthouse mobile <90 on PR previews.
- LCP element in WebPageTest is the mascot, not the headline.
- Form not visible without scrolling on iPhone SE preview.
- `font-display: block` anywhere.
- Multiple `font-weight` static font files instead of one variable file.

**Phase to address:** Hero implementation phase. Performance budget enforced via Lighthouse CI from the first PR.

**Severity:** **MAJOR** — same conversion impact as Pitfall 9, but easier to detect.

---

### Pitfall 11: Animations block first paint or cause CLS

**What goes wrong:**
A "fade-in on load" animation on the hero is implemented as `opacity: 0` → `opacity: 1` via `framer-motion` mounting after hydration. Result: the hero is invisible until the JS bundle loads, parses, hydrates, and Framer's animation kicks in. On a 3G connection that's 4+ seconds. Mobile users see a blank page and bounce.

Or: a "Quibs mascot waves on load" animation uses GSAP, ships 80KB of JS for a single decorative effect, blocks the main thread, and CLS spikes when the mascot's transform starts.

**Why it happens:**
Designers want personality; devs reach for the most familiar animation library; nobody profiles the result on a real phone.

**How to avoid:**
- **CSS animations only for hero entrance.** A `@keyframes fade-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }` runs on the rendering thread, no JS, no FOUC.
- Set initial state with `opacity: 1` in the SSR HTML — animation is enhancement, not gate. Users with `prefers-reduced-motion: reduce` get no animation, page works.
- If Framer Motion is needed for the mascot: `LazyMotion` + `domAnimation` features (smaller bundle), and animate AFTER LCP fires (`useEffect` with `requestIdleCallback`).
- No transform animations on the LCP element itself — they trigger CLS.
- Reserve dimensions: every animated element has explicit `width`/`height` so layout is stable.

**Warning signs:**
- Bundle analyzer shows `framer-motion` >50KB on the initial route.
- `import { motion }` at the top level of the hero component.
- Lighthouse CLS >0.1.
- "Animation" or "fade-in" libraries imported in the root layout.

**Phase to address:** Hero implementation phase. Bundle-size budget in CI.

**Severity:** **MAJOR** — feeds into LCP/CLS scores.

---

### Pitfall 12: Submit button + email input fail tap-target sizing on mobile

**What goes wrong:**
The pill CTA is styled at `py-2 px-4` (32px height). The input is the same. Lighthouse flags "Tap targets are not sized appropriately." More importantly, real users on iPhones miss the button on their first tap, hit the input by accident, then mistap the submit. Frustration → bounce.

**Why it happens:**
Pixel-perfect designs from Figma at 1× look fine, but Lighthouse and WCAG 2.5.8 require ≥48px (Lighthouse) / ≥44px (WCAG 2.5.5 AAA). PROJECT.md mentions "pill button radii (24px / 28px hero)" — it's easy to focus on radius and forget height.

**How to avoid:**
- Submit button minimum: `min-h-12` (48px) on mobile, larger (`min-h-14`) for the hero pill.
- Email input: `min-h-12` matching button.
- 8px minimum spacing between adjacent tap targets (vertical and horizontal).
- Privacy + terms footer links: `min-h-12` tap zones via padding, even if visual text is smaller.
- Input `type="email" inputmode="email" autocomplete="email"` so iOS shows the email keyboard with `@` and `.com` keys — not just better UX, also reduces typo bounces.
- Run Lighthouse "Tap targets" audit; verify zero failures.

**Warning signs:**
- Button or input under 44px tall in DevTools mobile preview.
- "Tap targets" failures in Lighthouse SEO/accessibility report.
- No `inputmode="email"` on the input.
- Two CTAs less than 8px apart.

**Phase to address:** Form implementation phase. Lighthouse a11y/SEO score gates deploy.

**Severity:** **MAJOR** — direct conversion impact and a11y compliance.

---

### Pitfall 13: Already-subscribed users see an error instead of "you're already in"

**What goes wrong:**
A friend forwards the link to someone who already signed up two months ago. They submit again. The form returns a 422 from Resend ("Contact already exists in this audience"), which gets surfaced as a generic red error: "Something went wrong." User bounces, thinks the brand is broken, and the existing subscription is unaffected but the user's confidence is destroyed.

**Why it happens:**
The submit handler treats Resend's 422 as a hard error. PROJECT.md explicitly calls out "handles already-subscribed gracefully" as a requirement, but it's the kind of detail that gets cut for time.

**How to avoid:**
- Detect Resend's "already exists" error code (typically `validation_error` with message `"Contact already exists"` — verify exact shape against Resend SDK at integration time).
- On already-exists: return success with a slightly different success state: "You're already on the list — we'll see you at launch."
- Idempotent submit: same email twice = same final state, no error. (This is the GraphQL/REST principle of idempotency for resource creation.)
- Lowercase + trim email before sending to Resend so `Jeff@useQuibly.com` and `jeff@usequibly.com` collapse.

**Warning signs:**
- Submit handler has only one success branch and one generic error branch.
- No test case for "submit same email twice."
- Error state visible in the UI for a re-subscription attempt.

**Phase to address:** Form implementation phase. Test case is the second test written.

**Severity:** **MAJOR** — every person who shares the link risks hitting this; small percentage of total but visible to influential users.

---

### Pitfall 14: Live signup counter leaks PII or is gameable

**What goes wrong:**
"Join 1,247 others on the waitlist!" is a great social proof element. Implementations that go wrong:
- Counter is fetched client-side from `resend.contacts.list()` via an exposed API key (Pitfall 4 redux).
- Counter is computed by listing all contacts and counting — works at 1k, slow at 50k, broken at Resend's pagination limits.
- Counter is real-time and increments visibly when bots submit (mass spam visible to other visitors).
- Counter goes BACKWARD when the founder cleans the audience, creating "wait, did I lose my spot?"

**Why it happens:**
"Just call the API" feels easier than "build a counter."

**How to avoid:**
- Counter is a single integer in the database, incremented atomically on successful signup.
- Counter is **read** via a static or revalidated route (`export const revalidate = 60` on a Server Component) — does NOT hit Resend at all.
- Floor it: show "Join 1,200+ others" not "1,247". Manual rounding hides backward movement and looks deliberate.
- Don't show the counter until N>some threshold (PROJECT.md says this — defaults to "100+" once you have 100 signups).
- Counter does NOT show recent signers' names/emails (sometimes seen on competitor sites — leaks PII).

**Warning signs:**
- Counter element in a Client Component fetching `/api/count` on every load.
- API route that calls `resend.contacts.list()` with no caching.
- Counter is exact, not floored.

**Phase to address:** Social proof phase (after MVP signup flow ships).

**Severity:** **MAJOR** — performance + PII risk depending on implementation.

---

## Minor Pitfalls

### Pitfall 15: Open Graph image is wrong size or missing

**What goes wrong:**
Someone shares `useQuibly.com` on LinkedIn / X / iMessage. Preview is broken (no image, wrong crop, or worst — the previous WordPress placeholder still cached at the URL). Click-through rate from social shares drops.

**How to avoid:**
- `og:image` 1200×630, under 1MB, served at a stable URL (`/og.png`).
- Generate dynamically via `next/og` (`opengraph-image.tsx`) so updates rebuild on deploy.
- `twitter:card: summary_large_image`.
- Test with [opengraph.xyz](https://opengraph.xyz) and Twitter's card validator before launch.
- Same image survives the cutover to `marketing-app` (Pitfall 6).

**Phase to address:** Pre-deploy phase.
**Severity:** **MINOR**.

---

### Pitfall 16: `robots.txt` and `sitemap.xml` are wrong for a pre-launch

**What goes wrong:**
Either: (a) `robots.txt` blocks all bots → page never indexed, no organic traffic. Or: (b) `robots.txt` allows all and `sitemap.xml` lists 50 routes that are 404s (because this is a single-page app), confusing Google. Or: (c) AI crawlers (`GPTBot`, `ClaudeBot`, `PerplexityBot`) are not addressed at all; the page leaks brand info into models pre-launch in ways the founder may not want.

**How to avoid:**
- `robots.txt`:
  ```
  User-agent: *
  Allow: /
  Disallow: /api/
  Disallow: /unsubscribe
  Sitemap: https://useQuibly.com/sitemap.xml
  ```
- `sitemap.xml` lists only `/`, `/privacy`, `/terms`. Single page is normal at this stage.
- Decide explicitly: allow or deny AI crawlers? If denying: add `User-agent: GPTBot / ClaudeBot / Google-Extended / PerplexityBot / CCBot — Disallow: /`.
- Verify in Google Search Console after deploy.

**Phase to address:** Pre-deploy phase.
**Severity:** **MINOR**.

---

### Pitfall 17: Email validation client-side is too permissive or too strict

**What goes wrong:**
Either: (a) only `[^@]+@[^@]+` is checked → `a@b` passes → bounces. Or: (b) a 200-line regex from StackOverflow rejects legitimate addresses with `+`, dots, IDNs.

**How to avoid:**
- Client-side: HTML5 `type="email"` + `required` + the simple regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`. That's enough — the server-side check is the real validation.
- Server-side: same simple regex + DNS MX-record check on the email's domain (drops fake domains). Optional: use a library like `email-validator` (`@sideway/address`) for stricter parsing.
- Do NOT block `+` aliases (`jeff+waitlist@gmail.com`) — they're valid and useful.
- Do NOT block international domains.

**Phase to address:** Form implementation phase.
**Severity:** **MINOR**.

---

### Pitfall 18: Welcome email is sent from `noreply@` and replies vanish

**What goes wrong:**
`From: noreply@useQuibly.com`. Excited new subscribers reply with feedback, questions, "I want to beta test!" — those replies are silently bounced or dropped, the founder never sees them, and warm leads go cold.

**How to avoid:**
- `From: hello@useQuibly.com` (or a name like `Quibly Team <hello@useQuibly.com>`).
- Set up an inbound mailbox on `hello@` — even just forwarding to the founder's personal email is fine.
- Reply-to a real human at MVP scale; this is a competitive advantage no automated startup gets right.

**Phase to address:** Email template phase.
**Severity:** **MINOR**.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip database, use Resend Audiences as source of truth | One less moving part; ship in a day | Cannot reconstruct consent metadata, IP, UTM, signup time → migration to `marketing-app` is broken | **Never** — see Pitfall 5 |
| Honeypot only (no rate limit, no time-trap) | Simplest bot defense | Sophisticated form-spammers defeat single-layer defense → list poisoned by launch | Only acceptable for the first 48 hours of soft launch with monitoring; layer 2-4 within a week |
| Cloudflare Turnstile only (no honeypot, no rate limit) | "CAPTCHA solves it" | Turnstile breaks on iOS Safari with strict tracking protection, on mobile emulators, on privacy-extension users → real users fail | Use Turnstile only as the FOURTH layer when 1-3 prove insufficient |
| One full-access Resend API key for everything | Easiest to set up | Compromise → audience deleted, all emails leaked | Only acceptable in dev. Production uses restricted "sending only" key. |
| `display: 'block'` for fonts | Avoids FOUT | Causes FOIT, hero invisible until font loads, kills LCP | Never — `display: 'swap'` is the default and correct |
| Skip privacy policy / terms, "we'll add later" | Ship one day faster | Illegal under GDPR/CAN-SPAM the moment the form goes live | Never |
| Inline the audience ID in source code | Saves an env var | Forking the repo (open-source it later) leaks the audience ID; rotation requires a code change | Never — env var is one line |
| Use `marketing-app`'s Resend account but a different audience/domain | "Cleaner separation" | Two domains to warm up, two DKIM reputations, cutover requires re-warming | Use the same Resend domain — PROJECT.md says reuse |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Resend Audiences | Calling `contacts.create` from a Client Component with `NEXT_PUBLIC_RESEND_API_KEY` | Server Action only; restricted API key with `audiences:contacts:create` + `emails:send` scopes |
| Resend Broadcasts (launch announcement) | Using `resend.emails.send()` in a `for` loop over the audience to announce launch | Use Resend Broadcasts feature — handles batching, headers, unsubscribe links automatically; loop-send misses List-Unsubscribe-Post header |
| Resend domain DNS | Adding only DKIM CNAMEs Resend shows; assuming SPF/DMARC are someone else's problem | All four (SPF + 3× DKIM + Return-Path + DMARC) added at apex; verify with `mail-tester.com` |
| Resend webhook (unsubscribe events) | Not subscribing to `contact.updated` and `contact.deleted` events | Webhook → Vercel route → mark `unsubscribed_at` in primary DB. Without this, the DB and Resend drift |
| Vercel domain assignment | Apex bound to this repo's project; can't easily transfer | Bind apex to the team, not the project; transfer via Vercel CLI atomically |
| Vercel env vars | Setting in "Development" only, missing "Preview" or "Production" | All envs configured; PR previews use a separate Resend audience (`RESEND_AUDIENCE_ID_PREVIEW`) so PR test sends don't pollute production |
| `next/font/google` | Using `display: 'block'` or omitting `subsets` | `display: 'swap'`, `subsets: ['latin']`, `variable: '--font-quicksand'`, variable font weight |
| Tailwind v4 + `next/font` | Using v3-style `tailwind.config.js` for font families | `@theme inline` in `globals.css` referencing `--font-*` CSS vars from `next/font` |
| Upstash Redis (rate limit) | Using REST URL but TLS misconfigured / wrong region | Use Upstash's Vercel integration; auto-injects `UPSTASH_REDIS_REST_URL` + token; pick same region as the Vercel project (low latency) |
| Cloudflare Turnstile | Verifying token client-side only | Server-side verify against `https://challenges.cloudflare.com/turnstile/v0/siteverify` with secret key |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Resend Audience contact-listing for counter | API latency 500ms+, then timeout | Counter in primary DB, atomically incremented; cached at edge with 60s revalidate | At ~5,000 contacts (Resend pagination kicks in) |
| Synchronous welcome email send blocks form response | "Loading…" spinner for 3+ seconds before success state | Fire-and-forget: queue welcome email after returning success to user. Use Vercel queues / `waitUntil` from Next 16's `after()` API | At ~50 concurrent submissions (when Resend send latency stacks) |
| Fetching analytics in Server Component on every request | Page TTFB 800ms+ | Move analytics to client-side script; analytics never blocks SSR | Always (any traffic) |
| Loading entire `framer-motion` for one animation | First load JS >150KB | CSS animations or `LazyMotion` + tree-shake; defer animation libs to after LCP | At ~200 concurrent visits (function compute spike) |
| Image not optimized (PNG mascot at 800KB) | LCP >2.5s | Use Next `<Image>` with `priority` for above-fold; serve SVG inline or as AVIF/WebP | Always on mobile 3G/4G |
| Tailwind v4 unused-class bloat | Production CSS >40KB | Tailwind v4's automatic content scanning (no need for `content: []` config); verify final CSS is <20KB | Always; v4 is good by default but verify |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| `RESEND_API_KEY` with full-access scope | Full audience deletion / exfiltration if key leaks | Restricted "sending access" key, scoped to `useQuibly.com` |
| Secrets in `.env.local` committed to git | Public repo → key in commit history → harvested in minutes | `.gitignore` `.env*`, gitleaks pre-commit hook, rotate immediately if leaked |
| No CSRF protection on form | Cross-origin sites can submit on behalf of authenticated users (low risk for unauthenticated form, but Server Actions need consideration) | Next.js Server Actions have built-in CSRF (origin check); verify it's not disabled. Same-origin policy + Origin header check on `/api/subscribe` route |
| Form submission accepts arbitrary fields | Malicious payload could include extra fields that get persisted | Zod validation on submit handler: `z.object({ email: z.string().email().max(254) }).strict()` — `.strict()` rejects unknown keys |
| Logging emails in plaintext | PII in Vercel logs (subject to access controls) | Hash emails before logging, OR don't log emails at all (just log success/failure metric) |
| Missing rate limit on unsubscribe endpoint | Attacker can unsubscribe everyone via guessable token | Use signed, single-use tokens (HMAC of email + secret); rate-limit `/unsubscribe` per IP |
| Storing IP indefinitely | GDPR data minimization violation | Auto-null `ip_address` after 30 days via cron; document retention in privacy policy |
| Inbound `unsubscribe@` not authenticated | Attacker emails `unsubscribe@useQuibly.com` from victim's address (spoofed) → victim removed | DMARC `p=reject` to make spoofing hard; HTTPS unsubscribe link is preferred over mailto |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Submit button has no loading state | User taps repeatedly → multiple submissions, anxiety | `pending` state from `useFormStatus()` (App Router); button text "Joining…" + disabled |
| Success state replaces hero entirely | User loses context, can't share, can't see what they signed up for | Inline success: "You're in! We'll email you at launch." Keep brand visible. |
| Error messages are generic ("Something went wrong") | User can't recover, doesn't know if to retry | Specific: "That email looks invalid — typo?" / "We had a hiccup, mind trying again in a moment?" |
| Welcome email sent before page success state confirms | User's email client buzzes before page acknowledges submission → confusion | Send welcome email AFTER returning success to client (still within ~2s) |
| Page works on iPhone Pro but breaks on iPhone SE | Smallest mobile users (~10% of traffic) bounce | Test at 320×568 (iPhone SE 1st gen — narrowest viewport in current circulation) |
| Mascot animation distracts from form | Eye tracks animation, not the field | Animation runs once on entrance, then settles. No looping animation near the CTA. |
| Privacy policy link opens in same tab → user loses signup intent | Reads policy, forgets to come back, doesn't sign up | `target="_blank" rel="noopener"` on policy link OR open in modal |
| No fallback if JS fails | NoScript users / corporate firewalls / very slow networks → form is dead | `<form action="/api/subscribe" method="POST">` with progressive enhancement; Server Action fallback works without JS |
| Welcome email goes to spam, user doesn't realize they're in | User signs up twice, gets confused, may complain | Success state explicitly says: "Check your inbox (and spam folder) for confirmation." Mention sender domain. |

---

## "Looks Done But Isn't" Checklist

- [ ] **Welcome email:** Often missing `List-Unsubscribe-Post: List-Unsubscribe=One-Click` header — verify by inspecting raw email source in Gmail (View Original → search for "List-Unsubscribe-Post")
- [ ] **DNS:** Often missing DMARC record — verify with `dig _dmarc.useQuibly.com TXT` or `mail-tester.com`
- [ ] **DNS alignment:** SPF/DKIM may pass individually but fail DMARC alignment — verify `mail-tester.com` shows DMARC = pass (not just SPF + DKIM = pass)
- [ ] **Sender address:** Often missing physical postal address in welcome email — verify by reading the email body
- [ ] **API key scope:** Often left as "Full access" — verify in Resend dashboard the production key is "Sending access" with domain restriction
- [ ] **Database row:** Often missing — verify Audience signup also creates a row in primary DB; query DB after a test signup
- [ ] **Consent record:** Often missing `consent_text_version` — verify DB schema includes it and value is captured at signup
- [ ] **Rate limit:** Often configured but not actually invoked — verify by submitting 6 times in 10min, expect 6th to be rejected
- [ ] **Honeypot:** Often present in HTML but not checked server-side — verify by submitting with the honeypot filled, expect rejection
- [ ] **Tap targets:** Often "look big" but measure under 48px — verify with Lighthouse "Tap targets" audit
- [ ] **Mobile hero:** Often "fits" on iPhone Pro but not SE — verify at 320×568 viewport
- [ ] **LCP element:** Often the image, should be the headline — verify in Lighthouse "Largest Contentful Paint element"
- [ ] **Already-subscribed:** Often returns generic error — verify by submitting same email twice; second response should be a friendly success-style state
- [ ] **`og:image`:** Often 404s after deploy — verify by sharing in iMessage / Slack / LinkedIn after every deploy
- [ ] **Privacy policy:** Often boilerplate — verify it specifically describes what *this site* collects (email, IP, UA, UTM)
- [ ] **Terms:** Often missing entirely — verify `/terms` returns 200 with real content
- [ ] **Unsubscribe endpoint:** Often returns 200 but doesn't actually remove from Audience — verify by clicking unsubscribe in a test email, then checking the contact is `unsubscribed=true` in Resend
- [ ] **Cutover plan:** Often nonexistent — verify a written runbook exists for transferring `useQuibly.com` to `marketing-app`
- [ ] **PR preview audience:** Often shares production audience — verify Vercel "Preview" env points to a separate `RESEND_AUDIENCE_ID_PREVIEW`
- [ ] **`mail-tester.com` score:** Often skipped — verify production sender scores 10/10 before launch

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Pitfall 1: missing List-Unsubscribe headers, list undeliverable | MEDIUM | Fix headers immediately; pause sends for 72h; warm domain back up with low-volume sends; expect 2-4 weeks reputation rebuild |
| Pitfall 2: SPF/DKIM/DMARC misaligned | LOW | Fix DNS, wait for propagation (≤24h), verify with `mail-tester.com`, retry sends |
| Pitfall 3: list poisoned with bot signups | HIGH | Run validation pass (kickbox / Resend's new validation API) on entire audience; remove invalid; remove disposable domains; remove anyone whose welcome email bounced; **expect to lose 30-70% of "list size"** (which is fine because they were fake) |
| Pitfall 4: API key leaked | HIGH | Rotate key immediately in Resend dashboard; update Vercel env; force redeploy; audit Resend audit log for unauthorized API calls; if audience was read, this is a GDPR Art. 33 breach (notify within 72h) |
| Pitfall 5: list in Resend only, no DB | HIGH | Export Resend CSV → import into new DB schema → backfill nullable columns (consent version, IP, UTM all null); for any subsequent migration, the missing metadata is permanent |
| Pitfall 6: cutover broken | MEDIUM | Revert DNS to this repo's Vercel deployment; debug `marketing-app`; retry at next low-traffic window |
| Pitfall 7: missing physical address | LOW | Add address to template; redeploy; future sends compliant; past sends are violations but unlikely to be enforced |
| Pitfall 8: GDPR consent not recorded | MEDIUM | Send a "we updated our privacy policy, here's what you agreed to" email to all subscribers giving them an explicit opt-in confirmation; record consent going forward; audience size will drop ~10-20% from non-confirmers |
| Pitfall 9: cookie banner already shipped | LOW | Remove banner, remove cookie-setting analytics, switch to cookieless analytics, remove the cookie via redeploy (`Set-Cookie: name=; expires=...`) |
| Pitfall 10: hero below fold | LOW | Reduce mascot size, restructure component order, redeploy |
| Pitfall 13: already-subscribed returns error | LOW | Patch error handler, redeploy |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1: Missing `List-Unsubscribe-Post` | Email infrastructure (welcome email) | Inspect raw email source; gate launch on Gmail "Show Original" inspection |
| 2: SPF/DKIM/DMARC misalignment | Pre-deploy DNS / Resend domain verification | `mail-tester.com` 10/10; `dig _dmarc.useQuibly.com` |
| 3: Bot poisoning | Form implementation | Submit 6× in 10min: 6th rejected. Honeypot test: rejected. Disposable domain test: rejected |
| 4: API key exposure | Form implementation (server action wiring) | Grep audit; restricted key in Resend dashboard; bundle analyzer shows no `re_*` strings |
| 5: List trapped in Resend | Backend infrastructure (DB + dual-write) | Test signup creates row in DB AND Resend; row contains `consent_text_version`, IP, UTM |
| 6: Cutover breaks | Pre-launch readiness | Written runbook in repo; domain bound to team not project; Resend domain at team level; cutover dry-run on a staging subdomain |
| 7: Missing physical address | Email template | Read welcome email body; address present |
| 8: GDPR consent not recorded | Legal compliance | Privacy policy + terms live; consent microcopy below button; DB has `consent_text_version` |
| 9: Cookie banner blocks paint | Analytics setup | Cookieless analytics chosen (Vercel Analytics or Plausible); zero cookies in DevTools |
| 10: Hero below fold on mobile | Hero implementation | Lighthouse mobile ≥90; visual test at 320×568 and 393×852; LCP element is text |
| 11: Animations block paint | Hero implementation | Bundle size budget enforced; CLS <0.1; animation lib not in initial bundle |
| 12: Tap targets too small | Form implementation | Lighthouse "Tap targets" passes; manual test on real iPhone |
| 13: Already-subscribed error | Form implementation | Submit same email twice; second submission shows friendly state |
| 14: Counter implementation | Social proof phase (post-MVP) | Counter served from DB / cached route; no API key on client; floor displayed value |
| 15: OG image | Pre-deploy | Test in opengraph.xyz; verify after deploy |
| 16: robots/sitemap | Pre-deploy | Search Console verification; `curl /robots.txt` |
| 17: Email validation | Form implementation | Test cases for `+` aliases, IDNs, and invalid `a@b` |
| 18: noreply sender | Email template | `From:` is `hello@`; reply test routes to founder |

---

## Sources

**Authoritative / official (HIGH confidence):**
- [RFC 8058: Signaling One-Click Functionality for List Email Headers](https://datatracker.ietf.org/doc/html/rfc8058)
- [Resend — Send emails with Next.js](https://resend.com/docs/send-with-nextjs)
- [Resend — Managing Contacts](https://resend.com/docs/dashboard/audiences/contacts)
- [Resend — What sending feature should I be using?](https://resend.com/docs/knowledge-base/what-sending-feature-to-use)
- [Resend — Create API Key](https://resend.com/docs/api-reference/api-keys/create-api-key)
- [Resend — Exports as CSV (beta)](https://resend.com/changelog/exports-as-csv-in-beta)
- [Resend — New API Key Permissions](https://resend.com/changelog/new-api-key-permissions)
- [Resend — New Contacts Experience](https://resend.com/blog/new-contacts-experience)
- [FTC — CAN-SPAM Act Compliance Guide for Business](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business)
- [Cloudflare Turnstile — Get Started](https://developers.cloudflare.com/turnstile/get-started/)
- [Cloudflare Challenges — Troubleshooting](https://developers.cloudflare.com/cloudflare-challenges/troubleshooting/)
- [Next.js — Font Optimization](https://nextjs.org/docs/app/getting-started/fonts)
- [Next.js — Data Security](https://nextjs.org/docs/app/guides/data-security)
- [Vercel — Web Analytics privacy policy](https://vercel.com/docs/analytics/privacy-policy)
- [Plausible — GDPR data policy](https://plausible.io/data-policy)
- [Lighthouse — Tap targets are not sized appropriately](https://developer.chrome.com/docs/lighthouse/seo/tap-targets)
- [web.dev — Accessible tap targets](https://web.dev/articles/accessible-tap-targets)
- [Upstash — Rate Limiting Next.js API Routes](https://upstash.com/blog/nextjs-ratelimiting)

**Verified secondary sources (MEDIUM confidence):**
- [Postmark — How to include a List-Unsubscribe header](https://postmarkapp.com/support/article/1299-how-to-include-a-list-unsubscribe-header)
- [SocketLabs — One-click List-unsubscribe is now required](https://www.socketlabs.com/blog/2024-is-the-year-of-the-one-click-list-unsubscribe/)
- [Mailgun — What is RFC 8058?](https://www.mailgun.com/blog/deliverability/what-is-rfc-8058/)
- [DMARCPal — One-click unsubscribe Gmail Yahoo (RFC 8058)](https://dmarcpal.com/learn/one-click-unsubscribe-gmail-yahoo)
- [Valimail — Google Yahoo Bulk Sender Authentication Requirements](https://support.valimail.com/en/articles/9143173-google-yahoo-email-authentication-requirements-for-bulk-senders)
- [Redsift — 2026 bulk email sender requirements checklist](https://redsift.com/guides/bulk-email-sender-requirements)
- [Suped — Do welcome series emails require an unsubscribe link under CAN-SPAM?](https://www.suped.com/knowledge/email-deliverability/compliance/do-welcome-series-emails-require-an-unsubscribe-link-under-can-spam)
- [Consenteo — GDPR Cookie Consent in 2026](https://www.consenteo.com/knowledge-hub/GDPR/gdpr_cookie_consent_2026)
- [iubenda — Legitimate Interest and Cookies](https://www.iubenda.com/en/blog/consent-legal-basis-cookies-2/)
- [Smashing Magazine — Accessible Target Sizes Cheatsheet](https://www.smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks/)
- [Waitlister — How to Create a Waitlist Landing Page That Converts (2026)](https://waitlister.me/growth-hub/guides/waitlist-landing-page-optimization-guide)
- [SaaS Hero — Common Landing Page Optimization Mistakes 2026](https://www.saashero.net/design/common-landing-page-optimization-mistakes/)
- [DigitalApplied — Landing Page Statistics 2026](https://www.digitalapplied.com/blog/landing-page-statistics-2026-conversion-data-points)
- [Hello Kellyco — Cloudflare Turnstile in Next.js 15](https://hellokellyco.com/blog/cloudflare-turnstile-nextjs-15)
- [NextNative — Keeping Your Next.js API Key Secure](https://nextnative.dev/blog/api-key-secure)

---
*Pitfalls research for: SaaS pre-launch waitlist landing page on Next.js 16 + Tailwind v4 + Resend Audiences + Vercel*
*Researched: 2026-04-27*
