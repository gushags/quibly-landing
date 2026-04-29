# Phase 5: Legal + SEO + Analytics - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning

<domain>
## Phase Boundary

All compliance, discoverability, and observability surface area required to expose the form to public traffic. Three sub-domains ship together because they share a single gating function (production-deploy go/no-go for Phase 6) and they each touch `app/layout.tsx` metadata or `app/` file-convention routes:

- **Legal:** `/privacy` + `/terms` pages + consent microcopy + `consent_version` real mechanism
- **SEO:** OG image + Twitter Card + favicon/apple-touch-icon + `robots.ts` + `sitemap.ts` + Schema.org JSON-LD + page metadata
- **Analytics:** Vercel Web Analytics (cookieless) + Speed Insights mounting + `lib/analytics.ts` swap from console-shim to `@vercel/analytics/server`

**In scope:**
- `app/(legal)/privacy/page.tsx` — TSX page adapted from `marketing-app/app/(public)/privacy/page.tsx` (282-line hand-written TSX); narrowed to waitlist scope: email collection only, Vercel Analytics + Vercel Speed Insights + Resend named as processors, lawful basis = GDPR Art. 6(1)(a) consent, retention "until launch + 12 months" (per PROJECT.md), DSAR contact `privacy@useQuibly.com`. "Last updated: <date>" header.
- `app/(legal)/terms/page.tsx` — fresh TSX (marketing-app's terms is for paying users, not waitlist scope). Same Tailwind class conventions as privacy.
- `(legal)` route group OR top-level `app/privacy` + `app/terms` — Claude picks during planning; the existing footer hrefs (`/privacy`, `/terms`) are locked (Phase 2 D-19).
- Consent microcopy under the form button per LEGAL-06: "By joining, you agree to our Privacy Policy and Terms" with linked anchors.
- "No spam, unsubscribe anytime" reassurance copy per LEGAL-07.
- `lib/consent-version.ts` — module that computes a SHA-256 hash of `app/(legal)/privacy/page.tsx` + `app/(legal)/terms/page.tsx` file contents (first 8 hex chars) at module load. Single source of truth — Server Action imports `{ CONSENT_VERSION }`.
- `app/actions/join-waitlist.ts` — swap the Phase 4 stub (`process.env.VERCEL_GIT_COMMIT_SHA ?? 'pre-phase-5'`) for `import { CONSENT_VERSION } from '@/lib/consent-version'`. Strip the two `// eslint-disable-next-line custom/no-raw-process-env` comments around the consent_version read (still needed for VERCEL_ENV audience routing).
- `app/opengraph-image.tsx` — dynamic 1200×630 via `next/og` `ImageResponse`. Mascot left + tagline right + teal-gradient background. Hero tagline verbatim ("You know your business. Quibly knows how to market it."). Quicksand + Figtree TTF fetched/checked-in for `ImageResponse` font binaries. Reused for Twitter Card via `twitter:card = summary_large_image` + `twitter:image = og-image`.
- `app/favicon.ico` + `app/apple-touch-icon.png` — derived from Quibs Q-face SVG (`public/quibs-icon.svg`).
- `app/robots.ts` — explicit `User-agent` blocks for GPTBot, ClaudeBot, Google-Extended, PerplexityBot, CCBot — all `Allow: /`. No explicit rules for Googlebot/Bingbot (defaults apply). No env-flag gate.
- `app/sitemap.ts` — `/`, `/privacy`, `/terms`. Last-modified: build time. Standard.
- Schema.org JSON-LD — Organization + WebSite. Rendered as a single `<script type="application/ld+json">` injected from `app/page.tsx` (or `layout.tsx` if site-wide). Claude picks specific properties during planning; minimum viable set per REQUIREMENTS SEO-08.
- `app/layout.tsx` metadata — extend the existing `export const metadata` block: title template stays, add OG description tightened to 160 chars max, add `twitter:creator`/`twitter:site` if founder has handles (otherwise omit cleanly).
- `lib/analytics.ts` — swap the `console.log`-based shim body for `import { track as vercelTrack } from '@vercel/analytics/server'` + `await vercelTrack(event, properties)`. The exported `track()` signature and `TrackEvent` union do NOT change — Phase 4 callers in `app/actions/join-waitlist.ts` and `app/api/webhooks/resend/route.ts` continue to work.
- Vercel Web Analytics + Speed Insights mounted in `app/layout.tsx` — `<Analytics />` from `@vercel/analytics/next` and `<SpeedInsights />` from `@vercel/speed-insights/next`. Both before `</body>`. Cookieless, no banner.
- Zero-cookie verification — manual checkpoint task: fresh-incognito → DevTools → Application/Storage → confirm 0 non-essential cookies (ANLY-05). No GA4/PostHog/Meta Pixel/LinkedIn Insight/Hotjar/Clarity/GTM in the bundle (ANLY-06) — verified by grepping `package.json` deps.

**Out of scope:**
- Cookie consent banner of any kind — load-bearing v1 commitment (SUMMARY.md Conflict §4)
- Any third-party tracking SDK other than Vercel Web Analytics + Speed Insights
- Email-typo correction (V2-04), live signup counter (Phase 7), referral mechanics (V2-03)
- Re-consent prompting UX on consent_version drift — recorded for audit only; no active prompts
- Apex domain binding at Vercel team level (DEPLOY-01..02) — Phase 6
- mail-tester.com 10/10 verification (DEPLOY-05) — Phase 6
- Cutover runbook (`docs/cutover.md`) — Phase 6
- Privacy/terms MDX migration — rejected during discussion; TSX matches marketing-app pattern

</domain>

<decisions>
## Implementation Decisions

### Privacy / Terms authoring
- **D-01:** **Privacy adapted from `marketing-app/app/(public)/privacy/page.tsx`; terms written fresh.** Adapt strips marketing-app's "brand info / content data / Stripe payment data" sections — those describe full-app data flows that don't exist for a pre-launch waitlist. Narrow to: (a) email-only collection, (b) Vercel Web Analytics + Speed Insights as processors, (c) Resend as processor, (d) GDPR Art. 6(1)(a) consent as lawful basis, (e) retention "until launch + 12 months post-launch," (f) DSAR contact `privacy@useQuibly.com`. Voice stays consistent with marketing-app's existing privacy. Terms is fresh because marketing-app's terms covers paying users / app TOS — not applicable to a waitlist where the only "service" is "we'll email you when we launch."
- **D-02:** **Plain TSX `page.tsx` format, NOT MDX.** Matches marketing-app pattern exactly. No new dependency (rejected `@next/mdx` / `next-mdx-remote`). Tailwind classes for typography (Phase 1 already rejected `@tailwindcss/typography`). Hand-styled prose acceptable per CLAUDE.md "What NOT to Use".
- **D-03:** **Both pages required v1, both pre-launch.** REQUIREMENTS LEGAL-01 + LEGAL-02 are non-negotiable. Footer (Phase 2 D-19) already references both routes; cutover-blocking otherwise.
- **D-04:** **Postal address reuses `RESEND_FROM_POSTAL_ADDRESS` env var.** Single source of truth — Phase 4 already wired this for the welcome-email footer. Privacy page imports `{ env } from '@/lib/env'` and renders `{env.RESEND_FROM_POSTAL_ADDRESS}` in the contact section. One address to update; same Zod-refine production guard already enforces real value (no `YOUR-POSTAL-ADDRESS-HERE` placeholder in prod).

### AI-crawler / robots policy
- **D-05:** **Allow all named AI crawlers.** GPTBot, ClaudeBot, Google-Extended, PerplexityBot, CCBot — all `Allow: /`. Brand-led marketing copy with no proprietary product content. Pre-launch waitlist benefits from any LLM-mention surface; SUMMARY.md default. Decision documented as deliberate, not "we forgot to set robots."
- **D-06:** **No explicit rules for Googlebot/Bingbot/Yandex/DuckDuckBot.** Defaults apply (implicit allow). Keeps `robots.ts` minimal and inspectable. Belt-and-suspenders explicit `Allow` rules rejected as noise.
- **D-07:** **Code-only, hard-coded decision in `robots.ts`.** No env-flag (`BLOCK_AI_CRAWLERS`) — single source of truth in repo, PR + deploy to flip. Pre-launch volume doesn't need ops-grade flips. Aligns with `lib/env.ts` minimalism (Phase 1 D-07).

### OG image composition
- **D-08:** **Mascot-left + tagline-right + teal-gradient background.** Quibs Q-face occupies left ~40% (white icon on teal-gradient panel mirroring welcome-email header strip aesthetic); right ~60% renders the hero tagline + `useQuibly.com` wordmark in white text. Mascot is the recognition hook in social previews — drops it would lose Quibly's strongest brand signal at zero-signup pre-launch.
- **D-09:** **Hero tagline verbatim:** `"You know your business. Quibly knows how to market it."` PROJECT.md / HERO-01 locked tagline. Reusing it keeps social-share → click-through coherent (recipient sees the same line as the page H1). NOT the launch-timing line ("Launching Summer 2026") — that drifts from the on-page H1.
- **D-10:** **Single image asset for OG + Twitter.** `app/opengraph-image.tsx` is the only image function; `twitter:card = summary_large_image` + `twitter:image` reuses the OG output. No separate `app/twitter-image.tsx`. One asset, one `ImageResponse` function — Twitter renders 1200×630 the same way as OG.
- **D-11:** **Quicksand + Figtree TTF/OTF fetched at build time for `ImageResponse`.** `next/og`'s `ImageResponse` requires raw font binaries (NOT `next/font` instances). Quicksand for the tagline (heading voice), Figtree for the wordmark fallback. Researcher confirms during planning: fetch from Google Fonts at build (then cache) vs. check `.ttf` files into `public/fonts/` (zero runtime fetch). Claude picks during planning; either keeps Quibly typography in social previews.

### consent_version mechanism
- **D-12:** **SHA-256 hash of privacy.tsx + terms.tsx file contents (first 8 hex chars).** Read both files at module load via `fs.readFileSync` (Server Component / Server Action context — no client bundle), `crypto.createHash('sha256').update(privacyContent + termsContent).digest('hex').slice(0, 8)`. Bumps ONLY when policy text changes — not on every code commit. Most precise re-consent signal.
- **D-13:** **Privacy page DISPLAYS "Last updated: <date>" — NOT the hash.** Date is human-readable (matches marketing-app's "Last updated: April 2026" convention). Hash is internal audit-trail only. Two surfaces, two purposes: users read date, compliance reviews read `properties.consent_version` on each Resend contact.
- **D-14:** **Single export from `lib/consent-version.ts`.** `import { CONSENT_VERSION } from '@/lib/consent-version'` in `app/actions/join-waitlist.ts`. One file owns generation + read; no env var; no `process.env` access. Aligns with Phase 1 D-11 (no raw `process.env.X` in app code outside `lib/env.ts`). Module-level `const` computed once at module load — safe for serverless cold-start since file contents are deterministic at build time.
- **D-15:** **No automatic re-consent prompts in v1.** `consent_version` is recorded on each contact for compliance traceability. No active UX. Phase 6 cutover exports CSV with `consent_version` column; if `marketing-app` post-launch needs re-consent, it has the version-at-signup data. Pre-launch volume + single-opt-in pattern doesn't justify prompting infra.

### Claude's Discretion
- **CD-01:** Privacy page route layout — `app/(legal)/privacy/page.tsx` (route group, no URL segment) vs `app/privacy/page.tsx` (top-level). Route group keeps both legal pages organized; top-level matches marketing-app's `app/(public)/privacy`. Footer hrefs `/privacy` + `/terms` work either way. Claude picks during planning.
- **CD-02:** Schema.org JSON-LD — minimum viable Organization + WebSite per SEO-08. Properties to include: `Organization` (name "Quibly", url, logo pointing to OG image or `public/quibs-icon.svg`, description, founder if surfaced), `WebSite` (url, name, potentialAction Search disabled — no site search exists). Claude picks specific properties + injection point (`app/page.tsx` vs `app/layout.tsx`) during planning. No `sameAs` URLs (no social handles published yet); omit cleanly.
- **CD-03:** OG image fonts — Google Fonts build-time fetch vs `public/fonts/*.ttf` checked-in. Researcher verifies during planning whether Vercel build sandbox can outbound-fetch googlefonts.com reliably; check-in is the safer fallback. Claude picks during planning; either preserves typography parity.
- **CD-04:** Last-updated date for privacy/terms — ISO date string in the page text vs `new Date().toLocaleDateString()` (renders at build time). Static string is auditable in git history; dynamic loses the audit trail. Claude picks the static-string pattern during planning.
- **CD-05:** Analytics event property schema — `track('waitlist_signup', { duplicate })` is the existing call site. Phase 5 keeps the schema minimal; do NOT add UTM parameters, referrer, or audienceId in v1 (cookieless commitment + no marketing attribution need pre-launch). The `TrackEvent` union in `lib/analytics.ts` stays unchanged.
- **CD-06:** `<Analytics />` and `<SpeedInsights />` mount order in `app/layout.tsx` — both as siblings of `<Toaster />` immediately before `</body>`. Standard Vercel pattern. Claude wires during planning.
- **CD-07:** DSAR contact mailbox — `privacy@useQuibly.com`. Phase 5 sets the address in privacy.tsx; provisioning the actual mailbox (Resend Inbound, Google Workspace alias, or forwarding) is a founder action item flagged as a launch-gating checkpoint, NOT Phase 5 plan code. Phase 6 launch checklist verifies receipt.
- **CD-08:** Retention period exact value — "until launch + 12 months post-launch" per PROJECT.md constraint. Privacy page wording: "We retain your email until Quibly launches plus 12 months thereafter, or until you unsubscribe — whichever comes first." Claude finalizes wording during planning; legal review during PR.
- **CD-09:** Robots.ts emit format — Next 16 `app/robots.ts` returns `MetadataRoute.Robots` (object) which Next renders to `/robots.txt`. Each AI crawler gets its own `{ userAgent, allow: '/' }` rule object. Claude wires during planning.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project planning
- `CLAUDE.md` — full Recommended Stack (Vercel Analytics + Speed Insights ^1, `@vercel/og` `ImageResponse`); "Specific Architectural Decisions" §"Analytics — Vercel Analytics + Vercel Speed Insights (only)" + §"Legal / cookie banner — minimal, deferred or static" + §"OG image generation — `ImageResponse` from `next/og` (built-in)"; "What NOT to Use" — confirms no GA4/PostHog/GTM/cookie banner SDKs.
- `.planning/PROJECT.md` — Constraints §Legal (CAN-SPAM, GDPR-friendly minimum); Lifecycle constraint (audience portable for cutover).
- `.planning/REQUIREMENTS.md` §Legal/Compliance (LEGAL-01..08), §Analytics & Cookie Posture (ANLY-01..06), §SEO/Open Graph (SEO-01..08).
- `.planning/ROADMAP.md` §"Phase 5: Legal + SEO + Analytics" — five success criteria, especially SC #1 (privacy + terms live with project-specific content), SC #2 (OG render verified through opengraph.xyz / X / LinkedIn), SC #3 (sitemap + robots + JSON-LD), SC #4 (server-side track events), SC #5 (zero non-essential cookies).
- `.planning/STATE.md` §Blockers/Concerns — "Phase 5 decision: explicit AI-crawler allow/deny decision for `robots.ts`" — D-05 resolves this.
- `.planning/research/SUMMARY.md` §"Phase 5" + §"Conflict Resolution" §4 (no marketing cookies / no banner ever in v1) + §Research Flags ("privacy-policy version snapshot mechanism design decision (recommend build-time git SHA from privacy MDX file)") — D-12 resolves this with a content-hash variant.
- `.planning/research/STACK.md` — Vercel Analytics ^1, Vercel Speed Insights ^1, `@vercel/og` (built into Next.js).
- `.planning/research/PITFALLS.md` — deliverability pitfalls already addressed in Phase 4; Phase 5 inherits CAN-SPAM postal-address compliance.
- `.planning/research/ARCHITECTURE.md` — `lib/analytics.ts` swap pattern.

### Prior phase context (this repo)
- `.planning/phases/04-resend-wiring-bot-protection-welcome-email/04-CONTEXT.md` — **must-read.**
  - **D-CD-03:** `consent_version` Phase 4 placeholder (`process.env.VERCEL_GIT_COMMIT_SHA ?? 'pre-phase-5'`) — Phase 5 D-12/D-14 swaps this for real mechanism. **Property name `consent_version` does NOT change** — only the value source.
  - **D-04:** `RESEND_FROM_POSTAL_ADDRESS` env var already provisioned for welcome-email footer; Phase 5 D-04 reuses this for privacy footer.
  - **CD-09:** Fire-and-forget welcome email already fires `track('welcome_email_send_error')`; Phase 5 swaps the `track()` body without changing call sites.
- `.planning/phases/02-static-landing-page-no-form/02-CONTEXT.md` — Footer hrefs `/privacy` + `/terms` locked (D-19); Phase 5 wires the routes WITHOUT touching `components/sections/footer.tsx` (D-27).
- `.planning/phases/01-scaffold-brand-token-parity/01-CONTEXT.md` — env validation strategy (D-07/D-08/D-10/D-11): every env var enumerated in `lib/env.ts`, hard-crash on missing, custom ESLint rule blocks direct `process.env.X` access. Phase 5 inherits — `lib/consent-version.ts` does NOT need new env vars; reads file contents directly via `fs.readFileSync`.
- `app/layout.tsx` — current metadata block (`metadataBase`, `title.template`, `description`, `openGraph.type/url`); Phase 5 extends this in place.
- `app/page.tsx` — section composition (locked Phase 2 D-16); Phase 5 may inject Schema.org JSON-LD here per CD-02.
- `components/sections/footer.tsx` — DO NOT TOUCH (Phase 2 D-19/D-27); hrefs `/privacy` + `/terms` already correct.
- `components/sections/waitlist-form-section.tsx` — Phase 5 adds consent microcopy (LEGAL-06) and reassurance copy (LEGAL-07) below the form button.
- `lib/env.ts` — already enumerates `RESEND_FROM_POSTAL_ADDRESS`; Phase 5 does NOT add new env vars.
- `lib/analytics.ts` — `console.log`-based shim with locked `TrackEvent` union; Phase 5 swaps body to `@vercel/analytics/server` `track()`.
- `app/actions/join-waitlist.ts` lines 138-146 — current `consentVersion` stub computation; Phase 5 D-14 swaps to `import { CONSENT_VERSION } from '@/lib/consent-version'`.

### Marketing-app prior art (read for pattern reference, not copy-paste verbatim)
- `/Users/jeff/repos/marketing-app/app/(public)/privacy/page.tsx` — 282-line hand-written TSX privacy page. Source for D-01 adaptation: structure (Introduction, Information We Collect, How We Use, Sharing, Retention, Your Rights, Updates, Contact), Tailwind class conventions (`max-w-3xl mx-auto px-4 py-16`, `font-heading text-4xl font-bold`, `space-y-4 mb-10` per section), "Last updated: April 2026" header pattern. **Strip the brand-info / content-data / Stripe sections — those describe full-app flows.**
- `/Users/jeff/repos/marketing-app/app/(public)/cookies/page.tsx` — 155-line cookies disclosure. **Useful as reference for Vercel Analytics cookieless explanation language**, but the pre-launch landing has no cookies to disclose; consider whether to merge a cookieless paragraph into privacy.tsx or skip the cookies route entirely (recommended: merge, no separate `/cookies` route).
- `/Users/jeff/repos/marketing-app/app/sitemap.ts` — sitemap.ts pattern reference.
- `/Users/jeff/repos/marketing-app/app/robots.ts` — robots.ts pattern reference. **Note**: marketing-app's AI-crawler decision may differ — Phase 5 D-05 stands independent.
- `/Users/jeff/repos/marketing-app/app/(public)/opengraph-image.tsx` — `ImageResponse` pattern reference for layout, font fetching, and brand-token application.

### External docs
- [Next.js 16 `app/opengraph-image`](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image) — file convention, `ImageResponse` API, font handling.
- [Next.js 16 `app/robots.ts`](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots) — `MetadataRoute.Robots` typed return.
- [Next.js 16 `app/sitemap.ts`](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap) — `MetadataRoute.Sitemap` typed return.
- [Next.js 16 metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) — `Metadata` type, OG/Twitter card fields, JSON-LD recommendations.
- [`@vercel/analytics` docs](https://vercel.com/docs/analytics) — `<Analytics />` mount, `track()` server-side import path (`@vercel/analytics/server`), cookieless privacy posture.
- [`@vercel/speed-insights` docs](https://vercel.com/docs/speed-insights) — `<SpeedInsights />` mount, real-user metrics.
- [Schema.org Organization](https://schema.org/Organization) + [WebSite](https://schema.org/WebSite) — JSON-LD properties for SEO-08.
- [GDPR Art. 6(1)(a)](https://gdpr-info.eu/art-6-gdpr/) — consent as lawful basis for email collection.
- [FTC CAN-SPAM Compliance Guide](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business) — postal-address requirement (already EMAIL-05; LEGAL inherits).
- [GPTBot / ClaudeBot / Google-Extended / PerplexityBot / CCBot user-agent docs](https://platform.openai.com/docs/gptbot) — verify exact User-Agent strings during planning (researcher confirms current as of 2026-04).
- [opengraph.xyz](https://www.opengraph.xyz/) + [X Card validator](https://cards-dev.twitter.com/validator) + [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) — manual verification surfaces for SC #2.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`lib/env.ts`** — `RESEND_FROM_POSTAL_ADDRESS` already validated with production-placeholder Zod refine. Privacy page imports and renders directly.
- **`lib/analytics.ts`** — `track()` function and `TrackEvent` union are the locked contract. Phase 5 swaps the body (`console.log` → `vercelTrack`) without touching the signature, the union, or any call site.
- **`app/layout.tsx`** — already has Quicksand + Figtree `next/font/google` mounted, `metadataBase: new URL("https://useQuibly.com")`, base `metadata` object, and `<Toaster />` mount. Phase 5 extends `metadata` and inserts `<Analytics />` + `<SpeedInsights />` siblings before `</body>`.
- **`public/quibs-icon.svg`** — Quibs mascot used for OG image render and favicon/apple-touch-icon derivation.
- **`components/sections/footer.tsx`** — `/privacy` + `/terms` hrefs already wired; Phase 5 makes the routes resolve. **DO NOT TOUCH this file** (Phase 2 D-27).
- **`app/page.tsx`** — composition of sections; possible JSON-LD injection point per CD-02.

### Established Patterns
- **Hard-crash env validation** (Phase 1 D-08/D-10/D-11) — Phase 5 inherits. `lib/consent-version.ts` reads files via `fs.readFileSync` (NOT env vars); no new `lib/env.ts` entries.
- **`import 'server-only'` boundary** (Phase 1 D-09) — `lib/consent-version.ts` adds `import 'server-only'` as line 1 (file reads happen at module load on the server).
- **`server-only` already on `lib/analytics.ts`** — Phase 5 swap preserves it; `@vercel/analytics/server` is the server export and is server-only by design.
- **Custom ESLint `no-raw-process-env` rule** (Phase 1 Plan 04) — Phase 5 doesn't introduce new `process.env.X` reads. The two `eslint-disable-next-line` comments around `consentVersion` in `app/actions/join-waitlist.ts` are removed when D-14 swaps to `import { CONSENT_VERSION }`.
- **TSX page convention** (Phase 2/3) — privacy + terms follow the same pattern: `import type { Metadata }`, `export const metadata`, default-exported function component, Tailwind classes for typography. No MDX, no typography plugin.
- **GitHub Actions CI gates** (Phase 2 D-33/D-34, Phase 3 D-18) — Phase 5 doesn't add a new gate. Existing Lighthouse mobile ≥90 + Vitest + Playwright workflows continue to apply. PERF-01..03 must hold after the bundle adds Vercel Analytics + Speed Insights — verify in PR (~1.6 KB combined script per CLAUDE.md should not regress LCP).
- **`gitleaks` pre-commit hook** (Phase 1 Plan 04) — already covers Resend/Upstash patterns; Phase 5 introduces no new secret patterns to gate.

### Integration Points
- **`app/(legal)/privacy/page.tsx`** (NEW) — adapted TSX; route resolves `/privacy`. Renders `{env.RESEND_FROM_POSTAL_ADDRESS}` in contact section; static "Last updated: <ISO-date>" header.
- **`app/(legal)/terms/page.tsx`** (NEW) — fresh TSX; route resolves `/terms`.
- **`app/(legal)/layout.tsx`** (NEW, optional) — shared layout for legal pages if Claude picks the route group (CD-01); inherits root layout otherwise.
- **`lib/consent-version.ts`** (NEW) — `import 'server-only'`; `fs.readFileSync` of privacy.tsx + terms.tsx; `crypto.createHash('sha256')`; exports `CONSENT_VERSION` constant (8-char hex prefix).
- **`app/actions/join-waitlist.ts`** (MODIFY) — line ~146: replace `process.env.VERCEL_GIT_COMMIT_SHA ?? 'pre-phase-5'` with `import { CONSENT_VERSION } from '@/lib/consent-version'`. Strip the surrounding `eslint-disable-next-line custom/no-raw-process-env` comment for that read (the audience-routing read on line ~142 keeps its disable comment).
- **`app/opengraph-image.tsx`** (NEW) — `next/og` `ImageResponse`; default-exported async function; mascot-left + tagline-right composition; teal-gradient background; Quicksand + Figtree TTF fonts.
- **`app/twitter-image.tsx`** — NOT created. Twitter Card uses OG image via metadata `twitter.card = 'summary_large_image'` + `twitter.images = [og-image-url]`.
- **`app/icon.tsx` or `app/favicon.ico`** + **`app/apple-touch-icon.png`** (NEW) — Quibs Q-face derivation. Claude picks file-convention vs static during planning.
- **`app/robots.ts`** (NEW) — `MetadataRoute.Robots` array of rules: 5 named AI crawlers each `Allow: /`, sitemap reference.
- **`app/sitemap.ts`** (NEW) — `MetadataRoute.Sitemap` array of 3 entries: `/`, `/privacy`, `/terms`.
- **`app/layout.tsx`** (MODIFY) — extend `metadata` (description tightening, OG image reference, Twitter card meta); add `<Analytics />` + `<SpeedInsights />` before `</body>`.
- **`app/page.tsx`** (MODIFY, possibly) — JSON-LD `<script type="application/ld+json">` injection per CD-02; Claude picks insertion point.
- **`components/sections/waitlist-form-section.tsx`** (MODIFY) — add LEGAL-06 consent microcopy + LEGAL-07 reassurance copy below the form button.
- **`lib/analytics.ts`** (MODIFY) — body swap only; `track()` signature and `TrackEvent` union locked.
- **`package.json`** (MODIFY) — add `@vercel/analytics` ^1 + `@vercel/speed-insights` ^1.
- **`vitest.config.ts`** — Phase 5 may add unit tests for `lib/consent-version.ts` (deterministic hash given fixed file contents) and one assertion in the existing `join-waitlist` test that consent_version comes from the new export.
- **Playwright e2e** — Phase 5 may add a smoke test: `/privacy` returns 200 with H1 "Privacy Policy"; `/terms` returns 200; `/sitemap.xml` lists 3 URLs; `/robots.txt` contains GPTBot allow rule. Verifies SC #1 + SC #3.

</code_context>

<specifics>
## Specific Ideas

- **`consent_version` is the contract continuation from Phase 4.** The property name in Resend `properties.consent_version` does NOT change — only the value source. Phase 4 contacts have `'<git-sha>'` or `'pre-phase-5'`; Phase 5 contacts have the 8-char content hash. This is a one-way swap — older contacts keep their old version string in Resend; CSV export at cutover (Phase 6 / launch) will show the version each contact consented to. That's the intended audit trail.
- **Privacy adapted from marketing-app — but narrower.** marketing-app's privacy is a 282-line full-app document covering account, brand info, content data, Stripe payment data. Pre-launch waitlist scope is: email + IP (Vercel logs, 30d) + analytics events (Vercel cookieless). Trim aggressively. Voice/tone matches marketing-app; data scope does not.
- **Terms is a different document than marketing-app's.** marketing-app terms is for paying users / app TOS; pre-launch waitlist's "service" is "we'll email you when we launch." Terms document is short: acceptance of waitlist participation, no service guarantees, may withdraw at any time, governing law (Claude picks reasonable default during planning, founder confirms in PR), contact for disputes.
- **OG image is the most visually demanding piece of Phase 5.** Mascot-left + tagline-right + teal-gradient is the locked composition (D-08); Quicksand for the tagline (D-11). Brand fidelity matters for cold social shares — recipient sees the OG before the page. Get pixel-density right (Vercel renders at 2x by default — verify); test with opengraph.xyz, X Card validator, and LinkedIn Post Inspector before merging (SC #2).
- **Vercel Web Analytics + Speed Insights are ~1.6 KB combined script (CLAUDE.md).** PERF-01..03 (Lighthouse mobile ≥90, CLS <0.1) must hold after the additions. Mount in layout.tsx; verify in PR via the existing Lighthouse CI gate (Phase 2 Plan 05). If Lighthouse regresses, investigate before merging — do NOT lower the gate.
- **Zero-cookie verification (ANLY-05) is a manual launch-gating checkpoint, not a unit test.** Founder/Claude opens fresh-incognito → DevTools → Application/Storage tab → confirms 0 non-essential cookies on a fresh page load. Document in 05-HUMAN-UAT.md (or equivalent). Vercel Analytics is cookieless by design but verify empirically.
- **Schema.org JSON-LD scope is intentionally minimal.** Organization (name, url, logo, description) + WebSite (url, name). No `sameAs` (no social URLs published yet — omit cleanly; don't add empty array). No `potentialAction` Search (no site search exists). Claude picks the exact properties during planning; researcher verifies current Schema.org spec recommendations.
- **The DSAR mailbox `privacy@useQuibly.com` is a founder action item.** Phase 5 plan code references the address in privacy.tsx; provisioning the actual mailbox (Resend Inbound forward, Google Workspace alias, ImprovMX) is a launch-gating checkpoint, NOT Phase 5 code. Phase 6 launch-checklist verifies receipt before exposing the form publicly.
- **Last-updated date for privacy + terms is a STATIC string committed to git.** Pattern: `<p>Last updated: April 29, 2026</p>` — auditable in `git blame`. Dynamic `new Date().toLocaleDateString()` would lose the audit trail (every build would show today's date). On policy edits: founder updates the date string in the same commit; CI catches drift via the consent_version hash bump.
- **No cookies disclosure page (`/cookies`).** marketing-app has one (155 lines) but pre-launch landing has no cookies to disclose. Merge a short "Cookies / Tracking" section into privacy.tsx instead. Reduces surface area and cutover migration cost.

</specifics>

<deferred>
## Deferred Ideas

- **Re-consent prompting UX on consent_version drift** — D-15 records version for audit only. If post-launch traffic surfaces a privacy-policy revision, Phase 7+ may add a banner or modal prompting active subscribers to re-confirm. Pre-launch volume + single-opt-in pattern doesn't justify it.
- **Privacy-policy MDX + frontmatter version** — rejected during discussion (D-02). If post-launch a non-engineer needs to edit policy text frequently, v2 may swap to MDX. Pre-launch: TSX matches marketing-app.
- **Separate `app/twitter-image.tsx`** — D-10 reuses the OG image. If Twitter ever requires distinct cropping (currently doesn't), v2.
- **Env-flag gated robots.ts (`BLOCK_AI_CRAWLERS=true`)** — D-07 keeps it code-only. If founder posture changes post-launch, v1.x flip via PR.
- **Schema.org JSON-LD beyond Organization + WebSite** — `Person` (founder), `BlogPosting` (when blog ships at marketing-app), `Product` (when product ships) all belong to marketing-app post-launch.
- **A/B testing OG image variants** — V2-05 already deferred. Single OG image v1.
- **Cookies disclosure page (`/cookies`)** — folded into privacy.tsx instead of a separate route. Marketing-app has it; pre-launch landing doesn't need it.
- **UTM / referrer / audienceId on `track('waitlist_signup')`** — CD-05 keeps schema minimal in v1. If launch broadcast or paid acquisition drives meaningful traffic, v1.x can extend the property schema without changing the call sites (TrackEvent union is the contract).
- **Vercel Analytics custom-event funnels (form-start → form-submit → success)** — Phase 5 ships the single `waitlist_signup` event. Multi-step funnel observability is post-launch nice-to-have.

</deferred>

---

*Phase: 5-Legal + SEO + Analytics*
*Context gathered: 2026-04-29*
