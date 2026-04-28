/**
 * Minimal centered single-row footer (FOLD-04, D-18).
 *
 * Layout (rendered in JSX below):
 *   [wordmark] [sep] [copyright] [sep] [Privacy] [sep] [Terms]
 *
 * Cross-phase reuse:
 *   - Phase 5 ships the privacy and terms routes. The hrefs below 404 in Phase 2
 *     by design (D-19); Phase 5 wires the routes WITHOUT touching this Footer (D-27).
 *   - Same Footer renders on `/`, the privacy route, and the terms route — no per-page variant.
 *
 * Locked decisions:
 *   - D-18: minimal centered single row, NOT the design-system §6 4-column footer (which is for marketing-app)
 *   - D-19: hrefs are hard-coded (no env flag, no conditional rendering); they 404 in Phase 2 by design
 *   - D-20: NO social icons, NO contact mailto in v1
 *   - D-21: NO 4-column Product/Resources/Legal/Company structure
 *   - D-32 (post-review): link tap targets use a 48px-floor flex container for guaranteed
 *     MOB-02 compliance — replaces the pre-review tap-target classes which yielded only
 *     30–46px effective height.
 *
 * Accessibility:
 *   - Middot separators wrapped in aria-hidden spans so screen readers
 *     don't announce repeated punctuation between every link (Pitfall #7)
 *   - Each link uses a flex container with a 48px minimum height so the computed
 *     height is at least 48px regardless of font line-height (D-32, MOB-02)
 *   - The wordmark is plain text (not an image, not SVG) — screen-reader-friendly + selectable
 *
 * Pure RSC — unlike marketing-app's footer (which has Tooltip), this minimal version
 * has no interactive state and ships zero client-side JavaScript.
 */
export function Footer() {
  return (
    <footer className="py-12">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-3 px-6 text-sm text-muted-foreground md:px-8">
        <span className="font-heading text-base font-bold text-primary">Quibly</span>
        <span aria-hidden="true">·</span>
        <span>© 2026</span>
        <span aria-hidden="true">·</span>
        <a
          href="/privacy"
          className="inline-flex min-h-12 items-center px-2 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Privacy
        </a>
        <span aria-hidden="true">·</span>
        <a
          href="/terms"
          className="inline-flex min-h-12 items-center px-2 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Terms
        </a>
      </div>
    </footer>
  )
}
