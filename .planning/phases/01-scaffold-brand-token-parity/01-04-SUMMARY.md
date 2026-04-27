---
phase: 01-scaffold-brand-token-parity
plan: 04
subsystem: infra
tags: [eslint, husky, gitleaks, security, lint, ast-rule, secret-scanning]

requires:
  - phase: 01-scaffold-brand-token-parity
    provides: "lib/env.ts (the one sanctioned process.env reader); .env.example with deterministic placeholders; package.json with `prepare: husky`, `npm run lint`, `npm run check` scripts."

provides:
  - "Custom AST-based ESLint rule `custom/no-raw-process-env` that errors on any `process.env` read outside `lib/env.ts` (D-11 enforcement)."
  - "`eslint.config.mjs` flat config layering eslint-config-next (core-web-vitals + typescript) with the custom rule scoped to app/, lib/, components/."
  - "RuleTester unit test (`eslint-rules/no-raw-process-env.test.js`) with four `invalid` fixtures (direct read, destructuring, `Object.keys`, computed access) and four `valid` fixtures (allowlisted file, test file, no process.env, false-positive guard)."
  - "`.gitleaks.toml` extending gitleaks defaults with three custom rules (`resend-api-key`, `upstash-rest-token`, `upstash-rest-url`) plus path + regex allowlists for `.env.example`, `.planning/**.md`, CLAUDE.md, README.md."
  - "`.husky/pre-commit` running gitleaks → tsc → eslint in that order; `npm test` deliberately omitted per D-16 (no test runner in Phase 1)."
  - "Empirical proof that the gate fires: a fake `re_AAAAAAAAAAAAAAAAAAAA` key blocks (exit 1, leaks found: 1) and `.env.example` placeholders pass (exit 0, no leaks)."

affects: [phase-04-resend, phase-04-upstash, phase-06-deploy-hardening]

tech-stack:
  added:
    - "gitleaks 8.30.1 (system tool, installed via `brew install gitleaks`; not an npm dep)"
  patterns:
    - "AST-based ESLint custom rule with filename allowlist via `context.filename ?? context.getFilename()`"
    - "Flat config plugin registration via `createRequire` + `plugins: { custom: localRules }`"
    - "Pre-commit gate ordering: secret-scan FIRST so a leak blocks even if other checks would have errored"
    - "Path-based + regex-based defense-in-depth allowlist in `.gitleaks.toml` so `.env.example` cannot block its own commit"

key-files:
  created:
    - "eslint.config.mjs"
    - "eslint-rules/index.js"
    - "eslint-rules/no-raw-process-env.js"
    - "eslint-rules/no-raw-process-env.test.js"
    - ".husky/pre-commit"
    - ".gitleaks.toml"
  modified: []

key-decisions:
  - "RuleTester (not a synthetic shell-based test) is the canonical proof of rule firing — it runs each fixture through the real ESLint runtime and asserts the expected `messageId`."
  - "`lib/env.ts` is allowlisted via per-block `ignores` (NOT `globalIgnores`) so eslint-config-next's other rules (e.g., `@typescript-eslint/no-unused-vars`) still apply there — only `no-raw-process-env` skips it."
  - "Pre-commit hook uses `gitleaks protect --staged --redact -c .gitleaks.toml` rather than `--no-banner` flag for compat with gitleaks 8.30.1 default output."
  - "Order in hook is gitleaks → tsc → eslint — secret detection runs first so a leak blocks the commit even if subsequent commands would have failed for unrelated reasons."

patterns-established:
  - "Custom ESLint plugin under `eslint-rules/` with `index.js` registry + per-rule modules, mirroring marketing-app's structure."
  - "`gitleaks protect --staged` (diff-only) for pre-commit, distinct from `gitleaks detect` (full-tree) for CI/Phase 6 backstop."
  - "Allowlist deterministic placeholder strings (not just paths) so a copy-paste from `.env.example` into another file cannot trick the regex into a false-positive."

requirements-completed: [INFRA-08]

duration: 9min
completed: 2026-04-27
---

# Phase 01 Plan 04: ESLint custom no-raw-process-env rule + husky/gitleaks pre-commit hook Summary

**Custom AST ESLint rule blocks `process.env` reads outside `lib/env.ts` (D-11), and a husky pre-commit hook runs gitleaks → tsc → eslint to block Resend/Upstash secret commits and silent type/lint regressions (INFRA-08).**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-04-27T19:59:08Z
- **Completed:** 2026-04-27T20:08:05Z
- **Tasks:** 2
- **Files created:** 6

## Accomplishments

