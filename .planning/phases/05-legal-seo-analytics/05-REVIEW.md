---
phase: 05-legal-seo-analytics
reviewed: 2026-04-29T00:00:00Z
depth: standard
files_reviewed: 20
files_reviewed_list:
  - app/(legal)/layout.tsx
  - app/(legal)/privacy/page.tsx
  - app/(legal)/terms/page.tsx
  - app/actions/join-waitlist.ts
  - app/apple-icon.tsx
  - app/icon.tsx
  - app/layout.tsx
  - app/opengraph-image.tsx
  - app/page.tsx
  - app/robots.ts
  - app/sitemap.ts
  - components/sections/waitlist-form-section.tsx
  - lib/analytics.ts
  - lib/consent-version.ts
  - scripts/check-no-trackers.mjs
  - tests/analytics.spec.ts
  - tests/legal.spec.ts
  - tests/seo.spec.ts
  - tests/unit/analytics.test.ts
  - tests/unit/consent-version.test.ts
findings:
  critical: 4
  warning: 7
  info: 5
  total: 16
status: issues_found
---

# Phase 5: Code Review Report

**Reviewed:** 2026-04-29
**Depth:** standard
**Files Reviewed:** 20
**Status:** issues_found

## Summary

Phase 5 ships the legal pages, SEO surface, analytics shim swap, and consent-version
mechanism. The implementation is dense and largely well-commented, but several
defects threaten production correctness:

1. **`lib/consent-version.ts` reads `.tsx` source files at runtime** — Vercel serverless
   bundles do not include source `.tsx` files by default. First Server Action invocation
   on a deployed function will throw ENOENT during module load and every subsequent
   waitlist signup will fail.
