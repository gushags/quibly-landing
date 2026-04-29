---
phase: 05-legal-seo-analytics
plan: 03
subsystem: analytics
tags: [analytics, vercel, cookieless, speed-insights, server-only, playwright, vitest, denylist]

# Dependency graph
requires:
  - phase: 05-legal-seo-analytics
    plan: 02
    provides: "app/layout.tsx with extended metadata (Plan 02 body untouched; Plan 03 inserts Analytics/SpeedInsights)"
  - phase: 04-resend-wiring-bot-protection-welcome-email
    provides: "lib/analytics.ts console.log shim + all 5 call sites (waitlist_signup, signup_rejected, welcome_email_send_error, contact_bounced, contact_complained)"
  - phase: 01-scaffold-brand-token-parity
    provides: "import 'server-only' guard pattern, lib/env.ts, ESLint no-raw-process-env rule"

provides:
  - "lib/analytics.ts — server-side track() wrapper routing to @vercel/analytics/server; signature + TrackEvent union locked"
  - "app/layout.tsx (MODIFY) — <Analytics /> + <SpeedInsights /> mounted as last two children of <body>"
  - "scripts/check-no-trackers.mjs — ANLY-06 denylist guard; 22+ prohibited tracker names; exits 1 on violation"
  - "tests/unit/analytics.test.ts — 3 Vitest tests mocking @vercel/analytics/server (ANLY-03)"
  - "tests/analytics.spec.ts — 2 Playwright e2e tests for ANLY-01 + ANLY-02 mount checks"
  - "package.json (MODIFY) — @vercel/analytics ^1 + @vercel/speed-insights ^1 + check:no-trackers script"

affects:
  - "All Server Action + Route Handler call sites — track() now routes to Vercel Analytics instead of console.log"
  - "Phase 6 production deploy — ANLY-01..06 satisfied; custom events surface in Vercel Analytics dashboard post-deploy"
  - "Cookie compliance — Analytics + SpeedInsights are cookieless (confirmed by Vercel docs + RESEARCH Q1)"

# Tech tracking
tech-stack:
  added:
    - "@vercel/analytics ^1 (v1.6.1 resolved) — server track() + <Analytics /> Next.js client mount"
    - "@vercel/speed-insights ^1 (v1.3.1 resolved) — <SpeedInsights /> Next.js client mount"
  patterns:
    - "Server-side track(): import { track as vercelTrack } from '@vercel/analytics/server'; await vercelTrack(event, properties)"
    - "Layout mount: import from '@vercel/analytics/next' and '@vercel/speed-insights/next' (NOT /react — Pitfall 2)"
    - "ANLY-06 denylist guard: node script reading package.json deps, exits 1 on prohibited tracker"
    - "Vitest mock: vi.mock('@vercel/analytics/server', () => ({ track: vi.fn() })) for unit testing"
    - "AllowedPropertyValues cast: properties as Record<string, string|number|boolean|null|undefined> for TS compatibility"

key-files:
  created:
    - "scripts/check-no-trackers.mjs"
    - "tests/unit/analytics.test.ts"
    - "tests/analytics.spec.ts"
  modified:
    - "lib/analytics.ts"
    - "app/layout.tsx"
    - "package.json"
    - "package-lock.json"

key-decisions:
  - "Cast Record<string,unknown> to Record<string,AllowedPropertyValues> for @vercel/analytics/server type compat — keeps existing call-site signatures unchanged"
  - "@vercel/analytics ^1 pinned per CLAUDE.md spec (v1.6.1 resolved); v2 deferred post-launch if ad-blocker interference measured"
  - "npm install --legacy-peer-deps required — @vercel/analytics ^1 has optional @sveltejs/kit peer dep conflict with vite@8"
  - "Denylist uses simple string matching (dep === banned || startsWith(banned+'/') || endsWith('/'+banned)) — covers scoped packages"

requirements-completed:
  - ANLY-01
  - ANLY-02
  - ANLY-03
  - ANLY-04
  - ANLY-05
  - ANLY-06

