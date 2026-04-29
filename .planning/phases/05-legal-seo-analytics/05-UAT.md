---
status: diagnosed
phase: 05-legal-seo-analytics
source: [05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md]
started: 2026-04-29T18:00:00Z
updated: 2026-04-29T18:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Privacy page renders with GDPR-compliant content
expected: |
  Visit `/privacy`. Page renders with ~9 sections, mentions GDPR Article 6(1)(a),
  names Vercel + Resend as processors, has a retention clause ("launch + 12
  months"), and a DSAR mailto: privacy@useQuibly.com link. Postal address from
  RESEND_FROM_POSTAL_ADDRESS env var displays in footer/contact section.
result: pass

### 2. Terms page renders with waitlist-scoped TOS
expected: |
  Visit `/terms`. Page renders with ~6 sections covering: acceptance of terms,
  no guarantees about launch / features, right of withdrawal (user can leave
  the waitlist any time), Delaware governing law, and a contact section.
result: issue
reported: "why Delaware law? I'm an LLC in CA?"
severity: major

### 3. Footer Privacy + Terms links navigate without 404
expected: |
  On `/`, scroll to footer. Click "Privacy" — it loads /privacy with no 404.
  Click back, then click "Terms" — it loads /terms with no 404.
result: pass

### 4. Consent + reassurance microcopy on waitlist form
expected: |
  On `/`, scroll to the waitlist form. A microcopy block sits adjacent to the
  submit button (above or below) with two pieces of text: a reassurance line
  (e.g. "No spam. Unsubscribe anytime.") and a consent line that explicitly
  references Privacy and Terms with anchor links to /privacy and /terms.
  Clicking each link navigates correctly.
result: pass

### 5. OG image renders at 1200×630 with brand styling
expected: |
  Visit `/opengraph-image` directly in a browser tab. Image loads as a
  1200×630 PNG with a teal gradient panel on the left containing a "Q" letter
  mark (Quicksand 700) and a tagline panel on the right with text in
  Quicksand/Figtree weights. No broken image, no Satori crash.
result: issue
reported: "The Q mark is supposed to have two dots for eyes. The eyes are missing."
severity: major

### 6. Favicon shows in browser tab
expected: |
  On `/`, the browser tab icon shows the Quibly teal "Q" favicon (not the
  default Next.js favicon, not a blank/broken icon). Visit `/icon` directly —
  a 32×32 PNG renders.
result: issue
reported: "You are using the correct mark on the / page. You are using an incorrect mark as the favicon."
severity: major

### 7. robots.txt lists 10 AI crawler Allow rules + sitemap
expected: |
  Visit `/robots.txt`. Output contains 10 named per-agent rules — GPTBot,
  OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User,
  Google-Extended, PerplexityBot, Perplexity-User, CCBot — each with
  `Allow: /`. Includes a `Sitemap:` line pointing to the sitemap URL. No
  wildcard `User-agent: *` rule, no explicit Googlebot/Bingbot rules.
result: pass

### 8. sitemap.xml lists exactly 3 absolute URLs
expected: |
  Visit `/sitemap.xml`. XML response lists exactly 3 `<url><loc>` entries —
  the home page (`/`), `/privacy`, and `/terms` — each as absolute URLs (with
  `https://useQuibly.com/...` or the preview-deploy host). No relative paths.
result: pass

### 9. Extended head metadata in page source
expected: |
  On `/`, view page source (Cmd-U / Ctrl-U). The `<head>` contains:
  - `<meta property="og:site_name" content="Quibly">` (or similar)
  - `<meta property="og:locale" content="en_US">`
  - `<meta name="twitter:card" content="summary_large_image">`
  - An og:image meta tag (auto-emitted by the file convention) referencing
    `/opengraph-image`.
result: pass

### 10. Schema.org JSON-LD scripts in page source
expected: |
  On `/`, view page source. Two `<script type="application/ld+json">` tags
  appear before the `<main>` element: one Organization schema, one WebSite
  schema. Both parse as valid JSON when copied into a JSON validator (any `<`
  inside is escaped as `<`, not raw).
result: pass

### 11. Cookieless: zero cookies set after page load + form submit
expected: |
  Open `/` in a new incognito/private window. DevTools → Application →
  Cookies → list for the current origin shows ZERO cookies after initial
  page load. Submit the waitlist form with a fresh email (or test value) —
  cookie count remains zero. No `_ga`, no `_vercel_*`, no Plausible, nothing.
result: pass

### 12. Vercel Analytics + Speed Insights scripts load successfully
expected: |
  On `/`, open DevTools → Network tab → reload. Filter for "insights" or
  "vercel". Two scripts request and return 200 (not 404, not blocked):
  `/_vercel/insights/script.js` (Analytics) and
  `/_vercel/speed-insights/script.js` (Speed Insights). No console errors
  related to either script.
result: pass
note: |
  Dev-mode confirmed: both scripts load as `script.debug.js` (not `script.js`)
  with HTTP 200 from layout.tsx:56 (Analytics) and layout.tsx:57 (SpeedInsights).
  This is the documented Vercel behavior — production swaps in `script.js`.
  Post-deploy verification (custom events visible in Analytics dashboard) is
  the canonical production check.

## Summary

total: 12
passed: 9
issues: 3
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Terms governing law clause matches the founder's actual entity jurisdiction"
  status: failed
  reason: "User reported: why Delaware law? I'm an LLC in CA?"
  severity: major
  test: 2
  root_cause: |
    `app/(legal)/terms/page.tsx` lines 60-64 hardcode "State of Delaware" as
    governing law and venue. The Phase 5 CONTEXT.md explicitly noted this was
    a "reasonable default" for the planner with founder confirmation deferred
    to PR review (`05-CONTEXT.md:183` — "governing law (Claude picks
    reasonable default during planning, founder confirms in PR)"). Founder is
    a CA LLC; the default was never confirmed and is incorrect for the actual
    entity jurisdiction.
  artifacts:
    - path: "app/(legal)/terms/page.tsx"
      issue: "Lines 60-64 hardcode 'State of Delaware, USA' and 'courts of Delaware' — should be California."
  missing:
    - "Replace 'State of Delaware, USA' with 'State of California, USA' in Governing Law section."
    - "Replace 'courts of Delaware' with 'state or federal courts located in California' (or county-level if preferred)."
    - "Update tests/legal.spec.ts if any test asserts on the literal 'Delaware' string (verify and adjust)."
  debug_session: ""

- truth: "OG image at /opengraph-image renders the Quibs mascot Q-mark with two-dot eyes (the brand signature)"
  status: failed
  reason: "User reported: The Q mark is supposed to have two dots for eyes. The eyes are missing."
  severity: major
  test: 5
  root_cause: |
    `app/opengraph-image.tsx` (lines ~33-49) renders a styled `<div>` with the
    letter "Q" inside a rounded teal-translucent square instead of the Quibs
    mascot. SUMMARY 05-02 documents this as "auto-fix": Satori in @vercel/og
    0.11.x crashes when rendering an `<img src=data:image/svg+xml;…>` reference
    to `public/quibs-icon.svg` (the actual mascot, which contains the Q-face
    plus two eye paths). The fallback dropped the eyes — the brand signature.
    Two viable Satori-compatible fix paths exist:
      (a) compose the mascot in JSX — Q letter + two absolutely-positioned dot
          `<div>`s for the eyes (no SVG, no data URIs, full Satori support);
      (b) pre-rasterize `public/quibs-icon.svg` to PNG (e.g. `public/quibs-icon.png`
          at 360×360) and load via `<img src="...">` — Satori supports PNG imgs.
    Option (b) gives exact visual parity with the on-page mascot.
  artifacts:
    - path: "app/opengraph-image.tsx"
      issue: "Left-panel renders styled 'Q' div (lines ~33-49) instead of the Quibs mascot with eyes."
    - path: "public/quibs-icon.svg"
      issue: "Source mascot SVG exists but cannot be rendered directly by Satori 0.11.x."
  missing:
    - "DECISION (founder, 2026-04-29): use approach (b) — pre-rasterized PNG of the Quibs mascot from public/quibs-icon.svg, for exact visual parity with the on-page mascot."
    - "Generate public/quibs-icon.png at 360×360 (transparent background, white mascot — match the on-page color/treatment) from public/quibs-icon.svg. Use sharp, ImageMagick, or rsvg-convert; commit the PNG to the repo."
    - "Update app/opengraph-image.tsx left panel: replace the styled-Q div with an <img> tag loading the PNG via fs read + buffer-to-data-URI (Satori supports PNG <img>). Size the mascot to ~180-220px square within the existing 40% left column."
    - "Verify `npm run build` succeeds and the rendered /opengraph-image PNG shows two visible eyes — open /opengraph-image directly in a browser."
    - "Update tests/seo.spec.ts only if it asserts on Q-letter text content (verify by reading the spec; otherwise no test change needed)."
  debug_session: ""

- truth: "Favicon (/icon and /apple-icon) renders the Quibs mascot mark consistent with the on-page logo"
  status: failed
  reason: "User reported: You are using the correct mark on the / page. You are using an incorrect mark as the favicon."
  severity: major
  test: 6
  root_cause: |
    `app/icon.tsx` and `app/apple-icon.tsx` both render a styled `<div>` with
    sans-serif "Q" on a flat teal background — the inline comment in both
    files says "Until a PNG mascot is added under public/, render a styled
    text Q on the brand teal background." The PNG was never added; the
    placeholder ships as production. Same root cause and same fix path as
    Gap 2 (OG image) — Satori-compatible mascot rendering. Recommend the
    same approach picked for the OG image so all three surfaces (OG, /icon
    32×32, /apple-icon 180×180) stay visually consistent.
  artifacts:
    - path: "app/icon.tsx"
      issue: "Lines 17-32 render styled 'Q' div instead of mascot with eyes."
    - path: "app/apple-icon.tsx"
      issue: "Lines 17-32 render styled 'Q' div instead of mascot with eyes (180×180 variant)."
  missing:
    - "DECISION (founder, 2026-04-29): use approach (b) — same PNG-mascot approach as OG image, for visual consistency across OG card, favicon, and apple-icon."
    - "Reuse public/quibs-icon.png (generated for OG image) in app/icon.tsx (32×32) and app/apple-icon.tsx (180×180). For 32×32 quality, consider generating a second public/quibs-icon-32.png pre-sized at 32×32 to avoid Satori downscaling artifacts; otherwise reuse 360×360."
    - "Update app/icon.tsx and app/apple-icon.tsx: keep the teal background div but replace the inner styled-Q div with the mascot PNG <img>."
    - "Verify favicon visibly shows two-dot eyes at 32×32 in browser tab (hard-refresh required) and at 180×180 on iOS home-screen save."
  debug_session: ""
