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
 * Phase 5: JSON-LD scripts injected before <main> (SEO-08 / PATTERNS.md Pattern 7).
 */

// Phase 5 SEO-08: Schema.org JSON-LD — Organization + WebSite (CD-02: home page only)
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Quibly',
  url: 'https://useQuibly.com',
  logo: 'https://useQuibly.com/quibs-icon.svg',
  description: 'Strategy-first AI marketing for solopreneurs and small teams.',
  // No sameAs — no social handles published yet (CD-02)
}

const webSiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Quibly',
  url: 'https://useQuibly.com',
}

export default function HomePage() {
  return (
    <>
      {/* Phase 5 SEO-08: Schema.org JSON-LD — injected before <main> */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webSiteJsonLd).replace(/</g, '\\u003c'),
        }}
      />
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
