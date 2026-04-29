import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const runtime = 'nodejs'              // MUST be nodejs — Edge cannot use node:fs (Pitfall 7)
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Quibly — You know your business. Quibly knows how to market it.'

export default async function OgImage() {
  const [quicksandBold, figtreeMedium, mascotPng] = await Promise.all([
    // WOFF1 files used because Satori does not support variable font tables (fvar/gvar)
    // present in the downloaded Google Fonts TTF. Static-weight WOFF1 from @fontsource
    // is fully supported by Satori/resvg-js.
    readFile(join(process.cwd(), 'public/fonts/Quicksand-Bold.woff')),
    readFile(join(process.cwd(), 'public/fonts/Figtree-Medium.woff')),
    // Pre-rasterized mascot PNG; see scripts/rasterize-mascot.mjs and Plan 05-05.
    // Satori 0.11.x supports PNG via data URI but NOT SVG via data URI.
    readFile(join(process.cwd(), 'public/quibs-icon.png')),
  ])

  const mascotDataUri = `data:image/png;base64,${mascotPng.toString('base64')}`

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%' }}>
        {/* Left column: teal gradient + Quibs mascot (40%) */}
        <div
          style={{
            display: 'flex',
            width: '40%',
            height: '100%',
            background: 'linear-gradient(135deg, #14a3a3, #0d8585)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Quibs mascot — pre-rasterized PNG from public/quibs-icon.svg.
              Satori 0.11.x supports PNG via data URI but NOT SVG via data URI
              (see scripts/rasterize-mascot.mjs and 05-02-SUMMARY.md). */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 220,
              height: 220,
              borderRadius: 44,
              background: 'rgba(255,255,255,0.15)',
            }}
          >
            <img
              src={mascotDataUri}
              alt=""
              width={180}
              height={180}
              style={{ width: 180, height: 180 }}
            />
          </div>
        </div>
        {/* Right column: white + tagline (60%) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '60%',
            height: '100%',
            background: '#ffffff',
            justifyContent: 'center',
            paddingLeft: 64,
            paddingRight: 48,
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontFamily: 'Quicksand',
              fontWeight: 700,
              color: '#0a0a0a',
              lineHeight: 1.15,
              marginBottom: 16,
            }}
          >
            You know your business. Quibly knows how to market it.
          </div>
          <div
            style={{
              fontSize: 28,
              fontFamily: 'Figtree',
              fontWeight: 500,
              color: '#555555',
            }}
          >
            useQuibly.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Quicksand', data: quicksandBold, style: 'normal', weight: 700 },
        { name: 'Figtree', data: figtreeMedium, style: 'normal', weight: 500 },
      ],
    }
  )
}
