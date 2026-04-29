import 'server-only'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Phase 5 D-12 / D-14 — content-hash consent_version.
 *
 * Reads `app/(legal)/privacy/page.tsx` + `app/(legal)/terms/page.tsx` at module
 * load, normalizes CRLF→LF (Pitfall 1: hash must be deterministic across
 * Windows dev machines and Vercel Linux build), computes SHA-256, and exports
 * the first 8 hex chars. Bumps ONLY when policy text changes.
 *
 * Used by app/actions/join-waitlist.ts to stamp every Resend contact's
 * `properties.consent_version` at signup time (STORE-04 contract continuation
 * from Phase 4 D-CD-03).
 */
function readAndNormalize(filePath: string): string {
  const raw = readFileSync(join(process.cwd(), filePath), 'utf8')
  return raw.replace(/\r\n/g, '\n')
}

const privacyContent = readAndNormalize('app/(legal)/privacy/page.tsx')
const termsContent = readAndNormalize('app/(legal)/terms/page.tsx')

export const CONSENT_VERSION = createHash('sha256')
  .update(privacyContent + termsContent)
  .digest('hex')
  .slice(0, 8)
