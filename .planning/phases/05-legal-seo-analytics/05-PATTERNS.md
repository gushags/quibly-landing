# Phase 5: Legal + SEO + Analytics — Pattern Map

**Mapped:** 2026-04-29
**Files analyzed:** 16 (9 new, 7 modified)
**Analogs found:** 16 / 16

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/(legal)/privacy/page.tsx` | page (RSC) | static prose | `marketing-app/app/(public)/privacy/page.tsx` | exact |
| `app/(legal)/terms/page.tsx` | page (RSC) | static prose | `marketing-app/app/(public)/cookies/page.tsx` | role-match (same layout, simpler content) |
| `app/(legal)/layout.tsx` | layout (RSC) | pass-through | `marketing-app/app/(public)/layout.tsx` | role-match (simpler — no auth check) |
| `lib/consent-version.ts` | utility (server-only) | transform (file I/O → hash) | `lib/unsubscribe-token.ts` | role-match (server-only, crypto, Node built-ins) |
| `app/opengraph-image.tsx` | route handler (ImageResponse) | file I/O → raster | `marketing-app/app/(public)/opengraph-image.tsx` | exact (same file convention, same runtime export) |
| `app/robots.ts` | route handler | static emit | `marketing-app/app/robots.ts` | exact |
| `app/sitemap.ts` | route handler | static emit | `marketing-app/app/sitemap.ts` | exact |
| `app/layout.tsx` (MODIFY) | layout (RSC) | request-response | itself (current `app/layout.tsx`) | self-modify |
| `app/page.tsx` (MODIFY, JSON-LD) | page (RSC) | static render | itself (current `app/page.tsx`) | self-modify |
| `lib/analytics.ts` (MODIFY) | utility (server-only) | event-driven | itself (current shim + RESEARCH Pattern 1) | self-modify (body swap only) |
| `app/actions/join-waitlist.ts` (MODIFY) | server action | request-response | itself (lines 141–146 swap) | self-modify (1-line swap) |
| `components/sections/waitlist-form-section.tsx` (MODIFY) | component (RSC) | static render | itself + `marketing-app/(public)/cookies/page.tsx` (inline link pattern) | self-modify + role-match |
| `package.json` (MODIFY) | config | n/a | itself | self-modify |
| `tests/legal.spec.ts` | e2e test (Playwright) | request-response | `tests/form/success-state.spec.ts` | role-match (same Playwright test structure) |
| `tests/seo.spec.ts` | e2e test (Playwright) | request-response | `tests/form/success-state.spec.ts` | role-match |
| `tests/analytics.spec.ts` + `lib/consent-version.test.ts` | unit test (Vitest) | transform | `tests/unit/unsubscribe-token.test.ts` | exact (same env-setup + dynamic-import pattern) |

---

## Pattern Assignments

### `app/(legal)/privacy/page.tsx` (page RSC, static prose)

**Analog:** `marketing-app/app/(public)/privacy/page.tsx`

**Imports pattern** (lines 1–6 of analog; add `env` import for D-04):
```typescript
import type { Metadata } from 'next'
import { env } from '@/lib/env'   // D-04: renders RESEND_FROM_POSTAL_ADDRESS in contact section
```

**Metadata export pattern** (lines 3–6 of analog):
```typescript
export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Quibly privacy policy — how we handle and protect your data.',
}
```

**Page container pattern** (lines 10–12 of analog — use `px-6` per UI-SPEC, not `px-4`):
```tsx
<div className="max-w-3xl mx-auto px-6 py-16">
  <h1 className="font-heading text-4xl font-bold mb-2">Privacy Policy</h1>
  <p className="text-sm text-muted-foreground mb-10">Last updated: April 29, 2026</p>
```
Note: UI-SPEC prescribes `px-6` (24px) not `px-4`. Static string per CD-04 — do NOT use `new Date()`.

**Section pattern** (lines 14–21 of analog — copy verbatim for every section):
```tsx
<section className="space-y-4 mb-10">
  <h2 className="font-heading text-xl font-semibold">Introduction</h2>
  <p className="text-foreground leading-relaxed">
    {/* prose */}
  </p>
