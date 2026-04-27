# Stack Research

**Domain:** Pre-launch SaaS waitlist landing page (single-screen, email capture, brand-aligned)
**Researched:** 2026-04-27
**Confidence:** HIGH

---

## TL;DR

**Stack: Next.js 16.2.x (App Router) + TypeScript + Tailwind v4 + shadcn/ui + Resend + Vercel**, deployed as a single static-rendered route with one Server Action handling email submission.

**Why this stack and not Astro / Carrd / Framer / static HTML?** The non-negotiable constraint is **brand-token reuse from `marketing-app`**. `marketing-app` ships its design contract in Tailwind v4 `@theme` tokens, shadcn/ui radii, Quicksand/Figtree via `next/font`, and oklch teal at exactly `oklch(0.6002 0.1038 184.704)`. Anything that isn't Next.js 16 + Tailwind v4 forces a re-implementation of that contract — which is the single largest source of brand drift between two repos that share a domain. The Lighthouse-mobile-≥90 target is achievable on Next 16 with one route, no client bundles in the hero, and `next/font` self-hosting; Astro's score advantage (95–100 vs 85–95 on content sites) does not justify forking the design system. Carrd/Framer can't host the brand at all. Static HTML would work but throws away the Resend SDK + Server Action ergonomics that get this shipped in a day.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Next.js** | `16.2.x` (latest 16.2.4 as of 2026-04-16) | App Router framework, static + dynamic, Server Actions for email submit, Vercel-native deploys | Matches `marketing-app` exactly (16.2.1 there); App Router static rendering + a single Server Action is the simplest way to ship one form on one page; `ImageResponse` (now 2× faster in 16.2) handles OG image generation in the same repo. ([Next.js 16.2 blog](https://nextjs.org/blog/next-16-2)) |
| **React** | `19.2.x` | UI runtime | Pinned by Next 16; same as `marketing-app` (`19.2.4`). |
| **TypeScript** | `^5` | Type safety | Same baseline as `marketing-app`; avoids dropping types in shared brand utilities. |
| **Tailwind CSS** | `^4` (with `@tailwindcss/postcss ^4`) | CSS-first design tokens via `@theme inline { … }` directive | The Quibly design tokens in `marketing-app/app/globals.css` use Tailwind v4's `@theme inline` block + oklch primitives. v3 would silently drop `@theme inline`, `@plugin`, `@custom-variant`, and the `oklch()` wide-gamut color compatibility. ([Tailwind v4 + shadcn](https://ui.shadcn.com/docs/tailwind-v4)) |
| **shadcn/ui** | `shadcn ^4.1.x` (CLI) — components copied into repo, not a runtime dep | Button, Input, Sonner toaster, Form primitives, all already styled to Quibly tokens in `marketing-app` | Provides the `--radius` scale (`--radius-sm` … `--radius-4xl`) the design spec relies on (pill `border-radius: 24px` for buttons, `28px` for hero CTA). Components are copy-paste — port the exact `button.tsx`, `input.tsx`, `sonner.tsx` from `marketing-app` so the visual signature matches. ([shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4)) |
| **`tw-animate-css`** | `^1.4.x` | CSS animations callable from Tailwind utilities | Matches `marketing-app`; gives the success-state checkmark animation without dragging in Framer Motion. |
| **Resend** | `resend ^6.12.x` (Node SDK) | Audience storage + transactional welcome email | Already configured in `marketing-app` with verified `useQuibly.com` sender domain. One account, two products: `resend.contacts.create({ audienceId, email })` adds to the audience; `resend.emails.send({ … })` (with `@react-email/components`) sends the welcome. ([Resend create-contact API](https://resend.com/docs/api-reference/contacts/create-contact)) |
| **`@react-email/components`** | `^1.0.x` | Type-safe React-rendered transactional email templates | Same library `marketing-app` uses; lets the welcome email reuse Quibly brand tokens (teal button, Quicksand-styled wordmark) inline-styled for email-client compatibility. |
| **Vercel** | n/a (platform) | Hosting, edge cache, Web Analytics, Speed Insights | Apex domain `useQuibly.com` already paid for; one-step domain swap when `marketing-app` takes over post-launch (transfer in Vercel dashboard, no DNS change). |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **`zod`** | `^4.0.x` | Email + form validation in the Server Action | One small schema (`z.object({ email: z.string().email().max(254) })`) — sufficient for one field, type-safe error messages, and the same validator can be used client-side for instant feedback. ([Zod 4 docs](https://zod.dev)) |
| **`@marsidev/react-turnstile`** | `^1.x` | Cloudflare Turnstile React wrapper | Renders the widget client-side; token gets passed to the Server Action which calls `https://challenges.cloudflare.com/turnstile/v0/siteverify`. SSR-ready, no flash. ([react-turnstile docs](https://github.com/marsidev/react-turnstile)) |
| **`@vercel/analytics`** | `^1.x` | Page views + custom event for `waitlist_signup` | Free on Vercel, ~1.6 KB script, no cookies, no GDPR banner needed for the pageview tier. Fire `track('waitlist_signup')` from the Server Action's success path. |
| **`@vercel/speed-insights`** | `^1.x` | Real-User-Monitoring of LCP/CLS/INP from production traffic | Paired with Vercel Analytics; needed because Lighthouse runs ≠ field data. Catches mobile regressions before they tank conversion. |
| **`sonner`** | `^2.0.x` | Toast notifications for the "you're on the list" success and error states | Already used by `marketing-app`; tiny, accessible, no extra portal wrapper needed. |
| **`lucide-react`** | `^1.7.x` | Single icon for the submit button (`Mail` or `ArrowRight`) and footer social icons | Same as `marketing-app` so the stroke weight (1.75 px) matches the design spec §1 sidebar-icons rule applied to the landing's social/footer icons. |
| **`clsx` + `tailwind-merge`** | `^2.x` / `^3.5.x` | `cn()` helper for conditional class composition | Standard shadcn utility; copy `lib/utils.ts` from `marketing-app` verbatim. |
| **`class-variance-authority`** | `^0.7.x` | Variant-driven button styles (`btn` vs `btn-hero` per spec) | Already the pattern shadcn uses; lets the pill-button component carry both variants without duplication. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `eslint` + `eslint-config-next` | Lint rules consistent with `marketing-app` | Use version `16.2.x` of `eslint-config-next` to match Next runtime. |
| `vitest` + `@testing-library/react` + `happy-dom` | Unit tests for the Server Action's dedup/already-subscribed branches | Same toolchain as `marketing-app`; one test file covers the form happy path and the four error states. |
| Vercel CLI | Local production builds, preview deploys | `vercel link` to the Quibly Vercel team; preview URL per PR for QA. |
| `husky` (optional) | Pre-commit `tsc --noEmit` + lint | Borrow `marketing-app`'s setup if the repo grows past one page. |

> **Deliberately omitted from runtime:** `next-themes` (no dark mode for v1; pre-launch site is white-dominant per design spec §2), `@tailwindcss/typography` (no MDX content on this site — privacy/terms are short hand-coded HTML or minimal MDX), `radix-ui` (no menus/popovers/dialogs needed for one form), `recharts`, `cmdk`, `date-fns`, `react-day-picker`, `drizzle-orm`, `@supabase/*`, all `@ai-sdk/*` packages, Stripe — these belong to `marketing-app`'s app surface, not a landing page.

---

## Installation

```bash
# Bootstrap
npx create-next-app@latest quibly-landing \
  --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"

cd quibly-landing

# Core runtime (matching marketing-app versions)
npm install \
  resend@^6.12 \
  zod@^4.0 \
  @react-email/components@^1.0 \
  @marsidev/react-turnstile@^1 \
  @vercel/analytics@^1 \
  @vercel/speed-insights@^1 \
  sonner@^2.0 \
  lucide-react@^1.7 \
  clsx@^2.1 \
  tailwind-merge@^3.5 \
  class-variance-authority@^0.7 \
  tw-animate-css@^1.4

# shadcn CLI + components (copy the ones marketing-app uses for tokens parity)
npx shadcn@latest init    # accept Tailwind v4 + oklch tokens
npx shadcn@latest add button input label sonner form

# Dev
npm install -D \
  @types/node@^20 \
  @types/react@^19 \
  @types/react-dom@^19 \
  vitest@^4 \
  @testing-library/react@^16 \
  @testing-library/jest-dom@^6 \
  happy-dom@^20
```

> **After install:** copy `app/globals.css` (the `@theme inline` + `:root` token block) and `lib/utils.ts` from `/Users/jeff/repos/marketing-app/` verbatim. Do not paraphrase — token drift between the two repos is the #1 risk during launch handoff.

---

## Specific Architectural Decisions

### Framework choice — Next.js (not Astro, Carrd, Framer, or static HTML)

| Option | Why it loses for this project |
|--------|------------------------------|
| **Astro 5** | Wins on raw Lighthouse (95–100 vs 85–95 for Next on content sites — see [eastondev.com](https://eastondev.com/blog/en/posts/dev/20251202-astro-vs-nextjs-comparison/)). **Loses** because the brand contract — Tailwind v4 `@theme inline`, shadcn radii, oklch tokens, `next/font` Quicksand/Figtree pipeline — lives in `marketing-app` as Next + React components. Astro can run React islands, but every component would need a re-port and the design tokens would need a separate Tailwind v4 config that drifts the moment `marketing-app` updates. The 5–10 Lighthouse points are recoverable via Next's static rendering + zero client JS in the hero. |
| **Framer / Webflow** | No way to share the exact oklch tokens, the Quicksand/Figtree font preload pipeline, or the Quibs SVG mascot rendering with `currentColor`. Brand fidelity collapses. Also: Resend integration requires a CMS-level webhook bridge or a third-party form service, adding a vendor and an outage axis. |
| **Carrd** | Cannot reuse the design system. Cannot host arbitrary Server-Action logic for opt-in + welcome email. Cannot serve a custom OG image generated from the Quibs mascot SVG. Fine for a generic "coming soon" page, wrong fit when brand assets already exist. |
| **Static HTML + plain `<form>` POST to a Resend serverless function** | Technically possible. Loses the type-shared Zod schema, the `next/font` preloader, the `@react-email/components` JSX-to-HTML pipeline, and the Vercel Analytics auto-instrumentation. Saves ~50 KB of framework JS, but Next 16 + App Router static rendering already ships near-zero client JS for a server-rendered hero — the savings are marginal and the maintenance cost is higher when the page evolves (live signup counter, A/B variants). |

**Verdict:** Next.js 16.2, App Router, single static-rendered `app/page.tsx`. **HIGH confidence.**

### Fonts — Quicksand (headings) + Figtree (body) via `next/font/google`

```typescript
// app/layout.tsx
import { Quicksand, Figtree } from 'next/font/google'

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'], // wordmark needs 700, body buttons 500–600
  display: 'swap',
  variable: '--font-quicksand',
})

const figtree = Figtree({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-figtree',
})

// <html className={`${quicksand.variable} ${figtree.variable}`}>
```

Both are single-axis variable fonts on Google Fonts (Quicksand 300–700, Figtree 300–900). `next/font/google` self-hosts WOFF2 files at build time, eliminates the Google Fonts CDN round-trip, generates a `font-display: swap` `@font-face`, and emits a `<link rel="preload">` for the requested subsets ([Next.js fonts API](https://nextjs.org/docs/app/api-reference/components/font)). This is the **only** correct way to load these fonts on Next 16 — using a `<link href="fonts.googleapis.com/...">` directly costs ~200ms LCP on slow mobile and breaks the CSP we'll want to add later.

The `--font-quicksand` and `--font-figtree` CSS variables map directly into `marketing-app`'s `@theme inline { --font-heading: var(--font-quicksand); --font-body: var(--font-figtree); }` block — copy that block intact.

**Confidence: HIGH** (verified against both Google Fonts variable-font registry and Next.js 16.2 docs).

### Email submission path — Server Action calling `resend.contacts.create({ audienceId, … })` directly

**Recommendation:** A single Server Action in `app/actions/subscribe.ts`:

```typescript
'use server'
import { Resend } from 'resend'
import { z } from 'zod'

const resend = new Resend(process.env.RESEND_API_KEY)
const schema = z.object({ email: z.string().email().max(254), turnstileToken: z.string() })

export async function subscribe(formData: FormData) {
  // 1. Honeypot check (reject if hidden field is filled)
  if (formData.get('website')) return { ok: true } // silently drop bots

  // 2. Validate
  const parsed = schema.safeParse({
    email: formData.get('email'),
    turnstileToken: formData.get('cf-turnstile-response'),
  })
  if (!parsed.success) return { ok: false, error: 'Please enter a valid email.' }

  // 3. Verify Turnstile server-side
  const tsRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY!,
      response: parsed.data.turnstileToken,
    }),
  }).then(r => r.json())
  if (!tsRes.success) return { ok: false, error: 'Verification failed. Please try again.' }

  // 4. Add to Resend audience (idempotent: handle duplicate gracefully)
  const result = await resend.contacts.create({
    audienceId: process.env.RESEND_AUDIENCE_ID!,
    email: parsed.data.email,
    unsubscribed: false,
  })
  // Resend returns { error: { name: 'validation_error', message: '... already exists' } }
  // for duplicates. Treat as success — the user is on the list either way.

  // 5. Fire-and-forget welcome email (only on first signup; check result.error)
  if (!result.error) {
    await resend.emails.send({
      from: 'Quibly <hello@useQuibly.com>',
      to: parsed.data.email,
      subject: 'You\'re on the Quibly waitlist',
      react: WelcomeEmail({ email: parsed.data.email }),
    })
  }

  return { ok: true, alreadySubscribed: !!result.error }
}
```

**Why Server Action and not an API Route or "submit straight to Resend from the browser":**

| Option | Verdict |
|--------|---------|
| **Server Action** (recommended) | Type-safe inputs, no public API surface, works progressively (submits even with JS disabled when paired with `<form action={subscribe}>`), Next 16.2 logs execution server-side for free debugging, error boundaries handle uncaught exceptions without crashing the page. ([Next.js 16.2](https://nextjs.org/blog/next-16-2)) |
| API Route (`app/api/subscribe/route.ts`) | Equivalent functionality, but the Server Action gets you progressive enhancement and better TS ergonomics for the same line count. Pick API Route only if a third party (e.g., a future Carrd splash) needs to POST to the same endpoint. |
| Direct browser → Resend | Requires exposing the Resend API key to the client. **Never do this.** Anyone can scrape the key and send mail from the verified domain. |
| Resend's hosted "Subscribe" widget / iframe | Loses brand styling, can't be themed to Quicksand/teal pills, breaks the conversion-funnel analytics. |

**Confidence: HIGH** (verified against Resend SDK, Next.js Server Actions docs, and the existing pattern in `marketing-app`'s newsletter forms).

> **Resend dedup behavior — VERIFY EARLY.** The official Resend create-contact docs do not document the duplicate-email response shape (verified in source — see [Resend create-contact](https://resend.com/docs/api-reference/contacts/create-contact)). Plan to confirm in a 5-minute manual test on day 1 of implementation: call `contacts.create()` twice with the same email and inspect the response. The treatment in the snippet above (treat error as "already subscribed, success") is the safe assumption but should be empirically validated. **Confidence on the dedup branch: MEDIUM until verified.**

### Bot/spam protection — Cloudflare Turnstile + honeypot (defense in depth)

| Approach | Recommended? | Rationale |
|----------|--------------|-----------|
| **Honeypot only** (hidden `<input name="website">`) | YES (always-on) | Costs nothing, no third-party JS, blocks ~80% of unsophisticated bots. Always include. |
| **Cloudflare Turnstile** | YES (primary) | Invisible to most users, no Cloudflare-routing dependency, free forever, ~30 KB lazy-loaded JS. Score-impact only at first interaction (after LCP). [Cloudflare](https://www.cloudflare.com/application-services/products/turnstile/) |
| hCaptcha | NO | Heavier UI (often shows visible challenges), worse conversion, only justified at 1M+ requests/month where revenue-share kicks in. Overkill for pre-launch waitlist. |
| reCAPTCHA v3 | NO | Google tracking + privacy/cookie banner implications. Avoid for a brand pitching itself as a friendly upstart. |
| Upstash Redis rate-limit (per-IP) | OPTIONAL (defer) | Add only if abuse appears in week 1. Single Server Action behind Vercel + Turnstile is sufficient at expected pre-launch volume (likely < 100 signups/day). Can be layered in later without re-architecting. |

**Stack: honeypot (free) + Turnstile (free).** This pair is the 2026 default for high-conversion forms. **Confidence: HIGH.**

### Analytics — Vercel Analytics + Vercel Speed Insights (only)

| Option | Verdict |
|--------|---------|
| **Vercel Analytics + Speed Insights** (recommended) | Free on Vercel paid plans, ~1.6 KB combined script, no cookies → no GDPR consent banner needed (cookieless), captures the one custom event we need (`waitlist_signup`), and Speed Insights flags real-user LCP regressions. ([Vercel comparison](https://swetrix.com/comparison/posthog/vs-vercel-web-analytics)) |
| Plausible | Slightly smaller script (~1 KB) and prettier dashboards, but $9/mo and adds a vendor for ~zero marginal value at this stage. Choose if leaving Vercel later. |
| PostHog | Excellent for product analytics inside the app. **Wrong tool for a one-page waitlist** — full SDK is ~50 KB, hurts LCP, and the funnel/replay features need a real product surface. Add PostHog later inside `marketing-app`'s authenticated routes. |
| Google Analytics 4 | NO. Heavy script, requires a cookie banner, privacy theater, conversion-killing UX on a brand-aligned page. |

**Stack: Vercel Analytics + Speed Insights.** **Confidence: HIGH.**

### Legal / cookie banner — minimal, deferred or static

The site sets **no marketing cookies**. Vercel Analytics is cookieless. Turnstile uses `__cf_bm` (a managed-bot cookie classified as "strictly necessary" under GDPR — does not require consent). Therefore:

- **No cookie consent banner** in v1. A banner that blocks paint costs LCP and conversion for zero compliance benefit when no consent is required.
- **Footer must include:** `Privacy` link, `Terms` link, contact mailto.
- **Privacy page must explicitly state:** what's collected (email, IP from Vercel logs, anonymized analytics), why (waitlist communication + product launch), retention (until launch + 12 months), and how to request deletion (mailto). CAN-SPAM and GDPR-Art-13 minimum compliance.
- **Welcome email must include:** physical mailing address (CAN-SPAM §316.5), mailto unsubscribe (single-opt-in waitlists must support unsubscribe even before broadcast emails start).

If legal review later requires a banner, use a minimal static `<div>` with deferred mount (no third-party SDK like CookieYes/OneTrust — those tank Lighthouse).

**Confidence: HIGH** for the no-banner stance given the actual cookie surface; **MEDIUM** for jurisdiction-specific legal review (recommend reading marketing-app's existing privacy/terms templates and copying with `useQuibly.com` substitutions).

### OG image generation — `ImageResponse` from `next/og` (built-in)

```typescript
// app/opengraph-image.tsx
import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function og() {
  return new ImageResponse(
    (
      <div style={{ /* teal gradient bg, Quibs Q-face SVG, tagline in Quicksand */ }}>
        ...
      </div>
    ),
    { ...size, fonts: [{ name: 'Quicksand', data: quicksandBuffer, weight: 700 }] }
  )
}
```

`ImageResponse` is now 2× faster (up to 20× for complex images) in 16.2 ([Next.js 16.2](https://nextjs.org/blog/next-16-2)). One `app/opengraph-image.tsx` and one `app/twitter-image.tsx` cover all social previews; Next handles the metadata wiring automatically. The Quibs Q-face SVG can be embedded as a React component since `ImageResponse` supports inline SVG.

**Alternative:** A static PNG export from Figma at `/public/og.png`. Faster to ship, but the dynamic `ImageResponse` route makes it trivial to add per-variant OG images later (e.g., "12,481 founders waiting" social-proof variant). Pick `ImageResponse` for parity with `marketing-app` and to avoid asset-management drift.

**Confidence: HIGH.**

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js 16.2 | **Astro 5** | If brand tokens lived in pure CSS files (not Tailwind v4 `@theme` blocks) and there were no plans to share React components with `marketing-app`. Astro wins +5–10 Lighthouse points but at the cost of a forked design system. |
| Next.js 16.2 | **Static HTML + serverless function** | If the page were single-purpose, never iterated, and had no shared design contract. Wrong fit here — brand assets exist, iteration is expected (live counter, social proof). |
| Resend Audiences | **ConvertKit / Mailchimp / Beehiiv** | If a non-engineer needed to broadcast from a UI before launch. Resend has audiences but its dashboard isn't optimized for marketing operators. Defer until the audience grows past 1k and you actually need broadcast UX. |
| Resend Audiences | **Supabase `waitlist` table + Resend transactional only** | If you wanted custom waitlist features (referral codes, position-on-list as a column, Postgres queries). Higher complexity; Resend Audiences exports to CSV cleanly when migrating to `marketing-app` — sufficient for v1. |
| Cloudflare Turnstile | **Honeypot only** | If conversion friction analysis (week 2–3 post-launch) shows Turnstile has zero lift over honeypot at observed traffic levels. Trivial to remove. |
| Vercel Analytics | **Plausible** | If/when the project leaves Vercel hosting. $9/mo, 1 KB script. |
| `next/font/google` | **Self-hosted WOFF2 files in `/public/fonts`** | Only if Google Fonts is blocked in target markets (e.g., explicit GDPR auditor demand). `next/font/google` already self-hosts at build time, so this is effectively redundant. |
| `@vercel/og` (`ImageResponse`) | **Static PNG export** | If the OG image never changes. Lower complexity; lose dynamic per-variant social cards. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Framer Motion** | 60+ KB bundle, defeats the LCP target on mobile. The hero only needs a fade-in on load and a button hover scale. | CSS transitions + `tw-animate-css`. Save Framer Motion for the full app. |
| **`react-hook-form` + `@hookform/resolvers`** | ~30 KB combined, pure overkill for one email field with one validator. | Native `<form action={serverAction}>` + Zod in the action. Progressive enhancement for free. |
| **`react-icons`** (the bulk-import library) | Default imports drag in megabytes. Tree-shaking is fragile. | `lucide-react` — already on `marketing-app`, single per-icon imports are tree-shaken correctly. |
| **`emoji-mart` / heavy emoji pickers** | Not needed for one form. | Native emoji or none. |
| **Third-party cookie banner SDKs** (CookieYes, OneTrust, Cookiebot) | Each ships 100–200 KB of JS that blocks paint. The site collects no marketing cookies, so they solve a non-problem. | Static footer disclosure + privacy page. |
| **Google Tag Manager** | Adds 70+ KB and a synchronous script. Not needed; Vercel Analytics covers the one event. | Vercel Analytics `track('waitlist_signup')`. |
| **Hero video / Lottie animations** | Each costs 200KB–2MB; LCP killer. The Quibs mascot SVG (~5 KB) carries the personality. | Static SVG + a subtle CSS keyframe wave/blink on the Q-face dots. |
| **Self-hosted reCAPTCHA / Google reCAPTCHA v3** | Adds Google tracking, privacy implications, and a heavier UX than Turnstile. | Cloudflare Turnstile. |
| **Fonts loaded via `<link>` to `fonts.googleapis.com`** | Costs a render-blocking RTT and external DNS lookup. ~200ms LCP penalty on mobile. | `next/font/google` (self-hosts at build, preloads correctly). |
| **`@tailwindcss/typography` plugin** | Only valuable for long-form prose; adds CSS bloat. The privacy/terms pages are short enough to style by hand. | Hand-styled prose in privacy/terms only. |
| **Two-axis variable font subsets (`weight` + `slnt`/`opsz`)** for Quicksand/Figtree | Both are single-axis (weight only) — requesting extra axes silently fails or downloads larger files. | Pin `weight: ['400','500','600','700']` only. |
| **`next-themes`** | No dark mode in v1 (design spec §2: "white-dominant, no dark backgrounds"). Adds hydration cost. | Omit entirely. |
| **Drizzle / Prisma / Supabase** | No DB needed when Resend Audience is the source of truth. | Resend Audiences API only. |

---

## Stack Patterns by Variant

**If "live signup counter" launches in week 2–3:**
- Add `unstable_cache` + a Resend `audiences.list()` count call, revalidated every 60s
- Render server-side as `{count} founders on the list` — no client JS needed
- Because: pulls a single number, can be `force-static` with a 60s revalidate, doesn't add a single byte to the client bundle

**If signups exceed 1k and broadcast UX is needed:**
- Migrate Audience export → ConvertKit or stay on Resend Broadcasts
- Keep Resend Audiences as primary, add ConvertKit as broadcast layer via webhook
- Because: Resend's broadcast UI is acceptable for now; only swap when a non-engineer needs to send manually

**If the page needs A/B tests (different headlines):**
- Use Vercel Edge Config + middleware (not a full A/B framework like Optimizely)
- Two static variants, edge middleware splits traffic by cookie hash
- Because: keeps the page static, no client-side flicker, ~5 lines of middleware

**If Resend deliverability becomes an issue:**
- Verify SPF/DKIM/DMARC on `useQuibly.com` (Resend dashboard provides DNS records)
- Add a postmaster mailbox + reply-to that is monitored
- Because: pre-launch waitlist emails have higher spam-trap risk; sender reputation matters before broadcasts

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `next@16.2.x` | `react@19.2.x`, `react-dom@19.2.x` | Pinned by Next 16; `marketing-app` runs `react@19.2.4`. Match. |
| `tailwindcss@^4` | `@tailwindcss/postcss@^4` | v4 requires the new postcss adapter (separate package); v3 PostCSS plugin will not parse `@theme inline`. |
| `shadcn@^4.1` (CLI) | `tailwindcss@^4`, `react@19` | shadcn moved to Tailwind v4 + React 19 in early 2025; older copy-paste components from 2024 reference `tailwind.config.js` JS-style — regenerate via the v4 CLI to get CSS-token-based variants. ([shadcn Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4)) |
| `resend@^6.12` | Node 18+ | `marketing-app` uses 6.12.0 — pin to the same minor for behavior parity. |
| `zod@^4.0` | TS ≥5.0 | Zod 4 has stricter inference; if copying Zod 3 schemas from `marketing-app`, verify they still type-check (most do). |
| `@react-email/components@^1.0` | `react@^18 || ^19` | Email templates compile to inline-styled HTML; tested with React 19. |
| `@marsidev/react-turnstile@^1` | `react@^18 || ^19`, Next App Router | SSR-ready; the `ref`-based token retrieval pattern is documented for Server Actions. |
| `@vercel/analytics@^1` + `@vercel/speed-insights@^1` | Next 13+, App Router | Wrap `<body>` in the `<Analytics />` and `<SpeedInsights />` components. |

**Known compatibility gotcha:** Tailwind v4's `@plugin "shadcn/tailwind.css"` directive (used in `marketing-app/app/globals.css`) requires the shadcn CLI v4. If you scaffold with an older shadcn CLI version, the directive resolves to a stale path. Run `npx shadcn@latest init` even if the project already has Tailwind installed.

---

## Confidence Assessment

| Recommendation | Confidence | Notes |
|---------------|------------|-------|
| Next.js 16.2.x as framework | **HIGH** | Verified against `marketing-app` package.json + Next.js 16.2 release notes (March 2026). |
| Tailwind v4 + shadcn/ui | **HIGH** | Required by token reuse; verified via shadcn docs and `marketing-app/app/globals.css`. |
| Resend + Audiences API | **HIGH** | Verified via Context7 + Resend docs + existing `marketing-app` integration. |
| Server Action submission path | **HIGH** | Verified against Next.js 16.2 Server Actions docs. |
| Resend duplicate-email handling | **MEDIUM** | The exact error response shape on duplicate `contacts.create()` is not in public docs — must verify empirically on day 1. |
| Cloudflare Turnstile | **HIGH** | Verified via Context7 (`@marsidev/react-turnstile` + Cloudflare Turnstile docs). |
| Honeypot pattern | **HIGH** | Long-established pattern; zero risk. |
| Vercel Analytics + Speed Insights | **HIGH** | Verified Vercel docs + comparison with PostHog/Plausible. |
| `next/font/google` for Quicksand + Figtree | **HIGH** | Verified both fonts exist as variable fonts on Google Fonts; Next.js fonts API confirmed. |
| `@vercel/og` `ImageResponse` for OG | **HIGH** | Verified via Next.js 16.2 release notes (2× faster). |
| No cookie banner | **HIGH** technical, **MEDIUM** legal | No marketing cookies are set; banner is unnecessary technically, but final call belongs to legal review of the privacy template. |
| Astro rejected | **HIGH** | Verified Astro performance advantage exists (5–10 Lighthouse points) but is outweighed by brand-token reuse cost. |

---

## Sources

**Context7 / authoritative SDK docs (HIGH confidence):**
- `/vercel/next.js` — Next.js 16.2 App Router, Server Actions, `next/font/google`, `ImageResponse`
- `/websites/resend` — `contacts.create`, `audiences.create`, `emails.send`
- `/marsidev/react-turnstile` — Turnstile + Next.js Server Action token verification pattern
- `/colinhacks/zod` (`/websites/zod_dev_v4`) — Zod 4 schema validation

**Official documentation (HIGH confidence):**
- [Next.js 16.2 release notes](https://nextjs.org/blog/next-16-2) — perf improvements, Server Function logging, `ImageResponse` 2× speedup (March 2026)
- [Next.js fonts API](https://nextjs.org/docs/app/api-reference/components/font) — variable font config, preload, subsets
- [shadcn/ui Tailwind v4 guide](https://ui.shadcn.com/docs/tailwind-v4) — CSS-first tokens, oklch, `@theme inline`
- [Resend create-contact API](https://resend.com/docs/api-reference/contacts/create-contact) — endpoint and parameters (duplicate-error shape NOT in public docs → verify empirically)
- [Resend Audiences (Bun example)](https://resend.com/docs/examples) — `audiences.addContact` pattern
- [Cloudflare Turnstile](https://www.cloudflare.com/application-services/products/turnstile/) — invisible CAPTCHA, free
- [Google Fonts: Quicksand](https://fonts.google.com/specimen/Quicksand) — variable font, weight 300–700
- [Google Fonts: Figtree](https://fonts.google.com/specimen/Figtree) — variable font, weight 300–900

**Internal repo references (HIGH confidence — directly inspected):**
- `/Users/jeff/repos/marketing-app/package.json` — pinned versions to mirror
- `/Users/jeff/repos/marketing-app/app/globals.css` — `@theme inline` token block, oklch primary, radius scale, font CSS variables
- `/Users/jeff/repos/marketing-app/docs/superpowers/specs/2026-04-14-quibly-design-system.md` — pill button radii, Quicksand/Figtree weights, color hex equivalents
- `/Users/jeff/repos/quibly-landing/.planning/PROJECT.md` — constraints (Next 16+, Tailwind v4, Resend, Vercel, Lighthouse ≥90, 83% mobile traffic)

**Comparative research (MEDIUM confidence — multi-source synthesis):**
- [Astro vs Next.js performance, eastondev 2025-12-02](https://eastondev.com/blog/en/posts/dev/20251202-astro-vs-nextjs-comparison/) — Astro 95–100 vs Next 85–95 Lighthouse on content sites
- [PostHog vs Plausible vs Vercel Analytics, F³ 2026](https://f3fundit.com/the-solopreneur-analytics-stack-2026-posthog-vs-plausible-vs-fathom-analytics-and-why-you-should-ditch-google-analytics/)
- [Vercel Web Analytics overview, Swetrix 2026](https://swetrix.com/comparison/posthog/vs-vercel-web-analytics)
- [Cloudflare Turnstile vs hCaptcha 2026, Websyro](https://www.websyro.com/blogs/hcaptcha-vs-cloudflare-turnstile-2026-comparison)

---

*Stack research for: pre-launch SaaS waitlist landing page (Quibly)*
*Researched: 2026-04-27*
