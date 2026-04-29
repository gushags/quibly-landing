// scripts/rasterize-mascot.mjs
//
// Rasterizes public/quibs-icon.svg → public/quibs-icon.png at 360×360 with a
// transparent background and a white fill (matches the on-page mascot treatment:
// `text-white` + `fill="currentColor"`).
//
// WHY THIS EXISTS: Satori (the renderer behind next/og's ImageResponse) cannot
// render <img src=data:image/svg+xml;...>; it CAN render <img src=data:image/png;...>.
// Pre-rasterizing here lets app/opengraph-image.tsx, app/icon.tsx, and
// app/apple-icon.tsx all render the actual mascot (Q-face + two eyes) instead of
// the placeholder styled "Q" div.
//
// REGENERATION: `node scripts/rasterize-mascot.mjs`
// Run this any time public/quibs-icon.svg changes.

import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

const ROOT = process.cwd()
const SRC = join(ROOT, 'public/quibs-icon.svg')
const OUT = join(ROOT, 'public/quibs-icon.png')
const SIZE = 360

async function main() {
  const svg = await readFile(SRC, 'utf-8')

  // Inject fill="#ffffff" into the root <svg> so paths (which have no per-path
  // fill) render white. The on-page React component achieves this via
  // fill="currentColor" + a parent text-white class; sharp has no CSS context,
  // so we set the fill on the SVG element itself.
  //
  // Match `<svg ...>` (the first opening tag) and ensure it has fill="#ffffff".
  // If a fill attr already exists, replace it; otherwise insert before the closing >.
  let patched
  if (/<svg\s[^>]*\bfill=/i.test(svg)) {
    patched = svg.replace(/(<svg\s[^>]*\b)fill="[^"]*"/i, '$1fill="#ffffff"')
  } else {
    patched = svg.replace(/<svg\s([^>]*)>/i, '<svg $1 fill="#ffffff">')
  }

  const png = await sharp(Buffer.from(patched), { density: 384 })
    .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  await writeFile(OUT, png)
  console.log(`Wrote ${OUT} (${png.length} bytes, ${SIZE}×${SIZE}, transparent bg, white mascot)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