</section>
```

**Inline anchor pattern** (lines 187–194 of analog — for DSAR mailto and external processor links):
```tsx
<a
  href="mailto:privacy@useQuibly.com"
  className="text-primary hover:underline"
>
  privacy@useQuibly.com
</a>
```

**Postal address pattern** (D-04 — renders env var, not hardcoded):
```tsx
<p className="text-foreground leading-relaxed">
  {env.RESEND_FROM_POSTAL_ADDRESS}
</p>
```

**List pattern** (lines 28–48 of analog):
```tsx
<ul className="space-y-2 list-disc list-inside text-foreground leading-relaxed">
  <li><strong>Email address:</strong> provided when you join the waitlist.</li>
</ul>
```

**Sections to include (Phase 5 scope — adapted, NOT copied verbatim from analog):**
- Introduction (narrow: waitlist only, GDPR Art. 6(1)(a) lawful basis)
- Information We Collect (email only — strip brand-info/content-data/Stripe sections from analog)
- How We Use It (waitlist notification only)
- Cookies / Tracking (merged section: cookieless Vercel Analytics + Speed Insights disclosure per RESEARCH.md Q1; no separate `/cookies` route — CONTEXT Specifics)
- Sharing & Processors (Vercel Analytics, Vercel Speed Insights, Resend — named as processors per LEGAL-03)
- Retention (`"We retain your email until Quibly launches plus 12 months thereafter, or until you unsubscribe — whichever comes first."` — CD-08 exact wording)
- Your Rights (DSAR: access, deletion, correction, portability; supervisory authority complaint boilerplate; `privacy@useQuibly.com` link)
- Updates (static date, git-blame auditable)
- Contact (`env.RESEND_FROM_POSTAL_ADDRESS` postal address; DSAR mailto)

---

### `app/(legal)/terms/page.tsx` (page RSC, static prose)

**Analog:** `marketing-app/app/(public)/cookies/page.tsx` (same short-page RSC pattern; marketing-app's `terms` is for paying-user TOS and is out of scope per D-01)

**Imports + metadata pattern** (lines 1–7 of analog):
```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms',
  description: 'Quibly terms — waitlist participation agreement.',
}
```

**Page container** — identical to privacy page:
```tsx
<div className="max-w-3xl mx-auto px-6 py-16">
  <h1 className="font-heading text-4xl font-bold mb-2">Terms</h1>
  <p className="text-sm text-muted-foreground mb-10">Last updated: April 29, 2026</p>
```

**Section pattern** — identical `<section className="space-y-4 mb-10">` structure as privacy.

**Sections to include (fresh content per D-01 — marketing-app terms not applicable):**
- Acceptance (joining the waitlist constitutes agreement)
- Nature of the Waitlist (pre-launch notification only; no service guarantee)
- No Service Guarantees (launch timing may change; waitlist does not create a contract)
- Withdrawal (can unsubscribe anytime via email link; Phase 4 already ships unsubscribe)
- Governing Law (Claude picks reasonable default during implementation; founder confirms in PR)
- Contact (`privacy@useQuibly.com` for disputes)

---

### `app/(legal)/layout.tsx` (route group layout, RSC)

**Analog:** `marketing-app/app/(public)/layout.tsx` — but simpler (no auth check, no nav, no footer wrapper; Phase 5 legal pages inherit root layout `app/layout.tsx` which already provides `<Toaster />` and font mounting)

**Pattern** (simplified from analog, omitting Supabase auth):
```tsx
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```
Note: This layout is optional (CD-01). If chosen, it exists only to logically group the route group. The root layout already provides all chrome. An empty pass-through is sufficient and correct — do not add nav/footer here (root layout owns those).

---

### `lib/consent-version.ts` (utility, server-only, file I/O → transform)

**Analog:** `lib/unsubscribe-token.ts`

**server-only guard pattern** (line 1 of analog — copy verbatim):
```typescript
import 'server-only'
```

**Node built-in import pattern** (analog uses `crypto.subtle` via global; consent-version uses `node:crypto` module directly per RESEARCH Pattern 3):
```typescript
import 'server-only'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
```

**Core pattern** (RESEARCH.md Pattern 3 — verbatim implementation):
```typescript
function readAndNormalize(filePath: string): string {
  const raw = readFileSync(join(process.cwd(), filePath), 'utf8')
  return raw.replace(/\r\n/g, '\n')  // normalize CRLF → LF (Pitfall 1)
}

