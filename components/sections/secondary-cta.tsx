import { Button } from "@/components/ui/button"

/**
 * Bottom-of-page CTA (FOLD-03).
 *
 * Phase 3 (D-02): flipped to <Button asChild><a href="#waitlist">. The form lives
 * several thousand pixels above (Hero → WaitlistFormSection → WhyZeremi → FounderVoice
 * → here), so scrolling UP to #waitlist is meaningful UX for visitors who scrolled
 * through the page and want to commit. Smooth-scroll behavior is provided by
 * globals.css:96 (Phase 2 D-08); prefers-reduced-motion override at globals.css:100-106.
 *
 * Locked copy (D-12, UI-SPEC Copywriting Contract):
 *   - H2: "Ready to stop guessing at marketing?" (draft per D-28; founder edits in PR)
 *   - CTA: "Don't miss launch [em-dash] join the waitlist" (locked draft; em-dash literal in JSX below)
 */
export function SecondaryCTA() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6 md:px-8 text-center">
        <h2 className="mb-4 font-heading text-3xl font-bold leading-tight text-foreground md:text-4xl">
          Ready to stop guessing at marketing?
        </h2>
        <div className="mt-8 flex justify-center">
          <Button asChild size="hero" variant="default">
            <a href="#waitlist">Don&apos;t miss launch — join the waitlist</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
