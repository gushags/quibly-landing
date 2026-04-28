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
