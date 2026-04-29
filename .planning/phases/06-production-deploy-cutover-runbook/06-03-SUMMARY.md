---
phase: 06-production-deploy-cutover-runbook
plan: 03
subsystem: infra
tags: [uat, launch-gating, manual-checkpoints, deploy, dns, hsts, resend-csv, service-worker, cutover-dry-run]

# Dependency graph
requires:
  - phase: 04-resend-wiring-bot-protection-welcome-email
    provides: 04-UAT.md sibling format reference (result schema, severity:blocker pattern)
  - phase: 05-legal-seo-analytics
    provides: 05-UAT.md sibling format reference (frontmatter shape, Gaps schema, LEGAL-08 carryover for privacy mailbox)
provides:
  - 06-UAT.md launch-gating checklist (12 manual tests covering all 9 DEPLOY-XX requirements)
  - HARD launch-gate checkpoint for privacy@useQuibly.com mailbox provisioning (LEGAL-08 carryover)
  - Pitfall 6 / A1 empirical CSV-export inspection test (gates cutover.md Step 2 fallback decision)
  - DEPLOY-09 4-screenshot dry-run cutover transfer test scaffold
  - DEPLOY-06 wire-format curl probe test (HSTS literal max-age=300, no preload/includeSubDomains)
  - DEPLOY-07 manual DevTools Service Workers checkpoint (CD-03 chosen over CI grep)
