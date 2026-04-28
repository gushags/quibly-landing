---
phase: 04-resend-wiring-bot-protection-welcome-email
plan: "01"
subsystem: infra
tags: [resend, upstash, react-email, env-validation, disposable-domains, spam-protection, can-spam]

requires:
  - phase: 03-email-capture-form-stub-action
    provides: "lib/env.ts Phase 1 surface with Zod schema for Resend/Upstash env vars"

provides:
  - "resend@6.12.2, @react-email/components@1.0.12, @upstash/ratelimit@2.0.8, @upstash/redis@1.37.0 installed as runtime dependencies"
  - "lib/env.ts validates RESEND_FROM_POSTAL_ADDRESS (7th key) at module load — crashes on boot if absent"
  - ".env.example documents RESEND_FROM_POSTAL_ADDRESS (placeholder) and NEXT_PUBLIC_SITE_URL"
  - "lib/disposable-domains.ts exports isDisposableDomain(email) with 25-entry hand-curated blocklist"

affects: [04-02, 04-03, 04-04, 04-05, 04-06, 04-07]

tech-stack:
  added:
    - resend@6.12.2
    - "@react-email/components@1.0.12"
    - "@upstash/ratelimit@2.0.8"
    - "@upstash/redis@1.37.0"
  patterns:
    - "SPAM-04: isDisposableDomain pure synchronous Set.has() lookup — called after Zod validation, before rate-limit"
    - "D-03: disposable-domain hit returns silent success — no welcome email, no analytics event"
    - "D-10: RESEND_FROM_POSTAL_ADDRESS must be non-empty string at module load (no NODE_ENV leniency)"

key-files:
  created:
    - lib/disposable-domains.ts
    - tests/unit/disposable-domains.test.ts
  modified:
    - package.json
    - package-lock.json
    - lib/env.ts
    - .env.example

key-decisions:
  - "Hand-curated 25-entry disposable domain blocklist (CD-01) rather than npm package — sufficient for pre-launch volume, no permanent dep"
  - "NEXT_PUBLIC_SITE_URL intentionally NOT added to lib/env.ts schema — public env vars use process.env.NEXT_PUBLIC_SITE_URL with fallback in action (J3 / Pattern 5)"
  - "RESEND_FROM_POSTAL_ADDRESS accepts placeholder value in dev/preview — D-10 production blocker enforced by Plan 07 checkpoint"

patterns-established:
  - "Pattern: isDisposableDomain called AFTER Zod validation (email well-formed) and BEFORE rate-limit (cheaper than network round-trip)"
  - "Pattern: Disposable hit = silent success posture (matches honeypot/time-trap from Phase 3)"

requirements-completed: [SPAM-04]

duration: 4min
completed: 2026-04-28
---

# Phase 4 Plan 01: Dependencies + Env + Disposable-Domain Blocklist Summary

**Four Phase 4 runtime deps installed, lib/env.ts extended with CAN-SPAM postal address validation, and isDisposableDomain(email) pure utility shipped with 8-case Vitest coverage**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-28T21:38:37Z
- **Completed:** 2026-04-28T21:42:00Z
- **Tasks:** 4 (Task 4 uses TDD with RED + GREEN commits)
- **Files modified:** 6

## Accomplishments

- Installed resend@6.12.2, @react-email/components@1.0.12, @upstash/ratelimit@2.0.8, @upstash/redis@1.37.0 as runtime dependencies (not devDependencies)
- Extended lib/env.ts with `RESEND_FROM_POSTAL_ADDRESS` (7th Zod key) — hard-crash at module load if absent, error message cites CAN-SPAM EMAIL-05 and D-10
- Updated .env.example with two new entries (RESEND_FROM_POSTAL_ADDRESS placeholder + NEXT_PUBLIC_SITE_URL production default) — gitleaks scan clean
- Shipped lib/disposable-domains.ts (25-entry Set, O(1) lookup, case-insensitive, graceful on malformed input) with 8 passing Vitest tests via TDD RED/GREEN cycle

## Installed Versions (from package-lock.json)

| Package | Installed Version |
|---------|-------------------|
| resend | 6.12.2 |
| @react-email/components | 1.0.12 |
| @upstash/ratelimit | 2.0.8 |
| @upstash/redis | 1.37.0 |

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Phase 4 runtime dependencies** - `f33d850` (chore)
2. **Task 2: Extend lib/env.ts with RESEND_FROM_POSTAL_ADDRESS** - `06a1699` (feat)
3. **Task 3: Update .env.example with RESEND_FROM_POSTAL_ADDRESS + NEXT_PUBLIC_SITE_URL** - `6af1efd` (docs)
4. **Task 4 RED: Failing tests for isDisposableDomain** - `e4d1710` (test)
5. **Task 4 GREEN: Implement isDisposableDomain** - `56970d6` (feat)

