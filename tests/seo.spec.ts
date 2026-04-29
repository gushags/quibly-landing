import { expect, test } from '@playwright/test'

test.describe('Phase 5 — SEO surface (SEO-01..08)', () => {
  test('title-description (SEO-01): home <title> and meta description present', async ({ page }) => {
    await page.goto('/')
    expect(await page.title()).toMatch(/Quibly/i)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/)
  })

  test('og-tags (SEO-02): og:title, og:description, og:image, og:url, og:type present', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1)
    await expect(page.locator('meta[property="og:description"]')).toHaveCount(1)
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1)
    await expect(page.locator('meta[property="og:url"]')).toHaveCount(1)
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website')
  })

  test('twitter-card (SEO-03): twitter:card summary_large_image present', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
  })

  test('og-image-200 (SEO-04): /opengraph-image returns 200 PNG', async ({ request }) => {
    const response = await request.get('/opengraph-image')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('image/png')
  })

  test('favicon (SEO-05): /favicon.ico and /apple-icon return 200', async ({ request }) => {
    const fav = await request.get('/favicon.ico')
    expect([200, 304]).toContain(fav.status())
    const apple = await request.get('/apple-icon')
    expect([200, 304]).toContain(apple.status())
  })

  test('robots (SEO-06): /robots.txt lists named AI crawlers Allow', async ({ request }) => {
    const r = await request.get('/robots.txt')
    expect(r.status()).toBe(200)
    const text = await r.text()
    expect(text).toContain('GPTBot')
    expect(text).toContain('ClaudeBot')
    expect(text).toContain('Google-Extended')
    expect(text).toContain('PerplexityBot')
    expect(text).toContain('CCBot')
    expect(text).toMatch(/Sitemap:\s*https:\/\/useQuibly\.com\/sitemap\.xml/i)
  })

  test('sitemap (SEO-07): /sitemap.xml lists 3 URLs', async ({ request }) => {
    const s = await request.get('/sitemap.xml')
    expect(s.status()).toBe(200)
    const text = await s.text()
    expect(text).toContain('https://useQuibly.com')
    expect(text).toContain('https://useQuibly.com/privacy')
    expect(text).toContain('https://useQuibly.com/terms')
  })

  test('json-ld (SEO-08): Organization + WebSite scripts parse without error', async ({ page }) => {
    await page.goto('/')
    const scripts = page.locator('script[type="application/ld+json"]')
    await expect(scripts).toHaveCount(2)
    const contents = await scripts.allTextContents()
    const parsed = contents.map(c => JSON.parse(c))
    const types = parsed.map(p => p['@type'])
    expect(types).toContain('Organization')
    expect(types).toContain('WebSite')
  })
})
