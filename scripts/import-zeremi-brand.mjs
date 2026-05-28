// scripts/import-zeremi-brand.mjs
//
// Copies the Zeremi brand assets from the sibling marketing-app repo into
// this repo's public/brand/zeremi/ directory. Re-runnable (idempotent) — safe
// to execute multiple times without side effects.
//
// Source: /Users/jeff/repos/marketing-app/public/brand/zeremi/
// Output: public/brand/zeremi/ (relative to this repo root)
//
// Usage:
//   node scripts/import-zeremi-brand.mjs
//   npm run import:brand

import { copyFile, mkdir, readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

const SRC_DIR = '/Users/jeff/repos/marketing-app/public/brand/zeremi'
const OUT_DIR = join(process.cwd(), 'public/brand/zeremi')

/**
 * Recursively copy all files from srcDir to destDir.
 * Creates destination subdirectories as needed.
 */
async function copyDir(srcDir, destDir) {
  await mkdir(destDir, { recursive: true })

  const entries = await readdir(srcDir, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = join(srcDir, entry.name)
    const destPath = join(destDir, entry.name)

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath)
    } else if (entry.isFile()) {
      await copyFile(srcPath, destPath)
      const s = await stat(destPath)
      console.log(`  copied: ${destPath.replace(process.cwd() + '/', '')} (${s.size} bytes)`)
    }
  }
}

async function main() {
  console.log(`Importing Zeremi brand assets from:\n  ${SRC_DIR}\ninto:\n  ${OUT_DIR}\n`)

  // Verify source exists
  try {
    await stat(SRC_DIR)
  } catch {
    console.error(`ERROR: source directory not found: ${SRC_DIR}`)
    console.error('Ensure the marketing-app repo is available at /Users/jeff/repos/marketing-app')
    process.exit(1)
  }

  // Copy src/ subdirectory (SVG sources)
  console.log('Copying src/ (SVG sources)...')
  await copyDir(join(SRC_DIR, 'src'), join(OUT_DIR, 'src'))

  // Copy png/ subdirectory (PNG exports)
  console.log('\nCopying png/ (PNG exports)...')
  await copyDir(join(SRC_DIR, 'png'), join(OUT_DIR, 'png'))

  // Copy top-level README.md
  console.log('\nCopying README.md...')
  await copyFile(join(SRC_DIR, 'README.md'), join(OUT_DIR, 'README.md'))
  const readmeStat = await stat(join(OUT_DIR, 'README.md'))
  console.log(`  copied: public/brand/zeremi/README.md (${readmeStat.size} bytes)`)

  console.log('\nDone. Zeremi brand assets imported successfully.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
