/**
 * Phase 6.5 Wave 0 — branding guard (VALIDATION.md Wave 0 requirement).
 *
 * Two test groups:
 *   1. Absence: source files contain no Quibly/Quibs/useQuibly.com/usequibly.com/Quicksand
 *   2. Presence: Zeremi / Bree Serif / zeremi.app strings are actually in the right files
 *
 * File-based (readFileSync) — fast, stable, no RSC render dependency. Catches
 * copy-paste regressions that the CI grep guard (scripts/check-no-quibly.mjs) would
 * also catch; here we get the Vitest output in a human-readable format during dev.
 *
 * The privacy page is intentionally excluded from the ABSENCE group — it contains a
 * legally required "Name change notice" paragraph that references both brand names.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()

const DENYLIST = /Quibly|Quibs|useQuibly\.com|usequibly\.com|Quicksand/i

describe('Phase 6.5 — brand absence (no Quibly/Quibs/useQuibly.com/Quicksand)', () => {
  it('app/layout.tsx contains no old brand strings', () => {
    const content = readFileSync(join(ROOT, 'app/layout.tsx'), 'utf8')
    expect(content).not.toMatch(DENYLIST)
  })

  it('app/page.tsx contains no old brand strings', () => {
    const content = readFileSync(join(ROOT, 'app/page.tsx'), 'utf8')
    expect(content).not.toMatch(DENYLIST)
  })

  it('app/sitemap.ts contains no old brand strings', () => {
    const content = readFileSync(join(ROOT, 'app/sitemap.ts'), 'utf8')
    expect(content).not.toMatch(DENYLIST)
  })

  it('app/robots.ts contains no old brand strings', () => {
    const content = readFileSync(join(ROOT, 'app/robots.ts'), 'utf8')
    expect(content).not.toMatch(DENYLIST)
  })

  it('app/(legal)/terms/page.tsx contains no old brand strings', () => {
    const content = readFileSync(join(ROOT, 'app/(legal)/terms/page.tsx'), 'utf8')
    expect(content).not.toMatch(DENYLIST)
  })

  it('components/sections/hero.tsx contains no old brand strings', () => {
    const content = readFileSync(join(ROOT, 'components/sections/hero.tsx'), 'utf8')
    expect(content).not.toMatch(DENYLIST)
  })

  it('components/sections/footer.tsx contains no old brand strings', () => {
    const content = readFileSync(join(ROOT, 'components/sections/footer.tsx'), 'utf8')
    expect(content).not.toMatch(DENYLIST)
  })

  it('components/sections/waitlist-form-section.tsx contains no old brand strings', () => {
    const content = readFileSync(join(ROOT, 'components/sections/waitlist-form-section.tsx'), 'utf8')
    expect(content).not.toMatch(DENYLIST)
  })

  it('components/sections/why-zeremi.tsx contains no old brand strings', () => {
    const content = readFileSync(join(ROOT, 'components/sections/why-zeremi.tsx'), 'utf8')
    expect(content).not.toMatch(DENYLIST)
  })

  it('components/sections/hero-mascot.tsx contains no old brand strings', () => {
    const content = readFileSync(join(ROOT, 'components/sections/hero-mascot.tsx'), 'utf8')
    expect(content).not.toMatch(DENYLIST)
  })

  it('components/zeremi/zeremi-icon.tsx contains no old brand strings', () => {
    const content = readFileSync(join(ROOT, 'components/zeremi/zeremi-icon.tsx'), 'utf8')
    expect(content).not.toMatch(DENYLIST)
  })
})

describe('Phase 6.5 — brand presence (Zeremi / Bree Serif / zeremi.app confirmed)', () => {
  it('app/layout.tsx uses Bree_Serif import', () => {
    const content = readFileSync(join(ROOT, 'app/layout.tsx'), 'utf8')
    expect(content).toMatch(/Bree_Serif/)
  })

  it('app/layout.tsx references zeremi.app', () => {
    const content = readFileSync(join(ROOT, 'app/layout.tsx'), 'utf8')
    expect(content).toMatch(/zeremi\.app/)
  })

  it('app/sitemap.ts references zeremi.app', () => {
    const content = readFileSync(join(ROOT, 'app/sitemap.ts'), 'utf8')
    expect(content).toMatch(/zeremi\.app/)
  })

  it('app/(legal)/privacy/page.tsx has Name change notice', () => {
    const content = readFileSync(join(ROOT, 'app/(legal)/privacy/page.tsx'), 'utf8')
    expect(content).toMatch(/Name change notice/)
  })

  it('app/(legal)/privacy/page.tsx references zeremi.app', () => {
    const content = readFileSync(join(ROOT, 'app/(legal)/privacy/page.tsx'), 'utf8')
    expect(content).toMatch(/zeremi\.app/)
  })

  it('components/zeremi/zeremi-icon.tsx has correct viewBox', () => {
    const content = readFileSync(join(ROOT, 'components/zeremi/zeremi-icon.tsx'), 'utf8')
    expect(content).toMatch(/viewBox="0 0 56 88"/)
  })
})
