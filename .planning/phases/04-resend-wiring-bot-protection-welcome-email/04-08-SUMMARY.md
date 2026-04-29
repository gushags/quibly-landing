---
phase: 04-resend-wiring-bot-protection-welcome-email
plan: 08
subsystem: waitlist-pipeline
tags: [phase-4, gap-closure, unsubscribe-url, vercel-env-var, uat-methodology]
requirements: [EMAIL-04, STORE-01]
gap_closure: true
dependency_graph:
  requires: [07]
  provides: [hardened-unsubscribe-url-fallback, uat-methodology-doc]
  affects: [app/actions/join-waitlist.ts, .env.example, 04-UAT.md]
tech_stack:
  added: []
  patterns:
    - "Defensive env-var fallback chain (NEXT_PUBLIC_SITE_URL → VERCEL_PROJECT_PRODUCTION_URL → VERCEL_URL → apex literal)"
key_files:
  created:
    - .planning/phases/04-resend-wiring-bot-protection-welcome-email/04-08-SUMMARY.md
  modified:
    - app/actions/join-waitlist.ts
    - tests/unit/join-waitlist-action.test.ts
    - .env.example
    - .planning/phases/04-resend-wiring-bot-protection-welcome-email/04-UAT.md
decisions:
  - "Implement a four-source fallback chain in the action so the unsubscribe URL is defensively constructed even when NEXT_PUBLIC_SITE_URL is unset — chosen over the lighter alternative (single-source string) so a future env-var removal cannot silently regress to an unbound apex."
  - "Lowercase the apex literal to `https://usequibly.com` to match the Resend sender domain casing standardized in commit 21e24b4 — eliminates the mixed-case `useQuibly.com` from the action entirely."
  - "Treat the `NEXT_PUBLIC_LAUNCHED` defensive flag (option 3 from signups-land-in-production-audience.md) as deliberately deferred — CD-04 routing is correct, and the methodology doc (Task 3) is sufficient guidance without changing documented runtime behavior."
metrics:
  duration_minutes: ~10
  tasks_completed_auto: 3
  tasks_open_human_action: 2
  files_modified: 6
  commits_made: 7
  completed_date: 2026-04-29
---

# Phase 4 Plan 08: Gap Closure for UAT-Discovered Issues — Summary

One-liner: Hardened the welcome-email unsubscribe-URL construction with a four-source defensive fallback chain (eliminating the silent unbound-apex failure mode) and added UAT methodology guidance documenting the VERCEL_ENV → audience routing rule, closing both gaps surfaced during Phase 4 UAT test 3.

## Outcome

**GAP 1 (blocker — unsubscribe URL → Porkbun):** Code half **closed**. The action now resolves `siteUrl` through a defensive fallback chain so the welcome-email unsubscribe URL can never silently route to an unbound apex even if `NEXT_PUBLIC_SITE_URL` is removed. Test coverage for the fallback chain was added. The verification half (founder sets the Vercel Production env var, redeploys, click-through-tests a fresh signup) is recorded below as **Open Human Action 1**.

**GAP 2 (major — UAT methodology):** Closed. A "UAT Methodology — URL Routing Cheat Sheet" section was appended to `04-UAT.md` documenting the URL-to-audience mapping. Future UAT runs against the Preview URL or local dev will write to the preview audience as intended. The optional cleanup of ~5 UAT-test contacts from the production audience is recorded below as **Open Human Action 2**.

## Code Changes

### `app/actions/join-waitlist.ts` (commit `a827c37`)

Replaced the single-source `siteUrl` resolution with a four-source defensive fallback chain. Order: explicit user-set `NEXT_PUBLIC_SITE_URL` → Vercel-injected `VERCEL_PROJECT_PRODUCTION_URL` (project-canonical Production host, prefixed with `https://`) → Vercel-injected `VERCEL_URL` (per-deployment host, prefixed with `https://`) → apex literal `https://usequibly.com`. Two new `eslint-disable-next-line custom/no-raw-process-env` comments extend the existing PATTERNS.md §"env import convention" exception to cover the new Vercel system env vars.

Also: lowercase apex literal `usequibly.com` (was mixed-case `useQuibly.com`) — matches the Resend sender domain casing standardized in earlier commit `21e24b4`. `grep -c "useQuibly.com" app/actions/join-waitlist.ts` now returns 0.

