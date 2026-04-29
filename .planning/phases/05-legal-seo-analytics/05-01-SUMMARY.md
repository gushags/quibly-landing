---
phase: 05-legal-seo-analytics
plan: 01
subsystem: legal
tags: [gdpr, consent, privacy, terms, sha256, server-only, playwright, vitest]

# Dependency graph
requires:
  - phase: 04-resend-wiring-bot-protection-welcome-email
    provides: "join-waitlist Server Action with consentVersion stub (VERCEL_GIT_COMMIT_SHA ?? 'pre-phase-5'), RESEND_FROM_POSTAL_ADDRESS env var"
  - phase: 02-static-landing-page-no-form
    provides: "footer with /privacy and /terms hrefs already wired (Phase 2 D-19)"
  - phase: 01-scaffold-brand-token-parity
    provides: "lib/env.ts with RESEND_FROM_POSTAL_ADDRESS, server-only guard pattern, ESLint no-raw-process-env rule"

provides:
  - "/privacy page — RSC, GDPR Art. 6(1)(a) consent, Vercel + Resend processors named, retention clause, DSAR mailto"
  - "/terms page — RSC, waitlist-scoped TOS: acceptance, no guarantees, withdrawal, governing law, contact"
  - "lib/consent-version.ts — SHA-256 prefix of privacy+terms content, server-only, CRLF-normalized, deterministic 8-char hex"
  - "CONSENT_VERSION wired into app/actions/join-waitlist.ts (replaces VERCEL_GIT_COMMIT_SHA stub)"
  - "LEGAL-06/07 microcopy block in waitlist-form-section.tsx — reassurance-copy + consent-copy test ids, /privacy + /terms hrefs"
  - "tests/legal.spec.ts — 7 Playwright e2e tests covering LEGAL-01..04, LEGAL-06..08"
  - "tests/unit/consent-version.test.ts — Vitest unit tests for CONSENT_VERSION (8-char hex + determinism)"
  - ".gitattributes — LF enforcement on *.tsx/*.ts prevents CRLF hash drift"
  - "playwright.config.ts chromium project — covers root-level e2e specs (legal, seo, analytics)"

affects:
  - "05-02 (SEO plan) — can now reference /privacy and /terms from sitemap.ts"
  - "Phase 6 production deploy — legal gates (LEGAL-01..08) now satisfied"
  - "Resend audience — all future contacts stamped with real content-hash CONSENT_VERSION instead of git SHA stub"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "server-only + node:crypto SHA-256 content hash for policy versioning (lib/consent-version.ts)"
    - "vi.mock with importOriginal for node:fs in Vitest unit tests"
    - "Playwright chromium project for root-level e2e specs (playwright.config.ts)"
    - "RSC legal page container: max-w-3xl mx-auto px-6 py-16, section space-y-4 mb-10"
    - "CRLF normalization before hashing: .replace(/\\r\\n/g, '\\n')"

key-files:
  created:
    - ".gitattributes"
    - "lib/consent-version.ts"
    - "app/(legal)/layout.tsx"
    - "app/(legal)/privacy/page.tsx"
    - "app/(legal)/terms/page.tsx"
    - "tests/legal.spec.ts"
    - "tests/unit/consent-version.test.ts"
  modified:
    - "components/sections/waitlist-form-section.tsx"
    - "app/actions/join-waitlist.ts"
    - "playwright.config.ts"

key-decisions:
  - "Privacy adapted from marketing-app structure, narrowed to waitlist scope (D-01): email-only, Vercel+Resend processors, GDPR Art. 6(1)(a), retention until launch+12mo, DSAR privacy@useQuibly.com"
  - "Terms written fresh (D-01): marketing-app terms covers paying users, not applicable to waitlist"
  - "CONSENT_VERSION is SHA-256 prefix of privacy+terms TSX file contents (D-12/D-14): bumps only on policy text change, not every deploy"
  - "Route group (legal) chosen (CD-01): /privacy and /terms resolve correctly, both pages organized under app/(legal)/"
  - "Playwright chromium project added to playwright.config.ts to cover root-level e2e specs (deviation Rule 3)"