- AST-based custom ESLint rule `custom/no-raw-process-env` enforces D-11 — any `process.env.X`, `process['env'].X`, destructure, or `Object.keys(process.env)` outside `lib/env.ts` produces a lint error.
- RuleTester unit test (4 `valid` + 4 `invalid` fixtures) is the canonical proof the rule fires — runs against the real ESLint runtime and asserts `messageId`.
- `eslint.config.mjs` integrates eslint-config-next core-web-vitals + typescript and the custom plugin in flat-config form.
- `.gitleaks.toml` extends gitleaks defaults with custom rules for `re_*` (Resend keys), `AYxA*` (Upstash REST tokens), and `https://*.upstash.io` URLs; allowlists `.env.example`, `.planning/**.md`, `CLAUDE.md`, `README.md` plus the literal placeholder strings.
- `.husky/pre-commit` runs `gitleaks protect --staged --redact -c .gitleaks.toml` FIRST, then `npm run check` (tsc), then `npm run lint`. `npm test` is deliberately absent per D-16.
- Empirical block: staging `RESEND_API_KEY=re_AAAAAAAAAAAAAAAAAAAA` produces gitleaks exit 1 ("leaks found: 1").
- Empirical allow: staging `.env.example` (with deterministic `re_xxxxxxxxxxxxxxxxxxxxx`, `AYxA…xxxx`, `your-instance.upstash.io` placeholders) produces exit 0.

## Task Commits

Each task was committed atomically:

1. **Task 1: ESLint flat config + custom no-raw-process-env rule + RuleTester unit test** — `3bc1bf7` (feat)
2. **Task 2: husky pre-commit gitleaks + tsc + eslint hook + .gitleaks.toml** — `1b03dec` (feat)

## Files Created/Modified

- `eslint.config.mjs` — Flat config wiring eslint-config-next + custom plugin; activates `custom/no-raw-process-env: error` for app/, lib/, components/ files; allowlists `lib/env.ts` per-block (not via globalIgnores) so other Next rules still apply.
- `eslint-rules/index.js` — Plugin registry exporting `{ rules: { 'no-raw-process-env': ... } }`.
- `eslint-rules/no-raw-process-env.js` — AST-based rule with `MemberExpression` visitor matching `process.env` (Identifier and Literal property forms). Allowlist: `/lib/env.ts`, `/eslint-rules/`, `*.test.{ts,tsx,js}`.
- `eslint-rules/no-raw-process-env.test.js` — RuleTester suite: 4 `valid` (allowlisted file, test file, no env, false-positive guard) + 4 `invalid` (direct read, destructuring, `Object.keys`, computed access). Runs via `node eslint-rules/no-raw-process-env.test.js`; exits 0 on success.
- `.husky/pre-commit` — Executable hook running gitleaks → tsc → eslint in that order. Does NOT contain `npm test`.
- `.gitleaks.toml` — Extends gitleaks defaults; defines `resend-api-key` (`re_[A-Za-z0-9]{20,}`), `upstash-rest-token` (`AYxA[A-Za-z0-9_-]{30,}`), `upstash-rest-url` (`https://[a-z0-9-]+\.upstash\.io`); path + regex allowlists for placeholder docs.

## Empirical Verification

| Test | Command | Expected | Observed |
|------|---------|----------|----------|
| RuleTester unit test | `node eslint-rules/no-raw-process-env.test.js` | exit 0, "PASS" line | **exit 0**, prints "PASS: no-raw-process-env rule tests passed" |
| Full lint pass | `npm run lint` | exit 0 | **exit 0** (clean on Plans 01-03 output) |
| Block: fake re_ key | `git add` fake-key file → `gitleaks protect --staged ...` | non-zero exit, "leaks found" | **exit 1**, "WRN leaks found: 1" |
| Allow: `.env.example` | `git add .env.example` → `gitleaks protect --staged ...` | exit 0, no leaks | **exit 0**, "INF no leaks found" |
| Full-tree allow scan | `gitleaks detect --source . --no-git -c .gitleaks.toml` | exit 0, no leaks across 35 KB | **exit 0**, scanned 35.56 KB, "no leaks found" |

**gitleaks version installed:** `8.30.1` (homebrew bottle, arm64_tahoe).

## Decisions Made

