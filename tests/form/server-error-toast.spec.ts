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
 * SPAM-02 time-trap bypass: Plan 02's action returns silent success when the
 * client submits within 2000ms of the server-rendered `renderedAt` timestamp
 * (D-15). Playwright submits in tens of milliseconds, so without bypass the
 * action would short-circuit to success and never reach the err@ stub branch.
 * We zero the hidden `renderedAt` input so `if (renderedAt > 0 && ...)` skips.
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
    // SPAM-02 time-trap bypass — see file JSDoc.
    await page.evaluate(() => {
      const trap = document.querySelector('input[name="renderedAt"]') as HTMLInputElement | null
      if (trap) trap.value = "0"
    })
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
