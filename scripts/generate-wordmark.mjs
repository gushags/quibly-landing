import { ImageResponse } from '@vercel/og'
import { readFileSync, writeFileSync } from 'node:fs'
import wawoff from 'wawoff2'
import React from 'react'

// @vercel/og only accepts TTF/OTF (no variable fonts, no WOFF/WOFF2). We pull
// Bree Serif Regular (weight 400) from @fontsource/bree-serif (WOFF2) and
// decompress it to TTF via wawoff2 before passing to @vercel/og.
const WOFF2_PATH = 'node_modules/@fontsource/bree-serif/files/bree-serif-latin-400-normal.woff2'
const OUT_PATH = 'public/email/wordmark.png'

const woff2 = readFileSync(WOFF2_PATH)
const ttfBytes = await wawoff.decompress(woff2)
const fontData = Buffer.from(ttfBytes)
console.log(`Decompressed BreeSerif-400 WOFF2 -> TTF (${fontData.length} bytes)`)

// Display dimensions: 160x40 in the email (centered in the 48px teal header strip).
// Render at 3x for retina. Background transparent so the email's teal Section
// shows through — keeps the strip flexible if we ever change brand color.
const DISPLAY_W = 160
const DISPLAY_H = 40
const SCALE = 3

const img = new ImageResponse(
  React.createElement(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
      },
    },
    React.createElement(
      'span',
      {
        style: {
          fontSize: 84,
          fontWeight: 400,
          color: '#ffffff',
          fontFamily: 'Bree Serif',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        },
      },
      'zeremi'
    )
  ),
  {
    width: DISPLAY_W * SCALE,
    height: DISPLAY_H * SCALE,
    fonts: [{ name: 'Bree Serif', data: fontData, weight: 400, style: 'normal' }],
  }
)

const buf = Buffer.from(await img.arrayBuffer())
writeFileSync(OUT_PATH, buf)
console.log(`Wrote ${OUT_PATH} (${buf.length} bytes, ${DISPLAY_W * SCALE}x${DISPLAY_H * SCALE} render -> ${DISPLAY_W}x${DISPLAY_H} display)`)
