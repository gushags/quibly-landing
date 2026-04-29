---
status: complete
phase: 05-legal-seo-analytics
source: [05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md]
started: 2026-04-29T18:00:00Z
updated: 2026-04-29T18:25:00Z
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
  artifacts: []
  missing: []

- truth: "OG image at /opengraph-image renders the Quibs mascot Q-mark with two-dot eyes (the brand signature)"
  status: failed
  reason: "User reported: The Q mark is supposed to have two dots for eyes. The eyes are missing."
  severity: major
  test: 5
  artifacts: []
  missing: []

- truth: "Favicon (/icon and /apple-icon) renders the Quibs mascot mark consistent with the on-page logo"
  status: failed
  reason: "User reported: You are using the correct mark on the / page. You are using an incorrect mark as the favicon."
  severity: major
  test: 6
  artifacts: []
  missing: []
