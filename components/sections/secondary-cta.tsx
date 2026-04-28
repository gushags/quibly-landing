import { Button } from "@/components/ui/button"

/**
 * Bottom-of-page CTA (FOLD-03).
 *
 * Phase 2 (post-review D-31): renders as a disabled `button` with
 * aria-disabled. NO self-anchor to the waitlist section. Avoids the
 * no-op-scroll UX flagged in cross-AI review. Phase 3 replaces this with a
 * real anchor smooth-scroll back-pointer once the form is meaningfully far
 * above (several thousand pixels of content) so the scroll has a real target.
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
          <Button size="hero" variant="default" type="button" aria-disabled="true">
            Don&apos;t miss launch — join the waitlist
          </Button>
        </div>
      </div>
    </section>
  )
}