**Plan metadata:** (pending)

_Note: Task 4 uses TDD — RED commit (failing tests) followed by GREEN commit (implementation)._

## Files Created/Modified

- `package.json` + `package-lock.json` - Four runtime deps added (resend, @react-email/components, @upstash/ratelimit, @upstash/redis)
- `lib/env.ts` - Added RESEND_FROM_POSTAL_ADDRESS as 7th Zod schema key; all 6 pre-existing keys unchanged
- `.env.example` - Appended RESEND_FROM_POSTAL_ADDRESS placeholder (with CAN-SPAM / D-10 comment) and NEXT_PUBLIC_SITE_URL production default
- `lib/disposable-domains.ts` - isDisposableDomain() with 25-entry blocklist; no server-only import (pure computation)
- `tests/unit/disposable-domains.test.ts` - 8 test cases covering all behavior spec items

## lib/env.ts Change Summary

- One new key added: `RESEND_FROM_POSTAL_ADDRESS: z.string().min(1, '... CAN-SPAM EMAIL-05 ... D-10 ...')`
- Zero existing keys modified or removed
- No `import 'server-only'` added (D-08: env validation must run at build time)
- `NEXT_PUBLIC_SITE_URL` intentionally NOT added (public env vars use `process.env.NEXT_PUBLIC_SITE_URL` with fallback, per J3)

## Disposable-Domain Blocklist Final Count

25 domains total including: mailinator.com, tempmail.com, 10minutemail.com, guerrillamail family (7 entries: .com, .info, .biz, .de, .net, .org + guerrillamailblock.com), sharklasers.com, grr.la, yopmail.com, throwawaymail.com, throwam.com, spam4.me, trashmail.me, trashmail.at, dispostable.com, mailnull.com, spamgourmet family (3 entries), fakeinbox.com, maildrop.cc.

## Day-1 Probe Status

Per CONTEXT.md, two day-1 probes were flagged:
- **Resend duplicate-email response shape** — NOT exercised in Plan 01 (as expected; Plan 05 addresses this)
- **Resend webhook event names for email.bounced/email.complained** — NOT exercised in Plan 01 (as expected; Plans 06/07 address this)

## Decisions Made

- Hand-curated 25-entry list (CD-01): the `disposable-email-domains` npm package (~3000 entries) was explicitly rejected to avoid a permanent dependency at pre-launch volume
- NEXT_PUBLIC_SITE_URL kept out of lib/env.ts schema: public env vars do not follow the same validation pattern as server-only vars; the action will use `process.env.NEXT_PUBLIC_SITE_URL ?? 'https://useQuibly.com'` (Pattern 5 / J3)
- Placeholder accepted by Zod min(1): `YOUR-POSTAL-ADDRESS-HERE` is non-empty so local dev works; the D-10 production blocker is enforced by the Plan 07 pre-deploy checklist

## TDD Gate Compliance

- RED gate: `e4d1710` — `test(04-01): add failing test for isDisposableDomain (SPAM-04 RED)` — tests failed as expected (module not found)
- GREEN gate: `56970d6` — `feat(04-01): implement isDisposableDomain (SPAM-04 GREEN)` — all 8 tests pass

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None — lib/disposable-domains.ts is a pure utility with no stub values. All 25 domain entries are real blocklist data.

## Threat Flags

No new security surface introduced beyond what the plan's threat model documents. The `.env.example` additions contain only placeholder values (gitleaks scan verified clean).

## Next Phase Readiness

- All four Phase 4 runtime dependencies available for import in Plans 02–07
- lib/env.ts ready for Plan 05's action body to call `env.RESEND_API_KEY`, `env.RESEND_AUDIENCE_ID`, `env.RESEND_FROM_POSTAL_ADDRESS`, etc.
- isDisposableDomain() import-ready for Plan 05's join-waitlist action body
- .env.local in main repo will need `RESEND_FROM_POSTAL_ADDRESS=YOUR-POSTAL-ADDRESS-HERE` added before Plans 03+ run dev server

---
*Phase: 04-resend-wiring-bot-protection-welcome-email*
*Completed: 2026-04-28*
