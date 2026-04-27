---
phase: 01-scaffold-brand-token-parity
verified: 2026-04-27T20:55:00Z
re_verified: 2026-04-27T21:35:00Z
status: passed
score: 5/5 ROADMAP success criteria verified
overrides_applied: 1
override_note: "User approved (2026-04-27) on the basis of the verifier-level husky-wrapper simulation; the real-`git commit` gitleaks block test remains tracked in 01-HUMAN-UAT.md as belt-and-suspenders confirmation, not a gate."
re_verification:
  previous_status: gaps_found
  previous_score: 4/5
  gaps_closed:
    - "The app crashes at boot with a helpful Zod error if any Resend/Upstash env var is missing — never on first signup (Phase 1 SC #4)."
  gaps_remaining: []
  regressions: []
gaps: []
gaps_closed:
  - truth: "The app crashes at boot with a helpful Zod error if any Resend/Upstash env var is missing — never on first signup (Phase 1 SC #4)."
    status: closed
    closed_by: "Plan 01-06 (commit 8b70fea)"
    closed_at: "2026-04-27T21:22:18Z"
    closure_evidence:
      - "app/layout.tsx line 4 is `import \"@/lib/env\";` — verified by `grep -nE \"^import ['\\\"]@/lib/env['\\\"];?$\" app/layout.tsx` returning `4:import \"@/lib/env\";`"
      - "Empirical: `cat /dev/null > .env.local && npm run build` exited 1 (`/tmp/quibly-build-empty.log` captured by Plan 01-06 still on disk; this verifier independently re-confirmed: contains literal `ZodError`; `grep -cE \"RESEND_API_KEY|RESEND_AUDIENCE_ID|RESEND_AUDIENCE_PREVIEW_ID|RESEND_WEBHOOK_SECRET|UPSTASH_REDIS_REST_URL|UPSTASH_REDIS_REST_TOKEN\"` returns 6 — every required key listed once in the issues array)."
      - "Success-path regression check: `/tmp/quibly-build-restored.log` shows `Generating static pages using 4 workers (3/3)`, `┌ ○ /`, `└ ○ /_not-found`, exit 0 — same 3-page baseline as Plans 01-01 and 01-05."
      - "`.env.local` byte-identity confirmed: md5 `4bf92fe08b9c58eb4adc58992e663d79` matches between `/tmp/quibly-env-snapshot` (pre-test) and live `.env.local` (post-test); `diff -q` returns clean."
      - "tsc --noEmit, eslint app/layout.tsx, and eslint app/layout.tsx --rule '{\"custom/no-raw-process-env\":\"error\"}' all exit 0 after the edit."
human_verification:
  - test: "Re-run gitleaks block test under git's actual hook invocation path"
    expected: "git commit -m \"x\" with a fake re_ key staged should be rejected with `husky - pre-commit script failed (code 1)`"
    why_human: "The verifier already simulated this via `.husky/_/pre-commit` and via `sh -e .husky/pre-commit` (both block correctly with exit 1 / 127). A real `git commit` invocation across the user's day-to-day workflow is the canonical confirmation; the simulations match husky 9's contract but a true `git commit` test on a real branch is the human-eyes signal. NOT a blocker for phase completion — INFRA-08 is empirically verified at the code path that matters; this is the human-eyes belt-and-suspenders signal."
---

# Phase 1: Scaffold + Brand Token Parity — Verification Report

**Phase Goal:** "A running Next.js 16 + Tailwind v4 app whose design tokens, fonts, mascot, and secret-handling posture match `marketing-app` exactly, so brand contract drift is impossible from day one."

**Initial verified:** 2026-04-27T20:55:00Z (status: gaps_found, 4/5)
**Re-verified:** 2026-04-27T21:35:00Z (status: human_needed, 5/5 — gap closed)
**Status:** human_needed (one outstanding human-eyes signal; no remaining code gaps)

---

## Re-Verification Summary (2026-04-27T21:35:00Z)

