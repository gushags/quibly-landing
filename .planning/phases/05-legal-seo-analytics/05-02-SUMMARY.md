---
phase: 05-legal-seo-analytics
plan: 02
subsystem: seo
tags: [seo, opengraph, structured-data, metadata, robots, sitemap, imageresponse, playwright]

# Dependency graph
requires:
  - phase: 05-legal-seo-analytics
    plan: 01
    provides: "/privacy and /terms pages required for sitemap.ts 3-entry list"
  - phase: 02-static-landing-page-no-form
    provides: "app/layout.tsx metadata base structure"
  - phase: 01-scaffold-brand-token-parity
    provides: "public/quibs-icon.svg, brand tokens"

provides:
  - "app/opengraph-image.tsx — 1200×630 PNG OG image, mascot-left (teal gradient + Q) + tagline-right (Quicksand 700)"
  - "app/icon.tsx — 32×32 favicon PNG via Next.js file convention (/icon route)"
  - "app/apple-icon.tsx — 180×180 apple-touch-icon PNG via file convention"
  - "app/robots.ts — 10 AI crawler Allow: / rules (D-05/D-06); sitemap reference"
  - "app/sitemap.ts — 3 URL entries: /, /privacy, /terms"
  - "app/layout.tsx (MODIFY) — extended metadata: siteName, locale, twitter:card=summary_large_image"
  - "app/page.tsx (MODIFY) — Schema.org JSON-LD: Organization + WebSite scripts with XSS escape"
  - "tests/seo.spec.ts — 8 Playwright e2e tests SEO-01..08, all green"
  - "public/fonts/ — Quicksand-Bold.ttf + Figtree-Medium.ttf (variable, archived) + WOFF1 statics + OFL licenses"

affects:
  - "05-03 (analytics plan) — og:image already emitted, metadata extended; Plan 03 adds Analytics+SpeedInsights to layout body"
  - "Phase 6 production deploy — SEO gates SEO-01..08 now satisfied"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "next/og ImageResponse with runtime=nodejs + WOFF1 fonts (variable TTF unsupported in Satori)"
    - "next/og mascot-left + tagline-right composition with teal gradient"
    - "MetadataRoute.Robots with 10 per-agent rules (no wildcard catch-all)"
    - "MetadataRoute.Sitemap with absolute URLs (metadataBase does NOT prefix sitemap)"
    - "Schema.org JSON-LD via dangerouslySetInnerHTML + .replace(/</g, '\\u003c') XSS escape"
    - "openGraph without .images property (file convention auto-emits og:image — Pitfall 6 avoidance)"

key-files:
  created:
    - "app/opengraph-image.tsx"
    - "app/icon.tsx"
    - "app/apple-icon.tsx"
    - "app/robots.ts"
    - "app/sitemap.ts"
    - "tests/seo.spec.ts"
    - "public/fonts/Quicksand-Bold.ttf"
    - "public/fonts/Quicksand-Bold.woff"
    - "public/fonts/Figtree-Medium.ttf"
    - "public/fonts/Figtree-Medium.woff"
    - "public/fonts/Quicksand-OFL.txt"
    - "public/fonts/Figtree-OFL.txt"
  modified:
    - "app/layout.tsx"
    - "app/page.tsx"

key-decisions:
  - "WOFF1 static-weight fonts used instead of variable TTF for ImageResponse — Satori cannot process fvar/gvar variable font tables (crashes with Cannot read properties of undefined reading '256')"
  - "app/icon.tsx generates /icon route (not /favicon.ico) — Next.js file convention maps to /icon; test updated to match real behavior"
  - "Q letter mark used in OG image left panel instead of SVG mascot — SVG data URI via <img> in ImageResponse also crashes Satori in @vercel/og 0.11.1"
  - "metadata.openGraph.images NOT set — file convention auto-emits og:image (Pitfall 6 mitigation)"
  - "JSON-LD uses \\u003c escape (not &lt;) — valid JSON, parseability preserved for Playwright test"

requirements-completed:
  - SEO-01
  - SEO-02
  - SEO-03
  - SEO-04
  - SEO-05
  - SEO-06
  - SEO-07
  - SEO-08

# Metrics
duration: ~10min
completed: 2026-04-29
---

# Phase 05 Plan 02: SEO + Open Graph + Discoverability Summary

**Dynamic 1200×630 OG image, favicon, apple-touch-icon, robots.txt with AI crawler allows, sitemap.xml, Schema.org JSON-LD, and extended head metadata — all 8 SEO e2e tests green**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-04-29T16:44:24Z
- **Completed:** 2026-04-29T16:54:00Z
- **Tasks:** 4
- **Files modified:** 14

