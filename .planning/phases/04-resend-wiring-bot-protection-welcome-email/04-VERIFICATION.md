---
phase: 04-resend-wiring-bot-protection-welcome-email
verified: 2026-04-28T07:00:00Z
status: human_needed
score: 5/5 must-haves verified (with 2 documented deviations carried by overrides)
overrides_applied: 2
overrides:
  - must_have: "STORE-02 — RESEND_API_KEY scoped to 'Sending access' only (restricted, NOT Full access)"
    reason: "Empirical finding (Plan 07 Task 6 Part B): Resend's permission model offers exactly two scopes — 'Sending access' (no contacts API) and 'Full access' (everything). The action's contacts.get/create/update calls return 401/403 under Sending access. STORE-02 as written is technically infeasible at Resend's current granularity. Compensating controls in place: gitleaks pre-commit blocks re_* commits; key only read via lib/env.ts (no raw process.env reads — enforced by custom ESLint rule); rotate-on-leak procedure documented. Recommendation captured for future phases (revisit if Resend ships a Sending+Contacts scope, or migrate contact storage to a dedicated DB)."
    accepted_by: "founder"
    accepted_at: "2026-04-28T22:30:00Z"
  - must_have: "RESEND_FROM_POSTAL_ADDRESS wired to a real address (D-10 production-deploy gate)"
    reason: "Plan 07 Task 3 explicitly deferred sourcing a non-home postal address (registered agent / PO Box / CMRA — takes real-world time). Production env currently holds 'Quibly · TBD · TBD' so deploys succeed. Welcome emails sent from preview/UAT include a placeholder string in footer; CAN-SPAM compliance for the LIVE production audience requires the real address before Phase 6 launch. lib/env.ts WR-01 refine() rejects 'YOUR-POSTAL-ADDRESS|placeholder|test address' patterns when VERCEL_ENV=production — current production value 'Quibly · TBD · TBD' passes the refine but is not CAN-SPAM compliant. Plan 07 SUMMARY explicitly flags this as a remaining production-deploy HARD blocker that will surface in /gsd-progress and /gsd-audit-uat. Phase 6 cannot ship until this is closed."
    accepted_by: "founder"
    accepted_at: "2026-04-28T22:30:00Z"
human_verification:
  - test: "Phase 6 production-deploy gate: source a real non-home postal address (registered agent / PO Box / CMRA) and replace the 'Quibly · TBD · TBD' placeholder in Vercel Production env var RESEND_FROM_POSTAL_ADDRESS"
    expected: "A real CAN-SPAM-compliant postal address appears in welcome-email footer when sent from production. Refine-guard rejects placeholder pattern; current value 'Quibly · TBD · TBD' passes lib/env.ts refine but fails human CAN-SPAM compliance."
    why_human: "Sourcing a non-home address requires a real-world action (registered agent signup / PO Box rental / CMRA paperwork). Cannot be performed programmatically. Surfaces as a Phase 6 launch gate."
  - test: "Inbox verification on Outlook + iCloud (Plan 07 Task 5 partial — Gmail-only verified)"
    expected: "Welcome email arrives in Outlook AND iCloud within 60s, From renders correctly, both List-Unsubscribe headers visible in Show Original, DKIM covers both headers, body link unsubscribe round-trip succeeds."
    why_human: "Email rendering across consumer mail clients can only be observed in the actual clients. Founder explicitly approved Gmail-only verification per Plan 07 SUMMARY (Task 5) — Outlook and iCloud were skipped. ROADMAP SC #2 requires Gmail/Outlook/iCloud arrival. Spot-check before Phase 6 launch is prudent."
gaps: []
---

# Phase 4: Resend Wiring + Bot Protection + Welcome Email Verification Report

**Phase Goal:** The single highest-risk seam: the form goes live against a real Resend audience, sends a deliverability-correct welcome email, and is defended by layered abuse protection so the audience cannot be poisoned the moment the form is publicly indexable.

**Verified:** 2026-04-28
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (mapped to ROADMAP Success Criteria + plan must_haves)

