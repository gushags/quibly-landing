---
phase: 03
plan: 01
id: 03-01
title: Test infrastructure — Vitest+RTL+happy-dom install, configs, Playwright extension, CI workflow
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - playwright.config.ts
  - vitest.config.ts
  - tests/setup.ts
  - .github/workflows/test.yml
autonomous: true
requirements: []
requirements_addressed: []
nyquist_compliant: true

must_haves:
  truths:
    - "`npm run test:unit` runs Vitest in run-mode (not watch) and exits 0 with no specs (Wave 0 baseline)"
    - "`npm run test:unit:watch` is wired (advisory — for dev use)"
    - "`vitest.config.ts` resolves `@/*` imports identically to `tsconfig.json:22`"
    - "`playwright.config.ts` discovers `tests/visual/`, `tests/form/`, AND `tests/no-js/` directories"
    - "`playwright.config.ts` `no-js` project runs with `javaScriptEnabled: false`"
    - "`.github/workflows/test.yml` defines two parallel jobs: `vitest` and `playwright`"
    - "Vitest excludes Playwright `.spec.ts` files (no cross-runner pickup)"
    - "D-17: Vitest + RTL + happy-dom (action layer) and Playwright (e2e layer) test stack — both layers established by this plan's infrastructure"
    - "D-18: both test layers wired as PR gates via two parallel CI jobs (`Tests / vitest` + `Tests / playwright`); branch-protection toggle is a manual GitHub UI checkpoint task in Plan 03-07"
  artifacts:
    - path: "vitest.config.ts"
      provides: "Vitest config: happy-dom env, @/* alias, setupFiles, include/exclude"
      contains: "happy-dom"
    - path: "tests/setup.ts"
      provides: "jest-dom matchers + RTL cleanup"
      contains: "@testing-library/jest-dom/vitest"
    - path: "playwright.config.ts"
      provides: "Multi-project config with no-js project"
      contains: "javaScriptEnabled: false"
    - path: ".github/workflows/test.yml"
      provides: "Two parallel CI jobs: vitest + playwright"
      contains: "name: Tests"
    - path: "package.json"
      provides: "test:unit + test:unit:watch scripts; 7 new devDependencies"
      contains: "\"test:unit\": \"vitest run\""
  key_links:
    - from: "vitest.config.ts"
      to: "tsconfig.json paths"
      via: "path.resolve(__dirname, './') alias mirror"
      pattern: "path\\.resolve.*'\\.\\/'"
    - from: ".github/workflows/test.yml"
      to: "package.json scripts"
      via: "npm run test:unit + npm run test:e2e"
      pattern: "npm run test:(unit|e2e)"
---

<objective>
Install the Vitest + React Testing Library + happy-dom test toolchain, write the Vitest config and setup file, extend `playwright.config.ts` with multi-project support (visual-and-form + no-js), add npm scripts, and create the GitHub Actions test workflow with two parallel jobs.

Purpose: All later Phase 3 plans (server action, form component, e2e specs) depend on this Wave 0 baseline. Without it, no `<automated>` test command can execute.

Output: A green-empty Vitest run (no specs yet, exit 0), a Playwright config that picks up the new `tests/form/` and `tests/no-js/` directories without disturbing `tests/visual/`, and a CI workflow ready to enforce both layers as branch-protection status checks.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/03-email-capture-form-stub-action/03-CONTEXT.md
@.planning/phases/03-email-capture-form-stub-action/03-RESEARCH.md
@.planning/phases/03-email-capture-form-stub-action/03-PATTERNS.md
@.planning/phases/03-email-capture-form-stub-action/03-VALIDATION.md
@CLAUDE.md
@package.json
@tsconfig.json
@playwright.config.ts
@.github/workflows/lighthouse.yml
@tests/visual/above-fold.spec.ts

<interfaces>
<!-- TypeScript path alias to mirror in vitest.config.ts -->

From tsconfig.json:21-23:
```json
"paths": {
  "@/*": ["./*"]
}
```