2. **`app/actions/join-waitlist.ts` sends raw email PII to `track('welcome_email_send_error')`** —
   directly contradicts the privacy policy in the same PR ("email ... is stored in a Resend
   audience" — only) and violates the GDPR-Article-6(1)(a) data-minimization basis the
   policy is built on.
3. **`app/icon.tsx` / `app/apple-icon.tsx` use SVG-data-URI in Satori** — the sibling
   `app/opengraph-image.tsx` explicitly documents that Satori does NOT support SVG via
   data URI ("using styled text Q as brand mark for the OG left panel"). The icon
   endpoints take the contradicted approach and likely fail or render blank.
4. **`waitlist-form-section.tsx` `Date.now()` in an RSC with no `dynamic` opt-in** —
   the home page is statically rendered by Next 16 default. `renderedAt` is frozen at
   build time, defeating the time-trap (SPAM-02) entirely after the first cold start.

Additional concerns: `opengraph-image.tsx` font loading risk, weak unit-test coverage
of the consent-version determinism guarantee, denylist gaps in `check-no-trackers.mjs`,
unawaited fire-and-forget analytics calls inside `.catch()`, and several quality nits.

## Critical Issues

### CR-01: Server Action will crash at production runtime — `consent-version.ts` reads source `.tsx` at module load

**File:** `lib/consent-version.ts:18-29`
**Issue:**
The module computes `CONSENT_VERSION` by calling
`readFileSync(join(process.cwd(), 'app/(legal)/privacy/page.tsx'))` and the same for
`terms/page.tsx` at module load. On Vercel:

- Server Actions run in serverless functions whose `process.cwd()` is `/var/task`
  (the deployment root).
- Next.js's nft (node-file-trace) only includes files that callers reference via
  statically analyzable paths. Here, `process.cwd()` is computed at runtime, so the
  trace will not include the source `.tsx` files.
- Even if traced, source `.tsx` files in App Router projects are not deployed to
  the serverless function bundle by default — only the compiled `.next/server/app/...`
  output ships.
- `next.config.ts` is empty: there is no `outputFileTracingIncludes` to force-include
  these source files.

Result: the FIRST production invocation of `joinWaitlistAction` (which imports
`@/lib/consent-version`) will throw `ENOENT: no such file or directory, open
'/var/task/app/(legal)/privacy/page.tsx'` during module init. Module-init errors are
sticky in serverless containers — every subsequent invocation in that container will
also fail. The waitlist is broken in production.

This is also a build-time-vs-runtime divergence: dev (`next dev`) runs from repo root
and works; preview/production deployments do not.

**Fix:**
Compute the hash at build time and inline it as a constant. The cleanest fix is to
generate it via a build script that writes a generated module:

```ts
// scripts/generate-consent-version.mjs (run in package.json "build" script)
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

const privacy = readFileSync('app/(legal)/privacy/page.tsx', 'utf8').replace(/\r\n/g, '\n')
const terms   = readFileSync('app/(legal)/terms/page.tsx',   'utf8').replace(/\r\n/g, '\n')
const hash = createHash('sha256').update(privacy + terms).digest('hex').slice(0, 8)
writeFileSync('lib/consent-version.generated.ts',
  `// AUTO-GENERATED — do not edit\nexport const CONSENT_VERSION = '${hash}' as const\n`)
```

Then `lib/consent-version.ts` re-exports the generated constant. Alternatively, configure
`outputFileTracingIncludes` in `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/**/*': ['./app/(legal)/privacy/page.tsx', './app/(legal)/terms/page.tsx'],
  },
}
```

The build-time generation is preferred — no runtime fs access, no path-resolution risk.

---

### CR-02: User email PII sent to Vercel Analytics — violates privacy policy in the same PR

**File:** `app/actions/join-waitlist.ts:255-259`
**Issue:**
The fire-and-forget welcome email `.catch()` handler calls
`track('welcome_email_send_error', { email })`. This forwards the user's full email
address to `@vercel/analytics/server` as a custom event property, which Vercel persists
and indexes in their Analytics dashboard.

The privacy page shipped in the SAME PR
(`app/(legal)/privacy/page.tsx:69-97`) tells users that:
- Vercel receives only "server logs (IP, user-agent)"
- "Your email address is not stored by Vercel"
- The lawful basis is GDPR Art. 6(1)(a) consent for **launch notification only**

Sending email to Vercel Analytics:
1. Contradicts the privacy disclosure verbatim.
2. Exceeds the documented purpose limitation (GDPR Art. 5(1)(b)).
3. Violates data minimization (GDPR Art. 5(1)(c)) — the email is not needed for
   ops observability; an opaque hash or contact ID is sufficient.

The matching unit test on `tests/unit/analytics.test.ts:37` even uses
`{ contactId: 'abc-123' }`, suggesting the original intent was a non-PII identifier;
the production code drifted.

**Fix:**
Strip PII before sending. Use a stable opaque identifier that the privacy policy
covers (e.g., a SHA-256 prefix of the email, the Resend contact ID returned from
`contacts.create`, or omit the property entirely):

```ts
import { createHash } from 'node:crypto'
// inside .catch:
const emailHash = createHash('sha256').update(email).digest('hex').slice(0, 12)
track('welcome_email_send_error', { emailHash })
```

Or, since the existing console.error already captures the email server-side, drop the
property from the analytics call entirely:

```ts
.catch((err) => {
  console.error('welcome_email_send_failed', { email, err })
  track('welcome_email_send_error') // no PII — just the count
})
```

---

### CR-03: `app/icon.tsx` and `app/apple-icon.tsx` use SVG-via-data-URI in Satori — same approach `opengraph-image.tsx` documents as broken

**File:** `app/icon.tsx:9-29`, `app/apple-icon.tsx:9-29`
**Issue:**
Both icon endpoints read `public/quibs-icon.svg`, base64-encode it, and use the
result as `<img src="data:image/svg+xml;base64,...">` inside `ImageResponse`.

The sibling `app/opengraph-image.tsx:33-34` explicitly documents:
> "Quibly Q-face text mark — SVG via data URI is unsupported in Satori; using
> styled text Q as brand mark for the OG left panel"

If that constraint is correct (Satori's `<img>` element can render PNG/JPEG raster
data URIs but historically stumbled on SVG due to no embedded SVG renderer), then
both icon endpoints are broken — they will produce empty output, throw, or render a
solid teal square with no mascot.

The two implementations cannot both be correct. Either:
- Satori supports SVG-data-URIs and `opengraph-image.tsx` is over-cautious (then the
  comment there should be removed and the OG image should use the SVG mascot for
  brand consistency), OR
- It does not, and these icon endpoints are broken.

**Fix:**
Verify behavior empirically (deploy preview + open `/icon` and `/apple-icon` in
DevTools). If broken, either:

1. Pre-rasterize the mascot to PNG once and read the PNG (no Satori SVG path):
```ts
const mascotPng = await readFile(join(process.cwd(), 'public/quibs-icon.png'))
const mascotSrc = `data:image/png;base64,${mascotPng.toString('base64')}`
```
2. Or render the Q-glyph as styled text like `opengraph-image.tsx` does.

Also: `tests/seo.spec.ts:30-37` only asserts the endpoints return 200 — they would
return 200 for an empty/blank PNG too. Add a content-length floor check (`> 500
bytes` or similar) so this regresses the test if Satori silently swallows the SVG.

---

### CR-04: Time-trap (SPAM-02) is defeated by static rendering — `Date.now()` in RSC with no dynamic opt-in

**File:** `components/sections/waitlist-form-section.tsx:49`, `app/page.tsx`
**Issue:**
`waitlist-form-section.tsx` computes `const renderedAt = Date.now()` at the top of an
RSC and passes it as a prop to the Client Component. The intent (per the long
comment) is that `Date.now()` runs per-request so the time-trap can compare against
submission time.

But `app/page.tsx` does not export `dynamic = 'force-dynamic'`, does not call any
dynamic API (`headers()`, `cookies()`, `searchParams`), and does not opt out of static
rendering in any other way. Next 16 App Router default-renders such pages **statically
at build time**. `Date.now()` is not a Next-recognized dynamic API — it does NOT
trigger automatic dynamic rendering.

Result: `renderedAt` is frozen at the build-time wall clock. Every form submission,
forever, will have `Date.now() - renderedAt >= seconds-since-build`, so the
`< 2000` check (`join-waitlist.ts:76`) never matches. The time-trap is dead code.

This is not a security crash — it produces only false negatives (no legitimate user
is wrongly rejected). But it removes one of the four documented anti-spam layers
(SPAM-02 / D-15) without anyone noticing. The defense-in-depth posture documented in
the action's header comment is materially weaker than claimed.

**Fix:**
Force the page (or just the form section) to render dynamically:

```ts
// app/page.tsx
export const dynamic = 'force-dynamic' // OR: connection() / headers() in the section
```

Or, more targeted, move the timestamp generation into a deeper RSC that calls
`headers()` (which forces dynamic rendering of that subtree):

```ts
import { headers } from 'next/headers'
export async function WaitlistFormSection() {
  await headers() // opts the segment into dynamic rendering
  const renderedAt = Date.now()
  // ...
}
```

Add a build-mode regression: a Playwright test that submits within 2s of a freshly
loaded page should see the silent-success branch trigger; if `renderedAt` is build-frozen,
the time-trap will never fire and the test will diagnose the regression.

## Warnings

### WR-01: `wordmark.png` read inside the `.catch()`-able send path is awaited BEFORE try-handling — uncaught exception breaks the action AFTER contact write

**File:** `app/actions/join-waitlist.ts:231-233`
**Issue:**
```ts
const wordmarkPath = join(process.cwd(), 'public', 'email', 'wordmark.png')
const wordmark = await readFile(wordmarkPath)

