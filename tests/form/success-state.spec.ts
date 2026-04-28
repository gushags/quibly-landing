import { expect, test } from "@playwright/test"

/**
 * Phase 4 form — success state (POST-01, POST-02, POST-03).
 *
 * POST-01 in-place: form unmounts, success block mounts in same DOM region — no full-page nav.
 *   Atomic enforcement: the first test asserts BOTH input-unmounted AND same-URL within
 *   ONE test block. Without the same-URL check inside this block, `toHaveCount(0)` would
 *   pass even on a navigation away from `/` (a POST-01 violation). The third test below
 *   becomes a redundant safeguard rather than the only enforcement of POST-01.
 * POST-02 verbatim: success body must contain the exact mandated string.
 * POST-03 enumeration defense: a fresh signup renders a success block that contains NO
 *   `data-duplicate` attribute and NO "duplicate"/"already" text — these UI invariants
 *   hold REGARDLESS of whether the contact already exists in the audience. Structural
 *   identity between fresh and dup paths is enforced by the action body NOT propagating
 *   any duplicate signal to the UI.
 *
 * Phase 4 migration note (CD-07): Phase 3 used a stub-trigger email to force the
 * duplicate code path on the stub action. That stub branch was deleted when Plan 05
 * swapped the action body to the real Resend pipeline; duplicate detection now happens
 * server-side via `resend.contacts.create` against the preview audience. POST-03's UI
 * invariant is verified here on a single fresh signup — the duplicate branch itself is
 * exercised at runtime by the real Resend action, and the manual inbox checkpoint
 * (Tasks 5–7 in plan 04-07) verifies the duplicate path against the live preview
 * audience end-to-end.
 *
 * SPAM-02 time-trap bypass: Plan 05's action silently returns
 * `{ status: 'success' }` when submit happens within 2000ms of the
 * server-rendered `renderedAt` (D-15). Without bypass, every fast Playwright
 * submit short-circuits to that silent-success path BEFORE reaching the
 * Resend pipeline — meaning the success block would render for the wrong
 * reason (the audience-write branch never ran). We zero the hidden
 * `renderedAt` input so the Resend pipeline actually fires; POST-03 is
 * then validated against the real audience-write render.
 *
 * Pre-requisite: `npm run dev` running at :3000 with preview Resend audience configured.
 */

const POST_02_VERBATIM = "Check your inbox (and spam folder) for confirmation."

/** Bypass the SPAM-02 time-trap by zeroing the hidden `renderedAt` input. */
async function bypassTimeTrap(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    const trap = document.querySelector('input[name="renderedAt"]') as HTMLInputElement | null
    if (trap) trap.value = "0"
  })
}

test.describe("Phase 4 form — success state (POST-01 / POST-02 / POST-03)", () => {
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
    await bypassTimeTrap(page)
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

  test("submitting an email renders the structurally-identical success block (POST-03 enumeration defense)", async ({ page }) => {
    // Phase 4: dup detection happens server-side via resend.contacts.create.
    // POST-03's UI invariant is: success block contains no 'duplicate'/'already' text
    // and no data-duplicate attribute, REGARDLESS of whether the contact existed.
    // The Phase 3 test used a stub-trigger email to force the duplicate code path; in Phase 4
    // the action body's duplicate handling is internal-only (track flag, no UI change).
    // We assert the UI invariant on a single fresh signup — POST-03's defense in depth
    // is that the action does NOT propagate a duplicate signal to the UI.
    await page.fill('input[name="email"]', `e2e-post03-${Date.now()}@example.com`)
    await bypassTimeTrap(page)
    await page.click('button[type="submit"]')

    const status = page.locator('[role="status"]')
    await expect(status).toBeVisible({ timeout: 10000 })

    // POST-03: NO data-duplicate attribute anywhere in the rendered tree
    const dupAttrs = await page.evaluate(() => {
      const all = document.querySelectorAll('*[data-duplicate]')
      return all.length
    })
    expect(dupAttrs, "POST-03: NO data-duplicate attribute may be present in the DOM").toBe(0)

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
    await bypassTimeTrap(page)
    await page.click('button[type="submit"]')
    await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 5000 })
    // Either same URL or same URL + #waitlist — both are NOT navigation away
    const endURL = page.url()
    expect(endURL.replace(/#.*$/, ""), "URL pathname must not change after submit (POST-01 redundant safeguard)").toBe(startURL.replace(/#.*$/, ""))
  })
})
