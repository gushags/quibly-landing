---
phase: 01-scaffold-brand-token-parity
verified: 2026-04-27T20:55:00Z
status: gaps_found
score: 4/5 ROADMAP success criteria verified
overrides_applied: 0
gaps:
  - truth: "The app crashes at boot with a helpful Zod error if any Resend/Upstash env var is missing — never on first signup (Phase 1 SC #4)."
    status: failed
    reason: "lib/env.ts is never imported by any production module (no `from '@/lib/env'` in app/, components/, or lib/utils.ts). Empirical test: `npm run build` exits 0 with an empty .env.local. The Zod schema is dormant; the only way it ever runs is the synthetic node script Plan 01-01's verify block runs in isolation. The boot-crash invariant is therefore unverified by any production code path that ships in this phase."
    artifacts:
      - path: "lib/env.ts"
        issue: "File defines envSchema.parse(process.env) but is never imported anywhere — TypeScript modules with no consumer are never evaluated. Plan 01-01-SUMMARY's 'empirical boot-crash test' was a synthetic isolation test, not a production-path test."
      - path: "app/layout.tsx"
        issue: "Does not import @/lib/env, so root layout module load does not exercise the schema."
      - path: "app/page.tsx"
        issue: "Does not import @/lib/env."
      - path: "next.config.ts"
        issue: "Empty config; does not import @/lib/env."
    missing:
      - "Add `import '@/lib/env'` (side-effect import) to app/layout.tsx so every page render path goes through env validation, OR add it to next.config.ts so config-load triggers validation."
      - "Re-run empirical proof: `cat /dev/null > .env.local && npm run build` should now exit non-zero with a ZodError listing all six missing keys."
human_verification:
  - test: "Re-run gitleaks block test under git's actual hook invocation path"
    expected: "git commit -m \"x\" with a fake re_ key staged should be rejected with `husky - pre-commit script failed (code 1)`"
    why_human: "The verifier already simulated this via `.husky/_/pre-commit` and via `sh -e .husky/pre-commit` (both block correctly with exit 1 / 127). A real `git commit` invocation across the user's day-to-day workflow is the canonical confirmation; the simulations match husky 9's contract but a true `git commit` test on a real branch is the human-eyes signal."
---

# Phase 1: Scaffold + Brand Token Parity — Verification Report

**Phase Goal:** "A running Next.js 16 + Tailwind v4 app whose design tokens, fonts, mascot, and secret-handling posture match `marketing-app` exactly, so brand contract drift is impossible from day one."

**Verified:** 2026-04-27T20:55:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A blank page renders in Quibly teal/amber with Quicksand headings and Figtree body, visually indistinguishable from marketing-app's tokens (oklch primary, radius scale, font CSS variables verbatim). | ✓ VERIFIED | User confirmed via interactive smoke-test at http://localhost:3000 (per orchestrator context). `app/globals.css` diff vs marketing-app shows exactly 1 deletion (the typography plugin) and 0 additions. Critical tokens present: `--primary: oklch(0.6002 0.1038 184.704)`, `--font-heading: var(--font-quicksand)`, `--font-sans: var(--font-figtree)`, `--radius-4xl`. `app/layout.tsx` wires Quicksand+Figtree via `next/font/google` with both `--font-quicksand` and `--font-figtree` CSS variables on `<html>`. `npm run build` exits 0 (3 static pages prerendered). |
| 2 | The Quibs Q-face mascot renders in the page as a reusable React component sourced from `public/`. | ✓ VERIFIED | `components/quibs/quibs-icon.tsx` byte-identical to marketing-app analog. `components/quibs/quibs-avatar.tsx` byte-identical to marketing-app analog. `public/quibs-icon.svg` exists at exactly 4422 bytes. `app/page.tsx` line 31 renders `<QuibsIcon className="text-primary size-12" />`. User confirmed teal rendering via interactive smoke-test. |
| 3 | shadcn button/input/label/sonner/form components are installed and styled to Quibly tokens (no default shadcn neutral). | ⚠ PARTIAL | `button.tsx`, `input.tsx`, `label.tsx` byte-identical to marketing-app. `sonner.tsx` ports with documented next-themes deviation (theme="light" hardcoded; banned-dep removal verified). **`form.tsx` is INTENTIONALLY ABSENT** — Plan 01-03 documents this as planner option A; ROADMAP plan list explicitly states "form deferred to Phase 3"; CLAUDE.md "What NOT to Use" bans react-hook-form which form.tsx depends on. This is a documented deferral. |
| 4 | The app crashes at boot with a helpful Zod error if any Resend/Upstash env var is missing — never on first signup. | ✗ FAILED | `lib/env.ts` exists with the Zod schema (`.parse(process.env)` at line 37, six env vars enumerated, no `safeParse`, no `NODE_ENV` leniency, no `'server-only'`). **However, no module in `app/`, `components/`, `lib/utils.ts`, or `next.config.ts` imports `@/lib/env`.** Empirically confirmed: `npm run build` exits 0 with `.env.local` emptied. The Zod schema is dormant; the boot-crash invariant is observable ONLY via the synthetic isolation test Plan 01-01 ran (`node -e ...`), not via any production code path that ships in Phase 1. SC #4 says "the **app** crashes at boot" — the app does not crash. See gap entry below. |
| 5 | A `gitleaks` pre-commit hook blocks any attempt to commit a string matching `re_*` (Resend key) or other secret patterns. | ✓ VERIFIED | `.husky/pre-commit` exists (executable; runs gitleaks → tsc → eslint, no `npm test`). `.gitleaks.toml` defines `resend-api-key`, `upstash-rest-token`, `upstash-rest-url` rules; allowlists `.env.example`, `.planning/**.md`, `CLAUDE.md`, `README.md`. `gitleaks` 8.30.1 installed at `/opt/homebrew/bin/gitleaks`. Empirical block test (this verification): staging `RESEND_API_KEY=re_TESTSECRET12345678901` produces gitleaks exit 1, "leaks found: 1". Empirical via husky's actual git-invoked path (`.husky/_/pre-commit`): exit 1 with "husky - pre-commit script failed (code 1)". |