# Metrics
duration: ~8min
completed: 2026-04-29
---

# Phase 05 Plan 03: Cookieless Analytics Surface Summary

**@vercel/analytics + @vercel/speed-insights wired: server-side track() body-swapped, both components mounted in layout, denylist guard active — all 17 Phase 5 e2e tests green**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-29T17:00:00Z
- **Completed:** 2026-04-29T17:08:15Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Installed `@vercel/analytics@^1` + `@vercel/speed-insights@^1` (resolved v1.6.1 / v1.3.1) via `npm install --legacy-peer-deps` (peer dep conflict with @sveltejs/kit optional dep)
- Swapped `lib/analytics.ts` body: replaced `console.log` shim with `await vercelTrack(event, properties)` from `@vercel/analytics/server`; signature + TrackEvent union preserved exactly; type cast added for `Record<string,unknown>` → `Record<string,AllowedPropertyValues>` TS compatibility
- Mounted `<Analytics />` and `<SpeedInsights />` in `app/layout.tsx` body (after `<Toaster />`), using `@vercel/analytics/next` and `@vercel/speed-insights/next` import paths (Pitfall 2 mitigation)
- Created `scripts/check-no-trackers.mjs` — ANLY-06 enforcement; 22+ prohibited tracker package names; runs via `npm run check:no-trackers`; exits 0 (clean repo confirmed)
- All Phase 5 e2e tests green: 7 legal + 8 SEO + 2 analytics = 17 total; Phase 4 unit regressions: 33/33 green

## Task Commits

Each task was committed atomically:

1. **Task 1: Wave 0 — deps, denylist guard, RED test scaffolds** - `3559a16` (test)
2. **Task 2: Swap lib/analytics.ts body to @vercel/analytics/server** - `fb553f8` (feat)
3. **Task 3: Mount Analytics + SpeedInsights in app/layout.tsx** - `a148d76` (feat)

## Files Created/Modified

- `scripts/check-no-trackers.mjs` — ANLY-06 denylist guard: 22+ prohibited tracker names, exits 1 on violation, chmod +x
- `tests/unit/analytics.test.ts` — 3 Vitest unit tests mocking @vercel/analytics/server; 3/3 green (ANLY-03)
- `tests/analytics.spec.ts` — 2 Playwright e2e tests: analytics-mount (ANLY-01) + speed-insights-mount (ANLY-02); 2/2 green
- `lib/analytics.ts` — body swapped: import vercelTrack from @vercel/analytics/server; import 'server-only' preserved line 1; TrackEvent union unchanged; type cast for TS compat
- `app/layout.tsx` — imports Analytics + SpeedInsights from /next paths; both mounted before </body>; Plan 02 metadata untouched
- `package.json` — @vercel/analytics ^1 + @vercel/speed-insights ^1 in dependencies; check:no-trackers script added
- `package-lock.json` — lockfile updated with new packages

## Decisions Made

- `npm install --legacy-peer-deps` used because `@vercel/analytics@^1` has an optional `@sveltejs/kit` peer dependency whose lockfile referenced `vite@8` conflicts with npm's peer resolution
- Type cast (`as Record<string, string | number | boolean | null | undefined>`) added at the `vercelTrack()` call site because the exported wrapper uses the wider `Record<string, unknown>` to preserve existing call-site compatibility; all actual call sites pass only primitive values
- `^1.6.1` spec returned by npm was changed to `^1` in package.json to match CLAUDE.md spec (`^1.x`) — the resolved version is still v1.6.1

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript type incompatibility between track() wrapper and @vercel/analytics/server**
- **Found during:** Task 2 (first `tsc --noEmit` run after body swap)
- **Issue:** `@vercel/analytics/server` `track()` accepts `Record<string, AllowedPropertyValues>` where `AllowedPropertyValues = string | number | boolean | null | undefined`. The wrapper `track()` accepts `Record<string, unknown>` which is a superset — TypeScript rejects the implicit narrowing.
- **Fix:** Added an inline cast `properties as Record<string, string | number | boolean | null | undefined>` at the `vercelTrack()` call site. The wrapper signature is preserved unchanged (all existing call sites continue to compile). The cast is safe because all actual call sites (`waitlist_signup`, `welcome_email_send_error`, etc.) pass only string or boolean values.
- **Files modified:** `lib/analytics.ts`
- **Verification:** `npx tsc --noEmit` exits 0 after fix
- **Committed in:** `fb553f8` (Task 2 commit)

