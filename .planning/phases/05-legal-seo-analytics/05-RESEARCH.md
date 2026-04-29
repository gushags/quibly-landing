# Phase 5: Legal + SEO + Analytics — Research

**Researched:** 2026-04-29
**Domain:** Legal compliance (GDPR/CAN-SPAM), SEO/OG/structured-data, cookieless analytics
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Privacy adapted from `marketing-app/app/(public)/privacy/page.tsx`; terms written fresh. Narrow to waitlist scope: email-only collection, Vercel + Resend as processors, GDPR Art. 6(1)(a) lawful basis, retention "until launch + 12 months," DSAR contact `privacy@useQuibly.com`.
- **D-02:** Plain TSX `page.tsx` format, NOT MDX. Tailwind classes for typography. No `@tailwindcss/typography`.
- **D-03:** Both pages required v1, both pre-launch. Non-negotiable.
- **D-04:** Postal address reuses `RESEND_FROM_POSTAL_ADDRESS` env var. Privacy page imports `{ env }` from `@/lib/env`.
- **D-05:** Allow all named AI crawlers (GPTBot, ClaudeBot, Google-Extended, PerplexityBot, CCBot — all `Allow: /`).
- **D-06:** No explicit rules for Googlebot/Bingbot/Yandex/DuckDuckBot (defaults apply).
- **D-07:** Code-only, hard-coded in `robots.ts`. No env-flag gate.
- **D-08:** OG composition: mascot-left + tagline-right + teal-gradient background.
- **D-09:** Hero tagline verbatim: `"You know your business. Quibly knows how to market it."`
- **D-10:** Single image asset for OG + Twitter. No separate `app/twitter-image.tsx`.
- **D-11:** Quicksand + Figtree TTF/OTF fetched at build time (or checked-in) for `ImageResponse`.
- **D-12:** SHA-256 hash of privacy.tsx + terms.tsx file contents (first 8 hex chars).
- **D-13:** Privacy page displays "Last updated: April 29, 2026" — NOT the hash.
- **D-14:** Single export `{ CONSENT_VERSION }` from `lib/consent-version.ts`. No env var.
- **D-15:** No automatic re-consent prompts in v1.

### Claude's Discretion

- **CD-01:** Privacy page route layout — `app/(legal)/privacy/page.tsx` vs `app/privacy/page.tsx`. Route group is preferred (organizes both pages; URL `/privacy` is identical either way). Claude picks during planning.
- **CD-02:** Schema.org JSON-LD — minimum viable Organization + WebSite. Properties and injection point (`app/page.tsx` vs `app/layout.tsx`) chosen during planning.
- **CD-03:** OG image fonts — Google Fonts build-time fetch vs `public/fonts/*.ttf` checked-in. Researcher resolves: **check-in is recommended** (see Q2 findings).
- **CD-04:** Last-updated date: static string committed to git. Pattern: `<p>Last updated: April 29, 2026</p>`.
- **CD-05:** Analytics event property schema stays minimal (`{ duplicate }`) in v1.
- **CD-06:** `<Analytics />` and `<SpeedInsights />` mount order: siblings before `</body>`, after `<Toaster />`.
- **CD-07:** DSAR mailbox `privacy@useQuibly.com` — founder action item, not Phase 5 code.
- **CD-08:** Retention wording: "We retain your email until Quibly launches plus 12 months thereafter, or until you unsubscribe — whichever comes first."
- **CD-09:** `robots.ts` emit format — Next 16 `MetadataRoute.Robots` (object with `rules` array).

### Deferred Ideas (OUT OF SCOPE)

- Re-consent prompting UX on consent_version drift (D-15 records version for audit only)
- Privacy-policy MDX + frontmatter version (D-02 rejected)
- Separate `app/twitter-image.tsx` (D-10)
- Env-flag gated robots.ts (D-07)
- Schema.org beyond Organization + WebSite (post-launch scope)
- A/B testing OG image variants
- Cookies disclosure page (folded into privacy.tsx)
- UTM / referrer / audienceId on `track('waitlist_signup')` (CD-05)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LEGAL-01 | `/privacy` page live before form exposed to public | TSX RSC pattern documented; no blockers |
| LEGAL-02 | `/terms` page live before form exposed | Fresh TSX content; short TOS for waitlist scope |
| LEGAL-03 | Privacy lists Vercel (Analytics + Speed Insights) and Resend as processors | Both confirmed cookieless/privacy-compliant; named in template |
| LEGAL-04 | Privacy declares lawful basis = consent GDPR Art. 6(1)(a) + retention policy | GDPR minimum disclosure list documented in Q6 |
| LEGAL-05 | Privacy + terms links in footer on every page | Footer already wired (Phase 2 D-19); routes just need to resolve |
| LEGAL-06 | Consent microcopy under form button | UI-SPEC prescribes exact HTML; research confirms placement |
| LEGAL-07 | "No spam, unsubscribe anytime" near form | Paired with LEGAL-06 in one `<div>` block |
| LEGAL-08 | DSAR contact published in privacy | `privacy@useQuibly.com` in privacy page; mailbox provisioning is founder task |
| SEO-01 | `<title>` and `<meta name="description">` via Next.js metadata API | Existing `layout.tsx` already has this; Phase 5 tightens description |
| SEO-02 | Open Graph tags (og:title, og:description, og:image, og:url, og:type) | `metadata.openGraph` shape documented; code example in Q8 |
| SEO-03 | Twitter Card tags (`summary_large_image`) | `metadata.twitter` shape documented; code example in Q8 |
| SEO-04 | 1200×630 OG image with mascot + tagline | `app/opengraph-image.tsx` + `ImageResponse`; font strategy resolved in Q2 |
| SEO-05 | `favicon.ico` and `apple-touch-icon` from Quibs Q-face | Static asset approach recommended; planner picks file convention |
| SEO-06 | `robots.ts` with explicit AI-crawler decision | `MetadataRoute.Robots` shape + bot list documented in Q3 |
| SEO-07 | `sitemap.ts` listing `/`, `/privacy`, `/terms` | `MetadataRoute.Sitemap` shape documented; 3-entry approach |
| SEO-08 | Schema.org JSON-LD (Organization + WebSite) | Minimum properties and injection pattern documented in Q4 |
| ANLY-01 | Vercel Web Analytics mounted (cookieless) | Confirmed cookieless; import `Analytics` from `@vercel/analytics/next` |
| ANLY-02 | Vercel Speed Insights mounted | Confirmed cookieless; import `SpeedInsights` from `@vercel/speed-insights/next` |
| ANLY-03 | Server-side `track('waitlist_signup', { duplicate })` | Import path `@vercel/analytics/server` confirmed; `await track()` in Server Actions |
| ANLY-04 | Server-side `track('welcome_email_send_error', { contactId })` | Same import path; existing call site continues unchanged |
| ANLY-05 | Zero non-essential cookies verified in DevTools | Vercel Analytics + Speed Insights confirmed no cookies; manual check documented |
| ANLY-06 | No GA4/PostHog/Meta Pixel/etc. | Confirmed by package.json audit; no prohibited packages present |
</phase_requirements>

