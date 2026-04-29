import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONSENT_VERSION } from '@/lib/consent-version'

/**
 * CR-01 / WR-04 fix — `lib/consent-version.ts` no longer reads source .tsx
 * files at runtime. The hash is generated at BUILD time by
 * `scripts/generate-consent-version.mjs` into
 * `lib/consent-version.generated.ts`.
 *
 * The previous "is deterministic" test was a tautology (re-importing the same
 * cached ES module always returns the same value). This suite re-runs the
 * canonical hash algorithm against the live privacy + terms source files and
 * asserts equality with the generated constant — catching:
 *   - hash-algorithm drift (e.g., someone swaps sha256 for sha1)
 *   - normalization drift (CRLF -> LF removed)
 *   - generator script not re-run after source policy edits
 */
describe('lib/consent-version (LEGAL-04 / D-12 / D-14)', () => {
  it('exports an 8-character lowercase hex string', () => {
    expect(CONSENT_VERSION).toMatch(/^[0-9a-f]{8}$/)
  })

  it('matches sha256(privacy + terms).slice(0, 8) of the live source files', () => {
    const repoRoot = process.cwd()
    const privacy = readFileSync(join(repoRoot, 'app/(legal)/privacy/page.tsx'), 'utf8').replace(/\r\n/g, '\n')
    const terms = readFileSync(join(repoRoot, 'app/(legal)/terms/page.tsx'), 'utf8').replace(/\r\n/g, '\n')
    const expected = createHash('sha256').update(privacy + terms).digest('hex').slice(0, 8)
    expect(CONSENT_VERSION).toBe(expected)
  })
})
