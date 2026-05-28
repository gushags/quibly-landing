import type { MetadataRoute } from 'next'

const BASE_URL = 'https://zeremi.app'

/**
 * Phase 5 SEO-07 — sitemap with 3 entries: /, /privacy, /terms.
 * Absolute URLs required (metadataBase does NOT prefix sitemap URLs — RESEARCH §Sitemap Conventions).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL,              lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/terms`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]
}