---

## Summary

Phase 5 is predominantly configuration and file-convention work: create two legal pages, wire metadata/OG/sitemap/robots, swap a one-function analytics shim, and add two layout mounts. The highest-complexity deliverable is `app/opengraph-image.tsx` — font binary loading inside `ImageResponse` requires checked-in TTF files rather than runtime Google Fonts fetches, and the mascot must be rendered via an `<img src={base64}>` pattern rather than inline SVG (Satori's SVG support is limited). The `lib/consent-version.ts` mechanism using `fs.readFileSync` is fully supported on Vercel Node 24 at module load time, with one important path-safety note for the `(legal)` route group.

All external dependencies are already in the project (`@vercel/og` in devDeps; `@vercel/analytics` and `@vercel/speed-insights` need adding). Vercel Analytics is genuinely cookieless — no `_vercel*` cookies are set; visitor sessions use a daily-rotating hash derived from the request, discarded after 24 hours. The server-side `track()` import path is `@vercel/analytics/server` and `await track(event, properties)` works verbatim inside Server Actions in Next.js 16. No provider configuration is required — the package auto-detects the Vercel environment.

The Anthropic crawler landscape expanded in 2026: three distinct bots now exist (ClaudeBot for training, Claude-SearchBot for search indexing, Claude-User for real-time retrieval). D-05 says "allow ClaudeBot" — the planner should include all three Anthropic bot names to match the intent of allowing Anthropic AI surface area, since blocking ClaudeBot alone does not restrict the other two. CAN-SPAM classification of the pre-launch welcome email as "commercial" is confirmed; Phase 4 already handled the postal-address requirement.

**Primary recommendation:** Follow D-11's decision to check Quicksand and Figtree TTF files into `public/fonts/` rather than fetching from Google Fonts at image-generation time. This eliminates cold-start latency, removes a network dependency from the Vercel build sandbox, and is the pattern shown in Next.js 16's official `opengraph-image` documentation.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| `/privacy` + `/terms` pages | Server (Next.js RSC) | — | Static prose RSCs; no client JS, no interactivity |
| Consent microcopy | Browser (rendered by RSC or Client Component) | — | Text rendered inside the existing waitlist form section |
| `lib/consent-version.ts` hash | Server (module load) | — | `fs.readFileSync` is server-only; `import 'server-only'` guard required |
| `app/opengraph-image.tsx` | Server (Next.js Route Handler, Node runtime) | — | Uses `node:fs` for font loading; Edge runtime cannot use `process.cwd()` |
| `app/robots.ts` + `app/sitemap.ts` | Server (Next.js Route Handlers) | — | File-convention emitters, cached at build |
| Schema.org JSON-LD | Server (RSC page) | — | Static script tag injected from `app/page.tsx`; no hydration |
| `<Analytics />` + `<SpeedInsights />` | Browser (script tags) | Server (track() call) | Client mounts load async scripts; server `track()` sends events server-side |
| `track()` in Server Actions | Server (Server Action) | — | `@vercel/analytics/server` import; no client involvement |

---

## Standard Stack

### Core (already in project or built-in)

| Library | Version | Purpose | Source |
|---------|---------|---------|--------|
| `next` | `16.2.x` | `ImageResponse` from `next/og` (built-in), `MetadataRoute.Robots/Sitemap` | [VERIFIED: npm registry] |
| `@vercel/og` | `^0.11.1` (devDep, already present) | Provides `ImageResponse` for build; also exposed via `next/og` | [VERIFIED: package.json] |
| `crypto` (Node.js built-in) | n/a | `createHash('sha256')` for consent_version | [VERIFIED: Node 24 built-in] |
| `fs` (Node.js built-in) | n/a | `readFileSync` in `lib/consent-version.ts`; `readFile` in OG image | [VERIFIED: Node 24 built-in] |

### Adding in Phase 5

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| `@vercel/analytics` | `^2.0.1` (latest; ^1 spec in CLAUDE.md) | `<Analytics />` client mount + `track()` server-side | [VERIFIED: npm registry 2026-04-29] |
| `@vercel/speed-insights` | `^2.0.0` (latest; ^1 spec in CLAUDE.md) | `<SpeedInsights />` client mount | [VERIFIED: npm registry 2026-04-29] |

**Version note:** npm shows 2.0.1 / 2.0.0 as current latest. CLAUDE.md says `^1` — the `^` semver range does NOT include a major bump, so `^1.x` will install the latest 1.x. Planner must decide: pin `^1` (matching CLAUDE.md spec exactly) or upgrade to `^2`. The v2 difference is "Resilient Intake" (randomized script URL, enhanced ad-blocker resistance). For Phase 5's server-side `track()` use case, v1 and v2 behave identically. **Recommendation: pin `^1` to match CLAUDE.md spec and avoid unplanned major version changes.**

**Installation:**
```bash
npm install @vercel/analytics@^1 @vercel/speed-insights@^1
```

---

## Architecture Patterns

### Pattern 1: `@vercel/analytics/server` track() in a Server Action

**What:** Import `track` from `@vercel/analytics/server` (not `@vercel/analytics`). Call `await track(event, properties)` inside Server Actions or Route Handlers.

**Verified:** Official Vercel docs confirmed — this exact pattern is documented for `'use server'` functions.

**Auto-detection:** The package auto-detects the Vercel environment via the `VERCEL_ANALYTICS_ID` or related system env vars. It no-ops gracefully in local development (logs nothing; does not throw). No explicit provider configuration is needed in `app/layout.tsx` for server-side calls.

**Deployment Protection caveat:** If Vercel Deployment Protection is enabled on preview deployments, server-side `track()` will receive 401s because `/_vercel/insights/event` is protected. Resolution: add `VERCEL_AUTOMATION_BYPASS_SECRET` to project settings. This affects preview builds only; production is unaffected. Phase 5 does not gate on this (preview tracking is nice-to-have).

```typescript
// lib/analytics.ts — Phase 5 body swap (signature unchanged)
import 'server-only'
import { track as vercelTrack } from '@vercel/analytics/server'

export type TrackEvent =
  | 'waitlist_signup'
  | 'signup_rejected'
  | 'welcome_email_send_error'
  | 'contact_bounced'
  | 'contact_complained'

export async function track(
  event: TrackEvent,
  properties?: Record<string, unknown>,
): Promise<void> {
  await vercelTrack(event, properties)
}
```

**Source:** [CITED: vercel.com/docs/analytics/custom-events]

### Pattern 2: `<Analytics />` and `<SpeedInsights />` mount in `app/layout.tsx`

**Import paths (critical — wrong import breaks route tracking):**
```typescript
import { Analytics } from '@vercel/analytics/next'   // NOT /react
import { SpeedInsights } from '@vercel/speed-insights/next'
```

**Placement:** Both components go as siblings before `</body>`. The `<Analytics />` component renders an async script tag; it does NOT require `'use client'` on the layout file and does not break SSR.

```typescript
// app/layout.tsx (Phase 5 additions only — append inside <body>)
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

// Inside <body> after {children} and <Toaster />:
<Analytics />
<SpeedInsights />
```

**Source:** [CITED: vercel.com/docs/analytics/quickstart] [CITED: vercel.com/docs/frameworks/full-stack/nextjs]

### Pattern 3: `lib/consent-version.ts` — `fs.readFileSync` at module load

**What:** Read both legal page files at module load time, compute a stable SHA-256 hash. The hash changes only when policy text changes.

**Vercel support confirmed:** Vercel serverless functions support `fs.readFileSync` via `process.cwd()`. The key requirement is that the file path must be resolvable at bundle time — Next.js's Node File Tracer must include the files. Because `app/(legal)/privacy/page.tsx` and `app/(legal)/terms/page.tsx` are already traced by the Next.js compiler (they are Next.js page modules), they will be included in the Vercel bundle automatically. No `outputFileTracingIncludes` configuration is needed.

**Path safety with `(legal)` route group:** Parentheses are valid Unix filename characters. `path.join(process.cwd(), 'app/(legal)/privacy/page.tsx')` works without escaping on both macOS and Vercel's Linux build environment.

**Line ending normalization (critical pitfall):** Windows dev machines produce CRLF (`\r\n`); Vercel builds on Linux produce LF (`\n`). Hash computed on CRLF content != hash computed on LF content — producing different consent_version values for identical policy text. **Must normalize before hashing.**

```typescript
// lib/consent-version.ts
import 'server-only'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function readAndNormalize(filePath: string): string {
  const raw = readFileSync(join(process.cwd(), filePath), 'utf8')
  return raw.replace(/\r\n/g, '\n')  // normalize CRLF → LF before hashing
}

const privacyContent = readAndNormalize('app/(legal)/privacy/page.tsx')
const termsContent = readAndNormalize('app/(legal)/terms/page.tsx')

export const CONSENT_VERSION = createHash('sha256')
  .update(privacyContent + termsContent)
  .digest('hex')
  .slice(0, 8)
```

**Source:** [CITED: vercel.com/kb/guide/how-can-i-use-files-in-serverless-functions]

### Pattern 4: `app/opengraph-image.tsx` — checked-in TTF fonts + Node runtime

**Runtime decision (CD-03 resolved):** Use `export const runtime = 'nodejs'` (NOT `'edge'`). The Node runtime supports `node:fs/promises` `readFile` + `process.cwd()` for loading local TTF files. The Edge runtime does not support `process.cwd()` or `node:fs` — using Edge would require fetching fonts from a URL at every invocation, creating a network dependency in the Vercel build sandbox.

The marketing-app's `opengraph-image.tsx` already exports `runtime = 'nodejs'` — this is the correct pattern.

**Font strategy (CD-03 resolution):** Check Quicksand and Figtree TTF binaries into `public/fonts/` (or `assets/fonts/`). Use `node:fs/promises` `readFile` with `join(process.cwd(), 'public/fonts/Quicksand-Bold.ttf')`. Benefits: zero network dependency, deterministic builds, no cold-start latency from external fetch.

**OFL licensing confirmation:** Both Quicksand and Figtree are licensed under SIL OFL 1.1. The OFL explicitly permits distribution of font binaries in projects (both commercial and non-commercial). Checking TTF files into git is permitted. The only OFL restriction that matters here: do not sell the font files alone as a standalone product. [CITED: fontsquirrel.com/license/quicksand]

**Font weights needed for ImageResponse:**
- Quicksand Bold (700) — for the 64px tagline
- Figtree Medium (500) — for the 28px wordmark

These are two separate TTF files. Google Fonts provides variable fonts for browser use (`next/font/google`), but `ImageResponse` requires static-weight TTF binaries. Download the specific weight variants (e.g., `Quicksand_700.ttf`, `Figtree_500.ttf`) from Google Fonts or use the `@fontsource` npm packages that already include TTF binaries by weight.

**Mascot rendering in ImageResponse:** Inline SVG elements inside `ImageResponse` JSX have limited support via Satori (the underlying renderer). The safest approach is to read `public/quibs-icon.svg` as a base64 data URI and use `<img src={dataUri} />` inside the JSX. The `@ts-expect-error` directive may be needed for `ArrayBuffer` src — use base64 string instead for type safety.

```typescript
// app/opengraph-image.tsx
import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Quibly — You know your business. Quibly knows how to market it.'

export default async function OgImage() {
  const [quicksandBold, figtreeMedium, mascotRaw] = await Promise.all([
    readFile(join(process.cwd(), 'public/fonts/Quicksand-Bold.ttf')),
    readFile(join(process.cwd(), 'public/fonts/Figtree-Medium.ttf')),
    readFile(join(process.cwd(), 'public/quibs-icon.svg'), 'base64'),
  ])

  const mascotSrc = `data:image/svg+xml;base64,${mascotRaw}`

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%' }}>
        {/* Left column: teal gradient + mascot */}
        <div style={{
          display: 'flex', width: '40%', height: '100%',
          background: 'linear-gradient(135deg, oklch(0.6002 0.1038 184.704), oklch(0.50 0.1038 184.704))',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <img src={mascotSrc} width={180} height={180} />
        </div>
        {/* Right column: white + tagline */}
        <div style={{
          display: 'flex', flexDirection: 'column', width: '60%', height: '100%',
          background: '#ffffff', justifyContent: 'center', paddingLeft: 64, paddingRight: 48,
        }}>
          <div style={{ fontSize: 64, fontFamily: 'Quicksand', fontWeight: 700,
            color: '#0a0a0a', lineHeight: 1.15, marginBottom: 16 }}>
            You know your business. Quibly knows how to market it.
          </div>
          <div style={{ fontSize: 28, fontFamily: 'Figtree', fontWeight: 500, color: '#555555' }}>
            useQuibly.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Quicksand', data: quicksandBold, style: 'normal', weight: 700 },
        { name: 'Figtree', data: figtreeMedium, style: 'normal', weight: 500 },
      ],
    }
  )
}
```

**Note:** ImageResponse renders at the exported `size` (1200×630). The output PNG is the canonical image for all platforms; there is no "2x retina" multiplication — the 1200px width already satisfies retina density at the display sizes social platforms use (typically 600px rendered = 2x at 1200px source).

**Source:** [CITED: nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image]

### Pattern 5: `app/robots.ts` — `MetadataRoute.Robots` with multiple user agents

**Type signature (verified):**
```typescript
type Robots = {
  rules: Array<{
    userAgent: string | string[]
    allow?: string | string[]
    disallow?: string | string[]
    crawlDelay?: number
  }>
  sitemap?: string | string[]
}
```

**Multiple user agents:** Each crawler gets its own rule object (not a combined `userAgent: ['GPTBot', 'ClaudeBot']` array) because D-05 says "each AI crawler gets its own rule object" and because separate rule objects produce cleaner `robots.txt` output with distinct `User-agent:` directives that are more readable for compliance review.

```typescript
// app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'Claude-SearchBot', allow: '/' },
      { userAgent: 'Claude-User', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'CCBot', allow: '/' },
    ],
    sitemap: 'https://useQuibly.com/sitemap.xml',
  }
}
```

**Source:** [CITED: nextjs.org/docs/app/api-reference/file-conventions/metadata/robots]

### Pattern 6: `app/sitemap.ts` — three-page `MetadataRoute.Sitemap`

```typescript
// app/sitemap.ts
import type { MetadataRoute } from 'next'

const BASE_URL = 'https://useQuibly.com'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]
}
```

**`lastModified: new Date()`** is acceptable — Next.js renders this at build time. Google does not penalize for "too fresh" lastModified; it uses the value to determine crawl frequency, not page validity. [CITED: nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap]

**`changeFrequency` and `priority`** are optional per the type definition and per Google's current treatment (Google officially ignores `changeFrequency` and `priority` in most cases). Include them for completeness with other crawlers that do honor them.

### Pattern 7: Schema.org JSON-LD via `dangerouslySetInnerHTML` in `app/page.tsx`

**Injection point decision (CD-02):** Inject from `app/page.tsx` (home page only), NOT from `app/layout.tsx`. Organization + WebSite JSON-LD describes the home page entity — not every page. Injecting site-wide from `layout.tsx` causes the same JSON-LD to appear on `/privacy` and `/terms`, where it is irrelevant and potentially misleading.

**XSS safety pattern (official Next.js 16 recommendation):**
```tsx
// In app/page.tsx, above the return sections:
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': ['Organization', 'WebSite'],  // use @graph or separate objects — see below
}
```

Two separate JSON-LD `<script>` tags (one Organization, one WebSite) is cleaner than a combined `@graph` for a 3-page site. The official Next.js docs show single-type objects with `@type`. Use two separate `<script>` tags:

```tsx
// app/page.tsx (addition, before section components)
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Quibly',
  url: 'https://useQuibly.com',
  logo: 'https://useQuibly.com/quibs-icon.svg',
  description: 'Strategy-first AI marketing for solopreneurs and small teams.',
}

const webSiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Quibly',
  url: 'https://useQuibly.com',
}

// Inside return JSX (before <main>):
<>
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(organizationJsonLd).replace(/</g, '<'),
    }}
  />
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(webSiteJsonLd).replace(/</g, '<'),
    }}
  />
  <main className="flex flex-col">
    {/* existing sections */}
  </main>
</>
```

**Logo property:** Use `https://useQuibly.com/quibs-icon.svg` (the square Quibs Q-face icon), NOT the OG image. Google's logo requirements specify minimum 112×112px and recommend a square or nearly-square image on a white background — the OG image (1200×630) is rectangular, designed for social cards. The square icon satisfies the logo-in-SERP use case. The SVG is already in `public/` and is crawlable at this URL.

**No `sameAs`:** D-02 / CD-02 — no social handles published yet. Omit cleanly rather than including an empty array.

**Source:** [CITED: nextjs.org/docs/app/api-reference/functions/generate-metadata — json-ld guide] [CITED: developers.google.com/search/docs/appearance/structured-data/organization]

### Pattern 8: metadata extension in `app/layout.tsx`

The current `metadata` object is sparse. Phase 5 extends it:

```typescript
// app/layout.tsx — replace existing metadata export
export const metadata: Metadata = {
  metadataBase: new URL('https://useQuibly.com'),
  title: {
    template: '%s | Quibly',
    default: 'Quibly — AI Marketing for Solopreneurs',
  },
  description: 'Strategy-first AI marketing for solopreneurs and small teams. Join the waitlist.',
  openGraph: {
    type: 'website',
    url: 'https://useQuibly.com',
    siteName: 'Quibly',
    locale: 'en_US',
    // og:image is provided by app/opengraph-image.tsx (Next.js file convention)
    // No need to set openGraph.images here — Next.js merges them automatically
  },
  twitter: {
    card: 'summary_large_image',
    // twitter:image is inherited from opengraph-image.tsx via the file convention
    // Set creator only if founder has a public X handle; omit cleanly otherwise
  },
}
```

**Note on OG image:** Because `app/opengraph-image.tsx` exists at the root, Next.js automatically emits `og:image` and `twitter:image` meta tags pointing to `/opengraph-image`. You do NOT need to manually set `openGraph.images` in `metadata` — the file convention and the `metadata` export are merged by Next.js. Setting both would cause duplicate `og:image` tags. [CITED: nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image]

**Twitter/X card (2026):** `summary_large_image` renders correctly on X as of 2026-04. The X Card validator at `cards-dev.twitter.com/validator` still works (no API change). `twitter:image:alt` is optional (no requirement); recommended for accessibility. [CITED: nextjs.org docs Twitter metadata section]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OG image rendering | Custom canvas/puppeteer | `ImageResponse` from `next/og` | Built into Next 16; no extra deps; 2× faster in 16.2 |
| Visitor analytics | Custom event pipeline | `@vercel/analytics/server` track() | Free on Vercel, cookieless, no consent banner needed |
| Performance metrics | Custom RUM script | `@vercel/speed-insights` | Free, cookieless, captures LCP/CLS/INP from real users |
| Sitemap generation | Custom XML template string | `MetadataRoute.Sitemap` in `app/sitemap.ts` | Type-safe, auto-served at `/sitemap.xml`, cached |
| Robots.txt | Static file in `/public/robots.txt` | `MetadataRoute.Robots` in `app/robots.ts` | Type-safe, computed from config, avoids stale static file |
| SHA-256 hashing | npm package (crypto-js, etc.) | `node:crypto` built-in | Node 24 built-in; zero dep; same API |
| Font loading for ImageResponse | Google Fonts runtime fetch | Checked-in TTF binaries | No network dep at build; deterministic; OFL permits |

---

## Common Pitfalls

### Pitfall 1: CRLF Line Endings Break Consent Version Hash

**What goes wrong:** `CONSENT_VERSION` differs between Windows dev builds and Vercel (Linux) production builds for identical policy text. This causes every contact on Windows-built deploys to have a different `consent_version` than contacts from Vercel-built deploys.

**Why it happens:** `fs.readFileSync` returns the raw bytes. Git on Windows may check out files with CRLF (controlled by `.gitattributes` and core.autocrlf). Vercel builds on Linux always have LF.

**How to avoid:** Normalize line endings before hashing (`.replace(/\r\n/g, '\n')`). Add `.gitattributes` with `*.tsx text=auto` or `*.tsx text eol=lf` to enforce LF on checkout.

**Warning signs:** `consent_version` values differ across deploy environments; `git log --show-signature` shows diverging hashes between macOS/Windows commits.

### Pitfall 2: Wrong `@vercel/analytics` Import Path Breaks Route Tracking

**What goes wrong:** `import { Analytics } from '@vercel/analytics/react'` instead of `@vercel/analytics/next` — page views are recorded, but client-side route transitions (Next.js Link navigation) are not tracked correctly.

**Why it happens:** The `/react` export lacks the Next.js router hooks; the `/next` export wraps the component with Next.js navigation awareness.

**How to avoid:** Always use `@vercel/analytics/next` for the `<Analytics />` component in a Next.js project.

**Warning signs:** Vercel Analytics dashboard shows only initial page loads, not navigations between `/`, `/privacy`, `/terms`.

### Pitfall 3: Server-Side `track()` Fails on Protected Preview Deployments

**What goes wrong:** `track('waitlist_signup')` calls in the Server Action return 401s on preview URLs that have Vercel Deployment Protection enabled.

**Why it happens:** The server-side `track()` function POSTs to `/_vercel/insights/event`, which is blocked by Deployment Protection.

**How to avoid:** Add `VERCEL_AUTOMATION_BYPASS_SECRET` to project settings if preview-deploy event tracking is required. Production (unprotected by default) is unaffected.

**Warning signs:** Server Action logs show `401 Unauthorized` on analytics POSTs in preview environments only.

### Pitfall 4: SVG Inline in `ImageResponse` JSX — Limited Satori Support

**What goes wrong:** Placing `<svg>` JSX directly inside `ImageResponse` fails to render or renders incorrectly because Satori's SVG support is incomplete (it converts its own output to SVG; it doesn't parse arbitrary SVG as input).