| # | Truth (from ROADMAP SC) | Status | Evidence |
| - | ----------------------- | ------ | -------- |
| 1 | SC #1 — Real signup creates a contact in production audience tagged with `consent_version` (current privacy-policy git SHA), written via the restricted "Sending access" API key only | PASSED (override on key scope) | `app/actions/join-waitlist.ts:142-189` writes via `resend.contacts.create({ audienceId, email, properties: { consent_version } })`; audienceId routing on VERCEL_ENV (CD-04); consent_version=`process.env.VERCEL_GIT_COMMIT_SHA ?? 'pre-phase-5'`. Gmail UAT Test 1 PASSED. **Override applied** for "Sending access only" — Resend SDK scope-model finding documented in 04-07-SUMMARY Task 6 Part B. |
| 2 | SC #2 — Welcome email arrives in Gmail/Outlook/iCloud within 60s from `hello@usequibly.com` with both List-Unsubscribe + List-Unsubscribe-Post headers visible in "Show Original", one-click unsubscribe link in body, plain-language copy, physical postal address in footer | PARTIAL — Gmail VERIFIED end-to-end; Outlook/iCloud SKIPPED by founder approval (flagged for human verification); postal address currently a placeholder ("Quibly · TBD · TBD") with override | `app/actions/join-waitlist.ts:234-246` sends with both List-Unsubscribe headers, `from: 'Quibly <hello@usequibly.com>'`, subject `"You're on the Quibly list"`, react: `WelcomeEmail({ unsubscribeUrl, postalAddress })`. Plan 07 Task 5 confirms Gmail arrival in ~10s, both headers in Show Original, DKIM covers both, body-link unsubscribe round-trip succeeds. UAT Test 2 PASSED (Gmail). **Override applied** for postal address (D-10 deferred to Phase 6 gate). |
| 3 | SC #3 — 5/min/IP and 50/day/IP rate limits trip; disposable-domain submissions silently rejected | VERIFIED | `lib/rate-limit.ts` ladder (5/60s, 50/1d, distinct prefixes); `lib/disposable-domains.ts` 25-entry blocklist; action body lines 110-134. UAT Test 5 PASSED (mailinator silently rejected, no audience row). UAT Test 6 PASSED (5 contacts created, 6th burst-rejected). 8 unit tests for disposable-domains + rate-limit branches in `tests/unit/join-waitlist-action.test.ts`. |
| 4 | SC #4 — Bounce/complaint webhook event reaches handler, marks contact unsubscribed; failed welcome-email sends produce server log + `track('welcome_email_send_error')` event | VERIFIED | `app/api/webhooks/resend/route.ts` exports POST + runtime='nodejs', svix signature verify, D-08 dispatch. Plan 07 Task 6 Part A: bounced@resend.dev triggered real `email_hard_bounced` log with `subType: 'General'`; signature verified; contact flipped to `unsubscribed: true` in audience. Action body fire-and-forget `.catch()` calls `console.error('welcome_email_send_failed', ...)` + `track('welcome_email_send_error', { email })` (lines 255-259). 6+ webhook unit tests + 1 fire-and-forget catch unit test. UAT Test 7 PASSED. |
| 5 | SC #5 — Preview audience receives PR-preview signups (production untouched); CSV export round-trip validated end-to-end | VERIFIED with shipped workaround | `app/actions/join-waitlist.ts:142` audience routing (VERCEL_ENV='production' → live, else → preview). Empirical finding (Plan 07 Task 7): Resend native CSV export does NOT include custom properties. Workaround shipped: `scripts/export-audience.mjs` (`npm run export:audience`) combines `contacts.list` + per-contact `contacts.get` for typed property export. UAT Test 8 PASSED (preview audience CSV with consent_version flattened). UAT methodology section in 04-UAT.md documents the URL→audience routing rule (closed GAP-2 from initial UAT). |