resend.emails.send({...}).catch((err) => { ... })
```

The `await readFile(wordmarkPath)` is OUTSIDE the `.catch()`. Failure modes:

1. If `wordmark.png` is missing in the deployment bundle (NFT trace risk — same
   class of issue as CR-01, though `public/` is reliably included by Next), the
   `await readFile` rejects and the entire `joinWaitlistAction` throws.
2. The throw happens AFTER `contacts.create` succeeded and AFTER `track('waitlist_signup')`
   ran. So the audience is updated, analytics fires, but the response to the client is
   the React Server Action error envelope. The user sees an error, retries, and on
   retry the duplicate-detection branch returns success — silent inconsistency that
   masks the real failure.
3. The wordmark is read on EVERY non-duplicate signup. Reading the same file on every
   request is wasteful (and fs-traced files in serverless should be hoisted to module
   scope to avoid cold-path I/O).

**Fix:**
Move the read to module scope (loaded once on cold-start) and wrap the email send +
read in a single try/catch so failure routes through the existing analytics-tracked
`.catch()`:

```ts
// module scope:
const wordmarkPromise = readFile(join(process.cwd(), 'public', 'email', 'wordmark.png'))
  .catch((err) => {
    console.error('wordmark_load_failed', err)
    return null
  })

// inside action, non-duplicate branch:
const wordmark = await wordmarkPromise
if (!wordmark) {
  // skip attachment but still send — wordmark is decorative
}
```

---

### WR-02: `track('welcome_email_send_error')` inside `.catch()` is fire-and-forget AFTER action returns — likely lost in serverless

**File:** `app/actions/join-waitlist.ts:255-259`
**Issue:**
The `.catch()` handler is registered on `resend.emails.send(...)` which is itself NOT
awaited (intentional fire-and-forget per CD-09). The Server Action returns
immediately on line 265. In Vercel serverless, when the function's response is sent,
pending I/O is best-effort and may be killed. The track call inside `.catch()` will
often be cut off mid-flight → analytics event never reaches Vercel Analytics → the
ops observability the comment promises (EMAIL-08) is unreliable.

This is the documented use-case for `waitUntil()` from `next/server`, which the file
header comment even calls out as a deferred item. Until then, send failures are
effectively silent.

**Fix:**
```ts
import { after } from 'next/server'
// ...
after(
  resend.emails.send({...}).catch((err) => {
    console.error('welcome_email_send_failed', { err })
    return track('welcome_email_send_error') // wait for analytics
  })
)
```

`after()` is the App Router primitive for post-response work — guaranteed to run
before the function suspends.

---

### WR-03: Tests assert on metadata content but not on consistency — privacy/terms drift will not regress

**File:** `tests/legal.spec.ts:22-27`
**Issue:**
`LEGAL-04` asserts the privacy page contains `'consent'`, `'Article 6'`, and
`'launches plus 12 months'`. It does NOT assert that:

- `terms/page.tsx` references `/privacy` (currently at `terms/page.tsx:50` — could
  silently break)
- The `privacy@useQuibly.com` mailto on the terms page matches the privacy page
- The "Last updated" date is the same on both pages (currently both `April 29, 2026`)

If a future PR edits one page and not the other, the consent-version hash bumps (per
CR-01's intent) but the user-facing text becomes inconsistent and tests still pass.

**Fix:**
Add cross-page invariant tests:

```ts
test('privacy and terms reference each other (LEGAL-09)', async ({ page }) => {
  await page.goto('/privacy')
  // privacy page does NOT currently link to /terms; check if it should
  await page.goto('/terms')
  await expect(page.locator('a[href="/privacy"]')).toBeVisible()
})

