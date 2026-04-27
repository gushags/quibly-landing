# Architecture Research

**Domain:** Pre-launch SaaS waitlist landing page (Next.js 16 App Router + Resend Audiences on Vercel)
**Researched:** 2026-04-27
**Confidence:** HIGH (verified against current Resend docs, Next.js 16 release notes, and Vercel domain transfer docs; cutover specifics drawn from Vercel "instantly transfer domains to new projects" feature, MEDIUM confidence on the exact UI flow at execution time)

---

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         BROWSER (mobile-first)                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  app/page.tsx  (RSC — static, cacheable, no JS required)   │  │
│  │   ├── <Hero>            (Quibs mascot + tagline + form)    │  │
│  │   │     └── <WaitlistForm/>  (Client Component island)     │  │
│  │   ├── <WhyQuibly>        (3 text differentiators)          │  │
│  │   └── <Footer>           (privacy / terms links)           │  │
│  └────────────────────────────────────────────────────────────┘  │
│         │ form POST (progressive enhancement: works w/o JS)       │
│         ▼                                                          │
├──────────────────────────────────────────────────────────────────┤
│                    NEXT.JS 16 SERVER (Vercel Functions)           │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  app/actions/join-waitlist.ts   ('use server')             │  │
│  │   1. Zod email validation                                  │  │
│  │   2. Honeypot check (silently succeed if tripped)          │  │
│  │   3. Rate-limit check (IP-keyed, Upstash Redis)            │  │
│  │   4. resend.contacts.create({ audienceId, email })         │  │
│  │      → tolerate "already exists" (treat as success)        │  │
│  │   5. resend.emails.send({ react: <WelcomeEmail/> })        │  │
│  │      → fire-and-forget; do NOT block success state         │  │
│  │   6. track('waitlist_signup') (server-side analytics)      │  │
│  │   7. return { ok: true } | { ok: false, error }            │  │
│  └────────────────────────────────────────────────────────────┘  │
│         │                          │                              │
│         ▼                          ▼                              │
├─────────────────────────┬────────────────────────────────────────┤
│  emails/WelcomeEmail.tsx │  lib/resend.ts (singleton client)     │
│   (React Email JSX)      │  lib/rate-limit.ts (Upstash)           │
│   server-rendered → HTML │  lib/analytics.ts (@vercel/analytics)  │
└─────────────────────────┴────────────────────────────────────────┘
         │                          │
         ▼                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                       EXTERNAL SERVICES                           │
│  ┌──────────────┐  ┌─────────────────┐  ┌────────────────────┐   │
│  │  Resend API  │  │ Upstash Redis   │  │ Vercel Analytics    │   │
│  │  (Audiences  │  │ (rate limit     │  │ (page views +       │   │
│  │   + Send)    │  │  buckets)       │  │  custom events)     │   │
│  └──────────────┘  └─────────────────┘  └────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `app/page.tsx` | Static landing page composition (RSC) | Server Component, no client JS by default; renders Hero + WhyQuibly + Footer |
| `<Hero>` | Brand presentation (mascot, tagline, headline) | RSC — pure markup, no interactivity |
| `<WaitlistForm>` | Single-field email capture + state UX | Client Component (`'use client'`); uses `useActionState` to bind to server action; progressive enhancement (works without JS) |
| `app/actions/join-waitlist.ts` | The single mutation: validate → spam-check → store → email → track | Server Action (`'use server'`); the entire submit pipeline lives here |
| `lib/resend.ts` | Resend SDK singleton, env-validated at module load | `import 'server-only'` + Resend constructor; throws if `RESEND_API_KEY` missing (mirrors `marketing-app/lib/email/client.ts`) |
| `lib/rate-limit.ts` | Per-IP token bucket | `@upstash/ratelimit` + `@upstash/redis`; sliding window, e.g. 5/min per IP |
| `lib/analytics.ts` | Wrapper around `@vercel/analytics/server` for `track()` calls | Thin wrapper for typed event names (`waitlist_signup`, `waitlist_signup_duplicate`, `waitlist_signup_error`) |
| `emails/WelcomeEmail.tsx` | Welcome email body (React Email JSX) | React Email components rendered to HTML by Resend SDK at send time |
| `app/(legal)/privacy/page.tsx`, `terms/page.tsx` | Static legal pages | RSCs, plain Markdown-via-MDX or hand-typed JSX |
| `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx` | SEO + social metadata | Next.js file conventions; OG image is a Next.js dynamic OG image |
| `middleware.ts` (optional) | Apex/www canonicalization, future cutover redirects | Edge middleware; minimal — only if both `useQuibly.com` and `www.useQuibly.com` resolve here |

**Boundary rule:** the **Server Action is the only seam** between browser-trusted input and external services. Resend, Upstash, and analytics are never imported into client components. `import 'server-only'` on `lib/resend.ts` enforces this at build time.

