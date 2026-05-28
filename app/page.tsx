import { Footer } from '@/components/sections/footer';
import { Hero } from '@/components/sections/hero';
import { WaitlistFormSection } from '@/components/sections/waitlist-form-section';
import { SecondaryCTA } from '@/components/sections/secondary-cta';
import { WhyZeremi } from '@/components/sections/why-zeremi';

/**
 * Zeremi waitlist landing page (Phase 2).
 *
 * Section order is locked by CONTEXT D-16. Sections 1 through 5 (Hero,
 * WaitlistFormSection, WhyZeremi, FounderVoice, SecondaryCTA) render inside
 * the page main landmark; the Footer renders outside it so the body flex layout
 * pins it to the bottom across short routes (UI-SPEC layout contract).
 *
 * Pure RSC — no client directive, no event handlers, no client-side state.
 * Phase 5: JSON-LD scripts injected before <main> (SEO-08 / PATTERNS.md Pattern 7).
 */

/**
 * WR-07: centralize JSON-LD escaping. The previous inline
 * `JSON.stringify(...).replace(/</g, '\\u003c')` only neutralized the
 * `</script>` injection vector; OWASP recommends also escaping `>`, `&`, and
 * the U+2028 / U+2029 line-separator characters that JavaScript treats as
 * line terminators inside script blocks. Today's data is fully static so the
 * gaps are inert, but duplicating a partial pattern across two scripts
 * invites a future caller to copy-paste it for user-derived data. The helper
 * documents the expectation and gives every JSON-LD insertion a single
 * audited path.
 */
function safeJsonLdScript(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

// Phase 5 SEO-08: Schema.org JSON-LD — Organization + WebSite (CD-02: home page only)
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Zeremi',
  url: 'https://zeremi.app',
  logo: 'https://zeremi.app/brand/zeremi/png/zeremi-mark-512.png',
  description: 'Strategy-first AI marketing for solopreneurs and small teams.',
  // No sameAs — no social handles published yet (CD-02)
};

const webSiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Zeremi',
  url: 'https://zeremi.app',
};

export default function HomePage() {
  return (
    <>
      {/* Phase 5 SEO-08: Schema.org JSON-LD — injected before <main> */}
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: safeJsonLdScript(organizationJsonLd),
        }}
      />
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: safeJsonLdScript(webSiteJsonLd) }}
      />
      <main className='flex flex-col'>
        <Hero />
        <WaitlistFormSection />
        <WhyZeremi />
        <SecondaryCTA />
      </main>
      <Footer />
    </>
  );
}
