/**
 * Founder voice paragraph (FOLD-02).
 *
 * Locked decisions (D-15):
 *   - Centered prose, max-w-prose (≈65ch / ~600px)
 *   - NO avatar, NO quote marks, NO slanted styling, NO byline visually
 *   - Reads as the founder talking directly to the reader
 *   - ≤80 words single paragraph
 *   - Figtree (font-sans), 16px (text-base), text-muted-foreground
 *
 * Copy is draft per D-28 — founder edits in PR.
 */
export function FounderVoice() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <p className="mx-auto max-w-prose text-center font-sans text-base leading-relaxed text-muted-foreground">
          I built Quibly because I was tired of watching brilliant solopreneurs
          out-craft their competitors and still get buried by anyone with a
          marketing budget. Strategy is the missing layer — and AI finally makes
          it cheap enough for the rest of us. Quibly is the marketing partner
          I wish I&apos;d had ten businesses ago.
        </p>
      </div>
    </section>
  )
}
