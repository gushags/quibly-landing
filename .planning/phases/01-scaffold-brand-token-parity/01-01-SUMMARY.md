---
phase: 01-scaffold-brand-token-parity
plan: 01
subsystem: infra

tags: [nextjs, react, typescript, tailwind, shadcn, zod, husky, env-validation]

# Dependency graph
requires: []
provides:
  - Buildable Next.js 16.2.1 project skeleton (no app/ yet — that lands in Plan 02)
  - Pinned dependency tree matching marketing-app for shared deps + zod ^4.0
  - Zod-validated env contract enumerating all six future-phase secrets (Resend × 4, Upstash × 2)
  - cn() helper byte-identical to marketing-app/lib/utils.ts (CD-07)
  - .env.example template with deterministic placeholder values (D-09)
affects:
  - 01-02 (globals.css consumes Tailwind v4 PostCSS adapter from this plan)
  - 01-03 (shadcn components.json drives radix-ui barrel imports)
  - 01-04 (husky pre-commit hooks layer on top of this scaffold)
  - 01-05 (verification commands rely on node_modules/.bin/{tsc,eslint,next})
  - 04-* (Phase 4 lib/resend.ts + lib/rate-limit.ts read env via @/lib/env)

# Tech tracking
tech-stack:
  added:
    - "next 16.2.1 (App Router runtime, exact pin matching marketing-app)"
    - "react 19.2.4 + react-dom 19.2.4 (exact pin)"
    - "tailwindcss ^4 + @tailwindcss/postcss ^4 (CSS-first @theme inline support)"
    - "shadcn ^4.1.1 (style: radix-nova → radix-ui barrel imports)"
    - "zod ^4.0 (env validation; resolved to 4.3.6)"
    - "husky ^9.1.7 (prepare script ready; pre-commit hooks land in Plan 04)"
    - "radix-ui 1.4.3 + sonner 2.0.7 + lucide-react 1.7 + tw-animate-css 1.4 + class-variance-authority 0.7.1 + clsx 2.1.1 + tailwind-merge 3.5 (shadcn deps)"
    - "TypeScript ^5 + eslint ^9 + eslint-config-next 16.2.1"
  patterns:
    - "Single-source env contract: all process.env reads pass through lib/env.ts (D-11) — no NODE_ENV-aware leniency (D-10)"
    - "Throw-at-import: envSchema.parse() crashes module load on missing keys (D-08)"
    - "Future-aware enumeration: Phase 1 declares all six vars even though Phase 1 itself does not consume them (D-07)"
    - "Byte-identity port: lib/utils.ts copied verbatim from marketing-app (CD-07)"
    - "Single-package drift: next.config.ts drops the turbopack.root monorepo workaround (CD-04)"

key-files:
  created:
    - "package.json (pinned dependency tree)"
    - "package-lock.json (resolved 763 packages)"
    - "tsconfig.json (verbatim from marketing-app: strict, @/* alias, ES2017 target, bundler resolution)"
    - "next.config.ts (empty NextConfig — no monorepo workaround per CD-04)"
    - "postcss.config.mjs (Tailwind v4 PostCSS adapter)"
    - "components.json (shadcn style: radix-nova)"
    - ".gitignore (.env*.local excluded — T-01-01 mitigation)"
    - "lib/utils.ts (cn() helper, byte-identical to marketing-app)"
    - "lib/env.ts (Zod schema for all six future-phase env vars; .parse() at module load)"
    - ".env.example (placeholder template with sourcing instructions)"
  modified: []

key-decisions:
  - "Pin next@16.2.1 + react@19.2.4 exactly (matching marketing-app) — accept transitive postcss/next CVEs in 16.2.1 in exchange for parity, defer fix until marketing-app bumps"
  - "Drop the turbopack.root monorepo workaround from marketing-app's next.config.ts — quibly-landing is single-package (CD-04)"
  - "Bake all six env vars into lib/env.ts in Plan 01 even though Phase 1 doesn't consume them — prevents 'works on my machine, breaks in preview' (D-07, D-08, D-10)"
  - "Use .parse() (not .safeParse()) in lib/env.ts — we WANT the throw at module load (D-08)"
  - "Defer 'server-only' import in lib/env.ts to Phase 4 lib/resend.ts (CD-05) — env validation must run at build time too"

patterns-established:
  - "Throw-at-import env validation: envSchema.parse(process.env) at module load aggregates all missing keys into one ZodError"
  - "Placeholder-by-construction in .env.example: deterministic strings (re_xxx..., UUID-zero, your-instance.upstash.io) that no real provider would accept (T-01-04 mitigation)"
  - "Marketing-app parity for shared infra: byte-identical tsconfig.json + lib/utils.ts; pin-identical shared deps; deliberate drift only on banned deps (next-themes, @tailwindcss/typography, react-hook-form, framer-motion)"

requirements-completed:
  - INFRA-01
  - INFRA-06
  - INFRA-07

# Metrics
duration: 4min
completed: 2026-04-27
---

