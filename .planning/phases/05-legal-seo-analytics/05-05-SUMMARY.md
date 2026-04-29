---
phase: 05-legal-seo-analytics
plan: 05
subsystem: seo
tags: [og-image, satori, sharp, mascot, rasterization, svg, png]

# Dependency graph
requires:
  - phase: 05-legal-seo-analytics
    provides: 05-02 OG image scaffold (left/right two-column ImageResponse with Satori font reads)
provides:
  - public/quibs-icon.png (360x360 white-mascot transparent PNG, reusable asset)
  - scripts/rasterize-mascot.mjs (idempotent SVG->PNG rasterization tooling)
  - app/opengraph-image.tsx renders the actual brand mascot via <img> data URI
affects: [05-06 favicon mascot, future OG variants, marketing-app handover]

# Tech tracking
tech-stack:
  added: [sharp@^0.33 (devDep)]
  patterns:
    - "Pre-rasterize SVG to PNG via sharp + fill-injection for Satori-compatible <img> data URIs"
    - "readFile + base64 data URI inside ImageResponse Promise.all alongside font reads"

key-files:
  created:
    - scripts/rasterize-mascot.mjs
    - public/quibs-icon.png
  modified:
    - app/opengraph-image.tsx
    - package.json
    - package-lock.json

key-decisions:
  - "Use sharp (not @resvg/resvg-js or rsvg-convert CLI) because it's the canonical Node SVG/PNG rasterizer Next.js itself bundles for image optimization"
  - "Inject fill=#ffffff into the SVG root element before rasterization (paths in quibs-icon.svg have no per-path fill; on-page React achieves white via currentColor + text-white parent class)"
  - "Commit the PNG to the repo and DO NOT add a pre/post npm hook to regenerate at build time (avoids forcing sharp on Vercel CI for zero benefit)"
  - "Drop the eslint-disable @next/next/no-img-element directive — the rule is OFF in this project, and ESLint flags unused-disable as a warning that fails --max-warnings=0"

patterns-established:
  - "Pre-rasterized PNG asset + readFile + base64 data URI: the pattern Plan 06 will reuse for the favicon mascot"
  - "Idempotent .mjs scripts in scripts/ for one-off asset generation, documented inline with WHY/REGENERATION blocks"

requirements-completed: [SEO-OG-IMAGE, UAT-GAP-2]

# Metrics
duration: ~10 min
completed: 2026-04-29
---

# Phase 05 Plan 05: OG Image Mascot Restoration Summary

**OG image left panel renders the actual Quibs mascot (Q-face plus two visible eye-dots) via a pre-rasterized PNG, replacing the styled-text "Q" placeholder that lost the brand signature.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-04-29T19:16:00Z
- **Completed:** 2026-04-29T19:26:26Z
- **Tasks:** 2
- **Files modified:** 5 (1 created script, 1 created asset, 1 modified TSX, package.json + lock)

## Accomplishments
- Closed UAT Gap 2: social previews now show the actual brand signature (Q-face plus two dot-eyes) instead of a generic styled "Q" tile
- Established reusable, idempotent SVG->PNG asset pipeline in `scripts/rasterize-mascot.mjs`
- Verified Satori 0.11.x renders PNG-via-data-URI correctly (the workaround for its SVG-via-data-URI crash documented in 05-02-SUMMARY.md)
- All 8 SEO Playwright tests pass; production build succeeds

## Task Commits

Each task was committed atomically:

1. **Task 1: Add sharp devDep + create rasterize-mascot script + commit PNG** - `bd71c8e` (feat)
2. **Task 2: Replace OG image left-panel styled-Q div with mascot PNG <img>** - `b951082` (feat)

## Files Created/Modified

- `scripts/rasterize-mascot.mjs` (created) - Idempotent SVG->PNG rasterizer using sharp; injects `fill="#ffffff"` into the SVG root before rasterizing so paths with no per-path fill render white on a transparent background. 360x360 output.
- `public/quibs-icon.png` (created) - 9005 bytes, 360x360, transparent background, white Q-face + two eye-dots. Verified via `sharp().metadata()`: `width=360 height=360 format=png hasAlpha=true`. Pixel sample: ~34k white pixels (mascot strokes), ~93k transparent pixels (background).
- `app/opengraph-image.tsx` (modified) - Reads `public/quibs-icon.png` in `Promise.all` alongside the existing WOFF font reads; encodes as `data:image/png;base64,...`; renders via `<img width=180 height=180>` inside the existing 220x220 translucent rounded container in the 40% left teal-gradient column.
- `package.json` (modified) - Added `sharp@^0.33` to `devDependencies`.
- `package-lock.json` (modified) - Locked sharp + transitive deps.

