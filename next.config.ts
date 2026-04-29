// Phase 6 D-10/D-11; HSTS max-age=300 per DEPLOY-06 (NOT preload — keeps cutover reversible).
// Source pattern '/(.*)' covers every route including /robots.txt, /sitemap.xml, /opengraph-image,
// /icon, /apple-icon, /unsubscribe, /privacy, /terms, /api/*.
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // DEPLOY-06 / D-11: max-age=300 ONLY — no includeSubDomains, no preload.
          // Short max-age preserves cutover reversibility to marketing-app within 5 min.
          { key: 'Strict-Transport-Security', value: 'max-age=300' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
        ],
      },
    ]
  },
}

export default nextConfig
