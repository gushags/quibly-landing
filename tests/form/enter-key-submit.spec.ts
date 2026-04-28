import { expect, test } from "@playwright/test"

/**
 * Phase 3 form — Enter-key submit (FORM-07).
 *
 * FORM-07: native <form> element submits when Enter is pressed in a single
 * text-style input. No JS needed; the browser handles it.
 *
 * SPAM-02 time-trap bypass: Plan 02's action silently returns success when
 * submit fires within 2000ms of `renderedAt` (D-15). The Enter-key path
 * exercises the same action under the same fast-submit window, so we apply
 * the same bypass for parity. (FORM-07 doesn't strictly need the bypass —
 * the success render is identical between the silent-success and default
 * branches — but bypassing keeps the test honest.)
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
    // SPAM-02 time-trap bypass — see file JSDoc.
    await page.evaluate(() => {
      const trap = document.querySelector('input[name="renderedAt"]') as HTMLInputElement | null
      if (trap) trap.value = "0"
    })
    await emailInput.press('Enter')

    // Success block renders (FORM-07 → POST-01 → POST-02 chain)
    const status = page.locator('[role="status"]')
    await expect(status, "Enter-key submit should trigger the same success path as button click").toBeVisible({ timeout: 5000 })
    await expect(status).toContainText("Check your inbox (and spam folder) for confirmation.")
  })
})
