import { WaitlistForm } from '@/components/waitlist/waitlist-form';

/**
 * D-06: Waitlist form section stays an RSC (NOT a Client Component) — composition
 * only, no hooks. The Client Component boundary lives one level down at <WaitlistForm>
 * (D-05). This RSC owns the cross-phase anchor seam (id="waitlist", scroll-mt-16,
 * outer section + max-w-prose wrappers — preserved verbatim from Phase 2 D-09).
 *
 * Renamed from `placeholder-form-section.tsx` per CONTEXT CD-07. The outer
 * <section id="waitlist" className="scroll-mt-16 py-16 md:py-24"> and inner
 * <div className="mx-auto max-w-prose px-6 text-center"> wrappers are
 * preserved VERBATIM from Phase 2 — this is the seam Phase 2 D-09 locks
 * across all phases. Future phases may swap the inner body but MUST NOT
 * change the outer wrapper.
 *
 * Phase 3 changes (this file):
 *   - File rename per CD-07
 *   - Inner body: heading + sub-copy + <WaitlistForm /> (was: placeholder paragraphs + disabled button)
 *   - Computes renderedAt at request time and passes as prop to <WaitlistForm>
 *     (Pitfall 2 mitigation — never compute the timestamp inside the Client Component
 *     or React hydration warns and rehydrates)
 *
 * CD-02 audit trail (Claude's discretion, intentional substitution — NOT scope reduction):
 *   CONTEXT.md CD-02 instructs the time-trap timestamp source should be a
 *   "hidden input populated server-side" (Claude picks; default to hidden input).
 *   This file honors CD-02 by computing the wall-clock value HERE in the parent RSC at
 *   request time and passing it down as a `renderedAt: number` prop. The
 *   downstream <WaitlistForm> renders <input type="hidden" name="renderedAt"
 *   value={renderedAt} />. This is the RSC-prop variant of CD-02's "server-side
 *   population" — chosen over the simpler in-component default because that
 *   triggers React 19 hydration mismatch (RESEARCH.md Pitfall 2). The intent of
 *   CD-02 (hidden input, server-time value, ~2s threshold rejection in the action)
 *   is fully preserved.
 *
 * Locked copy (D-04 — DRAFT, founder reviews/edits in PR):
 *   - H2: "Be first when Quibly opens up." (5 words, conversational, addresses the reader)
 *   - Sub-copy: "Drop your email and we'll ping you the moment Quibly's ready."
 *     (14 words, friendly upstart tone per PROJECT.md)
 */
export function WaitlistFormSection() {
  // CD-02 + Pitfall 2 + D-06: timestamp runs at request time on the SERVER (RSC, no
  // client directive at the top of this file) and is passed as a stable primitive
  // prop to the Client Component. This is CD-02's "hidden input populated server-side"
  // implemented via the RSC-prop mechanism (RESEARCH.md Pitfall 2) rather than
  // computing it inside the Client Component, which would hydration-mismatch.
  // The intentional per-request impurity is the whole point — every server render
  // plants a fresh timestamp the time-trap can compare against.
  // eslint-disable-next-line react-hooks/purity -- intentional per-request RSC value (Pitfall 2 / CD-02)
  const renderedAt = Date.now();

  return (
    <section id='waitlist' className='scroll-mt-16 py-16 md:py-24'>
      <div className='mx-auto max-w-prose px-6 text-center'>
        <h2 className='mb-4 font-heading text-3xl font-bold leading-tight text-foreground md:text-4xl'>
          Be first when Quibly opens up.
        </h2>
        <p className='mb-8 font-sans text-base text-muted-foreground'>
          Drop your email and we&apos;ll ping you the moment Quibly&apos;s
          ready.
        </p>
        <WaitlistForm renderedAt={renderedAt} />
      </div>
    </section>
  );
}