---

## Recommended Project Structure

```
quibly-landing/
├── app/
│   ├── layout.tsx                  # Root layout: fonts (Quicksand/Figtree),
│   │                               # Tailwind v4 token wiring, <Analytics/>
│   ├── page.tsx                    # The landing page (RSC)
│   ├── opengraph-image.tsx         # Dynamic OG image (Next.js convention)
│   ├── robots.ts                   # Robots.txt generator
│   ├── sitemap.ts                  # Sitemap generator
│   ├── globals.css                 # Tailwind v4 + design tokens (copied
│   │                               # from marketing-app/app/globals.css)
│   ├── (legal)/
│   │   ├── privacy/page.tsx        # Privacy policy
│   │   └── terms/page.tsx          # Terms of service
│   └── actions/
│       └── join-waitlist.ts        # 'use server' — the ONE mutation
├── components/
│   ├── hero.tsx                    # RSC — mascot + tagline + form slot
│   ├── waitlist-form.tsx           # Client Component — useActionState
│   ├── why-quibly.tsx              # RSC — 3 text differentiators
│   ├── footer.tsx                  # RSC — links + © line
│   └── ui/                         # shadcn-style primitives (Button, Input)
├── emails/
│   └── welcome-email.tsx           # React Email template (single email)
├── lib/
│   ├── resend.ts                   # Singleton Resend client (server-only)
│   ├── rate-limit.ts               # Upstash rate limiter
│   ├── analytics.ts                # Typed track() wrapper
│   ├── env.ts                      # Zod-validated env at module load
│   └── brand.ts                    # Re-export of design tokens / strings
├── public/
│   └── quibs-mascot.svg            # Copied from marketing-app
├── .planning/                      # GSD planning docs (not deployed)
├── .env.local                      # Local secrets (gitignored)
├── .env.example                    # Committed template
├── middleware.ts                   # OPTIONAL — host canonicalization only
├── next.config.ts
├── tailwind.config.ts              # Tailwind v4 config
└── package.json
```

### Structure Rationale

- **`app/actions/` (singular file `join-waitlist.ts`)**: The entire submit pipeline lives in one file. There is exactly one mutation in this product — flatness beats over-organization.
- **`emails/` at repo root** (not under `app/`): Mirrors `marketing-app` convention. React Email tooling (`react-email dev`) expects this location and will preview templates on a separate dev port.
- **`lib/env.ts` with Zod**: Validates `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`, `RESEND_FROM_EMAIL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` at module load. Missing-env failures must crash at boot, not on first signup.
- **`(legal)/` route group**: Keeps `/privacy` and `/terms` URLs flat (no `/legal/privacy`) while grouping the source code.
- **No `src/` directory**: Matches `marketing-app` convention. With ~15 files total, nesting under `src/` adds noise without payoff.
- **No `api/` route handlers**: The single mutation is a Server Action. See "Server Action vs Route Handler" below.

---

## Architectural Patterns

### Pattern 1: Server Action as the Single Mutation Seam

**What:** All form submission logic — validation, spam checks, Resend storage, welcome email, analytics — lives in **one Server Action** rather than a `/api/waitlist` route handler.

**When to use:** A human-triggered form mutation that lives inside this app's UI. (Use a route handler instead when something *outside* the app needs to call the endpoint — webhooks from Resend, cron, third-party callers.)

**Why for this project:** The official Next.js guidance and current ecosystem consensus (2026) is "default to Server Actions for internal form mutations; reach for Route Handlers only when a non-browser caller exists or you need custom HTTP semantics." Server Actions give us:
- Built-in CSRF protection (Next.js handles origin checks automatically)
- Progressive enhancement for free — the form posts and works even with JavaScript disabled, which is non-trivial bot-resistance and a real accessibility win
- Type-safe end-to-end without hand-defining a request/response contract
- Simpler env model — no `/api` route to test in isolation
- Native pairing with React 19's `useActionState` for pending/error/success UI

**Trade-offs:**
- Server Actions are POST-only and not cacheable — fine, this is a mutation
- Cannot be invoked by external services — fine, only the form calls it
- Slightly opaque debugging (the URL is an internal Next.js endpoint with a hashed action ID) — acceptable for a single endpoint

**Decision:** Server Action. Justified by single-caller, single-mutation, in-app-only requirements.