From package.json:5-14 (existing scripts to preserve verbatim):
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "check": "tsc --noEmit",
  "test:e2e": "playwright test",
  "lh:ci": "lhci autorun --config=.lighthouserc.json",
  "prepare": "husky"
}
```

From playwright.config.ts (existing — to extend, NOT replace):
```ts
import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/visual",
  timeout: 30000,
  expect: { timeout: 5000 },
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 320, height: 568 },
  },
})
```

From .github/workflows/lighthouse.yml (existing — analog for naming + on/permissions blocks; do NOT modify it):
- `name: Lighthouse CI`
- `on: { push: { branches: [main] }, pull_request: { branches: [main] } }`
- Status check name pattern: `<workflow-name> / <job-name>` → e.g. `Lighthouse CI / lighthouse`
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install Vitest + RTL + happy-dom devDependencies (single npm i invocation)</name>
  <files>package.json, package-lock.json</files>
  <read_first>
    - /Users/jeff/repos/quibly-landing/package.json (verify existing devDeps; do NOT collide with existing entries)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-RESEARCH.md (lines 151–166 — Test Toolchain version pins, all `[VERIFIED: npm view ...]`)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-VALIDATION.md (lines 79–85 — Wave 0 install command verbatim)
    - /Users/jeff/repos/quibly-landing/CLAUDE.md (Recommended Stack > Development Tools — `vitest` + `@testing-library/react` + `happy-dom` confirmed)
  </read_first>
  <action>
    Run a single `npm i -D` invocation with the exact pinned versions from RESEARCH.md §Standard Stack > Test Toolchain (NEW):

    ```
    npm i -D vitest@^4 @vitejs/plugin-react@^4.3 @testing-library/react@^16.3 @testing-library/dom@^10 @testing-library/jest-dom@^6.9 @testing-library/user-event@^14.6 happy-dom@^20
    ```

    All seven packages MUST be installed in this single command — VALIDATION.md Wave 0 §6 lists them as a single invocation, and RESEARCH.md confirms `@testing-library/dom@^10` is a required peer of RTL v16 (per the v16.0.0 release notes).

    Do NOT add any of these as `dependencies` (they are devDependencies — test-only). Do NOT install Resend, Upstash, or any Phase 4 packages. Do NOT install `react-hook-form`, `framer-motion`, `next-themes`, `vite-tsconfig-paths`, or `jsdom` — all banned by CLAUDE.md "What NOT to Use" or superseded by `happy-dom`.

    After install, verify in `package.json` that `devDependencies` contains all seven new entries with `^` prefixes matching the pins above (npm may resolve to a higher patch — accept whatever npm chose as long as the major matches).

    Per D-17: Vitest + RTL + happy-dom (action layer) and Playwright (e2e layer) — this command lands the action-layer half of D-17's two-layer test stack. CD-09 mirror.
  </action>
  <verify>
    <automated>node -e "const p=require('/Users/jeff/repos/quibly-landing/package.json'); const need=['vitest','@vitejs/plugin-react','@testing-library/react','@testing-library/dom','@testing-library/jest-dom','@testing-library/user-event','happy-dom']; const missing=need.filter(n=>!p.devDependencies[n]); if(missing.length){console.error('MISSING:',missing);process.exit(1)} console.log('OK — all 7 installed')"</automated>
  </verify>
  <acceptance_criteria>
    - `package.json` `devDependencies` contains all seven keys: `vitest`, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`, `@testing-library/user-event`, `happy-dom`
    - None of the seven appear in `dependencies` (devDeps only)
    - `package-lock.json` has been updated (modified timestamp differs from pre-install)
    - The major-version pins are: vitest `^4`, `@vitejs/plugin-react` `^4.3`, `@testing-library/react` `^16.3`, `@testing-library/dom` `^10`, `@testing-library/jest-dom` `^6.9`, `@testing-library/user-event` `^14.6`, `happy-dom` `^20`
    - No new entries in `dependencies` block (no runtime deps added — Phase 3 ships zero new runtime deps per RESEARCH §Core)
  </acceptance_criteria>
  <done>npm install completes successfully; node -e check above prints "OK — all 7 installed"; `npm ls vitest @testing-library/react happy-dom 2>&1 | head -5` shows all three resolved without warning.</done>
