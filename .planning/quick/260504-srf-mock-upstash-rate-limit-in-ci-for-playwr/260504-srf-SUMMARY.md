---
phase: 260504-srf
plan: 01
subsystem: ci / rate-limiting
tags: [ci, rate-limit, upstash, mock, playwright, env-gate]
dependency_graph:
  requires: [260504-rw4]
  provides: [upstash-mock-gate]
  affects: [lib/rate-limit.ts, .github/workflows/test.yml]
tech_stack:
  added: []
  patterns: [env-gate mock pattern (mirrors lib/resend.ts 260504-rw4)]
key_files:
  created: []
  modified:
    - lib/rate-limit.ts
    - .github/workflows/test.yml
decisions:
  - Guard Redis.fromEnv() behind isMock ternary (not inside export branches) for clean separation
  - Two separate makeMockLimiter() calls per export — independent objects, no shared references
  - Comment lines for UPSTASH_MOCK in test.yml mirror RESEND_MOCK style exactly
metrics:
  duration: 2m
  completed: 2026-05-05
---

# Phase 260504-srf Plan 01: Mock Upstash Rate Limit in CI for Playwright Summary

## One-liner

UPSTASH_MOCK env gate in lib/rate-limit.ts prevents `Redis.fromEnv()` from firing at module load in CI, unblocking 4 Playwright form tests that crashed with TLS cert-altname mismatch on test.upstash.io.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add UPSTASH_MOCK env gate to lib/rate-limit.ts | 4216ff7 | lib/rate-limit.ts |
| 2 | Add UPSTASH_MOCK to the CI Playwright env block | a7c3e9c | .github/workflows/test.yml |

## What Was Built

**Task 1 — `lib/rate-limit.ts` env gate:**

Added the same CI mock gate pattern introduced by 260504-rw4 for `lib/resend.ts`. Key changes:
- `const isMock = process.env.UPSTASH_MOCK === '1'` with ESLint disable comment matching resend.ts style
- `makeMockLimiter()` helper returns a fresh object each call with `.limit(ip)` resolving to `{ success: true, limit: 999, remaining: 999, reset: 0 }`
- `const redis = isMock ? null : Redis.fromEnv()` — guards `Redis.fromEnv()` behind the ternary so it never executes at module load when `UPSTASH_MOCK=1`
- Both `rateLimitPerMinute` and `rateLimitPerDay` use separate `makeMockLimiter()` calls (independent objects) and are cast `as unknown as Ratelimit`
- Existing JSDoc block (lines 5–26) preserved verbatim; CI mock gate JSDoc paragraph appended

**Task 2 — `.github/workflows/test.yml`:**

Added `UPSTASH_MOCK: '1'` to the `Run Playwright tests` step env block only. The `Build Next app` step is unchanged — TypeScript still validates real `@upstash/ratelimit` SDK surface so future API drift is caught at build time.

## Verification Results

- `npx tsc --noEmit`: PASSED
- `npm run lint` (eslint --max-warnings=0): PASSED
- `npm run test:unit` (vitest): 81/81 PASSED — zero regression
- `npm run build` with `UPSTASH_MOCK=1 RESEND_MOCK=1` + stubs: PASSED
- `npm run test:e2e --project=visual-and-form tests/form/` with `UPSTASH_MOCK=1 RESEND_MOCK=1`: 9/9 PASSED (includes all 4 previously-failing form tests: enter-key-submit + 3 success-state)
- YAML parses cleanly: PASSED
- `UPSTASH_MOCK` not present in Build step: CONFIRMED
- Both mock keys present only in Playwright step: CONFIRMED

## Deviations from Plan

None — plan executed exactly as written.

The plan's Task 2 verify check `grep -c "UPSTASH_MOCK" .github/workflows/test.yml` expecting 1 was based on having only the key-value line. The comment line (`# UPSTASH_MOCK=1 swaps...`) was added per the plan's instruction to mirror RESEND_MOCK style, which also has a comment + key = 2 occurrences. This is the correct and expected state. The structural check (`awk + grep | wc -l` = 2 for both mocks in Playwright step) confirms correctness.

## Threat Flags

None. This change only affects test infrastructure path (when `UPSTASH_MOCK=1`). Production deployments never set this env var; the real Redis + Ratelimit path is byte-identical to before.

## Known Stubs

None — the mock is intentional CI-only test infrastructure, not a production stub.

## Self-Check: PASSED

- lib/rate-limit.ts exists and has UPSTASH_MOCK gate: FOUND
- .github/workflows/test.yml has UPSTASH_MOCK in Playwright step: FOUND
- Task 1 commit 4216ff7 exists: FOUND
- Task 2 commit a7c3e9c exists: FOUND
