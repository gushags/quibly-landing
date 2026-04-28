---
phase: 03
plan: 06
id: 03-06
title: No-JS Playwright spec — FORM-08 graceful degradation acceptance
type: execute
wave: 4
depends_on: ["03-01", "03-03"]
files_modified:
  - tests/no-js/waitlist-form-progressive.spec.ts
autonomous: true
requirements:
  - FORM-08
requirements_addressed:
  - FORM-08
nyquist_compliant: true

must_haves:
  truths:
    - "D-16: native `<form action={joinWaitlistAction}>` works without JS via Next.js 16 Server Actions native progressive enhancement; no mailto fallback, no `<noscript>` banner; FORM-08 satisfied by framework (graceful-degradation accepted per RESEARCH Open Question 1) — this spec encodes that acceptance"
    - "tests/no-js/waitlist-form-progressive.spec.ts exists and is picked up by the no-js Playwright project (javaScriptEnabled: false)"
    - "Spec submits the form via native HTML POST (no JS), then asserts the page returns successfully (HTTP 200) and the form is in idle state"
    - "Spec EXPLICITLY documents in JSDoc that POST-01 in-place success block is NOT asserted for no-JS users (graceful degradation per RESEARCH Pitfall 3 + D-16 acceptance)"
    - "Spec EXPLICITLY documents that no-JS users still have their submission processed server-side (the action runs, the would-be Resend write would fire in Phase 4)"
  artifacts:
    - path: "tests/no-js/waitlist-form-progressive.spec.ts"
      provides: "FORM-08 graceful degradation coverage; load-bearing for VALIDATION Dimension-8 risk FORM-08; encodes D-16 acceptance"
      contains: "javaScriptEnabled"
      min_lines: 35
  key_links:
    - from: "tests/no-js/waitlist-form-progressive.spec.ts"
      to: "playwright.config.ts no-js project"
      via: "testMatch /tests/no-js/.*.spec.ts/ + use: javaScriptEnabled: false"
      pattern: "tests/no-js"
---

<objective>
Ship the single Playwright spec covering FORM-08 (no-JS graceful degradation per D-16) under the `no-js` project (Plan 01 Task 4 wired the project with `javaScriptEnabled: false`). The spec asserts that the form remains submittable without JavaScript — the server-side action runs, the page returns successfully, and the form re-renders in idle state. POST-01 (in-place success block) is NOT asserted for no-JS users — this is the documented graceful degradation per RESEARCH Pitfall 3 / Open Question 1 / D-16.

Purpose: D-16 explicitly accepts native Server-Action progressive enhancement as the FORM-08 satisfaction (no mailto fallback, no `<noscript>` banner). VALIDATION.md Dimension-8 risk FORM-08 requires explicit documentation of acceptance criteria for no-JS submits because `useActionState`'s state is NOT preserved across the no-JS round-trip. This spec encodes the acceptance and ensures a future regression doesn't silently break native form submission.

Output: 1 Playwright spec in `tests/no-js/`, runs under the `no-js` project, green when the form's native `<form action={joinWaitlistAction}>` POST is processed correctly.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/03-email-capture-form-stub-action/03-CONTEXT.md
@.planning/phases/03-email-capture-form-stub-action/03-RESEARCH.md
@.planning/phases/03-email-capture-form-stub-action/03-PATTERNS.md
@.planning/phases/03-email-capture-form-stub-action/03-VALIDATION.md
@.planning/phases/03-email-capture-form-stub-action/03-03-SUMMARY.md
@playwright.config.ts
@components/waitlist/waitlist-form.tsx
@app/actions/join-waitlist.ts

<interfaces>
The `no-js` Playwright project (wired by Plan 01 Task 4 in `playwright.config.ts`):
```ts
{
  name: "no-js",
  testMatch: /tests\/no-js\/.*\.spec\.ts/,
  use: { javaScriptEnabled: false },
},
```

Files in `tests/no-js/` are PICKED UP by Playwright's `no-js` project ONLY (segregated from `tests/visual/` and `tests/form/` per Plan 01 config).

Phase 3 form's native `<form action={formAction}>` (Plan 03 — `components/waitlist/waitlist-form.tsx`):
- React 19 + Next 16.2 progressively enhance: with JS, fetch happens; without JS, native HTML POST to current URL.
- The Server Action `joinWaitlistAction` runs server-side regardless.
- After no-JS POST, the page re-renders. `useActionState`'s state is NOT preserved (RESEARCH Pitfall 3) — the form returns to idle state with input cleared.

