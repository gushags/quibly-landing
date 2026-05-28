import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const runtime = 'nodejs'              // MUST be nodejs — Edge cannot use node:fs (Pitfall 7)
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Zeremi — You know your business. Zeremi knows how to market it.'

export default async function OgImage() {
  const [breeSerifRegular, figtreeMedium, markPng] = await Promise.all([
    // TTF file used because Satori does not support variable font tables (fvar/gvar).
    // BreeSerif-Regular.ttf is a static-weight (400) TTF copied from
    // marketing-app/public/fonts/bree-serif-regular.ttf — fully supported by Satori/resvg-js.
    // Weight 400 only — Bree Serif is a single-axis font (RESEARCH Pitfall 2).
    readFile(join(process.cwd(), 'public/fonts/BreeSerif-Regular.ttf')),
    readFile(join(process.cwd(), 'public/fonts/Figtree-Medium.woff')),
    // Pre-composited Zeremi Z mark PNG (512×~804).
    // Satori 0.11.x supports PNG via data URI but NOT SVG via data URI.
    readFile(join(process.cwd(), 'public/brand/zeremi/png/zeremi-mark-512.png')),
  ])

  const markDataUri = `data:image/png;base64,${markPng.toString('base64')}`

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%' }}>
        {/* Left column: teal gradient + Zeremi Z mark (40%) */}
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
          {/* Zeremi Z mark — pre-rasterized PNG from public/brand/zeremi/png/zeremi-mark-512.png.
              Satori 0.11.x supports PNG via data URI but NOT SVG via data URI. */}
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
              src={markDataUri}
              alt=""
              width={130}
              height={204}
              style={{ width: 130, height: 204 }}
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
              fontFamily: 'Bree Serif',
              fontWeight: 400,
              color: '#0a0a0a',
              lineHeight: 1.15,
              marginBottom: 16,
            }}
          >
            You know your business. Zeremi knows how to market it.
          </div>
          <div
            style={{
              fontSize: 28,
              fontFamily: 'Figtree',
              fontWeight: 500,
              color: '#555555',
            }}
          >
            zeremi.app
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Bree Serif', data: breeSerifRegular, style: 'normal', weight: 400 },
        { name: 'Figtree', data: figtreeMedium, style: 'normal', weight: 500 },
      ],
    }
  )
}
