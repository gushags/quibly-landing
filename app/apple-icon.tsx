import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const runtime = 'nodejs'              // MUST be nodejs — Edge cannot use node:fs
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

/**
 * Renders the Zeremi Z mark apple-touch-icon for iOS home-screen saves.
 *
 * Source asset: public/brand/zeremi/png/zeremi-icon-square-180.png
 * (180×180, pre-composited: white Z mark on teal gradient square background).
 *
 * The brand PNG is already fully composited — no additional background div
 * is added to avoid double-compositing (teal square on teal square).
 *
 * WHY PNG NOT SVG: see app/icon.tsx and 05-05-SUMMARY.md.
 */
export default async function AppleIcon() {
  const iconPng = await readFile(join(process.cwd(), 'public/brand/zeremi/png/zeremi-icon-square-180.png'))
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
          width={180}
          height={180}
          style={{ width: 180, height: 180 }}
        />
      </div>
    ),
    { ...size }
  )
}