**Why it happens:** Satori only supports a subset of CSS and HTML; arbitrary SVG elements are not fully supported.

**How to avoid:** Load the SVG file as a base64 data URI and use `<img src={dataUri} />` inside the `ImageResponse` JSX.

**Warning signs:** OG image renders without the mascot, or throws during build.

### Pitfall 5: `(legal)` Route Group Leaking into URLs

**What goes wrong:** If a route group `(legal)` is accidentally named without parentheses (e.g., `app/legal/privacy/page.tsx`), the route would be `/legal/privacy` — breaking the footer hrefs that point to `/privacy`.

**Why it happens:** Next.js route groups use parentheses in the directory name to create logical groupings without URL segments. If the parentheses are absent, the directory name becomes a URL segment.

**How to avoid:** Verify: `app/(legal)/privacy/page.tsx` → URL `/privacy`. Run `npx playwright test` after creating the routes; the existing smoke test should confirm footer hrefs resolve correctly.

**Warning signs:** `/privacy` returns 404; footer links lead to 404.

### Pitfall 6: `og:image` Tags Duplicated from File Convention + Metadata Object

**What goes wrong:** Setting both `openGraph.images` in `metadata` export AND having `app/opengraph-image.tsx` produces duplicate `<meta property="og:image">` tags.

