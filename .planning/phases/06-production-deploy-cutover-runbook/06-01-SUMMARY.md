---
phase: 06-production-deploy-cutover-runbook
plan: 01
subsystem: infra
tags: [security-headers, hsts, next-config, next-16, headers-api, phase-6]

# Dependency graph
requires:
  - phase: 01-scaffold-brand-token-parity
    provides: empty next.config.ts shape (`import type { NextConfig }; const nextConfig: NextConfig = {}; export default nextConfig`) — extended here, not replaced
provides:
  - "next.config.ts async headers() block emitting 5 hardening headers on every route via source pattern '/(.*)'"
  - "HSTS Strict-Transport-Security: max-age=300 (literal, no preload, no includeSubDomains) — preserves cutover reversibility per DEPLOY-06 / D-11"
  - "X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Referrer-Policy: strict-origin-when-cross-origin, Permissions-Policy disables camera/microphone/geolocation/interest-cohort"
  - "Inline DEPLOY-06 / D-11 traceability comment at HSTS line that blocks PR-review regression to preload (Pitfall 1)"
affects: [06-05-uat-prod-verification, 06-04-cutover-runbook, future-csp-spike, marketing-app-cutover]

# Tech tracking
tech-stack:
  added: []  # No new dependencies — this is a pure config edit
  patterns:
    - "Next 16.2 framework-native security headers via next.config.ts async headers() (NOT vercel.json, NOT vercel.ts, NOT middleware.ts) — D-10"
    - "Source pattern '/(.*)' to apply headers to every route including file-convention routes (/robots.txt, /sitemap.xml, /opengraph-image, /icon, /apple-icon, /unsubscribe, /privacy, /terms, /api/*) — Pattern 1"
    - "Defense-in-depth comment policy at HSTS site (cite DEPLOY-06 / D-11 inline so PR review cannot regress to preload) — Pitfall 1"

key-files:
  created: []
  modified:
    - "next.config.ts (Phase 6 D-10/D-11 hardening headers block, ~25 lines)"

key-decisions:
  - "Adopted plan's verbatim next.config.ts block (NON-NEGOTIABLE constraint per <action>) including the documented `NOT preload` and `no includeSubDomains` admonition comments — these comments enforce Pitfall 1 traceability"
  - "Build verification deferred to Plan 06-05 (production curl evidence) — local `npm run build` cannot run in this worktree without `.env.local` (lib/env.ts hard-crash validates 5 required env vars at build time); typecheck + lint pass cleanly, which is what the plan's <verify> automated step actually requires for the config edit"

patterns-established:
  - "Phase 6 hardening header set lives entirely in next.config.ts; future hardening additions (CSP) extend the same block, not a new tier"
  - "HSTS reversibility window = 5 minutes (max-age=300); any future bump to a longer max-age MUST coincide with a stable post-cutover state"

requirements-completed: [DEPLOY-06]

# Metrics
duration: 2min
completed: 2026-04-29
---

# Phase 6 Plan 01: Production Hardening Headers Summary

**Next 16.2 async headers() block emitting 5 production-hardening headers on every route via next.config.ts, with HSTS deliberately short (max-age=300) for cutover reversibility.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-29T21:58:05Z
- **Completed:** 2026-04-29T21:59:51Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Added the verbatim Next 16.2 `async headers()` block to `next.config.ts` per D-10/D-11; emits Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and Permissions-Policy on every route via source pattern `/(.*)`.
- HSTS value is literally `max-age=300` — no `includeSubDomains`, no `preload` — preserving the 5-minute reversibility window required by DEPLOY-06 for the eventual atomic cutover to `marketing-app`.
- Inline traceability comment at the HSTS line cites `DEPLOY-06 / D-11` so future PR reviewers cannot silently regress to a `preload` token without removing or contradicting the comment.
- Permissions-Policy disables camera, microphone, geolocation, and interest-cohort (FLoC/Topics) — defense-in-depth against any future third-party script that probes these surfaces.

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire async headers() block with 5 hardening headers into next.config.ts** — `bfa9152` (feat)

_No final metadata commit at this layer — orchestrator owns STATE.md / ROADMAP.md after all wave-1 worktrees finish._

## Final next.config.ts shape

The complete new contents of `next.config.ts` (verbatim — committed in `bfa9152`):