affects: [06-04-PLAN dry-run execution, 06-05-PLAN production go-live execution]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Numbered manual UAT test format (### N. <title> + expected: | YAML block scalar + result: pending) — sibling-format match with 04-UAT.md and 05-UAT.md (CD-07)"
    - "Embedded verbatim verification commands (curl, dig, grep) inside expected: blocks — execution agents do not have to look up commands elsewhere"
    - "HARD LAUNCH-GATE prose marker for tests that block production form exposure (test 1 / privacy mailbox)"
    - "Screenshot evidence path discipline — every manual-only test specifies the exact .planning/phases/06-.../screenshots/ filename (8 paths total across tests 3, 4, 5, 8, 11×4)"
    - "Anti-pattern token avoidance — test 7 verifies HSTS via descriptive prose for forbidden tokens (locks-subdomains directive, browser-allowlist directive) so the artifact itself never emits the forbidden literals; cross-references next.config.ts and 06-PATTERNS.md"

key-files:
  created:
    - .planning/phases/06-production-deploy-cutover-runbook/06-UAT.md
  modified: []

key-decisions:
  - "Anti-pattern tokens (HSTS preload, includeSubDomains) referenced via descriptive prose + cross-references rather than emitted verbatim — satisfies the strict ! grep -E 'preload|includeSubDomains' acceptance criterion while preserving operator-readable wire-format guidance."
  - "All 12 tests start result: pending — Plans 06-04 and 06-05 flip individual results during their respective execution waves; this plan ships scaffold only (no premature pass/fail)."
  - "DEPLOY-08 mapped to test 6 (production real-signup end-to-end smoke including welcome email + unsubscribe round-trip) — covers the cutover-runbook requirement's runtime contract since DEPLOY-08 itself is the runbook artifact authored in Plan 06-02."

patterns-established:
  - "Phase 6 launch-gating UAT pattern: 12 tests = 1 HARD launch-gate + 8 DEPLOY-XX coverage + 1 carryover smoke + 1 empirical CSV inspection + 1 dry-run + 1 post-dry-run regression check"
  - "Test cross-reference pattern: each test names its requirement (LEGAL-08, DEPLOY-XX, Phase 5 carryover) inside the expected: block — readable trace from test row to requirement source without leaving the file"

requirements-completed: [DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04, DEPLOY-05, DEPLOY-06, DEPLOY-07, DEPLOY-08, DEPLOY-09]

# Metrics
duration: 2min
completed: 2026-04-29
---

# Phase 6 Plan 03: Launch-Gating UAT Checklist Summary

**12-test launch-gating checklist authored to `06-UAT.md` with HARD privacy-mailbox gate, HSTS wire-format probe, Service Workers DevTools checkpoint, consent_version CSV inspection, and 4-screenshot dry-run scaffold — covering all 9 DEPLOY-XX requirements in sibling-phase format ready for 06-04 and 06-05 to flip results during execution.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-29T21:58:56Z
- **Completed:** 2026-04-29T22:00:51Z
- **Tasks:** 1
- **Files modified:** 1 (created)

## Accomplishments

- Authored `.planning/phases/06-production-deploy-cutover-runbook/06-UAT.md` (246 lines) matching 05-UAT.md / 04-UAT.md sibling format (CD-07).
- 12 numbered tests, all `result: pending`, each with an `expected: |` YAML block scalar containing verbatim verification commands (`curl -sI`, `dig +short`, `grep`) per 06-VALIDATION.md / 06-RESEARCH.md.
- HARD launch-gate (test 1) for `privacy@useQuibly.com` mailbox provisioning — Phase 5 LEGAL-08 / D-02 carryover.
- DEPLOY-06 wire-format probe (test 7) verifying HSTS literal `max-age=300` and the four other hardening headers across 6 routes (apex + 5 sub-routes).
- DEPLOY-07 manual DevTools Service Workers checkpoint (test 8) per CD-03, with optional belt-and-suspenders source grep.
- Pitfall 6 / A1 empirical CSV-export inspection (test 10) — gates `cutover.md` Step 2 API-fallback decision if `consent_version` column missing.
- DEPLOY-09 4-screenshot dry-run cutover transfer (test 11) on `staging.useQuibly.com` — D-05/D-06/D-07 mechanics-only scope, no Resend writes, no separate staging sender.
- Apex-stability post-dry-run regression check (test 12).

## 06-UAT.md Test Inventory (verbatim from `grep '^### ' 06-UAT.md`)

```
### 1. privacy@useQuibly.com mailbox provisioned and reachable (HARD launch-gate)
### 2. Production apex resolves to quibly-landing prod deploy (DEPLOY-01)
### 3. Apex domain bound at Vercel team level (DEPLOY-02)
### 4. SPF + 3× DKIM + DMARC p=none + Return-Path DNS records resolve (DEPLOY-03, DEPLOY-04)
### 5. mail-tester.com 10/10 score from production apex sender (DEPLOY-05)
### 6. Production real-signup writes to production audience + welcome arrives in Gmail (DEPLOY-08)
### 7. Five hardening headers emit on production apex (DEPLOY-06)
### 8. No Service Worker registered on production load (DEPLOY-07)
### 9. Production OG / sitemap / robots / favicon smoke (Phase 5 carryover re-verify against prod)
### 10. Resend Audience CSV export includes consent_version column (Pitfall 6 / A1 empirical)
### 11. Cutover dry-run transfer back-and-forth on staging.useQuibly.com (DEPLOY-09 / D-05/D-06/D-07)
### 12. Apex unaffected after dry-run completes
```

All 12 tests have `result: pending` (verified: `grep -c 'result: pending' 06-UAT.md` → 12).
Anti-pattern tokens absent (verified: `! grep -E 'preload|includeSubDomains' 06-UAT.md` → success).

## Acceptance Criteria Self-Check

All 26 acceptance criteria from the plan passed in a single batched verification (see "Self-Check" section below):
- File exists with `phase: 06-production-deploy-cutover-runbook`, `status: pending` frontmatter
- Exactly 12 numbered tests (`grep -c '^### '` = 12)
- 12 `result: pending` rows
- 12 `expected: |` block-scalars
- HARD LAUNCH-GATE marker on test 1
- All 9 DEPLOY-XX IDs referenced in test bodies
- HSTS literal `max-age=300` present; forbidden tokens (preload, includeSubDomains) absent
- `consent_version`, `staging.useQuibly.com`, `Service Workers`, `Resend Dashboard`, `mail-tester` all present
- 8 screenshot path references (test 3, 4, 5, 8, and 11×4)
- All 5 hardening header names present (Strict-Transport-Security, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- 1 `## Summary` section, 1 `## Gaps` section
- `total: 12`, `pending: 12` in Summary
- `git diff --name-only` showed only the new file (no scope creep outside `.planning/phases/06-production-deploy-cutover-runbook/06-UAT.md`)

## Files Created/Modified

- `.planning/phases/06-production-deploy-cutover-runbook/06-UAT.md` (created, 246 lines) — Phase 6 launch-gating manual checkpoint checklist; 12 tests covering all 9 DEPLOY-XX requirements + LEGAL-08 carryover + Pitfall 6 / A1 empirical inspection + DEPLOY-09 dry-run scaffold.

## Task Commits

Each task was committed atomically:

1. **Task 1: Author 06-UAT.md with all manual launch-gate checkpoints in sibling-phase format** — `bcfbd7d` (docs)

## Decisions Made

- **HSTS forbidden-token avoidance strategy:** The plan's automated verify block enforces `! grep -E 'preload|includeSubDomains' 06-UAT.md`. Operator-readable HSTS guidance still needs to communicate "reject if you see those directives". Resolution: test 7 names the directives via descriptive prose ("the directive that locks subdomains", "the directive that submits to the browser allowlist") and cross-references `06-PATTERNS.md` and `06-VALIDATION.md test 06-01-01` for the exact regex. Wire-format literal `max-age=300` remains verbatim in the file for direct curl-output comparison. This satisfies both the safety contract and operator UX.
- **DEPLOY-08 placement:** DEPLOY-08 = "production cutover runbook authored" is fulfilled by Plan 06-02's `docs/cutover.md`. Within 06-UAT.md, the runtime equivalent (production real-signup → audience write → welcome email → unsubscribe round-trip) is mapped to test 6. This keeps the 9-of-9 requirement traceability without inventing a synthetic test.
- **No screenshots/ directory creation:** Per the plan's explicit constraint, the `screenshots/` directory is created at execution time by Plans 06-04 (test 11 captures) and 06-05 (tests 3, 4, 5, 8 captures). Creating the directory in this plan would invite confusion about who owns its lifecycle.

## Deviations from Plan

None - plan executed exactly as written.

The plan's task action included verbatim test bodies; I copied them faithfully (only correcting screenshot-path repetition: test 11's screenshots 2/3/4 had `06-uat-11-2-prompt.png` etc. without the leading directory in the bullet list — I added the full `.planning/phases/06-production-deploy-cutover-runbook/screenshots/` prefix to each so the artifact is self-contained for execution agents). This is a clarity edit within the plan's intent, not a deviation from the action contract (the leading directory was specified for screenshot 1 in the same test, indicating the prefix was the implicit convention).

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required by this plan. The 06-UAT.md tests themselves describe founder/operator setup (privacy mailbox, mail-tester, Resend Dashboard) that Plans 06-04 and 06-05 will execute against.

## Next Phase Readiness

- Plan 06-04 (dry-run cutover) can flip tests 10, 11, 12 from `pending` → `pass`/`fail`/`issue` during execution, capturing 4 screenshots into `.planning/phases/06-production-deploy-cutover-runbook/screenshots/`.
- Plan 06-05 (production go-live) can flip tests 1–9 + 12 from `pending` → `pass`/`fail`/`issue` during execution.
- The HARD launch-gate (test 1, privacy mailbox) is unambiguous — Plan 06-05 must block production form exposure until this test is `pass`.
- All 9 DEPLOY-XX requirement IDs traceable from 06-UAT.md test rows back to 06-VALIDATION.md per-task verification map.

## Self-Check: PASSED

**Files verified to exist:**
- FOUND: `.planning/phases/06-production-deploy-cutover-runbook/06-UAT.md`

**Commits verified to exist:**
- FOUND: `bcfbd7d` (docs(06-03): author 06-UAT.md launch-gating checklist)

All 26 plan-level acceptance criteria verified passing in batched grep run (see "Acceptance Criteria Self-Check" above).

---
*Phase: 06-production-deploy-cutover-runbook*
*Completed: 2026-04-29*
