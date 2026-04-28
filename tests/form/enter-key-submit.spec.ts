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