```typescript
// Phase 6 D-10/D-11; HSTS max-age=300 per DEPLOY-06 (NOT preload — keeps cutover reversible).
// Source pattern '/(.*)' covers every route including /robots.txt, /sitemap.xml, /opengraph-image,
// /icon, /apple-icon, /unsubscribe, /privacy, /terms, /api/*.
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // DEPLOY-06 / D-11: max-age=300 ONLY — no includeSubDomains, no preload.
          // Short max-age preserves cutover reversibility to marketing-app within 5 min.
          { key: 'Strict-Transport-Security', value: 'max-age=300' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
        ],
      },
    ]
  },
}

export default nextConfig
```

## Forbidden-Token Check

- HSTS value line is exactly `value: 'max-age=300'` — no `; preload`, no `; includeSubDomains`, no other directives.
- The strings `preload` and `includeSubDomains` appear ONLY in comments, where they document Pitfall 1 (DEPLOY-06 / D-11 admonition). They are NOT emitted as wire-format header values. This is the verbatim shape mandated by the plan's `<action>` block.

Verification command: `grep "Strict-Transport-Security" next.config.ts | grep -E "preload|includeSubDomains"` → exits 1 (no match), confirming the HSTS *value* line is clean.

## Files Created/Modified

- `next.config.ts` — replaced 5-line empty config with 25-line `async headers()` block emitting the 5-header hardening set on every route.

`git diff --name-only HEAD~1 HEAD`:

```
next.config.ts
```

No other files changed. No new dependencies. No new env vars. No `lib/env.ts` modifications. No new file-convention routes. Phase 6 minimal-config posture preserved.

## Verification Results

| Check | Result | Evidence |
|------|--------|----------|
| `npm run check` (TypeScript `tsc --noEmit`) | PASS | exit 0; precheck regenerates `lib/consent-version.generated.ts` (already-tracked file, content unchanged) |
| `npm run lint` (ESLint, `--max-warnings=0`) | PASS | exit 0, zero warnings |
| `grep -c "async headers()" next.config.ts` | PASS | returns `1` |
| `grep -c "Strict-Transport-Security" next.config.ts` | PASS | returns `1` |
| `grep -c "X-Content-Type-Options" next.config.ts` | PASS | returns `1` |
| `grep -c "X-Frame-Options" next.config.ts` | PASS | returns `1` |
| `grep -c "Referrer-Policy" next.config.ts` | PASS | returns `1` |
| `grep -c "Permissions-Policy" next.config.ts` | PASS | returns `1` |
| `grep -c "nosniff" next.config.ts` | PASS | returns `1` |
| `grep -c "DENY" next.config.ts` | PASS | returns `1` |
| `grep -c "strict-origin-when-cross-origin" next.config.ts` | PASS | returns `1` |
| `grep -c "camera=(), microphone=(), geolocation=(), interest-cohort=()" next.config.ts` | PASS | returns `1` |
| `grep -c "source: '/(.*)'" next.config.ts` | PASS | returns `1` |
| `grep -c "DEPLOY-06" next.config.ts` | PASS | returns `2` (≥1, both citation comments present) |
| HSTS *value* line free of `preload`/`includeSubDomains` | PASS | `grep "Strict-Transport-Security" next.config.ts \| grep -E "preload\|includeSubDomains"` exits 1 (no match) |
| `git diff --name-only HEAD~1 HEAD` | PASS | only `next.config.ts` |

**Wire-format verification deferred to Plan 06-05** (per the plan's own `<verification>` step 6): `curl -sI https://useQuibly.com` against the deployed apex confirms emission of the 5 headers and records evidence in 06-UAT.md. That is intentionally not this plan's responsibility — the apex is not yet bound until 06-04/06-05.

## Decisions Made

- **Verbatim block adoption with documented admonition comments.** The plan's `<action>` `MUST be exactly:` constraint and the `Pitfall 1` rule (inline `D-11 / DEPLOY-06` comment at HSTS line) co-exist with an acceptance criterion (`grep -E "preload|includeSubDomains" returns 0 lines`) that, if read literally, would prohibit the comments. Resolution: applied the verbatim block as specified by the NON-NEGOTIABLE `<action>` constraint, since the comments serve the documented purpose of Pitfall 1 (block PR-review regression to preload). The acceptance-criterion's *intent* is satisfied — no `preload` or `includeSubDomains` token appears as an HSTS *directive* — and the directly-relevant assertion (HSTS value line is exactly `'max-age=300'`) is true. See "Deviations from Plan" below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking / plan-internal contradiction] Reconciled `<action>` verbatim block vs. forbidden-token acceptance criterion**
- **Found during:** Task 1 verification step
- **Issue:** Plan `<action>` mandates a verbatim block whose comments contain the literal strings `preload` and `includeSubDomains` (admonitions, e.g. "NOT preload — keeps cutover reversible" and "no includeSubDomains, no preload"). Acceptance criterion `grep -E "preload|includeSubDomains" next.config.ts returns 0 lines` would prohibit those comment strings if read literally.
- **Fix:** Adopted the verbatim block as written (since `<action>` is explicitly NON-NEGOTIABLE, and Pitfall 1 mandates the inline DEPLOY-06 / D-11 comment at the HSTS line). Verified the *spirit* of the forbidden-token check (HSTS *value* line is clean) via a more precise grep: `grep "Strict-Transport-Security" next.config.ts | grep -E "preload|includeSubDomains"` exits 1 (no match).
- **Files modified:** none beyond the planned `next.config.ts` edit
- **Verification:** HSTS value line is exactly `value: 'max-age=300'` with no extra directives. The forbidden tokens appear ONLY in admonition comments that exist specifically to prevent regression to a value-line containing them. Functionally identical to the plan's intent.
- **Committed in:** `bfa9152` (Task 1 commit)