**Why it happens:** Next.js merges file-convention OG images with metadata-specified ones.

**How to avoid:** Do not set `openGraph.images` in `metadata` when `app/opengraph-image.tsx` exists. The file convention is sufficient.

**Warning signs:** Duplicate `og:image` in page `<head>` visible via DevTools or opengraph.xyz.

### Pitfall 7: `app/opengraph-image.tsx` Runtime Mismatch with Page Runtime

**What goes wrong:** Next.js issue #77796 documents that if `app/page.tsx` uses `export const runtime = 'edge'`, the `app/opengraph-image.tsx` file (which must use Node runtime for `fs.readFile`) causes a conflict.

**Why it happens:** The opengraph-image Route Handler inherits the runtime of the co-located page segment if not explicitly overridden.

**How to avoid:** Explicitly export `export const runtime = 'nodejs'` from `app/opengraph-image.tsx`. The landing page itself does not export any runtime (defaults to Node, which is fine).

**Warning signs:** Build error: "opengraph-image cannot use Node.js APIs in the edge runtime."

### Pitfall 8: `@vercel/analytics` v2 Breaks `^1` Semver Range

**What goes wrong:** Specifying `"@vercel/analytics": "^1"` in `package.json` but running `npm install` with an already-cached v2 lockfile results in v2 being installed. The v1 → v2 "Resilient Intake" change alters the script URL format.