**Example:**
```typescript
// app/actions/join-waitlist.ts
'use server'

import { z } from 'zod'
import { resend } from '@/lib/resend'
import { ratelimit } from '@/lib/rate-limit'
import { track } from '@/lib/analytics'
import { headers } from 'next/headers'
import WelcomeEmail from '@/emails/welcome-email'

const Schema = z.object({
  email: z.string().email().max(254),
  // Honeypot — must be empty. Bots fill all fields.
  company: z.string().max(0).optional().or(z.literal('')),
})

export type JoinWaitlistState =
  | { status: 'idle' }
  | { status: 'success'; alreadyOnList: boolean }
  | { status: 'error'; message: string }

export async function joinWaitlist(
  _prev: JoinWaitlistState,
  formData: FormData,
): Promise<JoinWaitlistState> {
  const parsed = Schema.safeParse({
    email: formData.get('email'),
    company: formData.get('company'),
  })

  // Honeypot tripped OR invalid email → return generic-looking success to bots,
  // specific error to humans
  if (!parsed.success) {
    return { status: 'error', message: 'Please enter a valid email.' }
  }
  if (parsed.data.company) {
    // Honeypot tripped — pretend it worked, don't tell the bot.
    return { status: 'success', alreadyOnList: false }
  }

  // Per-IP rate limit (5/min sliding window)
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  const { success } = await ratelimit.limit(ip)
  if (!success) {
    return { status: 'error', message: 'Too many attempts. Try again in a minute.' }
  }

  try {
    const result = await resend.contacts.create({
      email: parsed.data.email,
      audienceId: process.env.RESEND_AUDIENCE_ID!,
      unsubscribed: false,
    })

    // Resend's API treats duplicate adds idempotently — but defensively check
    // for any "already exists" indicator and treat it as success.
    const alreadyOnList = !!result.error // see error-handling table below

    // Fire-and-forget welcome email; do not block success on email send.
    // If this throws, log it — but the contact IS in the audience, so the
    // user is on the waitlist. The next broadcast will reach them.
    resend.emails
      .send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: parsed.data.email,
        subject: "You're on the Quibly waitlist",
        react: WelcomeEmail({ email: parsed.data.email }),
      })
      .catch((err) => console.error('welcome email send failed', err))

    await track('waitlist_signup', { duplicate: alreadyOnList })
    return { status: 'success', alreadyOnList }
  } catch (err) {
    console.error('joinWaitlist failed', err)
    await track('waitlist_signup_error')
    return { status: 'error', message: 'Something went wrong. Please try again.' }
  }
}
```

### Pattern 2: Storage in Resend Audiences (not the Contacts global API)

**What:** Use `resend.contacts.create({ audienceId, email })` against a named Audience — *not* the new global `/contacts` endpoint without an audience scope.

**Why:** Resend has two related concepts:
- **Audiences** — named groups of contacts you send Broadcasts to. Audiences are addressable (`audienceId`). This is what the form should write into. The free tier covers 1,000 contacts; paid plans start at 5,000.
- **Contacts (global)** — Resend recently introduced a global Contacts namespace where contacts exist independent of any one audience. Useful for cross-audience preference management; not what we need here.

For a waitlist, we want a single named audience (e.g. "Quibly Waitlist") that we can later target with a Broadcast ("Quibly is live!") and export to CSV at handoff time. `resend.contacts.create` with `audienceId` does both. The new global Contacts API would force us to do an extra "add to audience" step at broadcast time.

**Storage decision:** ONE audience named `Quibly Waitlist`. Audience ID stored as `RESEND_AUDIENCE_ID` env var. Audience created manually in the Resend dashboard *before* first deploy (one-time setup, not in code).

**Trade-offs:**
- Tied to Resend (vendor lock-in) — acceptable; CSV export is supported and `marketing-app` is already on Resend.
- No custom fields beyond email/firstName/lastName/unsubscribed/properties — fine, we're collecting email only.
- Free tier ceiling at 1,000 contacts — at >15% conversion, this hits at ~6,700 visitors, comfortably above pre-launch volume; if we cross it before launch, paid plan is $40/mo.

### Pattern 3: Welcome Email as Fire-and-Forget Side Effect

**What:** After `contacts.create` succeeds, kick off `resend.emails.send` **without awaiting it** before the success response. Log failures; do not surface to user.

**Why:** The user's success criterion is *"my email is on the waitlist."* Adding the contact to the audience is the load-bearing operation. The welcome email is a courtesy. If Resend's transactional API has a momentary blip while their Audiences API is fine, the user has still succeeded — they're on the list, and the next broadcast will reach them. Blocking the success state on email send creates a worse UX (longer spinner, confusing error messages) for a non-critical side effect.

**Trade-off:** A user who never gets the welcome email may worry they aren't on the list. Mitigation: the success-state UI itself ("Welcome to the waitlist — we'll email you when Quibly is live") is the primary confirmation; the email is reinforcement. Acceptable.

**Caveat:** This is fire-and-forget *within the same request*. We're not using a queue. On Vercel serverless functions the Promise will resolve before the function instance is frozen because Server Actions await React's render flush, which gives Resend's HTTP request enough time. If we ever see logs showing aborted sends, switch to `waitUntil()` from `@vercel/functions` (the supported "after-response" pattern on Vercel).

