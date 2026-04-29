import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

/**
 * CR-03 fix: Satori (the renderer behind next/og's ImageResponse) does not
 * support SVG via data-URI <img> sources -- the sibling
 * app/opengraph-image.tsx documents and avoids this same constraint.
 * Rendering the SVG mascot via base64 data URI either threw or produced an
 * empty image at runtime. Until a PNG mascot is added under public/, render
 * a styled text "Q" on the brand teal background to match the same approach
 * used in opengraph-image.tsx for the OG left panel.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: '#14a3a3',
          color: '#ffffff',
          fontSize: 22,
          fontWeight: 700,
          fontFamily: 'sans-serif',
          lineHeight: 1,
        }}
      >
        Q
      </div>
    ),
    { ...size }
  )
}
