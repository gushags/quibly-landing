import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

/**
 * CR-03 fix: Satori does not support SVG via data-URI <img> sources -- the
 * sibling app/opengraph-image.tsx documents and avoids this same constraint.
 * The previous base64-SVG approach either threw or produced an empty icon at
 * runtime. Render a styled text "Q" on the brand teal background to match
 * opengraph-image.tsx's brand-mark fallback until a PNG mascot is added
 * under public/.
 */
export default function AppleIcon() {
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
          fontSize: 120,
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
