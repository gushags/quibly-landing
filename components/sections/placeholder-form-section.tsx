import { Button } from "@/components/ui/button"

/**
 * Placeholder section that owns the cross-phase waitlist anchor seam.
 *
 * Phase 2 ships this as draft copy plus a disabled secondary CTA (D-09, D-31).
 * Phase 3 RENAMES the file to `waitlist-form-section.tsx` (CD-07) and replaces
 * the inner body with the real WaitlistForm. The outer section wrapper, the
 * anchor id, and the scroll-margin offset (CD-06 — 64px) MUST NOT change
 * between phases — this is the seam Phase 3 commits against.
 *
 * Locked copy decisions:
 *   - Heading + body are draft (D-09 / UI-SPEC Copywriting Contract — replaced
 *     wholesale by Phase 3)
 *   - Secondary CTA copy is locked per D-12, but per D-31 the element type
 *     flips to a disabled native button to avoid the no-op self-anchor flagged
 *     in cross-AI review.
 *
 * Per D-31 (post-review): the placeholder CTA renders as a disabled native
 * button (NOT an anchor element with a fragment href) — clicking it does
 * nothing, which is the correct UX during the placeholder phase. Phase 3
 * swaps this for the form's real submit control.
 */
export function PlaceholderFormSection() {
  return (
    <section id="waitlist" className="scroll-mt-16 py-16 md:py-24">
      <div className="mx-auto max-w-prose px-6 text-center">
        <h2 className="mb-4 font-heading text-3xl font-bold leading-tight text-foreground md:text-4xl">
          Get notified the moment Quibly opens up.
        </h2>
        <p className="mb-6 font-sans text-base text-muted-foreground">
          One email. Zero spam. We&apos;ll only ping you when there&apos;s something real to try.
        </p>
        <Button size="hero" variant="default" type="button" aria-disabled="true">
          Don&apos;t miss launch — join the waitlist
        </Button>
      </div>
    </section>
  )
}
