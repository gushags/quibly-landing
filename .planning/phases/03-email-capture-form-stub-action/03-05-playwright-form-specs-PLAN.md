---
phase: 03
plan: 05
id: 03-05
title: Playwright e2e form specs — pending, success (with POST-03 visual identity), validation error, server-error toast, idempotent, enter-key submit, anchor scroll
type: execute
wave: 4
depends_on: ["03-01", "03-02", "03-03", "03-04"]
files_modified:
  - tests/form/pending-state.spec.ts
  - tests/form/success-state.spec.ts
  - tests/form/validation-error.spec.ts
  - tests/form/server-error-toast.spec.ts
  - tests/form/idempotent.spec.ts
  - tests/form/enter-key-submit.spec.ts
  - tests/form/anchor-scroll.spec.ts
autonomous: true
requirements:
  - FORM-05
  - FORM-06
  - FORM-07
  - POST-01
  - POST-02
  - POST-03
  - POST-04
requirements_addressed:
  - FORM-05
  - FORM-06
  - FORM-07
  - POST-01
  - POST-02
  - POST-03
  - POST-04
nyquist_compliant: true

must_haves:
  truths:
    - "Submitting `slow@example.com` puts the form in pending state — button reads `Joining...`, both input and button disabled, `<svg>` with `animate-spin` class visible (FORM-05)"
    - "Submitting a fresh email puts `[role=status]` in DOM containing the verbatim POST-02 string (POST-01 + POST-02)"
    - "Submitting `dup@example.com` produces visually-identical success block (POST-03 — no `data-duplicate` attribute or `dup` text in the rendered DOM)"
    - "Submitting `bad-email` shows `[role=alert]` AND `expect(input).toHaveValue('bad-email')` (FORM-06 — typed-value preservation, real-DOM verification)"
    - "Submitting `err@example.com` triggers a sonner toast containing `Something went wrong. Try again in a moment.` (D-12)"
    - "Rapid double-click on submit results in only ONE form transition to success state (POST-04 — `disabled={pending}` prevents second submit)"
    - "Pressing Enter inside email input triggers form submission (FORM-07 — native `<form>` behavior)"
    - "Clicking hero CTA scrolls page so `#waitlist` section is in viewport (D-01)"
    - "Clicking secondary CTA scrolls page so `#waitlist` section is in viewport (D-02)"
    - "POST-01 in-place enforcement is atomic in the first success test: input-unmounted AND same-URL checks BOTH inside the same `test(...)` block (defense against silent degradation if the URL-only test is ever skipped)"
  artifacts:
    - path: "tests/form/pending-state.spec.ts"
      provides: "FORM-05 pending UX coverage"
      contains: "slow@example.com"
    - path: "tests/form/success-state.spec.ts"
      provides: "POST-01 + POST-02 + POST-03 success block + visual identity coverage"
      contains: "Check your inbox (and spam folder) for confirmation"
    - path: "tests/form/validation-error.spec.ts"
      provides: "FORM-06 typed-value preservation (load-bearing per Pitfall 1)"
      contains: "toHaveValue('bad-email')"
    - path: "tests/form/server-error-toast.spec.ts"
      provides: "D-12 sonner trigger on err@example.com"
      contains: "err@example.com"
    - path: "tests/form/idempotent.spec.ts"
      provides: "POST-04 disabled={pending} double-submit prevention"
      contains: "POST-04"
    - path: "tests/form/enter-key-submit.spec.ts"
      provides: "FORM-07 Enter-key submit"
      contains: "press('Enter')"
    - path: "tests/form/anchor-scroll.spec.ts"
      provides: "D-01 + D-02 hero/secondary CTAs scroll to #waitlist"
      contains: "#waitlist"
  key_links:
    - from: "all tests/form/*.spec.ts"
      to: "Phase 3 page composition"
      via: "page.goto('/')"
      pattern: "page\\.goto\\(.*\\/"
    - from: "tests/form/anchor-scroll.spec.ts"
      to: "components/sections/{hero,secondary-cta}.tsx anchors"
      via: "click [data-slot=button][data-size=hero]:has-text('Join the waitlist')"
      pattern: "click.*data-slot.*data-size"
---

<objective>
Ship 7 Playwright e2e specs covering the form's full UX surface against the running Phase 3 page. Each spec exercises a single requirement (or tightly-related pair) using deterministic stub-email triggers from Plan 02 (`dup@`, `err@`, `slow@`, plain valid).

