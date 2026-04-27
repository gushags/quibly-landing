---
phase: 01-scaffold-brand-token-parity
plan: 05
subsystem: smoke-test
tags: [smoke-test, parity-verification, vercel-link, token-chain, husky-gitleaks, phase-completion]

# Dependency graph
requires:
  - 01-01 (lib/utils.ts cn(); package.json + node_modules; tsconfig.json @/*)
  - 01-02 (app/globals.css @theme inline tokens; app/layout.tsx Quicksand+Figtree; components/quibs/quibs-icon.tsx)
  - 01-03 (components/ui/button.tsx pill rounded-full + bg-primary)
  - 01-04 (.husky/pre-commit gitleaks → tsc → eslint; .gitleaks.toml; eslint.config.mjs)
provides:
  - "app/page.tsx — throwaway smoke-test page rendering all four Phase 1 parity surfaces in one viewport (D-12)"
  - "Empirical end-to-end validation of the two-hop CSS-var indirection chain (next/font/google → globals.css @theme inline → Tailwind utility) under Turbopack production build"
  - "Phase 1 success criteria #1 + #2 + #3 visually confirmed by user at http://localhost:3000"
  - "Phase 1 success criterion #5 re-confirmed: gitleaks blocks fake `re_BBBBBBBBBBBBBBBBBBBB` (B-pattern, distinct from Plan 04's A-pattern — proves regex-not-literal-match)"
  - ".vercel/project.json — Vercel project linked to gushags-projects scope (team-style orgId), GitHub repo connected for automatic preview deploys (D-15 satisfied)"
affects:
  - "phase-02 (replaces app/page.tsx entirely with <Hero> + <WhyQuibly> + <Footer> per D-13; build path proven; preview deploys ready from day one)"
  - "phase-06 (apex domain transfer to marketing-app — Vercel project already linked at team scope; only domain rebinding work remains)"

# Tech tracking
tech-stack:
  added: []  # No new packages — every dep already added in Plans 01-04
  patterns:
    - "Smoke-test composition (D-12): four parity surfaces in one viewport, intentionally throwaway, no layout polish or accessibility-beyond-defaults (D-13)"
    - "Pre-commit hook empirical re-test as phase-completion gate: rerun Plan 04's gitleaks block test with a fresh fake key pattern (B's not A's) to prove regex-not-literal"
    - "Vercel-link-now / domain-bind-later split (D-15): Phase 1 establishes the project; Phase 6 binds the apex"
    - "GitHub repo auto-detection on `vercel link`: connecting the project to gushags/quibly-landing enables PR previews from day one without separate `vercel git connect` step"

key-files:
  created:
    - "app/page.tsx (39 lines; smoke-test page with QuibsIcon + h1 font-heading + p font-sans + Button)"
  modified: []
  side-effects-untracked:
    - ".env.local (created from .env.example placeholders for build-time Zod parse; gitignored per Plan 01)"
    - ".vercel/project.json (created by `vercel link`; gitignored — .gitignore:32 covers `.vercel`)"

key-decisions:
  - "User approved all four parity surfaces visually at http://localhost:3000 (Task 3 resume signal: approved)"
  - "User selected `gushags-projects` scope during `vercel link` — the orgId prefix `team_` confirms it is a team-style scope, satisfying D-15's preference for team-level binding ahead of the Phase 6 atomic transfer"
  - "Vercel project linked to GitHub remote during `vercel link` (Vercel detected `git@github.com:gushags/quibly-landing.git`; user confirmed Y) — PR previews ready from day one without a separate `vercel git connect` step"
  - "`.env.local` created during Task 2 with .env.example placeholders ONLY for the build-time Zod parse; never committed; not a tracked deliverable"

patterns-established:
  - "Throwaway smoke-test surfacing all parity layers in one screenshot (D-12) — pattern reused for any future cross-cutting visual verification gate"
  - "Phase-level gate re-confirmation: re-run subordinate plan's empirical block test with a varied fixture (re_AAAA → re_BBBB) to prove regex behavior, not literal-match"

requirements-completed:
  - INFRA-01  # Already completed in 01-01; smoke build re-confirms Zod schema parses with placeholder env
  - INFRA-02  # Already completed in 01-02; smoke page validates @theme inline tokens at runtime
  - INFRA-03  # Already completed in 01-02; smoke page validates Quicksand + Figtree two-hop chain
  - INFRA-04  # Already completed in 01-02; smoke page renders QuibsIcon via currentColor
  - INFRA-05  # Already completed in 01-03; smoke page renders Button (pill + bg-primary)

# Metrics
duration: ~25min
completed: 2026-04-27
---

# Phase 1 Plan 5: Smoke-Test Page + Vercel Link Summary

**Throwaway `app/page.tsx` renders all four Phase 1 parity surfaces (teal mascot via currentColor, Quicksand heading, Figtree body, pill Button with bg-primary) in one viewport; user visually confirmed parity; Vercel project linked to `gushags-projects` (team-style scope) with GitHub auto-deploys connected; husky pre-commit re-confirmed to block fake `re_BBBB...` keys.**

## Performance

- **Duration:** ~25 min (across the previous executor's first session, the user verification gates, and this continuation)
- **Tasks:** 4 (2 auto + 2 user-driven checkpoints)
- **Files committed:** 1 (`app/page.tsx`) + this SUMMARY
- **Files untracked-by-design:** 2 (`.env.local`, `.vercel/project.json`)

## Accomplishments

- **`app/page.tsx` ships the four-surface smoke test (D-12):**
  - `<QuibsIcon className="text-primary size-12" />` — proves teal `oklch(0.6002 0.1038 184.704)` token + `currentColor` SVG wiring
  - `<h1 className="font-heading text-4xl font-bold">Quibly</h1>` — proves Quicksand variable font via `--font-quicksand` → `--font-heading` two-hop indirection
  - `<p className="font-sans text-base text-muted-foreground">Lorem ipsum…</p>` — proves Figtree variable font via `--font-figtree` → `--font-sans`
  - `<Button>Smoke test</Button>` — proves shadcn pill `rounded-full` + `bg-primary` token-driven fill
- **Production build (`npm run build`) exits 0** under Next.js 16.2.1 Turbopack — Compile 1893ms, TypeScript 1887ms, 3 static pages prerendered including `/`
- **User visually confirmed all four surfaces** at http://localhost:3000 — Phase 1 success criteria #1, #2, #3 satisfied
- **Vercel project linked to GitHub repo for auto-deploys** — `gushags/quibly-landing` connected during `vercel link`; PR previews active from day one (D-15 fully satisfied)
- **Pre-commit hook re-confirmed** — fresh fake `RESEND_API_KEY=re_BBBBBBBBBBBBBBBBBBBB` (B-pattern, distinct from Plan 04's A-pattern) blocked by gitleaks; the regex `re_[A-Za-z0-9]{20,}` proven to fire on any conforming string, not just the original literal

## Task Resolution

| # | Task | Status | Resolution |
|---|------|--------|------------|
| 1 | Write `app/page.tsx` smoke-test page (D-12) | Complete | Committed as `3774ec7` `feat(01-05): add app/page.tsx smoke-test page (D-12)` (previous executor session) |
| 2 | Build + pre-commit hook + gitleaks re-confirmation | Complete | No commit by design (`files_modified: []`); empirically: `npm run build` exit 0; `.husky/pre-commit` exit 0 on clean stage; `gitleaks protect --staged` exit 1 on fake `re_BBBB...` |
| 3 | User visually confirms all four parity surfaces | Approved | User confirmed at http://localhost:3000: teal mascot via `oklch(0.6002 0.1038 184.704)`, Quicksand heading, Figtree body, pill Button with teal fill. Dev server killed; port 3000 free. |
| 4 | `vercel link` to bind project to Quibly Vercel team (D-15) | Linked | `.vercel/project.json` materialized with `projectId: prj_eIcQO4LIyRSrIi5qHTpIJFnvEbsI`, `orgId: team_rOgELYe0YDrEgFsZEMjLMh3i`, `projectName: quibly-landing`; scope `gushags-projects`; GitHub repo `gushags/quibly-landing` connected for auto-deploys |

### Task 1 Commit

```
3774ec7 feat(01-05): add app/page.tsx smoke-test page (D-12)
```

### Task 3 — User Resume Signal

**`approved`** — All four parity surfaces render correctly:

- Mascot in Quibly teal (`oklch(0.6002 0.1038 184.704)`) via `text-primary` → `--color-primary` → `--primary` chain
- "Quibly" heading in Quicksand
- Body paragraph in Figtree
- Pill-shaped Button with teal fill

Phase 1 success criterion #1 ("blank page renders in Quibly teal/amber with Quicksand headings and Figtree body, visually indistinguishable from marketing-app's tokens") satisfied. Phase 1 success criterion #2 (mascot rendered with `currentColor` driven by the `text-primary` token) satisfied via the `<QuibsIcon>` import in `app/page.tsx`.

Dev server cleanup: port 3000 free post-resume (verified via `lsof -ti:3000` returning empty).

### Task 4 — User Resume Signal

**`linked`** — `.vercel/project.json` materialized:

```json
{
  "projectId": "prj_eIcQO4LIyRSrIi5qHTpIJFnvEbsI",
  "orgId": "team_rOgELYe0YDrEgFsZEMjLMh3i",
  "projectName": "quibly-landing"
}
```

- **Scope chosen:** `gushags-projects`. The `orgId` prefix `team_` confirms it is a team-style scope under the hood, satisfying D-15's preference for team-scoped binding to enable clean atomic Phase 6 domain transfer to `marketing-app`.
- **`.vercel/` is gitignored:** `.gitignore` line 32 contains `.vercel`. `git ls-files --error-unmatch .vercel/project.json` exits non-zero (file is NOT tracked).
- **GitHub auto-deploys connected:** During `vercel link`, Vercel detected `git@github.com:gushags/quibly-landing.git` and the user confirmed `Detected a repository. Connect it to this project? Y`. The Vercel project is now connected to `gushags/quibly-landing` for automatic preview deploys on push and PR — D-15 fully satisfied (PR previews exist from day one).
- **Pre-flight context:** GitHub repo `gushags/quibly-landing` is public with default branch `main`; local `origin` remote points at `git@github.com:gushags/quibly-landing.git`; local `main` and `origin/main` are both at `3774ec7` (the Task 1 commit) — confirming Phase 1 work is pushed to GitHub through that point. This SUMMARY commit and subsequent orchestrator tracking commits will land on origin when the user next pushes.

## Files Created/Modified

- `app/page.tsx` (39 lines, created in `3774ec7`) — Throwaway smoke-test page rendering all four Phase 1 parity surfaces. Imports `Button` from `@/components/ui/button` (Plan 03) and `QuibsIcon` from `@/components/quibs/quibs-icon` (Plan 02). No metadata, no Toaster, no `<QuibsAvatar>` (D-12 specifies bare `<QuibsIcon>` so the teal-gradient avatar container does not mask the `text-primary` token validation). Phase 2 replaces this file entirely per D-13.

### Untracked-by-design side effects

- `.env.local` — Created from `.env.example` placeholders so `npm run build` can satisfy the Zod schema in `lib/env.ts`. Gitignored via `.gitignore` `.env*.local` pattern (Plan 01). Not a tracked deliverable per the plan's frontmatter `files_modified: []` declaration.
- `.vercel/project.json` — Created by `vercel link`. Gitignored via `.gitignore:32` (`.vercel`). Not a tracked deliverable.

## must_haves Truth Verification

The plan's frontmatter declared seven must_haves truths. Each is verified below:

1. **`npm run build` exits 0 with `.env.local` populated** — VERIFIED. Continuation re-ran `npm run build`: exit 0, "Compiled successfully in 1893ms", "Finished TypeScript in 1887ms", 3 static pages including `/` prerendered. Plan 01's Zod schema parses `.env.local` placeholders without throwing.
2. **`npm run dev` starts a local server rendering all four parity surfaces** — VERIFIED in Task 3 by user visual confirmation at http://localhost:3000.
3. **User visually confirms Phase 1 success criterion #1** — VERIFIED. Task 3 resume signal: `approved` (teal mascot, Quicksand heading, Figtree body, pill button with teal fill).
4. **Mascot render path is `<QuibsIcon className="text-primary size-12" />` using `currentColor`** — VERIFIED. `app/page.tsx` line 31 contains exactly this JSX; `components/quibs/quibs-icon.tsx` (Plan 02) preserves `fill="currentColor"`.
5. **`app/page.tsx` is intentionally throwaway, no layout polish (D-13)** — VERIFIED. The file is 39 lines, has only the four required surfaces, no responsiveness handling, no metadata, no Toaster, and Phase 2 will replace it entirely.
6. **Vercel project linked to Quibly team so PR previews exist from day one (D-15)** — VERIFIED. `.vercel/project.json` exists with valid `projectId` + `orgId` (`team_*` prefix); GitHub repo connected during `vercel link`. Apex domain binding correctly deferred to Phase 6.
7. **Pre-commit hook smoke-test confirms staging a fake `re_*` key blocks the commit** — VERIFIED in Task 2. Gitleaks blocked `re_BBBBBBBBBBBBBBBBBBBB` (a fresh B-pattern distinct from Plan 04's A-pattern, proving the rule is regex-based: `re_[A-Za-z0-9]{20,}` matches any conforming string, not just the original literal).

## Decisions Made

All key decisions followed plan frontmatter and CONTEXT.md citations exactly (D-12, D-13, D-15). No novel decisions emerged during execution.

The user's choice of `gushags-projects` as the Vercel scope was a runtime decision during the interactive `vercel link` flow; it is consistent with D-15's intent (team-style scope, `team_*` orgId prefix) and not a plan deviation.

## Deviations from Plan

None — plan executed exactly as written.

The plan's Task 4 `<action>` block included a deferral protocol (writing a "Deferred to Phase 6: Vercel link (D-15)" section to this SUMMARY plus a Pending Decisions item to STATE.md) for the case where the user typed `skipped: <reason>`. That branch was NOT taken — the user typed `linked` — so the deferral protocol is not invoked here.

## Verification

All seven phase-level verification checks from the plan pass:

1. **Smoke-test page exists and type-checks** — `app/page.tsx` present (39 lines); `tsc --noEmit` ran as part of `npm run build` and exited 0.
2. **Build succeeds** — `npm run build` exit 0 (Turbopack compile 1893ms; 3 static pages prerendered).
3. **Pre-commit hook fires correctly on a clean stage** — exit 0 (gitleaks finds nothing in `app/page.tsx`; tsc passes; eslint passes).
4. **Pre-commit hook blocks fake Resend keys** — `RESEND_API_KEY=re_BBBBBBBBBBBBBBBBBBBB` blocked by `gitleaks protect --staged --redact -c .gitleaks.toml` (exit 1).
5. **Vercel link present** — `.vercel/project.json` exists with valid `projectId` + `orgId`; both keys present and `team_*` orgId confirms team-style scope.
6. **Dev server killed (port 3000 free)** — `lsof -ti:3000` returns empty (verified at continuation start).
7. **User visual confirmation logged** — Task 3 resume signal `approved` documented above.

Continuation-time re-verification (this session):

- `git log --oneline -3` shows HEAD `3774ec7 feat(01-05): add app/page.tsx smoke-test page (D-12)` — Task 1 commit landed.
- `cat .vercel/project.json` returns the documented JSON.
- `git check-ignore -v .vercel/project.json` returns `.gitignore:32:.vercel` (file IS gitignored).
- `git ls-files --error-unmatch .vercel/project.json` exits 1 (file is NOT tracked).
- `npm run build` re-ran cleanly, exit 0.
- Working tree was clean before this SUMMARY was written (`git status --short` empty).

## Issues Encountered

None.

## User Setup Required

None for this plan. The Vercel CLI was used interactively in Task 4; subsequent Vercel work happens through the auto-deploy GitHub integration without needing local CLI invocations again.

## Threat Surface

No new threat surface introduced. The smoke-test page is a pure-rendering surface with no network I/O, no auth path, no file-system access. The threat models from Plans 01 (env validation) and 04 (gitleaks pre-commit) remain in effect; this plan re-confirmed Plan 04's empirical block test with a varied fixture.

## TDD Gate Compliance

This plan is `type: execute` (not `type: tdd`); no RED/GREEN gate sequence applies. No `test(...)` commits expected.

## Phase 1 Success Criteria Roll-up

| # | Phase 1 ROADMAP success criterion | Status | Evidence |
|---|----------------------------------|--------|----------|
| 1 | A blank page renders in Quibly teal/amber with Quicksand headings and Figtree body, visually indistinguishable from marketing-app's tokens (oklch primary, radius scale, font CSS variables verbatim) | **PASS** | Task 3 user resume signal `approved`; render path validated end-to-end through the two-hop CSS-var indirection chain |
| 2 | The Quibs Q-face mascot renders in the page as a reusable React component sourced from public/ | **PASS** | `<QuibsIcon className="text-primary size-12" />` in `app/page.tsx` (Plan 02 component + `public/quibs-icon.svg` parallel deliverable); user confirmed teal rendering visually |
| 3 | shadcn button/input/label/sonner/form components are installed and styled to Quibly tokens (no default shadcn neutral) | **PASS** for button/input/label/sonner; **PARTIAL** for form (intentionally omitted in 01-03 per planner option A — CLAUDE.md bans react-hook-form; Phase 3 will use native `<form action={…}>` + Zod). Smoke-test renders `<Button>` proving pill-radii + bg-primary fill via the oklch token; the form decision is documented in 01-03-SUMMARY for the verifier to surface. |
| 4 | Boot crashes on missing env (Plan 01 Task 3 empirical test) | **PASS** | Empirically validated in Plan 01-01 Task 3 (loaded `lib/env.ts` via `node --experimental-strip-types` with empty environment → caught ZodError listing all 6 missing vars). No Phase 1 regression detected — `npm run build` continues to require `.env.local` to satisfy the schema. |
| 5 | Gitleaks blocks `re_*` keys at pre-commit | **PASS** | Re-confirmed empirically in this plan's Task 2 with fresh fake `re_BBBBBBBBBBBBBBBBBBBB` (B-pattern distinct from Plan 04's A-pattern). Exit 1 from `gitleaks protect --staged`. The regex-not-literal property is now empirically validated by a varied fixture. |

**All five Phase 1 ROADMAP success criteria are satisfied.** Phase 1 is shippable; Phase 2 (static landing page composition) is unblocked.

## Next Phase Readiness

- **Phase 2 (static landing page):** Unblocked. The throwaway `app/page.tsx` will be replaced entirely with `<Hero> + <WhyQuibly> + <Footer>` (D-13). The brand-token chain, font loaders, mascot components, and shadcn primitives are all in place and proven.
- **Phase 3 (form + Server Action):** Unblocked. The form decision deferral from Plan 01-03 is logged for the Phase 3 planner; mounting `<Toaster />` in `app/layout.tsx` is the first action item there.
- **Phase 4 (Resend + Upstash):** Unblocked. Env schema + gitleaks safety net are empirically proven; `lib/env.ts` already declares all six future-phase secrets.
- **Phase 6 (apex domain transfer):** Unblocked of its prerequisite. Vercel project linked to a `team_*` orgId scope; GitHub auto-deploys connected. Phase 6 only needs to bind the apex domain and execute the cutover from `marketing-app`.

## Self-Check: PASSED

**Files exist:**

- FOUND: `app/page.tsx` (39 lines)
- FOUND: `.vercel/project.json` (gitignored, untracked, contains valid projectId + orgId)

**Commits exist (`git log --oneline`):**

- FOUND: `3774ec7 feat(01-05): add app/page.tsx smoke-test page (D-12)` (Task 1)

**Empirical gates re-verified at continuation:**

- `npm run build` exits 0 — VERIFIED (Compiled successfully in 1893ms; 3 static pages prerendered)
- Port 3000 free post-Task-3 cleanup — VERIFIED (`lsof -ti:3000` empty)
- `.vercel/project.json` not tracked — VERIFIED (`git ls-files --error-unmatch` exits 1)
- `.vercel/` gitignored — VERIFIED (`.gitignore:32:.vercel`)
- Working tree clean before SUMMARY commit — VERIFIED (`git status --short` empty)

**Phase 1 status:** All five Phase 1 ROADMAP success criteria are satisfied (see roll-up table above). Phase 1 is complete.

---
*Phase: 01-scaffold-brand-token-parity*
*Plan: 05*
*Completed: 2026-04-27*
