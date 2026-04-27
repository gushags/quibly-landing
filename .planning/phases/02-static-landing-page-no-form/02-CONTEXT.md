# Phase 2: Static Landing Page (No Form) - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning

<domain>
## Phase Boundary

The full marketing surface — hero, "Why Quibly" three-line differentiator block, founder-voice paragraph, secondary CTA, and footer — rendered as **pure server-component markup** that proves Lighthouse mobile ≥90 and CLS <0.1 before any client JavaScript ships. The page is single-screen above-the-fold (320×568) with the headline (not the mascot) as the LCP element, scales cleanly from 320px → 1440px, and ships zero render-blocking third-party scripts on first paint.

**In scope:**
- Replace Phase 1's smoke-test `app/page.tsx` with `<Hero> + <PlaceholderFormSection> + <WhyQuibly> + <FounderVoice> + <SecondaryCTA> + <Footer>`
- All section components live under `components/sections/` (idiomatic App Router; Footer is reused by /privacy and /terms in Phase 5)
- Pure RSC composition — **zero `'use client'` directives** in this phase
- Subtle teal/amber radial gradient behind the hero (CSS-only, no animation)
- Placeholder section at `id="waitlist"` that holds the future form's anchor target plus the in-page secondary CTA
- Footer with copyright, Privacy, Terms, small Quibly wordmark — minimal centered single row
- Lighthouse CI gate enabled on PRs (Phase 2 SC #4)
- `prefers-reduced-motion` honored on every motion surface (none ships in v1, but the contract is enforced for Phase 3+)

**Out of scope:**
- The `<WaitlistForm>` Client Component, Server Action, honeypot, time-trap (→ Phase 3)
- Real `lib/resend.ts`, Upstash, audience writes, welcome email (→ Phase 4)
- `/privacy` and `/terms` route content (→ Phase 5; Phase 2 ships the footer hrefs as `/privacy` + `/terms` which 404 until Phase 5 wires them)
- OG image, sitemap, robots, analytics, Schema.org JSON-LD (→ Phase 5)
- Apex domain binding, mail-tester verification, cutover runbook (→ Phase 6)
- Q-face dot wave/blink animation (deferred — see `<deferred>`)
- Any Framer Motion / `next-themes` / `@tailwindcss/typography` (banned by CLAUDE.md "What NOT to Use")
- Test runner setup (lands in Phase 3 with the first Server Action)

</domain>

<decisions>
## Implementation Decisions

### Hero Composition
- **D-01:** Mascot stacked **above** the headline, vertically centered single-column on all viewports (320 → 1440px). No 2-col split, no decorative offset. Reads identically across breakpoints; lowest layout/CLS risk.
- **D-02:** Mascot rendered as the **88px teal-gradient rounded-square** ("Large display" row from `2026-04-14-quibly-design-system.md` §1, Quibs Icon table — `48×56` icon centered inside an `88px rounded-square` with `bg-gradient-to-br from-primary to-[#14b8a6] text-white`). Implement as a new section-local `<HeroMascot>` wrapper rather than extending `<QuibsAvatar>`'s size variants — the existing `'message' | 'header' | 'fab'` SIZE_CONFIG is for chat surfaces and shouldn't be polluted with a hero-only token.
- **D-03:** **DOM order: headline first, mascot second** — visually-above via flex `flex-col` with the mascot using `order-first` (or `flex-col-reverse` if cleaner). HERO-06 ("LCP element is the headline text, not the mascot or any image") is enforced at the DOM level so Lighthouse can't pick the mascot as LCP. Verify in Phase 2 Lighthouse run that the H1 is reported as the LCP candidate.
- **D-04:** Headline scale: `text-3xl sm:text-4xl md:text-5xl lg:text-6xl` Quicksand 700 (`font-heading font-bold`). All-neutral foreground color — **no per-token accent on "Quibly"**. The brand teal lives in the mascot and CTA; the headline carries the typographic weight without color competing.
- **D-05:** Sub-headline (HERO-02): 15–25 words in Figtree (`font-sans`), `text-base sm:text-lg`, `text-muted-foreground`, max-width ~`max-w-prose` (≈65ch). Claude drafts copy aligned with brand tone (see D-19); founder edits in PR.
- **D-06:** Hero CTA = pill button at `border-radius: 28px` (`btn-hero` per design-system §1). Implementation: extend the existing `<Button>` with a `size="hero"` variant via `class-variance-authority`, OR pass `className="rounded-[28px] py-3.5 px-9"`. Prefer the CVA variant so Phase 3's submit button reuses it without `cn()` overrides.
- **D-07:** Above-fold budget at 320×568: mascot (88px) + headline (~120px wrapped) + sub-headline (~64px wrapped) + CTA (~52px) + microcopy (~24px) ≈ 348px content + spacing ≤ 568px. Phase 2 verifies this fits without scroll on the SC #1 viewport.

### Placeholder CTA Behavior (Phase 2 → Phase 3 handoff)
- **D-08:** Hero pill CTA is `<a href="#waitlist">` — a smooth-scroll anchor link, not a `<button>`. CSS `scroll-behavior: smooth` on `html` (or `:focus-within`) handles the scroll; `prefers-reduced-motion` automatically disables it. **Zero client JS.** Phase 3 swaps `<a href="#waitlist">` for the form's submit `<button>` when the real `<WaitlistForm>` mounts at `id="waitlist"`.
- **D-09:** `<PlaceholderFormSection>` at `id="waitlist"` ships in Phase 2 as a compact "join the waitlist" shell — heading + 1-line elaboration + the secondary CTA inside the same section. **Phase 3 replaces this section's body with the real form** without changing the section's outer wrapper or the `id="waitlist"` anchor. This keeps Phase 3's diff bounded and lets Phase 2's Lighthouse measure against the real DOM shape Phase 3 will use.
- **D-10:** Secondary CTA (FOLD-03) anchors back to `#waitlist` — **same target as the hero CTA**. Copy can differ ("Don't miss launch — join the waitlist" vs hero's "Join the waitlist") but the anchor target is shared. One placeholder section serves both entry points.
- **D-11:** Launch-timing microcopy (HERO-05) sits **directly under the hero CTA**: "Launching Summer 2026" in `text-sm text-muted-foreground`. Same component renders the microcopy in both Phase 2 (under the anchor pill) and Phase 3 (under the form button) — Phase 3 just wraps a different control.
- **D-12:** Hero CTA copy: "Join the waitlist" (matches FORM-04 verbatim — Phase 3 doesn't have to retype the action-oriented copy when it wires the real submit). Secondary CTA copy: "Don't miss launch — join the waitlist".

### "Why Quibly" + Founder-Voice Layout
- **D-13:** "Why Quibly" (FOLD-01) renders as a **3-column grid on `md:` and up, single-column stacked on mobile**: `grid grid-cols-1 md:grid-cols-3 gap-8`. Each item: lucide icon (D-14) in `text-primary` at 24–28px → bold label in Quicksand 600 → 1–2 line description in Figtree.
- **D-14:** Lucide icons mapped to differentiators (lucide-react is already in the stack — CLAUDE.md approves):
  - **Strategy-first** → `Target`
  - **AI advisory board** → `Users`
  - **Metrics-driven loop** → `LineChart`
- **D-15:** Founder-voice paragraph (FOLD-02) renders as **centered prose, max-width `max-w-prose` (~600px / 60–75ch), no avatar, no quote marks, no italic**. Reads like the founder talking directly to the reader. Single short paragraph (≤80 words). No founder-name byline visually — the voice carries it. (If founder later wants a byline, that's a one-line edit.)
- **D-16:** Section order on the page (top to bottom):
  1. `<Hero>`
  2. `<PlaceholderFormSection>` (id="waitlist", below the fold on 320×568)
  3. `<WhyQuibly>`
  4. `<FounderVoice>`
  5. `<SecondaryCTA>` (anchors back to #waitlist)
  6. `<Footer>`
- **D-17:** Each section uses a consistent vertical-rhythm scale (`py-16 md:py-24` for content sections, `py-12` for footer). Container max-width: `max-w-6xl mx-auto px-6 md:px-8` for the outer page wrapper; founder paragraph is the only inner-tighter constraint at `max-w-prose`.

### Footer Scope (Locks for Phase 5)
- **D-18:** Footer is **minimal centered single row**: `© 2026 Quibly  ·  Privacy  ·  Terms` with a small "Quibly" wordmark (Quicksand Bold, teal, ~16px) at the start of the row. Separators are middots `·` (or thin pipes `|` if rendering issues appear). Footer height ≤ ~60px. **Same Footer component renders on `/` (Phase 2), `/privacy` (Phase 5), `/terms` (Phase 5)** — no per-page variant.
- **D-19:** Footer hrefs are hard-coded: `<a href="/privacy">` and `<a href="/terms">`. **Phase 2 ships with these routes returning 404** (Next.js default 404 page); Phase 5 adds the actual routes and the links automatically work — the Footer component is not touched in Phase 5. No env flag, no conditional rendering, no Phase-2-only "coming soon" anchors. Lighthouse runs on `/` only and won't crawl the 404s.
- **D-20:** Footer ships **without** social icons or contact mailto in v1. (PROJECT.md "What NOT to Use" doesn't ban them, but the footer-signals-maturity argument from the full design system §6 is for the launched site — for a waitlist with no public socials yet, dead-link icons subtract trust rather than adding it. Easy to add later when accounts exist.)
- **D-21:** Footer **does not** mirror the full design-system §6 4-column structure (Product / Resources / Legal / Company). That layout is for the post-launch marketing site — most columns would be empty here (no Pricing, Blog, Guides, Help Center, About yet) and the footer would look half-broken. Locked to minimal centered.

### Decorative Posture
- **D-22:** Background: a **subtle teal/amber radial gradient behind the hero only** — CSS-only, no animation, no client JS. Implementation: `bg-[radial-gradient(...)]` on `<Hero>` with very low-opacity stops, OR a positioned `<div>` behind the headline with `pointer-events-none`. Stops should be barely visible; the hero is white-dominant per design-system §2. Below the hero, surfaces are flat `bg-background` (white).
- **D-23:** **Zero motion in v1.** Mascot is static. No Q-face dot wave/blink animation. No headline fade-in. `prefers-reduced-motion` honored trivially because nothing moves. (CLAUDE.md flagged the dot animation as possible polish — see `<deferred>`.)
- **D-24:** `tw-animate-css` stays installed (Phase 1 imported it in `globals.css`) but no animations are invoked in Phase 2. Phase 3+ may use it for the success-state checkmark.

### Component Organization
- **D-25:** Section components live under `components/sections/`:
  - `components/sections/hero.tsx`
  - `components/sections/placeholder-form-section.tsx`
  - `components/sections/why-quibly.tsx`
  - `components/sections/founder-voice.tsx`
  - `components/sections/secondary-cta.tsx`
  - `components/sections/footer.tsx`
- **D-26:** `app/page.tsx` becomes a thin composition: `<Hero /> → <PlaceholderFormSection /> → <WhyQuibly /> → <FounderVoice /> → <SecondaryCTA /> → <Footer />`. No business logic, no copy strings inline (copy lives in each section component for now; if copy needs i18n or CMS-backing later, sections become the seam).
- **D-27:** Footer is imported by `app/page.tsx` directly in Phase 2. In Phase 5, when /privacy and /terms ship, Footer can either continue to be imported per-page or be hoisted into a route-group `layout.tsx` — that decision belongs to Phase 5, not here.

### Copy Sourcing
- **D-28:** Claude drafts plausible copy aligned with the documented brand tone ("conversational, modern, friendly, confident, playful, energetic, upstart" — PROJECT.md / design-system §3). Founder reviews and edits in the PR before merge. Treat all copy as draft-stage. Specific drafts to ship:
  - Sub-headline (15–25 words framing the offer for solopreneurs/small teams)
  - 3 differentiator descriptions (1–2 lines each, anchored on PROJECT.md positioning: strategy-first / AI advisory board / metrics-driven loop)
  - Founder-voice paragraph (≤80 words, first-person, no name byline visually)
  - Secondary CTA copy ("Don't miss launch — join the waitlist" or founder-edited equivalent)

### Lighthouse CI Gate (Phase 2 SC #4)
- **D-29:** Phase 2 wires a Lighthouse CI workflow on PRs (was deferred in Phase 1 per its CONTEXT `<deferred>` — "surfaces in Phase 2 as a success criterion"). Use `@lhci/cli` GitHub Action; enforce `performance ≥ 0.90`, `cls < 0.1`, mobile profile, runs against the Vercel preview URL for each PR. Fails the PR if thresholds drop.

### Claude's Discretion
- **CD-01:** Exact gradient color stops, gradient size/positioning, container max-width nuances (e.g., `max-w-6xl` vs `max-w-7xl`) — Claude tunes during implementation against the visual reference HTML. Document final values in plan.
- **CD-02:** Font-size scale fine-tuning at intermediate breakpoints (`sm:`, `md:`, `lg:`) — Claude balances against the 320×568 above-fold budget (D-07) and the design-system spec.
- **CD-03:** Whether to use a separate `<HeroMascot>` component file vs. inline the 88px gradient wrapper inside `<Hero>` — Claude's call. Default: inline if it's <15 lines and not reused; extract to its own file if Phase 3+ needs the same shape elsewhere.
- **CD-04:** Implementation of the `size="hero"` Button variant via CVA vs. ad-hoc Tailwind classes — Claude picks. Prefer CVA so Phase 3's submit button reuses it.
- **CD-05:** Lighthouse CI threshold for non-performance categories (a11y, best-practices, SEO) — Claude sets defaults. Performance ≥ 0.90 and CLS < 0.1 are mandatory; others are advisory and shouldn't block merges.
- **CD-06:** Anchor smooth-scroll target offset (e.g., `scroll-margin-top: 4rem` so the section header isn't flush against the top edge) — Claude tunes.
- **CD-07:** Whether `<PlaceholderFormSection>` lives at `components/sections/placeholder-form-section.tsx` or whether Phase 3 simply replaces its file with `components/sections/waitlist-form-section.tsx` (renaming the file at swap time). Claude picks; prefer the rename approach because Phase 3's git diff reads more clearly as "replaced placeholder with form" than "edited placeholder file in place".

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project planning
- `CLAUDE.md` — full Recommended Stack, "Specific Architectural Decisions", and especially the "What NOT to Use" table (Framer Motion, react-hook-form, hero video/Lottie, GA4, GTM, `next-themes`, `@tailwindcss/typography`).
- `.planning/PROJECT.md` — tagline, audience, tone of voice, brand asset locations, "Below-the-fold 'Why Quibly' text-only block" decision rationale.
- `.planning/REQUIREMENTS.md` §Hero, §Mobile-First Layout, §Below-the-Fold Content, §Performance — HERO-01 through HERO-07, MOB-01 through MOB-04, FOLD-01 through FOLD-04, PERF-01 through PERF-03 verbatim.
- `.planning/ROADMAP.md` §"Phase 2: Static Landing Page (No Form)" — five success criteria, especially SC #1 (320×568 above-fold), SC #4 (Lighthouse CI), SC #5 (`prefers-reduced-motion`).
- `.planning/research/SUMMARY.md` §"Phase 2" — rationale ("Prove Lighthouse mobile ≥90 on pure markup before any client JS"); §"Recommended Stack" for `next/font/google` font preload context.
- `.planning/research/STACK.md` — version pins (already locked in Phase 1 but referenced for Lighthouse CI tooling choices).
- `.planning/STATE.md` — accumulated decisions (no marketing cookies, no consent banner, Vercel Analytics cookieless).
- `.planning/phases/01-scaffold-brand-token-parity/01-CONTEXT.md` — Phase 1 decisions Phase 2 builds on (token strategy D-04, mascot port D-01, font wiring CD-06, layout.tsx shape).

### Design contract (in `marketing-app`, must read)
- `/Users/jeff/repos/marketing-app/docs/superpowers/specs/2026-04-14-quibly-design-system.md` — **the** design contract. Phase 2 needs §1 (Typography, Button Shape including `border-radius: 28px` for hero CTA, Quibs Icon `Large display` row at 88px rounded-square with teal-gradient + white icon, Sidebar Icons stroke conventions for lucide), §2 (Color Scheme — primary teal `#0D9488`, primary light `#14b8a6` for the gradient, white-dominant surfaces), §3 (Brand Identity — tagline, tone, logo treatment), §6 (Footer reference — note: full Footer is for launched marketing site, NOT the v1 waitlist footer per D-21).
- `/Users/jeff/repos/marketing-app/docs/superpowers/specs/2026-04-14-quibly-design-reference.html` — visual mockup reference. Open in browser to confirm pill-button radii, color tokens, typography rendering before pixel-tuning sections.
- `/Users/jeff/repos/marketing-app/docs/superpowers/specs/2026-04-11-quibly-public-site-design.md` §3.1 (Hero) — informs hero composition; SUPERSEDED by 2026-04-14 spec for typography/button-shape but useful for hero structure.

### Existing scaffold (this repo)
- `app/layout.tsx` — `next/font/google` Quicksand + Figtree wired with `--font-quicksand` / `--font-figtree` CSS variables; metadata baseline. Phase 2 does not modify; Phase 5 finalizes title/description/OG.
- `app/globals.css` — `@theme inline` token block with `--color-primary` (oklch teal), `--font-heading` / `--font-sans` mappings, and the radius scale (`--radius-sm` … `--radius-4xl`). Phase 2 reads from these, doesn't add new tokens.
- `app/page.tsx` — Phase 1 throwaway smoke-test page. **Phase 2 replaces this file entirely** (Phase 1 D-13 explicitly anticipated this).
- `components/quibs/quibs-icon.tsx` — `<QuibsIcon>` component with `fill="currentColor"`, `viewBox="0 0 223 263"`. Used inside the new 88px teal-gradient hero wrapper.
- `components/quibs/quibs-avatar.tsx` — `<QuibsAvatar>` with `'message' | 'header' | 'fab'` variants. **Reference only**; Phase 2 builds a new section-local hero-mascot wrapper rather than extending SIZE_CONFIG (D-02).
- `components/ui/button.tsx` — shadcn Button. Phase 2 may add a `size="hero"` CVA variant (CD-04) at `border-radius: 28px` per design-system §1.
- `lib/utils.ts` — `cn()` helper from Phase 1.
- `lib/env.ts` — Zod-validated env (Phase 1). Phase 2 doesn't touch.

### External docs
- [Next.js App Router static rendering](https://nextjs.org/docs/app/building-your-application/rendering/server-components) — confirm RSC default, no `'use client'` needed.
- [Lighthouse CI GitHub Action](https://github.com/GoogleChrome/lighthouse-ci-action) — for the SC #4 CI gate.
- [`prefers-reduced-motion` MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) — applied trivially in Phase 2 (no motion ships) but contract is enforced.
- [lucide-react icons](https://lucide.dev/icons/) — for `Target`, `Users`, `LineChart` (D-14).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`<QuibsIcon className="text-primary size-12" />`** at `components/quibs/quibs-icon.tsx`: Phase 2 wraps this inside an 88px rounded-square gradient container. The `currentColor` pattern is what lets the gradient container's `text-white` recolor the icon. Already proven on Phase 1's smoke-test page.
- **`<Button>`** at `components/ui/button.tsx`: shadcn Button styled to Quibly tokens in Phase 1 (pill `rounded-full` baseline). Phase 2 either passes `className="rounded-[28px] py-3.5 px-9"` or adds a `size="hero"` CVA variant (CD-04).
- **`cn()`** at `lib/utils.ts`: standard `clsx` + `tailwind-merge` helper for conditional Tailwind composition.
- **Quicksand + Figtree** via `app/layout.tsx`: variable Google fonts, `display: 'swap'`, exposed as `--font-quicksand` / `--font-figtree`. `font-heading` / `font-sans` Tailwind utilities resolve through `globals.css`'s `@theme inline` block. Phase 2 just uses `font-heading` / `font-sans` — no new font wiring.
- **Token chain**: `--color-primary` (oklch teal in `:root`) → `@theme inline` `--color-primary: var(--primary)` → Tailwind `bg-primary` / `text-primary` / `from-primary`. The `from-primary to-[#14b8a6]` gradient in the hero mascot wrapper resolves cleanly through this chain.

### Established Patterns
- **`fill="currentColor"` on SVGs** + Tailwind text utility on parent (`text-primary`, `text-white`) to drive icon color. Phase 2 uses this in the hero (`text-white` on the gradient container → mascot renders white).
- **Variable Google fonts as CSS variables, mapped via `@theme inline`** — established in Phase 1, Phase 2 just consumes (`font-heading`, `font-sans`).
- **`@/`-aliased imports** — `@/components/sections/hero`, `@/components/quibs/quibs-icon`, `@/lib/utils`. Mirror.
- **shadcn token-driven components** — Button reads from `bg-primary` / `text-primary-foreground` / `--radius-*`. Phase 2's `size="hero"` variant (if implemented per CD-04) extends this pattern, doesn't break it.
- **No `'use client'` unless required** — Phase 1 page.tsx is RSC. Phase 2 stays RSC throughout (no useState, no event handlers — anchor links + CSS scroll-behavior are server-renderable).

### Integration Points
- `app/page.tsx` (RSC) → `components/sections/*` (RSC) → `components/ui/button.tsx` (RSC default) + `components/quibs/quibs-icon.tsx` (RSC default) — **the entire page is server-rendered, zero client JS in Phase 2**.
- `app/page.tsx` → `<Footer />` is the same component that will mount on `/privacy` and `/terms` in Phase 5 — Footer is a critical reuse boundary; Phase 5 does not re-implement it.
- `<Hero>` → `id="waitlist"` anchor target on `<PlaceholderFormSection>` (D-09) — Phase 3 swaps the section's body with `<WaitlistForm>` without changing the anchor target. The anchor is the seam between Phase 2 and Phase 3.
- `<PlaceholderFormSection>` → Phase 3 likely renames to `<WaitlistFormSection>` (CD-07), keeping `id="waitlist"` and the section's outer wrapper identical so the Lighthouse + visual-QA budget doesn't shift between phases.
- Phase 5 reads `app/page.tsx` to add `<TwitterCard>` / metadata — Phase 2 should not pre-populate placeholder OG/Twitter strings; leave the Phase 1 metadata baseline in `app/layout.tsx` alone.

</code_context>

<specifics>
## Specific Ideas

- **DOM order is the LCP guard.** The mascot must be DOM-second (visually above via flex order), so Lighthouse can't pick the 88px gradient block as LCP. If a Phase 2 plan reverses this (mascot first in DOM), it breaks HERO-06.
- **The 28px hero button radius is a design-system-locked value** — `border-radius: 28px` is explicit in §1 of the spec. Don't approximate with `rounded-2xl` / `rounded-3xl` / `rounded-full`. Either use `rounded-[28px]` or add a CVA variant; either way the literal `28px` ends up in the output CSS.
- **The `from-primary to-[#14b8a6]` gradient class is the literal pattern** from `<QuibsAvatar>` source — Phase 2 reuses the exact gradient shape, not "something close". The hex `#14b8a6` is the design-system "Primary light" token (§2); don't substitute an oklch lerp.
- **`#waitlist` is the cross-phase anchor**. Phase 2 ships it as a placeholder section; Phase 3 ships it as the form. Both phases land at the same DOM `id`. This is deliberate so the smooth-scroll behavior is identical across phases and the hero CTA's href never has to change.
- **Footer hrefs go to 404 in Phase 2 and that's fine.** No env flag, no conditional rendering, no clever Phase-2-only redirect. Phase 5 wires the routes; the Footer component is not touched. Lighthouse runs only on `/`.
- **Lucide icon stroke is 1.75px** per design-system §1 sidebar-icons rule — the same convention applies to the Why Quibly icons. lucide-react default is 2px; pass `strokeWidth={1.75}`.
- **Founder paragraph has no italic, no quote marks, no avatar in v1** (D-15). If a future iteration adds a byline, it's a one-line edit.
- **No motion in Phase 2.** `tw-animate-css` is installed but unused here. Reduces Lighthouse + a11y verification surface.
- **Lighthouse CI was Phase 1's deferred item** (Phase 1 CONTEXT `<deferred>`) — Phase 2 wires it because SC #4 depends on it. Phase 1 linked the Vercel project; Phase 2 turns the gate on.

</specifics>

<deferred>
## Deferred Ideas

- **Q-face dot wave/blink animation** — flagged in CLAUDE.md ("subtle CSS keyframe wave/blink on the Q-face dots"). Decision (D-23): zero motion in v1. Revisit post-launch as visual polish if the static hero feels flat. When added: must wrap in `@media (prefers-reduced-motion: no-preference)`, must not delay LCP, must not be the LCP candidate itself.
- **Hero background sophistication** — Phase 2 ships a subtle radial gradient. Future iteration could add SVG decorations (floating dots, brand pattern), or theme-aware variants. Out of scope for v1; gradient is the ceiling.
- **Footer maturity signals** — social icons (X, LinkedIn), contact mailto, status page link — deferred until accounts/pages exist (D-20). When Quibly opens public socials post-launch, swap the minimal footer for a fuller version on the launched marketing-app, not retrofit here.
- **Live signup counter** — V2-01 / Phase 7 conditional. Already deferred in roadmap; flagged here only to confirm it does NOT belong above-the-fold in Phase 2's hero.
- **Founder photo/byline** — D-15 ships without. If founder later wants attribution, single edit; not a Phase 2 task.
- **A/B test variants of headline / sub-headline / CTA copy** — V2-05. Stay single-variant in Phase 2.
- **Sub-headline word count A/B** — keep at 15–25 words per HERO-02 in v1; word-count-as-conversion-lever experiment is v2.
- **`size="hero"` Button variant (CVA) generalized for Phase 3+** — CD-04 prefers CVA so Phase 3's form submit button reuses the variant. If Phase 2 ships ad-hoc Tailwind classes instead, Phase 3 will revisit.
- **Placeholder section copy** — Phase 2 ships a draft "Coming soon — waitlist opens in Phase 3" message inside `<PlaceholderFormSection>`. This visible-only-in-preview copy is replaced wholesale by Phase 3's form. Don't agonize over its wording.

</deferred>

---

*Phase: 2-Static Landing Page (No Form)*
*Context gathered: 2026-04-27*