Purpose: The unit suite (Plans 02 + 03) proves the action's branches and the form's static surface; Playwright is the only layer that can drive `useActionState` end-to-end (RTL + happy-dom can't run Server Action transitions reliably). This plan closes the gap between unit signals and the user-observable UX.

Three Dimension-8 risks (per VALIDATION.md lines 113-122) get explicit mitigation here:
- **POST-03 visual identity**: success-state spec asserts no `data-duplicate` attribute and structural equality between `dup` and fresh-signup submission flows
- **POST-04 idempotency**: spec asserts that `disabled={pending}` prevents the second click during pending (not real audience-level dedup, which is Phase 4 scope)
- **FORM-08 graceful degradation**: handled in Plan 06 (no-JS spec) — NOT in this plan

Output: 7 Playwright specs in `tests/form/`, all green against `npm run dev` at :3000.
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
@.planning/phases/03-email-capture-form-stub-action/03-UI-SPEC.md
@.planning/phases/03-email-capture-form-stub-action/03-03-SUMMARY.md
@.planning/phases/03-email-capture-form-stub-action/03-04-SUMMARY.md
@playwright.config.ts
@tests/visual/above-fold.spec.ts
@components/waitlist/waitlist-form.tsx
@app/actions/join-waitlist.ts

<interfaces>
The Phase 3 page composition (already shipped by Plan 03):
- `/` renders Hero → WaitlistFormSection (id=waitlist) → WhyQuibly → FounderVoice → SecondaryCTA → Footer
- Hero CTA: `<a data-slot="button" data-size="hero" href="#waitlist">Join the waitlist</a>`
- Secondary CTA: `<a data-slot="button" data-size="hero" href="#waitlist">Don't miss launch — join the waitlist</a>`
- Form submit: `<button data-slot="button" data-size="hero" type="submit">Join the waitlist</button>` (becomes `Joining...` during pending)

Stub email triggers (from Plan 02):
- `dup@example.com` → success + duplicate (UI must NOT differentiate — POST-03)
- `err@example.com` → error with `message: 'Something went wrong. Try again in a moment.'` → sonner toast
- `slow@example.com` → 1500ms delay → success (used for visible pending state assertions)
- any other valid email → success
- invalid email (e.g., `bad-email`) → inline error + typed-value echo (FORM-06)

Convention from Phase 2 specs (apply to all new specs):
- `import { expect, test } from "@playwright/test"` (double quotes)
- `test.describe("Phase 3 form — <name>", () => {...})`
- `test.beforeEach`: `await page.setViewportSize({ width: 320, height: 568 })` + `await page.goto("/")`
- Locator-driven assertions with descriptive `expect(value, message).toX(...)` second-arg messages
- Top-of-file JSDoc explaining purpose, decisions asserted, prerequisite (`npm run dev` running at :3000)

Playwright config (Plan 01 Task 4 update):
- `testDir: "./tests"` + project `visual-and-form` matches `tests/(visual|form)/.*\.spec\.ts`
- 30s timeout, 320×568 viewport default

WaitlistForm DOM contract (from Plan 03 — for selector targeting):
- Email input: `input[name="email"]` (also accessible via `screen.getByPlaceholderText('you@example.com')`)
- Submit button: `button[type="submit"]` (or `[data-slot="button"][data-size="hero"][type="submit"]`)
- Inline error: `p[role="alert"]` with class `text-destructive`
- Success block: `div[role="status"]` containing `<h3>You're on the list.</h3>` and `<p>Check your inbox...</p>`
- Honeypot: `input[name="website"]` (off-screen)
- Time-trap: `input[name="renderedAt"]` (hidden)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create tests/form/pending-state.spec.ts (FORM-05)</name>
  <files>tests/form/pending-state.spec.ts</files>
  <read_first>
    - /Users/jeff/repos/quibly-landing/tests/visual/above-fold.spec.ts (analog — convention, beforeEach pattern, locator/boundingBox idiom)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-PATTERNS.md (lines 301-345 — Playwright spec patterns; per-spec verification map)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-VALIDATION.md (lines 91 — pending-state.spec.ts acceptance signal)
    - /Users/jeff/repos/quibly-landing/components/waitlist/waitlist-form.tsx (D-13 pending state — `Joining...` label + `<Loader2 className="size-4 animate-spin">`)
  </read_first>
  <action>
    Create `tests/form/pending-state.spec.ts`. Submits `slow@example.com` to trigger the 1500ms delay branch (Plan 02 D-11 / CD-03), then asserts pending UX is visible BEFORE the action resolves.

    File contents:

    ```ts
    import { expect, test } from "@playwright/test"

    /**
     * Phase 3 form — pending state (FORM-05 / D-13).
     *
     * Drives `slow@example.com` (Plan 02 stub branch — 1500ms delay then success).
     * During the delay window, asserts:
     *   - Submit button is disabled
     *   - Submit button label flips to "Joining..."
     *   - <svg> with `animate-spin` class is visible (Loader2 icon — CD-04)
     *   - Email input is also disabled (D-13 — both disabled to prevent double-submit)
     *
     * Pre-requisite: `npm run dev` (or `npm run build && npm run start`) running at :3000.
     */
    test.describe("Phase 3 form — pending state (FORM-05 / D-13)", () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 568 })
        await page.goto("/#waitlist")
      })

      test("slow@example.com triggers visible pending UX (Joining... + spinner + disabled)", async ({ page }) => {
        await page.fill('input[name="email"]', 'slow@example.com')
        // Click but don't await — we want to inspect mid-flight state
        const submitClick = page.click('button[type="submit"]')

        // Within the 1500ms slow-stub window, the pending state should be visible.
        const submit = page.locator('button[type="submit"]')

        await expect(submit, "submit button should be disabled while pending (D-13)").toBeDisabled({ timeout: 1000 })
        await expect(submit, 'submit button label should flip to "Joining..." while pending').toHaveText(/Joining\.\.\./, { timeout: 1000 })

        // Loader2 icon: <svg> child of the submit button with animate-spin class
        const spinner = submit.locator('svg.animate-spin')
        await expect(spinner, "spinner svg with animate-spin class must be visible during pending").toBeVisible({ timeout: 1000 })

        // Email input is also disabled per D-13 (prevents double-submit)
        const emailInput = page.locator('input[name="email"]')
        await expect(emailInput, "email input should be disabled while pending (D-13)").toBeDisabled({ timeout: 1000 })

        // Wait for the slow stub to resolve (~1500ms)
        await submitClick
        // After resolution, success block is in DOM (POST-01) — sanity tail
        await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 3000 })
      })
    })
    ```

    Critical:
    - Do NOT await `page.click('button[type="submit"]')` BEFORE the assertions — the click promise resolves AFTER the action returns, by which point pending=false. We capture the promise and assert on the in-flight state.
    - Use `{ timeout: 1000 }` on the pending-state assertions — the slow stub gives us 1500ms of pending; 1000ms is conservative.
    - The `Joining...` text uses literal three dots (matches `components/waitlist/waitlist-form.tsx` line ~145 `'Joining...'`).
    - Sanity tail (success block visible after resolution) confirms the slow branch did finish — guards against false-negative passes if the form somehow never submits.

    Per FORM-05, D-13.
  </action>
  <verify>
    <automated>F=/Users/jeff/repos/quibly-landing/tests/form/pending-state.spec.ts; test -f $F && grep -q "slow@example.com" $F && grep -q "Joining" $F && grep -q "animate-spin" $F && grep -q "toBeDisabled" $F && cd /Users/jeff/repos/quibly-landing && npx tsc --noEmit && npx playwright test --list tests/form/pending-state.spec.ts | grep -q "1 test"</automated>
  </verify>
  <acceptance_criteria>
    - File `tests/form/pending-state.spec.ts` exists
    - File contains a `test.describe` matching `/Phase 3 form — pending state/`
    - File submits `slow@example.com` to trigger the delay branch
    - File asserts `submit button toBeDisabled` during pending
    - File asserts submit text matches `/Joining\.\.\./`
    - File asserts `svg.animate-spin` is visible
    - File asserts email input toBeDisabled during pending
    - File uses 320×568 viewport (mobile-first per Phase 2 lock)
    - `npx playwright test --list tests/form/pending-state.spec.ts` lists 1 test
    - `tsc --noEmit` passes
  </acceptance_criteria>
  <done>Spec file exists with all assertions; tsc passes; playwright lists the test. Combined run gate happens in this plan's verification block after all 7 specs ship.</done>
</task>

<task type="auto">
  <name>Task 2: Create tests/form/success-state.spec.ts (POST-01, POST-02, POST-03 visual identity)</name>
  <files>tests/form/success-state.spec.ts</files>
  <read_first>
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-VALIDATION.md (lines 92, 113-122 — Dimension-8 POST-03 risk requires structural snapshot + no `data-duplicate` attribute)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-PATTERNS.md (lines 332 — success-state.spec.ts assertion pattern)
    - /Users/jeff/repos/quibly-landing/components/waitlist/waitlist-form.tsx (success block JSX — confirm role=status, h3, p with POST-02 verbatim)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-UI-SPEC.md (line 190 — POST-02 verbatim string mandate; line 191 — POST-03 already-subscribed identical)
  </read_first>
  <action>
    Create `tests/form/success-state.spec.ts`. Three tests — fresh signup (atomically enforces POST-01 in-place via input-unmounted AND same-URL within ONE test block), dup visually identical to fresh (POST-03), and a third URL-only test that acts as a redundant safeguard.

    **Atomic POST-01 enforcement (revision per checker W-04):** The first test asserts BOTH the input-unmounted check AND the same-URL check inside the same `test(...)` block. The `toHaveCount(0)` assertion alone is ambiguous — it passes both for "form unmounted in-place" (POST-01 correct) AND for "navigated to a different page" (POST-01 violation). Pairing it with `expect(page.url()).toBe(startURL)` inside the same block makes the in-place guarantee atomic — POST-01 cannot silently degrade if the third (URL-only) test is ever skipped or quarantined.

    File contents:

    ```ts
    import { expect, test } from "@playwright/test"

    /**
     * Phase 3 form — success state (POST-01, POST-02, POST-03).
     *
     * POST-01 in-place: form unmounts, success block mounts in same DOM region — no full-page nav.
     *   Atomic enforcement: the first test asserts BOTH input-unmounted AND same-URL within
     *   ONE test block. Without the same-URL check inside this block, `toHaveCount(0)` would
     *   pass even on a navigation away from `/` (a POST-01 violation). The third test below
     *   becomes a redundant safeguard rather than the only enforcement of POST-01.
     * POST-02 verbatim: success body must contain the exact mandated string.
     * POST-03 enumeration defense: dup@example.com renders the IDENTICAL success block — no
     *   `data-duplicate` attribute, no "duplicate" text, no different copy. Structural equality
     *   between fresh and dup paths is the load-bearing assertion (Dimension-8 risk per VALIDATION.md).
     *
     * Pre-requisite: `npm run dev` running at :3000.
     */

    const POST_02_VERBATIM = "Check your inbox (and spam folder) for confirmation."

    test.describe("Phase 3 form — success state (POST-01 / POST-02 / POST-03)", () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 568 })
        await page.goto("/#waitlist")
      })

      test("fresh signup renders [role=status] with POST-02 verbatim copy AND atomically enforces in-place POST-01 (POST-01 + POST-02)", async ({ page }) => {
        // POST-01 atomic enforcement: capture the URL BEFORE submit so we can assert
        // the page didn't navigate AWAY in the same test block as the input-unmounted check.
        // Without this same-block URL check, toHaveCount(0) below would silently pass
        // for a navigation away from `/` (which is a POST-01 violation, not in-place).
        const startURL = page.url()

        await page.fill('input[name="email"]', 'fresh@example.com')
        await page.click('button[type="submit"]')

        // Success block appears
        const status = page.locator('[role="status"]')
        await expect(status, "success block must render with role=status").toBeVisible({ timeout: 5000 })

        // POST-02 verbatim
        await expect(status, `success body must contain "${POST_02_VERBATIM}" (POST-02 verbatim mandate)`).toContainText(POST_02_VERBATIM)

        // Success H3
        await expect(status.locator('h3'), 'success H3 must contain "You\'re on the list."').toContainText("You're on the list.")

        // POST-01 atomic part 1: form has unmounted (no <form> element with name=email anymore)
        const emailInput = page.locator('input[name="email"]')
        await expect(emailInput, "form should be unmounted after success (POST-01 — in-place replacement, not nav)").toHaveCount(0)

        // POST-01 atomic part 2: URL pathname unchanged (defeats the false-positive where
        // the form unmounts because the page navigated away). Same-URL check is INSIDE
        // this test block — both halves of the in-place guarantee are enforced together.
        // Strip URL fragments (#waitlist may be added by the anchor target on goto).
        const endURL = page.url()
        expect(
          endURL.replace(/#.*$/, ""),
          "POST-01 atomic in-place enforcement: URL pathname must NOT change between submit and success render (paired with input-unmounted check above)",
        ).toBe(startURL.replace(/#.*$/, ""))
      })

      test("dup@example.com renders visually identical success block (POST-03 — no enumeration)", async ({ page }) => {
        await page.fill('input[name="email"]', 'dup@example.com')
        await page.click('button[type="submit"]')

        const status = page.locator('[role="status"]')
        await expect(status).toBeVisible({ timeout: 5000 })

        // Identical content
        await expect(status, "dup success block must contain the SAME POST-02 string as fresh signup").toContainText(POST_02_VERBATIM)
        await expect(status.locator('h3'), "dup H3 must be the same string as fresh").toContainText("You're on the list.")

        // POST-03 enumeration defense: NO data-duplicate attribute anywhere in the rendered tree
        const dupAttrs = await page.evaluate(() => {
          const all = document.querySelectorAll('*[data-duplicate]')
          return all.length
        })
        expect(dupAttrs, "POST-03 enumeration defense: NO data-duplicate attribute may be present in the DOM").toBe(0)

        // POST-03: NO "duplicate" or "already" text anywhere in the success block
        const statusHTML = await status.innerHTML()
        expect(statusHTML.toLowerCase(), "POST-03: success block must not contain 'duplicate' or 'already'").not.toMatch(/duplicate|already/)
      })

      test("URL does not navigate (POST-01 redundant safeguard — primary enforcement is atomic in test 1)", async ({ page }) => {
        // This test is now a redundant safeguard rather than the sole enforcement of
        // POST-01's same-URL invariant. The atomic enforcement (input-unmounted AND
        // same-URL paired in ONE test block) lives in the first test above. If this
        // test is ever skipped or quarantined, POST-01 is still enforced atomically.
        const startURL = page.url()
        await page.fill('input[name="email"]', 'fresh2@example.com')
        await page.click('button[type="submit"]')
        await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 5000 })
        // Either same URL or same URL + #waitlist — both are NOT navigation away
        const endURL = page.url()
        expect(endURL.replace(/#.*$/, ""), "URL pathname must not change after submit (POST-01 redundant safeguard)").toBe(startURL.replace(/#.*$/, ""))
      })
    })
    ```

    Critical:
    - `POST_02_VERBATIM` is the exact string from REQUIREMENTS.md POST-02 — do NOT paraphrase
    - The `data-duplicate` attribute query is the structural Dimension-8 mitigation per VALIDATION.md lines 119-120
    - The "duplicate"/"already" text grep is a defense-in-depth — even if a future contributor accidentally adds visible duplicate copy, this catches it
    - Use `toHaveCount(0)` for the form-unmounted assertion (Playwright idiom for "element should not exist")
    - **POST-01 atomic enforcement (W-04 fix):** The first test pairs the `toHaveCount(0)` input-unmounted assertion WITH a `expect(endURL).toBe(startURL)` same-URL check INSIDE the same test block. This defeats the false-positive where `toHaveCount(0)` would also pass if the page navigated to a different URL (which would be a POST-01 violation, not in-place success). The third test is downgraded to a "redundant safeguard" — POST-01 still holds even if the third test is quarantined or skipped.

    Per POST-01, POST-02, POST-03; VALIDATION.md Dimension-8 risk POST-03; W-04 atomic enforcement requirement.
  </action>
  <verify>
    <automated>F=/Users/jeff/repos/quibly-landing/tests/form/success-state.spec.ts; test -f $F && grep -q "Check your inbox (and spam folder) for confirmation" $F && grep -q "dup@example.com" $F && grep -q "data-duplicate" $F && grep -q "duplicate|already" $F && grep -q "POST-01 atomic" $F && grep -c "^  test(" $F | grep -q 3 && cd /Users/jeff/repos/quibly-landing && npx tsc --noEmit && npx playwright test --list tests/form/success-state.spec.ts | grep -q "3 test"</automated>
  </verify>
  <acceptance_criteria>
    - File contains EXACTLY 3 `test(...)` blocks
    - File contains the literal POST-02 string `Check your inbox (and spam folder) for confirmation.`
    - File submits `dup@example.com` and asserts identical-render
    - File queries for `data-duplicate` attribute count and asserts === 0 (POST-03 enumeration defense)
    - File grep-checks success-block HTML for `duplicate|already` text (defense in depth)
    - **The FIRST test (fresh signup) asserts BOTH `toHaveCount(0)` on email input AND `expect(endURL...).toBe(startURL...)` same-URL — atomic POST-01 enforcement (W-04 fix)**
    - File contains the literal phrase `POST-01 atomic` in either JSDoc or test name (audit trail visible)
    - File asserts URL pathname doesn't change in third test as well (redundant safeguard)
    - tsc passes; playwright lists 3 tests
  </acceptance_criteria>
  <done>Spec file with 3 passing-eligible tests; the 3 Dimension-8 mitigations for POST-03 are explicit (no `data-duplicate`, no `duplicate`/`already` text, identical role=status content); POST-01 in-place enforcement is atomic in the first test (input-unmounted + same-URL paired in one block).</done>
</task>

<task type="auto">
  <name>Task 3: Create tests/form/validation-error.spec.ts (FORM-06 typed-value echo — load-bearing per Pitfall 1)</name>
  <files>tests/form/validation-error.spec.ts</files>
  <read_first>
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-RESEARCH.md (lines 737-747 — Pitfall 1: React 19 auto-resets uncontrolled inputs; Playwright .toHaveValue() is the load-bearing test)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-VALIDATION.md (line 53 — FORM-06 e2e signal: `expect(input).toHaveValue('bad-email')`)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-PATTERNS.md (line 334 — validation-error.spec.ts assertion pattern)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-UI-SPEC.md (lines 184-188 — locked validation error copy strings)
  </read_first>
  <action>
    Create `tests/form/validation-error.spec.ts`. Submits `bad-email`, asserts inline error appears AND typed value is preserved (load-bearing Pitfall 1 test — RTL DOM check is insufficient because React 19's auto-reset only manifests in real browser).

    File contents:

    ```ts
    import { expect, test } from "@playwright/test"

    /**
     * Phase 3 form — validation error inline + typed-value preservation
     * (FORM-03 + FORM-06 — load-bearing per RESEARCH Pitfall 1).
     *
     * React 19's <form action={fn}> auto-resets uncontrolled inputs on every Promise
     * resolution from the action — regardless of return value. The action's return
     * shape includes `submittedValues.email` (Plan 02 / J1 judgment), and the form's
     * <Input defaultValue={state.submittedValues?.email}> echoes it back. RTL +
     * happy-dom CANNOT reliably observe this round-trip; only a real browser via
     * Playwright proves the user sees their typed value preserved.
     *
     * VALIDATION.md Per-Task Verification Map FORM-06: this spec is the load-bearing
     * signal.
     *
     * Pre-requisite: `npm run dev` running at :3000.
     */

    test.describe("Phase 3 form — validation error (FORM-03 / FORM-06)", () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 568 })
        await page.goto("/#waitlist")
      })

      test("invalid email shows inline error AND preserves typed value (FORM-06 — Pitfall 1)", async ({ page }) => {
        const emailInput = page.locator('input[name="email"]')
        await emailInput.fill('bad-email')
        await page.click('button[type="submit"]')

        // Inline error appears (role=alert is the wired surface per UI-SPEC line 369)
        const error = page.locator('p[role="alert"]')
        await expect(error, "inline error <p role=alert> must appear after invalid submit").toBeVisible({ timeout: 5000 })
        await expect(error, "error message must be Zod-style polite copy (UI-SPEC line 186)").toContainText(/valid email/i)

        // LOAD-BEARING: typed value preserved after action resolution (FORM-06 / Pitfall 1).
        // RTL/jsdom cannot observe React 19's auto-reset; only real browser does.
        await expect(emailInput, "FORM-06 load-bearing: typed value must be preserved via submittedValues echo").toHaveValue('bad-email')

        // aria-invalid is set on the input (UI-SPEC line 154 — wired to existing <Input> class chain)
        await expect(emailInput, "input must have aria-invalid=true after validation error").toHaveAttribute('aria-invalid', 'true')

        // The form is still mounted (not replaced by success block)
        await expect(page.locator('[role="status"]'), "success block must NOT render on validation error").toHaveCount(0)
      })

      test("empty email submission shows inline error (FORM-03)", async ({ page }) => {
        // Note: HTML5 `required` on the input would block submit in JS path; we bypass
        // by directly submitting via JS to ensure server-side Zod fires (FORM-03 source-of-truth).
        // Use `page.evaluate` to call form.submit() to bypass HTML5 validation, OR
        // (simpler) clear the required attribute via dev tools. We use the simpler approach:
        // remove `required` then submit.
        await page.evaluate(() => {
          const input = document.querySelector('input[name="email"]') as HTMLInputElement
          if (input) input.removeAttribute('required')
        })

        await page.click('button[type="submit"]')

        const error = page.locator('p[role="alert"]')
        await expect(error, "empty email must trigger Zod-validated inline error").toBeVisible({ timeout: 5000 })
      })
    })
    ```

    Critical:
    - The `expect(emailInput).toHaveValue('bad-email')` is THE load-bearing assertion per RESEARCH Pitfall 1 — VALIDATION.md flags this. Without `submittedValues` echo working end-to-end, this assertion fails and FORM-06 is broken.
    - Use `page.locator('input[name="email"]')` not `getByPlaceholderText` — robust to placeholder text changes
    - The `aria-invalid` attribute check verifies the existing `<Input>` class chain (Phase 1) wires through correctly — if `aria-invalid` is missing, the destructive-color border won't paint
    - The empty-email test uses `page.evaluate` to remove HTML5 `required` so the server-side Zod path is exercised (FORM-03 source-of-truth) without HTML5 short-circuiting

    Per FORM-03, FORM-06, Pitfall 1.
  </action>
  <verify>
    <automated>F=/Users/jeff/repos/quibly-landing/tests/form/validation-error.spec.ts; test -f $F && grep -q "toHaveValue('bad-email')" $F && grep -q "aria-invalid" $F && grep -q "p\\[role=\"alert\"\\]" $F && grep -q "Pitfall 1" $F && grep -c "^  test(" $F | grep -q 2 && cd /Users/jeff/repos/quibly-landing && npx tsc --noEmit && npx playwright test --list tests/form/validation-error.spec.ts | grep -q "2 test"</automated>
  </verify>
  <acceptance_criteria>
    - File contains EXACTLY 2 `test(...)` blocks
    - File contains the literal `toHaveValue('bad-email')` (FORM-06 load-bearing assertion)
    - File contains `aria-invalid` attribute check
    - File contains `p[role="alert"]` selector (matches UI-SPEC line 369 wired surface)
    - File mentions Pitfall 1 in JSDoc (rationale documented)
    - tsc passes; playwright lists 2 tests
  </acceptance_criteria>
  <done>Spec file with 2 tests covering FORM-03 + FORM-06 (Pitfall 1 load-bearing).</done>
</task>

<task type="auto">
  <name>Task 4: Create tests/form/server-error-toast.spec.ts (D-12 sonner trigger)</name>
  <files>tests/form/server-error-toast.spec.ts</files>
  <read_first>
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-VALIDATION.md (line 94 — server-error-toast.spec.ts trigger and copy)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-PATTERNS.md (line 335 — server-error-toast.spec.ts pattern)
    - /Users/jeff/repos/quibly-landing/components/ui/sonner.tsx (Toaster wrapper — confirm bottom-right default, error variant uses OctagonXIcon)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-CONTEXT.md (D-12 — sonner copy verbatim "Something went wrong. Try again in a moment.")
  </read_first>
  <action>
    Create `tests/form/server-error-toast.spec.ts`. Submits `err@example.com` (Plan 02 stub branch — returns `{ status: 'error', message: '...' }` with no `fieldErrors`), asserts sonner toast surfaces with the exact D-12 copy.

    File contents:

    ```ts
    import { expect, test } from "@playwright/test"

    /**
     * Phase 3 form — server-error toast (D-12 sonner routing).
     *
     * D-12: validation errors → inline; server errors (status=error AND message AND
     * NOT fieldErrors) → sonner toast. Plan 02's stub action triggers this branch
     * via `err@example.com`.
     *
     * Toast copy verbatim per D-12: "Something went wrong. Try again in a moment."
     * Toast surface uses sonner's `error` variant (red OctagonXIcon — wired in
     * components/ui/sonner.tsx).
     *
     * Pre-requisite: `npm run dev` running at :3000.
     */

    const TOAST_COPY = "Something went wrong. Try again in a moment."

    test.describe("Phase 3 form — server-error sonner toast (D-12)", () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 568 })
        await page.goto("/#waitlist")
      })

      test("err@example.com triggers sonner toast with D-12 verbatim copy", async ({ page }) => {
        await page.fill('input[name="email"]', 'err@example.com')
        await page.click('button[type="submit"]')

        // Sonner mounts toasts in [data-sonner-toaster] container (sonner internal selector).
        // The toast itself has role=status (sonner default) and contains the message text.
        const toast = page.locator('[data-sonner-toast]').filter({ hasText: TOAST_COPY })
        await expect(toast, `sonner toast must surface with D-12 verbatim copy: "${TOAST_COPY}"`).toBeVisible({ timeout: 5000 })

        // Form remains mounted (NOT replaced by success block — server error, retry-as-is)
        await expect(page.locator('input[name="email"]'), "email input must remain mounted on server error (form is still submittable)").toBeVisible()

        // No inline error <p role=alert> for server errors — D-12 routes server errors to toast only
        await expect(page.locator('p[role="alert"]'), "no inline <p role=alert> for server errors — D-12 routes to sonner toast").toHaveCount(0)
      })
    })
    ```

    Critical:
    - `[data-sonner-toast]` is sonner's internal data-attribute selector — verified via sonner source. Use `.filter({ hasText: TOAST_COPY })` for robustness (sonner may render multiple toasts in same container).
    - Default sonner toast position is bottom-right (CD-07); does not affect visibility assertion (Playwright `toBeVisible` works regardless of viewport position; `toBeInViewport` would be stricter but unnecessary).
    - The form must remain mounted — server error UX is "fix-as-is, retry" (D-12), not "replaced by error block".
    - The absence of `<p role="alert">` confirms the routing is correct (D-12 — server errors go to toast, not inline).

    Per D-12.
  </action>
  <verify>
    <automated>F=/Users/jeff/repos/quibly-landing/tests/form/server-error-toast.spec.ts; test -f $F && grep -q "Something went wrong. Try again in a moment." $F && grep -q "err@example.com" $F && grep -q "data-sonner-toast" $F && grep -q "p\\[role=\"alert\"\\]" $F && cd /Users/jeff/repos/quibly-landing && npx tsc --noEmit && npx playwright test --list tests/form/server-error-toast.spec.ts | grep -q "1 test"</automated>
  </verify>
  <acceptance_criteria>
    - File contains the literal D-12 string `Something went wrong. Try again in a moment.`
    - File submits `err@example.com`
    - File asserts toast visibility via `[data-sonner-toast]` filtered by hasText
    - File asserts form remains mounted (input still visible after error)
    - File asserts NO `p[role="alert"]` — confirms D-12 routing (server errors → toast, NOT inline)
    - tsc passes; playwright lists 1 test
  </acceptance_criteria>
  <done>Spec file ships; D-12 routing covered.</done>
</task>

<task type="auto">
  <name>Task 5: Create tests/form/idempotent.spec.ts (POST-04 — disabled={pending} prevents double-submit)</name>
  <files>tests/form/idempotent.spec.ts</files>
  <read_first>
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-VALIDATION.md (lines 95, 121-122 — idempotent.spec.ts; Dimension-8 POST-04 mitigation: stub-action idempotency is browser-level, NOT real audience-level)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-PATTERNS.md (line 336 — idempotent.spec.ts pattern)
  </read_first>
  <action>
    Create `tests/form/idempotent.spec.ts`. Asserts that rapid double-click on the submit button results in only ONE form transition (because `disabled={pending}` on the second click is a no-op). This is the Phase 3 stub-action idempotency definition per VALIDATION.md Dimension-8 mitigation — real audience-level dedup is Phase 4.

    File contents:

    ```ts
    import { expect, test } from "@playwright/test"

    /**
     * Phase 3 form — idempotent submission (POST-04, browser-level).
     *
     * VALIDATION.md Dimension-8 risk POST-04 mitigation: stub-action idempotency is
     * defined as "the second rapid click during pending is a no-op due to
     * disabled={pending} on the button". Real audience-level dedup (action sees the
     * same email twice and de-duplicates the audience write) is Phase 4 scope —
     * Resend's `contacts.create` is naturally idempotent on email uniqueness.
     *
     * Phase 3's POST-04 acceptance:
     *   - User clicks submit twice rapidly with `slow@example.com` (1500ms delay)
     *   - The second click during pending is blocked because button is disabled
     *   - Final state: success (one transition, not two)
     *
     * Pre-requisite: `npm run dev` running at :3000.
     */

    test.describe("Phase 3 form — idempotent (POST-04)", () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 568 })
        await page.goto("/#waitlist")
      })

      test("rapid double-click during pending state results in one success transition (POST-04)", async ({ page }) => {
        await page.fill('input[name="email"]', 'slow@example.com')

        const submit = page.locator('button[type="submit"]')

        // First click — starts the pending state (1500ms delay branch).
        const firstClick = submit.click()

        // Wait for the button to become disabled (pending=true)
        await expect(submit).toBeDisabled({ timeout: 1000 })

        // Second rapid click attempt — should be a no-op because button is disabled.
        // Use { force: true } to ensure Playwright doesn't auto-skip the click on disabled.
        // We expect this to either throw (force-click disabled) or simply do nothing.
        // Using try/catch to capture either outcome.
        let secondClickFailed = false
        try {
          await submit.click({ trial: true, timeout: 500 })
        } catch {
          secondClickFailed = true
        }
        // Either the click is rejected by Playwright's actionability check (button disabled),
        // OR the click "succeeds" but does nothing because the button is disabled.
        // EITHER outcome is acceptable for POST-04.

        // Wait for the first action to complete (~1500ms total)
        await firstClick

        // Final state: success block visible (one and only one success transition)
        const status = page.locator('[role="status"]')
        await expect(status, "success block must render exactly once after rapid double-submit (POST-04)").toBeVisible({ timeout: 3000 })
        await expect(status, "success block count must be exactly 1").toHaveCount(1)

        // Inline error must NOT be present (we submitted a valid stub email)
        await expect(page.locator('p[role="alert"]')).toHaveCount(0)

        // Sanity log
        console.log(`POST-04 outcome: secondClickFailed=${secondClickFailed} (acceptable either way; what matters is final success block count = 1)`)
      })
    })
    ```

    Critical:
    - The {trial: true} click option performs all actionability checks WITHOUT actually clicking — useful here because we expect the button to be disabled. Playwright will fail this if button is not actionable.
    - The acceptance is `[role="status"]` count === 1 at the end — the load-bearing signal that exactly ONE transition occurred regardless of how many clicks the user attempted
    - Real audience-level idempotency (Phase 4) is OUT OF SCOPE per VALIDATION.md Dimension-8 mitigation language — document in JSDoc
    - Phase 3's stub action returns the same shape on every invocation — so even if both clicks DID fire two action calls, the user sees one success state (action is functionally pure for stub branches)

    Per POST-04, VALIDATION Dimension-8 risk POST-04.
  </action>
  <verify>
    <automated>F=/Users/jeff/repos/quibly-landing/tests/form/idempotent.spec.ts; test -f $F && grep -q "POST-04" $F && grep -q "slow@example.com" $F && grep -q "toBeDisabled" $F && grep -q "toHaveCount(1)" $F && grep -q "Dimension-8" $F && cd /Users/jeff/repos/quibly-landing && npx tsc --noEmit && npx playwright test --list tests/form/idempotent.spec.ts | grep -q "1 test"</automated>
  </verify>
  <acceptance_criteria>
    - File contains POST-04 reference in describe/test name
    - File submits `slow@example.com` (the delay branch enables observable pending state)
    - File asserts button toBeDisabled during pending
    - File asserts final `[role="status"]` count === 1 (single success transition)
    - File asserts `p[role="alert"]` count === 0 (valid email, no inline error)
    - File JSDoc documents Dimension-8 mitigation scope (browser-level, not audience-level)
    - tsc passes; playwright lists 1 test
  </acceptance_criteria>
  <done>Spec covers POST-04 with explicit Dimension-8 boundary documentation.</done>
</task>

<task type="auto">
  <name>Task 6: Create tests/form/enter-key-submit.spec.ts (FORM-07)</name>
  <files>tests/form/enter-key-submit.spec.ts</files>
  <read_first>
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-VALIDATION.md (line 96 — enter-key-submit.spec.ts)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-PATTERNS.md (line 337 — enter-key-submit.spec.ts pattern)
  </read_first>
  <action>
    Create `tests/form/enter-key-submit.spec.ts`. Asserts native `<form>` submits when Enter is pressed inside a single text input — FORM-07 native HTML behavior.

    File contents:

    ```ts
    import { expect, test } from "@playwright/test"

    /**
     * Phase 3 form — Enter-key submit (FORM-07).
     *
     * FORM-07: native <form> element submits when Enter is pressed in a single
     * text-style input. No JS needed; the browser handles it.
     *
     * Pre-requisite: `npm run dev` running at :3000.
     */
    test.describe("Phase 3 form — Enter-key submit (FORM-07)", () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 568 })
        await page.goto("/#waitlist")
      })

      test("typing valid email + pressing Enter submits the form and shows success block (FORM-07)", async ({ page }) => {
        const emailInput = page.locator('input[name="email"]')
        await emailInput.fill('enter-key@example.com')
        await emailInput.press('Enter')

        // Success block renders (FORM-07 → POST-01 → POST-02 chain)
        const status = page.locator('[role="status"]')
        await expect(status, "Enter-key submit should trigger the same success path as button click").toBeVisible({ timeout: 5000 })
        await expect(status).toContainText("Check your inbox (and spam folder) for confirmation.")
      })
    })
    ```

    Critical:
    - Use `emailInput.press('Enter')` — Playwright's native `KeyboardEvent` simulation (more realistic than `keyboard.press`).
    - Single `<input>` in a `<form>` triggers default browser submit on Enter — no extra JS handler needed (which is exactly what FORM-07 wants to verify).

    Per FORM-07.
  </action>
  <verify>
    <automated>F=/Users/jeff/repos/quibly-landing/tests/form/enter-key-submit.spec.ts; test -f $F && grep -q "FORM-07" $F && grep -q "press('Enter')" $F && grep -q "Check your inbox" $F && cd /Users/jeff/repos/quibly-landing && npx tsc --noEmit && npx playwright test --list tests/form/enter-key-submit.spec.ts | grep -q "1 test"</automated>
  </verify>
  <acceptance_criteria>
    - File contains FORM-07 reference
    - File contains the literal `press('Enter')` call
    - File asserts success block visible after Enter
    - tsc passes; playwright lists 1 test
  </acceptance_criteria>
  <done>FORM-07 covered with single Enter-key test.</done>
</task>

<task type="auto">
  <name>Task 7: Create tests/form/anchor-scroll.spec.ts (D-01 hero anchor + D-02 secondary anchor scroll to #waitlist)</name>
  <files>tests/form/anchor-scroll.spec.ts</files>
  <read_first>
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-VALIDATION.md (line 97 — anchor-scroll.spec.ts)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-PATTERNS.md (lines 338, 339-345 — Phase 2 button-radius regression note)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-04-SUMMARY.md (the 3 hero pills shipped — selector reference)
  </read_first>
  <action>
    Create `tests/form/anchor-scroll.spec.ts`. Two tests — one for hero CTA, one for secondary CTA. Both click the anchor and assert the `#waitlist` section is in viewport after the click.

    File contents (write exactly):

    ```ts
    import { expect, test } from "@playwright/test"

    /**
     * Phase 3 form — anchor smooth-scroll (D-01 hero, D-02 secondary).
     *
     * The hero CTA and secondary CTA both flip from disabled <button> (Phase 2 D-31)
     * to <a href="#waitlist"> (Phase 3 D-01/D-02). Plan 04 ships the anchor flip;
     * this spec verifies the smooth-scroll behavior brings #waitlist into viewport.
     *
     * CSS scroll-behavior: smooth lives at globals.css:96 (Phase 2 D-08).
     * prefers-reduced-motion: reduce override at globals.css:100-106.
     *
     * Pre-requisite: npm run dev running at :3000.
     */

    test.describe("Phase 3 anchor scroll (D-01 hero / D-02 secondary)", () => {
      test.beforeEach(async ({ page }) => {
        // Use a viewport tall enough that the form is below the fold initially.
        await page.setViewportSize({ width: 320, height: 568 })
        await page.goto("/")
        // Confirm starting at top of page (hero in viewport, form NOT in viewport)
        await expect(page.locator("h1").first(), "hero h1 must be in viewport at page load").toBeInViewport()
      })

      test("hero CTA click scrolls #waitlist into viewport (D-01)", async ({ page }) => {
        // Hero CTA: <a data-slot="button" data-size="hero" href="#waitlist">Join the waitlist</a>
        // Located via text + data-size to disambiguate from secondary CTA (different copy).
        const heroAnchor = page.locator('[data-slot="button"][data-size="hero"]', { hasText: "Join the waitlist" }).first()
        await heroAnchor.click()

        // After click, the #waitlist section should be in viewport.
        const waitlistSection = page.locator("section#waitlist")
        await expect(waitlistSection, "#waitlist section must be in viewport after hero CTA click").toBeInViewport({ timeout: 2000 })
      })

      test("secondary CTA click scrolls #waitlist into viewport (D-02)", async ({ page }) => {
        // Secondary CTA: <a data-slot="button" data-size="hero" href="#waitlist">Don't miss launch — join the waitlist</a>
        // Scroll to bottom first so the secondary CTA is visible/clickable.
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

        const secondaryAnchor = page.locator('[data-slot="button"][data-size="hero"]', { hasText: "Don't miss launch" })
        await expect(secondaryAnchor, "secondary CTA should be in viewport after scrolling to bottom").toBeInViewport()
        await secondaryAnchor.click()

        // After click, scroll BACK UP — #waitlist should be in viewport
        const waitlistSection = page.locator("section#waitlist")
        await expect(waitlistSection, "#waitlist section must be in viewport after secondary CTA click (scroll up)").toBeInViewport({ timeout: 2000 })
      })

      test("URL hash updates to #waitlist after anchor click (sanity — confirms native anchor behavior)", async ({ page }) => {
        const heroAnchor = page.locator('[data-slot="button"][data-size="hero"]', { hasText: "Join the waitlist" }).first()
        await heroAnchor.click()
        await expect(page).toHaveURL(/#waitlist$/)
      })
    })
    ```

    Critical:
    - Use `[data-slot="button"][data-size="hero"]` selectors (tag-agnostic, matches both `<a>` and `<button>` per Plan 04 update — Pitfall 9)
    - Disambiguate hero vs secondary via `hasText` (`"Join the waitlist"` matches BOTH the hero anchor AND the form submit button — use `.first()` for hero since it appears first in DOM order)
    - Use `toBeInViewport()` (Playwright native — checks bounding box vs viewport)
    - Allow 2s timeout for smooth-scroll completion (CSS animation)
    - The third test (URL hash) is sanity — confirms the native `<a href>` behavior is intact even after `<Button asChild>` wrapping

    Per D-01, D-02.
  </action>
  <verify>
    <automated>F=/Users/jeff/repos/quibly-landing/tests/form/anchor-scroll.spec.ts; test -f $F && grep -q "D-01" $F && grep -q "D-02" $F && grep -q "section#waitlist" $F && grep -q "toBeInViewport" $F && grep -c "^  test(" $F | grep -q 3 && npx tsc --noEmit && npx playwright test --list tests/form/anchor-scroll.spec.ts | grep -q "3 test"</automated>
  </verify>
  <acceptance_criteria>
    - File contains 3 `test(...)` blocks (hero scroll, secondary scroll, URL hash sanity)
    - File uses `[data-slot="button"][data-size="hero"]` tag-agnostic selectors
    - File asserts `section#waitlist` `toBeInViewport()` after each anchor click
    - File mentions D-01 and D-02 in describe/JSDoc
    - tsc passes; playwright lists 3 tests
  </acceptance_criteria>
  <done>Anchor scroll spec ships with 3 tests covering hero, secondary, and URL hash sanity.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Playwright spec → localhost dev server | All tests run against local Next.js dev server; no production exposure |
| Stub email triggers → action | Test data uses Plan 02's deterministic stub triggers (`dup@`, `err@`, `slow@`) — never real email addresses |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-01 | I (Information Disclosure) | success-state.spec.ts dup vs fresh assertion | mitigate | Three independent enforcement signals: (1) `data-duplicate` attribute count === 0, (2) success-block HTML must NOT contain `duplicate` or `already` text, (3) identical role=status content for fresh and dup. Catches any future regression that surfaces the duplicate flag in the UI. |
| T-03-04 | T (Tampering) | validation-error.spec.ts empty-email path | mitigate | Removes HTML5 `required` attribute via `page.evaluate` to force the server-side Zod path to fire — confirms FORM-03 source-of-truth validation is engaged even when client-side HTML5 is bypassed. |
| T-03-POST-01 | I (Information Disclosure) / Tampering | success-state.spec.ts POST-01 atomic enforcement | mitigate | First test pairs `toHaveCount(0)` with `expect(endURL).toBe(startURL)` INSIDE the same test block — defeats the false-positive where a navigation away from `/` (POST-01 violation) would silently pass the input-unmounted check. The third test is now a redundant safeguard rather than the sole enforcement. |
| T-03-TEST-01 | n/a | All tests/form/* | n/a | Tests are not production code — no security surface introduced by the specs themselves. |

No `high` severity threats. The POST-03 enumeration defense is the most consequential check; this plan provides three layers. POST-01 in-place enforcement is now atomic in the first success test (W-04 fix).
</threat_model>

<verification>
After all 7 tasks complete:

1. **TypeScript:**
   ```bash
   npx tsc --noEmit
   ```
   Expected: exit 0.

2. **Playwright spec discovery:**
   ```bash
   npx playwright test --list tests/form/
   ```
   Expected: ~12 tests across 7 files (counts: pending=1, success=3, validation=2, server-error=1, idempotent=1, enter-key=1, anchor-scroll=3).

3. **Full Playwright run (against running dev server — load-bearing combined gate):**

   Option A (manual local run):
   ```bash
   # Terminal 1:
   npm run dev
   # Terminal 2:
   npm run test:e2e -- tests/form/
   ```

   Option B (CI — runs automatically on PR per Plan 01's `.github/workflows/test.yml` `playwright` job):
   ```bash
   # CI runs: npm run build && npx next start & && npx wait-on http://localhost:3000 && npm run test:e2e
   ```

   Expected: all ~12 tests pass.

4. **Phase 2 button-radius spec STILL green** (regression guard from Plan 04):
   ```bash
   npm run test:e2e -- tests/visual/button-radius.spec.ts
   ```
   Expected: 2 tests pass (28px radius + 48px height — Plan 04's selector update keeps this green).

5. **Phase 2 above-fold spec STILL green** (form should not regress hero LCP):
   ```bash
   npm run test:e2e -- tests/visual/above-fold.spec.ts
   ```
   Expected: 4 tests pass.

6. **POST-03 grep audit (defense-in-depth — render code never reads duplicate):**
   ```bash
   grep -nE 'state\.duplicate|state\?\.duplicate' components/waitlist/waitlist-form.tsx | grep -v '^[0-9]*: *[*/]'
   ```
   Expected: NO matches outside comments (already verified in Plan 03; re-checked here as anchor).

7. **POST-01 atomic enforcement audit (W-04 fix — first success test pairs both checks):**
   ```bash
   grep -A 40 'test("fresh signup' tests/form/success-state.spec.ts | grep -q 'toHaveCount(0)' && grep -A 40 'test("fresh signup' tests/form/success-state.spec.ts | grep -q 'startURL'
   ```
   Expected: both `toHaveCount(0)` AND `startURL` appear within the first test block — atomic in-place enforcement.
</verification>

<success_criteria>
- 7 Playwright spec files exist in `tests/form/`
- ~12 tests total covering: FORM-05, FORM-06 (load-bearing Pitfall 1), FORM-07, POST-01, POST-02 (verbatim), POST-03 (3 enforcement layers), POST-04 (browser-level)
- POST-01 in-place enforcement is **atomic in the first success test** (input-unmounted check AND same-URL check INSIDE the same `test(...)` block — W-04 fix)
- D-12 sonner trigger covered (`err@example.com` → toast with verbatim copy)
- D-01 + D-02 anchor scroll covered
- All 3 Dimension-8 risks (FORM-08, POST-03, POST-04) addressed (FORM-08 via Plan 06; POST-03 + POST-04 here)
- Tests reuse Plan 02 stub triggers (`dup@`, `err@`, `slow@`, plain valid)
- All gates green: `tsc --noEmit`, `npm run lint`, full `npm run test:e2e`
- Phase 2 specs (button-radius, above-fold) STILL green (no regression)
</success_criteria>

<output>
After completion, create `.planning/phases/03-email-capture-form-stub-action/03-05-SUMMARY.md` documenting:
- Final spec file count (7) and test count (~12)
- Confirmation that all 3 POST-03 enforcement layers fired (no `data-duplicate`, no `duplicate|already` text, identical content)
- Confirmation that Pitfall 1 load-bearing assertion (`toHaveValue('bad-email')`) is in `tests/form/validation-error.spec.ts`
- Confirmation that POST-04 mitigation scope (browser-level, not audience-level) is documented in `tests/form/idempotent.spec.ts`
- **Confirmation that POST-01 atomic enforcement (W-04 fix) is in place — first success test pairs `toHaveCount(0)` AND `startURL` same-URL check inside ONE test block**
- Total CI duration estimate based on Plan 01's `playwright` job timing
- Any flaky tests noted for follow-up
</output>
</output>
