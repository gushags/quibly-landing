---
phase: 05-legal-seo-analytics
fixed_at: 2026-04-29T17:36:20Z
review_path: .planning/phases/05-legal-seo-analytics/05-REVIEW.md
iteration: 1
findings_in_scope: 11
fixed: 11
skipped: 0
status: all_fixed
---

# Phase 5: Code Review Fix Report

**Fixed at:** 2026-04-29T17:36:20Z
**Source review:** .planning/phases/05-legal-seo-analytics/05-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 11 (4 Critical + 7 Warning; Info skipped per fix_scope)
- Fixed: 11
- Skipped: 0

## Fixed Issues

### CR-01: Server Action will crash at production runtime — `consent-version.ts` reads source `.tsx` at module load

**Files modified:** `lib/consent-version.ts`, `lib/consent-version.generated.ts` (new), `scripts/generate-consent-version.mjs` (new), `package.json`
**Commit:** 40e47cc
**Applied fix:** Moved CONSENT_VERSION computation from runtime `readFileSync` (which throws ENOENT in Vercel serverless because nft does not bundle source `.tsx` files) to a build-time `scripts/generate-consent-version.mjs` script. The script writes `lib/consent-version.generated.ts` with the SHA-256-prefix constant, and `lib/consent-version.ts` re-exports it. Wired the generator into `prebuild`, `predev`, `precheck`, and `pretest:unit` npm hooks so the generated file is always fresh before any build / type-check / test step.

### CR-02: User email PII sent to Vercel Analytics — violates privacy policy in the same PR

**Files modified:** `app/actions/join-waitlist.ts`
**Commit:** 6a1c35b
**Applied fix:** Removed the `{ email }` payload from the fire-and-forget `track('welcome_email_send_error', ...)` call inside the welcome-email `.catch()`. The accompanying `console.error('welcome_email_send_failed', { email, err })` still captures the email server-side for ops debugging; the analytics event now only contributes a failure count, restoring contract parity with the privacy policy ("your email address is not stored by Vercel"). Added an inline comment citing GDPR Art. 5(1)(b) so the constraint is preserved across future edits.

### CR-03: `app/icon.tsx` and `app/apple-icon.tsx` use SVG-via-data-URI in Satori — same approach `opengraph-image.tsx` documents as broken

**Files modified:** `app/icon.tsx`, `app/apple-icon.tsx`, `tests/seo.spec.ts`
**Commit:** 80fe9d0
**Applied fix:** Replaced the `<img src="data:image/svg+xml;base64,...">` mascot in both icon endpoints with a styled text "Q" on the brand teal background — matching the same brand-mark fallback that `app/opengraph-image.tsx` already uses. Hardened `tests/seo.spec.ts` SEO-05 with content-byte-floor assertions (`> 200` bytes for `/icon`, `> 500` bytes for `/apple-icon`) so a regression to a blank PNG fails the test instead of silently passing.

### CR-04: Time-trap (SPAM-02) is defeated by static rendering — `Date.now()` in RSC with no dynamic opt-in

**Files modified:** `components/sections/waitlist-form-section.tsx`
**Commit:** 87b25a2
**Applied fix:** Made `WaitlistFormSection` an async RSC and added `await headers()` at the top of the body. `headers()` is a Next-recognized dynamic API that forces the segment to render per-request, so `Date.now()` runs fresh on every visit and the SPAM-02 time-trap (`Date.now() - renderedAt < 2000` rejection) actually fires for fast bot submissions instead of comparing against a frozen build-time timestamp.

**Note:** Logic correctness verified by inspection — the existing `<input type="hidden" name="renderedAt" />` propagation is unchanged; only the timestamp's freshness changes. End-to-end behavior should be confirmed by the verifier phase (a Playwright test that submits within 2s of page load would diagnose any further regression).

### WR-01: `wordmark.png` read inside the `.catch()`-able send path is awaited BEFORE try-handling

**Files modified:** `app/actions/join-waitlist.ts`
**Commit:** 4915823
**Applied fix:** Hoisted the wordmark PNG read to module scope as `const wordmarkPromise: Promise<Buffer | null>` with an inline `.catch()` that returns `null` on failure. The action now awaits this hoisted promise (read once on cold-start, never per-signup) and conditionally includes the attachment based on availability — a missing/unreadable asset no longer throws AFTER `contacts.create` has already succeeded.