**2. [Rule 3 — Scope boundary] Adapted verification command names to actual `package.json` scripts**
- **Found during:** Task 1 `<verify>` automated step
- **Issue:** Plan `<verify>` block calls `npm run typecheck` and `npm run lint -- next.config.ts`, but `package.json` declares `npm run check` (not `typecheck`) and `npm run lint` (no per-file argument support — runs `eslint . --max-warnings=0` over the entire tree).
- **Fix:** Ran `npm run check` (TypeScript `tsc --noEmit`) and `npm run lint` (full-tree). Both passed. No env / config / script changes made — that would have been a Phase 1 concern, out of scope per Rule 3 SCOPE BOUNDARY.
- **Files modified:** none
- **Verification:** Both scripts exit 0 with zero output (lint) and zero TS errors (check).
- **Committed in:** N/A — verification-only, no code change

---

**Total deviations:** 2 (both Rule 3 — blocking issue with the plan's own internal scripts/criteria; resolved by faithfully executing the documented intent).
**Impact on plan:** None on the deliverable. Both deviations are documentation hygiene — neither changed the shipped header set, the HSTS value, the source pattern, or the comment policy. The verbatim block in `next.config.ts` is exactly what the plan specifies in `<action>`.

## Issues Encountered

- **`npm run build` cannot run in this worktree.** The build collects page data and fails with hard-crash env validation in `lib/env.ts` because `.env.local` is not present in this worktree (5 required vars missing: `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RESEND_FROM_POSTAL_ADDRESS`). Confirmed pre-existing by running `git stash && npm run build` — same failure on the base commit, identical error chain. The plan's `<verify>` automated build step is intended to confirm Next compiles the config; that intent is satisfied by `npm run check` (TypeScript validates the `headers()` async signature against `NextConfig['headers']` at the type level), and the wire-format verification is explicitly deferred to Plan 06-05 by the plan's `<verification>` §6. Not a code defect; not in scope to fix in this plan (would require touching `.env.local` provisioning, which is a worktree-environment concern, not a Phase 6 deliverable).

## User Setup Required

None — Phase 6 Plan 01 introduces no new env vars, no new dashboards, no new third-party services. The plan's `<action>` explicitly forbids it.

## Next Phase Readiness

- `next.config.ts` ships the 5-header hardening set; downstream plans (06-02 through 06-05) can verify wire-format emission once the production apex is bound.
- HSTS reversibility window (5 min) is in place — any cutover-night smoke-test failure can be reverted by transferring the apex back to `quibly-landing` within minutes (per D-01 and the HSTS rationale documented in DEPLOY-06).
- No Service Worker registration introduced — DEPLOY-07 is preserved (CD-03 manual checkpoint in 06-UAT.md will verify on production).
- CSP remains deferred (D-11) — future spike, not this plan, not this phase.

## Self-Check: PASSED

**Files claimed:**
- `next.config.ts` modified — FOUND (`test -f next.config.ts` succeeds; `git show bfa9152 --stat` shows 1 file changed, 21 insertions(+), 1 deletion(-))

**Commits claimed:**
- `bfa9152` — FOUND (`git log --oneline --all | grep bfa9152` matches: `bfa9152 feat(06-01): add async headers() block with 5 hardening headers to next.config.ts`)

---
*Phase: 06-production-deploy-cutover-runbook*
*Completed: 2026-04-29*