const privacyContent = readAndNormalize('app/(legal)/privacy/page.tsx')
const termsContent = readAndNormalize('app/(legal)/terms/page.tsx')

export const CONSENT_VERSION = createHash('sha256')
  .update(privacyContent + termsContent)
  .digest('hex')
  .slice(0, 8)
```

**No env import** — D-14 explicitly states no env vars; reads file contents directly via `fs`. The `env` import pattern from `lib/unsubscribe-token.ts` does NOT apply here.

**Single named export** — `CONSENT_VERSION` constant only. No default export. No functions exported.

---

### `app/opengraph-image.tsx` (ImageResponse route handler, file I/O → raster)

**Analog:** `marketing-app/app/(public)/opengraph-image.tsx`

**File-convention exports pattern** (lines 3–6 of analog — use exact variable names, Next.js requires them):
```typescript
export const runtime = 'nodejs'         // MUST be nodejs — Edge cannot use node:fs
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Quibly — You know your business. Quibly knows how to market it.'
```

**Import pattern** (analog uses `next/og`; Phase 5 adds font + asset loading — RESEARCH Pattern 4):
```typescript
import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
```

**Core pattern** (RESEARCH.md Pattern 4 — Phase 5 mascot-left + tagline-right vs analog's simple centered layout):
```typescript
export default async function OgImage() {
  const [quicksandBold, figtreeMedium, mascotRaw] = await Promise.all([
    readFile(join(process.cwd(), 'public/fonts/Quicksand-Bold.ttf')),
    readFile(join(process.cwd(), 'public/fonts/Figtree-Medium.ttf')),
    readFile(join(process.cwd(), 'public/quibs-icon.svg'), 'base64'),
  ])

  const mascotSrc = `data:image/svg+xml;base64,${mascotRaw}`
  // mascot as base64 img src — Satori does not support inline <svg> elements (Pitfall 4)

  return new ImageResponse(
    ( /* JSX — see composition below */ ),
    {
      ...size,
      fonts: [
        { name: 'Quicksand', data: quicksandBold, style: 'normal', weight: 700 },
        { name: 'Figtree',   data: figtreeMedium, style: 'normal', weight: 500 },
      ],
    }
  )
}
```

**JSX composition** (D-08 locked: mascot-left 40% + tagline-right 60% + teal-gradient; UI-SPEC §4):
```tsx
<div style={{ display: 'flex', width: '100%', height: '100%' }}>
  {/* Left column — teal gradient + mascot */}
  <div style={{
    display: 'flex', width: '40%', height: '100%',
    background: 'linear-gradient(135deg, oklch(0.6002 0.1038 184.704), oklch(0.50 0.1038 184.704))',
    alignItems: 'center', justifyContent: 'center',
  }}>
    <img src={mascotSrc} width={180} height={180} />
  </div>
  {/* Right column — white + tagline */}
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
```

**Font binary prerequisites** (must exist before this file can render):
- `public/fonts/Quicksand-Bold.ttf` — Quicksand weight 700
- `public/fonts/Figtree-Medium.ttf` — Figtree weight 500
- Both are SIL OFL 1.1 — checking into git is permitted (RESEARCH.md OFL finding)

---

### `app/robots.ts` (route handler, static emit)

**Analog:** `marketing-app/app/robots.ts`

**Import pattern** (line 1 of analog — identical):
```typescript
import type { MetadataRoute } from 'next'
```

**Core pattern** (analog uses a single wildcard rule with disallows; Phase 5 uses per-agent allow rules per D-05/D-06 and RESEARCH Pattern 5):
```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: 'GPTBot',           allow: '/' },
      { userAgent: 'OAI-SearchBot',    allow: '/' },
      { userAgent: 'ChatGPT-User',     allow: '/' },
      { userAgent: 'ClaudeBot',        allow: '/' },
      { userAgent: 'Claude-SearchBot', allow: '/' },
      { userAgent: 'Claude-User',      allow: '/' },
      { userAgent: 'Google-Extended',  allow: '/' },
      { userAgent: 'PerplexityBot',    allow: '/' },
      { userAgent: 'Perplexity-User',  allow: '/' },
      { userAgent: 'CCBot',            allow: '/' },
    ],
    sitemap: 'https://useQuibly.com/sitemap.xml',
  }
}
```
Note: D-06 says no explicit rules for Googlebot/Bingbot/Yandex — they are not in the rules array (defaults apply implicitly). The analog's `userAgent: '*'` pattern is NOT copied — Phase 5 wants per-agent explicitness.

---

### `app/sitemap.ts` (route handler, static emit)

**Analog:** `marketing-app/app/sitemap.ts`

**Import + BASE_URL pattern** (lines 1–5 of analog — simplified, no dynamic scanning needed):
```typescript
import type { MetadataRoute } from 'next'

