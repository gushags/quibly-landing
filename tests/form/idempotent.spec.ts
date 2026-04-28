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
 * SPAM-02 time-trap bypass: Plan 02's action silently returns success when
 * submit happens within 2000ms of the server-rendered `renderedAt` (D-15).
 * Without bypass, the slow@ branch's 1500ms delay never fires, the button
 * never enters a sustained pending state, and POST-04 cannot be observed.
 * We zero the hidden `renderedAt` input so the slow branch actually runs.
 *
 * Pre-requisite: `npm run dev` running at :3000.
 */

test.describe("Phase 3 form — idempotent (POST-04)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto("/#waitlist")
  })

  test("rapid double-click during pending state results in one Server Action dispatch (POST-04)", async ({ page }) => {
    // CR-04: count Server Action POSTs to the page route. The Next 16 Server
    // Action protocol POSTs to the same URL (here `/`) with a special
    // `Next-Action` header; counting POSTs to `/` is the load-bearing signal
    // that exactly one action dispatched despite the rapid double-click.
    let actionPostCount = 0
    page.on('request', (req) => {
      if (req.method() !== 'POST') return
      const url = new URL(req.url())
      if (url.pathname === '/') actionPostCount += 1
    })

    await page.fill('input[name="email"]', 'slow@example.com')
    // SPAM-02 time-trap bypass — see file JSDoc.
    await page.evaluate(() => {
      const trap = document.querySelector('input[name="renderedAt"]') as HTMLInputElement | null
      if (trap) trap.value = "0"
    })

    const submit = page.locator('button[type="submit"]')

    // First click — starts the pending state (1500ms delay branch).
    const firstClick = submit.click()

    // Wait for the button to become disabled (pending=true)
    await expect(submit).toBeDisabled({ timeout: 1000 })

    // Second rapid click — REAL click, not `trial: true`. We use `force: true`
    // to bypass Playwright's actionability check (the disabled button) so the
    // click is genuinely dispatched at the DOM. The POST-04 contract is that
    // the disabled prop blocks the form submission — verified below by the
    // network request count, not by whether the click "succeeded".
    let secondClickError: Error | null = null
    try {
      await submit.click({ force: true, timeout: 500, noWaitAfter: true })
    } catch (e) {
      secondClickError = e as Error
    }

    // Wait for the first action to complete (~1500ms total)
    await firstClick

    // Final state: success block visible (one and only one success transition)
    const status = page.locator('[role="status"]')
    await expect(status, "success block must render after rapid double-submit (POST-04)").toBeVisible({ timeout: 3000 })

    // LOAD-BEARING: exactly one Server Action POST despite the double-click.
    // If a regression removes `disabled={pending}` from the button, the second
    // click would queue a second action and this assertion fails.
    expect(
      actionPostCount,
      "POST-04: only one Server Action dispatch despite rapid double-click",
    ).toBe(1)

    // Inline error must NOT be present (we submitted a valid stub email)
    await expect(page.locator('p[role="alert"]')).toHaveCount(0)

    // Sanity log — secondClickError is informational, not load-bearing.
    console.log(`POST-04 outcome: actionPostCount=${actionPostCount}, secondClickError=${secondClickError?.message ?? 'none'}`)
  })
})