**Score:** 5/5 truths verified (with 2 overrides for STORE-02 API-key-scope infeasibility and D-10 postal address deferral)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `lib/disposable-domains.ts` | isDisposableDomain helper + 25-entry blocklist | VERIFIED | Exists; 25 domains; `lastIndexOf('@').toLowerCase()`; 8 unit tests passing |
| `lib/analytics.ts` | track() shim with TrackEvent union | VERIFIED | `import 'server-only'`; 5 events (waitlist_signup, signup_rejected, welcome_email_send_error, contact_bounced, contact_complained); console.log shim |
| `lib/unsubscribe-token.ts` | HMAC-SHA256 generateToken + verifyToken | VERIFIED | `import 'server-only'`; signs with env.RESEND_WEBHOOK_SECRET; timing-safe compare (`diff |= a[i] ^ b[i]`); cachedKey; 8 unit tests |
| `lib/resend.ts` | Resend SDK singleton | VERIFIED | `import 'server-only'`; `new Resend(env.RESEND_API_KEY)`; no process.env reads |
| `lib/rate-limit.ts` | rateLimitPerMinute (5/60s) + rateLimitPerDay (50/1d) | VERIFIED | `import 'server-only'`; distinct prefixes (`@quibly/ratelimit/min` and `/day`); single Redis.fromEnv() instance |
| `lib/env.ts` | RESEND_FROM_POSTAL_ADDRESS validated; refine guards production placeholder | VERIFIED | min(1) + .refine() rejecting placeholder strings when VERCEL_ENV=production (WR-01 fix) |
| `emails/WelcomeEmail.tsx` | React Email JSX template with D-01 locked voice | VERIFIED | All 4 D-01 phrases present; #0D9488 hex header; postalAddress + unsubscribeUrl props; default + named export; WORDMARK_CID inline-attached PNG (Plan 07 Task 5b) |
| `app/actions/join-waitlist.ts` | Real Resend pipeline replacing Phase 3 stubs | VERIFIED | 0 PHASE-3-STUB markers; 0 dup@/err@/slow@example.com triggers; preserves honeypot/time-trap/Zod; defensive 4-source siteUrl fallback (GAP-1 closure); get-then-create dup detection (Plan 07 Probe 1 finding); inline wordmark attachment |
| `app/api/webhooks/resend/route.ts` | POST handler with svix verify + D-08 dispatch | VERIFIED | runtime='nodejs'; req.text() (NOT json) before verify; svix-id/timestamp/signature 400 guard; 401 on verify throw; recipient-email guard before any track call (CR-04 fix); audienceId mirroring (CR-01 fix); error-envelope inspection (CR-02 fix); 7 unit tests |
| `app/unsubscribe/route.ts` | RFC 8058 POST + Plan 04-08 GET handler | VERIFIED | Both POST and GET share `processUnsubscribe(req, via)` helper; verifyToken; audienceId-scoped contacts.update (CR-01 fix); error envelope inspected (CR-02 fix); HMAC-suffix logging (WR-06 fix); GET returns Quibly-branded HTML; 8+ unit tests |
| `tests/unit/*` (4 new + 1 modified suite) | Full unit coverage | VERIFIED | 7 unit test files / 74 tests passing (`npm run test:unit` exit 0): disposable-domains (8), unsubscribe-token (8), join-waitlist-action (20+ — incl. 3 GAP-1 fallback tests + EMAIL-05 postalAddress assertion), webhook-handler (≥6), unsubscribe-route (≥8 incl. GET coverage), waitlist-form RTL (incl. 3 migrated state-transition tests) |
| `tests/form/` | Phase 3 stub-dep specs migrated/deleted | VERIFIED | 3 deleted (server-error-toast/pending-state/idempotent); 1 modified (success-state — POST-03 via UI invariant); 0 dup@/err@/slow@ references remain |
| `package.json` | resend, @react-email/components, @upstash/ratelimit, @upstash/redis | VERIFIED | All four runtime deps present at expected versions; `@react-email/render@^2.0.8` added (Bug 2 fix from Plan 07) |
| `.env.example` | NEXT_PUBLIC_SITE_URL + RESEND_FROM_POSTAL_ADDRESS docs | VERIFIED | Both documented; pre-Phase-6 `quibly-landing.vercel.app` value with multi-line caveat block |

### Key Link Verification