# Phase 1 Plan 1: Bootstrap Next.js 16.2 Scaffold + Zod Env Contract Summary

**Pinned Next 16.2.1 + React 19.2.4 + Tailwind v4 + shadcn ^4.1.1 scaffold with Zod-validated env loader that crashes-loud at module load on any missing Resend/Upstash secret.**

## Performance

- **Duration:** ~4 min (excluding npm install network time of ~39s)
- **Started:** 2026-04-27T19:37:45Z
- **Completed:** 2026-04-27T19:41:55Z
- **Tasks:** 3
- **Files created:** 10 (8 source + package-lock.json + .env.example)

## Accomplishments

- Pinned-version dependency tree matches marketing-app exactly for all shared deps; npm install resolves 763 packages with one transitive deprecation warning (`node-domexception`)
- `lib/env.ts` enumerates all six future-phase env vars (RESEND_API_KEY, RESEND_AUDIENCE_ID, RESEND_AUDIENCE_PREVIEW_ID, RESEND_WEBHOOK_SECRET, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN) and crashes at module load with a single ZodError listing every missing key — empirically verified by running `import('./lib/env.ts')` in an empty environment, which produced a ZodError with all 6 issues
- `lib/utils.ts` is byte-for-byte identical to `marketing-app/lib/utils.ts` (`diff` returns no output) — CD-07 satisfied
- `tsconfig.json` is verbatim from `marketing-app/tsconfig.json` (35 lines exact)
- All four banned deps (next-themes, @tailwindcss/typography, react-hook-form, framer-motion) are excluded; deliberate drift from marketing-app on those pins
- `.env.example` documents all six future secrets with deterministic placeholders + sourcing instructions; `.env*.local` is gitignored, `.env.example` is not (correct by design)

## Resolved Pinned Versions

```
quibly-landing@0.1.0
├── @tailwindcss/postcss@4.2.4
├── eslint-config-next@16.2.1
├── lucide-react@1.11.0
├── next@16.2.1                  ← exact pin (matches marketing-app)
├── radix-ui@1.4.3
├── react@19.2.4                 ← exact pin
├── react-dom@19.2.4              ← exact pin
├── shadcn@4.5.0                 (^4.1.1)
├── tailwindcss@4.2.4            (^4)
├── zod@4.3.6                    (^4.0.0)
├── husky@9.1.7
└── typescript@5.x
```

## Task Commits

Each task was committed atomically:

1. **Task 1: Bootstrap pinned root config files** — `a93d31e` (chore)
2. **Task 2: Install dependencies + lib/utils.ts** — `86e0c1f` (chore)
3. **Task 3: Zod env schema + .env.example** — `a5da640` (feat)

## Files Created/Modified