This is a gap-closure re-verification. The original verification at the bottom of this file flagged one gap on Phase 1 SC #4: `lib/env.ts` was structurally correct but never imported by any production module, so the boot-crash invariant was unobservable from a real `npm run build`.

Plan 01-06 (commit `8b70fea`) added a one-line side-effect import to `app/layout.tsx`:

```diff
 import type { Metadata } from "next";
 import { Quicksand, Figtree } from "next/font/google";
 import "./globals.css";
+import "@/lib/env";

 const quicksand = Quicksand({
```

### Closure checks (re-verification, 2026-04-27T21:35:00Z)

| Check | Command | Expected | Observed | Status |
|-------|---------|----------|----------|--------|
| Side-effect import present | `grep -nE "^import [\"']@/lib/env[\"'];?$" app/layout.tsx` | line 4 | `4:import "@/lib/env";` | ✓ PASS |
| globals.css still on line 3 | `sed -n '3p' app/layout.tsx` | `import "./globals.css";` | `import "./globals.css";` | ✓ PASS |
| Quicksand+Figtree still wired | `grep -E "Quicksand\(|Figtree\(" app/layout.tsx` | both hits | `const quicksand = Quicksand({`, `const figtree = Figtree({` | ✓ PASS |
| Layout total length | `wc -l app/layout.tsx` | 41 | 41 | ✓ PASS |
| `lib/env.ts` unchanged | `git diff HEAD -- lib/env.ts` | no diff | empty | ✓ PASS |
| TypeScript check | `tsc --noEmit` | exit 0 | exit 0 | ✓ PASS |
| ESLint on layout | `eslint app/layout.tsx` | exit 0 | exit 0 | ✓ PASS |
| Custom rule OK on layout | `eslint app/layout.tsx --rule '{"custom/no-raw-process-env":"error"}'` | exit 0 (side-effect import is not a `process.env` read) | exit 0 | ✓ PASS |
| `.env.local` not tracked | `git ls-files .env.local` | empty | empty | ✓ PASS |
| `git status --short` clean | `git status --short` | empty | empty | ✓ PASS |
| Empty-env build empirically crashed (cross-ref Plan 01-06) | `/tmp/quibly-build-empty.log` exists, contains `ZodError`, 6 key hits | `ZodError` + 6 | confirmed: ZodError present, `grep -cE "RESEND_API_KEY\|...UPSTASH_REDIS_REST_TOKEN"` returns 6 | ✓ PASS |
| Success-path build still works (cross-ref Plan 01-06) | `/tmp/quibly-build-restored.log` shows 3 pages prerendered | `(3/3)`, `○ /`, `○ /_not-found` | confirmed: `Generating static pages using 4 workers (3/3)` + both `○` markers + `○ (Static) prerendered as static content` | ✓ PASS |
| `.env.local` byte-identical pre/post (cross-ref Plan 01-06) | md5 of `.env.local` vs `/tmp/quibly-env-snapshot` | match | both `4bf92fe08b9c58eb4adc58992e663d79`, `diff -q` clean | ✓ PASS |

The gap is **fully closed**. Phase 1 SC #4 is now empirically observable from a production code path. No regressions introduced — success-path build still produces the same 3-static-page baseline.

### What changed since the initial verification

| Field | Initial (2026-04-27T20:55:00Z) | Re-verified (2026-04-27T21:35:00Z) |
|-------|---------------------------------|------------------------------------|
| `status` | `gaps_found` | `human_needed` (no code gaps; one human-eyes test outstanding) |
| `score` | 4/5 | 5/5 |
| `gaps[0].status` | `failed` | `closed` (moved to `gaps_closed[]`) |
| Re-verification metadata | n/a | `re_verification.gaps_closed` documents the resolution |

The pre-existing human verification item (gitleaks block under real `git commit`) is **unchanged** — it was already documented in the initial verification as a human-eyes signal, not a code gap. INFRA-08's invariant was empirically verified at the simulation level (`.husky/_/pre-commit` direct invocation matches what git invokes) — the human-verification item is the canonical day-to-day-workflow confirmation, not a blocker.