| From | To | Via | Status |
| ---- | -- | --- | ------ |
| `app/actions/join-waitlist.ts` | `lib/resend.ts` | `import { resend }` → `resend.contacts.create` + `resend.contacts.get` + `resend.emails.send` | WIRED |
| `app/actions/join-waitlist.ts` | `lib/rate-limit.ts` | `import { rateLimitPerMinute, rateLimitPerDay }` → `.limit(ip)` | WIRED |
| `app/actions/join-waitlist.ts` | `lib/disposable-domains.ts` | `import { isDisposableDomain }` → guard call | WIRED |
| `app/actions/join-waitlist.ts` | `emails/WelcomeEmail.tsx` | `import WelcomeEmail, { WORDMARK_CID }` → `react: WelcomeEmail({ unsubscribeUrl, postalAddress })` | WIRED |
| `app/actions/join-waitlist.ts` | `lib/unsubscribe-token.ts` | `import { generateToken }` → `generateToken(email)` | WIRED |
| `app/actions/join-waitlist.ts` | `lib/analytics.ts` | `import { track }` → 4 distinct call sites (waitlist_signup, signup_rejected×2, welcome_email_send_error) | WIRED |
| `app/api/webhooks/resend/route.ts` | `lib/resend.ts` | `import { resend }` → `resend.webhooks.verify` + `resend.contacts.update` | WIRED |
| `app/api/webhooks/resend/route.ts` | `lib/env.ts` | `import { env }` → `env.RESEND_WEBHOOK_SECRET` | WIRED |
| `app/api/webhooks/resend/route.ts` | `lib/analytics.ts` | `import { track }` → `track('contact_bounced'/'contact_complained', ...)` | WIRED |
| `app/unsubscribe/route.ts` | `lib/unsubscribe-token.ts` | `import { verifyToken }` → `verifyToken(token)` | WIRED |
| `app/unsubscribe/route.ts` | `lib/resend.ts` | `import { resend }` → `resend.contacts.update` | WIRED |
| `emails/WelcomeEmail.tsx` | `@react-email/components` | imports Body/Container/Head/Hr/Html/Link/Preview/Section/Text | WIRED |
| Welcome email body link → live deployment | `https://quibly-landing.vercel.app/unsubscribe?t=…` | NEXT_PUBLIC_SITE_URL set in Vercel Production env | WIRED (Plan 04-08 Task 2 closure — verified by founder click-through with `gushags+wild2@gmail.com`; contact flipped to unsubscribed:true) |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------- | ------ |
| `app/actions/join-waitlist.ts` | `email`, `consent_version`, `audienceId` | FormData → Zod schema; env.RESEND_AUDIENCE_ID/PREVIEW; VERCEL_GIT_COMMIT_SHA fallback `'pre-phase-5'` | Real audience writes empirically confirmed via UAT Tests 1, 4, 6 (Resend Dashboard rows visible) | FLOWING |
| `emails/WelcomeEmail.tsx` | `unsubscribeUrl`, `postalAddress` | Plan 04-08 fallback chain → generateToken; env.RESEND_FROM_POSTAL_ADDRESS | UAT Test 2 PASSED — Gmail rendered the email body with real values; Plan 04-08 Task 2 closed: GET on real URL returned 200 + flipped contact | FLOWING (note: postalAddress is a placeholder in Production env — see Override 2) |
| `app/api/webhooks/resend/route.ts` | `recipientEmail`, `bounceType` | event.data.to[0] / event.data.bounce.type | Real bounced@resend.dev event surfaced `subType: 'General'` log; contact flipped | FLOWING |
| `app/unsubscribe/route.ts` | `email` (decoded from token) | verifyToken(searchParams.get('t')) | UAT Test 3 (post-fix) — body-link GET on production deploy unsubscribed `gushags+wild2@gmail.com` | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Type-check passes | `npm run check` | exit 0 | PASS |
| Lint passes (no warnings) | `npm run lint` | exit 0 | PASS |
| Full unit suite passes | `npm run test:unit` | 7 files / 74 tests passed | PASS |
| Stub markers fully removed | `grep -c "PHASE-3-STUB\|dup@example.com\|err@example.com\|slow@example.com" app/actions/join-waitlist.ts` | 0 | PASS |
| Mixed-case usequibly.com eliminated from action | `grep -c "useQuibly.com" app/actions/join-waitlist.ts` | 0 | PASS |
| GAP-1 defensive fallback in place | `grep -c "VERCEL_PROJECT_PRODUCTION_URL" app/actions/join-waitlist.ts` | 2 (comment + read) | PASS |
| UAT Methodology section present | `grep -c "UAT Methodology — URL Routing Cheat Sheet" .planning/.../04-UAT.md` | 1 | PASS |
| Phase 4 deps installed | `node -e require('./package.json').dependencies` for resend/@react-email/components/@upstash/ratelimit/@upstash/redis | All present | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| EMAIL-01 | 05 | Welcome email fire-and-forget within 60s | SATISFIED | UAT Test 2 — Gmail arrival ~10s; fire-and-forget pattern in action body (no `await`) |
| EMAIL-02 | 05 | Sent from `hello@useQuibly.com` | SATISFIED | `from: 'Quibly <hello@usequibly.com>'` (lowercased per Resend domain canonicalization fix `414e29a`) |
| EMAIL-03 | 05 | List-Unsubscribe + List-Unsubscribe-Post headers | SATISFIED | Action body sets both; UAT Test 2 confirmed visible in Gmail "Show Original" with DKIM coverage |
| EMAIL-04 | 05, 06 | One-click unsubscribe link in body | SATISFIED | Welcome email footer Link; `app/unsubscribe/route.ts` POST + GET handlers; round-trip empirically verified (Plan 04-08 Task 2) |
| EMAIL-05 | 05, 04 | Physical postal address in footer (CAN-SPAM) | PARTIAL — wiring verified, real address deferred | `WelcomeEmail.tsx` renders `{postalAddress}` slot; env validator + .refine() guard in place; UNIT TEST asserts non-empty postalAddress reaches `WelcomeEmail`. **Override applied** for placeholder value still in Vercel Production. |
| EMAIL-06 | 04 | Plain-language confirmation paragraph | SATISFIED | D-01 voice locked verbatim in `WelcomeEmail.tsx`; UAT Test 2 confirmed 4 D-01 paragraphs render |
| EMAIL-07 | 04 | React Email JSX template | SATISFIED | `emails/WelcomeEmail.tsx` exists, default + named export |
| EMAIL-08 | 05 | Server-side observability for welcome-email failures | SATISFIED | `.catch()` block: `console.error('welcome_email_send_failed')` + `track('welcome_email_send_error', { email })` |
| EMAIL-09 | 06 | Resend webhook for bounced/complained | SATISFIED | `app/api/webhooks/resend/route.ts` registered in production; bounced@resend.dev empirically verified |
| STORE-01 | 05 | One Resend audience "Quibly Waitlist" + preview | SATISFIED | RESEND_AUDIENCE_ID + RESEND_AUDIENCE_PREVIEW_ID validated at boot; CD-04 routing live |
| STORE-02 | 05, 07 | Restricted "Sending access" API key | NEEDS HUMAN — Override applied | Documented finding (04-07-SUMMARY Task 6 Part B): Resend permission model offers only Sending-access (no contacts API) or Full-access. Compensating controls in place. |
| STORE-03 | 05 | `resend.contacts.create` is single write path | SATISFIED | Action body line 177 is the sole `contacts.create` call site in the project (verified by grep) |
| STORE-04 | 05 | Each contact carries consent_version property | SATISFIED | `properties: { consent_version: consentVersion }` written; CD-03 stub (`VERCEL_GIT_COMMIT_SHA ?? 'pre-phase-5'`); per-contact API GET round-trip preserved value |
| STORE-05 | 07 | CSV export workflow validated end-to-end | SATISFIED | Native Resend CSV omits custom properties; `scripts/export-audience.mjs` shipped + tested (~7.7 req/sec); flattens typed property shape; UAT Test 8 PASSED |
| SPAM-03 | 03 | Upstash Redis sliding-window 5/min + 50/day | SATISFIED | `lib/rate-limit.ts` ladder; UAT Test 6 confirmed 5 contacts created + 6th burst-rejected |
| SPAM-04 | 01 | Disposable-domain blocklist | SATISFIED | `lib/disposable-domains.ts` 25 entries; UAT Test 5 (mailinator) silently rejected |