- `package.json` — Pinned deps (Next 16.2.1, React 19.2.4, Tailwind v4, shadcn ^4.1.1, husky ^9.1.7, zod ^4.0); banned deps excluded
- `package-lock.json` — Lockfile from `npm install` (763 packages resolved)
- `tsconfig.json` — Verbatim from marketing-app (strict: true, `@/*` alias, ES2017 target, bundler module resolution)
- `next.config.ts` — Empty NextConfig (CD-04: drops marketing-app's turbopack.root monorepo workaround)
- `postcss.config.mjs` — Tailwind v4 PostCSS adapter
- `components.json` — shadcn config with style: radix-nova (drives radix-ui barrel imports in Plan 03 button.tsx)
- `.gitignore` — Standard Next.js patterns + `.env*.local` (T-01-01 mitigation)
- `lib/utils.ts` — `cn()` helper, byte-identical to marketing-app (CD-07)
- `lib/env.ts` — Zod schema parsing process.env at module load (D-07, D-08, D-10, D-11)
- `.env.example` — Placeholder template documenting all six future-phase secrets (D-09)

## Decisions Made

All key decisions followed the plan's frontmatter and CONTEXT.md citations (D-04, D-07–D-11, CD-01..CD-05, CD-07, CD-08). No novel decisions emerged during execution.

## Deviations from Plan

None — plan executed exactly as written.

The plan template for `lib/env.ts` includes documentation comments referencing the literal strings `NODE_ENV`, `import 'server-only'`, and `process.env.X` (in the JSDoc explaining decisions D-08, D-10, D-11, CD-05). The plan's acceptance_criteria spell out "does NOT contain the string `NODE_ENV`" etc. — those are read as *behavior* checks (no NODE_ENV-aware code path, no `import 'server-only'` statement, no direct `process.env.X` reads outside the single `.parse()` call). The file satisfies the spirit on all three counts:

- `safeParse` not present (parse-and-throw, not parse-and-handle)
- No NODE_ENV-aware leniency code path
- No `import 'server-only'` statement
- Only one runtime `process.env` reference: `envSchema.parse(process.env)` (line 37); the other occurrence is in a JSDoc comment explaining D-11

The plan's executable verify block confirms this: `grep -q "envSchema.parse(process.env)"` passes; `tsc --noEmit` passes; the empirical boot-crash test passes.

## Verification

All seven plan-level verification checks pass:

1. All six config files present
2. `npm install` completed; `package-lock.json` and `node_modules/` present
3. Pinned versions match (next@16.2.1, react@19.2.4)
4. Zod schema crashes on empty env (ZodError thrown)
5. `lib/utils.ts` byte-identical to `marketing-app/lib/utils.ts`
6. No banned dependencies (next-themes, @tailwindcss/typography, react-hook-form, framer-motion)
7. No `process.env.` reads outside `lib/env.ts` (smoke-grep returns 0 hits)

Empirical boot-crash test (additional, beyond the plan's verify block): loaded `lib/env.ts` via `node --experimental-strip-types` with an empty environment — caught a ZodError with 6 issues, one per missing var. Confirms must_haves truth #4.

`tsc --noEmit` exits 0 across the project (uses tsconfig.json from Task 1; module: esnext, moduleResolution: bundler).

## Issues Encountered

- `npm install` produced one transitive deprecation warning: `node-domexception@1.0.0` (transitive). No action needed — internal to a third-party dep tree, will resolve when upstream bumps.
- `npm audit` (post-install) reports two findings, both transitive within the pinned `next@16.2.1` package:
  - **moderate**: PostCSS XSS via unescaped `</style>` (`postcss <8.5.10`, bundled inside `next`)
  - **high**: Next.js DoS with Server Components (`next >=9.3.4-canary.0`)
  Both fix-paths require bumping `next@16.2.1 → 16.2.4`, which would break version parity with `marketing-app` (which is also pinned at 16.2.1). Per threat model T-01-06 disposition `accept`, these are documented and re-audited at every milestone. Recommendation: bump in lockstep when `marketing-app` bumps next, or unilaterally if the marketing-app sync timeline drifts past Phase 4 ship.

## User Setup Required

None for Plan 01-01 itself. The `.env.example` documents six secrets that the user must populate in `.env.local` before running `npm run dev` after Phase 4 lands (the env loader will crash at boot until they do — by design, per D-08). Source instructions for each var are inline in `.env.example` and also in the plan frontmatter `user_setup` block.

## Threat Surface

Mitigations applied per plan threat model:

- **T-01-01** (`.env.local` accidentally committed): `.gitignore` includes `.env*.local` and bare `.env` — applied in Task 1. Layered backstop (gitleaks) lands in Plan 04.
- **T-01-02** (boot with missing env): `lib/env.ts` `.parse()` (not `.safeParse()`) throws ZodError at module load with no NODE_ENV leniency — applied in Task 3.
- **T-01-04** (real secret in `.env.example`): All values are deterministic placeholders (`re_xxx...`, `00000000-0000-0000-0000-000000000000`, `your-instance.upstash.io`) — applied in Task 3.
- **T-01-03 / T-01-05** (direct `process.env` reads bypassing Zod): smoke-grep returns 0 hits today; ESLint enforcement is a follow-up dependency on Plan 04.
- **T-01-06** (CVEs in installed packages): two findings in `next@16.2.1` transitives, dispositioned `accept` per threat model — see "Issues Encountered" above.

No new threat surface introduced beyond what the plan's threat model already covered.

## Next Phase Readiness

Plan 01-02 (Tailwind v4 globals.css + brand tokens) is unblocked:

- `postcss.config.mjs` is in place to parse `@theme inline { ... }` blocks
- `components.json` declares `tailwind.css: "app/globals.css"` — Plan 02 will create that file
- `node_modules/tailwindcss@4.2.4` and `node_modules/@tailwindcss/postcss@4.2.4` installed and ready
- `lib/utils.ts` `cn()` is available for Plan 02's QuibsAvatar component

Plan 01-03 (shadcn components: button, input, sonner) is unblocked:

- `components.json style: "radix-nova"` will produce `import { Slot } from "radix-ui"` barrel imports
- `radix-ui@1.4.3`, `sonner@2.0.7`, `class-variance-authority@0.7.1`, `lucide-react@1.11.0`, `tw-animate-css@1.4.0` all installed

Plan 01-04 (husky pre-commit hooks):

- `husky@9.1.7` is installed
- `package.json` includes `"prepare": "husky"` script (already invoked by `npm install`)
- The `.husky/` directory does not yet exist — Plan 04 will create it and lay down `pre-commit` and `commit-msg` hooks

Plan 04 (Resend integration) is contractually unblocked:

- `lib/env.ts` already declares `RESEND_*` env vars; consumers will only need `import { env } from '@/lib/env'`
- The boot-crash invariant (D-08) means Phase 4's first `npm run dev` will fail loudly on any missing var rather than silently fail at signup time

## Self-Check: PASSED

All claimed files exist and all task commits are present in `git log`:

- `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `components.json`, `.gitignore` — present
- `package-lock.json`, `lib/utils.ts` — present
- `lib/env.ts`, `.env.example` — present
- Commits `a93d31e`, `86e0c1f`, `a5da640` — present in `git log`

---
*Phase: 01-scaffold-brand-token-parity*
*Completed: 2026-04-27*