## Decisions Made

- **Approach (b) PNG (not approach (a) inline SVG paths)** — Founder lock-in 2026-04-29. PNG gives exact visual parity with the on-page mascot and avoids per-component path duplication.
- **sharp over @resvg/resvg-js or external CLI rasterizers** — sharp is the canonical Node SVG/PNG library Next.js itself bundles; one devDep covers the use case; no external binary requirement.
- **Inject `fill="#ffffff"` into the SVG root, not into individual paths** — Simpler regex; paths have no per-path fill, so root inheritance covers all three path elements (Q-face + 2 eye-dots) uniformly. Idempotent: handles both "fill already present" and "fill missing" cases.
- **Commit the PNG; do NOT add a build-time regeneration hook** — Forcing sharp on Vercel CI for zero benefit (the SVG changes rarely). PNG is small (9KB); committing is correct.
- **Removed the eslint-disable directive** — Rule `@next/next/no-img-element` is OFF in this project; the disable directive was flagged as unused, which fails `lint --max-warnings=0`. Plan 06 (favicon) should not blindly copy the disable comment either.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused `eslint-disable-next-line @next/next/no-img-element` directive**
- **Found during:** Task 2 (npm run lint)
- **Issue:** Plan instructed adding the eslint-disable comment defensively, but the `@next/next/no-img-element` rule is not enabled in this project's ESLint config. ESLint's `reportUnusedDisableDirectives` flagged the comment as a warning, and `lint --max-warnings=0` failed.
- **Fix:** Removed the `{/* eslint-disable-next-line ... */}` line. The bare `<img>` element is preserved; Satori only understands `<img>`, not `next/image`.
- **Files modified:** `app/opengraph-image.tsx`
- **Verification:** `npm run lint` exits clean.
- **Committed in:** `b951082` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Trivial — directive was instructional defensiveness; the underlying behavior (bare `<img>` rendered by Satori) is unchanged. No scope creep.

## Issues Encountered

- **Local build env vars missing in worktree** — `npm run build` initially failed because the worktree lacked `.env.local` (the lib/env.ts validator requires UPSTASH_REDIS_REST_URL, RESEND_FROM_POSTAL_ADDRESS, etc.). Resolved by copying the parent repo's `.env.local` into the worktree (gitignored — not committed). This is an artifact of the parallel-executor worktree pattern, not a code issue.

## Verification Results

| Check | Result |
|---|---|
| `npm run check` (tsc) | PASS — no type errors |
| `npm run lint` (eslint) | PASS — 0 warnings |
| `npm run build` (next + turbopack) | PASS — `/opengraph-image` prerendered as static |
| Generated `.next/server/app/opengraph-image.body` | 1200x630 RGBA PNG, ~55KB (was ~smaller with the styled-Q placeholder) |
| `npm run test:e2e -- tests/seo.spec.ts` | PASS — 8/8 tests including og-image-200 + favicon |
| `sharp().metadata()` on `public/quibs-icon.png` | OK 360 360 png hasAlpha=true |

## User Setup Required

None - no external service configuration required for this plan.

## Next Phase Readiness

- **Plan 05-06 (favicon) DEPENDS on this plan's artifact** — `public/quibs-icon.png` is the same asset Plan 06 will consume to render `app/icon.tsx` and `app/apple-icon.tsx` mascot favicons via the same Satori `<img>` data-URI pattern. The pre-rasterization tooling (`scripts/rasterize-mascot.mjs`) is reusable across both plans.
- **Visual verification still needed** — Build-time pixel checks confirm the asset is correct and the OG image is a valid 1200x630 RGBA PNG, but a human eyeball check on the generated `/opengraph-image` route at preview-deploy time is recommended before launch (UAT test 5 closes once verified).
- **Mascot regeneration** — If `public/quibs-icon.svg` ever changes, run `node scripts/rasterize-mascot.mjs` and commit the updated PNG.

## Self-Check: PASSED

- FOUND: scripts/rasterize-mascot.mjs
- FOUND: public/quibs-icon.png (9005 bytes, 360x360, transparent, white mascot)
- FOUND: app/opengraph-image.tsx modifications
- FOUND: commit bd71c8e (Task 1)
- FOUND: commit b951082 (Task 2)

---
*Phase: 05-legal-seo-analytics*
*Completed: 2026-04-29*
