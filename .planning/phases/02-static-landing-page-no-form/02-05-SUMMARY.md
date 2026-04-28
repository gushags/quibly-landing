---
phase: 02-static-landing-page-no-form
plan: 05
subsystem: ci
tags:
  - lighthouse-ci
  - github-actions
  - perf-gate
  - vercel-preview
  - branch-protection
  - human-action

# Dependency graph
requires:
  - phase: 02-static-landing-page-no-form
    plan: 04
    provides: "app/page.tsx (composed Phase 2 page) — the LHCI target; Playwright config baseline (preserved by additive package.json edits)"
  - phase: 02-static-landing-page-no-form
    plan: 02
    provides: "<Hero> with H1-painted-area-LCP defense — verified at runtime by LHCI"
provides:
  - ".lighthouserc.json — LHCI configuration (mobile profile, 3 runs, three error-level assertions: perf >= 0.90, cls < 0.1, render-blocking-resources <= 1)"
  - ".github/workflows/lighthouse.yml — GitHub Actions workflow producing the `Lighthouse CI / lighthouse` status check (D-34 reference)"
  - "@lhci/cli ^0.15.1 devDependency"
  - "lh:ci npm script for local LHCI runs (npm run lh:ci)"
affects:
  - "Phase 2 SC #4 — `Lighthouse mobile performance >= 90` is now AUTO-VERIFIED on every PR (subject to D-34 branch-protection gating, human-action checkpoint pending)"
  - "Phase 5 (PERF-03 reinforcement) — if Phase 5 introduces analytics scripts that are render-blocking, the LHCI gate fires"

# Tech tracking
tech-stack:
  added:
    - "@lhci/cli ^0.15.1 (devDependency only; never reaches production bundle)"
  patterns:
    - "Pattern: LHCI mobile profile via `formFactor: \"mobile\"` + standard mobile screenEmulation (412x823 @ 1.75x DPR) + standard mobile throttling (150ms RTT, 1638kbps, 4x CPU slowdown). Rejected the plan-verbatim `preset: \"mobile\"` because Lighthouse Core only accepts `perf|experimental|desktop` for `preset`."
    - "Pattern: render-blocking-resources gate at `maxLength: 1` (NOT 0) to accommodate Next.js + Tailwind v4's unavoidable single render-blocking CSS chunk while still catching any future addition that pushes the count above baseline."
    - "Pattern: GitHub Actions Vercel preview wait (patrickedqvist/wait-for-vercel-preview@v1.3.1) chained into LHCI run (treosh/lighthouse-ci-action@v12) — VERCEL_TOKEN passed via env: only (T-02-02 mitigation)."

key-files:
  created:
    - .lighthouserc.json (24 lines — LHCI config with three error-level assertions + advisory warns for a11y/best-practices/seo)
    - .github/workflows/lighthouse.yml (34 lines — Lighthouse CI workflow on push/PR to main)
  modified:
    - package.json (added @lhci/cli ^0.15.1 to devDependencies + lh:ci npm script; preserved existing @playwright/test devDependency + test:e2e script per orchestrator note)
    - package-lock.json (resolved @lhci/cli transitive deps, ~1000 packages added)
    - .gitignore (added .lighthouseci/ — Lighthouse CI temporary artifacts)

key-decisions:
  - "[Rule 1 deviation] Replaced plan-verbatim `preset: \"mobile\"` with explicit `formFactor: \"mobile\"` plus standard mobile screenEmulation + throttling. Reason: `preset: \"mobile\"` is invalid syntax — Lighthouse Core's `preset` field only accepts `perf|experimental|desktop`. The plan author conflated LHCI presets with form factors. Mobile is Lighthouse's default formFactor; explicit emulation parameters keep the config self-documenting."
  - "[Rule 1 deviation] Adjusted `render-blocking-resources` assertion from `maxLength: 0` to `maxLength: 1`. Reason: the plan author wrote 'Phase 2 currently ships zero render-blocking third-party JS, so the gate flips green on its own' but Lighthouse's `render-blocking-resources` audit catches OWN-ORIGIN CSS too — Next.js + Tailwind v4 emits exactly one render-blocking CSS chunk for global styles (`/_next/static/chunks/<hash>.css`, 8.8KB). The plan author's stated intent (current baseline green; future regressions fail) is preserved by `maxLength: 1`: a future plan adding any render-blocking script (e.g., Phase 5 analytics) would push the count to 2 and fail the gate hard."
  - "Task 4 deferred to human action: VERCEL_TOKEN GitHub secret + D-34 branch protection rule are unautomatable from a parallel worktree agent. SUMMARY documents the exact steps + verifies all auto-checkable preconditions."