const BASE_URL = 'https://useQuibly.com'
```

**Core pattern** (Phase 5 is 3 static entries; no dynamic MDX scanning from analog):
```typescript
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL,               lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE_URL}/privacy`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/terms`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]
}
```
Note: `lastModified: new Date()` resolves at build time. `metadataBase` in layout.tsx does NOT prefix these URLs — absolute URLs required (RESEARCH.md Sitemap Conventions).

---

### `app/layout.tsx` (MODIFY — extend metadata + add Analytics/SpeedInsights)

**Analog:** itself — `app/layout.tsx` (current file, lines 1–45)

**Import additions** (append after existing imports, before `./globals.css`):
```typescript
import { Analytics } from '@vercel/analytics/next'       // NOT /react — Pitfall 2
import { SpeedInsights } from '@vercel/speed-insights/next'
```

**Metadata extension** (replace existing `export const metadata` block, lines 21–29):
```typescript
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
    // og:image auto-provided by app/opengraph-image.tsx file convention
    // Do NOT set openGraph.images here — causes Pitfall 6 (duplicate og:image tags)
  },
  twitter: {
    card: 'summary_large_image',
    // twitter:image auto-inherited from opengraph-image.tsx
    // Omit twitter:creator/twitter:site if no public X handle (RESEARCH Q8)
  },
}
```

**Body extension** (append `<Analytics />` + `<SpeedInsights />` after `<Toaster />`, before `</body>` — CD-06):
```tsx
<body className="min-h-full flex flex-col">
  {children}
  <Toaster />
  <Analytics />
  <SpeedInsights />
</body>
```

---

### `app/page.tsx` (MODIFY — inject Schema.org JSON-LD)

**Analog:** itself — `app/page.tsx` (current file, lines 1–32)

**JSON-LD pattern** (RESEARCH.md Pattern 7 — inject before `<main>` in the return JSX):
```tsx
// Two constants above the return statement (CD-02: home page only, not layout.tsx)
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Quibly',
  url: 'https://useQuibly.com',
  logo: 'https://useQuibly.com/quibs-icon.svg',
  description: 'Strategy-first AI marketing for solopreneurs and small teams.',
  // No sameAs — no social handles published yet (CD-02)
}

const webSiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Quibly',
  url: 'https://useQuibly.com',
}
```

**JSX injection pattern** (wrap existing `<main>` + `<Footer>` in a fragment):
```tsx
return (
  <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd).replace(/</g, '<') }}
    />
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd).replace(/</g, '<') }}
    />
    <main className="flex flex-col">
      {/* existing sections — unchanged */}
    </main>
    <Footer />
  </>
)
```
Note: The `.replace(/</g, '<')` XSS escaping is the official Next.js recommendation for dangerouslySetInnerHTML JSON-LD injection.

---

### `lib/analytics.ts` (MODIFY — body swap only)

**Analog:** itself (current `lib/analytics.ts`, lines 1–32)

**server-only guard** — line 1 stays unchanged (`import 'server-only'`)

**TrackEvent union** — lines 17–23 stay LOCKED (CD-05). Do not add or remove event names.

**Body swap** (replace lines 24–32 — the `async function track` body only):
```typescript
// Phase 5 swap — signature unchanged, body replaces console.log shim
import { track as vercelTrack } from '@vercel/analytics/server'

export async function track(
  event: TrackEvent,
  properties?: Record<string, unknown>,
): Promise<void> {
  await vercelTrack(event, properties)
}
```
Reference: RESEARCH.md Pattern 1, verbatim.

---

### `app/actions/join-waitlist.ts` (MODIFY — 1-line consent_version swap)

**Analog:** itself (current file, lines 141–146)

**Import addition** (top of file, after existing imports):
```typescript
import { CONSENT_VERSION } from '@/lib/consent-version'
```

**Line replacement** (current lines 145–146):
```typescript
// BEFORE (Phase 4 stub):
// eslint-disable-next-line custom/no-raw-process-env -- Vercel system env var
const consentVersion = process.env.VERCEL_GIT_COMMIT_SHA ?? 'pre-phase-5'

// AFTER (Phase 5 — remove eslint-disable comment for THIS read; the audienceId
//         read on line 141-143 keeps its eslint-disable comment):
const consentVersion = CONSENT_VERSION
```
Note: The `eslint-disable-next-line` comment for the `audienceId` read (line 141) must NOT be removed — only the comment around `consentVersion`.

---

### `components/sections/waitlist-form-section.tsx` (MODIFY — add microcopy block)

**Analog:** itself (current file, lines 51–65) + `marketing-app/app/(public)/cookies/page.tsx` for inline `<a>` pattern (line 143)

**Insertion point** — add the microcopy `<div>` immediately after `<WaitlistForm renderedAt={renderedAt} />`, inside the `mx-auto max-w-prose px-6 text-center` wrapper (UI-SPEC §3 "below the submit button"):

```tsx
<WaitlistForm renderedAt={renderedAt} />

{/* LEGAL-06 + LEGAL-07 consent microcopy — UI-SPEC §3, locked copy */}
<div className="mt-4 space-y-1 text-xs text-muted-foreground text-center">
  <p>No spam &mdash; unsubscribe anytime.</p>
  <p>
    By joining, you agree to our{' '}
    <a
      href="/privacy"
      className="text-primary underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-sm"
    >
      Privacy Policy
    </a>
    {' '}and{' '}
    <a
      href="/terms"
      className="text-primary underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-sm"
    >
      Terms
    </a>
    .
  </p>
</div>
```

Note: UI-SPEC §3 prescribes the exact class list for anchors. Next.js `<Link>` is NOT used here — these are prose-style inline `<a>` elements matching the marketing-app cookies/privacy analog (line 143: `className="text-primary hover:underline"`). Phase 5 adds the `focus-visible:` classes per accessibility contract.

---

### `tests/legal.spec.ts` + `tests/seo.spec.ts` + `tests/analytics.spec.ts` (NEW — Playwright e2e)

**Analog:** `tests/form/success-state.spec.ts`

**File structure pattern** (lines 1–4, 49–53 of analog):
```typescript
import { expect, test } from '@playwright/test'

