import { QuibsIcon } from "@/components/quibs/quibs-icon"

/**
 * 88px teal-gradient rounded-square wrapping the Quibs Q-face mascot.
 *
 * Matches design-system §1 "Quibs Icon — Large display" row:
 *   - 88×88 outer container, rounded-3xl corners (~22px — soft rounded square, not a circle)
 *   - 48×56 inner SVG (QuibsIcon dimensions from §1)
 *   - bg-gradient-to-br from-primary to-[#14b8a6] (verbatim gradient from QuibsAvatar line 28)
 *   - text-white drives `fill="currentColor"` on QuibsIcon → mascot renders white
 *
 * Decorative — `aria-hidden="true"` on the wrapper (QuibsIcon itself is also aria-hidden).
 * Meaning is carried by the adjacent <h1>; the mascot is purely visual.
 *
 * D-02: This is a section-local wrapper. Do NOT extend QuibsAvatar's SIZE_CONFIG —
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
      <QuibsIcon width={48} height={56} />
    </div>
  )
}