**Why it happens:** Semver `^1` resolves to `>=1.0.0 <2.0.0`. If `package-lock.json` already has v2 locked (e.g., from a previous `npm install --latest`), npm will use the lock.

**How to avoid:** Pin explicitly in `package.json` as `"@vercel/analytics": "^1"` and commit `package-lock.json` after a clean `npm install`. The lock file enforces the resolved version.

---

## AI Crawler User-Agent Strings (Q3 Findings)

D-05 says "Allow all named AI crawlers." The canonical list has expanded since the CONTEXT.md was written — Anthropic now operates three distinct bots:

| Crawler | User-Agent | Purpose | Obeys robots.txt? |
|---------|-----------|---------|-------------------|
| GPTBot | `GPTBot` | OpenAI training | Yes |
| OAI-SearchBot | `OAI-SearchBot` | OpenAI search indexing | Yes |
| ChatGPT-User | `ChatGPT-User` | Real-time retrieval for ChatGPT | Yes |
| ClaudeBot | `ClaudeBot` | Anthropic training | Yes |
| Claude-SearchBot | `Claude-SearchBot` | Anthropic search feature indexing | Yes |
| Claude-User | `Claude-User` | Real-time retrieval for Claude | Yes |
| Google-Extended | `Google-Extended` | Google AI training (Bard/Gemini) | Yes |
| PerplexityBot | `PerplexityBot` | Perplexity indexing | Yes |
| Perplexity-User | `Perplexity-User` | Real-time user-directed retrieval | Partial (may ignore for user-provided URLs) |
| CCBot | `CCBot` | Common Crawl (used by many AI trainers) | Yes |