test.describe('Phase 5 — legal pages (LEGAL-01..08)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('...', async ({ page }) => {
    // assertions
  })
})
```

**HTTP check pattern** (for `/privacy`, `/terms`, `/robots.txt`, `/sitemap.xml`, `/opengraph-image`):
```typescript
test('/privacy returns 200 (LEGAL-01)', async ({ page }) => {
  const response = await page.goto('/privacy')
  expect(response?.status()).toBe(200)
})
```

**Content assertion pattern** (analog lines 71–74 — `toContainText`):
```typescript
test('privacy body mentions Vercel and Resend (LEGAL-03)', async ({ page }) => {
  await page.goto('/privacy')
  await expect(page.locator('body')).toContainText('Vercel')
  await expect(page.locator('body')).toContainText('Resend')
})
```

**Link assertion pattern** (for DSAR mailto, LEGAL-08):
```typescript
await expect(page.locator('a[href="mailto:privacy@useQuibly.com"]')).toBeVisible()
```

**Head meta assertion pattern** (for SEO-02/SEO-03):
```typescript
await expect(page.locator('meta[property="og:image"]')).toHaveCount(1)
await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
```

---

### `lib/consent-version.test.ts` (NEW — Vitest unit test)

**Analog:** `tests/unit/unsubscribe-token.test.ts`

**Env setup pattern** (lines 1–11 of analog — must precede any lib import):
```typescript
import { describe, it, expect, beforeAll } from 'vitest'

// env vars before lib/env.ts loads
process.env.RESEND_API_KEY = 're_test_dummy'
// ... all required env vars (copy from unsubscribe-token.test.ts lines 4–10)
```

**Mock pattern for fs.readFileSync** (needed because test runner doesn't have `app/(legal)/privacy/page.tsx` on disk during unit test; use `vi.mock`):
```typescript
import { vi } from 'vitest'

vi.mock('node:fs', () => ({
  readFileSync: vi.fn((filePath: string) => {
    if (filePath.includes('privacy')) return 'mock-privacy-content'
    if (filePath.includes('terms'))   return 'mock-terms-content'
    return ''
  }),
}))
```

**Dynamic import pattern** (lines 12–18 of analog — import after mocks are established):
```typescript
let CONSENT_VERSION: string

beforeAll(async () => {
  const mod = await import('@/lib/consent-version')
  CONSENT_VERSION = mod.CONSENT_VERSION
})
```

**Assertions:**
```typescript
it('exports an 8-character hex string', () => {
  expect(CONSENT_VERSION).toMatch(/^[0-9a-f]{8}$/)
})

it('is deterministic for the same file contents', async () => {
  const mod2 = await import('@/lib/consent-version')
  expect(mod2.CONSENT_VERSION).toBe(CONSENT_VERSION)
})
```

---

## Shared Patterns

### server-only Guard
**Source:** `lib/unsubscribe-token.ts` line 1, `lib/analytics.ts` line 1
**Apply to:** `lib/consent-version.ts`
```typescript
import 'server-only'
```

### Node Built-in Imports (module specifier style)
**Source:** `app/actions/join-waitlist.ts` lines 2–3
**Apply to:** `lib/consent-version.ts`, `app/opengraph-image.tsx`
```typescript
import { readFile } from 'node:fs/promises'   // async (OG image)
import { readFileSync } from 'node:fs'         // sync (consent-version, module-load)
import { join } from 'node:path'
```

### Legal Page Container (RSC static prose)
**Source:** `marketing-app/app/(public)/privacy/page.tsx` lines 10–12
**Apply to:** `app/(legal)/privacy/page.tsx`, `app/(legal)/terms/page.tsx`
```tsx
<div className="max-w-3xl mx-auto px-6 py-16">
  <h1 className="font-heading text-4xl font-bold mb-2">{title}</h1>
  <p className="text-sm text-muted-foreground mb-10">Last updated: April 29, 2026</p>
```

### Legal Section Block
**Source:** `marketing-app/app/(public)/privacy/page.tsx` lines 14–21
**Apply to:** All `<section>` elements in privacy and terms pages
```tsx
<section className="space-y-4 mb-10">
  <h2 className="font-heading text-xl font-semibold">{heading}</h2>
  <p className="text-foreground leading-relaxed">{body}</p>