### `tests/unit/join-waitlist-action.test.ts` (commit `c2abcc7`)

Three new test cases under `describe('unsubscribe URL fallback chain (GAP-1 / Plan 04-08)')` verify the resolution priority:

1. `uses NEXT_PUBLIC_SITE_URL when set (highest priority)`
2. `falls back to VERCEL_PROJECT_PRODUCTION_URL when NEXT_PUBLIC_SITE_URL is unset`
3. `falls back to VERCEL_URL when both NEXT_PUBLIC_SITE_URL and VERCEL_PROJECT_PRODUCTION_URL are unset`

Each case captures + restores env-var state via `afterEach` so the existing top-of-file setter (line 12) keeps protecting the other 17 cases. `afterEach` was added to the `vitest` import line.

`npm run test:unit -- tests/unit/join-waitlist-action.test.ts` → **20 tests pass (17 existing + 3 new)**.

### `.env.example` (commit `ffadcb0`)

Replaced the misleading `Production: https://useQuibly.com` comment with a multi-line block that documents:
- Pre-Phase-6 reality: apex not yet bound; current production value is `https://quibly-landing.vercel.app`.
- Post-Phase-6 reality: flip back to `https://usequibly.com`.
- Behavior when unset: falls through the new defensive chain in the action.

The placeholder default value is now `https://quibly-landing.vercel.app` so `cp .env.example .env.local` produces a working dev configuration.

### `app/unsubscribe/route.ts` — Task 5 GET handler (commit `d62fabd`)

Surfaced during Task 2's live click-through: the welcome email's body Unsubscribe link is a regular `<Link href={unsubscribeUrl}>`, which sends a GET when clicked. The existing POST-only handler returned 405; contact never flipped. Empirically Gmail does not surface the header-driven Unsubscribe button for new senders without bulk-mail reputation, so the body link is the primary unsubscribe UX in pre-launch — refuting the deferred-GET decision in 04-CONTEXT.md.

The new `GET` handler shares an internal `processUnsubscribe(req, via)` helper with `POST` to keep token verification and `resend.contacts.update` exactly identical between paths. On 200 it returns a Quibly-branded HTML confirmation page; on 400/401 it returns an HTML error page with a `mailto:unsubscribe@usequibly.com` fallback. Both responses are `noindex`.

Prefetch risk (link previewers / scanners issuing GETs) is bounded by per-recipient HMAC tokens — a prefetch can only unsubscribe the original recipient, who already received the email. Upgrade path to two-step confirm-form is ~15 LOC if false-unsubscribe patterns appear post-launch.

### `tests/unit/unsubscribe-route.test.ts` — Task 5 GET coverage (commit `c98db84`)

Three new cases under `describe('GET /unsubscribe (body-link UX / Plan 04-08)')`:
1. Returns 400 + HTML when `t` query param is missing.
2. Returns 401 + HTML on tampered token.
3. Returns 200 + HTML confirmation + `resend.contacts.update({ email, unsubscribed: true })` on valid token.

`npm run test:unit -- tests/unit/unsubscribe-route.test.ts` → **8 tests pass (5 existing POST + 3 new GET)**.

### `.planning/phases/04-resend-wiring-bot-protection-welcome-email/04-CONTEXT.md` — deferred-decision flip (commit `be76901`)

Strike-through preserves the original deferral text for audit trail and notes plan 04-08 implemented the GET handler after empirical UAT refuted the deferral premise.

### `.planning/phases/04-resend-wiring-bot-protection-welcome-email/04-UAT.md` (commit `d1172da`)

Appended a new top-level "UAT Methodology — URL Routing Cheat Sheet" section. Existing test results and the `## Gaps` block are unmodified (verified by inspecting the diff — only an additive append after the prior last line). Section includes:

- The CD-04 routing TypeScript snippet.
- A 3-row routing table (Production-aliased URL / Preview deploy URL / `localhost:3000`) mapping each to its `VERCEL_ENV` value, written audience, and recommended use.
- Rule-of-thumb guidance.
- Reference to `npm run export:audience` for cleanup workflow.

## Commits

