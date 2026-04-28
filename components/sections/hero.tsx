import { Button } from "@/components/ui/button"
import { HeroMascot } from "@/components/sections/hero-mascot"

// Draft copy — founder reviews/edits during PR (CONTEXT D-28).
// 24 words — within the 15–25 range required by HERO-02 / D-05.
const SUB_HEADLINE =
  "Quibly is the strategy-first AI marketing platform built for solopreneurs and small teams who'd rather grow the business than figure out the funnel."

/**
 * Hero section for the Quibly waitlist landing page.
 *
 * Decision references (see .planning/phases/02-static-landing-page-no-form/02-CONTEXT.md):
 *   D-03 / HERO-06 — DOM order guards LCP: headline element first in DOM, mascot second.
 *   D-30 — post-review spacing tightening for 320×568; sub-headline width tightened.
 *   D-22 — decorative dual-stop radial gradient behind hero only; stacking-context contained.
 *   D-31 — placeholder CTA renders disabled (post-review); replaces no-op self-anchor.
 *   D-04 — neutral foreground heading typography, no per-token accent color.
 *
 * Phase 3 will replace the disabled CTA control with the form's real submit (copy
 * reverts to FORM-04 verbatim).
 */
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden py-8 md:py-16 lg:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(at_30%_20%,oklch(0.6002_0.1038_184.704_/_0.08),transparent_60%),radial-gradient(at_75%_80%,oklch(0.78_0.13_70_/_0.06),transparent_55%)]"
      />
      <div className="mx-auto flex max-w-6xl flex-col-reverse items-center gap-4 px-6 text-center md:px-8">
        <h1 className="max-w-3xl font-heading font-bold leading-tight text-foreground text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
          You know your business. Quibly knows how to market it.
        </h1>
        <HeroMascot />
      </div>
      <p className="mx-auto mt-4 max-w-xs px-6 text-center font-sans text-base sm:text-lg text-muted-foreground sm:max-w-prose">
        {SUB_HEADLINE}
      </p>
      <div className="mt-4 flex flex-col items-center">
        <Button size="hero" variant="default" type="button" aria-disabled="true">
          Form coming soon
        </Button>
        <p className="mt-3 text-sm text-muted-foreground">Launching Summer 2026</p>
      </div>
    </section>
  )
}
