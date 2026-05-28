import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const runtime = 'nodejs'              // MUST be nodejs — Edge cannot use node:fs
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

/**
 * Renders the Zeremi Z mark favicon.
 *
 * Source asset: public/brand/zeremi/png/zeremi-icon-square-32.png
 * (32×32, pre-composited: white Z mark on teal gradient square background).
 *
 * The brand PNG is already fully composited — no additional background div
 * is added to avoid double-compositing (teal square on teal square).
 *
 * WHY PNG NOT SVG: Satori (the renderer behind next/og's ImageResponse) does not
 * support <img src=data:image/svg+xml;...> in @vercel/og 0.11.x. PNG via data URI
 * is supported. See app/opengraph-image.tsx and 05-05-SUMMARY.md for context.
 */
export default async function Icon() {
  const iconPng = await readFile(join(process.cwd(), 'public/brand/zeremi/png/zeremi-icon-square-32.png'))
  const iconDataUri = `data:image/png;base64,${iconPng.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
        }}
      >
        <img
          src={iconDataUri}
          alt=""
          width={32}
          height={32}
          style={{ width: 32, height: 32 }}
        />
      </div>
    ),
    { ...size }
  )
}
