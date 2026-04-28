# Phase 4: Resend Wiring + Bot Protection + Welcome Email - Context

**Gathered:** 2026-04-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the Phase 3 stub-action body with a real Resend Audience write, send a deliverability-correct welcome email, and layer two new bot defenses (Upstash sliding-window rate limit + disposable-domain blocklist) on top of Phase 3's honeypot/time-trap. This is the highest-risk seam in the project: the form goes live against real external services, signs the project's first emails from `useQuibly.com`, and exposes the audience to abuse the moment the form is publicly indexable.

The Phase 3 → Phase 4 contract is locked: file path (`app/actions/join-waitlist.ts`), exported function name (`joinWaitlistAction`), and the discriminated-union return shape (`{ status: 'success' | 'error', ... }`) all stay verbatim. Phase 4 swaps the action's body — every Phase 3 stub branch (`dup@example.com`, `err@example.com`, `slow@example.com`) is deleted and replaced with the real pipeline. The Client Component (`<WaitlistForm>`) is not touched.

**In scope:**
- `lib/resend.ts` — Resend SDK singleton with `import 'server-only'`; reads `RESEND_API_KEY` (restricted "Sending access" scope, already in `lib/env.ts`)
- `lib/rate-limit.ts` — `@upstash/ratelimit` + `@upstash/redis`; sliding-window 5/min/IP and 50/day/IP per SPAM-03 (env vars already provisioned)
- `lib/disposable-domains.ts` — small blocklist (`mailinator.com`, `tempmail.com`, `10minutemail.com`, etc.) per SPAM-04
- `app/actions/join-waitlist.ts` — body swap: keep honeypot + time-trap + Zod from Phase 3; add rate-limit check, disposable-domain check, `resend.contacts.create({ audienceId, email, properties: { consent_version } })`, fire-and-forget welcome email send, server-side `track('waitlist_signup', { duplicate })` event
- `emails/WelcomeEmail.tsx` — React Email JSX template; founder-note voice (locked draft below); includes `List-Unsubscribe` + `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers, one-click unsubscribe link, plain-language confirmation, physical postal address per EMAIL-01..EMAIL-08
- `app/api/webhooks/resend/route.ts` — webhook handler for `email.bounced` and `email.complained` per EMAIL-09; differentiated per event subtype (see D-08 below)
- `app/unsubscribe/route.ts` (or page) — RFC 8058 one-click unsubscribe endpoint; accepts `POST`; processes within 48h
- Audience routing: production audience for `VERCEL_ENV === 'production'`, preview audience for everything else (preview deploys, local dev) per STORE-01 / SC #5
- `consent_version` property snapshot on each contact at signup time per STORE-04 (Phase 4 ships a stub value; Phase 5 builds the real privacy-MDX → git-SHA mechanism)
- Day-1 probe tasks: confirm Resend duplicate-email response shape, verify webhook event names exactly match (`email.bounced` / `email.complained`)
- Inbox tests in Gmail + Outlook + iCloud showing both `List-Unsubscribe-*` headers in "Show Original"
- CSV export round-trip validated end-to-end (audience → CSV → re-import) per STORE-05
- Test coverage extension: Vitest unit tests for the new action branches (rate-limit, disposable-domain, real Resend success path mocked) and webhook handler; Playwright e2e flows still green against the real action (using a developer's email against the preview audience)

**Out of scope:**
- Welcome email **subject/body copy edit** — founder edits the locked draft string in PR review; Claude does not invent new voice
- Mail-tester.com 10/10 verification — primary Phase 4 task, but the **DNS records themselves** (SPF + 3× DKIM + DMARC + Return-Path) are sourced from Resend Dashboard during Phase 4 setup, not authored in code
- Privacy + terms page content (LEGAL-01..08) — Phase 5
- Real `consent_version` git-SHA mechanism (Phase 5 builds it; Phase 4 ships a placeholder string — see CD-04)
- Vercel Web Analytics page-view + cookieless mount (ANLY-01..02) — Phase 5; Phase 4 only fires server-side `track()` events through whatever analytics module exists at the time
- OG image, sitemap, robots, JSON-LD (SEO-01..08) — Phase 5
- Apex domain binding at Vercel team level (DEPLOY-01..02) — Phase 6
- Cloudflare Turnstile — V2-07, signal-driven trigger only
- Live signup counter — Phase 7, conditional on audience ≥50

</domain>

<decisions>
## Implementation Decisions

### Welcome Email Voice & Body (locked draft)
- **D-01:** **Founder note voice, solo framing, transactional shell.** From `Jeff @ Quibly <hello@useQuibly.com>` (NOT `noreply@`, per EMAIL-02). Subject: `"You're on the Quibly list"`. The body is a first-person founder note explicitly framing Jeff as a solopreneur building Quibly for other solopreneurs — that's the highest-leverage authenticity signal a pre-launch waitlist has at zero signups, and it's true (per PROJECT.md audience). The "Phase 2 small team" copy in `<FounderVoice>` is a separate rhetorical surface; the welcome email speaks in Jeff's first-person voice.
  **Locked draft (Phase 4 ships this; founder edits the final string in PR before merge):**
  ```
  From: Jeff @ Quibly <hello@useQuibly.com>
  Subject: You're on the Quibly list

  Hey —

  Thanks for joining the Quibly waitlist. I'm Jeff —
  a solopreneur building Quibly for other solopreneurs
  and small operators who are experts at what they
  make but not necessarily at marketing it.

  I'm deep in a strategy-first AI marketing tool that
  learns your business and runs the marketing loop
  with you (not at you). I'll send one more email when
  I open it up — no spam, no product-launch hype.

  In the meantime, hit reply if there's a marketing
  problem you wish someone would just solve. I read
  everything.

  — Jeff

  [Unsubscribe link] · [Postal address]
  ```
  Claude polishes the React Email JSX rendering during planning (typography, spacing, brand styling) but does NOT change the voice or substance. Founder edits the final string in PR.

- **D-02:** **`List-Unsubscribe` + `List-Unsubscribe-Post: One-Click` headers MUST be present on the very first welcome email rendered.** Both headers, RFC 8058 compliant. The HTTPS endpoint at `app/unsubscribe/route.ts` accepts `POST` and processes the unsubscribe (sync removal from Resend Audience) within 48 hours per Pitfall 1. DKIM signature must cover both headers — Resend handles this if domain is verified; verify in Gmail "Show Original" before declaring this requirement met.

### Rejection UX (silent everywhere)
- **D-03:** **Silent rejection for BOTH rate-limit AND disposable-domain.** Returns `{ status: 'success' }` shape (matching honeypot/time-trap behavior locked in Phase 3 D-15), no welcome email, no `track('waitlist_signup')` event. Server-side observability via `console.warn` and a `track('signup_rejected', { reason: 'rate_limit' | 'disposable_domain' })` event for ops visibility. Rationale:
  - **Defense-in-depth consistency** with Phase 3's honeypot + time-trap rejection pattern
  - **No information surface** for attackers to probe rate-limit thresholds (e.g., binary-search the limit)
  - **Disposable users** either retry with a real address (the desired conversion outcome) or were never going to be useful contacts at launch
  - Rate-limit at 5/min/IP + 50/day/IP is generous enough that a legitimate user on shared NAT (conference WiFi, corporate gateway) is extremely unlikely to trip it
- **D-04:** **`fieldErrors` keys MAY be extended to support these branches if surfacing is ever turned on**, but for Phase 4 they are NOT used (silent-success only). The Phase 3 `<WaitlistForm>` renders `fieldErrors` inline; if Phase 4.x ever flips to surfaced rate-limit messaging, the Client Component code does not change because the union shape is locked (D-10 from Phase 3).

### Already-Subscribed Welcome Behavior
- **D-05:** **Suppress welcome email on duplicate signup; first-time only.** When `resend.contacts.create` indicates the contact already existed (signal verified via Phase 4 day-1 probe — research flag), `resend.emails.send` is SKIPPED. The on-page success block (POST-02) renders identically to a fresh signup (POST-03 enumeration defense — locked in Phase 3 D-14). The `track('waitlist_signup', { duplicate: true })` event still fires for Phase 5 analytics — but no second welcome email is sent.
- **D-06:** **Fallback if duplicate signal is unclear:** if Resend's `contacts.create` response shape on duplicate doesn't expose a clean signal that survives the Phase 4 day-1 probe, the action falls back to **always sending the welcome email**. At pre-launch volume (likely <100 signups/day per ROADMAP.md research), a small handful of re-confirmations is acceptable; the spam-complaint risk is bounded by Gmail's 0.3% threshold, well above any plausible re-confirmation rate. Researcher confirms the signal during planning; planner picks the implementation.

### Webhook Bounce/Complaint Side Effects
- **D-07:** **Webhook handler is `app/api/webhooks/resend/route.ts`** (Next.js route handler). Verifies Resend signature via `RESEND_WEBHOOK_SECRET` (env already provisioned in `lib/env.ts`). Body parsed as Resend's webhook event JSON.
- **D-08:** **Differentiated handler logic per event subtype:**
  - `email.bounced` → **hard bounce** (subtype = `permanent` / `general`): mark Resend contact `unsubscribed=true` in the audience (mailbox is dead — future broadcasts skip them). Log `console.error('email_hard_bounced', { contactId, ... })`. Fire `track('contact_bounced', { kind: 'hard' })`.
  - `email.bounced` → **soft bounce** (subtype = `transient`): log only (`console.warn('email_soft_bounced', { ... })`). Don't mutate contact (they may succeed on retry). Fire `track('contact_bounced', { kind: 'soft' })`.
  - `email.complained` (spam-marked): mark Resend contact `unsubscribed=true`. Log `console.error('email_complained', { contactId, ... })`. Fire `track('contact_complained')`. **MANDATORY for sender reputation** — Gmail's >0.3% complaint threshold is the ceiling; a single complaint matters at low volume.
  - All events: structured server log + analytics event for ops visibility.
- **D-09:** **No alerting/Slack pathway in v1.** A complaint-rate threshold alert is operationally valuable but adds moving parts. Defer to v2 / post-launch monitoring. Phase 4 ships log + analytics; founder reviews Resend dashboard manually pre-launch.

### Postal Address (CAN-SPAM blocker)
- **D-10:** **Founder will source the postal address before Phase 4 ships.** Plan includes a placeholder string (`YOUR-POSTAL-ADDRESS-HERE`) and a **checkpoint task that blocks the production deploy** until the real address is wired in (likely as `RESEND_FROM_POSTAL_ADDRESS` env var so it's not in source code). EMAIL-05 is non-negotiable for legal compliance. Founder action item: source registered agent / USPS PO Box / commercial mail receiving agency before phase production ship; do not use personal home address.

### Claude's Discretion
- **CD-01:** **Disposable-domain blocklist source.** Hand-curated short array in `lib/disposable-domains.ts` (~15-30 entries: `mailinator.com`, `tempmail.com`, `10minutemail.com`, `guerrillamail.com`, `yopmail.com`, `throwawaymail.com`, etc.) is the recommendation — covers the abusive long tail without an npm dependency. The npm package `disposable-email-domains` (~3000 entries) is overkill for pre-launch volume and creates a permanent dependency the project doesn't need elsewhere. Claude picks during planning. Maintenance pattern: founder appends to the array if abuse appears.
- **CD-02:** **One-click unsubscribe URL token format.** Recommendation: HMAC-signed `contactId` (via `crypto.subtle.sign` with `RESEND_WEBHOOK_SECRET` reused as signing secret, or a dedicated `UNSUBSCRIBE_SECRET` if cleaner separation is wanted). Token format: `${contactId}.${hmac}`. Verifier rejects on mismatch. Avoids exposing raw Resend contact IDs in URLs (privacy-preserving) while staying stateless. Plain-base64-encoded contact ID is the alternate (simpler, less private). Claude picks during planning; researcher verifies the pattern works in Resend's contact schema.
- **CD-03:** **`consent_version` Phase 4 placeholder.** Phase 5 builds the real privacy-MDX → git-SHA mechanism. Phase 4 ships `process.env.VERCEL_GIT_COMMIT_SHA ?? 'pre-phase-5'` (or a similar deterministic stub) so STORE-04 ships a non-empty value on every contact. Phase 5 swaps the implementation without changing the property name. Claude picks the exact stub during planning.
- **CD-04:** **Audience routing logic.** Recommendation: `const audienceId = process.env.VERCEL_ENV === 'production' ? env.RESEND_AUDIENCE_ID : env.RESEND_AUDIENCE_PREVIEW_ID`. Local dev (`vercel env pull` then `npm run dev`) hits the preview audience — developers' real emails go to a non-production audience, real welcome emails arrive in their inbox, and the production audience stays clean. Claude wires during planning.
- **CD-05:** **Webhook signature verification.** Use Resend's documented signature scheme (likely `svix`-style HMAC-SHA256 with `RESEND_WEBHOOK_SECRET`). Researcher verifies the exact signature header name and algorithm during planning.
- **CD-06:** **Mail-tester.com verification timing.** Recommend an early-phase task (after DNS records are in place but before any production-audience write goes live). Documented as a checkpoint task in the plan; founder runs `mail-tester.com` and pastes the resulting score into the checkpoint comment. SC #2 (10/10 score) is technically a Phase 6 launch-gating requirement, but verifying earlier means DNS misalignment is caught when it's cheap to fix.
- **CD-07:** **Phase 3 stub-branch deletion in `app/actions/join-waitlist.ts`.** All four `if (email === '...@example.com')` branches and the `D-11: PHASE-3-STUB — DELETE IN PHASE 4` comment markers are removed. The Vitest tests that exercise those branches are migrated to use Resend SDK mocks (`vi.mock('@/lib/resend')`) instead of the email-pattern triggers. Playwright e2e specs that depend on `dup@example.com` / `err@example.com` / `slow@example.com` need updating — Claude maps these during planning to either (a) Resend mock fixtures, (b) reserved test emails routed to a third "test" audience, or (c) deletion if no longer meaningful. Claude picks per-spec during planning.
- **CD-08:** **Welcome email JSX layout.** Reuse the `marketing-app/emails/WelcomeEmail.tsx` structural pattern (teal-strip header, `Container`, `Body`, `Hr` + footer with postal address) but adapt the body to D-01's locked founder voice. Claude implements during planning.
- **CD-09:** **Fire-and-forget mechanics.** Recommendation: `resend.emails.send(...).catch((err) => { console.error('welcome_email_send_failed', { contactId, err }); track('welcome_email_send_error', { contactId }); })` — invoked but NOT awaited per the SUMMARY.md decision. If Vercel's serverless aborts mid-flight, switch to `waitUntil()` from `@vercel/functions`. Don't pre-build that fallback unless the Phase 4 day-1 probes show aborted sends.
- **CD-10:** **Rate-limit identifier.** Recommend keying on `request.headers.get('x-forwarded-for')` (Vercel sets this; first IP in the comma-separated chain). Fallback to `request.headers.get('x-real-ip')`. Researcher confirms the canonical Vercel IP-extraction pattern during planning.
- **CD-11:** **Disposable-domain check timing.** After Zod validation (so the email is well-formed), before rate-limit (cheaper to compute). Claude orders during planning.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project planning
- `CLAUDE.md` — full Recommended Stack (Resend ^6.12, `@react-email/components` ^1.0, Zod ^4.0, Next 16.2 Server Actions); "Specific Architectural Decisions" §"Email submission path" + §"Bot/spam protection — Cloudflare Turnstile + honeypot (defense in depth)"; "What NOT to Use" — confirms no GTM/GA4/cookie banners.
- `.planning/PROJECT.md` — tagline, audience (solopreneurs + small operators), tone of voice (conversational, modern, friendly, confident, playful, energetic, upstart), Resend Audiences as source of truth, single opt-in.
- `.planning/REQUIREMENTS.md` §Welcome Email (EMAIL-01..09), §Audience Storage (STORE-01..05), §Spam/Bot Protection (SPAM-01..04 — SPAM-01/02 already shipped Phase 3, SPAM-03/04 are Phase 4).
- `.planning/ROADMAP.md` §"Phase 4: Resend Wiring + Bot Protection + Welcome Email" — five success criteria, especially SC #1 (live audience write with `consent_version`), SC #2 (welcome email + headers), SC #3 (rate-limit + disposable-domain rejection), SC #4 (webhook handler), SC #5 (preview audience separation + CSV round-trip).
- `.planning/STATE.md` §Blockers/Concerns — Phase 4 day-1 probes (Resend duplicate response shape, webhook event names) and postal-address prerequisite.
- `.planning/research/SUMMARY.md` §"Phase 4" + §"Conflict Resolution" §1 (Resend Audiences only, no DB) + §2 (no Turnstile in v1) + §3 (welcome email is fire-and-forget).
- `.planning/research/PITFALLS.md` Pitfall 1 (List-Unsubscribe-Post header — RFC 8058) + Pitfall 2 (SPF/DKIM/DMARC alignment, mail-tester 10/10) + Pitfall 3 (audience poisoning) + Pitfall 4 (RESEND_API_KEY exposure).
- `.planning/research/STACK.md` — Resend `^6.12`, `@react-email/components` `^1.0`, Upstash `@upstash/ratelimit` + `@upstash/redis` versioning.
- `.planning/research/ARCHITECTURE.md` — Server Action diagram (the Phase 4 pipeline: validate → spam-check → store → email → track) + `lib/resend.ts` / `lib/rate-limit.ts` / `lib/analytics.ts` separation; `import 'server-only'` boundary.

### Prior phase context (this repo)
- `.planning/phases/03-email-capture-form-stub-action/03-CONTEXT.md` — **must-read.**
  - **D-09:** action file path stays `app/actions/join-waitlist.ts` — DO NOT MOVE
  - **D-10:** discriminated-union return shape locked through Phase 4 — Phase 4 may extend `fieldErrors` keys but does NOT change the outer union; Client Component import unchanged
  - **D-11:** the four stub email-pattern branches (`dup@`, `err@`, `slow@`, default) are deleted in Phase 4
  - **D-12:** server errors via sonner, validation errors inline; `submittedValues.email` echoed for FORM-06 preservation
  - **D-15:** honeypot + time-trap return success-shape silently with no side effects — Phase 4 D-03 reuses the same pattern for rate-limit + disposable-domain
- `.planning/phases/03-email-capture-form-stub-action/03-PATTERNS.md` (if present) — Phase 3 stub branch test fixtures + Vitest mock patterns the migrated tests will inherit.
- `.planning/phases/03-email-capture-form-stub-action/03-RESEARCH.md` — Zod 4 idioms (`z.email(...)`, `z.flattenError(...)`); React 19 `useActionState` + Next 16.2 Server Action progressive enhancement.
- `.planning/phases/01-scaffold-brand-token-parity/01-CONTEXT.md` — env validation strategy (D-07/D-08/D-10/D-11): every env var enumerated, hard-crash on missing, no NODE_ENV leniency, custom ESLint rule blocks direct `process.env.X` access; Phase 4's `lib/resend.ts` adds `import 'server-only'` as line 1.
- `lib/env.ts` — already has `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`, `RESEND_AUDIENCE_PREVIEW_ID`, `RESEND_WEBHOOK_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. Phase 4 may add `RESEND_FROM_POSTAL_ADDRESS` per D-10. **DO NOT read `process.env.X` directly anywhere — import from `@/lib/env`.**
- `app/actions/join-waitlist.ts` (Phase 3 stub) — keep honeypot + time-trap + Zod logic verbatim; replace stub-branch routing (D-11 PHASE-3-STUB markers) with the real Resend pipeline.
- `components/waitlist/waitlist-form.tsx` (Phase 3 Client Component) — **NOT TOUCHED in Phase 4.** Verifies that the locked discriminated-union shape is honored.