patterns-established:
  - "Pattern: RSC legal page — import type Metadata, export const metadata, default function PrivacyPage/TermsPage, max-w-3xl mx-auto px-6 py-16 container"
  - "Pattern: Vitest node:fs mock — use importOriginal to spread actual module then override readFileSync"
  - "Pattern: consent-version — server-only module, readFileSync at module load, CRLF normalize, SHA-256 slice(0,8)"

requirements-completed:
  - LEGAL-01
  - LEGAL-02
  - LEGAL-03
  - LEGAL-04
  - LEGAL-05
  - LEGAL-06
  - LEGAL-07
  - LEGAL-08

# Metrics
duration: 37min
completed: 2026-04-29
---

# Phase 05 Plan 01: Legal Compliance Summary

**GDPR-compliant /privacy and /terms pages live with SHA-256 content-hash consent_version wired into the waitlist Server Action**

## Performance

- **Duration:** ~37 min
- **Started:** 2026-04-29T09:20:00Z
- **Completed:** 2026-04-29T09:41:00Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- Shipped `/privacy` and `/terms` as static RSC pages with GDPR Art. 6(1)(a) consent, Vercel + Resend named as processors, retention clause ("launches plus 12 months"), and DSAR `privacy@useQuibly.com` contact
- Built `lib/consent-version.ts` — SHA-256 prefix of privacy+terms TSX file contents, server-only, CRLF-normalized, deterministic 8-char hex — wired into `app/actions/join-waitlist.ts` replacing the Phase 4 git-SHA stub
- Added LEGAL-06/07 consent microcopy block below form button with `data-testid` attributes and `/privacy`/`/terms` anchor hrefs; all 7 Playwright e2e tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Wave 0 test scaffolds + .gitattributes LF lock** - `76ba2a1` (test)
2. **Task 2: lib/consent-version.ts + (legal) route group + privacy + terms pages** - `bbf9a07` (feat)
3. **Task 3: Inject consent + reassurance microcopy + swap join-waitlist consent_version source** - `1e815bb` (feat)

**Plan metadata:** (committed with SUMMARY.md)