</task>

<task type="auto">
  <name>Task 2: Write vitest.config.ts and tests/setup.ts (verbatim from RESEARCH Pattern 3)</name>
  <files>vitest.config.ts, tests/setup.ts</files>
  <read_first>
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-RESEARCH.md (lines 510–542 — Pattern 3 verbatim source)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-PATTERNS.md (lines 192–242 — vitest.config.ts and tests/setup.ts patterns; Pitfall 7 alias requirement)
    - /Users/jeff/repos/quibly-landing/tsconfig.json (line 21–23 — `@/*: ./*` paths to mirror)
  </read_first>
  <action>
    Create two files. Both are verbatim from RESEARCH.md Pattern 3 (lines 510–542). Do NOT improvise; this config is the load-bearing alias bridge between Vitest and the project's `@/*` imports (Pitfall 7).

    **File 1 — `vitest.config.ts`** (exact contents):
    ```ts
    import { defineConfig } from 'vitest/config'
    import react from '@vitejs/plugin-react'
    import path from 'node:path'

    export default defineConfig({
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './'),
        },
      },
      test: {
        environment: 'happy-dom',
        globals: true,
        setupFiles: ['./tests/setup.ts'],
        include: ['tests/unit/**/*.test.{ts,tsx}'],
        exclude: ['tests/visual/**', 'tests/form/**', 'tests/no-js/**', 'node_modules/**'],
      },
    })
    ```

    Critical details (do NOT alter):
    - `'@': path.resolve(__dirname, './')` — MUST match `tsconfig.json:22` `"@/*": ["./*"]` exactly (NOT a relative `./` — Pitfall 7 documents the failure mode)
    - `environment: 'happy-dom'` — NOT `jsdom` (CLAUDE.md stack lock + faster startup)
    - `globals: true` — lets `describe/it/expect` be ambient without imports (matches `@testing-library/jest-dom/vitest` setup expectations)
    - `setupFiles: ['./tests/setup.ts']` — registers jest-dom matchers
    - `include` SEGREGATES Vitest specs to `tests/unit/**/*.test.{ts,tsx}` only
    - `exclude` MUST list `tests/visual/**`, `tests/form/**`, AND `tests/no-js/**` — Playwright `.spec.ts` files MUST NOT be picked up by Vitest (Pitfall 7 + Pitfall 9 risk). RESEARCH Pattern 3 (line 528) shows just `tests/visual/**`; Phase 3 adds two new directories so we extend the exclude list defensively.

    **File 2 — `tests/setup.ts`** (create the `tests/` parent if needed; `tests/visual/` already exists so the `tests/` directory itself exists):
    ```ts
    import '@testing-library/jest-dom/vitest'
    import { afterEach } from 'vitest'
    import { cleanup } from '@testing-library/react'

    afterEach(() => {
      cleanup()
    })
    ```

    Both lines required:
    - `@testing-library/jest-dom/vitest` registers matchers (`.toBeInTheDocument()`, `.toHaveValue()`, etc.) — without this, `expect(el).toBeInTheDocument()` throws.
    - `cleanup()` after each test prevents RTL v16 + React 19 auto-cleanup mismatch.

    Per D-17: Vitest + RTL + happy-dom configuration for the action-layer test stack. CD-09 mirror.
  </action>
  <verify>
    <automated>test -f /Users/jeff/repos/quibly-landing/vitest.config.ts && test -f /Users/jeff/repos/quibly-landing/tests/setup.ts && grep -q "happy-dom" /Users/jeff/repos/quibly-landing/vitest.config.ts && grep -q "@testing-library/jest-dom/vitest" /Users/jeff/repos/quibly-landing/tests/setup.ts && grep -q "path.resolve(__dirname, './')" /Users/jeff/repos/quibly-landing/vitest.config.ts && grep -q "tests/form/\\*\\*" /Users/jeff/repos/quibly-landing/vitest.config.ts && grep -q "tests/no-js/\\*\\*" /Users/jeff/repos/quibly-landing/vitest.config.ts && echo OK</automated>
  </verify>
  <acceptance_criteria>
    - `vitest.config.ts` exists at repo root
    - `tests/setup.ts` exists
    - `vitest.config.ts` contains the literal string `'happy-dom'` (env)
    - `vitest.config.ts` contains the literal string `path.resolve(__dirname, './')` (alias mirror — exact form per Pitfall 7)
    - `vitest.config.ts` `exclude` contains `tests/visual/**`, `tests/form/**`, AND `tests/no-js/**`
    - `vitest.config.ts` `include` is `tests/unit/**/*.test.{ts,tsx}`
    - `tests/setup.ts` contains `@testing-library/jest-dom/vitest` and `cleanup()` call inside `afterEach`
    - `tsc --noEmit` passes (no TS errors introduced)
  </acceptance_criteria>
  <done>Both files exist and the grep gate above prints "OK"; `npx tsc --noEmit` exits 0.</done>