| Hash | Type | Scope | Description |
|------|------|-------|-------------|
| `a827c37` | fix | 04-08 | Harden unsubscribe-URL fallback chain (GAP-1 code half) |
| `c2abcc7` | test | 04-08 | Cover unsubscribe-URL fallback chain |
| `ffadcb0` | docs | 04-08 | Update NEXT_PUBLIC_SITE_URL .env.example comment for pre-Phase-6 reality |
| `d1172da` | docs | 04-08 | Add UAT methodology section to close GAP-2 truth |

| `d62fabd` | feat | 04-08 | Add GET handler to /unsubscribe to fix body-link UX (Task 5 — surfaced during Task 2 verification) |
| `c98db84` | test | 04-08 | Cover unsubscribe GET handler |
| `be76901` | docs | 04-08 | Flip GET-handler deferred decision in CONTEXT.md |

The first four commits landed on `worktree-agent-a6fa80389a64bc7c6` based on `5197ce1` and were fast-forwarded to `main` after wave-merge. The last three (Task 5 — added inline after the executor returned) were committed directly to `main` after the founder's Task 2 verification surfaced the body-link 405 defect.

## Verification

- `npm run lint` → exit 0 (the four `eslint-disable-next-line` comments cover the new `process.env` reads).
- `npm run test:unit -- tests/unit/join-waitlist-action.test.ts` → exit 0 with 20/20 passing (17 existing + 3 new fallback-chain cases).
- `grep -c "useQuibly.com" app/actions/join-waitlist.ts` → 0 (mixed-case fully eliminated).
- `grep -c "VERCEL_PROJECT_PRODUCTION_URL" app/actions/join-waitlist.ts` → 2 (one comment line + one read).
- `grep -c "UAT Methodology — URL Routing Cheat Sheet" .planning/phases/04-resend-wiring-bot-protection-welcome-email/04-UAT.md` → 1.
- `git diff 5197ce1..HEAD -- .planning/.../04-UAT.md` confirms the existing Gaps block and per-test `result:` fields are untouched (additive append only).

## Deviations from Plan

None — plan executed exactly as written for the two auto tasks. The two `checkpoint:human-action` tasks (Task 2 + Task 4) are deferred to founder follow-up as recorded below; their gating cannot be discharged from a parallel-worktree executor.

## Open Human Actions (deferred to founder post-merge)

These are the two `checkpoint:human-action` tasks from the plan. They could not be performed by the executor (require Vercel dashboard access, redeploy, live signup + click-through verification). Founder must complete them after this plan's commits land on `main`.

### Open Human Action 1 — Task 2: Vercel Production env var + live unsubscribe verification (CLOSED)

**Status (final, 2026-04-28):** **CLOSED — GAP 1 fully verified end-to-end.**

Verification timeline:
1. Founder set `NEXT_PUBLIC_SITE_URL=https://quibly-landing.vercel.app` in Vercel Production scope (`vercel env ls | grep NEXT_PUBLIC_SITE_URL` confirmed present).
2. First click-through against `https://quibly-landing.vercel.app` exposed a second defect: body-link GET returned 405 from the POST-only handler. Plan 04-08 was extended inline with **Task 5** (GET handler) — three new commits (`d62fabd`, `c98db84`, `be76901`) — fixing the body-link unsubscribe path.
3. Founder pushed Task 5 commits, Vercel redeployed Production, and re-ran the click-through with a fresh test address (`gushags+wild2@gmail.com`).
4. **Result confirmed:** body-link GET returned 200 from the Quibly-branded confirmation page; Resend Dashboard production audience flipped the contact to `unsubscribed: true`.

Token evidence (HMAC-signed, redacted email-bearing prefix):
```
<TOKEN_PREFIX_BASE64URL_EMAIL>.<HMAC_BASE64URL>
```
Decodes to `gushags+wild2@gmail.com` + valid HMAC signature → only producible by the live action's `generateToken(email)`, only acceptable to `verifyToken` if the secret matches → end-to-end proof the wired Production deployment processed the unsubscribe.

GAP 1 truth ("Welcome-email unsubscribe link routes to a live Quibly endpoint and marks the contact unsubscribed") fully closed.

**Founder steps (verbatim from the plan):**