### WR-02: `track('welcome_email_send_error')` inside `.catch()` is fire-and-forget AFTER action returns

**Files modified:** `app/actions/join-waitlist.ts`
**Commit:** 1834aec
**Applied fix:** Wrapped the fire-and-forget `resend.emails.send(...).catch(...)` chain in `after(...)` from `next/server`. `after()` is the App Router primitive for guaranteed post-response work — Vercel keeps the function context alive until the awaited promise settles, so the `track('welcome_email_send_error')` call inside `.catch()` actually reaches Vercel Analytics instead of being killed mid-flight when the response is sent. Also returned the analytics call from `.catch()` so `after()` waits on it.

### WR-03: Tests assert on metadata content but not on consistency

**Files modified:** `tests/legal.spec.ts`
**Commit:** 94a7dda
**Applied fix:** Added three cross-page invariant tests: LEGAL-09 (terms must contain a link to `/privacy`), LEGAL-10 (the "Last updated" date strings must match between privacy and terms), and LEGAL-11 (the contact `mailto:` must be the same on both pages). A future PR that edits one legal page and not the other now fails these tests rather than allowing user-facing drift.

### WR-04: `consent-version.test.ts` "is deterministic" test is trivially true

**Files modified:** `tests/unit/consent-version.test.ts`
**Commit:** f99a569
**Applied fix:** Replaced the tautological re-import test (which only verified that ES modules cache imports) with a real determinism check: read the live `app/(legal)/privacy/page.tsx` and `app/(legal)/terms/page.tsx` files inside the test, recompute `sha256(privacy + terms).slice(0, 8)` with the same CRLF→LF normalization, and assert equality with the exported `CONSENT_VERSION`. This catches hash-algorithm drift, missing normalization, and a stale `lib/consent-version.generated.ts` (e.g., generator not re-run after a policy edit).

### WR-05: Unit test does not test the actual production property shape

**Files modified:** `lib/analytics.ts`, `tests/unit/analytics.test.ts`
**Commit:** 5ffacda
**Applied fix:** Replaced the loose `Record<string, unknown>` parameter on `track()` with a discriminated `TrackEventProperties` map keyed on each `TrackEvent` name, plus a variadic conditional-type overload that requires the right shape per event (`undefined` for events with no properties, like `welcome_email_send_error` and `contact_complained`). Compile-time blocks future drift such as `track('welcome_email_send_error', { email })`. Updated the unit test to exercise the actual production shapes used by `app/actions/join-waitlist.ts` and `app/api/webhooks/resend/route.ts`, including an explicit assertion that no `email` key is forwarded.

### WR-06: `check-no-trackers.mjs` denylist matching has gaps

**Files modified:** `scripts/check-no-trackers.mjs`
**Commit:** 02f0cb8
**Applied fix:** Replaced the string-equality matcher with a regex pattern array that handles scope-and-prefix variants (`@amplitude/...`, `@segment/...`, `@fullstory/...`), pluse keyword/substring matches for `pixel`, `hotjar`, `clarity`, `posthog`, `gtag`, `gtm`, `ga4`, `mixpanel`. Added an explicit (currently empty) allowlist for future false-positive suppression. Verified against the real `package.json` (passes — `@vercel/analytics` and `@vercel/speed-insights` are not blocked) and against the regression cases the reviewer flagged: `@amplitude/analytics-browser`, `@segment/analytics-node`, `posthog-js`, `react-facebook-pixel`, `hotjar` are all now blocked.

### WR-07: JSON-LD escaping is partial

**Files modified:** `app/page.tsx`
**Commit:** c20b5f1
**Applied fix:** Centralized the previously-inline `JSON.stringify(...).replace(/</g, '\\u003c')` into a `safeJsonLdScript()` helper that also escapes `>`, `&`, U+2028, and U+2029 — the full OWASP recommendation for JSON inside `<script>` blocks. Both `<script type="application/ld+json">` tags now call the helper, removing the duplicated partial pattern that could be copy-pasted to a user-derived-data context.

---

_Fixed: 2026-04-29T17:36:20Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