</task>

<task type="auto">
  <name>Task 3: Add test:unit + test:unit:watch scripts to package.json</name>
  <files>package.json</files>
  <read_first>
    - /Users/jeff/repos/quibly-landing/package.json (current scripts block)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-RESEARCH.md (lines 544–552 — script names verbatim)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-PATTERNS.md (lines 548–555 — script placement guidance)
  </read_first>
  <action>
    Add two scripts to `package.json` `scripts` block, placed BETWEEN existing `"test:e2e"` (currently line 11) and `"lh:ci"` (currently line 12):

    ```json
    "test:unit": "vitest run",
    "test:unit:watch": "vitest"
    ```

    Critical:
    - `"test:unit": "vitest run"` (the `run` subcommand is mandatory — `vitest` alone enters watch mode which would hang in CI; VALIDATION.md sign-off line "No watch-mode flags in CI commands")
    - `"test:unit:watch": "vitest"` — for local dev only

    Do NOT modify any other script. Preserve verbatim: `dev`, `build`, `start`, `lint`, `check`, `test:e2e`, `lh:ci`, `prepare`.

    Verify `npm run test:unit` exits 0 with "No test files found" (since no `tests/unit/*.test.ts` files exist yet — Wave 0 baseline). This is the expected green-empty state.

    Per D-17 / CD-09 — establishes the action-layer test runner script.
  </action>
  <verify>
    <automated>node -e "const p=require('/Users/jeff/repos/quibly-landing/package.json'); if(p.scripts['test:unit']!=='vitest run'){console.error('test:unit script wrong:',p.scripts['test:unit']);process.exit(1)} if(p.scripts['test:unit:watch']!=='vitest'){console.error('test:unit:watch wrong');process.exit(1)} const expected=['dev','build','start','lint','check','test:e2e','test:unit','test:unit:watch','lh:ci','prepare']; for(const s of expected){if(!p.scripts[s]){console.error('missing script:',s);process.exit(1)}} console.log('OK')" && cd /Users/jeff/repos/quibly-landing && npm run test:unit 2>&1 | tail -5</automated>
  </verify>
  <acceptance_criteria>
    - `package.json` `scripts.test:unit` is exactly `"vitest run"` (NOT `"vitest"` — the `run` flag is required)
    - `package.json` `scripts.test:unit:watch` is exactly `"vitest"`
    - All 8 pre-existing script keys remain (`dev`, `build`, `start`, `lint`, `check`, `test:e2e`, `lh:ci`, `prepare`)
    - `npm run test:unit` exits 0 with "No test files found, exiting with code 0" (or equivalent green-empty message — Wave 0 baseline; specs land in later waves)
  </acceptance_criteria>
  <done>node check prints "OK"; `npm run test:unit` exits 0 (green-empty).</done>
