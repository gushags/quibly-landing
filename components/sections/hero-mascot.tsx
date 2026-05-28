import { ZeremiIcon } from "@/components/zeremi/zeremi-icon"

/**
 * 88px teal-gradient rounded-square wrapping the Zeremi Z mark.
 *
 * Matches design-system §1 "Zeremi Icon — Large display" row:
 *   - 88×88 outer container, rounded-3xl corners (~22px — soft rounded square, not a circle)
 *   - 36×56 inner SVG (ZeremiIcon dimensions — 56:88 aspect ≈ 36:56)
 *   - bg-gradient-to-br from-primary to-[#14b8a6] (verbatim gradient from ZeremiAvatar)
 *   - text-white drives `fill="currentColor"` on ZeremiIcon → Z mark renders white
 *
 * Decorative — `aria-hidden="true"` on the wrapper (ZeremiIcon itself is also aria-hidden).
 * Meaning is carried by the adjacent <h1>; the mascot is purely visual.
 *
 * D-02: This is a section-local wrapper. Do NOT extend ZeremiAvatar's SIZE_CONFIG —
 * those size variants ('message' | 'header' | 'fab') are for chat surfaces.
 * D-03: When placed inside the Hero, this component renders DOM-second so the
 * Hero's <h1> (DOM-first) is the LCP candidate.
 */
export function HeroMascot() {
  return (
    <div
      aria-hidden="true"
      className="flex h-[88px] w-[88px] items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-[#14b8a6] text-white"
    >
      <ZeremiIcon width={36} height={56} />
    </div>
  )
}