**D-05 interpretation:** D-05 says "all `Allow: /`" for the named five (GPTBot, ClaudeBot, Google-Extended, PerplexityBot, CCBot). The Anthropic expansion to three bots is relevant: blocking `ClaudeBot` without also allowing `Claude-SearchBot` and `Claude-User` would partially defeat the intent of D-05 (allow AI surface area). **Planner recommendation: include all seven Anthropic/OpenAI/Google/Perplexity/CCBot entries** in the robots.ts rules array, so the `robots.txt` is explicit and auditable.

The `robots.ts` example in Pattern 5 above includes ClaudeBot, Claude-SearchBot, and Claude-User for completeness.

**Source:** [CITED: almcorp.com/blog/anthropic-claude-bots-robots-txt-strategy] [VERIFIED: searchenginejournal.com/anthropics-claude-bots]

---

## GDPR / CAN-SPAM Legal Requirements (Q6 Findings)

### GDPR Art. 13 Minimum Disclosure (EU residents visiting a pre-launch site)

Required in privacy policy when collecting personal data under Art. 6(1)(a) consent:

| Disclosure | Content for Quibly Landing |
|------------|---------------------------|
| Identity of controller | Quibly (operating useQuibly.com) |
| Purpose of processing | Waitlist communication — notify when Quibly launches |
| Lawful basis | Consent (GDPR Art. 6(1)(a)) |
| Data collected | Email address only |
| Recipients / processors | Vercel (hosting, analytics, speed insights), Resend (email delivery and audience storage) |
| Retention period | "Until Quibly launches plus 12 months, or until you unsubscribe — whichever comes first" |
| Right to withdraw consent | "You can unsubscribe at any time via the link in any email we send" |
| DSAR rights | Access, deletion, correction, portability via `privacy@useQuibly.com` |
| Right to complain | To the supervisory authority in your country of residence (for EU users) |

[ASSUMED] The supervisory authority complaint right is standard GDPR Art. 13(2)(d) boilerplate; including a phrase like "You may also lodge a complaint with the data protection authority in your country" is sufficient without naming all 30+ EU authorities.

### CAN-SPAM Classification

The pre-launch welcome email is **commercial** (not transactional) under CAN-SPAM because its primary purpose is a commercial solicitation (inviting the recipient to be notified about a for-sale product). CAN-SPAM requirements applicable:

- Physical postal address: REQUIRED — already handled by Phase 4 (`RESEND_FROM_POSTAL_ADDRESS` env var in welcome email footer)
- Unsubscribe mechanism: REQUIRED — already handled by Phase 4 (`List-Unsubscribe` + `List-Unsubscribe-Post: One-Click` headers)
- Honest subject line: REQUIRED — already handled
- No deceptive routing: REQUIRED — already handled (verified sender domain)

**No new CAN-SPAM work for Phase 5.** Phase 4 covered the compliance requirements. The privacy policy must reference that unsubscribe is honored within 10 business days (CAN-SPAM standard), and welcome email already includes the mechanism.

[CITED: ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business]

---

## Vercel Analytics Cookieless Verification (Q1 Findings)

**Confirmed cookieless:** Vercel Web Analytics does not set cookies. Visitor identification uses a daily-rotating hash derived from the incoming request (not stored in the browser). Session data is discarded after 24 hours. No `_vercel*` cookie is set. No `__cf_bm` or similar third-party cookie either.

**`<Analytics />` SSR safety:** The component renders a `<script>` tag that loads asynchronously. It does NOT require `'use client'` on the layout file. It does NOT block SSR. It does NOT affect LCP.

**Data collected:** Event timestamp, URL, referrer, device OS/version, browser, geolocation (country/state/city), device type, query params (filtered). No IP address stored in Vercel's analytics database; no cross-site tracking.

**GDPR posture:** Vercel has designed Web Analytics to align with leading data protection authority guidance. No personal identifiers stored; no consent banner needed for the analytics component. The privacy policy must disclose Vercel Analytics + Speed Insights as processors (LEGAL-03 requirement) — with the language "cookieless aggregated analytics" to accurately describe the data flow.

**Free tier:** Both Analytics and Speed Insights are free on Vercel's Hobby and Pro plans at standard traffic volumes. Pre-launch traffic (likely < 10k page views/month) fits within free tier limits. [CITED: vercel.com/docs/analytics/privacy-policy]

---

## Twitter/X Card and Platform-Specific OG Notes (Q8 Findings)

**X (Twitter) in 2026:** `twitter:card = summary_large_image` still renders correctly. The X Card validator is still accessible (may require X login). `twitter:image:alt` is optional but recommended for accessibility (add it via the `alt` export from `opengraph-image.tsx`).

**Key metadata omissions (intentional):**
- `twitter:creator` / `twitter:site`: Omit cleanly if founder has no public X handle. Do not add a placeholder or empty string — empty twitter: tags cause validation warnings.
- `article:author`, `og:locale`: `og:locale` should be set to `en_US` in `openGraph` metadata (shown in Pattern 8). `article:author` is for blog posts — not applicable to a landing page.

**LinkedIn / iMessage / Slack:** All major platforms read standard `og:title`, `og:description`, `og:image` without custom tags. No additional platform-specific meta tags are needed.

**iMessage link preview:** Uses `og:image` with no additional configuration. The 1200×630 image renders at approximately 600px wide in iMessage on modern iPhones — the composition must be legible at half-size. The mascot-left + tagline-right layout accommodates this.

---

## Sitemap Conventions (Q7 Findings)

**`lastModified`:** `new Date()` is build-time. Acceptable. Google does not penalize. Other crawlers use it for refresh scheduling — providing it is better than omitting.

**`changeFrequency`:** Google officially ignores this field in 2026 per documented guidance. Include anyway for completeness with other crawlers. Values: `'weekly'` for `/`, `'monthly'` for `/privacy` and `/terms`.

**`priority`:** Also largely ignored by Google, but conventional. Use `1.0` for home, `0.3` for legal pages (legal pages are not conversion surfaces — low crawl priority is appropriate and signals intent to Google).

**`metadataBase` interaction:** `metadataBase: new URL('https://useQuibly.com')` in `layout.tsx` does not affect `sitemap.ts`. The sitemap function must include the full absolute URL itself (e.g., `https://useQuibly.com/privacy`). Do not rely on metadataBase to prefix sitemap URLs — it only affects relative URLs in the `metadata` object.

---

## Validation Architecture

