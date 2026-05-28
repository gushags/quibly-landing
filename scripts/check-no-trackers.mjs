#!/usr/bin/env node
/**
 * Phase 5 ANLY-06 / T-05-04 — fail the build if any prohibited tracking SDK
 * is added to package.json dependencies or devDependencies.
 *
 * Allowed analytics: @vercel/analytics, @vercel/speed-insights (cookieless).
 * Prohibited: anything that sets cookies or requires a consent banner.
 *
 * WR-06 fix: the previous matcher (`dep === banned || dep.startsWith(banned + '/') || dep.endsWith('/' + banned)`)
 * had gaps. It would catch `@amplitude/analytics` exactly but not
 * `@amplitude/analytics-browser` (the actual install name on npm), and it
 * would not catch arbitrary Segment/FullStory variants that share the scope
 * but use different package suffixes. Switch to regex-based scope/prefix
 * matching plus a small set of substring patterns for keyword-based bans
 * (pixel, hotjar, clarity, etc.). Each pattern is commented so a reviewer
 * can verify intent at a glance.
 */
import { readFileSync } from 'node:fs'

const DENYLIST_PATTERNS = [
  // Google Analytics / Tag Manager
  /^gtag(\b|-|\/|$)/i,
  /^@?google-tag-manager/i,
  /^react-ga4?$/i,
  /^@gtag\//i,
  /\bgtm\b/i,
  /^ga4$/i,

  // PostHog
  /^posthog(-js|-node)?$/i,

  // Microsoft Clarity
  /clarity-js/i,
  /microsoft-clarity/i,
  /^@microsoft\/clarity/i,

  // Hotjar
  /hotjar/i,

  // Meta / Facebook pixel
  /meta-pixel/i,
  /^fbevents$/i,
  /^@facebook\/sdk/i,
  /react-facebook-pixel/i,
  /\bpixel\b/i,

  // LinkedIn
  /linkedin-insight/i,

  // Mixpanel
  /^mixpanel(-browser)?$/i,

  // Amplitude (any package under the @amplitude scope)
  /^@amplitude\//i,
  /^amplitude(\b|-|\/|$)/i,

  // Segment (any package under the @segment scope)
  /^@segment\//i,
  /^segment(\b|-|\/|$)/i,

  // FullStory
  /^@fullstory\//i,
  /^fullstory(\b|-|\/|$)/i,
]

// Allowlist suppresses false positives in the patterns above. Add a comment
// explaining why each entry is exempted.
const ALLOWLIST = [
  // (none currently — @vercel/analytics and @vercel/speed-insights do not
  // overlap with any pattern above.)
]

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const allDeps = Object.keys({
  ...pkg.dependencies,
  ...pkg.devDependencies,
  ...pkg.peerDependencies,
})

const violations = allDeps.filter((dep) => {
  if (ALLOWLIST.includes(dep)) return false
  return DENYLIST_PATTERNS.some((re) => re.test(dep))
})

if (violations.length > 0) {
  console.error('ANLY-06 violation: prohibited tracking SDKs found in package.json:')
  for (const v of violations) console.error('  - ' + v)
  console.error('\nZeremi Landing is cookieless by design. Use @vercel/analytics + @vercel/speed-insights only.')
  process.exit(1)
}

console.log('ANLY-06: no prohibited tracking SDKs in package.json')
process.exit(0)