### Pattern 4: Layered Spam Defense (Honeypot → Rate Limit → Email Validation)

**What:** Three cheap, complementary defenses, ordered cheapest-first, all applied inside the Server Action.

**Layer 1 — Honeypot:** A hidden `<input name="company">` that legitimate users never see (CSS `position:absolute; left:-9999px; opacity:0` + `tabIndex={-1}` + `autoComplete="off"`). Naive bots fill every field; if `company` is non-empty, return a *fake success* (don't tell the bot it failed). Rejection cost: nearly zero.

**Layer 2 — Per-IP rate limit:** Upstash Redis sliding-window limiter, 5 requests per IP per minute. Catches anything that gets past the honeypot from a single source. Rejection cost: one Redis round-trip (~5–20ms). Use `@upstash/ratelimit`.

**Layer 3 — Zod email validation:** RFC-loose email parse. Catches malformed addresses (and many random strings bots send). Rejection cost: zero (synchronous).

**Why no CAPTCHA:** Adds significant conversion friction (single-field forms convert 13–23% — CAPTCHA can drop that meaningfully) and isn't necessary for waitlist volumes. If post-launch we see actual abuse, add Turnstile (Cloudflare, free, invisible) as Layer 4. Defer until evidence demands it.

**Order matters:** Honeypot first (free), then rate limit (cheap, networked), then validation (free but per-request). If honeypot trips, we can skip rate-limit increment to avoid penalizing IPs for bot traffic — but in practice it's simpler and safe to count it.

### Pattern 5: Static-First Page, Client Island for the Form

**What:** `app/page.tsx`, `<Hero>`, `<WhyQuibly>`, `<Footer>` are all Server Components. Only `<WaitlistForm>` is a Client Component.

**Why:** Page is fully static at build time → cached at the edge → Lighthouse mobile ≥90 is achievable. Only the form needs client interactivity (pending state via `useActionState`, optimistic success message). Keeps the JavaScript bundle measured in KB, not tens of KB.

**Trade-off:** `useActionState` requires React 19 (Next.js 16's React canary baseline includes it). Not a constraint — we're already on Next.js 16.

---

## Data Flow

### Request Flow: Email Submit → Stored + Welcomed

```
[User taps "Join waitlist" on mobile]
    │
    ▼
[<WaitlistForm/> Client Component]
    │  formData = { email, company (honeypot) }
    │  useActionState transitions to pending
    ▼
[Server Action: joinWaitlist(prevState, formData)]
    │
    ├─► Zod parse email + honeypot field
    │       └─[fail]──► return { status: 'error', message: 'invalid' }
    │
    ├─► Honeypot non-empty?
    │       └─[yes]───► return { status: 'success' } (fake — bot doesn't learn)
    │
    ├─► Rate limit (Upstash, IP-keyed)
    │       └─[exceeded]► return { status: 'error', message: 'try again' }
    │
    ├─► resend.contacts.create({ audienceId, email })
    │       │
    │       ├─[200 OK]───► continue
    │       ├─[duplicate]► continue (treat as already-subscribed success)
    │       ├─[5xx]──────► return { status: 'error', message: 'try again' }
    │       └─[429]──────► return { status: 'error', message: 'try again' }
    │
    ├─► resend.emails.send(WelcomeEmail) — FIRE AND FORGET (.catch only)
    │
    ├─► track('waitlist_signup', { duplicate })
    │
    └─► return { status: 'success', alreadyOnList }
              │
              ▼
[<WaitlistForm/> useActionState updates]
    │
    ▼
[Success state renders: "You're on the list. Check your inbox."]
    │
    ▼
[Resend delivers WelcomeEmail (async, ~seconds later)]
```

### Error Path Matrix

| Failure mode | Detection | User-facing UX | Internal action |
|---|---|---|---|
| Invalid email format | Zod parse fail | Inline: "Please enter a valid email." | None |
| Honeypot tripped (bot) | `company` field non-empty | Fake success state | Drop silently; no analytics event |
| Rate limit exceeded | Upstash returns `success: false` | Inline: "Too many attempts. Try again in a minute." | Log; track `waitlist_signup_blocked` |
| Already subscribed | Resend returns success but with prior contact (or returns ok idempotently — Resend handles duplicates gracefully) | Same success state ("You're on the list") — do NOT reveal that they were already there (privacy: prevents enumeration) | track `waitlist_signup` with `duplicate=true` |
| Network failure to Resend | `resend.contacts.create` throws | Inline: "Something went wrong. Please try again." | console.error; track `waitlist_signup_error` |
| Resend Audiences API down (5xx) | Resend response error | Same generic error message | console.error; track `waitlist_signup_error` |
| Welcome email send fails | `.send()` rejects after contact created | **No user-facing error** — they're on the list. | console.error; do not retry inline |
| Invalid `RESEND_API_KEY` | Module load throws | App crashes at boot — caught by Vercel deploy | Deploy fails; alarm via Vercel |
| Missing `RESEND_AUDIENCE_ID` | `lib/env.ts` Zod fails at boot | App crashes at boot | Deploy fails; alarm via Vercel |

**Key principle:** *We never reveal whether an email is already in the audience to the submitter.* That's both a privacy choice (prevents email-enumeration) and a UX choice (an "already subscribed" message creates anxiety with no benefit — the user is on the list either way).

### Analytics Event Flow

```
Page view ─────────────► <Analytics/> (Vercel Web Analytics) — automatic
                            (component in app/layout.tsx)

Form submit success ───► track('waitlist_signup', { duplicate: bool })
                            (server-side, from inside Server Action)

Rate limited / error ──► track('waitlist_signup_error')
                            (server-side; helps quantify abuse)

Why server-side: client-side track() can be blocked by ad blockers (significant
on tech-audience landing pages). Server-side track is uncircumventable and gives
truer conversion-rate numbers — which is the whole point.
```

### State Management

There is no client state store. `useActionState` owns the form's pending/success/error state; that's the entire client state surface. The success state replaces the form in-place via conditional rendering — no router push, no page reload, no global store.

---

## Suggested Build Order

The architecture is what it is regardless of build order, but the *order in which you wire it up* matters for unblocking demos and reducing risk. Recommended sequence:

1. **Scaffold + design system** — `create-next-app` with Tailwind v4 + TypeScript + App Router. Copy `marketing-app/app/globals.css` design tokens and Quicksand/Figtree font wiring. Get a blank page rendering with brand colors.
2. **Static landing page (no form yet)** — `<Hero>` (mascot + tagline + headline), `<WhyQuibly>` (3 differentiators), `<Footer>` (with placeholder legal links). Confirm Lighthouse mobile ≥90 before adding any JS.
3. **Form UI shell (no submit handler)** — `<WaitlistForm>` Client Component with `useActionState`-shaped state, but the action is a stub `() => ({ status: 'success' })`. Validates the UX of pending → success → error transitions.
4. **Server Action skeleton** — `app/actions/join-waitlist.ts` with Zod validation only. Logs to console. Verifies the round-trip works end-to-end before any external service is wired.
5. **Resend Audience wiring** — Create the Audience in Resend dashboard, set `RESEND_AUDIENCE_ID` env, wire `resend.contacts.create`. *Test with a real email; verify it appears in the dashboard.*
6. **Welcome email template + send** — Build `emails/welcome-email.tsx` with React Email; preview locally with `npx react-email dev`; wire `resend.emails.send` as fire-and-forget. *Test inbox delivery to Gmail + Outlook + iCloud.*
7. **Spam protection** — Honeypot field, then Upstash rate limit. *Test honeypot manually; test rate limit by hammering.*
8. **Analytics** — Mount `<Analytics/>` in root layout, wire server-side `track()` calls. *Verify events show up in Vercel dashboard.*
9. **Legal pages** — `/privacy`, `/terms` published. (Required before going live for CAN-SPAM / GDPR.) Footer links activated.
10. **OG / SEO** — `app/opengraph-image.tsx`, metadata, `robots.ts`, `sitemap.ts`. Test with the Twitter card validator and LinkedIn post inspector.
11. **Deploy to Vercel preview** — Connect GitHub, deploy preview branch, verify the full flow against production Resend audience (use a separate audience for preview if paranoid).
12. **Production deploy at `useQuibly.com`** — DNS cutover (see "Cutover Plan" below). Smoke test with a real signup. Watch the Resend dashboard for the contact + delivery logs.

Build order rationale: each step is independently demoable. If we stop at step 5, we have a functioning email-capture page (just without the welcome email or polish). The risky external integrations (Resend, Upstash) come after the UX is proven, so we're never blocked on a third-party while debugging visual regressions.

---

## Cutover Plan: Handoff to `marketing-app`

The whole point of this separate repo is that it can be cleanly retired when `marketing-app` ships its full landing page. This section is the load-bearing one — the architecture exists to *enable* this handoff.

### Pre-cutover state

- `useQuibly.com` apex points to the `quibly-landing` Vercel project.
- `marketing-app` is deployed at a separate preview domain (e.g. `marketing-app.vercel.app` or a staging subdomain like `staging.useQuibly.com`).
- Resend audience "Quibly Waitlist" has N contacts.

### Cutover sequence (in order)

1. **Verify `marketing-app` is launch-ready** at its current preview URL. Smoke-test the new full landing page.
2. **Export the waitlist from Resend** to CSV via the Resend dashboard (Audiences → Export, beta feature; supported as of mid-2025). For audiences ≤1,000 contacts the CSV downloads immediately; larger lists arrive via emailed download link, valid for 7 days.
3. **Send the launch broadcast** from Resend ("Quibly is live!") to the existing `Quibly Waitlist` audience *before* the cutover, so the `quibly-landing` site is still the source of truth when the email goes out and links to `useQuibly.com` resolve to the (still-live) waitlist confirmation page. Alternatively, send post-cutover and link directly into `marketing-app`'s signup/login flow.
4. **Move the domain to `marketing-app`'s Vercel project.** Vercel as of 2024 supports moving an in-use domain between projects in one click — the dashboard prompts to "move the in-use domain and all associated redirects to the selected project" without first detaching it. This minimizes the downtime window to seconds, not minutes.
5. **`marketing-app` immediately serves at `useQuibly.com`.** No DNS change required if both projects are in the same Vercel team — the domain delegation is internal. (If projects are on different teams, follow Vercel's cross-team transfer flow.)
6. **Set up legacy redirects in `marketing-app`** (optional but recommended): old waitlist URLs (`/`, `/privacy`, `/terms` from the landing) should resolve to the new equivalents in `marketing-app`. If the URL paths are identical, no redirect needed; otherwise 301 in `marketing-app`'s `next.config.ts` or middleware.
7. **Decommission `quibly-landing` Vercel project** (or leave dormant). Do not delete the GitHub repo — it's the historical artifact and may be useful for the next pre-launch cycle.
8. **Import the waitlist CSV into `marketing-app`'s mailing infrastructure** (likely the same Resend account, possibly a renamed audience like "Quibly Customers" or a transactional list). Resend's CSV import accepts `email`, `first_name`, `last_name`, `unsubscribed` — the format we exported.

### Cutover prerequisites baked into the architecture

| Cutover requirement | How the architecture supports it |
|---|---|
| Waitlist must be portable | Stored in Resend Audience (CSV export supported); not in a bespoke Postgres table that would require a migration script |
| Domain must be transferrable cleanly | Both projects on Vercel under one team account — supports one-click domain move |
| No user data lock-in | Email-only collection; no app accounts, no passwords, no orphaned auth records |
| Welcome email content survives transition | `marketing-app` already uses Resend; the brand sender (`hello@useQuibly.com` or similar) is shared — no domain reverification needed |
| URLs in welcome email don't break | The welcome email links to `useQuibly.com/...` paths — those resolve to whichever project owns the domain, so post-cutover they hit `marketing-app` automatically |

### Rollback plan

If `marketing-app`'s production deploy has a critical issue:
1. Move the domain back to `quibly-landing` via the same one-click flow.
2. Resolution time: under 1 minute.
3. The waitlist remains intact in Resend regardless.

This rollback simplicity is the single biggest reason for keeping `quibly-landing` as a separate repo with a separate Vercel project.

---

## Environment Variable Layout

```
# .env.example  (committed)

# Resend
RESEND_API_KEY=re_xxx                      # server-only; the Resend API key
RESEND_AUDIENCE_ID=78261eea-xxxx            # server-only; the "Quibly Waitlist" audience UUID
RESEND_FROM_EMAIL="Quibly <hello@useQuibly.com>"  # server-only; verified sender

# Spam protection
UPSTASH_REDIS_REST_URL=https://xxx          # server-only
UPSTASH_REDIS_REST_TOKEN=xxx                # server-only

# Public site URL (for OG images, canonical URLs)
NEXT_PUBLIC_SITE_URL=https://useQuibly.com  # public; safe to ship to client
```

**Vercel scoping strategy:**
- **Production** environment: real `RESEND_API_KEY`, real `RESEND_AUDIENCE_ID` pointing at the live audience, production Upstash instance.
- **Preview** environment: same `RESEND_API_KEY` (Resend's free tier allows test sends), but **a different `RESEND_AUDIENCE_ID`** pointing at a "Quibly Waitlist (Preview)" audience — so PR previews don't pollute the real list. Same Upstash instance is fine (rate limit isolation isn't critical in preview).
- **Development** (local `.env.local`): a "Quibly Waitlist (Dev)" audience and a small dev Upstash instance (or no rate limit at all — gate the rate limit behind `if (process.env.NODE_ENV === 'production')`).

**Validation:** `lib/env.ts` parses `process.env` with Zod at module load time and throws with a helpful message on missing/malformed values. This crashes the deploy *before* the first user signup, not during it.

**Never `NEXT_PUBLIC_`-prefix** any of the Resend or Upstash variables. Doing so leaks them into the client bundle. The `import 'server-only'` directive on `lib/resend.ts` is the build-time guard against accidental client imports.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–1k waitlist | Default architecture is fine. Free tier Resend covers it. Upstash free tier covers rate-limit volume. |
| 1k–10k waitlist | Upgrade Resend to paid plan ($40/mo for 5,000 contacts). Architecture unchanged. |
| 10k–100k waitlist | Resend's higher tiers cover it. Consider sending the launch broadcast in batches via Resend's Broadcast UI. Architecture still unchanged. |
| 100k+ waitlist | Pre-launch is over by this point — you're shipping the real product, and `marketing-app` owns the relationship. Cut over already. |

### Likely first bottleneck

**Vercel function cold starts** under burst traffic (e.g., a viral tweet). Mitigation: page itself is fully static and edge-cached, so only signup submissions hit a function. At the function level, Vercel's Fluid Compute / pooled instances handle bursts well. If we see >2s cold-start P99s, switch the Server Action to run on the Edge runtime (`export const runtime = 'edge'`) — Resend SDK is fetch-based and Edge-compatible.

### Likely second bottleneck

**Resend rate limits on contact creation.** Resend's documented limit is generous for our volumes; if we hit it, queue contact creation via `waitUntil()` and process out-of-band. Don't pre-build this — only if we observe it.

---

## Anti-Patterns

### Anti-Pattern 1: Calling Resend from a Client Component

**What people do:** Import the Resend SDK directly into a `'use client'` component, bundling the API key into JavaScript shipped to browsers.
**Why it's wrong:** Leaks `RESEND_API_KEY` to anyone who views source. Catastrophic — the key allows sending unlimited email from your verified domain.
**Do this instead:** Use Server Actions (or a Route Handler) and add `import 'server-only'` to `lib/resend.ts` so the build fails if a client component ever transitively imports it.

### Anti-Pattern 2: Awaiting the Welcome Email Before Returning Success

**What people do:** `await resend.emails.send(...)` inside the Server Action, then return success.
**Why it's wrong:** Couples the user-visible success state to a non-critical side effect. If Resend's send API has a hiccup, the user gets an error message even though their contact was added — and in practice they often retry, creating duplicate add attempts and a worse UX.
**Do this instead:** Treat contact-add as the success criterion; fire-and-forget the welcome email with a `.catch(console.error)`.

### Anti-Pattern 3: Surfacing "Already Subscribed" to the User

**What people do:** Show a different message ("You're already on the list!") for duplicate signups.
**Why it's wrong:** (a) Privacy — lets attackers enumerate which emails are on your list. (b) UX — creates anxiety in users who don't remember signing up; they wonder if their old account was breached. (c) No upside — they're on the list either way.
**Do this instead:** Single success message regardless of duplicate status: *"You're on the waitlist — we'll email you when Quibly is live."* Track the duplicate status server-side for analytics.

### Anti-Pattern 4: Building a Waitlist on a Custom DB Table

**What people do:** Create a Postgres table `waitlist_signups (id, email, created_at)`, manage migrations, build admin UI for it.
**Why it's wrong:** Re-implements what Resend Audiences already provides. Introduces a database to a project that has zero other database needs. Creates an export/migration burden at handoff time. Doesn't solve broadcasting (you still need an email service).
**Do this instead:** Use Resend Audiences as the system of record. The dashboard is the admin UI. CSV export is the migration path.

### Anti-Pattern 5: Adding CAPTCHA on Day One

**What people do:** Drop in reCAPTCHA or hCaptcha "to be safe" before any abuse exists.
**Why it's wrong:** Single-field forms convert at 13–23%; CAPTCHAs measurably depress conversion (industry estimates put the hit between 1–5 percentage points on mobile). For pre-launch where the goal is maximizing list growth, this is a self-inflicted wound.
**Do this instead:** Honeypot + rate limit. Add Cloudflare Turnstile (invisible by default, free) only if metrics show real abuse.

### Anti-Pattern 6: Putting the Form Submit on a Route Handler "Just In Case"

**What people do:** Build `app/api/waitlist/route.ts` and post to it from the form, citing "in case we need to call it from somewhere else."
**Why it's wrong:** YAGNI. There is one caller. Server Actions give us CSRF protection, progressive enhancement, and type safety for free; a Route Handler gives us none of those without manual work. Premature flexibility.
**Do this instead:** Server Action. If a third-party needs to add waitlist contacts later, expose a Route Handler then — and have it call the same internal helper that the Server Action calls. The helper, not the endpoint, is the reusable thing.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Resend Audiences API** | `resend.contacts.create({ audienceId, email })` from Server Action. Singleton client at `lib/resend.ts` with `import 'server-only'`. | Audience must be created in dashboard first; ID stored in env. Tolerate duplicate-add as success. |
| **Resend Transactional Send** | `resend.emails.send({ react: <WelcomeEmail/> })` fire-and-forget. | React Email JSX rendered automatically. From-domain must be verified in Resend (reuse `marketing-app`'s verified domain). |
| **Upstash Redis** | `@upstash/ratelimit` + `@upstash/redis` with sliding-window limiter. | Free tier ample for pre-launch. Single global instance OK; isolation by key prefix not required. |
| **Vercel Web Analytics** | `<Analytics/>` in `app/layout.tsx` for page views; `track()` from `@vercel/analytics/server` for custom events. | Custom events require Pro plan — confirm before relying on signup-conversion tracking. |
| **Vercel Speed Insights** (optional) | `<SpeedInsights/>` in `app/layout.tsx`. | Tracks Core Web Vitals; useful since Lighthouse ≥90 mobile is a stated requirement. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Client Component ↔ Server Action | React form action via `useActionState` | Next.js handles serialization, CSRF, response. No manual fetch. |
| Server Action → Resend | Singleton SDK client | All Resend calls go through `lib/resend.ts`. Never import `Resend` directly from another file. |
| Server Action → Upstash | Singleton ratelimit client | Same pattern at `lib/rate-limit.ts`. |
| Email template ← Server Action | JSX import + render via Resend SDK | `WelcomeEmail` is a pure component; tests can render it without sending. |
| Static page ↔ no backend | Pre-rendered at build time | No data fetching on the landing page itself; the form is the only dynamic surface. |

### Reuse from `marketing-app`

| Asset | Path in marketing-app | Strategy |
|-------|----------------------|----------|
| Resend client pattern | `lib/email/client.ts` | **Copy verbatim** — already has the env validation + `server-only` guard pattern we want |
| Design tokens | `app/globals.css` | **Copy** the Tailwind v4 token block (oklch primary, radius scale, font CSS vars) |
| Font wiring | `app/layout.tsx` | **Copy** the Quicksand + Figtree font import + className pattern |
| Quibs mascot SVG | `/Users/jeff/Desktop/quibs-icons.svg` | **Copy** the file into `public/` |
| React Email setup | `emails/InviteEmail.tsx` | **Copy as scaffolding template** for `welcome-email.tsx` |
| Brand strings (tagline, etc.) | `lib/brands/quibly.ts` | **Copy or re-key** — small file, no need to depend on it |

Do **not** import from `marketing-app` as a dependency. The whole point of this repo is independent deployment lifecycle. Copy what you need, keep the surface area small.

---

## Sources

- [Next.js 16 Release Blog Post](https://nextjs.org/blog/next-16) — Cache Components, Turbopack stability, React 19.2 baseline (HIGH)
- [Next.js Server Actions Documentation](https://nextjs.org/docs/13/app/building-your-application/data-fetching/server-actions-and-mutations) — Progressive enhancement, CSRF, `useActionState` (HIGH)
- [Server Actions vs Route Handlers (MakerKit, 2026)](https://makerkit.dev/blog/tutorials/server-actions-vs-route-handlers) — Decision criteria for the split (MEDIUM, single source — but matches official Next.js guidance)
- [Resend Contacts API Documentation](https://resend.com/docs/dashboard/audiences/contacts) — `contacts.create` signature, audience model, 1k free tier (HIGH)
- [Resend Audiences Feature Page](https://resend.com/features/audiences) — Audience-vs-Contact distinction, broadcast model, paid plan thresholds (HIGH)
- [Resend "Manage subscribers" Blog Post](https://resend.com/blog/manage-subscribers-using-resend-audiences) — `audienceId` parameter, unsubscribe handling, Gmail/Yahoo headers (HIGH)
- [Resend "New Contacts Experience" Blog Post](https://resend.com/blog/new-contacts-experience) — Distinction between global Contacts and Audience-scoped contacts (HIGH)
- [Resend CSV Export Changelog](https://resend.com/changelog/exports-as-csv-in-beta) — CSV export workflow, 1k/7-day download window (HIGH)
- [Resend + Next.js Documentation](https://resend.com/docs/send-with-nextjs) — Server Action integration pattern (HIGH)
- [Vercel "Instantly Transfer Domains" Changelog](https://vercel.com/changelog/instantly-transfer-domains-to-new-projects) — One-click domain move with redirects preserved (HIGH)
- [Vercel Domain Transfer Documentation](https://vercel.com/docs/domains/working-with-domains/transfer-your-domain) — Cross-team transfer flow, project-internal delegation (HIGH)
- [Vercel Environments Documentation](https://vercel.com/docs/deployments/environments) — Production/Preview env scoping, branch-level overrides (HIGH)
- [Vercel Custom Events for Web Analytics](https://vercel.com/docs/analytics/custom-events) — `track()` server-side from Server Actions, Pro plan requirement (HIGH)
- [Upstash Ratelimit Library](https://github.com/upstash/ratelimit) — Sliding-window per-IP limiter (HIGH)
- [Existing `marketing-app/lib/email/client.ts`](file:///Users/jeff/repos/marketing-app/lib/email/client.ts) — Singleton-with-env-guard pattern reused here (HIGH, in-repo verified)

---
*Architecture research for: Pre-launch SaaS waitlist landing page on Next.js 16 + Resend Audiences + Vercel*
*Researched: 2026-04-27*