- **RuleTester is the canonical rule-firing proof.** A subsequent shell-based "synthetic violation" test (e.g., `echo "process.env.X" > foo.ts && eslint foo.ts | grep`) would be strictly weaker — RuleTester runs the rule against in-memory fixtures with the real ESLint runtime and asserts both that errors are reported AND that they have the expected `messageId`. The four `invalid` fixtures cover the full forbidden surface.
- **`lib/env.ts` allowlisted via per-block `ignores`**, NOT via `globalIgnores`. Reason: we want the rest of eslint-config-next (e.g., `@typescript-eslint/no-unused-vars`, react-hooks rules) to still apply to `lib/env.ts` — only the custom `no-raw-process-env` rule skips it. Mirrors marketing-app's pattern of allowlisting `lib/permissions/` for `no-raw-user-brand-roles` while keeping it under TypeScript checks.
- **Pre-commit gate order: gitleaks first.** A secret leak is the highest-severity outcome, so we want the secret-scan to be the first gate. If gitleaks exits non-zero, neither tsc nor eslint runs — and the developer sees the secret-redacted finding immediately.
- **Path + regex allowlist (defense in depth).** The `.env.example` placeholder `re_xxxxxxxxxxxxxxxxxxxxx` (21 x's) matches `re_[A-Za-z0-9]{20,}` by length. Path-only allowlist would exempt the file but a copy-paste of that placeholder into another file (e.g., a docstring example) would still trip the rule. The regex allowlist for the literal placeholder strings handles that case.

## Deviations from Plan

None — plan executed exactly as written.

The plan's pre-flight check anticipated the case where gitleaks might be missing on PATH and instructed surfacing an install command. `which gitleaks` returned non-zero on first run; the plan-sanctioned `brew install gitleaks` resolved it (gitleaks 8.30.1) and execution continued. The plan's pre-flight branch handled this precisely; no rule-driven deviation occurred.

## Issues Encountered

- **`which gitleaks` initially returned non-zero.** Resolved per the plan's pre-flight branch: `brew install gitleaks` (Homebrew already on PATH) installed 8.30.1 in ~2s. No code changes; expected one-time tooling install.
- **`gitleaks protect --staged` allow-test on an unmodified `.env.example` scans 0 bytes** because `--staged` only sees the diff. To prove the allowlist is exercised (not just trivially passing because there is nothing to scan), an additional test was run: appending a newline to `.env.example`, staging it, and re-running — produces exit 0 with the diff actually scanned. Additionally, a full-tree `gitleaks detect --source . --no-git` was run, which scanned 35.56 KB across all repo files including `.env.example`'s placeholders and reported "no leaks found" (exit 0). Both confirm the allowlist is doing the work, not the empty-diff case.

## Threat Model Compliance

| Threat ID | Disposition | Implementation |
|-----------|-------------|----------------|
| T-04-01 (Resend key in git) | mitigate | `.gitleaks.toml` `resend-api-key` rule; empirically proven to block. |
| T-04-02 (Upstash token in git) | mitigate | `.gitleaks.toml` `upstash-rest-token` rule (regex `AYxA[A-Za-z0-9_-]{30,}`). |
| T-04-03 (Upstash URL in git) | mitigate | `.gitleaks.toml` `upstash-rest-url` rule; allowlist exempts `your-instance.upstash.io`. |
| T-04-04 (process.env destructure bypass) | mitigate | RuleTester `invalid` case `const { RESEND_API_KEY } = process.env` asserts the rule fires on this exact pattern. |
| T-04-05 (developer `--no-verify` bypass) | accept | Pre-commit hooks cannot block `--no-verify` by design. **Backstop:** GitHub Actions secret scanning at PR time, scheduled for Phase 6 deploy hardening. Documented as accepted residual risk. |
| T-04-06 (allowlist regex collision with real key) | accept (LOW) | Allowlist regex `re_xxxxxxxxxxxxxxxxxxxxx` is deterministic letter-x repetition — random base62 Resend keys cannot collide. |
| T-04-07 (false-positive blocking legitimate `.env.example`) | mitigate | Empirical allow test confirms `.env.example` is not blocked; full-tree scan reports 0 findings. |
| T-04-08 (attacker modifying `.gitleaks.toml`) | accept | Out of scope for v1; branch protection rules in Phase 6 will require PR review for `.gitleaks.toml` changes. |

## User Setup Required

None — gitleaks was installed in this session via `brew install gitleaks` and is now on PATH. The `prepare: "husky"` script in `package.json` (already present from Plan 01) materializes `.husky/_/` automatically on `npm install`, so no setup beyond a clean clone + `npm install` is needed by future contributors.

If a contributor on a fresh machine lacks gitleaks, the pre-commit hook will fail with `gitleaks: command not found` on first commit — install message is unambiguous (`brew install gitleaks` on macOS; releases page on other OSes).

## Next Phase Readiness

- Phase 1 success criterion #5 is now satisfied empirically: gitleaks pre-commit hook blocks `re_*` and other secret patterns.
- INFRA-08 requirement is complete.
- Phase 4 (Resend + Upstash integration) inherits this safety net unchanged: any future code that tries to read `process.env.RESEND_API_KEY` directly will be flagged at lint time, and any accidental commit of a real key will be blocked at pre-commit time.
- Phase 6 (deploy hardening) is the planned home for the `--no-verify` backstop (GitHub Actions secret scan + branch protection).

## Self-Check: PASSED

Files created (verified to exist on disk):
- FOUND: eslint.config.mjs
- FOUND: eslint-rules/index.js
- FOUND: eslint-rules/no-raw-process-env.js
- FOUND: eslint-rules/no-raw-process-env.test.js
- FOUND: .husky/pre-commit (executable: yes)
- FOUND: .gitleaks.toml

Commits (verified in git log):
- FOUND: 3bc1bf7 (Task 1)
- FOUND: 1b03dec (Task 2)

Empirical gates (verified inline this session):
- RuleTester unit test: exit 0, "PASS" line printed
- Full `npm run lint`: exit 0
- Block test (fake re_ key): exit 1, "leaks found: 1"
- Allow test (.env.example): exit 0, "no leaks found"
- Full-tree scan (35.56 KB across repo): exit 0, "no leaks found"

---
*Phase: 01-scaffold-brand-token-parity*
*Completed: 2026-04-27*
