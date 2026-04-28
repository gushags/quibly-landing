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