test('last-updated dates match (LEGAL-10)', async ({ page }) => {
  await page.goto('/privacy')
  const privacyDate = await page.locator('text=/Last updated:/').textContent()
  await page.goto('/terms')
  const termsDate = await page.locator('text=/Last updated:/').textContent()
  expect(privacyDate).toBe(termsDate)
})
```

---

### WR-04: `consent-version.test.ts` "is deterministic" test is trivially true — does not test what its name claims

**File:** `tests/unit/consent-version.test.ts:37-40`
**Issue:**
```ts
it('is deterministic for the same file contents', async () => {
  const mod2 = await import('@/lib/consent-version')
  expect(mod2.CONSENT_VERSION).toBe(CONSENT_VERSION)
})
```

This re-imports the same module. ES modules are singletons — `import('@/lib/x')`
returns the cached module instance. The assertion is `x === x`, which is always true
regardless of any determinism property. This does not test that the same content
produces the same hash; it tests that the module system caches imports.

A genuine determinism test would re-mock the file content and re-evaluate the hash
algorithm, OR compute the expected hash inline from the mocked content and compare.

**Fix:**
```ts
import { createHash } from 'node:crypto'

it('hash matches sha256(privacy + terms).slice(0, 8)', () => {
  const expected = createHash('sha256')
    .update('mock-privacy-content\n' + 'mock-terms-content\n')
    .digest('hex')
    .slice(0, 8)
  expect(CONSENT_VERSION).toBe(expected)
})
```

This test would actually catch a hash-algorithm change or a normalization bug.

---

### WR-05: Unit test `tests/unit/analytics.test.ts` does not test the actual production property shape

**File:** `tests/unit/analytics.test.ts:37-39`
**Issue:**
The test exercises `track('welcome_email_send_error', { contactId: 'abc-123' })`. The
production code (CR-02) actually calls `track('welcome_email_send_error', { email })`.
The unit test passes regardless — it's testing the shim's pass-through, not the
caller's contract.

This contributes to CR-02 going undetected: if a reviewer trusted the test to
document the property contract, they would assume the production code is
PII-free.

**Fix:**
Either:
1. Test the actual call sites (mock the analytics module from the action's test).
2. Add a type-level constraint (TS literal-type union or zod-validated property shape)
   that disallows `email` as a property key.

```ts
// stronger TrackEvent property typing
type AllowedProperties = {
  waitlist_signup: { duplicate: boolean }
  signup_rejected: { reason: 'rate_limit' | 'disposable_domain' }
  welcome_email_send_error: { emailHash?: string }  // explicitly NOT email
  // ...
}
```

---

### WR-06: `check-no-trackers.mjs` denylist matching has gaps — would not catch realistic regressions

**File:** `scripts/check-no-trackers.mjs:11-30`
**Issue:**
The matcher is `dep === banned || dep.startsWith(banned + '/') || dep.endsWith('/' + banned)`.
It catches exact matches and scoped-package paths, but misses common variants:

- `'amplitude'` would NOT catch `'@amplitude/analytics-browser'` (the actual
  install name on npm). The list does include `'@amplitude/analytics'`, but
  `'@amplitude/analytics-browser' === '@amplitude/analytics'` is false, and
  `'@amplitude/analytics-browser'.startsWith('@amplitude/analytics/')` is false
  (no trailing slash).
- `'segment'` covers `@x/segment` but misses `@segment/analytics-node` (only
  `@segment/analytics-next` is listed explicitly).
- `'gtag'` is a prefix-match concern: `dep.startsWith('gtag/')` would catch
  `'gtag/foo'` but not `'gtag-helper'` (which is not GA, but reviewer won't
  guess that). Inverse: the rule is conservative on broad keys.

The denylist is a goal-aligned safety net but its matcher is too conservative to be
trustworthy. A reviewer reading the file may believe more is enforced than is.

**Fix:**
Use substring matching with an allowlist of known-safe prefixes, OR explicitly
enumerate the npm names:

```js
const DENYLIST_REGEX = [
  /^@amplitude\//,
  /^@segment\//,
  /^@fullstory\//,
  /^posthog/,
  /^mixpanel/,
  /^react-ga/,
  /clarity/,
  /hotjar/,
  /pixel/,
  // ...
]
const violations = allDeps.filter(dep => DENYLIST_REGEX.some(re => re.test(dep)))
```

Or simply: `dep.includes(banned)` after lowercasing, accepting some false positives
that a comment-allowlist can suppress.

---

### WR-07: JSON-LD escaping is partial — only `<` is escaped, `</script>` injection vector covered but `>` and Unicode separators are not

**File:** `app/page.tsx:45,51`
**Issue:**
```ts
__html: JSON.stringify(organizationJsonLd).replace(/</g, '\\u003c'),
```

This is sufficient for the current static literals (no user input flows in), but it
is the kind of hand-rolled escaping that gets copied to a context where data IS
user-controlled. OWASP recommends escaping `<`, `>`, `&`, `'`, `"`, plus the JS
line-separator characters U+2028 and U+2029 inside `<script>` blocks.