D-16 acceptance (CONTEXT.md):
- "Native `<form action={joinWaitlistAction}>` works without JS via Next.js 16 Server Actions native progressive enhancement; no mailto fallback, no `<noscript>` banner."
- FORM-08 satisfied by framework — no extra UI surface.

RESEARCH.md Open Question 1 (lines 1023-1028) documents the trade-off:
- FORM-08 wording: "the form remains submittable without JS" → satisfied (action processes the submission)
- POST-01 wording: "in-place success state replaces the form" → explicitly NOT for no-JS users (would require `redirect('/?signup=success')` workaround which is out of Phase 3 scope)
- Stronger no-JS UX is deferred to Phase 4 IF the founder requests it; Phase 3 ships the graceful degradation acceptance per D-16
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create tests/no-js/waitlist-form-progressive.spec.ts (FORM-08 graceful degradation)</name>
  <files>tests/no-js/waitlist-form-progressive.spec.ts</files>
  <read_first>
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-RESEARCH.md (lines 587-610 — Pattern 4 verbatim source; lines 776-790 Pitfall 3 graceful degradation rationale)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-PATTERNS.md (lines 348-371 — pattern + caveat documentation)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-VALIDATION.md (lines 98, 113-119 — Dimension-8 risk FORM-08 mitigation: document graceful degradation OR scope redirect-based workaround)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-CONTEXT.md (D-16 — accepted acceptance: native progressive enhancement is the FORM-08 answer; no mailto fallback, no `<noscript>` banner)
    - /Users/jeff/repos/quibly-landing/playwright.config.ts (verify no-js project is wired with `javaScriptEnabled: false`)
  </read_first>
  <action>
    Create `tests/no-js/waitlist-form-progressive.spec.ts`. The body extends RESEARCH Pattern 4 (lines 587-606) verbatim, with a longer JSDoc block documenting the Pitfall 3 graceful degradation acceptance per VALIDATION.md Dimension-8 mitigation language and CONTEXT D-16.

    File contents:

    ```ts
    import { test, expect } from '@playwright/test'

    /**
     * Phase 3 form — no-JS progressive enhancement (FORM-08 graceful degradation).
     *
     * D-16 acceptance (CONTEXT.md): native `<form action={joinWaitlistAction}>` works
     * without JS via Next.js 16 Server Actions native progressive enhancement.
     * No mailto fallback, no `<noscript>` banner. FORM-08 is satisfied by the framework
     * — this spec encodes that acceptance so a future regression cannot silently
     * downgrade the no-JS submit path.
     *
     * VALIDATION.md Dimension-8 risk FORM-08:
     *   "useActionState state is NOT preserved across the no-JS round-trip → success
     *    block won't render server-side. The 'form is in idle state after no-JS submit'
     *    signal is weaker than 'success block renders.'"
     *
     * Phase 3's documented acceptance per RESEARCH Open Question 1 + D-16:
     *   - FORM-08 wording: "the form remains submittable without JS" → SATISFIED
     *     (the action runs server-side, the email validates, the would-be Resend
     *     write would happen in Phase 4)
     *   - POST-01 wording: "in-place success state replaces the form" → EXPLICITLY
     *     NOT FOR NO-JS USERS (would require redirect('/?signup=success') + RSC
     *     search-param read; out of Phase 3 scope per D-16; tracked as deferred follow-up)
     *
     * What this spec ASSERTS:
     *   - Page returns HTTP 200 after no-JS POST (server processed the submission)
     *   - Form is visible after the round-trip (returned to idle state, not error state)
     *   - Email input is cleared (useActionState reset; native form behavior)
     *
     * What this spec DOES NOT assert:
     *   - Success block renders (it doesn't — see Pitfall 3 + D-16)
     *   - State is preserved (it isn't — see Pitfall 3)
     *
     * This spec runs under Playwright's `no-js` project (playwright.config.ts):
     *   - testMatch: /tests\/no-js\/.*\.spec\.ts/
     *   - use: { javaScriptEnabled: false }
     *
     * Pre-requisite: `npm run dev` running at :3000.
     */
    test.describe("Phase 3 form — no-JS progressive enhancement (FORM-08 / D-16)", () => {
      test("native form POST processes server-side, page re-renders in idle state (FORM-08 graceful degradation per D-16)", async ({ page }) => {
        // Confirm we're in no-JS mode for this project
        // (sanity check — the project config should already disable JS)
        const navigation = await page.goto("/#waitlist")
        expect(navigation?.status(), "page must return HTTP 200 on initial load").toBe(200)

        // Form must be present at /
        const emailInput = page.locator('input[name="email"]')
        await expect(emailInput, "form must be present in initial render (no-JS path renders RSC + Client Component as static HTML)").toBeVisible()

        // Submit via native HTML form POST (no fetch, no JS) — D-16: framework-native progressive enhancement
        await emailInput.fill('noscript@example.com')

        // Click submit and wait for the navigation that the native POST triggers.
        const [response] = await Promise.all([
          page.waitForNavigation({ timeout: 10000 }),
          page.click('button[type="submit"]'),
        ])

        // Server processed the submission (HTTP 200 — action ran successfully)
        expect(response?.status(), "no-JS POST must return HTTP 200 (action processed)").toBe(200)

        // After the round-trip, the form is back in idle state.
        // useActionState state is NOT preserved (Pitfall 3) — input is empty, form is mounted.
        await expect(page.locator('form'), "form must be re-rendered after no-JS POST (idle state)").toBeVisible()
        await expect(page.locator('input[name="email"]'), "email input must be empty after no-JS round-trip (state not preserved per Pitfall 3)").toHaveValue('')

        // Sanity: success block does NOT render server-side for no-JS submits (D-16 graceful degradation acceptance)
        await expect(page.locator('[role="status"]'), "success block must NOT render for no-JS submits — Phase 3 graceful degradation acceptance per D-16 + RESEARCH Open Question 1").toHaveCount(0)

        // Bonus: confirm we're still on `/` (no client-side router involvement, native form posts to current URL)
        expect(page.url().replace(/#.*$/, '').replace(/\/$/, ''), "URL pathname unchanged after no-JS POST (native form posts to current URL)").toBe(new URL(page.url()).origin)
      })
    })
    ```

    Critical:
    - This spec is in `tests/no-js/` — Playwright's `no-js` project picks it up automatically (Plan 01 Task 4).
    - Use `page.waitForNavigation` for the submit (no-JS POST triggers a real navigation, unlike the JS-enabled path's React Action transition).
    - The assertion `expect(...success block...).toHaveCount(0)` is the load-bearing graceful degradation signal — encodes the Phase 3 D-16 acceptance.
    - Do NOT add `test.use({ javaScriptEnabled: false })` at test-level — the project config handles it. Adding both creates redundancy and confusion.
    - The JSDoc explicitly cites D-16 + RESEARCH Pitfall 3 + Open Question 1 + VALIDATION Dimension-8 — provides the rationale chain for any future contributor who wonders why the success block isn't asserted (and why no `<noscript>` banner exists).

    Per D-16 (native progressive enhancement is the accepted FORM-08 satisfaction; no mailto, no `<noscript>` banner), FORM-08, RESEARCH Pitfall 3, RESEARCH Open Question 1, VALIDATION Dimension-8 risk FORM-08.
  </action>
  <verify>
    <automated>F=/Users/jeff/repos/quibly-landing/tests/no-js/waitlist-form-progressive.spec.ts; test -f $F && grep -q "FORM-08" $F && grep -q "D-16" $F && grep -q "Pitfall 3" $F && grep -q "graceful degradation" $F && grep -q "noscript@example.com" $F && grep -q "waitForNavigation" $F && grep -q 'role="status"' $F && grep -q "toHaveCount(0)" $F && cd /Users/jeff/repos/quibly-landing && npx tsc --noEmit && npx playwright test --list tests/no-js/waitlist-form-progressive.spec.ts | grep -q "1 test"</automated>
  </verify>
  <acceptance_criteria>
    - File `tests/no-js/waitlist-form-progressive.spec.ts` exists
    - File contains FORM-08 reference in describe/JSDoc
    - File contains D-16 reference in describe/JSDoc (acceptance citation — `grep -q "D-16"` exits 0)
    - File JSDoc cites Pitfall 3 AND Open Question 1 AND VALIDATION Dimension-8 (the rationale chain)
    - File JSDoc explicitly documents graceful-degradation acceptance per D-16 ("form is in idle state after no-JS POST" — NOT "success block renders"; no `<noscript>` banner needed)
    - File submits `noscript@example.com`
    - File uses `page.waitForNavigation` to await the native POST
    - File asserts HTTP 200 response
    - File asserts `[role="status"]` count === 0 (success block must NOT render — load-bearing per D-16)
    - File asserts email input is empty after round-trip
    - File does NOT contain `test.use({ javaScriptEnabled: false })` (project config handles it)
    - tsc passes; playwright lists 1 test under the no-js project
  </acceptance_criteria>
  <done>Spec file ships; project config picks it up via `tests/no-js` testMatch; FORM-08 graceful degradation per D-16 is encoded with explicit Dimension-8 documentation.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Playwright spec → localhost dev server | Local-only test traffic |
| No-JS HTML form → Server Action | Native POST crosses the same trust boundary as the JS-enabled path; same Zod + honeypot + time-trap defenses apply (Plan 02) |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-04 | T (Tampering) | No-JS form POST | accept | The action's defenses (Zod, honeypot, time-trap) work identically for no-JS submits — same FormData arrives at the action. The spec exercises one valid email; abuse-vector tests live in Plan 02's unit suite. |
| T-03-NOJS-01 | n/a | Spec coverage gap | accept | The graceful degradation acceptance is intentional per D-16 — not a security gap. The user's submission is processed; only the UX surface is downgraded. |

No `high` severity threats. Plan 06 is a single test file with no production code surface.
</threat_model>

<verification>
After Task 1 completes:

1. **TypeScript:**
   ```bash
   npx tsc --noEmit
   ```
   Expected: exit 0.

2. **Playwright spec discovery (no-js project):**
   ```bash
   npx playwright test --list --project=no-js
   ```
   Expected: lists 1 test from `tests/no-js/waitlist-form-progressive.spec.ts`.

3. **Playwright spec discovery (NOT picked up by visual-and-form):**
   ```bash
   npx playwright test --list --project=visual-and-form | grep -i 'waitlist-form-progressive'
   ```
   Expected: NO matches (project segregation works).

4. **Full Playwright run (against running dev server):**

   Option A (manual local):
   ```bash
   # Terminal 1: npm run dev
   # Terminal 2:
   npm run test:e2e -- --project=no-js
   ```

   Option B (CI — runs automatically per Plan 01's `.github/workflows/test.yml` `playwright` job; both projects run in `npm run test:e2e`):
   ```bash
   npm run test:e2e
   ```

   Expected: the no-js test passes (HTTP 200, form returns to idle, success block does NOT render).
</verification>

<success_criteria>
- `tests/no-js/waitlist-form-progressive.spec.ts` exists
- The spec is picked up by the `no-js` Playwright project (testMatch regex)
- The spec is NOT picked up by Vitest (Plan 01 vitest.config.ts excludes `tests/no-js/**`)
- The spec is NOT picked up by the `visual-and-form` Playwright project (testMatch regex segregation)
- D-16 acceptance is explicitly documented in JSDoc (native progressive enhancement is the FORM-08 answer; no mailto, no `<noscript>` banner)
- FORM-08 graceful degradation is explicitly documented in JSDoc (Dimension-8 mitigation per VALIDATION.md)
- The load-bearing assertion `[role="status"].toHaveCount(0)` encodes the D-16 acceptance
- All gates green: `tsc --noEmit`, `npm run lint`, `npm run test:e2e -- --project=no-js`
</success_criteria>

<output>
After completion, create `.planning/phases/03-email-capture-form-stub-action/03-06-SUMMARY.md` documenting:
- Confirmation that the spec is segregated correctly (Vitest excludes; visual-and-form project does not pick it up)
- Confirmation of FORM-08 / D-16 acceptance language in JSDoc
- Note any edge cases discovered during local run (e.g., did the navigation timeout need adjustment?)
- The rationale chain for the founder review checkpoint in Plan 07: if the founder demands no-JS success block rendering (overriding D-16), scope a follow-up using `redirect('/?signup=success')` per RESEARCH Open Question 1 recommendation
</output>
</output>
