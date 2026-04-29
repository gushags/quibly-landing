import { expect, test } from '@playwright/test'

test.describe('Phase 5 — legal pages (LEGAL-01..04, 06..08)', () => {
  test('privacy 200 (LEGAL-01)', async ({ page }) => {
    const response = await page.goto('/privacy')
    expect(response?.status()).toBe(200)
    await expect(page.locator('h1')).toContainText('Privacy Policy')
  })

  test('terms 200 (LEGAL-02)', async ({ page }) => {
    const response = await page.goto('/terms')
    expect(response?.status()).toBe(200)
    await expect(page.locator('h1')).toContainText('Terms')
  })

  test('processors named — Vercel and Resend (LEGAL-03)', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page.locator('body')).toContainText('Vercel')
    await expect(page.locator('body')).toContainText('Resend')
  })

  test('gdpr Article 6(1)(a) consent + retention (LEGAL-04)', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page.locator('body')).toContainText('consent')
    await expect(page.locator('body')).toContainText('Article 6')
    await expect(page.locator('body')).toContainText('launches plus 12 months')
  })

  test('consent-copy below form button (LEGAL-06)', async ({ page }) => {
    await page.goto('/')
    const copy = page.locator('[data-testid="consent-copy"]')
    await expect(copy).toBeVisible()
    await expect(copy).toContainText('By joining')
    await expect(copy.locator('a[href="/privacy"]')).toBeVisible()
    await expect(copy.locator('a[href="/terms"]')).toBeVisible()
  })

  test('no spam reassurance copy (LEGAL-07)', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-testid="reassurance-copy"]')).toContainText('No spam')
  })

  test('dsar mailto privacy@useQuibly.com (LEGAL-08)', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page.locator('a[href="mailto:privacy@useQuibly.com"]')).toBeVisible()
  })
})