**No orphaned requirements** — all 16 Phase 4 IDs accounted for in plans 04-01 through 04-08.

### Anti-Patterns Found

The 04-REVIEW.md found 4 critical + 7 warnings + 4 info issues. Status:

| ID | Severity | Status | Notes |
| -- | -------- | ------ | ----- |
| CR-01..CR-04 | Critical | FIXED | Audience-scope + error-envelope inspection on contacts.update; type alignment; recipient-email guard |
| WR-01, WR-02, WR-04, WR-06 | Warning | FIXED | Postal-address placeholder refine; production fail-loud on missing site URL; dead void removed; HMAC-suffix logging |
| WR-03 | Warning | DEFERRED to Phase 5 | `await track(...)` blocks until Phase 5 wires `@vercel/analytics/server`; no current impact (analytics is `console.log`) |
| WR-05 | Warning | DEFERRED | unsubscribe-token verifyToken pattern is functionally correct; refactor only |
| WR-07 | Warning | DEFERRED | Type-cosmetic on webhook handler |
| 4 × Info | Info | NOT IN SCOPE | Default review-fix scope is critical+warning |

No new anti-patterns surfaced from grepping the modified files. The 8 of 11 critical+warning fixed plus 3 documented deferrals are reasonable.

### Human Verification Required

