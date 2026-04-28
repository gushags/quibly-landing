---
phase: 04-resend-wiring-bot-protection-welcome-email
plan: 03
subsystem: server-infrastructure
tags: [phase-4, resend-singleton, rate-limit, server-only, upstash]
dependency_graph:
  requires: [04-01]
  provides: [resend-singleton, rate-limit-ladder]
  affects: [04-05, 04-06]
tech_stack:
  added: []
  patterns:
    - import 'server-only' as line 1 on all server-only lib modules
    - SDK construction singletons with no business logic
    - Two-limiter sliding-window ladder with distinct keyspace prefixes
key_files:
  created:
    - lib/resend.ts
    - lib/rate-limit.ts
  modified: []
decisions:
  - process.env comments in JSDoc are acceptable; ESLint custom rule targets code not comments
  - Redis.fromEnv() reads process.env inside the SDK package — not a D-11 violation
metrics:
  duration: ~5 minutes
  completed: 2026-04-28T21:50:39Z
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 0
---

# Phase 4 Plan 03: Resend + Rate-Limit SDK Singletons Summary

Two server-only SDK construction singletons: Resend client from `env.RESEND_API_KEY` and a two-limiter Upstash sliding-window ladder (5/min + 50/day per IP).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Ship lib/resend.ts singleton | 377ba2e | lib/resend.ts (22 lines) |
| 2 | Ship lib/rate-limit.ts two-limiter ladder | a0dc815 | lib/rate-limit.ts (40 lines) |

## Outputs

### lib/resend.ts (22 lines)

- 4 lines of functional code (3 imports + 1 export), 18 lines of JSDoc comment
- Line 1: `import 'server-only'` — T-04-12 mitigation verified
- Exports single named `resend` constant: `new Resend(env.RESEND_API_KEY)`
- No helper wrappers (`createContact`, `sendWelcomeEmail`) — minimal surface per plan
- No `process.env` in code (comment-only references to document the pattern to avoid)
- Target was ~5 lines functional code — achieved (4 functional lines + JSDoc)

### lib/rate-limit.ts (40 lines)

- 8 lines of functional code, 32 lines of JSDoc comment
- Line 1: `import 'server-only'` — T-04-15 mitigation verified
- Single `Redis.fromEnv()` instance shared by both limiters
- `rateLimitPerMinute`: `Ratelimit.slidingWindow(5, '60 s')` — burst defense
- `rateLimitPerDay`: `Ratelimit.slidingWindow(50, '1 d')` — sustained-flood defense
- Distinct prefixes: `@quibly/ratelimit/min` vs `@quibly/ratelimit/day` — T-04-14 keyspace collision prevention
- `analytics` omitted (defaults false) — no `context.waitUntil(pending)` plumbing needed
- Target was ~25 lines — achieved (40 lines, mostly JSDoc)

## Verification Results

- `npm run check` (TypeScript): exit 0
- `npm run test:unit`: 31/31 tests passed (Phase 3 + Plan 01 + Plan 02 tests all green)
- `npm run lint` on both new files: exit 0 (no new errors; pre-existing errors in `eslint-rules/` are out of scope)
- `head -1 lib/resend.ts`: `import 'server-only'`
- `head -1 lib/rate-limit.ts`: `import 'server-only'`

## Deviations from Plan

None — plan executed exactly as written.

Note: The plan's template JSDoc for both files includes comments that reference `process.env` (as documentation of the pattern to avoid). These appear in `grep -c "process\\.env"` counts but are not flagged by the custom `no-raw-process-env` ESLint rule, which correctly targets code-level access only. The JSDoc comment in `lib/resend.ts` says `NEVER read process.env.RESEND_API_KEY directly here` and in `lib/rate-limit.ts` says `` `Redis.fromEnv()` reads... from process.env inside the @upstash/redis package ``. Both comments serve as inline documentation reinforcing D-11.

## Pending (Plan 05)

- T-04-16: Rate-limit failure-mode decision — if Upstash returns an error from `.limit()`, Plan 05 must document whether the action fails-closed (treat error as success: true, allow signup) or fails-open (reject). This plan ships the limiter primitives; the failure-mode decision is part of Plan 05's action body.

## Known Stubs

None. Both files are pure SDK construction singletons with no business logic or data stubs.

## Threat Flags

None. Both files implement mitigations that were already in the plan's threat register (T-04-12, T-04-13, T-04-14, T-04-15). No new threat surface introduced.

## Self-Check: PASSED

- [x] `lib/resend.ts` exists: FOUND
- [x] `lib/rate-limit.ts` exists: FOUND
- [x] Commit 377ba2e exists: FOUND (feat(04-03): ship lib/resend.ts Resend SDK singleton)
- [x] Commit a0dc815 exists: FOUND (feat(04-03): ship lib/rate-limit.ts two-limiter sliding-window ladder)
- [x] TypeScript check passes
- [x] Unit tests pass (31/31)
