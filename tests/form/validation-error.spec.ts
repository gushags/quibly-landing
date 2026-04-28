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
 * SPAM-02 time-trap bypass: Plan 02's action returns silent success when the
 * client submits within 2000ms of the server-rendered `renderedAt` timestamp
 * (D-15 silent-success on bot signal). Playwright fires submits in tens of
 * milliseconds, so the time-trap would route every fast test submit to
 * `{ status: 'success' }` — making this spec's "inline error appears" assertion
 * silently impossible. Each test below sets `input[name="renderedAt"]` to "0"
 * before submitting; the action skips the time-trap when `renderedAt === 0`
 * (`if (renderedAt > 0 && Date.now() - renderedAt < 2000)`), letting Zod's
 * validation surface the error this spec is supposed to verify.
 *
 * Pre-requisite: `npm run dev` running at :3000.
 */

/**
 * Bypass the SPAM-02 time-trap by zeroing the hidden `renderedAt` input.
 * The action evaluates `if (renderedAt > 0 && Date.now() - renderedAt < 2000)`,
 * so a value of "0" disables the trap deterministically.
 */
async function bypassTimeTrap(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    const trap = document.querySelector('input[name="renderedAt"]') as HTMLInputElement | null
    if (trap) trap.value = "0"
  })
}

test.describe("Phase 3 form — validation error (FORM-03 / FORM-06)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto("/#waitlist")
  })

  test("invalid email shows inline error AND preserves typed value (FORM-06 — Pitfall 1)", async ({ page }) => {
    const emailInput = page.locator('input[name="email"]')
    await emailInput.fill('bad-email')
    await bypassTimeTrap(page)
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

  test("empty/whitespace email submission shows inline error (FORM-03)", async ({ page }) => {
    // FORM-03 source-of-truth check: even a whitespace-only email must trip the
    // server-side Zod path (HTML5 `required` won't catch ' ' because the field
    // is technically populated). The action's `z.email()` schema must reject it.
    //
    // We use whitespace rather than truly empty because:
    //   1. Empty-string + Server Action FormData serialization can omit the
    //      field entirely on some Next.js versions, causing the action to see
    //      no `email` key at all (which is still a Zod failure, but routes
    //      through a different code path than the documented FORM-03 invalid-
    //      email surface).
    //   2. Whitespace tests the same FORM-03 invariant (server-side validation
    //      is the source of truth) without triggering Server Action FormData
    //      serialization edge-cases.
    const emailInput = page.locator('input[name="email"]')
    await emailInput.fill('   ')
    await bypassTimeTrap(page)
    await page.click('button[type="submit"]')

    const error = page.locator('p[role="alert"]')
    await expect(error, "whitespace-only email must trigger Zod-validated inline error (FORM-03)").toBeVisible({ timeout: 5000 })
  })
})
