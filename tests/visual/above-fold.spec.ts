import { expect, test } from "@playwright/test"

/**
 * Above-the-fold composition assertion at 320×568 (concern #3 from cross-AI review).
 *
 * Validates:
 *   1. The hero <h1>, sub-headline <p>, hero CTA pill, and microcopy <p>
 *      all have a bounding-box `y + height <= 568` — i.e. fit above the fold.
 *   2. The hero <h1>'s painted area is GREATER than the sub-headline <p>'s painted area
 *      at 320px (defends LCP-as-H1 against the painted-area heuristic — concern #2).
 *   3. Footer <a> link bounding-box height is >= 48px (MOB-02 / D-32 — concern #4).
 *   4. Footer <a> links surface a visible focus ring on Tab navigation (concern #10).
 *
 * Phase 3 update (Plan 04, Rule 3 fix — Pitfall 9): hero CTA is now an
 * <a href="#waitlist"> via <Button asChild> (D-01). The selector
 * [data-slot="button"][data-size="hero"]:first switches to the tag-agnostic
 * data-attribute selector + .first() to pick the hero pill in document order.
 *
 * Pre-requisite: `npm run dev` (or `npm run build && npm run start`) running at :3000.
 */
test.describe("Phase 2 above-fold + tap-target invariants", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto("/")
  })

  test("hero essentials fit above the 320×568 fold", async ({ page }) => {
    const h1 = page.locator("h1").first()
    const subHeadline = page.locator("section p").first() // first <p> inside any <section> = sub-headline
    const cta = page.locator('[data-slot="button"][data-size="hero"]').first()
    const microcopy = page.locator("text=Launching Summer 2026")

    for (const [name, locator] of [
      ["h1", h1],
      ["subHeadline", subHeadline],
      ["cta", cta],
      ["microcopy", microcopy],
    ] as const) {
      const box = await locator.boundingBox()
      expect(box, `${name} should be visible`).not.toBeNull()
      if (!box) continue
      expect(
        box.y + box.height,
        `${name} y+height (${box.y + box.height}) must be <= 568 to fit above fold`,
      ).toBeLessThanOrEqual(568)
    }
  })

  test("hero <h1> painted area exceeds sub-headline painted area at 320px (LCP defense)", async ({
    page,
  }) => {
    const h1 = page.locator("h1").first()
    const subHeadline = page.locator("section p").first()

    const h1Box = await h1.boundingBox()
    const subBox = await subHeadline.boundingBox()
    expect(h1Box).not.toBeNull()
    expect(subBox).not.toBeNull()
    if (!h1Box || !subBox) return

    const h1Area = h1Box.width * h1Box.height
    const subArea = subBox.width * subBox.height
    expect(
      h1Area,
      `H1 painted area (${h1Area}px²) must exceed sub-headline painted area (${subArea}px²) so Lighthouse picks the H1 as LCP, not the <p>`,
    ).toBeGreaterThan(subArea)
  })

  test("footer link tap targets compute to >= 48px height (MOB-02 / D-32)", async ({ page }) => {
    const privacy = page.locator('footer a[href="/privacy"]')
    const terms = page.locator('footer a[href="/terms"]')

    for (const [name, locator] of [
      ["privacy", privacy],
      ["terms", terms],
    ] as const) {
      const box = await locator.boundingBox()
      expect(box, `${name} link should be visible`).not.toBeNull()
      if (!box) continue
      expect(
        box.height,
        `${name} link bounding-box height (${box.height}) must be >= 48 per MOB-02`,
      ).toBeGreaterThanOrEqual(48)
    }
  })

  test("footer links expose a visible focus ring on keyboard navigation (concern #10)", async ({
    page,
  }) => {
    // Tab through to the first footer link.
    const privacy = page.locator('footer a[href="/privacy"]')
    await privacy.focus()

    // Assert the focus-visible outline class compiles to a non-zero outline-width
    // when focused via keyboard. We read computed styles directly.
    const outlineWidth = await privacy.evaluate((el) => {
      const cs = window.getComputedStyle(el)
      return cs.outlineWidth
    })
    expect(
      outlineWidth,
      `focus-visible outline-width on /privacy link must be non-zero (was '${outlineWidth}')`,
    ).not.toBe("0px")
  })
})