### Marketing-app prior art (read for pattern reference, not copy-paste)
- `/Users/jeff/repos/marketing-app/lib/email/client.ts` — Resend SDK singleton + `import 'server-only'` boundary pattern.
- `/Users/jeff/repos/marketing-app/emails/WelcomeEmail.tsx` — React Email JSX structural reference (Container/Body/Hr/header strip, teal accent, footer with `Sent by Quibly` + Link). Phase 4 adapts this layout to the D-01 founder voice; the marketing-app email is post-Stripe-Checkout, NOT a waitlist welcome — voice and copy DO NOT carry over.
- `/Users/jeff/repos/marketing-app/emails/InviteEmail.tsx` — second React Email reference for Container/footer pattern.
- `/Users/jeff/repos/marketing-app/lib/email/send-billing-emails.ts` — fire-and-forget pattern (`.catch(console.error)`) reference for D-CD-09.

### External docs
- [Resend Audiences `contacts.create`](https://resend.com/docs/api-reference/contacts/create-contact) — endpoint, parameters, **duplicate-email response shape NOT in public docs → Phase 4 day-1 probe (5 min)**.
- [Resend Webhooks](https://resend.com/docs/dashboard/webhooks/introduction) — event names (`email.bounced`, `email.complained`), signature verification, payload schema. **Phase 4 day-1 probe verifies exact event names (15 min)**.
- [Resend `emails.send` with React Email](https://resend.com/docs/send-with-react) — `react: <WelcomeEmail/>` prop pattern.
- [RFC 8058 — Signaling One-Click Functionality for List Email Headers](https://datatracker.ietf.org/doc/html/rfc8058) — `List-Unsubscribe-Post: List-Unsubscribe=One-Click` requirement.
- [Gmail/Yahoo bulk-sender requirements (Feb 2024 + Nov 2025)](https://support.google.com/mail/answer/81126) — when these apply to "transactional" welcome emails (any domain ≥5,000/day to Gmail).
- [`@upstash/ratelimit` sliding-window](https://upstash.com/docs/oss/sdks/ts/ratelimit/algorithms#sliding-window) — `Ratelimit.slidingWindow(5, '60 s')` + `Ratelimit.slidingWindow(50, '1 d')` ladder pattern.
- [`@upstash/redis` Vercel integration](https://upstash.com/docs/redis/sdks/ts/getstarted) — `Redis.fromEnv()` reads `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` automatically.
- [@react-email/components](https://react.email/docs/components/html) — `<Html>`, `<Head>`, `<Body>`, `<Container>`, `<Section>`, `<Hr>`, `<Link>`, `<Button>`, `<Preview>` (preheader text).
- [Vercel `VERCEL_ENV` env var](https://vercel.com/docs/environment-variables/system-environment-variables#VERCEL_ENV) — `'production' | 'preview' | 'development'` for D-CD-04 audience routing.
- [Vercel headers — `x-forwarded-for`](https://vercel.com/docs/edge-network/headers/request-headers) — IP extraction for rate-limit keying (CD-10).
- [`mail-tester.com`](https://www.mail-tester.com/) — 10/10 score gate for D-CD-06 verification.
- [FTC CAN-SPAM Compliance Guide](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business) — physical postal address requirement per EMAIL-05 / D-10.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`lib/env.ts`** — Zod-validated env, already enumerates every Phase 4 env var (`RESEND_API_KEY`, `RESEND_AUDIENCE_ID`, `RESEND_AUDIENCE_PREVIEW_ID`, `RESEND_WEBHOOK_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`). Phase 4 may add one new var (`RESEND_FROM_POSTAL_ADDRESS`) per D-10.
- **`lib/utils.ts`** — `cn()` helper from Phase 1; not directly relevant to Phase 4 server-side logic but used in any new email-template TSX.
- **`app/actions/join-waitlist.ts`** — Phase 3 stub; the real Phase 4 action keeps honeypot/time-trap/Zod (lines 1-95 effectively) and replaces only the stub-branch routing block (CD-07).
- **`components/waitlist/waitlist-form.tsx`** — Phase 3 Client Component; locked discriminated-union shape contract — Phase 4 must NOT change anything that breaks this contract.
- **`components/ui/sonner.tsx`** — token-styled Sonner Toaster (Phase 1); already mounted in `app/layout.tsx` (Phase 3 D-08). Phase 4 doesn't add new toasts — server errors continue to use the existing Phase 3 sonner path; rejection paths are silent (D-03).
- **`marketing-app/lib/email/client.ts`** — Resend singleton pattern reference; Phase 4 builds an analog at `lib/resend.ts` with the same `import 'server-only'` posture.
- **`marketing-app/emails/WelcomeEmail.tsx`** — React Email layout reference (header strip, Container, footer pattern); Phase 4 adapts the layout but writes its own body copy per D-01.

### Established Patterns
- **Hard-crash env validation** (Phase 1 D-08/D-10) — every env var validated at module load; no `process.env.X` reads outside `lib/env.ts`. Phase 4 inherits this rigorously: `lib/resend.ts` imports `{ env }` from `@/lib/env`, never reads `process.env` directly.
- **`import 'server-only'` boundary** — Phase 1 left this off `lib/env.ts` because env validation runs at build time. Phase 4's `lib/resend.ts` and `lib/rate-limit.ts` MUST add `import 'server-only'` as line 1 — these files touch external service clients and must not bundle to the client. Custom ESLint rule from Phase 1 also enforces no client-side `process.env` access.
- **Discriminated-union Server Action returns** (Phase 3 D-10) — Phase 4 honors this exactly. Any new error variants extend `fieldErrors` keys (e.g., `_disposable`, `_rateLimit` — though D-03 says these stay silent in v1, the keys may exist for future surfacing).
- **Phase 3 silent-success pattern** (Phase 3 D-15) — Phase 4 D-03 reuses this verbatim for rate-limit + disposable-domain rejection. Bot can't distinguish from real success; legitimate user with edge-case provider sees the success block.
- **Vitest + RTL + happy-dom toolchain** (Phase 3 D-17/CD-09) — Phase 4 extends with new branch tests (Resend mock, rate-limit mock, disposable-domain unit) using the same config.
- **Two GitHub Actions branch-protection gates** (Phase 2 D-33/D-34, Phase 3 D-18) — Phase 4 doesn't add a third gate; it extends the existing Vitest + Playwright workflows. **No new branch-protection UI step.**
- **`gitleaks` pre-commit hook** (Phase 1 Plan 04) — already blocks `re_*` keys and Upstash key patterns. Phase 4 inherits; verify the gate fires on a fake `re_test_xxxxxx` string before merging.

### Integration Points
- **`app/actions/join-waitlist.ts`** — Phase 3's body is replaced. Honeypot + time-trap + Zod validation lines preserved verbatim (still real, still defenses). Stub-branch routing (CD-07) deleted. New code: rate-limit check → disposable-domain check → `resend.contacts.create({ audienceId: chosenAudience, email, properties: { consent_version } })` → on success: fire-and-forget `resend.emails.send({ from, to, subject, react: <WelcomeEmail/>, headers: { 'List-Unsubscribe': ..., 'List-Unsubscribe-Post': ... } })` → server-side `track('waitlist_signup', { duplicate })`.
- **`lib/resend.ts`** (NEW) — `import 'server-only'`; `new Resend(env.RESEND_API_KEY)` singleton; named export of the SDK instance + helper functions (`createContact`, `sendWelcomeEmail`).
- **`lib/rate-limit.ts`** (NEW) — `import 'server-only'`; `Ratelimit.slidingWindow(5, '60 s')` + `Ratelimit.slidingWindow(50, '1 d')` ladder. Returns `{ success, limit, reset, remaining }` per Upstash's standard contract.
- **`lib/disposable-domains.ts`** (NEW) — small array, `isDisposable(email)` helper that lowercases + extracts domain + tests against the array.
- **`lib/analytics.ts`** (NEW or stub) — `track(eventName, properties)` thin wrapper. Phase 5 will swap implementation to `@vercel/analytics/server`. Phase 4 may ship a `console.log`-based shim with a typed signature so Phase 5's swap is body-only.
- **`emails/WelcomeEmail.tsx`** (NEW) — React Email JSX template; default export `WelcomeEmail` component with `unsubscribeUrl` and `postalAddress` props.
- **`app/api/webhooks/resend/route.ts`** (NEW) — `POST` handler; verifies signature, parses event JSON, dispatches per D-08 logic.
- **`app/unsubscribe/route.ts`** (NEW) — `POST` handler for one-click unsubscribe per RFC 8058; `GET` may render a confirmation page (or just return 200 — the link in the email is `mailto:` fallback for non-supporting clients). HMAC-verifies token (CD-02), marks Resend contact unsubscribed.
- **`vitest.config.ts`** — already configured Phase 3; Phase 4 adds new spec files under `app/actions/` and `app/api/webhooks/`.
- **`.env.example`** — Phase 4 adds `RESEND_FROM_POSTAL_ADDRESS=YOUR-POSTAL-ADDRESS-HERE` (per D-10) once postal address is sourced.

</code_context>

<specifics>
## Specific Ideas

- **The locked welcome-email draft (D-01) is the voice contract.** Polish at the JSX level (typography, spacing, brand styling), but DO NOT paraphrase the body. The solo-founder framing is deliberate — it's the highest-leverage authenticity signal a pre-launch waitlist has, and changing it back to "small team" or "the Quibly team" reads less credible to an audience that can smell inflation.
- **POST-02 ("Check your inbox (and spam folder) for confirmation") is the on-page promise that the welcome email fulfills.** The two surfaces should feel coherent — when a user reads "check your inbox" then sees "Hey — Thanks for joining the Quibly waitlist", the brand voice carries through. Don't drift the email subject line away from "You're on the Quibly list" — it echoes the on-page success block H3 verbatim ("You're on the list").
- **The Phase 3 → Phase 4 contract (D-09/D-10 from Phase 3) is non-negotiable.** Phase 4's plan must NOT change `app/actions/join-waitlist.ts`'s file path, the exported function name (`joinWaitlistAction`), or the discriminated-union return shape. Phase 4 may extend `fieldErrors` keys; it MUST NOT touch the outer union. The Client Component code in `components/waitlist/waitlist-form.tsx` should not change in this phase.
- **Silent rejection (D-03) MUST mirror Phase 3 D-15 exactly.** Same return shape (`{ status: 'success' }`), no welcome email, no `track('waitlist_signup')`. The ONLY observability difference is the new `track('signup_rejected', { reason })` event for ops visibility. From the user's UI, rate-limit / disposable / honeypot / time-trap are all indistinguishable from fresh success.
- **Suppress-on-duplicate (D-05) depends on the Phase 4 day-1 probe.** If Resend's `contacts.create` response on duplicate doesn't expose a clean signal, fall back to D-06 (always send). Don't block the phase on this; the fallback is acceptable at pre-launch volume. The probe runs in 5 minutes — researcher does it during planning.
- **Webhook handler must be route-handler-style, NOT a Server Action.** External services don't POST through Server Action mechanism. Path: `app/api/webhooks/resend/route.ts` exporting `POST` (and `GET` if needed for Resend's verification challenge — research flag). Signature verification via `RESEND_WEBHOOK_SECRET` is the security boundary; failing verification returns 401 without parsing body.
- **The CSV export round-trip (STORE-05 / SC #5)** is a manual checkpoint task, not code. Founder/Claude exports the audience CSV from Resend dashboard, deletes the audience in a side test, re-imports CSV, verifies all `consent_version` properties round-tripped. Decision-time: what survives the round-trip? Resend's CSV format may flatten or drop custom properties — researcher verifies during planning.
- **Mail-tester.com 10/10 (CD-06) is non-negotiable before first production-audience write.** A passing score validates SPF + 3× DKIM + DMARC + Return-Path alignment before a single Gmail user receives anything. The DNS records themselves come from Resend Dashboard during phase setup; they're not authored in this repo.
- **Postal address (D-10) is a HARD blocker for production deploy, NOT for plan creation.** Plan can ship with `YOUR-POSTAL-ADDRESS-HERE` placeholder. Last task in Phase 4's manual-checkpoint list: founder supplies real address, gates merge to `main`. Don't let this block research/planning.
- **`gitleaks` from Phase 1 already blocks `re_*` Resend keys.** Verify it fires on a synthetic key during Phase 4 setup so we don't discover a regression after a real key leak.

</specifics>

<deferred>
## Deferred Ideas

- **Cloudflare Turnstile (V2-07)** — signal-driven only; Phase 4 ships without it. Watch the SUMMARY.md upgrade triggers (bounce >2% / 48h, vertical traffic spike, complaint approaching 0.1%, IP rate-limit rejections >100/day, unfamiliar-TLD addresses). If any fires, plan v1.x phase to add `@marsidev/react-turnstile`.
- **Live signup counter (Phase 7)** — gated audience ≥50; not part of Phase 4. Phase 4's `track('waitlist_signup')` server-side event creates the counter source-of-truth.
- **Slack/email alert pathway for complaint-rate threshold (D-09)** — operationally valuable but adds moving parts. Defer to v2 / post-launch monitoring. Phase 4 ships log + analytics; founder reviews Resend dashboard manually.
- **`waitUntil()` from `@vercel/functions` for welcome email** — fallback pattern if fire-and-forget shows aborted sends in production. Don't pre-build per CD-09; observe and react.
- **Disposable-domain blocklist as npm package** (`disposable-email-domains`) — defer until the hand-curated list shows abuse leaks (CD-01).
- **One-click unsubscribe page (HTML confirmation)** — Phase 4 ships a `POST` route handler per RFC 8058. A `GET` confirmation page ("You've been unsubscribed") is a nice-to-have; defer unless email clients demonstrate confusion.
- **Surfaced rate-limit / disposable-domain UX (D-04 keys exposed)** — the discriminated-union supports it, but D-03 keeps it silent in v1. If real users complain about silent rejection ("I signed up but never got the email"), v1.x can flip these to surfaced messaging without changing the Client Component's import.

</deferred>

---

*Phase: 4-Resend Wiring + Bot Protection + Welcome Email*
*Context gathered: 2026-04-28*
