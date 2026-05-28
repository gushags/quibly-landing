import { ZeremiIcon } from '@/components/zeremi/zeremi-icon'
import { cn } from '@/lib/utils'

interface ZeremiAvatarProps {
  size: 'message' | 'header' | 'fab'
  /** White bg + teal icon. Use on teal surfaces (e.g. the widget popup header). */
  inverted?: boolean
  className?: string
}

const SIZE_CONFIG = {
  message: { container: 'h-7 w-7 rounded-lg', icon: { width: 16, height: 25 } },
  header: { container: 'h-9 w-9 rounded-lg', icon: { width: 20, height: 31 } },
  fab: { container: 'h-14 w-14 rounded-full', icon: { width: 28, height: 44 } },
} as const

/**
 * Sized, styled wrapper around `ZeremiIcon`.
 *
 * Single source of truth for Zeremi Z mark avatar visuals across chat surfaces. Defaults to
 * a teal-gradient container with a white icon; `inverted` swaps to a white container
 * with a teal icon for use on teal-gradient backgrounds.
 */
export function ZeremiAvatar({ size, inverted = false, className }: ZeremiAvatarProps) {
  const { container, icon } = SIZE_CONFIG[size]
  const palette = inverted
    ? 'bg-white text-primary'
    : 'bg-gradient-to-br from-primary to-[#14b8a6] text-white'
  return (
    <div
      className={cn(
        'flex items-center justify-center',
        container,
        palette,
        className,
      )}
    >
      <ZeremiIcon width={icon.width} height={icon.height} />
    </div>
  )
}