## Accomplishments

- Built `app/opengraph-image.tsx` — 1200×630 PNG with teal-gradient left panel (Q letter mark) + tagline-right composition; uses WOFF1 static-weight Quicksand 700 + Figtree 500 via `node:fs` reads; `runtime='nodejs'` (Pitfall 7 mitigation)
- Built `app/icon.tsx` (32×32 favicon PNG) + `app/apple-icon.tsx` (180×180 apple-touch-icon PNG) — both derived from teal brand palette + Q mark; registered as `<link rel="icon">` / `<link rel="apple-touch-icon">` by Next.js
- Built `app/robots.ts` — 10 named AI crawlers all `Allow: /` (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, Google-Extended, PerplexityBot, Perplexity-User, CCBot) + sitemap reference; no wildcard rule; no Googlebot/Bingbot explicit rules (D-06)
- Built `app/sitemap.ts` — 3 absolute URL entries: `/`, `/privacy`, `/terms`
- Extended `app/layout.tsx` metadata: siteName, locale en_US, twitter:card=summary_large_image; no `openGraph.images` (Pitfall 6)
- Injected Schema.org JSON-LD (Organization + WebSite) into `app/page.tsx` before `<main>`; `\\u003c` XSS escape; `JSON.parse()` roundtrip tested in e2e
- Downloaded Quicksand and Figtree font binaries (variable TTF + WOFF1 static); OFL 1.1 license files committed for attribution compliance

## Task Commits

Each task was committed atomically:

1. **Task 1: SEO test scaffold + font binaries** - `fa7b652` (test)
2. **Task 2: OG image + favicon + apple-touch-icon generators** - `99ce5d6` (feat)
3. **Task 3: robots.ts + sitemap.ts** - `cd25eae` (feat)
4. **Task 4: layout.tsx metadata extension + page.tsx JSON-LD** - `f843edd` (feat)

**Plan metadata:** (committed with SUMMARY.md)

## Files Created/Modified

- `app/opengraph-image.tsx` — ImageResponse 1200×630; Q-mark mascot-left + tagline-right; WOFF1 fonts
- `app/icon.tsx` — 32×32 favicon PNG file convention
- `app/apple-icon.tsx` — 180×180 apple-touch-icon PNG file convention
- `app/robots.ts` — 10 AI crawler Allow rules; no Googlebot/Bingbot explicit rules (D-06)
- `app/sitemap.ts` — 3 URL entries with absolute paths
- `app/layout.tsx` — extended metadata: title default updated, description tightened, OG + Twitter card fields added
- `app/page.tsx` — Organization + WebSite JSON-LD scripts injected before `<main>`
- `tests/seo.spec.ts` — 8 Playwright e2e tests SEO-01..08, all green
- `public/fonts/Quicksand-Bold.ttf` — variable font (archived; not used for ImageResponse — Satori incompatible)
- `public/fonts/Quicksand-Bold.woff` — static-weight WOFF1 (used by ImageResponse)
- `public/fonts/Figtree-Medium.ttf` — variable font (archived)
- `public/fonts/Figtree-Medium.woff` — static-weight WOFF1 (used by ImageResponse)
- `public/fonts/Quicksand-OFL.txt` + `Figtree-OFL.txt` — OFL 1.1 license attribution

## Decisions Made

- WOFF1 static-weight fonts chosen over variable TTF for `ImageResponse` — variable fonts crash Satori
- Q letter mark (styled `<div>`) used in OG image left panel instead of `<img src={svgDataUri}>` — SVG data URIs also crash Satori 0.11.x
- `app/icon.tsx` → `/icon` route (not `/favicon.ico`) — test updated to match actual Next.js behavior
- `openGraph.images` NOT set in `layout.tsx` — file convention auto-emits `og:image` (Pitfall 6)
- JSON-LD placed in `app/page.tsx` (home page only) not `layout.tsx` — Organization/WebSite describes the home entity only

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Variable font TTF incompatible with Satori — crashes with Cannot read properties of undefined reading '256'**
- **Found during:** Task 2 (first build with opengraph-image.tsx)
- **Issue:** The Google Fonts GitHub variable TTF files contain `fvar` and `gvar` tables (weight axis). Satori/resvg-js 0.11.x cannot process variable font axis tables and throws `Cannot read properties of undefined (reading '256')` during `ImageResponse` rendering at build time.
- **Fix:** Downloaded WOFF1 static-weight files from `@fontsource/quicksand` (already installed in main repo) and `@fontsource/figtree` (newly installed). Saved as `public/fonts/Quicksand-Bold.woff` + `Figtree-Medium.woff`. Updated `opengraph-image.tsx` to read the WOFF1 files. The TTF binaries remain committed for archival and future use if Satori is upgraded.
- **Files modified:** `app/opengraph-image.tsx`, `public/fonts/` (added WOFF1 files)
- **Commits:** `99ce5d6`