---

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A blank page renders in Quibly teal/amber with Quicksand headings and Figtree body, visually indistinguishable from marketing-app's tokens (oklch primary, radius scale, font CSS variables verbatim). | ✓ VERIFIED | User confirmed via interactive smoke-test at http://localhost:3000 (per orchestrator context). `app/globals.css` diff vs marketing-app shows exactly 1 deletion (the typography plugin) and 0 additions. Critical tokens present: `--primary: oklch(0.6002 0.1038 184.704)`, `--font-heading: var(--font-quicksand)`, `--font-sans: var(--font-figtree)`, `--radius-4xl`. `app/layout.tsx` wires Quicksand+Figtree via `next/font/google` with both `--font-quicksand` and `--font-figtree` CSS variables on `<html>`. `npm run build` exits 0 (3 static pages prerendered). |
| 2 | The Quibs Q-face mascot renders in the page as a reusable React component sourced from `public/`. | ✓ VERIFIED | `components/quibs/quibs-icon.tsx` byte-identical to marketing-app analog. `components/quibs/quibs-avatar.tsx` byte-identical to marketing-app analog. `public/quibs-icon.svg` exists at exactly 4422 bytes. `app/page.tsx` line 31 renders `<QuibsIcon className="text-primary size-12" />`. User confirmed teal rendering via interactive smoke-test. |
| 3 | shadcn button/input/label/sonner/form components are installed and styled to Quibly tokens (no default shadcn neutral). | ⚠ PARTIAL (DEFERRAL) | `button.tsx`, `input.tsx`, `label.tsx` byte-identical to marketing-app. `sonner.tsx` ports with documented next-themes deviation (theme="light" hardcoded; banned-dep removal verified). **`form.tsx` is INTENTIONALLY ABSENT** — Plan 01-03 documents this as planner option A; ROADMAP plan list explicitly states "form deferred to Phase 3"; CLAUDE.md "What NOT to Use" bans react-hook-form which form.tsx depends on. This is a documented deferral consistent with the ROADMAP. |
| 4 | The app crashes at boot with a helpful Zod error if any Resend/Upstash env var is missing — never on first signup. | ✓ **VERIFIED (gap closed by Plan 01-06)** | `app/layout.tsx` line 4 is `import "@/lib/env";` (side-effect import). On every server boot, RSC render, and `next build`, the layout module-load triggers `lib/env.ts` module-load, which calls `envSchema.parse(process.env)` at line 37. Empirical re-proof: `cat /dev/null > .env.local && npm run build` exits 1 with a ZodError listing all six required keys (`/tmp/quibly-build-empty.log` independently re-checked — `ZodError` literal present; `grep -c` of all six keys = 6). `.env.local` byte-identical pre/post (md5 match). Success-path build still exits 0 with 3 static pages prerendered (no regression). The "first signup" failure mode is structurally impossible because the schema crashes the build (and hence the deploy) before any signup code ever runs. |
| 5 | A `gitleaks` pre-commit hook blocks any attempt to commit a string matching `re_*` (Resend key) or other secret patterns. | ✓ VERIFIED | `.husky/pre-commit` exists (executable; runs gitleaks → tsc → eslint, no `npm test`). `.gitleaks.toml` defines `resend-api-key`, `upstash-rest-token`, `upstash-rest-url` rules; allowlists `.env.example`, `.planning/**.md`, `CLAUDE.md`, `README.md`. `gitleaks` 8.30.1 installed at `/opt/homebrew/bin/gitleaks`. Empirical block test (initial verification): staging `RESEND_API_KEY=re_TESTSECRET12345678901` produces gitleaks exit 1, "leaks found: 1". Empirical via husky's actual git-invoked path (`.husky/_/pre-commit`): exit 1 with "husky - pre-commit script failed (code 1)". Human-verification item (real `git commit` test) outstanding as the day-to-day-workflow signal. |

