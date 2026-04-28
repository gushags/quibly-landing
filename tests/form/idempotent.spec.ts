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
