---
phase: 01-scaffold-brand-token-parity
plan: 06
subsystem: infra
gap_closure: true

tags: [env-validation, zod, gap-closure, boot-crash, infra-06]

# Dependency graph
requires:
  - 01-01 (lib/env.ts must already exist with envSchema.parse(process.env) at module load)
  - 01-02 (app/layout.tsx must already exist with the Quicksand+Figtree+globals.css import block)
  - 01-04 (custom/no-raw-process-env ESLint rule must already exist so the post-edit eslint check is meaningful)
  - 01-05 (Vercel-link + smoke-test established the success-path build baseline of "exit 0, 3 static pages")
provides:
  - "Live wiring between app/layout.tsx and lib/env.ts via side-effect import — every server boot, RSC render, and `next build` now exercises envSchema.parse(process.env)"
  - "Empirical proof artifact that Phase 1 SC #4 holds: `cat /dev/null > .env.local && npm run build` exits non-zero with a ZodError listing all six required keys"
  - "Canonical regression test command for SC #4 documented for /gsd-verify-phase re-runs"
affects:
  - 01-VERIFICATION.md (gaps[0].status — the gap-failure on SC #4 — can now be flipped from `failed` to `closed`)
  - 04-* (Phase 4's `lib/resend.ts` will become the first NAMED consumer of `lib/env.ts`'s `env` export; the layout side-effect import then becomes a documented secondary guarantor)

# Tech tracking
tech-stack:
  added: []   # No new dependencies — one-line edit + verification only
  patterns:
    - "Side-effect import for module-load validation: `import '@/lib/env';` evaluates `envSchema.parse(process.env)` without polluting the importing namespace, mirroring the existing `import \"./globals.css\";` side-effect pattern on the line above"
    - "Snapshot-then-restore destructive empirical testing for env-validation gates: snapshot `.env.local` to `/tmp/` (outside the repo), empty + build (assert non-zero), restore byte-identically, then re-build to confirm no regression — `/tmp/` snapshots avoid any in-repo backup that could leak via gitleaks or git status"

key-files:
  created:
    - ".planning/phases/01-scaffold-brand-token-parity/01-06-SUMMARY.md (this file)"
  modified:
    - "app/layout.tsx (one-line insertion: `import \"@/lib/env\";` on the new line 4, immediately after the existing `import \"./globals.css\";`)"

key-decisions:
  - "Wired into `app/layout.tsx` (not `next.config.ts`): the layout fires on every RSC render path — including `next dev` cold starts before any `next build` runs — giving earlier feedback in the dev loop. `next.config.ts` is config-load-only and would also work for `next build`, but the layout fires earlier in the dev loop. `marketing-app` does not put env validation in `next.config.ts`; sticking with the layout matches the project pattern and keeps `next.config.ts` empty per CD-04."
  - "Side-effect import (no named binding): the layout doesn't read any env values; only Phase 4's `lib/resend.ts` will. `import { env } from '@/lib/env';` would also trigger the side effect, but `env` would be unused — semantically wrong (we want the side effect, not the value) and would trigger `@typescript-eslint/no-unused-vars`."
  - "`/tmp/quibly-env-snapshot` (outside the repo) is the snapshot path — never an in-repo `.bak` file. Defense in depth against any path that could leak into git status or gitleaks."

# Metrics
metrics:
  duration_seconds: 119
  duration_human: "~2 min"
  completed_date: "2026-04-27T21:22:18Z"
  tasks_completed: 2
  files_modified: 1
  files_created: 1   # 01-06-SUMMARY.md
---

# Phase 1 Plan 6: Gap Closure — Wire `@/lib/env` into Root Layout

## One-liner

Adds a single side-effect import (`import "@/lib/env";`) to `app/layout.tsx` so the dormant Zod env schema runs on every render path; empirically re-proves that `npm run build` now crashes non-zero with a ZodError listing all six keys when `.env.local` is empty — closing the SC #4 gap that 01-VERIFICATION.md flagged.

## Context

`01-VERIFICATION.md` (2026-04-27T20:55:00Z) ran the empirical test `cat /dev/null > .env.local && npm run build` and observed **exit 0** — the Zod schema in `lib/env.ts` was structurally correct but **not imported by any production module**, so `envSchema.parse(process.env)` was never evaluated during a real build. Plan 01-01's "boot-crash test" had been a synthetic isolation test (`node -e ...`), not a production-path test. Phase 1 SC #4 ("the app crashes at boot with a helpful Zod error if any Resend/Upstash env var is missing — never on first signup") was therefore unobservable from any production code path.

The closure plan was a one-line fix: add `import "@/lib/env";` (side-effect form) to `app/layout.tsx`. This plan executed exactly that fix and re-ran the empirical proof.

## Tasks Completed

| # | Name                                                                   | Commit  | Files                            |
| - | ---------------------------------------------------------------------- | ------- | -------------------------------- |
| 1 | Wire `@/lib/env` into the root layout via side-effect import           | 8b70fea | app/layout.tsx (1 line added)    |
| 2 | Empirical re-proof that `npm run build` crashes on missing env         | (none — verification harness; artifacts captured below) | — |

## The 1-Line Diff

```diff
diff --git a/app/layout.tsx b/app/layout.tsx
index c0c6b49..2bd5f3d 100644
--- a/app/layout.tsx
+++ b/app/layout.tsx
@@ -1,6 +1,7 @@
 import type { Metadata } from "next";
 import { Quicksand, Figtree } from "next/font/google";
 import "./globals.css";
+import "@/lib/env";
 
 const quicksand = Quicksand({
   subsets: ["latin"],
```

File grew from 40 lines to 41 lines. No other bytes changed. The new line is grouped with the existing `globals.css` side-effect import directly above it.

## Empirical Proof — Captured Exit Codes

| Build invocation                                              | Expected | Observed |
| ------------------------------------------------------------- | -------- | -------- |
| `cat /dev/null > .env.local && NODE_NO_WARNINGS=1 npm run build` | non-zero | **EMPTY_EXIT=1** |
| `cp /tmp/quibly-env-snapshot .env.local && NODE_NO_WARNINGS=1 npm run build` | 0 | **RESTORED_EXIT=0** |

## Empirical Proof — Captured ZodError stderr (first 30 lines of `/tmp/quibly-build-empty.log`)

```

> quibly-landing@0.1.0 build
> next build

▲ Next.js 16.2.1 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 2.0s
  Running TypeScript ...
  Finished TypeScript in 1380ms ...
  Collecting page data using 4 workers ...
Error: Failed to collect configuration for /_not-found
    at ignore-listed frames {
  [cause]: Error [ZodError]: [
    {
      "expected": "string",
      "code": "invalid_type",
      "path": [
        "RESEND_API_KEY"
      ],
      "message": "Invalid input: expected string, received undefined"
    },
    {
      "expected": "string",
      "code": "invalid_type",
      "path": [
        "RESEND_AUDIENCE_ID"
      ],
      "message": "Invalid input: expected string, received undefined"
```

All six required keys appear in the ZodError issue list (verified by `grep -cE "RESEND_API_KEY|RESEND_AUDIENCE_ID|RESEND_AUDIENCE_PREVIEW_ID|RESEND_WEBHOOK_SECRET|UPSTASH_REDIS_REST_URL|UPSTASH_REDIS_REST_TOKEN" /tmp/quibly-build-empty.log` = **6**, one mention per key in the issues array). Exit was non-zero (1). The schema is now exercised by a production code path, not just by a synthetic `node -e ...` test.

## Empirical Proof — `.env.local` byte-identity confirmation

```bash
$ md5 -q /tmp/quibly-env-snapshot       # pre-test snapshot
4bf92fe08b9c58eb4adc58992e663d79
$ md5 -q .env.local                     # post-test (after restore + success build)
4bf92fe08b9c58eb4adc58992e663d79
$ diff /tmp/quibly-env-snapshot.compare .env.local
(no output — byte-identical)
```

`.env.local` is **byte-identical** before and after the destructive test (2344 bytes both pre and post; identical md5 hash). The destructive empty-then-restore cycle had zero residual impact on the user's local secrets.

## Empirical Proof — Success-path snippet (`/tmp/quibly-build-restored.log`)

```
  Creating an optimized production build ...
✓ Compiled successfully in 1737ms
  Running TypeScript ...
  Finished TypeScript in 1301ms ...
  Collecting page data using 4 workers ...
  Generating static pages using 4 workers (0/3) ...
✓ Generating static pages using 4 workers (3/3) in 183ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
└ ○ /_not-found


○  (Static)  prerendered as static content
```

Exit 0, **3 static pages** prerendered (matches Plan 01-01's verification baseline; matches Plan 01-05's smoke-test baseline). No regression introduced by the new side-effect import on the success path.

## Wiring-Point Rationale

`app/layout.tsx` was chosen over `next.config.ts` for two compounding reasons:

1. **Earlier dev-loop feedback.** `app/layout.tsx` is loaded on every RSC render path — including the very first `next dev` cold start, before any `next build` is invoked. `next.config.ts` is config-load-only; it would catch the missing-env case during `next build` but would not crash a `next dev` boot that doesn't reach build. Both work for production deploys; `app/layout.tsx` also catches the dev failure mode.
2. **Project pattern alignment.** `marketing-app` does not use `next.config.ts` for env validation, and `next.config.ts` here is intentionally empty per CD-04 (no monorepo turbopack workaround). Adding env-validation logic to `next.config.ts` would diverge from `marketing-app` and from the "boundary at the closest production-path module" pattern that 01-VERIFICATION.md called out. `app/layout.tsx` is the natural production boundary.

The cost of either choice is identical (one line); the benefit difference is dev-loop responsiveness, which favors `app/layout.tsx`.

## Verification Results

All verification commands from the plan's `<verify>` block passed:

| Check | Result |
| ----- | ------ |
| `grep -nE '^import ["'"'"']@/lib/env["'"'"'];?$' app/layout.tsx` returns line 4 | PASS |
| `sed -n '3p' app/layout.tsx` is `import "./globals.css";` | PASS |
| `sed -n '4p' app/layout.tsx` is `import "@/lib/env";` | PASS |
| `wc -l < app/layout.tsx` returns `41` | PASS |
| No named binding `import { ... } from "@/lib/env"` exists | PASS |
| `node_modules/.bin/tsc --noEmit` exits 0 | PASS |
| `node_modules/.bin/eslint app/layout.tsx` exits 0 | PASS |
| `node_modules/.bin/eslint app/layout.tsx --rule '{"custom/no-raw-process-env":"error"}'` exits 0 | PASS |
| Empty-env `npm run build` exits non-zero (got 1) | PASS |
| Empty-env build log contains literal string `ZodError` | PASS |
| Empty-env build log mentions all six env keys (got 6 matches) | PASS |
| Restored-env `npm run build` exits 0 | PASS |
| Restored-env build log shows `Generating static pages` | PASS |
| `.env.local` byte-identical pre/post (md5 + diff) | PASS |
| `git status --short` lists no `.env.local`/`.bak`/`/tmp/` artifact | PASS |
| No `.env.local.bak.gap-test` file exists in repo at task end | PASS |

## Deviations from Plan

None — both tasks executed exactly as specified.

## Authentication Gates

None — this plan touched no remote services. Local file edit + local `npm run build` only.

## Forward-Looking Notes

- **Phase 4 is the first named consumer.** When Phase 4 creates `lib/resend.ts`, that file will `import { env } from "@/lib/env";` and read `env.RESEND_API_KEY`, `env.RESEND_AUDIENCE_ID`, etc. Once that lands, the side-effect import in `app/layout.tsx` becomes a **secondary** guarantor (the layout still wires it for dev-loop earliness, but the production read-path through the Resend client also exercises the schema). T-01-07's mitigation point (a) — "Phase 4 will add a real consumer" — fires at that point.
- **The `app/layout.tsx` import is at risk of well-meaning removal.** A future contributor or auto-cleanup tool could flag `import "@/lib/env";` as an "unused side-effect import" and remove it. T-01-07's mitigations are: (a) Phase 4 redundancy, (b) the grep invariant in Task 1's acceptance criteria copied into Phase 1's re-verification harness, (c) the `cat /dev/null > .env.local && npm run build` regression test as the canonical SC #4 check on every milestone-level verification.

## Closure Status — Instructions to Next `/gsd-verify-phase` Run

`01-VERIFICATION.md` `gaps[0].status` should be flipped from `failed` to `closed`. The closure plan's `gaps[0].missing` items are now empirically satisfied:

- Item 1 ("Add `import '@/lib/env'` (side-effect import) to app/layout.tsx") — DONE (commit `8b70fea`, line 4 of `app/layout.tsx`).
- Item 2 ("Re-run empirical proof: `cat /dev/null > .env.local && npm run build` should now exit non-zero with a ZodError listing all six missing keys") — DONE (this Summary documents `EMPTY_EXIT=1`, ZodError captured, all six keys named).

**Canonical re-verification command for any future Phase 1 audit:**

```bash
cp .env.local /tmp/_env_snapshot \
  && cat /dev/null > .env.local \
  && set +e; NODE_NO_WARNINGS=1 npm run build > /tmp/_build_empty.log 2>&1; EXIT=$?; set -e \
  && cp /tmp/_env_snapshot .env.local \
  && test "$EXIT" -ne 0 \
  && grep -F "ZodError" /tmp/_build_empty.log \
  && test "$(grep -cE 'RESEND_API_KEY|RESEND_AUDIENCE_ID|RESEND_AUDIENCE_PREVIEW_ID|RESEND_WEBHOOK_SECRET|UPSTASH_REDIS_REST_URL|UPSTASH_REDIS_REST_TOKEN' /tmp/_build_empty.log)" -ge 6 \
  && echo "SC #4 PROOF HOLDS"
```

This single-line proof matches T-01-07's mitigation (c) — the canonical long-term integration test for SC #4.

## Threat Flags

None. This plan introduces no new trust boundaries, no new network surface, no new file/auth paths. The threat register inherits from Plan 01-01 plus T-01-07 (mitigations established in this plan's structure as documented above).

## Self-Check: PASSED

Verified via:

```bash
$ test -f app/layout.tsx && echo FOUND
FOUND
$ test -f .planning/phases/01-scaffold-brand-token-parity/01-06-SUMMARY.md && echo FOUND
FOUND
$ git log --oneline --all | grep -q "8b70fea" && echo FOUND
FOUND
$ sed -n '4p' app/layout.tsx
import "@/lib/env";
$ wc -l < app/layout.tsx
      41
```

All claims in this Summary are reproducible from the live working tree and git history.