`workflow.nyquist_validation` is `true` in `.planning/config.json` — this section is required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest + @testing-library/react (unit) + Playwright (e2e) |
| Config files | `vitest.config.ts` (exists), `playwright.config.ts` (exists) |
| Quick run (unit) | `npx vitest run` |
| Full suite (unit + e2e) | `npx vitest run && npx playwright test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Status |
|--------|----------|-----------|-------------------|-------------|
| LEGAL-01 | `/privacy` returns 200 | e2e smoke | `npx playwright test --grep "privacy"` | Wave 0 gap |
| LEGAL-02 | `/terms` returns 200 | e2e smoke | `npx playwright test --grep "terms"` | Wave 0 gap |
| LEGAL-03 | Privacy body mentions "Vercel" and "Resend" | e2e assertion | `page.locator('body').filter({ hasText: 'Vercel' })` | Wave 0 gap |
| LEGAL-04 | Privacy body contains GDPR Art. 6(1)(a) language | e2e assertion | `page.locator('body').filter({ hasText: 'consent' })` | Wave 0 gap |
| LEGAL-05 | Footer hrefs `/privacy` + `/terms` resolve | e2e (existing) | Existing Phase 2 Playwright suite | Exists |
| LEGAL-06 | Consent microcopy present below form button | e2e assertion | `page.locator('[data-testid="consent-copy"]')` | Wave 0 gap |
| LEGAL-07 | "No spam" copy present near form | e2e assertion | `page.locator('text=No spam')` | Wave 0 gap |
| LEGAL-08 | DSAR email `privacy@useQuibly.com` in privacy page | e2e assertion | `page.locator('a[href="mailto:privacy@useQuibly.com"]')` | Wave 0 gap |
| SEO-01 | `<title>` and `<meta name="description">` present | e2e | `page.title()` + head query | Wave 0 gap |
| SEO-02 | `og:*` tags present | e2e | `page.locator('meta[property="og:image"]')` | Wave 0 gap |
| SEO-03 | Twitter card meta present | e2e | `page.locator('meta[name="twitter:card"]')` | Wave 0 gap |
| SEO-04 | OG image returns 200 PNG at 1200×630 | e2e smoke | `fetch('/opengraph-image')` check | Wave 0 gap |
| SEO-05 | `/favicon.ico` returns 200 | e2e smoke | HTTP GET check | Wave 0 gap |
| SEO-06 | `/robots.txt` contains GPTBot + ClaudeBot Allow entries | e2e | `fetch('/robots.txt')` text assertion | Wave 0 gap |
| SEO-07 | `/sitemap.xml` lists 3 URLs | e2e | `fetch('/sitemap.xml')` parse | Wave 0 gap |
| SEO-08 | JSON-LD `<script>` present with `@type: "Organization"` | e2e | `page.locator('script[type="application/ld+json"]')` | Wave 0 gap |
| ANLY-01 | `<Analytics />` script tag present in body | e2e | `page.locator('script[src*="vitals"]')` (or DOM check) | Wave 0 gap |
| ANLY-02 | `<SpeedInsights />` script tag present | e2e | DOM check | Wave 0 gap |
| ANLY-03 | `track('waitlist_signup')` fires on signup (no error) | unit | Vitest mock + `joinWaitlist()` call | Wave 0 gap |
| ANLY-04 | `track('welcome_email_send_error')` fires on email fail | unit | Existing Phase 4 suite (verify it still passes) | Likely exists |
| ANLY-05 | Zero non-essential cookies on fresh visit | manual UAT | DevTools Application → Cookies → count 0 | Manual |
| ANLY-06 | No prohibited tracking SDK in `package.json` | build/lint | `grep -E "ga4|posthog|gtm|clarity|hotjar|pixel" package.json` | Manual/CI |

**Sampling rate:**
- Per task commit: `npx vitest run`
- Per wave merge: `npx vitest run && npx playwright test --project=chromium`
- Phase gate: full suite (`npx playwright test --project=chromium,firefox,webkit`) before `/gsd-verify-work`

### Wave 0 Gaps

The following test files need to be created as part of the first wave:

- [ ] `tests/legal.spec.ts` — covers LEGAL-01..08 (Playwright)
- [ ] `tests/seo.spec.ts` — covers SEO-01..08 including OG/robots/sitemap (Playwright)
- [ ] `tests/analytics.spec.ts` — covers ANLY-01..04 (Playwright for DOM + Vitest for unit track() mock)

*(Existing `tests/` suite from Phases 2-4 already covers LEGAL-05 footer hrefs and form flow; no duplication needed.)*

### Manual UAT Checkpoints (SC #2, SC #5)

**SC #2 — OG image rendering:**
1. Deploy to Vercel preview.
2. Visit `https://www.opengraph.xyz/` → enter preview URL → verify mascot-left + tagline-right renders correctly.
3. Visit X Card validator `https://cards-dev.twitter.com/validator` → enter preview URL → verify `summary_large_image` card renders.
4. Visit `https://www.linkedin.com/post-inspector/` → enter preview URL → verify image and description.
5. All three must pass before merging to main.

**SC #5 — Zero non-essential cookies:**
1. Open fresh incognito window.
2. Navigate to `https://preview-url.vercel.app`.
3. DevTools → Application → Cookies → select the domain.
4. Confirm 0 cookies listed.
5. Submit a test email.
6. Confirm 0 cookies added post-submit.

---

## Open Questions

1. **OAI-SearchBot and ChatGPT-User in robots.ts**
   - What we know: D-05 names five specific crawlers (GPTBot, ClaudeBot, Google-Extended, PerplexityBot, CCBot). The Anthropic three-bot expansion is confirmed (ClaudeBot + Claude-SearchBot + Claude-User). OpenAI also has `OAI-SearchBot` and `ChatGPT-User`.
   - What's unclear: D-05 was written before the three-bot expansion. Does the founder want all sub-bots allowed, or only the originally named five?
   - Recommendation: Include all expanded bot names (all seven in the Pattern 5 robots.ts example). The intent of D-05 is "allow AI surface area" — including the expanded names is conservative-in-the-right-direction. Founder reviews robots.ts in PR.

2. **`app/icon.tsx` vs static `app/favicon.ico`**
   - What we know: Both approaches work. Static `app/favicon.ico` (32×32 ICO/PNG) is simplest; `app/icon.tsx` with `ImageResponse` allows dynamic generation but adds complexity.
   - What's unclear: Does the Quibs SVG render well as a 32×32 static PNG without color banding?
   - Recommendation: Use a static `app/favicon.ico` (rasterized from `public/quibs-icon.svg` at 32×32 using Inkscape/sharp) and a static `app/apple-touch-icon.png` (180×180). This avoids any `ImageResponse` cold-start latency for favicon requests.