</task>

<task type="auto">
  <name>Task 4: Extend playwright.config.ts with visual-and-form + no-js projects</name>
  <files>playwright.config.ts</files>
  <read_first>
    - /Users/jeff/repos/quibly-landing/playwright.config.ts (current minimal config)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-RESEARCH.md (lines 562–584 — Pattern 4 verbatim)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-PATTERNS.md (lines 506–540 — playwright.config.ts pattern; preservation list)
  </read_first>
  <action>
    Replace the current `playwright.config.ts` with the multi-project version. Preserve verbatim: `timeout: 30000`, `expect: { timeout: 5000 }`, `reporter: 'list'`, `use.baseURL`, `use.viewport: { width: 320, height: 568 }` (Phase 2 lock — mobile-first 320×568).

    Update `testDir` from `"./tests/visual"` to `"./tests"` so the new `tests/form/`, `tests/no-js/`, and existing `tests/visual/` directories are all discovered.

    Replace the JSDoc comment block (currently lines 3–11) with the new state description.

    **Full file contents** (overwrite `playwright.config.ts`):
    ```ts
    import { defineConfig } from "@playwright/test"

    /**
     * Playwright config — multi-project, mobile-first.
     *
     * Two projects:
     *   - "visual-and-form": runs tests/visual/* (Phase 2 specs) + tests/form/* (Phase 3 e2e)
     *   - "no-js":           runs tests/no-js/* with javaScriptEnabled: false (Phase 3 progressive
     *                        enhancement spec — see RESEARCH Pattern 4 + Pitfall 3)
     *
     * Tests run against a locally-running Next.js dev server at http://localhost:3000.
     * Either `npm run dev` or `npm run build && npm run start` must be running before
     * `npx playwright test` is invoked.
     *
     * Mobile-first viewport (320×568) is locked from Phase 2.
     */
    export default defineConfig({
      testDir: "./tests",
      timeout: 30000,
      expect: { timeout: 5000 },
      reporter: "list",
      use: {
        baseURL: "http://localhost:3000",
        viewport: { width: 320, height: 568 },
      },
      projects: [
        {
          name: "visual-and-form",
          testMatch: /tests\/(visual|form)\/.*\.spec\.ts/,
        },
        {
          name: "no-js",
          testMatch: /tests\/no-js\/.*\.spec\.ts/,
          use: { javaScriptEnabled: false },
        },
      ],
    })
    ```

    Critical:
    - `testMatch` regexes use forward slashes (work cross-platform in Playwright's matcher)
    - The `no-js` project SETS `javaScriptEnabled: false` at project-level `use` (not test-level — RESEARCH Pattern 4 verified pattern)
    - Do NOT add `webServer` config (Phase 2 didn't have one; CI workflow handles dev-server startup separately — Plan 01 Task 5)
    - Do NOT add `workers` count or `fullyParallel` — accept Playwright defaults

    Per D-16: native Server-Action progressive enhancement is exercised by the `no-js` project; Playwright (per D-17) covers the e2e layer including this no-JS variant.
  </action>
  <verify>
    <automated>grep -q "javaScriptEnabled: false" /Users/jeff/repos/quibly-landing/playwright.config.ts && grep -q "tests\\\\/no-js" /Users/jeff/repos/quibly-landing/playwright.config.ts && grep -q "tests\\\\/(visual|form)" /Users/jeff/repos/quibly-landing/playwright.config.ts && grep -q 'testDir: "./tests"' /Users/jeff/repos/quibly-landing/playwright.config.ts && grep -q 'viewport: { width: 320, height: 568 }' /Users/jeff/repos/quibly-landing/playwright.config.ts && cd /Users/jeff/repos/quibly-landing && npx playwright test --list 2>&1 | tail -10</automated>
  </verify>
  <acceptance_criteria>
    - `playwright.config.ts` contains `testDir: "./tests"` (changed from `"./tests/visual"`)
    - `playwright.config.ts` contains a `projects:` array with EXACTLY two entries: `name: "visual-and-form"` and `name: "no-js"`
    - The `no-js` project entry contains `javaScriptEnabled: false` in its `use` block
    - The `visual-and-form` project's `testMatch` regex matches both `tests/visual/` and `tests/form/`
    - Existing values preserved: `timeout: 30000`, `expect: { timeout: 5000 }`, `reporter: "list"`, `baseURL: "http://localhost:3000"`, `viewport: { width: 320, height: 568 }`
    - `npx playwright test --list` lists existing Phase 2 specs (above-fold, button-radius) under the `visual-and-form` project (no errors about missing tests/form/ or tests/no-js/ directories — Playwright tolerates empty matched directories)
    - `tsc --noEmit` passes
  </acceptance_criteria>
  <done>grep gates above pass; `npx playwright test --list` lists Phase 2 specs without errors.</done>
</task>

<task type="auto">
  <name>Task 5: Create .github/workflows/test.yml — two parallel jobs (vitest + playwright)</name>
  <files>.github/workflows/test.yml</files>
  <read_first>
    - /Users/jeff/repos/quibly-landing/.github/workflows/lighthouse.yml (analog — name/on/permissions block shape; status check naming convention)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-RESEARCH.md (lines 617–684 — Pattern 5 verbatim + status check names + Branch protection note)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-PATTERNS.md (lines 374–402 — workflow pattern; "NEW file vs EXTEND" decision rationale)
    - /Users/jeff/repos/quibly-landing/package.json (verify `test:unit` and `test:e2e` scripts exist — added in Tasks 3 + already present)
  </read_first>
  <action>
    Create `.github/workflows/test.yml` with TWO parallel jobs (`vitest` fast lane, `playwright` slow lane). Per RESEARCH Pattern 5 line 627–628, drop `pull-requests: write` and `statuses: write` (Vitest/Playwright don't need to post comments — the workflow's pass/fail IS the status check).

    **Full file contents** (verbatim from RESEARCH Pattern 5 lines 617–677, with one Phase-3-specific addition: a `wait-on` install via `npx wait-on` since it's not in package.json):

    ```yaml
    # Source: RESEARCH.md §Pattern 5 (lines 617–677). Two parallel jobs to keep PR feedback under 3 min.
    # D-18: both test layers required as PR gates — these two job names become the required status checks
    # on `main` branch protection. Status check names (mirror Phase 2 D-34 pattern):
    #   - "Tests / vitest"      → branch protection required-status-check (D-18)
    #   - "Tests / playwright"  → branch protection required-status-check (D-18)
    # Adding these two names to main's branch protection is a manual GitHub UI step
    # — see Plan 03-07 Task 1 (autonomous: false checkpoint).
    name: Tests

    on:
      push:
        branches: [main]
      pull_request:
        branches: [main]

    permissions:
      contents: read

    jobs:
      vitest:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4
          - uses: actions/setup-node@v4
            with:
              node-version: lts/*
              cache: npm
          - run: npm ci
          - run: npx tsc --noEmit
          - run: npm run lint
          - run: npm run test:unit

      playwright:
        runs-on: ubuntu-latest
        timeout-minutes: 15
        steps:
          - uses: actions/checkout@v4
          - uses: actions/setup-node@v4
            with:
              node-version: lts/*
              cache: npm
          - run: npm ci
          - name: Get installed Playwright version
            id: playwright-version
            run: echo "version=$(node -p "require('@playwright/test/package.json').version")" >> "$GITHUB_OUTPUT"
          - name: Cache Playwright browsers
            uses: actions/cache@v4
            id: playwright-cache
            with:
              path: ~/.cache/ms-playwright
              key: playwright-${{ runner.os }}-${{ steps.playwright-version.outputs.version }}
          - name: Install Playwright browsers
            if: steps.playwright-cache.outputs.cache-hit != 'true'
            run: npx playwright install --with-deps chromium
          - name: Build Next app
            run: npm run build
          - name: Start Next server in background
            run: npx next start &
          - name: Wait for server
            run: npx --yes wait-on http://localhost:3000 --timeout 30000
          - name: Run Playwright tests
            run: npm run test:e2e
          - uses: actions/upload-artifact@v4
            if: failure()
            with:
              name: playwright-report
              path: playwright-report/
              retention-days: 7
    ```

    Critical rationale:
    - `name: Tests` → status check names become `Tests / vitest` and `Tests / playwright` (D-18: both layers required as PR gates; mirrors Phase 2 D-34's `Lighthouse CI / lighthouse`)
    - `permissions: contents: read` ONLY — drops Lighthouse workflow's `pull-requests: write` and `statuses: write` (RESEARCH lines 627–628)
    - Vitest job runs `tsc --noEmit` AND `npm run lint` AND `npm run test:unit` — fast fail on type/lint errors before running tests
    - Playwright job uses `actions/cache@v4` keyed on Playwright version (RESEARCH J5 — browser binaries change with Playwright version, not arbitrary lockfile changes)
    - `npx --yes wait-on` because `wait-on` is NOT in `package.json` — `--yes` auto-installs without prompting
    - Two SEPARATE steps for `npx next start &` and `npx wait-on` so the background `&` doesn't block the GitHub step
    - Failure artifact upload → debugging help when CI fails

    Per D-18: this workflow file is the CI-side half of D-18 (test layers required as PR gates); the branch-protection toggle that ENFORCES these jobs is the manual GitHub UI checkpoint task in Plan 03-07.
  </action>
  <verify>
    <automated>test -f /Users/jeff/repos/quibly-landing/.github/workflows/test.yml && grep -q "name: Tests$" /Users/jeff/repos/quibly-landing/.github/workflows/test.yml && grep -cE "^  (vitest|playwright):$" /Users/jeff/repos/quibly-landing/.github/workflows/test.yml | grep -q 2 && grep -q "npm run test:unit" /Users/jeff/repos/quibly-landing/.github/workflows/test.yml && grep -q "npm run test:e2e" /Users/jeff/repos/quibly-landing/.github/workflows/test.yml && grep -q "playwright-\${{ runner.os }}-\${{ steps.playwright-version.outputs.version }}" /Users/jeff/repos/quibly-landing/.github/workflows/test.yml && grep -q "javaScriptEnabled" /Users/jeff/repos/quibly-landing/playwright.config.ts && echo OK</automated>
  </verify>
  <acceptance_criteria>
    - File exists at `.github/workflows/test.yml`
    - Top-level `name:` is exactly `Tests` (drives status check prefix `Tests / *`)
    - Workflow defines exactly TWO jobs: `vitest` and `playwright`
    - Vitest job runs `npx tsc --noEmit`, `npm run lint`, AND `npm run test:unit`
    - Playwright job runs `npm run test:e2e`
    - Playwright job uses `actions/cache@v4` with `path: ~/.cache/ms-playwright` keyed on `playwright-${{ runner.os }}-${{ steps.playwright-version.outputs.version }}`
    - Playwright job runs `npx --yes wait-on http://localhost:3000 --timeout 30000`
    - Playwright job uploads `playwright-report/` artifact on failure
    - `permissions:` block contains `contents: read` and does NOT contain `pull-requests: write` or `statuses: write`
    - The pre-existing `.github/workflows/lighthouse.yml` is UNCHANGED (verify via git diff — only the new file should appear)
  </acceptance_criteria>
  <done>grep gate prints "OK"; `git status .github/workflows/` shows only the new `test.yml` file.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| developer machine → GitHub Actions runner | `npm ci` pulls untrusted transitive packages; lockfile + permissions: read mitigate |
| Playwright browser → localhost:3000 | Local-only test traffic; no exposure outside CI runner |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-01 | n/a | n/a | n/a | (Plan 01 ships no production code; no email enumeration surface here. Tracked in Plan 02/03.) |
| T-03-05 | T (Tampering) | `.github/workflows/test.yml` | mitigate | `permissions: contents: read` (least-privilege) — drops Lighthouse workflow's `pull-requests: write` + `statuses: write`. Workflow cannot post comments or update commit statuses (only its own pass/fail signal is exposed). Per RESEARCH Pattern 5. |
| T-03-INFRA-01 | E (Elevation of Privilege) | npm `vitest`/RTL/happy-dom devDeps | accept | All seven packages are widely-used, established projects (vitest 4 — millions of weekly downloads; RTL — official React testing library). Pinned with `^` for security patches. No known supply-chain compromise as of 2026-04-27. |
| T-03-INFRA-02 | I (Information Disclosure) | Playwright artifact upload (failure path) | accept | Artifact contains screenshot/video of localhost:3000 form — no real PII (test data is `dup@example.com`/`err@example.com`/etc. stub triggers per D-11). Retention 7 days. |
| T-03-INFRA-03 | D (Denial of Service) | CI minutes consumption | accept | Two parallel jobs ~3 min total; fits within free GitHub Actions minutes for personal/small-team usage. Phase 2 already has Lighthouse CI; Phase 3 adds two more jobs. STATE.md "Concerns" tracks CI minute usage. |

No `high` severity threats in this plan — Plan 01 is pure infrastructure with no production code surface.
</threat_model>

<verification>
After all tasks complete:

1. **Vitest baseline (green-empty):**
   ```bash
   npm run test:unit
   ```
   Expected: exit code 0, message "No test files found" or equivalent.

2. **TypeScript:**
   ```bash
   npx tsc --noEmit
   ```
   Expected: exit code 0, no errors.

3. **Lint:**
   ```bash
   npm run lint
   ```
   Expected: exit code 0 (no new files flagged — vitest.config.ts and tests/setup.ts are eslint-config-next compatible).

4. **Playwright config sanity:**
   ```bash
   npx playwright test --list
   ```
   Expected: lists Phase 2 specs (above-fold + button-radius) under `visual-and-form` project; no Phase 3 specs (none exist yet); no errors about empty `tests/form/` or `tests/no-js/`.

5. **Workflow file YAML validity:**
   ```bash
   python3 -c "import yaml; yaml.safe_load(open('.github/workflows/test.yml'))"
   ```
   Expected: exit code 0 (valid YAML).

6. **No accidental file changes:**
   ```bash
   git status .github/workflows/lighthouse.yml
   ```
   Expected: clean (Plan 01 must NOT modify the existing Lighthouse workflow).
</verification>

<success_criteria>
- `npm run test:unit` runs Vitest in run-mode and exits 0 (green-empty: no specs yet)
- `vitest.config.ts` mirrors `tsconfig.json` `@/*` alias via `path.resolve(__dirname, './')` (Pitfall 7)
- `tests/setup.ts` registers jest-dom matchers + RTL cleanup
- `playwright.config.ts` has `visual-and-form` and `no-js` projects; `no-js` runs with `javaScriptEnabled: false`
- `.github/workflows/test.yml` exists with two parallel jobs (`vitest`, `playwright`)
- Status check names ready for branch protection: `Tests / vitest`, `Tests / playwright` (D-18 manual config in Plan 03-07)
- Existing `.github/workflows/lighthouse.yml` untouched
- `tsc --noEmit` and `npm run lint` both exit 0
</success_criteria>

<output>
After completion, create `.planning/phases/03-email-capture-form-stub-action/03-01-SUMMARY.md` documenting:
- Vitest install resolved versions (capture from `npm ls`)
- Confirmation that `npm run test:unit` exits 0 green-empty
- The exact status check names CI will produce (`Tests / vitest`, `Tests / playwright`) for use in Plan 03-07's branch protection checkpoint
- Any unexpected lockfile diffs noted for review
</output>
</output>