#### 1. Postal address — production-deploy gate (Phase 6)

**Test:** Source a real non-home postal address (registered agent / PO Box / CMRA), set `RESEND_FROM_POSTAL_ADDRESS` in Vercel Production env to that value, redeploy, send a fresh signup against `https://quibly-landing.vercel.app`, verify the welcome-email footer shows the real address.

**Expected:** Footer renders the real address (not "Quibly · TBD · TBD"). CAN-SPAM EMAIL-05 satisfied for live audience.

**Why human:** Sourcing the address requires a real-world action. Plan 07 Task 3 explicitly deferred this. Phase 6 launch cannot ship until closed.

#### 2. Outlook + iCloud inbox verification (ROADMAP SC #2)

**Test:** Submit fresh emails to one Outlook/Hotmail and one iCloud address against the production deployment. Confirm: (a) arrival within 60s, (b) From shows "Quibly", (c) both List-Unsubscribe headers visible in client's "View Source", (d) DKIM-Signature line includes both header names, (e) body-link unsubscribe round-trip flips contact.

**Expected:** All five sub-conditions met for both clients.

**Why human:** Email-client rendering and header presentation can only be observed in the actual clients. Founder explicitly approved Gmail-only verification per Plan 07 SUMMARY (Task 5). ROADMAP SC #2 names all three.

### Gaps Summary

No code-level gaps remain. The phase implements the full pipeline end-to-end:

- Layered abuse defenses (honeypot, time-trap, Zod, disposable-domain, rate-limit) — all five in place and unit-tested
- Real Resend audience write with consent_version — confirmed empirically via Resend Dashboard
- Welcome email with both List-Unsubscribe headers, DKIM coverage, body-link unsubscribe — confirmed in Gmail
- Webhook handler with svix verification, audience-scoped contact updates, error-envelope inspection — confirmed via bounced@resend.dev
- CSV export workflow validated through shipped per-contact GET workaround
- Two UAT-discovered gaps (unsubscribe-URL → Porkbun, signups landing in production audience due to URL methodology) closed via Plan 04-08 (defensive fallback chain + UAT methodology section + GET handler addition)
- Code review findings: 4 critical fixed, 4 of 7 warnings fixed, 3 warnings deferred with documented rationale

Two issues remain that are NOT code-level and are correctly classified as human-verification rather than gaps:

1. **Postal address placeholder** — D-10 Phase 6 launch gate; lib/env.ts refine() will block production boot once address is set since "Quibly · TBD · TBD" passes the current refine but a real-world placeholder pattern would not. Override accepted for Phase 4 completion; Phase 6 cannot ship without closure.

2. **Outlook + iCloud inbox arrival** — ROADMAP SC #2 names all three clients; Gmail verified, the other two skipped by founder approval. Spot-check before Phase 6 launch.

The phase goal is achieved: form is live against the real Resend audience, the welcome email is deliverability-correct (Gmail empirically verified at 10/10 mail-tester), layered abuse protection is in place, webhook-driven unsubscribe flow works end-to-end, and audience CSV-portability has a working path.

---

_Verified: 2026-04-28_
_Verifier: Claude (gsd-verifier)_