1. Open https://vercel.com/<your-team>/quibly-landing/settings/environment-variables.
2. Set `NEXT_PUBLIC_SITE_URL=https://quibly-landing.vercel.app`, scope = Production. (CLI alternative: `vercel env add NEXT_PUBLIC_SITE_URL production`.)
3. Trigger a Production redeploy (env-var changes take effect on next deploy). Pushing the four 04-08 commits to `main` will auto-trigger this.
4. End-to-end verification:
   - Open `https://quibly-landing.vercel.app` in incognito.
   - Submit a fresh email you control.
   - Wait for welcome email; click Unsubscribe in footer.
   - Expected: 200 from Next.js `/unsubscribe` handler (NOT Porkbun parking).
   - Verify Resend Dashboard → production audience → contact `unsubscribed: true`.
5. Spot-check Gmail "Show Original" → `List-Unsubscribe` header references `quibly-landing.vercel.app`, not `useQuibly.com`.

**Record after completion:**
- The redacted unsubscribe URL clicked (token replaced with `<TOKEN>`).
- The Resend contact ID that flipped to `unsubscribed: true`.
- Output of `vercel env ls | grep NEXT_PUBLIC_SITE_URL` (or dashboard screenshot).

The hardened fallback chain in the action provides a defense-in-depth net even before this env var is set: if `NEXT_PUBLIC_SITE_URL` is missing, the action will fall through to `VERCEL_PROJECT_PRODUCTION_URL` (auto-set by Vercel to `quibly-landing.vercel.app` on Production), so the unsubscribe URL still resolves to the live handler. The explicit env var still preferred for deterministic, dashboard-inspectable behavior.

### Open Human Action 2 — Task 4: Optional cleanup of ~5 UAT-test contacts in production audience (OPTIONAL)

**Status:** **skipped by founder (2026-04-28)** — GAP 2 truth already closed by the Task 3 methodology section. Founder elected to leave the ~5 UAT-test contacts in the production audience until launch; they will receive at most one welcome email if not already unsubscribed, which is acceptable for a pre-launch waitlist.

## Phase 6 Forward-Looking Note

When Phase 6 ships apex binding (DEPLOY-01..02), update:
- The Vercel Production env var: `NEXT_PUBLIC_SITE_URL` from `https://quibly-landing.vercel.app` back to `https://usequibly.com` (or the chosen apex value).
- `.env.example` comment block: flip to the post-Phase-6 wording (the structure is already there; just swap which line is the "current" production value).

The hardened fallback chain in `app/actions/join-waitlist.ts` does NOT need to change — its priority order is already correct for both pre- and post-Phase-6 worlds.

## Optional-Defense Defer Note

The `NEXT_PUBLIC_LAUNCHED` defensive flag (option 3 from `.planning/debug/signups-land-in-production-audience.md`) was deliberately NOT implemented. Rationale:

- The CD-04 routing rule (`VERCEL_ENV === 'production' ? prod : preview`) is correct as documented.
- The flag would change documented runtime behavior and introduce a launch-day flip step (additional risk during a critical window).
- The methodology guidance from Task 3 (UAT cheat sheet) is sufficient to prevent the recurrence.

If post-launch reflection identifies value (e.g., a recurring need to keep production reads live but suppress production writes during dry runs), the flag can be added in a v1.x phase without touching this plan's surface.

## Self-Check: PASSED

Verified (all checks ran from worktree HEAD `d1172da`):

- `[ -f app/actions/join-waitlist.ts ]` → FOUND
- `[ -f tests/unit/join-waitlist-action.test.ts ]` → FOUND
- `[ -f .env.example ]` → FOUND
- `[ -f .planning/phases/04-resend-wiring-bot-protection-welcome-email/04-UAT.md ]` → FOUND
- Commit `a827c37` → FOUND in `git log`
- Commit `c2abcc7` → FOUND in `git log`
- Commit `ffadcb0` → FOUND in `git log`
- Commit `d1172da` → FOUND in `git log`
- `grep -c "useQuibly.com" app/actions/join-waitlist.ts` → 0 (expected 0)
- `grep -c "VERCEL_PROJECT_PRODUCTION_URL" app/actions/join-waitlist.ts` → 2 (expected ≥1)
- `grep -c "UAT Methodology — URL Routing Cheat Sheet" .planning/.../04-UAT.md` → 1 (expected 1)
- `npm run lint` → exit 0
- `npm run test:unit -- tests/unit/join-waitlist-action.test.ts` → exit 0, 20/20 pass
