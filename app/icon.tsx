import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const runtime = 'nodejs'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default async function Icon() {
  const mascotRaw = await readFile(join(process.cwd(), 'public/quibs-icon.svg'), 'base64')
  const mascotSrc = `data:image/svg+xml;base64,${mascotRaw}`
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
        }}
      >
        <img src={mascotSrc} width={28} height={28} alt="" />
      </div>
    ),
    { ...size }
  )
}