3. **`@vercel/analytics` v1 vs v2 pin**
   - What we know: Current latest is 2.0.1. CLAUDE.md says `^1`. v2 adds Resilient Intake (randomized script URL). Both support identical `track()` API.
   - Recommendation: Pin `^1` to match CLAUDE.md spec. Upgrade to v2 in Phase 6 or post-launch if ad-blocker interference is measured.

4. **Deployment Protection bypass for preview `track()` calls**
   - What we know: Server-side `track()` 401s on protected preview deployments (no `VERCEL_AUTOMATION_BYPASS_SECRET`).
   - Recommendation: Document as a known limitation in the Phase 5 PLAN. Do not block Phase 5 merge on this; production analytics are unaffected. Add `VERCEL_AUTOMATION_BYPASS_SECRET` setup as a checklist item for Phase 6.

---

## Environment Availability

Phase 5 is code + file-convention only (legal pages, route handlers, metadata). No new external services.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js 24 (`node:fs`, `node:crypto`) | `lib/consent-version.ts` | ✓ | 24.x (Vercel runtime) | — |
| `@vercel/analytics` | `lib/analytics.ts`, `app/layout.tsx` | Not yet installed | ^1 needed | — |
| `@vercel/speed-insights` | `app/layout.tsx` | Not yet installed | ^1 needed | — |
| Quicksand Bold TTF binary | `app/opengraph-image.tsx` | Not in repo yet | Latest OFL | Download from Google Fonts or @fontsource |
| Figtree Medium TTF binary | `app/opengraph-image.tsx` | Not in repo yet | Latest OFL | Download from Google Fonts or @fontsource |

**Missing dependencies requiring action before Wave 1:**
- `npm install @vercel/analytics@^1 @vercel/speed-insights@^1`
- Download `Quicksand-Bold.ttf` + `Figtree-Medium.ttf` → place in `public/fonts/`

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase 5 |
|-----------|-------------------|
| Next.js 16.2.x, React 19.2.x, Tailwind v4 | All new files must follow App Router conventions |
| `@vercel/analytics ^1` + `@vercel/speed-insights ^1` only (no GA4/PostHog/GTM) | Enforced in Q1/Q5; no prohibited packages added |
| No cookie banner of any kind | Vercel Analytics + Speed Insights confirmed cookieless; no banner needed |
| No `@tailwindcss/typography` | Legal pages use hand-styled prose (documented in UI-SPEC) |
| No Framer Motion | No motion in legal pages or OG image |
| `lucide-react` for icons | No new icons in Phase 5 (legal pages are prose; OG uses mascot SVG) |
| `next/font/google` for Quicksand/Figtree | Page fonts unchanged; OG fonts use TTF binaries (different system) |
| Lighthouse mobile ≥90 | `<Analytics />` and `<SpeedInsights />` add ~1.6 KB combined; existing Lighthouse CI gate in place |
| No `process.env.X` reads outside `lib/env.ts` | `lib/consent-version.ts` reads files via `fs`, not env vars — compliant |
| GSD workflow enforcement | All edits go through Phase 5 plans |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | GDPR supervisory authority complaint boilerplate "in your country" is sufficient without naming all EU authorities | GDPR disclosure section | Low — this phrasing is standard in minimally-compliant policies; legal review in PR catches any gap |
| A2 | OAI-SearchBot and ChatGPT-User are distinct from GPTBot and should be included | AI crawler table | Low — including extra Allow rules causes no harm; missing them is D-05's intent concern |
| A3 | `@vercel/analytics` v1 and v2 have identical `track()` server-side API | Standard Stack | Low — both packages export the same function; server-side behavior is unchanged |
| A4 | Figtree 500 (Medium) weight TTF is available as a separate file from Google Fonts | OG font strategy | Low — Google Fonts provides per-weight TTF downloads; @fontsource/figtree includes them |

---

## Sources

### Primary (HIGH confidence)

- [CITED: nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image] — Runtime, font loading via `readFile`/`process.cwd()`, size config, Node runtime requirement
- [CITED: nextjs.org/docs/app/api-reference/file-conventions/metadata/robots] — `MetadataRoute.Robots` type, multiple user-agent array syntax
- [CITED: nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap] — `MetadataRoute.Sitemap` type, `changeFrequency`/`priority` fields
- [CITED: vercel.com/docs/analytics/custom-events] — `@vercel/analytics/server` import path, `await track()` in Server Actions, 401 on protected deployments
- [CITED: vercel.com/docs/analytics/quickstart] — `import { Analytics } from '@vercel/analytics/next'` (NOT `/react`)
- [CITED: vercel.com/docs/analytics/privacy-policy] — Cookieless confirmation, no cookies set, daily-rotating hash, 24h session discard
- [CITED: vercel.com/docs/speed-insights/privacy-policy] — Speed Insights cookieless, anonymous data points
- [CITED: vercel.com/kb/guide/how-can-i-use-files-in-serverless-functions] — `fs.readFileSync` + `process.cwd()` supported on Vercel; files must be bundled
- [CITED: developers.google.com/search/docs/appearance/structured-data/organization] — No required props; logo min 112×112px; recommend square logo
- [CITED: ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business] — CAN-SPAM transactional vs commercial classification
- [VERIFIED: npm registry] — `@vercel/analytics@2.0.1`, `@vercel/speed-insights@2.0.0` as of 2026-04-29
- [VERIFIED: package.json] — `@vercel/og ^0.11.1` already in devDependencies; `@vercel/analytics` and `@vercel/speed-insights` not yet installed

### Secondary (MEDIUM confidence)

- [CITED: almcorp.com/blog/anthropic-claude-bots-robots-txt-strategy] — ClaudeBot / Claude-SearchBot / Claude-User user-agent strings and purposes; verified via searchenginejournal.com
- [CITED: fontsquirrel.com/license/quicksand] — SIL OFL 1.1 license confirms TTF distribution in git repositories is permitted

### Tertiary (LOW confidence — flagged)

- `[ASSUMED]` — GDPR supervisory authority complaint boilerplate phrasing
- `[ASSUMED]` — OpenAI's `OAI-SearchBot` / `ChatGPT-User` intent matching D-05's spirit

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — packages verified on npm; import paths verified from official Vercel docs
- Architecture (consent-version, OG image): HIGH — official Next.js 16 docs + Vercel KB confirm patterns
- Legal requirements: HIGH (GDPR) / MEDIUM (GDPR supervisory authority phrasing nuance)
- AI crawler list: HIGH for the seven named bots; MEDIUM for whether D-05's intent covers all three Anthropic bots

**Research date:** 2026-04-29
**Valid until:** 2026-05-29 (stable domain; check for Next.js 16.3+ releases if significant time passes)

---

## RESEARCH COMPLETE
