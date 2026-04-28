import { test, expect } from '@playwright/test'

/**
 * Phase 3 form — no-JS progressive enhancement (FORM-08 + D-16 acceptance).
 *
 * D-16 acceptance (CONTEXT.md): native `<form action={joinWaitlistAction}>` works
 * without JS via Next.js 16 Server Actions native progressive enhancement.
 * No mailto fallback, no `<noscript>` banner. FORM-08 is satisfied by the framework
 * — this spec encodes that acceptance so a future regression cannot silently
 * downgrade the no-JS submit path.
 *
 * VALIDATION.md Dimension-8 risk FORM-08 (planner-stated risk):
 *   "useActionState state is NOT preserved across the no-JS round-trip → success
 *    block won't render server-side. The 'form is in idle state after no-JS submit'
 *    signal is weaker than 'success block renders.'"
 *
 * EMPIRICAL FINDING (executor — Plan 03-06): the Dimension-8 / RESEARCH Pitfall 3
 * premise is OUTDATED for the live stack (Next.js 16.2.1 + React 19.2.4). When
 * the form is submitted without JavaScript, the server-rendered response after
 * the POST round-trip ALREADY INCLUDES the success block (`role="status"`, the
 * `CircleCheck` + "You're on the list." H3 + POST-02 sub-copy) — the form is
 * unmounted server-side and the success branch of the Client Component renders
 * statically. RESEARCH Open Question 1's "would require redirect('/?signup=success')
 * workaround" is unnecessary on this version: the framework threads the action's
 * return value back into the no-JS render natively.
 *
 * This is a STRENGTHENING of D-16's acceptance, not a contradiction:
 *   - D-16 only required "framework-native progressive enhancement; no mailto
 *     fallback, no `<noscript>` banner" — that holds.
 *   - The graceful-degradation accepted-fallback in Open Question 1 was a worst-case
 *     position; the framework empirically delivers POST-01 ("in-place success state
 *     replaces the form") for no-JS users too.
 *   - FORM-08 is satisfied by the framework — same conclusion as D-16, stronger evidence.
 *
 * What this spec ASSERTS (encodes the empirical reality + locks regression guard):
 *   - Page returns HTTP 200 after no-JS POST (server processed the submission)
 *   - Form is UNMOUNTED after the round-trip (no `<form>` in the post-POST HTML —
 *     locked via `toHaveCount(0)` against the form locator; the Pitfall 3
 *     "form is in idle state" prediction does NOT hold on this version)
 *   - Success block IS rendered server-side (`[role="status"]` count === 1) —
 *     stronger than the planner's expectation, locks in the framework-provided UX
 *
 * What this spec DOES NOT assert:
 *   - That state is preserved across the round-trip via useActionState (it appears
 *     to be, but encoding HOW it's preserved is implementation detail; we test
 *     OUTCOME — success block in DOM)
 *
 * This spec runs under Playwright's `no-js` project (playwright.config.ts):
 *   - testMatch: /tests\/no-js\/.*\.spec\.ts/
 *   - use: { javaScriptEnabled: false }
 *
 * Pre-requisite: `npm run dev` running at :3000 (or `next start` for production-like).
 */
test.describe("Phase 3 form — no-JS progressive enhancement (FORM-08 / D-16)", () => {
  test("native form POST processes server-side and renders success block (FORM-08 satisfied; D-16 framework progressive enhancement; supersedes Pitfall 3 / Dimension-8 graceful degradation prediction per Open Question 1)", async ({ page }) => {
    // Confirm initial render: the form is present and reachable via the #waitlist anchor.
    const navigation = await page.goto("/#waitlist")
    expect(navigation?.status(), "page must return HTTP 200 on initial load").toBe(200)

    // Form must be present at /
    const emailInput = page.locator('input[name="email"]')
    await expect(emailInput, "form must be present in initial render (no-JS path renders RSC + Client Component as static HTML)").toBeVisible()

    // Submit via native HTML form POST (no fetch, no JS) — D-16: framework-native progressive enhancement
    await emailInput.fill('noscript@example.com')

    // Click submit and wait for the navigation that the native POST triggers.
    // `force: true` bypasses Playwright's actionability stability check — the
    // submit button passes visibility + enabled + bounded-box checks but the
    // stability check (n consecutive frames of identical bounds) flakes intermittently
    // under Next dev (Turbopack HMR / font async load) and even under `next start`
    // when fonts arrive after first paint. The form is genuinely clickable; the
    // flake is a Playwright actionability heuristic, not a real UX defect.
    // Verified empirically on both `next dev` (Turbopack) and `next start`.
    const [response] = await Promise.all([
      page.waitForNavigation({ timeout: 10000 }),
      page.locator('button[type="submit"]').click({ force: true }),
    ])

    // Server processed the submission (HTTP 200 — action ran successfully)
    expect(response?.status(), "no-JS POST must return HTTP 200 (action processed)").toBe(200)

    // After the round-trip, the form is UNMOUNTED — the success branch of the
    // Client Component renders statically on the no-JS path (Next 16.2.1 +
    // React 19.2.4 thread the action return value back into the no-JS render
    // natively; this is the empirical finding that supersedes Pitfall 3 /
    // Dimension-8's "form is in idle state" prediction).
    await expect(page.locator('form'), "form must be unmounted after no-JS POST — success branch renders server-side, superseding the graceful-degradation fallback predicted in Pitfall 3").toHaveCount(0)

    // Success block renders server-side for the no-JS path too — load-bearing
    // POST-01 satisfaction (in-place success state replaces the form). This is
    // STRONGER than D-16's accepted minimum (which only required the framework
    // process the POST without a mailto fallback or `<noscript>` banner).
    await expect(page.locator('[role="status"]'), "success block must render server-side after no-JS POST — Next 16.2 / React 19.2 framework-native progressive enhancement supersedes the graceful-degradation acceptance carved out in RESEARCH Open Question 1").toHaveCount(1)

    // Sanity: the success block contains the locked POST-02 copy from
    // components/waitlist/waitlist-form.tsx — locks the "You're on the list" H3 +
    // sub-copy against silent regression. POST-03 enumeration defense is preserved
    // because the duplicate flag is never read by the render code.
    await expect(page.locator('[role="status"]'), "success block must contain the canonical POST-02 copy after no-JS POST").toContainText("You're on the list.")

    // Confirm we did not land on a separate redirect URL — the form posted to the
    // current page and the success render landed in-place on `/`. Native HTML
    // form behavior posts to the current URL; the URL hash is reset by the
    // navigation since no-JS form posts strip the hash fragment.
    const finalUrl = new URL(page.url())
    expect(finalUrl.pathname, "URL pathname must remain '/' after no-JS POST (native form posts to current URL)").toBe('/')
  })
})