**Score:** **5/5 ROADMAP success criteria verified** (one PARTIAL with documented Phase-3 deferral, none failing).

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` | Pinned next 16.2.1, react 19.2.4, zod ^4.0, no banned deps | ✓ VERIFIED | All version pins match marketing-app for shared deps. `zod ^4.0.0` present. `next-themes`, `@tailwindcss/typography`, `react-hook-form`, `framer-motion` all absent from dependencies/devDependencies AND from node_modules. |
| `tsconfig.json` | strict: true, `@/*` alias | ✓ VERIFIED | Per Plan 01-01 SUMMARY: byte-identical to marketing-app/tsconfig.json. |
| `next.config.ts` | Empty NextConfig (no turbopack.root) | ✓ VERIFIED | 101 bytes; CD-04 satisfied (no monorepo workaround). |
| `postcss.config.mjs` | Tailwind v4 PostCSS adapter | ✓ VERIFIED | Contains `@tailwindcss/postcss`. |
| `components.json` | shadcn style: radix-nova | ✓ VERIFIED | `style: "radix-nova"` confirms barrel imports in button.tsx; `tailwind.css: "app/globals.css"`. |
| `lib/utils.ts` | cn() byte-identical to marketing-app | ✓ VERIFIED | `diff` returns empty (byte-identical). |
| `lib/env.ts` | Zod schema for all 6 env vars; .parse() at module load; no NODE_ENV; no server-only | ✓ VERIFIED (now WIRED) | File present and structurally correct. **Imported as side-effect by `app/layout.tsx` line 4 (commit 8b70fea).** No diff vs HEAD on the file itself. |
| `.env.example` | All 6 vars with deterministic placeholders | ✓ VERIFIED | 6 KEY=value lines; Resend `re_xxx...`, Upstash placeholders; not gitignored. |
| `.gitignore` | `.env*.local` excluded | ✓ VERIFIED | Pattern present; `.env.local` and `.vercel/project.json` confirmed not tracked by git. |
| `app/globals.css` | Verbatim - typography plugin line | ✓ VERIFIED | 319 lines vs marketing-app's 320 (exactly one deletion: `@plugin "@tailwindcss/typography";`). All key tokens present. |
| `app/layout.tsx` | Quicksand+Figtree CSS vars on `<html>`; side-effect import of `@/lib/env`; no Toaster mount in Phase 1 | ✓ VERIFIED | Both fonts loaded with `subsets: ["latin"]`, weight pin, `display: "swap"`. `metadataBase: https://useQuibly.com`. **Line 4: `import "@/lib/env";` (commit 8b70fea).** No `<Toaster />` mount (Phase 3 mounts it). 41 lines total. |
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
| `app/layout.tsx` | `lib/env.ts` | `import "@/lib/env";` (side-effect import on line 4) | ✓ **WIRED (gap closed)** | grep `^import ["']@/lib/env["'];?$` returns `4:import "@/lib/env";`. The schema is now exercised on every layout module-load. |
| `lib/env.ts` | Zod schema | `envSchema.parse(process.env)` at module load | ✓ FLOWING | Line 37 fires on layout load → on every page render path and on `next build`. Empirically: `cat /dev/null > .env.local && npm run build` exits 1 with ZodError listing all six keys. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `app/page.tsx` | (renders static labels: "Quibly", "Lorem ipsum", "Smoke test") | hardcoded | N/A — static smoke test | ✓ FLOWING (n/a — no dynamic data is expected at Phase 1; D-12 mandates throwaway static page) |
| `lib/env.ts` `env` | parsed env values | `process.env` (read at module load via `app/layout.tsx` side-effect import) | Schema is correct AND now evaluated during `npm run build` and on every RSC render path. | ✓ **FLOWING (gap closed)** |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Build succeeds with valid env | `npm run build` (with `.env.local` populated from `.env.example` placeholders) | exit 0, 3 static pages prerendered | ✓ PASS |
| Build crashes with missing env (SC #4) | `cat /dev/null > .env.local && npm run build` | **exit 1, ZodError, 6 keys listed** (`/tmp/quibly-build-empty.log` from Plan 01-06; independently cross-checked) | ✓ **PASS (gap closed)** |
| TypeScript project-wide check | `tsc --noEmit` (re-run 2026-04-27T21:35:00Z) | exit 0, no errors | ✓ PASS |
| ESLint on layout (re-run after edit) | `eslint app/layout.tsx` | exit 0, no errors | ✓ PASS |
| ESLint custom rule on layout (re-run after edit) | `eslint app/layout.tsx --rule '{"custom/no-raw-process-env":"error"}'` | exit 0 (side-effect import is not a `process.env` read) | ✓ PASS |
| Custom ESLint rule unit test | `node eslint-rules/no-raw-process-env.test.js` | exit 0, prints "PASS: no-raw-process-env rule tests passed" | ✓ PASS |
| Gitleaks blocks fake re_ key (raw `gitleaks protect`) | stage `re_TESTSECRET12345678901` → `gitleaks protect --staged --redact -c .gitleaks.toml` | exit 1, "leaks found: 1" | ✓ PASS |
| Gitleaks under husky's wrapper invocation | `.husky/_/pre-commit` (the exact path git invokes via `core.hooksPath=.husky/_`) with fake re_ key staged | exit 1, "husky - pre-commit script failed (code 1)" | ✓ PASS |
| Husky wrapper handles missing gitleaks (BL-01 contributor scenario) | `PATH="/usr/bin:/bin" .husky/_/pre-commit` | exit 127, "gitleaks: command not found" + "husky - pre-commit script failed (code 127)" | ✓ PASS — falsifies BL-01 |
| Banned deps absent | check package.json + package-lock.json + node_modules for next-themes / @tailwindcss/typography / react-hook-form / framer-motion | All four absent in all three locations | ✓ PASS |
| `lib/env.ts` is byte-correct | `git diff HEAD -- lib/env.ts` | empty (no functional drift since Plan 01-01) | ✓ PASS |
| `.env.local` byte-identical pre/post destructive test | md5 of `.env.local` vs `/tmp/quibly-env-snapshot` | `4bf92fe08b9c58eb4adc58992e663d79` both | ✓ PASS |
| `git status --short` clean | `git status --short` | empty | ✓ PASS |
| `.env.local` not tracked | `git ls-files .env.local` | empty | ✓ PASS |
| Vercel link present | `cat .vercel/project.json` | Valid JSON with projectId + orgId; `team_` prefix confirms team scope | ✓ PASS |
| Visual parity (4 D-12 surfaces) | User-driven smoke test at http://localhost:3000 | Confirmed approved by user (per orchestrator context) | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| INFRA-01 | 01-01 | Project scaffolded with Next.js 16.2, React 19.2, TypeScript, Tailwind v4 | ✓ SATISFIED | All version pins match marketing-app; `npm run build` succeeds. |
| INFRA-02 | 01-02 | Quibly design tokens copied verbatim from marketing-app/app/globals.css | ✓ SATISFIED | globals.css diff vs marketing-app: 1 deletion (typography plugin), 0 additions. All key tokens present. |
| INFRA-03 | 01-02 | Quicksand + Figtree via next/font/google with display: 'swap', subsets: ['latin'] | ✓ SATISFIED | `app/layout.tsx` confirms exact pattern; weight pin `["400","500","600","700"]`. |
| INFRA-04 | 01-02 | Quibs Q-face mascot SVG in public/ and as a reusable React component | ✓ SATISFIED | `public/quibs-icon.svg` (4422 bytes); `components/quibs/quibs-icon.tsx` byte-identical to marketing-app. |
| INFRA-05 | 01-03 | shadcn/ui CLI v4 initialized with button, input, label, sonner, **form** components | ⚠ PARTIAL (DEFERRED) | button/input/label/sonner all byte-identical (or with documented sonner deviation). **`form.tsx` is INTENTIONALLY ABSENT**, deferred to Phase 3 per planner option A; ROADMAP plan list documents this as "form deferred to Phase 3". |
| INFRA-06 | 01-01 + 01-06 | `lib/env.ts` Zod-validated environment variables (no raw process.env reads in app code) | ✓ **SATISFIED (closed by Plan 01-06)** | File exists; Zod schema is correctly structured. ESLint custom rule `custom/no-raw-process-env` enforces "no raw process.env reads outside lib/env.ts" (rule unit-tested). **`app/layout.tsx` line 4 now imports `@/lib/env` as a side-effect**, so the schema runs on every render path and every `next build`. Empirical: empty-env build crashes non-zero with ZodError listing all six keys. |
| INFRA-07 | (Phase 4) | `import 'server-only'` guard on lib/resend.ts and any module touching RESEND_API_KEY | ⚠ DEFERRED-PER-PLAN | Plan 01-01 explicitly defers to Phase 4 per CD-05 (`lib/resend.ts` is the first module to add `'server-only'`). No module currently touches RESEND_API_KEY (the layout side-effect import only triggers schema evaluation; it does not read `env.RESEND_API_KEY`). The requirement is contingent on Phase 4 work. |
| INFRA-08 | 01-04 | gitleaks pre-commit hook prevents secret commits | ✓ SATISFIED | gitleaks 8.30.1 installed; `.gitleaks.toml` rules valid; husky's git-invoked wrapper (`sh -e`) ensures non-zero gitleaks exit and missing-binary scenarios both abort the commit (verified empirically). BL-01 from review is REFUTED by the empirical husky-wrapper test. Human-verification item (real `git commit`) outstanding as the day-to-day-workflow signal. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| ~~`lib/env.ts`~~ | ~~(whole file)~~ | ~~Module written but not imported anywhere~~ | ✓ **CLOSED** | Closed by Plan 01-06: `app/layout.tsx` line 4 imports `@/lib/env` as a side-effect. |
| `app/layout.tsx` line 21, 27 | metadataBase URL `useQuibly.com` (mixed case) vs WHATWG-normalized `usequibly.com` | ⚠ Warning (WR-02 in review) | Two URL representations may split signal at integration boundaries; cheap to fix now. (Unchanged from initial verification.) |
| `app/globals.css` 158–321 | Sidebar tokens, Schedule-X overrides, .prose styles — dead bytes per strict-D-04 reading | ℹ Info (WR-06 in review) | Bloat (~6 KB raw). Line 199 has `hsl(var(--border))` where `--border` is `oklch()` — broken value, but no consumer exists. (Unchanged.) |
| `eslint-rules/no-raw-process-env.test.js` | n/a | Test file exists but no automated runner invokes it (no script in package.json, not in pre-commit hook) | ⚠ Warning (WR-01 in review) | A regression in the rule's allowlist would silently ship. (Unchanged.) |
| `components/ui/sonner.tsx` | (whole file) | `<Toaster>` exported but never mounted; `app/layout.tsx` omits the portal | ⚠ Warning (WR-05 in review) | Phase 1 ships sonner.tsx as INFRA-05 enumerates it; Phase 3 mounts it. Acceptable per plan but means INFRA-05's "wired to Quibly tokens" surface is not visually tested in Phase 1. (Unchanged.) |
| `components/ui/button.tsx` | line 12 | `default` variant has hover state restricted to anchor children only (`[a]:hover:bg-primary/80`) | ℹ Info (IN-01 in review) | Verbatim from marketing-app; will look non-interactive on a `<button type="submit">`. Phase 3 concern. (Unchanged.) |
| `tsconfig.json` | line 3 | `target: "ES2017"` (verbatim from marketing-app) | ℹ Info (IN-02 in review) | Type-check-time-only effect; no production impact. (Unchanged.) |
| `.husky/pre-commit` | line 8 | `gitleaks protect` subcommand was renamed to `gitleaks git --staged --pre-commit` in v8.19+ (still works as alias in v8.21) | ℹ Info (IN-03 in review) | Future deprecation; no current breakage. (Unchanged.) |
| `.gitleaks.toml` | lines 48–52 | Placeholder regex allowlist is fragile if .env.example placeholder text is ever changed | ℹ Info (IN-04 in review) | Path allowlist already covers .env.example; regex is defense-in-depth. (Unchanged.) |
| `eslint.config.mjs` | lines 14–32 | Triple redundancy: `files` glob + per-block `ignores` + `globalIgnores` | ℹ Info (IN-05 in review) | Correct but obscure; future contributor may not understand which is load-bearing. (Unchanged.) |
| `app/layout.tsx` line 4 | Side-effect import is at risk of well-meaning removal (T-01-07) | ℹ Info | A future contributor could flag `import "@/lib/env";` as an "unused side-effect import" and remove it. Mitigations: (a) Phase 4's `lib/resend.ts` becomes the first NAMED consumer (`import { env } from '@/lib/env';`), making the layout import a documented secondary guarantor; (b) the grep invariant `^import ["']@/lib/env["'];?$` is now a re-verification check; (c) the canonical regression test `cat /dev/null > .env.local && npm run build` exits non-zero is documented in 01-06-SUMMARY for any future Phase 1 audit. |

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
   **Why human:** The verifier already exercised `.husky/_/pre-commit` directly and via `sh -e` and confirmed both block. A real `git commit` call across the contributor's day-to-day workflow is the canonical confirmation of the husky-9-wrapper contract assumed by INFRA-08. **Not a blocker** — INFRA-08 is empirically verified at the code path that matters (`.husky/_/pre-commit` is exactly what git invokes). This human-eyes test is belt-and-suspenders, retained from the initial verification.

### Gaps Summary

**Status: 5/5 ROADMAP success criteria verified. The single material gap from the initial verification (SC #4 — boot-crash invariant unwired) was closed by Plan 01-06 (commit `8b70fea`).**

The phase goal — "design tokens, fonts, mascot, and secret-handling posture match marketing-app exactly, so brand contract drift is impossible from day one" — is achieved on every dimension:

- **Brand-token surface** (tokens, fonts, mascot, shadcn components excluding form.tsx): ✓
- **Secret-handling posture** (gitleaks pre-commit gate works under husky's wrapper, ESLint custom rule blocks raw `process.env` reads, `.env.local` is gitignored, Vercel link present): ✓
- **Env-handling posture (Phase 1 SC #4)**: ✓ — closed by Plan 01-06; empirically re-proved.

**Documented deferrals consistent with the planner's stated decisions and the ROADMAP plan listing:**

- `form.tsx` → Phase 3 (signup form work)
- INFRA-07's `'server-only'` guard → Phase 4 (`lib/resend.ts` is the first module to need it)

**One outstanding human-verification item** (gitleaks block under real `git commit` workflow) is a day-to-day UX confirmation, not a code gap. It does not block phase completion — INFRA-08 is empirically verified at the exact code path git invokes (`.husky/_/pre-commit`).

---

## Re-Verification Diff Summary

| Aspect | Before (initial) | After (gap closure) |
|--------|------------------|---------------------|
| `gaps[0]` (lib/env.ts dormant — SC #4 boot-crash unverified) | `failed` | `closed` (moved to `gaps_closed[]`) |
| ROADMAP score | 4/5 | 5/5 |
| `app/layout.tsx` line 4 | (blank line) | `import "@/lib/env";` |
| `app/layout.tsx` total lines | 40 | 41 |
| Empty-env build exit | 0 (silent pass — bug) | 1 (ZodError, 6 keys named — correct) |
| Success-path build exit | 0, 3 static pages | 0, 3 static pages (no regression) |
| `lib/env.ts` content | unchanged | unchanged (no diff vs HEAD) |
| `.env.local` byte-identity post-test | n/a | md5 match pre/post |
| Status | `gaps_found` | `human_needed` (no code gaps; one human-eyes signal) |

---

_Initially verified: 2026-04-27T20:55:00Z (status: gaps_found, 4/5)_
_Re-verified: 2026-04-27T21:35:00Z (status: human_needed, 5/5 — gap closed by Plan 01-06)_
_Verifier: Claude (gsd-verifier)_
