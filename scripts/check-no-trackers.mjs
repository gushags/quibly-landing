#!/usr/bin/env node
/**
 * Phase 5 ANLY-06 / T-05-04 — fail the build if any prohibited tracking SDK
 * is added to package.json dependencies or devDependencies.
 *
 * Allowed analytics: @vercel/analytics, @vercel/speed-insights (cookieless).
 * Prohibited: anything that sets cookies or requires a consent banner.
 */
import { readFileSync } from 'node:fs'

const DENYLIST = [
  'ga4', '@gtag', 'gtag', 'react-ga', 'react-ga4',
  'posthog', 'posthog-js', 'posthog-node',
  'gtm', '@google-tag-manager',
  'clarity-js', 'microsoft-clarity', '@microsoft/clarity',
  'hotjar', 'react-hotjar',
  'meta-pixel', 'fbevents', '@facebook/sdk', 'react-facebook-pixel',
  'linkedin-insight',
  'mixpanel', 'mixpanel-browser',
  'amplitude', '@amplitude/analytics',
  'segment', '@segment/analytics-next',
  'fullstory', '@fullstory/browser',
]

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const allDeps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies })

const violations = allDeps.filter(dep =>
  DENYLIST.some(banned => dep === banned || dep.startsWith(banned + '/') || dep.endsWith('/' + banned))
)

if (violations.length > 0) {
  console.error('ANLY-06 violation: prohibited tracking SDKs found in package.json:')
  for (const v of violations) console.error('  - ' + v)
  console.error('\nQuibly Landing is cookieless by design. Use @vercel/analytics + @vercel/speed-insights only.')
  process.exit(1)
}

console.log('ANLY-06: no prohibited tracking SDKs in package.json')
process.exit(0)
