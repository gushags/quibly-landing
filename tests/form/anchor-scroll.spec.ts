import { expect, test } from "@playwright/test"

/**
 * Phase 3 form — anchor smooth-scroll (D-01 hero, D-02 secondary).
 *
 * The hero CTA and secondary CTA both flip from disabled <button> (Phase 2 D-31)
 * to <a href="#waitlist"> (Phase 3 D-01/D-02). Plan 04 ships the anchor flip;
 * this spec verifies the smooth-scroll behavior brings #waitlist into viewport.
 *
 * CSS scroll-behavior: smooth lives at globals.css:96 (Phase 2 D-08).
 * prefers-reduced-motion: reduce override at globals.css:100-106.
 *
 * Pre-requisite: npm run dev running at :3000.
 */

test.describe("Phase 3 anchor scroll (D-01 hero / D-02 secondary)", () => {
  test.beforeEach(async ({ page }) => {
    // Use a viewport tall enough that the form is below the fold initially.
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto("/")
    // Confirm starting at top of page (hero in viewport, form NOT in viewport)
    await expect(page.locator("h1").first(), "hero h1 must be in viewport at page load").toBeInViewport()
  })

  test("hero CTA click scrolls #waitlist into viewport (D-01)", async ({ page }) => {
    // Hero CTA: <a data-slot="button" data-size="hero" href="#waitlist">Join the waitlist</a>
    // Located via text + data-size to disambiguate from secondary CTA (different copy).
    const heroAnchor = page.locator('[data-slot="button"][data-size="hero"]', { hasText: "Join the waitlist" }).first()
    await heroAnchor.click()

    // After click, the #waitlist section should be in viewport.
    const waitlistSection = page.locator("section#waitlist")
    await expect(waitlistSection, "#waitlist section must be in viewport after hero CTA click").toBeInViewport({ timeout: 2000 })
  })

  test("secondary CTA click scrolls #waitlist into viewport (D-02)", async ({ page }) => {
    // Secondary CTA: <a data-slot="button" data-size="hero" href="#waitlist">Don't miss launch — join the waitlist</a>
    // Scroll to bottom first so the secondary CTA is visible/clickable.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    const secondaryAnchor = page.locator('[data-slot="button"][data-size="hero"]', { hasText: "Don't miss launch" })
    await expect(secondaryAnchor, "secondary CTA should be in viewport after scrolling to bottom").toBeInViewport()
    await secondaryAnchor.click()

    // After click, scroll BACK UP — #waitlist should be in viewport
    const waitlistSection = page.locator("section#waitlist")
    await expect(waitlistSection, "#waitlist section must be in viewport after secondary CTA click (scroll up)").toBeInViewport({ timeout: 2000 })
  })

  test("URL hash updates to #waitlist after anchor click (sanity — confirms native anchor behavior)", async ({ page }) => {
    const heroAnchor = page.locator('[data-slot="button"][data-size="hero"]', { hasText: "Join the waitlist" }).first()
    await heroAnchor.click()
    await expect(page).toHaveURL(/#waitlist$/)
  })
})