**Score:** 4/5 ROADMAP success criteria verified (one FAILED, one PARTIAL with documented deferral).

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` | Pinned next 16.2.1, react 19.2.4, zod ^4.0, no banned deps | ✓ VERIFIED | All version pins match marketing-app for shared deps. `zod ^4.0.0` present. `next-themes`, `@tailwindcss/typography`, `react-hook-form`, `framer-motion` all absent from dependencies/devDependencies AND from node_modules. |
| `tsconfig.json` | strict: true, `@/*` alias | ✓ VERIFIED | Per Plan 01-01 SUMMARY: byte-identical to marketing-app/tsconfig.json. |
| `next.config.ts` | Empty NextConfig (no turbopack.root) | ✓ VERIFIED | 101 bytes; CD-04 satisfied (no monorepo workaround). |
| `postcss.config.mjs` | Tailwind v4 PostCSS adapter | ✓ VERIFIED | Contains `@tailwindcss/postcss`. |
| `components.json` | shadcn style: radix-nova | ✓ VERIFIED | `style: "radix-nova"` confirms barrel imports in button.tsx; `tailwind.css: "app/globals.css"`. |
| `lib/utils.ts` | cn() byte-identical to marketing-app | ✓ VERIFIED | `diff` returns empty (byte-identical). |
| `lib/env.ts` | Zod schema for all 6 env vars; .parse() at module load; no NODE_ENV; no server-only | ⚠ ARTIFACT-OK / NOT-WIRED | File present and structurally correct. **NOT IMPORTED ANYWHERE.** See gaps. |
| `.env.example` | All 6 vars with deterministic placeholders | ✓ VERIFIED | 6 KEY=value lines; Resend `re_xxx...`, Upstash placeholders; not gitignored. |
| `.gitignore` | `.env*.local` excluded | ✓ VERIFIED | Pattern present; `.env.local` and `.vercel/project.json` confirmed not tracked by git. |
| `app/globals.css` | Verbatim - typography plugin line | ✓ VERIFIED | 319 lines vs marketing-app's 320 (exactly one deletion: `@plugin "@tailwindcss/typography";`). All key tokens present. |
| `app/layout.tsx` | Quicksand+Figtree CSS vars on `<html>`; no Toaster mount in Phase 1 | ✓ VERIFIED | Both fonts loaded with `subsets: ["latin"]`, weight pin, `display: "swap"`. `metadataBase: https://useQuibly.com`. No `<Toaster />` mount (Phase 3 mounts it). |
| `app/page.tsx` | All 4 D-12 parity surfaces in one viewport | ✓ VERIFIED | `<QuibsIcon className="text-primary size-12" />` + `<h1 className="font-heading text-4xl font-bold">Quibly</h1>` + `<p className="font-sans text-base ...">` + `<Button>Smoke test</Button>`. |
| `components/quibs/quibs-icon.tsx` | Byte-identical to marketing-app | ✓ VERIFIED | `diff` empty. |
| `components/quibs/quibs-avatar.tsx` | Byte-identical to marketing-app | ✓ VERIFIED | `diff` empty. |
| `public/quibs-icon.svg` | 4422 bytes | ✓ VERIFIED | `wc -c` returns 4422. |
| `components/ui/button.tsx` | Byte-identical to marketing-app | ✓ VERIFIED | `diff` empty; `rounded-full` pill base, `bg-primary text-primary-foreground` default variant, `import { Slot } from "radix-ui"` barrel import. |
| `components/ui/input.tsx` | Byte-identical to marketing-app | ✓ VERIFIED | `diff` empty; `text-base ... md:text-sm` for MOB-04. |
| `components/ui/label.tsx` | Byte-identical to marketing-app | ✓ VERIFIED | `diff` empty; `"use client"`; `from "radix-ui"` barrel. |
| `components/ui/sonner.tsx` | next-themes removed, theme="light" hardcoded | ✓ VERIFIED | `"use client"`; `theme="light"`; 5 lucide icons; CSS-var bindings to popover/border/radius tokens; no `next-themes` reference. |
| `components/ui/form.tsx` | shadcn Form component | ✗ MISSING (DEFERRED) | Intentionally absent per planner option A; deferral documented in 01-03-SUMMARY and ROADMAP plan list ("form deferred to Phase 3"). |
| `eslint.config.mjs` | Flat config + custom rule wired | ✓ VERIFIED | Activates `custom/no-raw-process-env: error` for app/, lib/, components/; allowlists lib/env.ts per-block. |
| `eslint-rules/no-raw-process-env.js` | AST-based rule with allowlist | ✓ VERIFIED | MemberExpression visitor; allowlists `/lib/env.ts`, `/eslint-rules/`, `*.test.{ts,tsx,js}`. |
| `eslint-rules/no-raw-process-env.test.js` | RuleTester unit test | ✓ VERIFIED | Exits 0; prints "PASS: no-raw-process-env rule tests passed". 4 valid + 4 invalid fixtures (direct read, destructure, `Object.keys`, computed access). |
| `.husky/pre-commit` | gitleaks → tsc → eslint, no npm test | ✓ VERIFIED | Executable; correct command order; `npm test` absent. |
| `.gitleaks.toml` | Custom Resend + Upstash rules + allowlist | ✓ VERIFIED | `useDefault = true`; three custom rules; `.env.example` allowlisted both by path and by literal placeholder regex. |
| `.vercel/project.json` | Vercel link to Quibly team | ✓ VERIFIED | `projectId: prj_eIcQO4LIyRSrIi5qHTpIJFnvEbsI`, `orgId: team_rOgELYe0YDrEgFsZEMjLMh3i` (team_ prefix confirms team-scope per D-15). Untracked (gitignored). |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `app/layout.tsx` next/font loaders | `app/globals.css` `@theme inline { --font-heading: var(--font-quicksand); --font-sans: var(--font-figtree); }` | CSS variables on `<html>` className | ✓ WIRED | `<html className={`${quicksand.variable} ${figtree.variable} h-full antialiased`}>` confirmed; globals.css `@theme inline` block maps both. |
| Tailwind utility `font-heading` | Quicksand font | globals.css mapping | ✓ WIRED | `--font-heading: var(--font-quicksand)` present in globals.css; `app/page.tsx` h1 uses `font-heading`. |
| Tailwind utility `font-sans` | Figtree font | globals.css mapping | ✓ WIRED | `--font-sans: var(--font-figtree)` present. |
| `components/quibs/quibs-avatar.tsx` | `components/quibs/quibs-icon.tsx` | `import { QuibsIcon } from '@/components/quibs/quibs-icon'` | ✓ WIRED | Import line confirmed in avatar. |
| `components/quibs/quibs-avatar.tsx` | `lib/utils.ts` (cn) | `import { cn } from '@/lib/utils'` | ✓ WIRED | Import line confirmed. |
| `app/page.tsx` | `components/ui/button.tsx` | `import { Button } from '@/components/ui/button'` | ✓ WIRED | Import + JSX confirmed. |
| `app/page.tsx` | `components/quibs/quibs-icon.tsx` | `import { QuibsIcon } from '@/components/quibs/quibs-icon'` | ✓ WIRED | Import + JSX confirmed; `text-primary` className drives oklch teal via currentColor. |
| `.husky/pre-commit` | `.gitleaks.toml` | `gitleaks protect --staged --redact -c .gitleaks.toml` | ✓ WIRED | Exact command present in hook. |
| `eslint.config.mjs` | `eslint-rules/index.js` | `createRequire` + `plugins: { custom: localRules }` | ✓ WIRED | Pattern present. |
| **any future production module** | `lib/env.ts` | `import { env } from '@/lib/env'` | ✗ **NOT_WIRED** | **Zero modules import @/lib/env.** Smoke-grep returns no hits across `app/`, `components/`, `lib/utils.ts`, `next.config.ts`. The "single sanctioned env reader" pattern has no readers; the schema is dormant in production. |
| `lib/env.ts` | Zod schema | `envSchema.parse(process.env)` at module load | ⚠ STATIC | The line exists at line 37 but the module is never loaded by production code (the only import path is the synthetic `node -e require("./lib/env.ts")` test in Plan 01-01). |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `app/page.tsx` | (renders static labels: "Quibly", "Lorem ipsum", "Smoke test") | hardcoded | N/A — static smoke test | ✓ FLOWING (n/a — no dynamic data is expected at Phase 1; D-12 mandates throwaway static page) |
| `lib/env.ts` `env` | parsed env values | `process.env` (DOM at module load) | Schema is correct in isolation, but **NOT EVALUATED** during `npm run build` or `npm run dev` because no consumer imports it. | ✗ DISCONNECTED |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Build succeeds with valid env | `npm run build` (with `.env.local` populated from `.env.example` placeholders) | exit 0, 3 static pages prerendered | ✓ PASS |
| Build crashes with missing env (SC #4) | `cat /dev/null > .env.local && npm run build` | **exit 0** (no Zod crash; lib/env.ts never imported) | ✗ **FAIL** — SC #4 invariant unverified by production code path |
| TypeScript project-wide check | `tsc --noEmit` | exit 0, no errors | ✓ PASS |
| ESLint full project | `npm run lint` | exit 0, no errors | ✓ PASS |
| Custom ESLint rule unit test | `node eslint-rules/no-raw-process-env.test.js` | exit 0, prints "PASS: no-raw-process-env rule tests passed" | ✓ PASS |
| Gitleaks blocks fake re_ key (raw `gitleaks protect`) | stage `re_TESTSECRET12345678901` → `gitleaks protect --staged --redact -c .gitleaks.toml` | exit 1, "leaks found: 1" | ✓ PASS |
| Gitleaks under husky's wrapper invocation | `.husky/_/pre-commit` (the exact path git invokes via `core.hooksPath=.husky/_`) with fake re_ key staged | exit 1, "husky - pre-commit script failed (code 1)" | ✓ PASS |
| Husky wrapper handles missing gitleaks (BL-01 contributor scenario) | `PATH="/usr/bin:/bin" .husky/_/pre-commit` | exit 127, "gitleaks: command not found" + "husky - pre-commit script failed (code 127)" | ✓ PASS — falsifies BL-01 |
| Banned deps absent | check package.json + package-lock.json + node_modules for next-themes / @tailwindcss/typography / react-hook-form / framer-motion | All four absent in all three locations | ✓ PASS |
| `lib/env.ts` is byte-correct in isolation | (Plan 01-01 ran a synthetic `node -e ...` test; the schema does throw ZodError when invoked with empty env) | n/a (synthetic test, not run again) | ✓ PASS (artifact correct) but doesn't satisfy SC #4 alone |
| Vercel link present | `cat .vercel/project.json` | Valid JSON with projectId + orgId; `team_` prefix confirms team scope | ✓ PASS |
| Visual parity (4 D-12 surfaces) | User-driven smoke test at http://localhost:3000 | Confirmed approved by user (per orchestrator context) | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| INFRA-01 | 01-01 | Project scaffolded with Next.js 16.2, React 19.2, TypeScript, Tailwind v4 | ✓ SATISFIED | All version pins match marketing-app; `npm run build` succeeds. |
| INFRA-02 | 01-02 | Quibly design tokens copied verbatim from marketing-app/app/globals.css | ✓ SATISFIED | globals.css diff vs marketing-app: 1 deletion (typography plugin), 0 additions. All key tokens present. |
| INFRA-03 | 01-02 | Quicksand + Figtree via next/font/google with display: 'swap', subsets: ['latin'] | ✓ SATISFIED | `app/layout.tsx` confirms exact pattern; weight pin `["400","500","600","700"]`. |
| INFRA-04 | 01-02 | Quibs Q-face mascot SVG in public/ and as a reusable React component | ✓ SATISFIED | `public/quibs-icon.svg` (4422 bytes); `components/quibs/quibs-icon.tsx` byte-identical to marketing-app. |
| INFRA-05 | 01-03 | shadcn/ui CLI v4 initialized with button, input, label, sonner, **form** components | ⚠ PARTIAL | button/input/label/sonner all byte-identical (or with documented sonner deviation). **`form.tsx` is INTENTIONALLY ABSENT**, deferred to Phase 3 per planner option A; ROADMAP plan list documents this as "form deferred to Phase 3". |
| INFRA-06 | 01-01 | `lib/env.ts` Zod-validated environment variables (no raw process.env reads in app code) | ⚠ ARTIFACT-OK / GUARDS-OK / DORMANT | File exists; Zod schema is correctly structured. ESLint custom rule `custom/no-raw-process-env` enforces "no raw process.env reads outside lib/env.ts" (rule unit-tested). **However, `lib/env.ts` is itself not consumed by any production module — the validated `env` object is never read.** No raw process.env reads in app code (the rule's primary invariant) is satisfied. |
| INFRA-07 | (Phase 4) | `import 'server-only'` guard on lib/resend.ts and any module touching RESEND_API_KEY | ⚠ DEFERRED-PER-PLAN | Plan 01-01 explicitly defers to Phase 4 per CD-05 (`lib/resend.ts` is the first module to add `'server-only'`). No module currently touches RESEND_API_KEY (because lib/env.ts isn't imported), so technically the requirement has no application yet. Plan summary marks INFRA-07 as completed; the requirement is contingent on Phase 4 work. |
| INFRA-08 | 01-04 | gitleaks pre-commit hook prevents secret commits | ✓ SATISFIED | gitleaks 8.30.1 installed; `.gitleaks.toml` rules valid; husky's git-invoked wrapper (`sh -e`) ensures non-zero gitleaks exit and missing-binary scenarios both abort the commit (verified empirically). BL-01 from review is REFUTED by the empirical husky-wrapper test. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `lib/env.ts` | (whole file) | Module written but not imported anywhere | ⚠ Warning | Dead code in Phase 1; the boot-crash invariant the plan claims is not actually exercised. Will become live in Phase 4 when `lib/resend.ts` imports it, but Phase 1 SC #4 is empirically unmet. |
| `app/layout.tsx` line 20, 26 | metadataBase URL `useQuibly.com` (mixed case) vs WHATWG-normalized `usequibly.com` | ⚠ Warning (WR-02 in review) | Two URL representations may split signal at integration boundaries; cheap to fix now. |
| `app/globals.css` 158–321 | Sidebar tokens, Schedule-X overrides, .prose styles — dead bytes per strict-D-04 reading | ℹ Info (WR-06 in review) | Bloat (~6 KB raw). Line 199 has `hsl(var(--border))` where `--border` is `oklch()` — broken value, but no consumer exists. |
| `eslint-rules/no-raw-process-env.test.js` | n/a | Test file exists but no automated runner invokes it (no script in package.json, not in pre-commit hook) | ⚠ Warning (WR-01 in review) | A regression in the rule's allowlist would silently ship. |
| `components/ui/sonner.tsx` | (whole file) | `<Toaster>` exported but never mounted; `app/layout.tsx` omits the portal | ⚠ Warning (WR-05 in review) | Phase 1 ships sonner.tsx as INFRA-05 enumerates it; Phase 3 mounts it. Acceptable per plan but means INFRA-05's "wired to Quibly tokens" surface is not visually tested in Phase 1. |
| `components/ui/button.tsx` | line 12 | `default` variant has hover state restricted to anchor children only (`[a]:hover:bg-primary/80`) | ℹ Info (IN-01 in review) | Verbatim from marketing-app; will look non-interactive on a `<button type="submit">`. Phase 3 concern. |
| `tsconfig.json` | line 3 | `target: "ES2017"` (verbatim from marketing-app) | ℹ Info (IN-02 in review) | Type-check-time-only effect; no production impact. |
| `.husky/pre-commit` | line 8 | `gitleaks protect` subcommand was renamed to `gitleaks git --staged --pre-commit` in v8.19+ (still works as alias in v8.21) | ℹ Info (IN-03 in review) | Future deprecation; no current breakage. |
| `.gitleaks.toml` | lines 48–52 | Placeholder regex allowlist is fragile if .env.example placeholder text is ever changed | ℹ Info (IN-04 in review) | Path allowlist already covers .env.example; regex is defense-in-depth. |
| `eslint.config.mjs` | lines 14–32 | Triple redundancy: `files` glob + per-block `ignores` + `globalIgnores` | ℹ Info (IN-05 in review) | Correct but obscure; future contributor may not understand which is load-bearing. |

### Deviations from Code Review (01-REVIEW.md)

The code review's BLOCKER (BL-01) was claimed to be a real defense-in-depth gap: "Pre-commit hook silently bypasses gitleaks if binary is missing" because the script lacks `set -e`.

**Empirically REFUTED by this verification.** Git invokes `.husky/_/pre-commit` (per `core.hooksPath=.husky/_`), which sources `.husky/_/h`, which calls `sh -e "$s" "$@"`. The `-e` flag is enforced by husky 9's wrapper regardless of the user-script's content. Tests:

- `.husky/_/pre-commit` with fake re_ key staged → exit 1 + "husky - pre-commit script failed (code 1)" ✓
- `PATH="/usr/bin:/bin" .husky/_/pre-commit` → exit 127 + "gitleaks: command not found" + "husky - pre-commit script failed (code 127)" ✓

The reviewer's reasoning was based on running the hook directly (without the wrapper), which is not how git invokes it. INFRA-08's invariant holds in practice.

That said, BL-01's *secondary* concern (contributor onboarding friction when gitleaks is missing) is partially valid: a fresh contributor will see exit 127 with the cryptic "command not found" rather than a friendly install hint. This is a UX improvement, not a security gap. Adding `set -e` and an explicit `command -v gitleaks` check (per the review's suggested fix) would make the failure mode more legible — but it does not change the security posture.

### Human Verification Required

1. **Re-run gitleaks block test under git's actual hook invocation path**

   **Test:** Stage a fake `RESEND_API_KEY=re_REALWORLDFAKEKEY1234` in a working-tree file and run `git commit -m "test"` on a real branch.
   **Expected:** The commit aborts with exit 1 + "husky - pre-commit script failed (code 1)".
   **Why human:** The verifier already exercised `.husky/_/pre-commit` directly and via `sh -e` and confirmed both block. A real `git commit` call across the contributor's day-to-day workflow is the canonical confirmation of the husky-9-wrapper contract assumed by INFRA-08.

### Gaps Summary

**The phase goal — "design tokens, fonts, mascot, and secret-handling posture match marketing-app exactly" — is achieved on the brand-token surface (tokens, fonts, mascot, shadcn components excluding form.tsx) and on the secret-handling posture (gitleaks pre-commit gate works under husky's wrapper).**

**The single material gap is on the env-handling posture (Phase 1 SC #4):** `lib/env.ts` is written correctly but is not imported by any production code, so the "boot crashes loud on missing env" invariant — which the phase describes as observable — is not actually observable from any production code path. `npm run build` exits 0 with empty `.env.local`. The synthetic isolation test Plan 01-01 ran (`node -e require("./lib/env.ts")`) does not equal what users experience.

**Closure plan for the gap (one-line fix):** add `import '@/lib/env'` (side-effect import) to `app/layout.tsx`. This makes every page render path go through env validation. Cost: zero runtime impact; gain: SC #4 becomes empirically verifiable. After the fix, re-run `cat /dev/null > .env.local && npm run build` and confirm a non-zero exit with a ZodError listing all six missing keys.

The remaining items are documented deferrals (form.tsx → Phase 3, INFRA-07's `'server-only'` → Phase 4) consistent with the planner's stated decisions and the ROADMAP plan listing. They do not need closure plans within Phase 1.

---

_Verified: 2026-04-27T20:55:00Z_
_Verifier: Claude (gsd-verifier)_
