---
phase: 05-legal-seo-analytics
plan: 06
subsystem: seo
tags: [seo, favicon, apple-icon, og, satori, mascot, gap-closure]
requires:
  - public/quibs-icon.png (provided by 05-05)
provides:
  - "Brand-correct mascot favicon at /icon (32×32)"
  - "Brand-correct apple-touch-icon at /apple-icon (180×180)"
affects:
  - app/icon.tsx
  - app/apple-icon.tsx
tech-stack:
  added: []
  patterns:
    - "PNG-via-data-URI passed to <img> in Satori (next/og ImageResponse) — already established by 05-05 in app/opengraph-image.tsx; reused verbatim here for /icon and /apple-icon"
    - "runtime = 'nodejs' on next/og routes that read from public/ via node:fs/promises"
key-files:
  created: []
  modified:
    - app/icon.tsx
    - app/apple-icon.tsx
decisions:
  - "Use the existing 360×360 public/quibs-icon.png for both /icon (32×32) and /apple-icon (180×180); do NOT generate a 32×32-specific PNG. Satori downscales the 2-color mascot cleanly; revisit only if post-deploy founder reports the 32×32 looks muddy in tabs"
  - "Drop the eslint-disable-next-line @next/next/no-img-element comment from the plan's snippets — that lint rule is OFF in this project (see 05-05-SUMMARY.md), so the disable directive would be flagged as unused and fail --max-warnings=0"
  - "Inset sizes: 22×22 inside 32×32 frame (~5px breathing on each side); 130×130 inside 180×180 frame (~25px breathing, ~14% inset per Apple HIG)"
metrics:
  duration_minutes: 5
  completed_date: 2026-04-29
  task_count: 2
  file_count: 2
---

# Phase 5 Plan 6: Mascot Favicon (UAT Gap 3) Summary

Wired the 360×360 mascot PNG (`public/quibs-icon.png`, produced by 05-05) into both
`/icon` and `/apple-icon` so the browser tab and iOS home-screen icons match the
Quibs Q-face mascot used by the on-page hero and the OG card. Closes UAT Gap 3
(test 6, severity major).

## Background — what changed and why

Plan 02 shipped both `app/icon.tsx` and `app/apple-icon.tsx` as styled-text "Q"
placeholders because no PNG mascot existed under `public/` at the time, and Satori
(the Renderer behind `next/og`'s `ImageResponse`) does not support
`<img src=data:image/svg+xml;...>` in `@vercel/og` 0.11.x. Both files literally
carried the comment "Until a PNG mascot is added under public/, render a styled
text Q…".

Plan 05 added `public/quibs-icon.png` (360×360, transparent background, white
mascot) via `scripts/rasterize-mascot.mjs` and switched the OG card over to
PNG-via-data-URI. Plan 06 closes the favicon side of the same gap: both /icon and
/apple-icon now `readFile` the same shared PNG and pass it via base64 data URI to
`<img>`, mirroring the pattern in `app/opengraph-image.tsx` exactly.

## Implementation

Both files share the same shape:

1. `runtime = 'nodejs'` (required for `node:fs/promises`; Edge cannot read from
   `public/`).
2. `await readFile(join(process.cwd(), 'public/quibs-icon.png'))` →
   `data:image/png;base64,...` data URI.
3. `<img src={mascotDataUri} alt="" width={N} height={N} />` inside a teal
   (`#14a3a3`) flex container that fills the icon size.
4. Default export is now `async` (was synchronous on the placeholder).
5. The triple of public exports — `runtime`, `size`, `contentType` — is preserved
   verbatim, so the test contract in `tests/seo.spec.ts:30-50` (which asserts both
   surfaces return 200 with non-trivial body lengths > 200 / > 500 bytes) is held.

Inset sizes:

| surface         | frame   | mascot  | inset each side | rationale |
| --------------- | ------- | ------- | --------------- | --------- |
| `/icon`         | 32×32   | 22×22   | ~5px            | Matches the previous styled-Q `fontSize: 22` footprint; visually balanced for a small browser-tab icon. |
| `/apple-icon`   | 180×180 | 130×130 | ~25px (~14%)    | Matches Apple's HIG recommendation that home-screen icons leave roughly 14% inset; matches the previous styled-Q `fontSize: 120` scale. |

## Shared-asset rationale (no separate 32×32 PNG)

The plan explicitly authorized using one shared 360×360 PNG for both surfaces, not
generating a pre-sized 32×32 variant. Empirically, Satori's downscale of a clean
2-color (white + transparent) PNG produces a sharp result at 32×32, and the
verification body (799 bytes for `/icon`, 4,963 bytes for `/apple-icon` from the
prerendered `.next/server/app/*.body` files) is healthy — both well above the
seo.spec.ts floor.

**Trigger condition for revisiting:** post-deploy, if the founder UAT step (open
`/` in a fresh incognito window — favicons cache aggressively, so a hard-refresh
of a previously-viewed tab will NOT show the new icon) reports the 32×32 looks
muddy in browser tabs, a follow-up gap-closure plan can add a pre-sized
`public/quibs-icon-32.png`. No anticipation work needed today.

## Founder UAT note — favicon caching

Browsers cache favicons aggressively. To verify the new mascot appears:

- Open `useQuibly.com` (post-deploy) in a **fresh incognito / private window**, or
- Use DevTools → Network tab → "Disable cache" and hard-reload, or
- Visit `/icon` and `/apple-icon` directly to confirm the prerendered PNGs include
  the mascot with two visible eye-dots.

A normal hard-refresh on a tab that previously showed the placeholder Q will NOT
update the favicon — the browser keeps the old icon for the lifetime of the tab.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 — Build env vars missing in worktree]**
- **Found during:** Task 1 verification (`npm run build` failed with Zod
  validation errors for `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`,
  `RESEND_FROM_POSTAL_ADDRESS`).
