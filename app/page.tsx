import { FounderVoice } from "@/components/sections/founder-voice"
import { Footer } from "@/components/sections/footer"
import { Hero } from "@/components/sections/hero"
import { WaitlistFormSection } from "@/components/sections/waitlist-form-section"
import { SecondaryCTA } from "@/components/sections/secondary-cta"
import { WhyQuibly } from "@/components/sections/why-quibly"

/**
 * Quibly waitlist landing page (Phase 2).
 *
 * Section order is locked by CONTEXT D-16. Sections 1 through 5 (Hero,
 * WaitlistFormSection, WhyQuibly, FounderVoice, SecondaryCTA) render inside
 * the page main landmark; the Footer renders outside it so the body flex layout
 * pins it to the bottom across short routes (UI-SPEC layout contract).
 *
 * Pure RSC — no client directive, no event handlers, no client-side state.
 * Phase 5 owns metadata (OG, title, description); Phase 2 leaves layout.tsx alone.
 */
export default function HomePage() {
  return (
    <>
      <main className="flex flex-col">
        <Hero />
        <WaitlistFormSection />
        <WhyQuibly />
        <FounderVoice />
        <SecondaryCTA />
      </main>
      <Footer />
    </>
  )
}