</section>
```

### Inline Anchor (legal prose + microcopy)
**Source:** `marketing-app/app/(public)/privacy/page.tsx` lines 187–194 (external links) and `marketing-app/app/(public)/cookies/page.tsx` line 143 (internal links)
**Apply to:** Privacy page DSAR mailto, all anchors in consent microcopy block
```tsx
{/* External / mailto: */}
<a href="mailto:privacy@useQuibly.com" className="text-primary hover:underline">
  privacy@useQuibly.com
</a>

{/* Internal (consent microcopy) — adds focus-visible classes per UI-SPEC accessibility contract: */}
<a
  href="/privacy"
  className="text-primary underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-sm"
>
  Privacy Policy
</a>
```

### Vitest Unit Test Env Setup + Dynamic Import
**Source:** `tests/unit/unsubscribe-token.test.ts` lines 1–18
**Apply to:** `lib/consent-version.test.ts`, any new Vitest unit test that touches a module which loads `lib/env.ts`
```typescript
// 1. Set all env vars (all keys in lib/env.ts schema) BEFORE any import
process.env.RESEND_API_KEY = 're_test_dummy_key_for_unit_tests'
process.env.RESEND_AUDIENCE_ID = '00000000-0000-0000-0000-000000000001'
process.env.RESEND_AUDIENCE_PREVIEW_ID = '00000000-0000-0000-0000-000000000002'
process.env.RESEND_WEBHOOK_SECRET = 'whsec_test_secret_unit_only_64_chars_padded_for_realism_xxxx'
process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
process.env.UPSTASH_REDIS_REST_TOKEN = 'test_token_unit_only'
process.env.RESEND_FROM_POSTAL_ADDRESS = 'Test Address, Test City, TS 99999'

// 2. Dynamic import in beforeAll (after vi.mock calls)
let mod: SomeType
beforeAll(async () => {
  mod = await import('@/lib/the-module')
})
```

### MetadataRoute File Convention Pattern
**Source:** `marketing-app/app/robots.ts` line 1, `marketing-app/app/sitemap.ts` line 1
**Apply to:** `app/robots.ts`, `app/sitemap.ts`
```typescript
import type { MetadataRoute } from 'next'
export default function robots(): MetadataRoute.Robots { /* ... */ }
export default function sitemap(): MetadataRoute.Sitemap { /* ... */ }
```

---

## No Analog Found

All files in scope have close analogs. No entries in this section.

---

## Key Pitfalls Carried Forward

These are NOT patterns to copy — they are warnings extracted from RESEARCH.md that planner must reference in plan task descriptions:

| Pitfall | Affects | Mitigation |
|---------|---------|-----------|
| CRLF line endings break consent_version hash | `lib/consent-version.ts` | `.replace(/\r\n/g, '\n')` before hashing; add `.gitattributes` `*.tsx eol=lf` |
| Wrong `@vercel/analytics` import path | `app/layout.tsx` | Use `/next` not `/react` |
| SVG inline in ImageResponse | `app/opengraph-image.tsx` | Load SVG as base64 data URI via `readFile(..., 'base64')`, use `<img src={dataUri}>` |
| Duplicate `og:image` from file convention + metadata | `app/layout.tsx` | Do NOT set `openGraph.images` — file convention is sufficient |
| Route group `(legal)` URL leak | `app/(legal)/` directory | Parentheses in directory name — verify `/privacy` resolves (not `/legal/privacy`) |
| `app/opengraph-image.tsx` must export `runtime = 'nodejs'` | `app/opengraph-image.tsx` | Explicit export required; Edge runtime cannot use `node:fs` |
| `@vercel/analytics` v2 vs v1 semver | `package.json` | Pin `^1` to match CLAUDE.md spec; commit lockfile after clean install |

---

## Metadata

**Analog search scope:** `/Users/jeff/repos/quibly-landing/` (all directories) + `/Users/jeff/repos/marketing-app/app/(public)/` + `/Users/jeff/repos/marketing-app/app/` (root-level route handlers)
**Files scanned:** 19 source files read directly; 3 directory listings
**Pattern extraction date:** 2026-04-29
