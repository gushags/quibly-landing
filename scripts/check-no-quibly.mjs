#!/usr/bin/env node
/**
 * Phase 6.5 D-03 / CD-05 — fail the build if any prohibited brand string from
 * the pre-rebrand Quibly identity reappears in source after the Zeremi rename.
 *
 * Mirrors scripts/check-no-trackers.mjs (Phase 5 ANLY-06 pattern).
 *
 * INCLUDE_DIRS: only walks recognised source directories — app/, components/,
 *   emails/, lib/, scripts/, tests/, public/.  A future top-level directory would
 *   need to be added here deliberately, keeping the scope explicit (T-065-05-05).
 *
 * EXCLUDE_DIRS: the .planning/ directory is explicitly excluded because the
 *   phase slug `06.5-quibly-zeremi-rebrand-domain-cutover-inserted-2026-05-28`
 *   contains "quibly" by design (T-065-05-02 mitigation).
 *   The `brand` path segment is excluded so public/brand/zeremi/README.md
 *   (which documents the historical gradient origin) does not false-positive.
 *
 * EXCLUDE_FILES: this script is self-excluded because its DENYLIST constant
 *   contains the very strings it guards against (T-065-05-03 mitigation).
 *   The privacy page is excluded because it contains a legally required
 *   "Name change notice" that explicitly names both Quibly and useQuibly.com
 *   to satisfy GDPR Art-13 transparency obligations.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url))

const DENYLIST_PATTERNS = [
  /Quibly/i,
  /Quibs/i,
  /useQuibly\.com/i,
  /usequibly\.com/i,
  /Quicksand/i,
]

// Only walk these top-level directories. New top-level dirs require explicit
// addition here so the scope stays auditable (T-065-05-05).
const INCLUDE_DIRS = ['app', 'components', 'emails', 'lib', 'scripts', 'tests', 'public']

// Path segments: any file whose absolute path contains one of these segments
// is skipped. This covers nested dirs (e.g. node_modules anywhere in the tree).
const EXCLUDE_DIRS = new Set([
  '.planning',
  'node_modules',
  '.next',
  'dist',
  'playwright-report',
  'coverage',
  '.git',
  'brand',    // public/brand/zeremi/README.md documents gradient history
])

// Relative paths (from repo root) of individual files to skip.
const EXCLUDE_FILES = new Set([
  'scripts/check-no-quibly.mjs',             // this script — self-exclusion (DENYLIST contains the patterns)
  'app/(legal)/privacy/page.tsx',            // legally required Name change notice (GDPR Art-13)
  'tests/branding.test.ts',                  // Wave 0 test that asserts absence of these strings — contains denylist as regex literals
  'tests/e2e/brand-paint.spec.ts',           // Wave 0 e2e test that asserts Quicksand is absent — contains denylist as regex literals
])

// Binary extensions — skip to avoid false matches on decoded bytes.
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.mp4', '.pdf', '.svg',
])

/**
 * Walk a directory recursively, yielding absolute file paths.
 * Skips any path component that matches EXCLUDE_DIRS.
 */
function* walkDir(dir) {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return // directory doesn't exist — skip silently
  }
  for (const entry of entries) {
    // Skip excluded path segments (e.g. node_modules, .next, brand)
    if (EXCLUDE_DIRS.has(entry)) continue
    const full = join(dir, entry)
    let stat
    try {
      stat = statSync(full)
    } catch {
      continue
    }
    if (stat.isDirectory()) {
      yield* walkDir(full)
    } else {
      yield full
    }
  }
}

const violations = []

for (const dirName of INCLUDE_DIRS) {
  const dirPath = join(REPO_ROOT, dirName)
  for (const filePath of walkDir(dirPath)) {
    // Skip binary files
    if (BINARY_EXTENSIONS.has(extname(filePath).toLowerCase())) continue

    // Check against EXCLUDE_FILES (relative path from repo root)
    const relPath = relative(REPO_ROOT, filePath)
    if (EXCLUDE_FILES.has(relPath)) continue

    // Read and scan
    let content
    try {
      content = readFileSync(filePath, 'utf8')
    } catch {
      continue // unreadable — skip
    }

    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      for (const pattern of DENYLIST_PATTERNS) {
        if (pattern.test(line)) {
          violations.push({
            file: relPath,
            pattern: pattern.toString(),
            lineNumber: i + 1,
            lineContent: line,
          })
        }
      }
    }
  }
}

if (violations.length > 0) {
  console.error('Phase 6.5 rebrand violation: prohibited brand strings found in source:')
  for (const v of violations) {
    console.error(`  ${v.file}:${v.lineNumber}: matches ${v.pattern} — ${v.lineContent.trim()}`)
  }
  console.error('\nNo Quibly/Quibs/useQuibly.com/Quicksand strings may appear in source after the Zeremi rebrand.')
  process.exit(1)
}

console.log('Phase 6.5: no prohibited brand strings (Quibly|Quibs|useQuibly.com|Quicksand) in source')
process.exit(0)