For STATIC data this is unnecessary and the partial escape is harmless, but
duplicating the partial pattern across two `<script>` blocks invites a future
mis-application.

**Fix:**
Centralize:

```ts
function safeJsonLdScript(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/ /g, '\\u2028')
    .replace(/ /g, '\\u2029')
}
```

Use that helper in both script tags. Even though the data is currently static,
the helper is documentation that future dynamic JSON-LD must route through here.

## Info

### IN-01: `app/(legal)/layout.tsx` adds zero value — pass-through layout is unnecessary

**File:** `app/(legal)/layout.tsx`
**Issue:**
`LegalLayout` returns `<>{children}</>`. Next route groups do not require a layout
file; the parent layout (`app/layout.tsx`) already wraps children. The file's only
function is to host the comment block.

**Fix:**
Delete the file. Move the comment to a top-of-folder README.md or keep it in
`PATTERNS.md`. Removing dead-pass-throughs reduces future-reader confusion ("does
this layout do something I'm missing?").

---

### IN-02: Domain casing is inconsistent — `useQuibly.com` (mixed) appears in sitemap, robots, JSON-LD; `usequibly.com` (lower) appears in action/email

**File:** `app/sitemap.ts:3`, `app/robots.ts:26`, `app/page.tsx:24-35`,
`app/actions/join-waitlist.ts:222,236`, `app/layout.tsx:24`
**Issue:**
RFC 3986 hostnames are case-insensitive, but search engines, social-card scrapers,
and analytics tools occasionally treat `useQuibly.com` and `usequibly.com` as
different URLs (Google Search Console and OG-image preview tools both have known
quirks). The codebase mixes both forms within the same PR.

`metadataBase: new URL("https://useQuibly.com")` — Next will normalize the host to
lowercase when serializing canonical URLs; sitemap/robots use mixed case;
JSON-LD has mixed case; the unsubscribe URL hard-codes lowercase.

**Fix:**
Pick one (lowercase recommended — every CDN/analytics dashboard reports lowercase)
and apply consistently. Add a regression test:

```ts
test('all canonical URLs lowercase the host', async ({ page, request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text()
  expect(sitemap).not.toMatch(/[A-Z][a-z]+Quibly/)
})
```

---

### IN-03: Dev/preview deployments leak `RESEND_FROM_POSTAL_ADDRESS` placeholder text on the public privacy page

**File:** `app/(legal)/privacy/page.tsx:156`
**Issue:**
The page renders `{env.RESEND_FROM_POSTAL_ADDRESS}` directly into the public DOM.
The env validator (`lib/env.ts:46-49`) only blocks placeholder strings when
`VERCEL_ENV === 'production'`. In preview/dev the placeholder ("Test Address",
"YOUR-POSTAL-ADDRESS-HERE", etc.) renders verbatim and is fully indexable on any
preview URL that gets shared (PR comments, screenshot demos).

Acceptable for an internal-only preview, problematic if a preview URL ever gets
shared externally.

**Fix:**
Either:
- Render a "[address pending]" placeholder when `VERCEL_ENV !== 'production'`:
```tsx
<p>{process.env.VERCEL_ENV === 'production'
  ? env.RESEND_FROM_POSTAL_ADDRESS
  : '[Postal address pending — visible in production only]'}</p>
```
- Or add `noindex` to preview deployments via `robots.ts` keyed on
  `VERCEL_ENV !== 'production'`.

---

### IN-04: `lib/analytics.ts` casts `unknown` to `Record<string, AllowedPropertyValue>` — silently bypasses type safety

**File:** `lib/analytics.ts:34`
**Issue:**
```ts
await vercelTrack(event, properties as Record<string, string | number | boolean | null | undefined>)
```

The cast erases the `unknown` constraint. If a caller passes a `Date` or an object,
it is forwarded to Vercel which will silently `JSON.stringify` (or reject) without
the codebase noticing.

**Fix:**
Tighten the public signature:
```ts
type TrackProperty = string | number | boolean | null
export async function track(
  event: TrackEvent,
  properties?: Record<string, TrackProperty>,
): Promise<void> {
  await vercelTrack(event, properties)
}
```

Then the type system catches misuse at call sites. Combine with WR-05's per-event
property shape for full safety.

---

### IN-05: `opengraph-image.tsx` references `Quicksand-Bold.woff` (WOFF1) by path — no fallback, single point of failure

**File:** `app/opengraph-image.tsx:15-17`
**Issue:**
The OG endpoint fails to render if either WOFF file is missing. Since the OG image
is regenerated per request (no cache layer is configured here) and the social-card
crawlers retry rarely, a transient deploy issue can poison Twitter/Facebook caches
for 24-72h.

The file is currently present in `public/fonts/` (verified). The risk is regression:
no test verifies that the OG endpoint actually rasterizes — `tests/seo.spec.ts:24-28`
only checks 200 status and `image/png` content-type, both of which Next will return
even if Satori falls back to default fonts.

**Fix:**
Add a content-byte-floor assertion to the SEO test:

```ts
test('og-image renders meaningful content (SEO-04 hardened)', async ({ request }) => {
  const r = await request.get('/opengraph-image')
  expect(r.status()).toBe(200)
  const buf = await r.body()
  expect(buf.length).toBeGreaterThan(20_000) // empty/blank PNG would be << 5KB
})
```

Also: add an explicit fallback inside the route — if `readFile` throws, render with
default fonts rather than 500ing.

---

_Reviewed: 2026-04-29_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
