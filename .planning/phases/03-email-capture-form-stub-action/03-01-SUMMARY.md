---
phase: 03-email-capture-form-stub-action
plan: 01
subsystem: testing
tags: [vitest, react-testing-library, happy-dom, playwright, github-actions, ci]

# Dependency graph
requires:
  - phase: 02-static-landing-page-no-form
    provides: existing playwright.config.ts (mobile-first 320×568 baseline) + tests/visual/ specs preserved under new visual-and-form project
provides:
  - Vitest 4 + RTL 16 + happy-dom 20 action-layer test runner (green-empty, exit 0)
  - Multi-project Playwright config (visual-and-form + no-js with javaScriptEnabled: false)
  - Two parallel CI jobs ("Tests / vitest", "Tests / playwright") ready as branch-protection status checks
  - test:unit + test:unit:watch npm scripts
  - tests/setup.ts with jest-dom matchers + RTL cleanup hook
affects: [03-02-zod-schema, 03-03-server-action-stub, 03-04-form-component, 03-05-form-e2e, 03-06-no-js-progressive-enhancement, 03-07-branch-protection]

# Tech tracking
tech-stack:
  added:
    - vitest@4.1.5 (action-layer test runner)
    - "@vitejs/plugin-react@4.7.0 (React transform for Vitest)"
    - "@testing-library/react@16.3.2 (RTL v16 for React 19)"
    - "@testing-library/dom@10.4.1 (RTL v16 required peer)"
    - "@testing-library/jest-dom@6.9.1 (custom matchers)"
    - "@testing-library/user-event@14.6.1 (interaction helpers)"
    - happy-dom@20.9.0 (DOM env, faster than jsdom)
  patterns:
    - Vitest @/* alias mirrors tsconfig.json paths via path.resolve(__dirname, './') (Pitfall 7 bridge)
    - Vitest excludes Playwright dirs (tests/visual/**, tests/form/**, tests/no-js/**) to prevent cross-runner pickup
    - Playwright multi-project config — testMatch regex per project, project-level use.javaScriptEnabled for no-js
    - GitHub Actions least-privilege permissions (contents: read only) — no statuses/pull-requests write
    - Playwright browser cache keyed on @playwright/test version (not lockfile)

key-files:
  created:
    - vitest.config.ts
    - tests/setup.ts
    - .github/workflows/test.yml
  modified:
    - package.json (7 devDeps + 2 scripts)
    - package-lock.json
    - playwright.config.ts (multi-project)

key-decisions:
  - "Used --passWithNoTests in test:unit to satisfy must_haves green-empty Wave 0 baseline (vitest 4 default behavior changed; exits 1 on empty include match)"
  - "Two CI jobs (vitest + playwright) named under 'Tests' workflow → status check names 'Tests / vitest' and 'Tests / playwright' for D-18 branch protection"
  - "Playwright browsers cached by @playwright/test version (RESEARCH J5 rationale — version determines binary, not lockfile)"

patterns-established:
  - "Pattern: Vitest config alias bridge — `'@': path.resolve(__dirname, './')` MUST mirror tsconfig.json paths exactly (use absolute resolve, not relative './')"
  - "Pattern: dual test runner separation — Vitest for action layer (tests/unit/), Playwright for e2e/visual/no-js layers (tests/visual|form|no-js/), exclude lists prevent cross-runner pickup"
  - "Pattern: GitHub Actions least-privilege — Lighthouse-style workflows that don't post comments/statuses should drop pull-requests/statuses write perms"

requirements-completed: []

# Metrics
duration: 4min
completed: 2026-04-28
---

# Phase 03 Plan 01: Test infrastructure Summary

**Vitest 4 + RTL 16 + happy-dom 20 action-layer runner installed; Playwright config extended to multi-project (visual-and-form + no-js with javaScriptEnabled: false); two parallel CI jobs ready as D-18 status checks ("Tests / vitest", "Tests / playwright").**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-28T14:06:27Z
- **Completed:** 2026-04-28T14:10:44Z
- **Tasks:** 5
- **Files modified:** 5 (3 created, 2 modified, plus package-lock.json)

## Accomplishments
- Wave 0 green-empty Vitest baseline: `npm run test:unit` exits 0 with "No test files found, exiting with code 0"
- Vitest config bridges `@/*` alias to tsconfig.json paths via `path.resolve(__dirname, './')` — Pitfall 7 mitigation in place
- Playwright config now has two projects: `visual-and-form` (Phase 2 specs preserved) and `no-js` (project-level `javaScriptEnabled: false` for D-16 progressive enhancement testing)
- CI workflow `Tests` defines two parallel jobs that produce status check names **"Tests / vitest"** and **"Tests / playwright"** — the load-bearing strings for Plan 03-07's branch-protection UI checkpoint
- Playwright browser cache keyed on `@playwright/test` version (not lockfile) per RESEARCH J5
- Failure-path Playwright report artifact upload with 7-day retention
- Lighthouse workflow file (`.github/workflows/lighthouse.yml`) untouched — verified via `git status`

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Vitest + RTL + happy-dom devDependencies** — `4b14d7c` (chore)
2. **Task 2: Write vitest.config.ts and tests/setup.ts** — `449f185` (feat)
3. **Task 3: Add test:unit + test:unit:watch scripts** — `45efb3f` (feat)
4. **Task 4: Extend playwright.config.ts with multi-project setup** — `05ee50d` (feat)
5. **Task 5: Create .github/workflows/test.yml — two parallel jobs** — `6c1b495` (feat)

## Files Created/Modified

**Created:**
- `vitest.config.ts` — happy-dom env, `@/*` alias mirroring tsconfig, segregated include/exclude
- `tests/setup.ts` — `@testing-library/jest-dom/vitest` matchers + RTL cleanup hook
- `.github/workflows/test.yml` — two parallel CI jobs (`vitest` + `playwright`), least-privilege perms

**Modified:**
- `package.json` — added 7 devDependencies, added `test:unit` + `test:unit:watch` scripts
- `package-lock.json` — npm resolution updates (1119 packages added)
- `playwright.config.ts` — `testDir: "./tests"`, two `projects` (`visual-and-form` + `no-js`)

## Resolved Versions (from `npm ls`)

| Package | Resolved |
|---------|----------|
| vitest | 4.1.5 |
| @vitejs/plugin-react | 4.7.0 |
| @testing-library/react | 16.3.2 |
| @testing-library/dom | 10.4.1 |
| @testing-library/jest-dom | 6.9.1 |
| @testing-library/user-event | 14.6.1 |
| happy-dom | 20.9.0 |

All seven landed in `devDependencies` only — `dependencies` was not modified, so Phase 3 ships zero new runtime deps (aligned with RESEARCH §Core).

## Status Check Names for Plan 03-07

The CI workflow `name: Tests` plus job names `vitest` and `playwright` produce the following GitHub status check names:

- **`Tests / vitest`** — required for D-18 branch protection
- **`Tests / playwright`** — required for D-18 branch protection

These are the exact strings to enter in GitHub repo settings → Branches → Branch protection rule for `main` → "Require status checks to pass before merging" during Plan 03-07's manual UI checkpoint.

## Decisions Made

1. **`--passWithNoTests` flag added to `test:unit` script** — vitest 4 changed default behavior: an empty `include` match now exits with code 1, breaking the must_haves truth statement "exits 0 with no specs (Wave 0 baseline)". Adding `--passWithNoTests` is the canonical fix and is harmless once Phase 3 specs land in later plans (real failures still exit non-zero). Chosen over relaxing the must_haves contract because the green-empty baseline is the load-bearing CI signal for Wave 0.

2. **Followed plan verbatim everywhere else** — vitest.config.ts, tests/setup.ts, playwright.config.ts contents, and test.yml job structure all match the plan's verbatim specifications.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Added `--passWithNoTests` to `test:unit` script**
- **Found during:** Task 3 verification
- **Issue:** Plan specified `"test:unit": "vitest run"` and acceptance criteria required exit 0 with "No test files found, exiting with code 0". In vitest 4.1.5 (the installed version), running with no matching include patterns produces exit code 1 by default — directly contradicting must_haves truth #1 ("`npm run test:unit` runs Vitest in run-mode (not watch) and exits 0 with no specs (Wave 0 baseline)"). The plan was authored against earlier vitest behavior.
- **Fix:** Added `--passWithNoTests` flag: `"test:unit": "vitest run --passWithNoTests"`. This is vitest's canonical mechanism for "no specs is success" — once real specs land (Plans 03-02+), the flag becomes a no-op for non-empty test suites; failures still propagate non-zero exit codes correctly.
- **Files modified:** `package.json`
- **Verification:** Re-ran `npm run test:unit`; exit code 0; output reads `No test files found, exiting with code 0` (matches plan acceptance criteria literally).
- **Committed in:** `45efb3f` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Single deviation required to satisfy must_haves truth #1 in vitest 4. No scope creep, no architectural change. Wave 0 green-empty baseline now signals "no failures" correctly across Phase 3.

## Issues Encountered

- npm install reported 7 vulnerabilities (3 low, 3 moderate, 1 high) and several deprecation warnings (`inflight`, `rimraf` < 4, `glob` 7, `node-domexception`). These are transitive dependencies of test toolchain packages — not directly addressable by us, and not in the surface this plan modifies. Defer triage to a follow-up; documenting here for visibility, not blocking plan completion.

## Threat Flags

None — Plan 01 is pure infrastructure, ships no production code surface. Threat register entries (T-03-INFRA-01..03) are all `accept` dispositions per the plan's threat_model.

## User Setup Required

None — no external service configuration required. Plan 03-07 will surface the manual GitHub UI checkpoint to wire `Tests / vitest` and `Tests / playwright` into branch protection on `main`.

## Next Phase Readiness

- ✅ Vitest action-layer test runner ready for Plan 03-02 (Zod schema unit tests)
- ✅ Playwright `tests/form/` directory will be discovered by `visual-and-form` project once specs land in Plans 03-04 / 03-05
- ✅ Playwright `tests/no-js/` directory ready for Plan 03-06 progressive-enhancement spec
- ✅ CI workflow ready; status check names locked for Plan 03-07 branch-protection checkpoint
- ⚠️ Pre-existing transitive dep vulnerabilities surfaced during install — not blocking, recommend running `npm audit` review before Phase 4 Resend integration touches new server-side deps

## Self-Check

**1. Files exist:**
- `vitest.config.ts` — FOUND
- `tests/setup.ts` — FOUND
- `.github/workflows/test.yml` — FOUND
- `playwright.config.ts` modified — FOUND
- `package.json` modified — FOUND

**2. Commits exist:**
- `4b14d7c` (Task 1) — FOUND in git log
- `449f185` (Task 2) — FOUND in git log
- `45efb3f` (Task 3) — FOUND in git log
- `05ee50d` (Task 4) — FOUND in git log
- `6c1b495` (Task 5) — FOUND in git log

**Self-Check: PASSED**

---
*Phase: 03-email-capture-form-stub-action*
*Completed: 2026-04-28*