## Files Created/Modified
- `.gitattributes` — enforces LF on *.tsx/*.ts, prevents CRLF hash drift (Pitfall 1 mitigation)
- `lib/consent-version.ts` — SHA-256 content hash, server-only guard, CRLF normalization, exports CONSENT_VERSION
- `app/(legal)/layout.tsx` — pass-through route group layout
- `app/(legal)/privacy/page.tsx` — GDPR privacy policy: 9 sections, Article 6(1)(a), Vercel+Resend processors, retention clause, DSAR mailto, env.RESEND_FROM_POSTAL_ADDRESS
- `app/(legal)/terms/page.tsx` — waitlist TOS: 6 sections, acceptance, no guarantees, withdrawal, Delaware governing law, contact
- `tests/legal.spec.ts` — 7 Playwright e2e tests (LEGAL-01..04, LEGAL-06..08), all green
- `tests/unit/consent-version.test.ts` — Vitest unit tests for CONSENT_VERSION 8-char hex + determinism, both green
- `components/sections/waitlist-form-section.tsx` — added LEGAL-06/07 microcopy block with data-testids and hrefs
- `app/actions/join-waitlist.ts` — import CONSENT_VERSION, replaced VERCEL_GIT_COMMIT_SHA stub
- `playwright.config.ts` — added chromium project for root-level e2e specs

## Decisions Made
- Route group `(legal)` chosen (CD-01): keeps `/privacy` and `/terms` URL-clean while organizing both pages together
- Privacy page uses literal "Article 6(1)(a)" (no HTML entity `&nbsp;`) so Playwright `toContainText('Article 6')` matches rendered text
- Two DSAR mailto links in privacy (Your Rights section + Contact section) — test uses `.first()` to avoid strict mode violation
- `playwright.config.ts` chromium project covers `tests/[^/]+\.spec\.ts` pattern for Phase 5+ root-level specs

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] vi.mock for node:fs required importOriginal pattern**
- **Found during:** Task 1 (Wave 0 test scaffolds) — first run of consent-version.test.ts
- **Issue:** `vi.mock('node:fs', () => ({ readFileSync: vi.fn(...) }))` throws "No 'default' export on mock" because Vitest's module factory requires the `default` export when mocking CJS-compatible modules
- **Fix:** Updated mock to use `vi.mock('node:fs', async (importOriginal) => { const actual = await importOriginal(); return { ...actual, readFileSync: vi.fn(...) } })`
- **Files modified:** `tests/unit/consent-version.test.ts`
- **Verification:** `npx vitest run tests/unit/consent-version.test.ts` exits 0 (2/2 green)
- **Committed in:** `bbf9a07` (Task 2 commit)

**2. [Rule 3 - Blocking] Playwright config had no project covering tests/legal.spec.ts**
- **Found during:** Task 2 (first Playwright run attempt)
- **Issue:** Existing playwright.config.ts projects only match `tests/(visual|form)/` and `tests/no-js/` patterns; `tests/legal.spec.ts` at the root of tests/ matched no project and ran against pre-existing server on port 3000 serving old build
- **Fix:** Added "chromium" project to playwright.config.ts matching `tests/[^/]+\.spec\.ts` (root-level spec files); symlinked .env.local from main repo; killed stale server
- **Files modified:** `playwright.config.ts`
- **Verification:** All 7 legal.spec.ts tests pass after fix
- **Committed in:** `bbf9a07` (Task 2 commit)

**3. [Rule 1 - Bug] DSAR mailto test used strict mode locator resolving to 2 elements**
- **Found during:** Task 2 (Playwright run — LEGAL-08)
- **Issue:** Privacy page has two `a[href="mailto:privacy@useQuibly.com"]` links (Your Rights section + Contact section); Playwright strict mode `toBeVisible()` throws when locator resolves to >1 element
- **Fix:** Updated test to use `.first()`: `page.locator('a[href="mailto:privacy@useQuibly.com"]').first()`
- **Files modified:** `tests/legal.spec.ts`
- **Verification:** LEGAL-08 passes
- **Committed in:** `bbf9a07` (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (2 Rule 1 bugs, 1 Rule 3 blocking)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep. The two DSAR mailto links in privacy are a design choice (placing contact info in both Your Rights and Contact sections), not a bug.

## Issues Encountered
- Pre-existing Next.js dev server on port 3000 served old build (no legal pages). Killed it and let Playwright's webServer block start the fresh build.

## User Setup Required
None - no external service configuration required for this plan.

## Next Phase Readiness
- Legal compliance gates LEGAL-01..08 are satisfied
- `/privacy` and `/terms` resolve as static 200 routes — ready for sitemap.ts and robots.ts in Plan 02
- `CONSENT_VERSION` is now the real content-hash; all future Resend contacts stamped with audit-grade version
- `playwright.config.ts` chromium project ready for tests/seo.spec.ts and tests/analytics.spec.ts in Plans 02/03

---
*Phase: 05-legal-seo-analytics*
*Completed: 2026-04-29*

## Self-Check: PASSED

Files verified:
- FOUND: .gitattributes
- FOUND: lib/consent-version.ts
- FOUND: app/(legal)/layout.tsx
- FOUND: app/(legal)/privacy/page.tsx
- FOUND: app/(legal)/terms/page.tsx
- FOUND: tests/legal.spec.ts
- FOUND: tests/unit/consent-version.test.ts

Commits verified:
- FOUND: 76ba2a1 (test: Wave 0 scaffolds)
- FOUND: bbf9a07 (feat: legal pages + consent-version)
- FOUND: 1e815bb (feat: microcopy + consent_version swap)
