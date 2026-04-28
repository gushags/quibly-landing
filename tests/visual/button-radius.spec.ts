import { expect, test } from "@playwright/test"

/**
 * Button radius regression guard (concern #6 from cross-AI review).
 *
 * Asserts that every <Button size="hero"> instance rendered on `/` has a
 * computed `border-radius` of exactly `28px`. Catches silent regressions in:
 *   - components/ui/button.tsx (CVA size object — if `hero` row is reordered or removed)
 *   - tailwind-merge (if a future Tailwind upgrade changes conflict resolution)
 *   - the consuming components (if a caller adds className="rounded-full" post-hoc)
 *
 * Phase 3 ships THREE rendered <Button size="hero"> instances on `/`:
 *   1. Hero CTA            (<a href="#waitlist"> via <Button asChild> — D-01)
 *   2. Form submit         (<button type="submit"> in <WaitlistForm> — D-07)
 *   3. Secondary CTA       (<a href="#waitlist"> via <Button asChild> — D-02)
 *
 * Mix of <a> and <button> tags requires a tag-agnostic selector. We use
 * [data-slot="button"][data-size="hero"] (set in components/ui/button.tsx:59-61
 * regardless of asChild value).
 *
 * If a future phase adds a 4th hero pill or removes one, update the count assertion.
 *
 * Pre-requisite: `npm run dev` (or `npm run build && npm run start`) running at :3000.
 */
test.describe("Phase 2 hero button radius (D-06 / 28px lock)", () => {
  test.beforeEach(async ({ page }) => {
    // Use desktop viewport so all three CTAs are reachable; the radius assertion is
    // viewport-independent (border-radius doesn't change at breakpoints in this design).
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto("/")
  })

  test("every <Button size=\"hero\"> instance computes border-radius: 28px", async ({ page }) => {
    // Phase 3 update (Pitfall 9): hero + secondary CTAs are now <a> elements via
    // <Button asChild>; the form's submit is a <button>. The data-slot + data-size
    // attribute selector is tag-agnostic and matches all <Button size="hero">
    // instances regardless of rendered tag (button.tsx:59-61 sets these on all
    // variants). Was: the Phase 2 disabled-button attribute selector.
    const heroButtons = page.locator('[data-slot="button"][data-size="hero"]')

    // Phase 3 ships exactly THREE hero pills on the idle page:
    //   1. Hero CTA            (<a href="#waitlist"> via asChild — D-01)
    //   2. Secondary CTA       (<a href="#waitlist"> via asChild — D-02)
    //   3. Form submit button  (<button type="submit"> in <WaitlistForm> — D-07)
    // Mix of <a> and <button> tags is exactly why we use the data-slot selector.
    const count = await heroButtons.count()
    expect(
      count,
      `Phase 3 should render exactly 3 <Button size="hero"> instances (hero anchor + secondary anchor + form submit); found ${count}`,
    ).toBe(3)

    for (let i = 0; i < count; i++) {
      const button = heroButtons.nth(i)
      const borderRadius = await button.evaluate(
        (el) => window.getComputedStyle(el).borderRadius,
      )
      expect(
        borderRadius,
        `<Button size="hero"> instance #${i} computed border-radius (was '${borderRadius}') must be exactly '28px' per D-06. Common regression values to investigate: '9999px' (rounded-full leaked through tailwind-merge), '22px' (rounded-3xl), '16px' (rounded-2xl), '0px' (the variant didn't apply at all).`,
      ).toBe("28px")
    }
  })

  test("hero CTA bounding-box height >= 48px (MOB-02 indirect — pairs with the 28px radius)", async ({
    page,
  }) => {
    // Sanity check: the 28px radius is paired with py-3.5 (14px top + 14px bottom)
    // and text-base (~24px line-height). Total height should be >= 48px.
    // If a future change drops py-3.5, this catches the resulting <48px regression.
    const heroCta = page.locator('[data-slot="button"][data-size="hero"]').first()
    const box = await heroCta.boundingBox()
    expect(box).not.toBeNull()
    if (!box) return
    expect(
      box.height,
      `Hero CTA bounding-box height (${box.height}) must be >= 48 per MOB-02`,
    ).toBeGreaterThanOrEqual(48)
  })
})