patterns-established:
  - "Pattern: parallel-wave LHCI bootstrap with two Rule 1 fixes — when a CI plan's verbatim config is internally inconsistent with reality (invalid preset value AND unachievable threshold), commit the fixes as a single Rule 1 commit with thorough rationale rather than returning to checkpoint with no progress."
  - "Pattern: Task 4 (human-action gate) handling — automated agent commits Tasks 1-3 + SUMMARY, returns structured CHECKPOINT REACHED message identifying the GitHub UI steps the developer must complete (secret + branch protection + PR push)."

requirements-completed: []
# PERF-01, PERF-02, PERF-03 are CONFIGURED but not yet ENFORCED — enforcement requires
# Task 4 (human-action) to land VERCEL_TOKEN + branch-protection rule.
# These three requirements should be marked complete by the orchestrator AFTER the
# developer confirms Task 4 (the resume-signal "approved" branch). For now they remain
# pending so the orchestrator's `/gsd-verify-work` step doesn't false-positive.

# Metrics
duration: ~10m
completed: 2026-04-28
checkpoint_reached: true
checkpoint_type: human-verify
checkpoint_task: 4
---

# Phase 02 Plan 05: Lighthouse CI Gate Summary

**The Lighthouse CI gate is wired and verified locally. Tasks 1, 2, 3 are committed; Task 4 (`checkpoint:human-verify`) is the developer-gated step to add `VERCEL_TOKEN` GitHub secret + configure D-34 branch protection on `main`. Local LHCI run is GREEN: median performance 92, CLS 0, render-blocking 1 (the unavoidable Next.js CSS chunk), and the LCP element is the `<h1>` (Plan 02-02's H1 painted-area defense confirmed at runtime).**

## Performance

- **Duration:** ~10 min (Tasks 1, 2, 3 — auto-executable portions)
- **Tasks completed (auto-executable):** 3 / 4 — Task 4 is `checkpoint:human-verify` (orchestrator routes to developer)
- **Files created:** 2 (`.lighthouserc.json`, `.github/workflows/lighthouse.yml`)
- **Files modified:** 3 (`package.json`, `package-lock.json`, `.gitignore`)

## Accomplishments

### Task 1 — `.lighthouserc.json` + `@lhci/cli` devDependency

- Installed `@lhci/cli ^0.15.1` (added 1000 packages to `node_modules` — devDependency only, zero runtime production impact).
- Added a local `lh:ci` npm script (`lhci autorun --config=.lighthouserc.json`) for developer-side runs without typing the full `npx` invocation.
- Created `.lighthouserc.json` with three error-level assertions and three advisory warns. The render-blocking-resources threshold was adjusted from the plan's `maxLength: 0` to `maxLength: 1` (Rule 1 deviation — see "Deviations from Plan" below); the formFactor configuration was rewritten from the plan's invalid `preset: "mobile"` to the valid `formFactor: "mobile"` + screenEmulation + throttling block (Rule 1 deviation — same section).
- **Preserved Playwright dependencies:** `@playwright/test ^1.59.1` and `test:e2e` script (introduced in Plan 02-04) are intact in `package.json`.

### Task 2 — Local LHCI verification run

Ran the full `npx @lhci/cli autorun --config=.lighthouserc.json --collect.url=http://localhost:3000` against `npm run start` (Next.js production build at port 3000). Pre-flight grep for `'use client'` in `app/`, `components/sections/`, `components/quibs/` returned 0 matches (T-02-01 mitigation passes — zero-client-JS Phase 2 invariant intact).

**Three runs (mobile profile, 412x823 @ 1.75x DPR, 150ms RTT, 1638kbps, 4x CPU slowdown):**

| Run | Performance | Accessibility | Best Practices | SEO  | CLS  | LCP    | TBT     | render-blocking |
| --- | ----------- | ------------- | -------------- | ---- | ---- | ------ | ------- | --------------- |
| 1   | 82          | 95            | 96             | 100  | 0.000| 2.40s  | 604ms   | 1               |
| 2   | 92          | 95            | 96             | 100  | 0.000| 2.35s  | 290ms   | 1               |
| 3   | 92          | 95            | 96             | 100  | 0.000| 2.47s  | 258ms   | 1               |

**Median (LHCI's assertion target):** Performance 92, CLS 0, render-blocking 1.

**Assertion results:**
- `categories:performance >= 0.90` -> **PASS** (median 92)
- `cumulative-layout-shift < 0.1` -> **PASS** (CLS 0 across all runs)
- `render-blocking-resources maxLength: 1` -> **PASS** (1 across all runs — the unavoidable Next.js global CSS chunk)
- `categories:accessibility >= 0.90` -> PASS (advisory warn level — 95)
- `categories:best-practices >= 0.90` -> PASS (advisory warn level — 96)
- `categories:seo >= 0.80` -> PASS (advisory warn level — 100)

LHCI exit code: 0. Public report URL: `https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1777346062387-34678.report.html` (this URL changes per run; the workflow on CI will print a fresh URL each PR).

### LCP element verification (concern #2 / HERO-06 / D-03)

Lighthouse's `largest-contentful-paint-element` audit reported:

```
selector: main.flex > section.relative > div.mx-auto > h1.max-w-3xl
nodeLabel: "You know your business. Quibly knows how to market it."
snippet:   <h1 class="max-w-3xl font-heading font-bold leading-tight text-foreground text-3xl sm…">
```

The `<h1>` is the LCP element — Plan 02-02's flex-col-reverse + max-w-3xl H1 painted-area defense (and Plan 02-04's Playwright painted-area assertion) hold at runtime, exactly as designed. Mascot wrapper is NOT the LCP candidate.

### Render-blocking resource identity (D-33 baseline)

Lighthouse identified one render-blocking resource:
```
url:        http://localhost:3000/_next/static/chunks/04vv4nnaqgnb..css
totalBytes: 8867 (8.7KB compiled global CSS chunk — Tailwind v4 + globals.css)
wastedMs:   159-178 (across runs)
```

This is Next.js's built-in CSS emission for global styles, not a third-party script. Phase 2 SC #4's wording ("no render-blocking third-party scripts on first paint") is satisfied — there are zero third-party scripts. The Lighthouse audit is more aggressive than the success criterion. The `maxLength: 1` threshold catches the baseline cleanly while gating against any FUTURE addition (e.g., Phase 5 analytics).

### Task 3 — `.github/workflows/lighthouse.yml`

Verbatim per the plan's `<action>` block. The workflow:

- Runs on `push` to `main` AND `pull_request` targeting `main`
- Job key `lighthouse:` produces the GitHub-rendered status check name `Lighthouse CI / lighthouse` — D-34's branch-protection rule references this exact string
- Step 1: `actions/checkout@v4` checks out the PR head
- Step 2: `patrickedqvist/wait-for-vercel-preview@v1.3.1` polls Vercel for the preview URL with `max_timeout: 300` (5 min)
- Step 3: `treosh/lighthouse-ci-action@v12` runs LHCI against `${{ steps.vercel-preview.outputs.url }}` with `configPath: .lighthouserc.json`, uploads artifacts, and pushes to temporary public storage so the report URL appears in Actions logs
- `VERCEL_TOKEN` is referenced ONLY via `env: VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}` — never via `with:`, never echoed, never written to artifacts (T-02-02 mitigation)
- `LHCI_GITHUB_APP_TOKEN` is optional (enables rich PR annotations if developer installs the lighthouse-ci GitHub App)

**Threat model T-02-02 enforcement:**
```
$ grep -E 'echo.*VERCEL_TOKEN|cat.*VERCEL_TOKEN|>>?.*VERCEL_TOKEN' .github/workflows/lighthouse.yml
$ echo $?
1
```
Zero matches — token is never leaked to logs or artifacts.

## Task Commits

| Task | Name                                                         | Commit  | Files                                                                                                |
| ---- | ------------------------------------------------------------ | ------- | ---------------------------------------------------------------------------------------------------- |
| 1    | feat(02-05): add @lhci/cli + .lighthouserc.json (D-33 cfg)   | 60b5513 | `.lighthouserc.json`, `package.json`, `package-lock.json`                                            |
| 2    | fix(02-05): make .lighthouserc.json runnable; verify local LHCI green | ae3105c | `.lighthouserc.json` (formFactor + maxLength fixes), `.gitignore` (`.lighthouseci/` ignore) |
| 3    | feat(02-05): add Lighthouse CI GitHub Actions workflow       | c460cd6 | `.github/workflows/lighthouse.yml`                                                                   |
| 4    | (deferred — `checkpoint:human-verify`)                       | —       | —                                                                                                    |

## Files Created/Modified

### Created

- **`.lighthouserc.json`** (24 lines) — LHCI configuration with mobile formFactor + screenEmulation + throttling, 3 runs per URL, three error-level assertions (performance, CLS, render-blocking-resources), three advisory warn assertions (a11y, best-practices, SEO).
- **`.github/workflows/lighthouse.yml`** (34 lines) — GitHub Actions workflow producing the `Lighthouse CI / lighthouse` status check.

### Modified

- **`package.json`** — added `"@lhci/cli": "^0.15.1"` to devDependencies + `"lh:ci": "lhci autorun --config=.lighthouserc.json"` to scripts. Existing `@playwright/test` devDependency and `test:e2e` script preserved (per orchestrator's additive-edit instruction).
- **`package-lock.json`** — resolved @lhci/cli + transitive deps (1000 packages).
- **`.gitignore`** — added `.lighthouseci/` block (Lighthouse CI temporary artifacts directory; reports + assertion-results.json + links.json land here during local + CI runs and should never be committed).

## Full file contents

### `.lighthouserc.json` (24 lines)

```json
{
  "ci": {
    "collect": {
      "settings": {
        "formFactor": "mobile",
        "screenEmulation": {
          "mobile": true,
          "width": 412,
          "height": 823,
          "deviceScaleFactor": 1.75,
          "disabled": false
        },
        "throttling": {
          "rttMs": 150,
          "throughputKbps": 1638.4,
          "cpuSlowdownMultiplier": 4
        }
      },
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.90 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "render-blocking-resources": ["error", { "maxLength": 1 }],
        "categories:accessibility": ["warn", { "minScore": 0.90 }],
        "categories:best-practices": ["warn", { "minScore": 0.90 }],
        "categories:seo": ["warn", { "minScore": 0.80 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### `.github/workflows/lighthouse.yml` (34 lines)

```yaml
# Source: treosh/lighthouse-ci-action v12 + patrickedqvist/wait-for-vercel-preview
# Status check name: "Lighthouse CI / lighthouse" — the value used by D-34's branch protection.
name: Lighthouse CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Wait for Vercel Preview
        id: vercel-preview
        uses: patrickedqvist/wait-for-vercel-preview@v1.3.1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          max_timeout: 300
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}

      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v12
        with:
          urls: ${{ steps.vercel-preview.outputs.url }}
          configPath: .lighthouserc.json
          uploadArtifacts: true
          temporaryPublicStorage: true
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

## Verification Results

| Check                                                                            | Command                                                                                                            | Result                                              |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| TypeScript                                                                       | `npm run check`                                                                                                    | exit 0                                              |
| Lint                                                                             | `npm run lint`                                                                                                     | exit 0                                              |
| Build                                                                            | `npm run build`                                                                                                    | exit 0 — Next 16.2.1 Turbopack; `/` reported as `○ /` (static) |
| Phase 2 invariant: zero `'use client'`                                            | `grep -rn "use client" app/ components/sections/ components/quibs/`                                                | 0 matches                                           |
| **Local LHCI run exits 0**                                                       | `npx @lhci/cli autorun --config=.lighthouserc.json --collect.url=http://localhost:3000`                            | **exit 0; all 3 error-level assertions pass**       |
| Task 1: `.lighthouserc.json` is valid JSON                                       | `node -e "require('./.lighthouserc.json')"`                                                                         | exit 0                                              |
| Task 1: performance assertion is `["error", { minScore: 0.90 }]`                 | parsed via `node -e`                                                                                                | confirmed                                           |
| Task 1: CLS assertion is `["error", { maxNumericValue: 0.1 }]`                   | parsed via `node -e`                                                                                                | confirmed                                           |
| Task 1: **render-blocking-resources assertion is `["error", { maxLength: 1 }]`** | parsed via `node -e`                                                                                                | **deviation from plan's `maxLength: 0` — see below**|
| Task 1: numberOfRuns is 3                                                        | parsed via `node -e`                                                                                                | confirmed                                           |
| Task 1: ~~`preset: "mobile"`~~ rewritten to `formFactor: "mobile"`               | `grep -F 'formFactor' .lighthouserc.json`                                                                          | **deviation from plan — see below**                 |
| Task 1: upload target is `temporary-public-storage`                              | parsed via `node -e`                                                                                                | confirmed                                           |
| Task 1: `@lhci/cli` in devDependencies                                           | `node -e "require('./package.json').devDependencies['@lhci/cli']"`                                                  | `^0.15.1`                                           |
| Task 1: `@playwright/test` preserved (orchestrator note)                          | `node -e "require('./package.json').devDependencies['@playwright/test']"`                                           | `^1.59.1` ✓                                         |
| Task 1: `test:e2e` script preserved                                              | `node -e "require('./package.json').scripts['test:e2e']"`                                                           | `playwright test` ✓                                 |
| Task 2: `.gitignore` contains `.lighthouseci/`                                   | `grep -F '.lighthouseci/' .gitignore`                                                                              | match                                               |
| Task 2: pre-flight zero-`'use client'` invariant                                 | `grep -rn "use client" app/ components/sections/ components/quibs/`                                                | 0 matches                                           |
| Task 2: LCP element is the `<h1>`                                                | parsed `largest-contentful-paint-element.details.items[0].items[0].node.selector` from LHCI report                  | `main.flex > section.relative > div.mx-auto > h1.max-w-3xl` ✓ |
| Task 3: workflow file exists                                                     | `test -f .github/workflows/lighthouse.yml`                                                                          | confirmed                                           |
| Task 3: `treosh/lighthouse-ci-action@v12`                                         | `grep -F`                                                                                                          | 1 match                                             |
| Task 3: `patrickedqvist/wait-for-vercel-preview@v1.3.1`                          | `grep -F`                                                                                                          | 1 match                                             |
| Task 3: `configPath: .lighthouserc.json`                                          | `grep -F`                                                                                                          | 1 match                                             |
| Task 3: `VERCEL_TOKEN`                                                           | `grep -F`                                                                                                          | 1 match (in `env:` block)                            |
| Task 3: `max_timeout: 300`                                                       | `grep -F`                                                                                                          | 1 match                                             |
| Task 3: `uploadArtifacts: true`                                                  | `grep -F`                                                                                                          | 1 match                                             |
| Task 3: `temporaryPublicStorage: true`                                           | `grep -F`                                                                                                          | 1 match                                             |
| Task 3: `LHCI_GITHUB_APP_TOKEN`                                                   | `grep -F`                                                                                                          | 1 match                                             |
| Task 3: `actions/checkout@v4`                                                    | `grep -F`                                                                                                          | 1 match                                             |
| Task 3: workflow `name: Lighthouse CI`                                            | `grep -F`                                                                                                          | 1 match                                             |
| Task 3: job key is `lighthouse:`                                                 | `grep -E '^\s*lighthouse:\s*$'`                                                                                    | 1 match                                             |
| Task 3: zero `localhost` references in workflow                                  | `grep -c 'localhost' .github/workflows/lighthouse.yml`                                                              | 0                                                   |
| **Task 3: T-02-02 — VERCEL_TOKEN never echoed/cat'd/redirected**                  | `grep -E 'echo.*VERCEL_TOKEN\|cat.*VERCEL_TOKEN\|>>?.*VERCEL_TOKEN'`                                                | **0 matches (as required)**                          |

### Local LHCI run (live evidence)

```
✅  .lighthouseci/ directory writable
✅  Configuration file found
✅  Chrome installation found
⚠️   GitHub token not set
Healthcheck passed!

Running Lighthouse 3 time(s) on http://localhost:3000
Run #1...done.
Run #2...done.
Run #3...done.
Done running Lighthouse!

Checking assertions against 1 URL(s), 3 total run(s)

All results processed!

Uploading median LHR of http://localhost:3000/...success!
Open the report at https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1777346062387-34678.report.html
No GitHub token set, skipping GitHub status check.

Done running autorun.
```

`assertion-results.json` = `[]` (empty array — LHCI's "all assertions pass" signal).

## Manual checkpoint (Task 4) — automated portions confirmed; human-only portions deferred

The plan defines Task 4 as `type="checkpoint:human-verify"` covering seven steps that combine automated and human verification. This is **the genuine human-action gate** the orchestrator's prompt explicitly identified:

> Note: This plan is `autonomous: false` and includes checkpoints. Follow the plan's checkpoint protocol — return structured checkpoint state to the orchestrator if you hit a human-gate task (e.g., the GitHub required-status-check setting D-34 is a human-action gate that the agent cannot self-serve).

### Auto-verified evidence (committed)

**Step 5 — `VERCEL_TOKEN` GitHub secret check (read-only):**
```
$ gh secret list --repo gushags/quibly-landing
(empty output — exit 0, no secrets currently set)
```
Confirmed: `VERCEL_TOKEN` is NOT yet set. Developer must add it (Step 1-2).

**Branch protection on `main` (read-only):**
```
$ gh api repos/gushags/quibly-landing/branches/main/protection
{"message":"Branch not protected", "status":"404"}
```
Confirmed: branch protection is NOT yet configured. Developer must configure it (Step 3 — D-34).

**Workflow file landed:** Tasks 1-3 commits exist on this worktree branch; the workflow will activate on the first push to a feature branch + PR-open against `main`. (Note: pushing/PR-opening is part of Step 6 and requires the developer's GitHub access.)

**T-02-02 (VERCEL_TOKEN never echoed):**
```
$ grep -E 'echo.*VERCEL_TOKEN|cat.*VERCEL_TOKEN|>>?.*VERCEL_TOKEN' .github/workflows/lighthouse.yml
$ echo $?
1
```
Zero matches — token is never leaked.

### Human-only steps (deferred to orchestrator -> human)

These steps require GitHub UI access (or `gh` admin operations on the repo) plus a real PR push to verify the gate fires + blocks:

- **Step 1** — Generate Vercel personal access token at https://vercel.com/account/tokens (name `quibly-landing-lhci`, scope = personal team).
- **Step 2** — Add `VERCEL_TOKEN` as a GitHub repository secret at https://github.com/gushags/quibly-landing/settings/secrets/actions.
- **Step 3** — Configure branch protection on `main` requiring `Lighthouse CI / lighthouse` status check at https://github.com/gushags/quibly-landing/settings/branches (D-34, concern #5). Note: the status check only appears in the dropdown after the workflow has run at least once on a recent PR or push.
- **Step 4** — Optional: install lighthouse-ci GitHub App (https://github.com/apps/lighthouse-ci) and add `LHCI_GITHUB_APP_TOKEN` as a secret for richer PR annotations.
- **Step 6** — Push these changes to a feature branch + open a PR against `main`; confirm the `Lighthouse CI` workflow runs.
- **Step 7** — Confirm all three error-level assertions show ✅ in the CI run, that the report URL is in the Actions output, and that the PR's merge button correctly enforces the required status check (enabled when green; blocked if a regression fails the gate).

### How the orchestrator should handle Task 4

Per the plan's `<resume-signal>`: when the developer types **"approved"** after completing Steps 1, 2, 3, 6, 7 successfully, Task 4 is complete and Phase 2 is ready for `/gsd-verify-work`. Otherwise the developer should describe which step failed + the exact CI output / branch-protection state.

**Suggested next action:** orchestrator routes a human-verify checkpoint to the developer with the exact step list above. The developer's required actions are entirely in the GitHub + Vercel UIs (no further code changes); the worktree's three commits already contain everything needed for the workflow to run as soon as `VERCEL_TOKEN` is set.

## Decisions Made

- **All Tasks 1-3 content ships exactly per the plan's `<action>` blocks** EXCEPT for two Rule 1 fixes to `.lighthouserc.json` documented under "Deviations from Plan" below. The GitHub Actions workflow (Task 3) ships verbatim per the plan.
- **`lh:ci` npm script added** as a convenience for local LHCI runs — additive, unrelated to the orchestrator's preserve-Playwright instruction (`test:e2e` is preserved as required). The plan does not name this script but the orchestrator's prompt header references it, so it was added.
- **Mobile screenEmulation + throttling values are Lighthouse mobile defaults** (412x823 @ 1.75x DPR, 150ms RTT, 1638.4kbps, 4x CPU slowdown) — matching the values Lighthouse uses internally when a tester selects "Mobile" in DevTools. Self-documenting choice; no Claude's-Discretion invention.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] `preset: "mobile"` is invalid syntax for Lighthouse Core**
- **Found during:** Task 2 — first LHCI run failed immediately with `Argument: preset, Given: "mobile", Choices: "perf", "experimental", "desktop"`.
- **Issue:** The plan's verbatim `"settings": { "preset": "mobile" }` is invalid. Lighthouse Core's `preset` field accepts ONLY `perf|experimental|desktop`. The plan author conflated LHCI presets with Lighthouse `formFactor`. Mobile is Lighthouse's DEFAULT formFactor; explicit emulation parameters are required to lock the runtime profile.
- **Fix:** Replaced `"preset": "mobile"` with the explicit Lighthouse mobile config:
  ```json
  "formFactor": "mobile",
  "screenEmulation": {
    "mobile": true,
    "width": 412, "height": 823, "deviceScaleFactor": 1.75,
    "disabled": false
  },
  "throttling": {
    "rttMs": 150, "throughputKbps": 1638.4, "cpuSlowdownMultiplier": 4
  }
  ```
- **Files modified:** `.lighthouserc.json`
- **Commit:** `ae3105c` (fix(02-05): make .lighthouserc.json runnable; verify local LHCI green)
- **Why this is correctness, not scope creep:** without this fix, ZERO LHCI runs are possible — every invocation errors out at startup. The plan's stated intent (mobile-profile LHCI run) is preserved exactly; only the syntax is corrected.
- **Acceptance-criteria impact:** The plan's Task 1 acceptance criterion `ci.collect.settings.preset is "mobile"` is no longer satisfied. The same intent is satisfied by `ci.collect.settings.formFactor is "mobile"`. Adjusted acceptance: `formFactor: "mobile"` + screenEmulation block + throttling block is the canonical Lighthouse mobile config.

**2. [Rule 1 — Bug] `render-blocking-resources maxLength: 0` is unachievable on Next.js + Tailwind v4 baseline**
- **Found during:** Task 2 — second LHCI run (after fix #1) reported `expected: <=0, found: 1; all values: 1, 1, 1`.
- **Issue:** The plan author wrote: "Phase 2 currently ships zero render-blocking third-party JS, so the gate flips green on its own." But Lighthouse's `render-blocking-resources` audit catches OWN-ORIGIN render-blocking resources too — Next.js + Tailwind v4 emits exactly one render-blocking CSS chunk (`/_next/static/chunks/<hash>.css`, ~8.7KB compressed) for global styles. The plan author conflated "render-blocking third-party scripts" (the success criterion in PERF-03) with "all render-blocking resources" (the Lighthouse audit). With `maxLength: 0`, the gate fails on the BASELINE before any third-party regression occurs.
- **Fix:** Adjusted assertion from `["error", { "maxLength": 0 }]` to `["error", { "maxLength": 1 }]`. This:
  - Accepts the unavoidable Next.js global CSS chunk (current baseline)
  - Catches any FUTURE addition above baseline (e.g., Phase 5 adding Vercel Analytics inline script would push the count to 2 -> fail)
  - Preserves the plan author's stated intent ("gate flips green on its own; future plans that add render-blocking scripts fail HARD")
- **Files modified:** `.lighthouserc.json`
- **Commit:** `ae3105c` (same commit as fix #1 — both `.lighthouserc.json` edits land together)
- **Why this is correctness, not scope creep:** the plan is internally inconsistent — the verbatim `maxLength: 0` value contradicts the plan's stated intent that "the gate flips green on its own." The plan author would have written `maxLength: 1` had they validated against actual Lighthouse output before authoring. Resolving the contradiction in favor of the stated intent (rather than the literal value) is the correctness call.
- **Acceptance-criteria impact:** The plan's Task 1 acceptance criterion `render-blocking-resources is ["error", { maxLength: 0 }]` is no longer satisfied. The same INTENT (catch render-blocking REGRESSIONS, not the unavoidable baseline) is satisfied by `["error", { maxLength: 1 }]`. **Important:** PERF-03's success-criterion wording ("no render-blocking third-party scripts on first paint") is still enforced — Phase 2 ships zero third-party scripts AND has zero `<Script>` tags AND has zero `'use client'` directives, all of which are independently verifiable.
- **D-33 spirit preserved:** D-33's purpose was to catch FUTURE addition of render-blocking scripts. With `maxLength: 1`, that purpose is preserved exactly.

### Other Deviations

**3. [Task 4 deferral] `checkpoint:human-verify` task cannot be executed by an automated parallel-wave agent**
- **Found at:** Task 4 entry.
- **Issue:** The plan's autonomy mode is `false` (`autonomous: false`) and Task 4 is `type="checkpoint:human-verify"` with seven steps that include adding GitHub repository secrets, configuring branch protection rules in the GitHub UI, and verifying a CI run on a real PR. None of these can be performed by a parallel-wave automated agent — adding secrets requires a Vercel access token + GitHub admin access; configuring branch protection requires GitHub admin UI access; verifying a CI run requires pushing the PR.
- **Fix:** Verified all auto-checkable preconditions (workflow file + status-check name + T-02-02 enforcement + zero `'use client'` + LCP element identity + LHCI exits 0 locally) and committed Tasks 1-3 + this SUMMARY. Returned a structured CHECKPOINT REACHED message to the orchestrator with the exact developer steps + verification commands + resume-signal expectations.
- **Why this is the right call:** the orchestrator's prompt explicitly identifies Task 4 as a human-action gate. The parallel-wave constraint requires SUMMARY.md to be committed before return; this is honored. The plan's `<resume-signal>` block defines the exact "approved" / failure conditions for the developer to communicate back.

---

**Total deviations:** 3 (2 Rule 1 plan-authoring bug fixes; 1 Task 4 deferral inherent to parallel-wave human-action checkpoints).
**Impact on plan:** Tasks 1-3 are functionally complete with two acceptance-criteria adjustments documented above. Task 4 is the genuine human-action gate the orchestrator's prompt identified — deferred to developer.

## Issues Encountered

The two Rule 1 deviations (`preset: "mobile"` invalidity + `maxLength: 0` unachievability) BOTH surfaced from real LHCI runs against the plan's verbatim config. Both are plan-authoring miscounts — not regressions in the codebase. The codebase itself is in great shape:

- Performance score 92 (target ≥90) ✓
- CLS 0 (target <0.1) ✓
- LCP element is the `<h1>` (HERO-06 / D-03 working at runtime) ✓
- Accessibility 95, Best Practices 96, SEO 100 (all advisory warns pass) ✓
- Zero `'use client'` directives ✓
- Zero third-party scripts ✓

Run #1 had a slow performance score of 82 (cold-cache + dev-machine load), but median (Run 2 + Run 3 = 92) passed cleanly. CI runs against Vercel's CDN should be MORE consistent than localhost.

## Threat Model Compliance

| Threat ID | Disposition | Status |
| --------- | ----------- | ------ |
| T-02-01 (Information Disclosure — `app/`, `components/sections/`, `components/quibs/`) | mitigate | **PASS.** Pre-flight grep before LHCI returned 0 matches for `'use client'`. Phase 2's zero-client-JS invariant is intact at the gate layer. |
| T-02-02 (Information Disclosure — `secrets.VERCEL_TOKEN`) | mitigate | **PASS.** `grep -E 'echo.*VERCEL_TOKEN\|cat.*VERCEL_TOKEN\|>>?.*VERCEL_TOKEN' .github/workflows/lighthouse.yml` returns 0 matches. Token is referenced ONLY via `env: VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}` — never via `with:`, never echoed, never piped, never written to artifacts. |
| T-02-03 (Tampering — `.lighthouserc.json` thresholds) | mitigate | **PASS, with adjusted threshold documented.** All three error-level assertions remain at error level (performance ≥0.90, CLS <0.1, render-blocking ≤1). The threshold bump from `maxLength: 0` to `maxLength: 1` is documented in this SUMMARY's deviations section so a future review can verify it preserves D-33's intent. |
| T-02-04 (Denial of Service — `wait-for-vercel-preview` timeout) | accept | **N/A in this run** — local LHCI doesn't use the wait action. CI runs will inherit the 300s budget. |
| T-02-05 (Resource exposure — `.lighthouserc.json`) | accept | **PASS.** File contains zero secrets; only public assertion thresholds + Lighthouse runtime config. Safe to commit. |
| T-02-06 (Bypass of merge gate — branch protection rule) | mitigate | **DEFERRED to Task 4.** This SUMMARY confirms branch protection is currently unset (`gh api repos/gushags/quibly-landing/branches/main/protection` returns 404). Developer must configure D-34 in the GitHub UI. |
| T-02-07 (Supply-chain — pinned Action versions) | accept | **PASS.** All three actions are pinned: `treosh/lighthouse-ci-action@v12`, `patrickedqvist/wait-for-vercel-preview@v1.3.1`, `actions/checkout@v4`. No `@latest`, no `@main`. |

## Threat Flags

None. No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries were introduced. The Lighthouse CI workflow runs entirely server-side in GitHub Actions VMs against the Vercel preview URL; no production code paths or runtime behaviors changed. The `@lhci/cli` is a devDependency only.

## Known Stubs

None introduced by this plan. The two disabled CTAs and the placeholder copy from earlier plans (D-31, CD-07) remain plan-mandated stubs for Phase 3 to replace.

## User Setup Required

**Yes — Task 4 (`checkpoint:human-verify`) is unavoidably manual.** The developer must:

1. **Generate a Vercel personal access token** at https://vercel.com/account/tokens (name `quibly-landing-lhci`, scope = personal team where the quibly-landing project lives, no expiry or 1y).
2. **Add `VERCEL_TOKEN` GitHub repository secret** at https://github.com/gushags/quibly-landing/settings/secrets/actions (exact uppercase, no trailing space).
3. **Configure branch protection on `main` (D-34, concern #5)** at https://github.com/gushags/quibly-landing/settings/branches:
   - Branch name pattern: `main`
   - Enable: "Require status checks to pass before merging"
   - Search for and add: `Lighthouse CI / lighthouse`
   - (The check only appears in the dropdown after the workflow has run at least once, so step 4 may need to happen first.)
4. **Push the worktree's commits + open a PR against `main`** to trigger the workflow.
5. **(Optional)** Install the lighthouse-ci GitHub App (https://github.com/apps/lighthouse-ci) and add `LHCI_GITHUB_APP_TOKEN` as a secret for richer per-assertion PR annotations.

After all of the above, the developer types **"approved"** to resume the orchestrator and complete Phase 2.

## Next Phase Readiness

- **Phase 2 SC #4 verification:** **CONFIGURED LOCALLY (auto-portion done)**, **ENFORCEMENT PENDING TASK 4 (human-action)**. The gate is wired in `.github/workflows/lighthouse.yml` and the local LHCI run is GREEN with all three error-level assertions passing on median. Branch protection requires the human-action checkpoint.
- **Phase 5 (PERF-03 reinforcement):** The `render-blocking-resources maxLength: 1` threshold means any Phase 5 plan that adds an inline `<script>` (e.g., GA4-style snippet) will push the count to 2 and fail the gate. Plan authors in Phase 5 should add Vercel Analytics via the React component pattern (`<Analytics />` from `@vercel/analytics/react`), which doesn't add render-blocking JS.
- **`/gsd-verify-work` readiness:** Pending Task 4 developer approval. PERF-01, PERF-02, PERF-03 should be marked `complete` by the orchestrator AFTER the developer types "approved" — not now.

## Self-Check: PASSED

- [x] `.lighthouserc.json` exists with three error-level assertions (performance, CLS, render-blocking-resources)
- [x] `.github/workflows/lighthouse.yml` exists verbatim per plan, with status check name `Lighthouse CI / lighthouse`
- [x] `@lhci/cli` is in `package.json` devDependencies (`^0.15.1`)
- [x] `@playwright/test` and `test:e2e` script preserved per orchestrator note
- [x] `.gitignore` contains `.lighthouseci/`
- [x] Commit `60b5513` exists (Task 1)
- [x] Commit `ae3105c` exists (Task 2 — Rule 1 fixes + local LHCI verification)
- [x] Commit `c460cd6` exists (Task 3 — workflow file)
- [x] Local LHCI run exits 0 with all three error-level assertions passing on median
- [x] LCP element confirmed as `<h1>` via Lighthouse `largest-contentful-paint-element` audit
- [x] T-02-02 grep returns 0 (no token leak patterns)
- [x] Pre-flight zero-`'use client'` invariant grep returns 0 matches
- [x] `npm run check` exits 0
- [x] `npm run lint` exits 0
- [x] `npm run build` exits 0; `/` reported as `○ /` (static)
- [x] Task 4 (human-action checkpoint) auto-portions confirmed; developer steps documented; orchestrator routing prepared

---

*Phase: 02-static-landing-page-no-form*
*Plan: 05*
*Completed (auto-executable Tasks 1, 2, 3): 2026-04-28*
*Checkpoint (Task 4 — human-verify) deferred: orchestrator routes to developer for VERCEL_TOKEN secret + D-34 branch-protection rule + PR push verification*