**2. [Rule 1 - Bug] SVG data URI via `<img>` also crashes Satori — Q letter mark used instead**
- **Found during:** Task 2 (initial implementation attempted to use mascotSrc data URI per PATTERNS.md)
- **Issue:** `<img src={mascotSrc}>` where `mascotSrc` is `data:image/svg+xml;base64,...` also triggers the same Satori crash path. PITFALL 4 in RESEARCH.md mentions SVG inline element limitations, but the data URI `<img>` approach is also affected.
- **Fix:** Replaced SVG `<img>` with a styled `<div>` containing the letter "Q" in Quicksand 700 on a slightly translucent teal background — visually coherent with the brand, font-consistent with the tagline right panel, and 100% Satori-compatible.
- **Files modified:** `app/opengraph-image.tsx` (no separate commit — same as Rule 1 Bug #1)
- **Commits:** `99ce5d6`

**3. [Rule 1 - Bug] Plan stated app/icon.tsx maps to /favicon.ico — actual route is /icon**
- **Found during:** Task 2 verification (favicon test failing)
- **Issue:** The plan's task description stated "Next.js maps `app/icon.tsx` → `/favicon.ico` AND `/icon` (both work)." This is incorrect. Next.js `app/icon.tsx` generates `/icon` only; `/favicon.ico` returns 404. The browser and social crawlers follow the `<link rel="icon" href="/icon">` tag emitted by Next.js, so /icon is the correct route.
- **Fix:** Updated `tests/seo.spec.ts` favicon test to check `/icon` (not `/favicon.ico`). Added inline comment explaining the file convention behavior.
- **Files modified:** `tests/seo.spec.ts`
- **Commits:** `99ce5d6`

---

**Total deviations:** 3 auto-fixed (all Rule 1 bugs)
**Impact on plan:** All auto-fixes required for correctness. OG image renders correctly. Tests pass. No scope creep.

## Known Stubs

None. All plan outputs are fully wired.

## Threat Flags

No new network endpoints, auth paths, or schema changes beyond what the threat model covers. The OG image, robots, and sitemap routes are server-rendered constants — no user input reaches any of these surfaces.

## Issues Encountered

- `@vercel/og` 0.11.1 (bundled with Next.js 16.2.1) does not support variable font tables (`fvar`/`gvar`) in TTF files downloaded from Google Fonts GitHub. Static-weight WOFF1 files from `@fontsource` work reliably.
- `@fontsource/figtree` was not previously installed in the main repo; installed during execution (`npm install @fontsource/figtree` in main repo, WOFF1 file then copied to worktree's `public/fonts/`).

## User Setup Required

None for this plan. The font binaries are committed to the repo.

## Next Phase Readiness

- SEO gates SEO-01..08 satisfied; all 8 e2e tests green
- `app/layout.tsx` body is UNTOUCHED (Plan 03 inserts `<Analytics />` + `<SpeedInsights />` before `</body>`)
- `app/page.tsx` composition unchanged (JSON-LD injected only as `<script>` siblings before `<main>`)
- OG image available at `/opengraph-image`; twitter:card=summary_large_image emitted; ready for manual UAT via opengraph.xyz / X Card validator / LinkedIn Post Inspector

---
*Phase: 05-legal-seo-analytics*
*Completed: 2026-04-29*

## Self-Check: PASSED

Files verified:
- FOUND: app/opengraph-image.tsx
- FOUND: app/icon.tsx
- FOUND: app/apple-icon.tsx
- FOUND: app/robots.ts
- FOUND: app/sitemap.ts
- FOUND: tests/seo.spec.ts
- FOUND: public/fonts/Quicksand-Bold.ttf
- FOUND: public/fonts/Quicksand-Bold.woff
- FOUND: public/fonts/Figtree-Medium.ttf
- FOUND: public/fonts/Figtree-Medium.woff
- FOUND: public/fonts/Quicksand-OFL.txt
- FOUND: public/fonts/Figtree-OFL.txt

Commits verified:
- FOUND: fa7b652 (test: SEO scaffold + font binaries)
- FOUND: 99ce5d6 (feat: OG image + icons)
- FOUND: cd25eae (feat: robots + sitemap)
- FOUND: f843edd (feat: metadata + JSON-LD)

Tests verified:
- 8/8 seo.spec.ts tests PASSED
- 7/7 legal.spec.ts tests PASSED (no regressions)
- 76/76 vitest unit tests PASSED (no regressions)
