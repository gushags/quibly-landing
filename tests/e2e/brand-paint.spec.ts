/**
 * Phase 6.5 Wave 0 — brand-paint e2e guard (VALIDATION.md Wave 0 requirement).
 *
 * Asserts:
 *   1. Bree Serif font is requested (network) and Quicksand is NOT
 *   2. The gradient Z mark (zeremi-icon.tsx SVG, viewBox="0 0 56 88") is visible in hero
 *   3. No Quibly/Quibs/useQuibly.com brand strings appear in the rendered DOM
 *
 * Runs against a live Next.js server (managed by Playwright's webServer config).
 */

import { test, expect } from '@playwright/test'

test.describe('Phase 6.5 — brand paint (Zeremi identity on page load)', () => {
  test('Bree Serif loads in network panel; Quicksand does NOT', async ({ page }) => {
    const urls: string[] = []
    page.on('request', (req) => urls.push(req.url()))

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // At least one Bree Serif font request (Google Fonts CSS or WOFF/WOFF2)
    const breeRequest = urls.find((url) => /bree.serif/i.test(url) || /Bree\+Serif/i.test(url) || /BreeSerif/i.test(url))
    expect(breeRequest, 'Expected a Bree Serif font network request').toBeTruthy()

    // No Quicksand font request
    const quicksandRequest = urls.find((url) => /quicksand/i.test(url))
    expect(quicksandRequest, 'Quicksand font request found — should be absent post-rebrand').toBeUndefined()
  })

  test('h1 heading and gradient Z mark SVG are visible in hero', async ({ page }) => {
    await page.goto('/')

    // H1 is visible (LCP-as-H1 rule from Phase 2 D-03)
    await expect(page.locator('h1').first()).toBeVisible()

    // Zeremi icon SVG with viewBox="0 0 56 88" is visible
    await expect(page.locator('svg[viewBox="0 0 56 88"]').first()).toBeVisible()
  })

  test('no Quibly/Quibs/useQuibly.com brand strings in rendered DOM', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const html = await page.content()
    expect(html).not.toMatch(/Quibly|Quibs|useQuibly\.com|usequibly\.com/i)
  })
})
