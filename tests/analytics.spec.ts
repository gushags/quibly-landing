import { expect, test } from '@playwright/test'

test.describe('Phase 5 — analytics mounts (ANLY-01..02)', () => {
  test('analytics-mount (ANLY-01): Vercel Analytics attaches', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const hasInsightsScript = (await page.locator('script[src*="/_vercel/insights"]').count()) > 0
    const hasVa = await page.evaluate(() => typeof (window as unknown as { va?: unknown }).va !== 'undefined')
    expect(hasInsightsScript || hasVa).toBeTruthy()
  })

  test('speed-insights-mount (ANLY-02): SpeedInsights attaches', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const hasScript = (await page.locator('script[src*="speed-insights"]').count()) > 0
    const hasSi = await page.evaluate(() => typeof (window as unknown as { si?: unknown }).si !== 'undefined')
    expect(hasScript || hasSi).toBeTruthy()
  })
})
