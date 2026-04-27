import { Button } from '@/components/ui/button'
import { QuibsIcon } from '@/components/quibs/quibs-icon'

/**
 * Phase 1 smoke-test page (D-12).
 *
 * INTENTIONALLY THROWAWAY. Phase 2 replaces this entire file with the real
 * <Hero> + <WhyQuibly> + <Footer> composition. No effort is spent on
 * layout polish, copy, accessibility-beyond-defaults, or responsiveness here.
 *
 * What this page proves (Phase 1 success criterion #1 — "blank page in Quibly
 * teal/amber with Quicksand headings and Figtree body, visually indistinguishable
 * from marketing-app's tokens"):
 *
 *   1. <QuibsIcon className="text-primary size-12" />
 *      -> teal `oklch(0.6002 0.1038 184.704)` token + currentColor mascot wiring
 *   2. <h1 className="font-heading text-4xl font-bold">Quibly</h1>
 *      -> Quicksand variable font + --font-heading mapping (globals.css)
 *   3. <p className="font-sans text-base">Lorem ipsum...</p>
 *      -> Figtree variable font + --font-sans mapping (globals.css)
 *   4. <Button>Smoke test</Button>
 *      -> shadcn pill-radii (rounded-full) + bg-primary fill via the oklch token
 *
 * If any one of the four surfaces renders with the WRONG color/font/shape,
 * Phase 1 has a token-chain regression — see PATTERNS.md "Two-hop indirection"
 * shared pattern for the chain to inspect.
 */
export default function SmokeTestPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <QuibsIcon className="text-primary size-12" />
      <h1 className="font-heading text-4xl font-bold">Quibly</h1>
      <p className="font-sans text-base text-muted-foreground">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </p>
      <Button>Smoke test</Button>
    </main>
  )
}