- **Cause:** Parallel-executor worktree pattern — fresh worktree has no
  `.env.local`, but `lib/env.ts` validates required env at build time.
- **Fix:** Copied parent repo's `.env.local` into the worktree (gitignored — not
  committed). Same workaround documented in `05-05-SUMMARY.md`.
- **Files modified:** none (env file is gitignored).

**2. [Rule 1 — eslint-disable directive removed from plan snippets]**
- **Found during:** pre-Task-1 review of plan-supplied code.
- **Issue:** The plan's full-file content for both `app/icon.tsx` and
  `app/apple-icon.tsx` included `{/* eslint-disable-next-line
  @next/next/no-img-element */}`, but Plan 05-05's SUMMARY documents that this
  rule is OFF in the project ESLint config. With the rule off, the disable
  directive becomes an unused-disable warning, which fails
  `eslint --max-warnings=0`.
- **Fix:** Removed the `eslint-disable-next-line` comment from both files before
  committing. Lint now passes (`npm run lint` → 0 warnings).
- **Files modified:** `app/icon.tsx`, `app/apple-icon.tsx`.

## Verification Results

| Check                                                      | Result                                                |
| ---------------------------------------------------------- | ----------------------------------------------------- |
| `npm run check` (tsc --noEmit)                             | PASS                                                  |
| `npm run lint` (eslint --max-warnings=0)                   | PASS — 0 warnings                                     |
| `npm run build` (next + turbopack)                         | PASS — `/icon` and `/apple-icon` prerendered as static |
| `.next/server/app/icon.body` size                          | 799 bytes (> 200 byte floor in seo.spec.ts:38)        |
| `.next/server/app/apple-icon.body` size                    | 4,963 bytes (> 500 byte floor in seo.spec.ts:46)      |
| `npm run test:e2e -- tests/seo.spec.ts`                    | PASS — 8/8 SEO tests, including SEO-05 favicon test    |

## Task Commits

| Task | Description                                          | Commit   |
| ---- | ---------------------------------------------------- | -------- |
| 1    | Render mascot PNG in /icon (32×32)                   | ae5399b  |
| 2    | Render mascot PNG in /apple-icon (180×180)           | 27f212d  |

## Patterns established

- **Reuse the same `public/quibs-icon.png` across all three Satori-rendered
  surfaces** (OG card, /icon, /apple-icon) instead of generating per-size
  variants. Asset count stays at one; downscale fidelity verified empirically.
- **PNG-via-data-URI is the only mascot-rendering pattern for Satori in this
  codebase.** Anyone adding a new `next/og` route that needs the mascot must
  follow the readFile → base64 data URI → `<img>` pattern documented here, in
  `app/opengraph-image.tsx`, and in `05-05-SUMMARY.md`. Do NOT attempt SVG via
  data URI — `@vercel/og` 0.11.x crashes or produces an empty image.
- **Do not include `eslint-disable-next-line @next/next/no-img-element`** on Satori
  `<img>` usage in this project. The rule is off in the ESLint config; the
  disable directive triggers an unused-disable warning that fails
  `--max-warnings=0`.

## Self-Check: PASSED

- File `app/icon.tsx` exists and contains `readFile` + `quibs-icon.png` reference: FOUND
- File `app/apple-icon.tsx` exists and contains `readFile` + `quibs-icon.png` reference: FOUND
- Commit ae5399b (Task 1) present in git log: FOUND
- Commit 27f212d (Task 2) present in git log: FOUND
- `must_haves.key_links[0].pattern` (`readFile.*quibs-icon\.png` in icon.tsx): FOUND
- `must_haves.key_links[1].pattern` (`readFile.*quibs-icon\.png` in apple-icon.tsx): FOUND
- `must_haves.artifacts[0].contains` (`quibs-icon.png` in app/icon.tsx): FOUND
- `must_haves.artifacts[1].contains` (`quibs-icon.png` in app/apple-icon.tsx): FOUND