**2. [Rule 3 - Blocking] npm install failed without --legacy-peer-deps**
- **Found during:** Task 1 (first install attempt)
- **Issue:** `npm install '@vercel/analytics@^1'` fails with peer dependency conflict: `@vercel/analytics@1.6.1` has an optional `@sveltejs/kit@^1 || ^2` peer dependency, which requires `vite@^8.0.0-beta.7`, conflicting with npm's lockfile
- **Fix:** Added `--legacy-peer-deps` flag to the install command. The conflict is from an optional peer dependency on a Svelte framework that is not used in this project.
- **Files modified:** `package.json`, `package-lock.json`
- **Committed in:** `3559a16` (Task 1 commit)

**Total deviations:** 2 auto-fixed (1 Rule 1 bug, 1 Rule 3 blocking)
**Impact on plan:** Both fixes required for correctness. No scope creep.

## Known Stubs

None. All plan outputs are fully wired:
- `track()` body routes to real Vercel Analytics (no console.log shim)
- Both `<Analytics />` and `<SpeedInsights />` components mounted in layout
- Denylist guard operational (`npm run check:no-trackers` exits 0)

## Threat Flags

No new threat flags. The threat model's T-05-03 and T-05-04 mitigations are now implemented:
- T-05-03: Vitest unit test asserts vercelTrack() receives exact arguments; signature locked; server-only guard on line 1
- T-05-04: scripts/check-no-trackers.mjs operational and included in npm scripts

## Issues Encountered

- `@vercel/analytics@^1` installs with `--legacy-peer-deps` due to optional @sveltejs/kit peer dep chain
- `.env.local` not present in worktree — copied from main repo for `npm run build` verification

## User Setup Required

None for this plan. All code changes are self-contained. Post-deploy verification:
1. Navigate to Vercel Analytics dashboard → Custom Events → confirm `waitlist_signup` events appear after first signup
2. Open incognito window → DevTools → Application → Cookies → confirm 0 cookies (ANLY-05 manual UAT)

## Next Phase Readiness

- Phase 5 is complete: LEGAL-01..08, SEO-01..08, ANLY-01..06 all satisfied
- All 17 Phase 5 e2e tests green; 76+ unit tests green (no regressions)
- `npm run build` exits 0; TypeScript strict: 0 errors
- Cookieless commitment verifiable via DevTools incognito check (ANLY-05)
- Custom events (`waitlist_signup`, `welcome_email_send_error`, etc.) will surface in Vercel Analytics dashboard on first production deploy

---
*Phase: 05-legal-seo-analytics*
*Completed: 2026-04-29*

## Self-Check: PASSED

Files verified:
- FOUND: scripts/check-no-trackers.mjs
- FOUND: tests/unit/analytics.test.ts
- FOUND: tests/analytics.spec.ts
- FOUND: lib/analytics.ts
- FOUND: app/layout.tsx
- FOUND: .planning/phases/05-legal-seo-analytics/05-03-SUMMARY.md

Commits verified:
- FOUND: 3559a16 (test: Wave 0 — deps + scaffolds)
- FOUND: fb553f8 (feat: analytics.ts body swap)
- FOUND: a148d76 (feat: layout.tsx Analytics + SpeedInsights mount)

Tests verified:
- 3/3 analytics.test.ts Vitest tests PASSED (ANLY-03)
- 2/2 analytics.spec.ts Playwright tests PASSED (ANLY-01 + ANLY-02)
- 33/33 Phase 4 regression tests PASSED (join-waitlist + webhook)
- 17/17 Phase 5 e2e tests PASSED (legal + seo + analytics)
