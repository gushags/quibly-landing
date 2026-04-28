# Phase 3: Email Capture Form (Stub Action) - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Build `<WaitlistForm>` — the first Client Component in this repo — with the full submit UX surface: pending, success (fresh + already-subscribed indistinguishable), inline validation error, server error via toast, idempotent retry. The form is wired to a **stubbed** Server Action at `app/actions/join-waitlist.ts` that:

- Runs **real** Zod email validation
- Runs **real** honeypot rejection (silent, returns success-shape)
- Runs **real** time-trap rejection (~2s threshold, silent, returns success-shape)
- Stubs the success/duplicate/server-error branches via deterministic email-pattern triggers (no Resend yet — that's Phase 4)

The phase replaces `<PlaceholderFormSection>`'s inner body with `<WaitlistForm>` and renames the file `placeholder-form-section.tsx` → `waitlist-form-section.tsx` per Phase 2 CD-07. The outer section wrapper and `id="waitlist"` anchor target are **preserved verbatim** — this is the Phase 2/3 seam locked in Phase 2 D-09.

**In scope:**
- `<WaitlistForm>` Client Component with `useActionState` (FORM-09)
- `app/actions/join-waitlist.ts` stub Server Action (Zod + honeypot + time-trap real; success/duplicate/error stubbed via email patterns)
- Rename `placeholder-form-section.tsx` → `waitlist-form-section.tsx` (CD-07); outer wrapper + `id="waitlist"` + `scroll-mt-16` preserved
- Hero CTA pill flips from disabled `<button aria-disabled>` to `<a href="#waitlist">` smooth-scroll anchor (overrides Phase 2 D-31 for hero only)
- Secondary CTA below `<FounderVoice>` flips from disabled `<button aria-disabled>` to `<a href="#waitlist">` smooth-scroll anchor (overrides Phase 2 D-31 for secondary)
- `<Toaster />` mount in `app/layout.tsx` for sonner error surface
- Vitest + `@testing-library/react` + `happy-dom` toolchain installed (CLAUDE.md stack); covers action branches in isolation
- Playwright e2e specs added for the form journey (success block, validation error, sonner trigger, idempotent retry)
- GitHub Actions workflow runs both test layers on PR; both required as branch-protection status checks on `main`

**Out of scope:**
- Real Resend audience write — Phase 4
- Welcome email send + List-Unsubscribe headers — Phase 4
- Upstash sliding-window rate limit (5/min/IP, 50/day/IP) — Phase 4 (SPAM-03)
- Disposable-domain blocklist — Phase 4 (SPAM-04)
- Privacy-policy / terms route content + consent microcopy — Phase 5 (LEGAL-01..08)
- "No spam, unsubscribe anytime" microcopy — Phase 5 (LEGAL-07)
- Analytics events (`track('waitlist_signup', { duplicate })`, `track('welcome_email_send_error')`) — Phase 5 (ANLY-03..04)
- Server-side bot-rejection observability — Phase 4 (replaces the Phase-3 stub's no-op silent-reject branch)
- Cloudflare Turnstile — V2-07, signal-driven trigger only
- Live signup counter — Phase 7, conditional on audience ≥50
- Hero copy, sub-headline, footer, mascot — locked from Phase 2; not touched

</domain>

<decisions>
## Implementation Decisions

### Form Placement
- **D-01:** **Single form, section-only.** One `<WaitlistForm>` lives inside `<WaitlistFormSection>` at `id="waitlist"`. Hero CTA reverts to `<a href="#waitlist">` smooth-scroll. **This overrides Phase 2 D-31 for the hero only** — the phase-2 placeholder used `<button aria-disabled>` to avoid a no-op self-anchor; in Phase 3 the hero is no longer at `#waitlist`, so the anchor scrolls down to a real form. Preserves H1 LCP guarantee (HERO-06) trivially because no form chrome lands above the fold.
- **D-02:** **Secondary CTA below `<FounderVoice>` also flips back to `<a href="#waitlist">` smooth-scroll** (overrides Phase 2 D-31 for secondary). Same rationale: the secondary CTA is below the form on the page (per D-16's section order: Hero → WaitlistFormSection → WhyQuibly → FounderVoice → SecondaryCTA → Footer), so scrolling back UP to `#waitlist` is meaningful for users who scrolled past.
- **D-03:** **Stacked layout on all viewports.** Input full-width, button on its own line below, both bound by `max-w-md mx-auto`. Identical mobile/desktop. Trivially satisfies MOB-02 ≥48px tap targets. Matches the Phase 2 placeholder's centered-prose container shape so the section's visual frame doesn't shift between phases.
- **D-04:** **`<WaitlistFormSection>` heading + body copy: Claude drafts, founder edits in PR.** Phase 2 shipped placeholder draft copy ("Get notified the moment Quibly opens up." / "One email. Zero spam...") explicitly flagged "replaced wholesale by Phase 3" in the UI-SPEC. Claude drafts new heading + 1-line subhead aligned with PROJECT.md tone (conversational, modern, friendly, confident, playful, energetic, upstart). Treat as draft until PR review.

### Component Architecture
- **D-05:** `<WaitlistForm>` is a **Client Component** (`'use client'`) at `components/waitlist/waitlist-form.tsx`. It owns: `useActionState` binding, the input + submit + honeypot + time-trap hidden inputs, the success-block render, and the inline error render. It does **not** own the section heading/body — those stay in `<WaitlistFormSection>` (RSC).
- **D-06:** `<WaitlistFormSection>` (renamed from `placeholder-form-section.tsx` per CD-07) stays an **RSC**. Composes the heading + body + `<WaitlistForm />`. Outer wrapper, `id="waitlist"`, `scroll-mt-16` preserved verbatim from Phase 2.
- **D-07:** Submit button reuses the existing `size="hero"` Button CVA variant from `components/ui/button.tsx` (Phase 2 D-06 / CD-04 — `rounded-[28px] py-3.5 px-9`). **Zero text-diff** with Phase 2's hero pill (FORM-04 / D-12 locked "Join the waitlist"). Phase 3's only change to the button is wrapping it in a `<form action={joinWaitlistAction}>` and adding `disabled={pending}`.
- **D-08:** **`<Toaster />` mounts in `app/layout.tsx` once.** Sonner's Toaster needs to live at the app root so server-error toasts (D-12) render anywhere on the tree. Use the existing `components/ui/sonner.tsx` wrapper (Phase 1, token-styled). Position bottom-right (sonner default), respects `prefers-reduced-motion` automatically.

### Server Action Contract
- **D-09:** **Action lives at `app/actions/join-waitlist.ts`.** File path locked because Phase 4's gsd-plan-phase will swap the body in place — keeping the path stable means the import in `<WaitlistForm>` doesn't move. Action exports a single named export `joinWaitlistAction` (the function passed to `useActionState`).
- **D-10:** **Return shape = discriminated union, locked through Phase 4.**
  ```ts
  type JoinWaitlistResult =
    | { status: 'success'; duplicate?: boolean }
    | { status: 'error'; message?: string; fieldErrors?: Record<string, string> };
  ```
  - `status: 'success'` is returned for: fresh signup, already-subscribed (POST-03 — indistinguishable from outside, never reveals enumeration), and silent honeypot/time-trap rejection (D-15).
  - `status: 'error'` with `fieldErrors` → renders inline below the input.
  - `status: 'error'` with top-level `message` (no `fieldErrors`) → fires a sonner toast.
  - **Phase 4 preserves this exact shape.** The Client Component never changes when Resend wires in.
- **D-11:** **Stub branches via deterministic email-pattern triggers** (Phase 3 only — Phase 4 deletes this logic):
  - `dup@example.com` → `{ status: 'success', duplicate: true }` (exercises POST-03 already-subscribed path)
  - `err@example.com` → throws / returns `{ status: 'error', message: 'Something went wrong. Try again in a moment.' }` (exercises sonner path)
  - `slow@example.com` → 1500ms `setTimeout`-style delay, then success (exercises pending state visually)
  - any other valid email → `{ status: 'success' }`
- **D-12:** **Server errors surface via sonner**, validation errors inline. Two error surfaces because they need different recovery actions: validation failures (typo, blank, oversized) want fix-the-input; server errors (action threw, network timeout) want retry-as-is. Inline path: `<p role="alert">` below the input in destructive red, `aria-invalid="true"` on input, **typed value preserved** (FORM-06). Sonner copy for server errors: `"Something went wrong. Try again in a moment."`.

### Submit States (UX Contract)
- **D-13:** **Pending state:** button label flips to `"Joining..."`, lucide `<Loader2 className="animate-spin">` to its left, **both input AND button disabled**. Driven by `useActionState`'s `pending` boolean. `animate-spin` is built-in Tailwind — no `tw-animate-css` needed for the spinner. Prevents double-submit and matches FORM-05.
- **D-14:** **Success state:** form unmounts, replaced by a centered block:
  - 24–32px teal `<CircleCheck>` from `lucide-react` (Claude tunes exact size in planning)
  - H3 `"You're on the list."` (Quicksand 700)
  - Body `"Check your inbox (and spam folder) for confirmation."` — **POST-02 verbatim**, no edits
  - Fades in via `tw-animate-css` `animate-in fade-in-50 duration-300` (cashes in Phase 2 D-24's reservation)
  - **Already-subscribed (`duplicate: true`) renders the identical block** — POST-03 mandate. The flag is captured for Phase 5 analytics (`track('waitlist_signup', { duplicate })`) but never affects UI.
- **D-15:** **Honeypot/time-trap silent rejection returns `{ status: 'success' }` shape, no other side effects.** Bot fills honeypot or submits in <2s → action returns success-shape, but writes nothing to the audience (Phase 4: no `resend.contacts.create`), sends no welcome email, fires no analytics event. Bot sees the success block, can't distinguish from real success. Standard 2026 defense-in-depth; tiny false-positive risk for fast-submitting humans is the documented trade-off in `.planning/research/PITFALLS.md` Pitfall 3.

### `<noscript>` / Progressive Enhancement
- **D-16:** **Native `<form action={joinWaitlistAction}>` works without JS.** Next.js 16 Server Actions natively progressive-enhance — on a no-JS submit, Next.js runs the action server-side and re-renders the page. The `<WaitlistFormSection>` reads the action's returned state from the request and renders the same success block server-side. No mailto fallback, no `<noscript>` banner. FORM-08 satisfied by the framework. Researcher must verify this pattern works with the typed discriminated union in Next 16.2 (research flag).

### Test Toolchain (First Test Setup In Repo)
- **D-17:** **Two test layers added in Phase 3.** Vitest + `@testing-library/react` + `happy-dom` (CLAUDE.md stack) for the action branches; Playwright (already installed since Phase 2) for e2e UX flows. Each layer tests what it's good at.
  - **Vitest unit covers:** Zod pass/fail, honeypot triggers silent success, time-trap triggers silent success, the four stub email-pattern branches, the discriminated-union narrowing in TS.
  - **Playwright e2e covers:** pending state visible, success block fades in, validation error inline + value preserved, `err@example.com` triggers sonner, idempotent re-submit (POST-04), hero CTA smooth-scrolls to `#waitlist`, no-JS path (Playwright's `javaScriptEnabled: false` config).
- **D-18:** **Both layers required as PR gates** — same pattern as Phase 2 D-33/D-34 Lighthouse CI.
  - GitHub Actions workflow `.github/workflows/test.yml` (or extend the existing Lighthouse workflow) runs Vitest + Playwright on every PR.
  - **Manual GitHub UI step** (flag in plan as a checkpoint task): add the new test workflow's job names to `main` branch protection's required-status-checks. Same friction as D-34's Lighthouse-CI gate; document in plan.

### Claude's Discretion
- **CD-01:** **Honeypot field name** — `website`, `phone`, `company`, or `url`. Claude picks during planning. Implementation: hidden via `position: absolute; left: -9999px` (not `display: none`, which some bots skip), `tabIndex={-1}`, `autoComplete="off"`. Per SPAM-01.
- **CD-02:** **Time-trap timestamp source** — hidden input populated via `defaultValue={Date.now()}` server-side, vs. client-side `useEffect` mount-time, vs. signed cookie. Claude picks; default to hidden input (simplest, works with progressive enhancement, only weakness is HTML caching which is mitigated by Next 16's RSC dynamic rendering of this section). Per SPAM-02.
- **CD-03:** **Stub artificial delay duration** for `slow@example.com` — 1.5s is the recommendation; Claude tunes if it feels too long or short during dev.
- **CD-04:** **Lucide icon sizes** — `<CircleCheck>` 24–32px, `<Loader2>` 16–18px (matches button text height). Claude tunes.
- **CD-05:** **Scroll-margin offset** for `id="waitlist"` — Phase 2 set CD-06 at `scroll-mt-16` (64px). Claude verifies it still feels right with the form rendered (vs. the placeholder body) and re-tunes if needed.
- **CD-06:** **Microcopy ordering under the submit button** — "Launching Summer 2026" (HERO-05/D-11 locked) is the only Phase-3 microcopy. Phase 5 adds consent microcopy + "no spam" reassurance below it. Claude reserves vertical space (~`mt-3` block) so Phase 5's additions don't shift layout.
- **CD-07:** **Toast duration / position** — sonner defaults (4000ms, bottom-right) unless mobile-readability tuning is needed. Claude picks.
- **CD-08:** **Focus management on success** — when form unmounts and success block mounts, where does focus go? Default: focus the success block's heading (`<h3 tabIndex={-1} ref={...}>` autofocus). Screen-reader announce via `role="status"` or `aria-live="polite"`. Claude implements.
- **CD-09:** **Vitest config** — `defineConfig` shape, `setupFiles` for `@testing-library/jest-dom` matchers, happy-dom registration. Standard CLAUDE.md stack; Claude wires.

</decisions>

<specifics>
## Specific Ideas

- **The form-placement decision (D-01) deliberately overrides Phase 2 D-31's hero piece.** This is not a contradiction — D-31 was the right call when the hero was a no-op self-anchor (the form section was placeholder text). With a real form below the fold, the hero anchor becomes meaningful UX (scrolls a cold visitor down to commit). Document the override in Phase 3 git history.
- **POST-02 success copy is verbatim** — `"You're on the list. Check your inbox (and spam folder) for confirmation."` Don't paraphrase; the requirements file mandates this string. Phase 4's welcome-email subject + body should reference the same "Check your inbox" promise so user expectations line up.
- **The discriminated-union return shape (D-10) is the cross-phase API contract.** Phase 4's plan must NOT change this shape — Phase 4 only swaps the action body. If Phase 4 needs richer error typing (e.g., distinguishing rate-limit from disposable-domain block), it extends `fieldErrors` keys, not the union shape.
- **`<form action={joinWaitlistAction}>` is the Server Action invocation pattern**, NOT `<form onSubmit={...}>` with a `useActionState`'s `formAction` rebinding. Per Next 16.2 docs, `action={joinWaitlistAction}` plus `useActionState` gives you typed state AND progressive enhancement for free. Researcher must verify this with the discriminated-union shape (research flag).
- **Honeypot + time-trap are NOT stubbed.** They're the real Phase 3 defenses and stay live in Phase 4. Only the success/duplicate/error branches are stubbed.
- **Already-subscribed must be visually identical to fresh-signup** (POST-03 enumeration defense). The `duplicate: true` flag on the success result is for Phase 5's analytics event payload — the UI never reads it.
- **`react-hook-form` is BANNED by CLAUDE.md "What NOT to Use"** — overkill for one field. Use native `<form>` + `useActionState` + Zod. Don't reach for it during planning.
- **Toast UI uses the existing Phase 1 sonner mount.** Don't introduce a different toast library or custom toast component.
- **The new Vitest gate is the second branch-protection status check** added to `main` (after Phase 2's Lighthouse CI). Keep an eye on CI minute usage; the e2e Playwright run is the slowest piece (~2–3 min).

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project planning
- `CLAUDE.md` — full Recommended Stack (Zod 4, Next 16.2 Server Actions, sonner, lucide-react, Vitest + RTL + happy-dom), "Specific Architectural Decisions" §"Email submission path", "What NOT to Use" §react-hook-form / Framer Motion / GA4 / GTM.
- `.planning/PROJECT.md` — tagline, audience, tone of voice ("conversational, modern, friendly, confident, playful, energetic, upstart"), Resend Audiences as source of truth.
- `.planning/REQUIREMENTS.md` §Email Capture Form (FORM-01..09), §Post-Submit Experience (POST-01..04), §Spam/Bot Protection (SPAM-01..02 — SPAM-03..04 are Phase 4), §Mobile-First Layout (MOB-01..04 carry through).
- `.planning/ROADMAP.md` §"Phase 3: Email Capture Form (Stub Action)" — five success criteria, especially SC #1 (in-place success), SC #2 (idempotency + no enumeration), SC #3 (`<noscript>` fallback), SC #4 (silent bot rejection), SC #5 (Zod server-side + typed `useActionState`).
- `.planning/research/SUMMARY.md` §"Phase 3" — rationale ("Wire full UX against a stub action; debugging round-trip + already-subscribed branch is fastest before Resend is in the loop").
- `.planning/research/PITFALLS.md` Pitfall 3 (bot poisoning) — defense-in-depth rationale; Phase 3's honeypot + time-trap are the front line, Phase 4 layers rate-limit + disposable-domain block on top.
- `.planning/research/STACK.md` — Zod 4 schema patterns, Next 16.2 Server Action discriminated-union return shapes.
- `.planning/research/ARCHITECTURE.md` — Server Action / progressive-enhancement architecture.
- `.planning/STATE.md` — accumulated decisions (no marketing cookies, no consent banner, single opt-in).

### Prior phase context (this repo)
- `.planning/phases/02-static-landing-page-no-form/02-CONTEXT.md` — **must-read.** D-01..D-07 (hero composition that Phase 3 inherits), **D-09 (cross-phase anchor seam — DO NOT CHANGE)**, D-10 (secondary CTA target), D-11 (microcopy), **D-12 (FORM-04 / Join the waitlist copy locked)**, D-17 (vertical rhythm), **D-31 (button-vs-anchor — Phase 3 D-01/D-02 partially override this)**, **CD-04 (Button CVA variant)**, **CD-07 (file rename `placeholder-form-section.tsx` → `waitlist-form-section.tsx`)**, D-32 (footer tap targets), D-33/D-34 (Lighthouse CI gate + branch-protection pattern Phase 3 D-18 mirrors).
- `.planning/phases/02-static-landing-page-no-form/02-UI-SPEC.md` — locked typography, button radii (28px hero pill), color tokens, hero copy, `<PlaceholderFormSection>` heading/body marked "draft — replaced wholesale by Phase 3".
- `.planning/phases/01-scaffold-brand-token-parity/01-CONTEXT.md` — Phase 1 token strategy, sonner mount pattern, env validation, gitleaks setup.

### Design contract (in `marketing-app`, must read for token + button shape parity)
- `/Users/jeff/repos/marketing-app/docs/superpowers/specs/2026-04-14-quibly-design-system.md` — §1 (Button Shape: 28px pill — hero CTA reused for submit), §2 (Color Scheme: primary teal `#0D9488`, destructive `oklch(0.577 0.245 27.325)` for inline-error red), §3 (Brand Identity tone for the heading/body draft).
- `/Users/jeff/repos/marketing-app/docs/superpowers/specs/2026-04-14-quibly-design-reference.html` — visual mockup reference; useful for confirming submit pill sits on white surface (`<WaitlistFormSection>` is below the hero gradient per Phase 2 D-22).

### External docs
- [Next.js 16 Server Actions](https://nextjs.org/docs/app/api-reference/functions/server-actions) — `useActionState`, progressive enhancement, typed return values.
- [React 19 `useActionState`](https://react.dev/reference/react/useActionState) — pending boolean, prevState, action signature.
- [Zod 4 `z.string().email()`](https://zod.dev) — schema with `.email().max(254)` for the email-field validation.
- [Tailwind `animate-spin`](https://tailwindcss.com/docs/animation) — built-in for the Loader2 pending spinner.
- [`tw-animate-css` `fade-in`](https://github.com/Wombosvideo/tw-animate-css) — for the success-block fade-in (D-14).
- [`@testing-library/react` v16 (React 19)](https://testing-library.com/docs/react-testing-library/intro) — `@testing-library/react` ^16 is React-19 compatible.
- [happy-dom](https://github.com/capricorn86/happy-dom) — Vitest DOM env, faster than jsdom for this scale.
- [Sonner `<Toaster />` placement](https://sonner.emilkowal.ski/) — root mount, position, prefers-reduced-motion.
- [Lucide `CircleCheck`, `Loader2`](https://lucide.dev/icons/) — exact icon names + stroke conventions per Phase 2 design-system §1 (1.75px stroke).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`<Button size="hero">`** at `components/ui/button.tsx:38` — CVA variant `"h-auto rounded-[28px] px-9 py-3.5 text-base"`. Submit button reuses this verbatim — zero new variant added.
- **`<Input>`** at `components/ui/input.tsx` — shadcn input, token-styled in Phase 1. Used as the email field with `type="email" inputMode="email" autoComplete="email"` (FORM-02).
- **`<Label>`** at `components/ui/label.tsx` — shadcn label, token-styled. Visible label or `sr-only` per UI-SPEC; Claude picks (default: visible label "Email" above input for accessibility, can be `sr-only` if design demands compactness).
- **`<Toaster>`** at `components/ui/sonner.tsx` — shadcn Sonner wrapper, token-styled in Phase 1 (`theme={theme as ToasterProps["theme"]}` + Quibly tokens). Mounts in `app/layout.tsx`.
- **`cn()`** at `lib/utils.ts` — clsx + tailwind-merge.
- **`lib/env.ts`** — Zod-validated env from Phase 1; Phase 3 doesn't add new env (Phase 4 adds `RESEND_API_KEY` etc.).

### Established Patterns
- **`<Button asChild>` for anchor-as-button** — Phase 2 hero pill is currently `<button aria-disabled>`; Phase 3 flips to `<Button asChild size="hero"><a href="#waitlist">Join the waitlist</a></Button>` (preserves visual identity, gets pill styling, becomes a real link).
- **Token-driven shadcn components** — Button reads `bg-primary` / `text-primary-foreground` / `--radius-*`; Input reads `border` / `bg-background` / `text-foreground`. Phase 3 doesn't add tokens.
- **`@/`-aliased imports** — `@/components/waitlist/waitlist-form`, `@/components/sections/waitlist-form-section`, `@/app/actions/join-waitlist`. Mirror.
- **`'use client'` only when required** — Phase 1 + Phase 2 are 100% RSC. Phase 3 introduces `'use client'` for `<WaitlistForm>` only. `<WaitlistFormSection>` stays RSC (composes the client component but doesn't render hooks).
- **Phase 2's branch-protection pattern (D-34)** — required status check added via GitHub UI; document as a manual checkpoint task. Phase 3 D-18 follows the same pattern for the new test workflow.

### Integration Points
- **`app/page.tsx`** — Phase 2's composition: `<Hero /> → <PlaceholderFormSection /> → <WhyQuibly /> → <FounderVoice /> → <SecondaryCTA /> → <Footer />`. Phase 3 changes the import: `<PlaceholderFormSection>` → `<WaitlistFormSection>`. **One line in page.tsx.**
- **`app/layout.tsx`** — Phase 3 adds `<Toaster />` mount (sonner). Phase 5 will add `<Analytics />` and `<SpeedInsights />` to this same layout.
- **`components/sections/hero.tsx`** — Phase 2 hero CTA is a disabled `<Button>`. Phase 3 swaps to `<Button asChild size="hero"><a href="#waitlist">Join the waitlist</a></Button>` (D-01).
- **`components/sections/secondary-cta.tsx`** — Phase 2 secondary CTA is also a disabled `<Button>`. Phase 3 swaps the same way (D-02).
- **`components/sections/placeholder-form-section.tsx` → `components/sections/waitlist-form-section.tsx`** — file rename per CD-07. Outer `<section id="waitlist" className="scroll-mt-16 py-16 md:py-24">` and inner `<div className="mx-auto max-w-prose px-6 text-center">` preserved verbatim. Body inside swaps from placeholder paragraphs + disabled button to `<WaitlistForm />` (which conditionally renders form OR success block).
- **`app/actions/join-waitlist.ts`** — NEW. Stub Server Action with real Zod + honeypot + time-trap, stubbed branch logic by email pattern. Phase 4 swaps the body without changing the file path or the exported function signature.
- **`components/waitlist/waitlist-form.tsx`** — NEW. `'use client'`. Owns `useActionState`, the form markup, the success block, the inline error rendering, sonner toast invocation on server-error results.
- **`vitest.config.ts`** — NEW. Standard CLAUDE.md stack config.
- **`.github/workflows/test.yml`** (or extension of existing Lighthouse workflow) — NEW. Runs Vitest + Playwright on PR.

</code_context>

<deferred>
## Deferred Ideas

- **Cloudflare Turnstile** (V2-07) — Layer 4 spam defense. Phase 3 ships honeypot + time-trap; Phase 4 adds Upstash rate limit + disposable-domain block. Turnstile only if signal-driven thresholds in `.planning/research/SUMMARY.md` fire.
- **Server-side observability for bot rejection** — Phase 3's silent-reject branch is a no-op (no console output, no analytics). Phase 4 adds `track('bot_rejected')` and structured server logs. Phase 3's CD-02 hint (`console.warn` in dev) is rejected — no console output to keep stub semantically identical to Phase 4's silent-success behavior.
- **Analytics events** (`track('waitlist_signup', { duplicate })`) — Phase 5. The `duplicate` flag in the success result is captured in Phase 3's return shape so Phase 5 can wire the analytics event without changing the action signature.
- **Consent microcopy** ("By joining, you agree to our Privacy Policy and Terms" — LEGAL-06) and **"No spam, unsubscribe anytime"** reassurance (LEGAL-07) — Phase 5. Phase 3's CD-06 reserves vertical space below the locked "Launching Summer 2026" microcopy so Phase 5's additions don't shift layout.
- **Email typo auto-correction** (`gmial.com` → `gmail.com` suggestion — V2-04) — explicitly v2.
- **Live signup counter** ("Join 200+ others" — V2-01 / Phase 7) — gated to ≥50 contacts post-launch.
- **A/B test variants** of headline / sub-headline / CTA copy (V2-05) — single-variant in v1.
- **Email field auto-focus on page load** — would steal LCP-area attention from the H1 and disrupt mobile keyboard pop-up UX. Don't add. If a v2 experiment wants it, gate behind a viewport check (desktop only) with explicit research.
- **Form state persistence across page reloads** (e.g., remembering a partial input in localStorage) — out of scope; not justified for a single-field form.
- **Multi-field expansion** (name, role, company size) — explicitly out of scope per FORM-01 ("Single email input field"). Single-field forms convert ~2–3× higher per PROJECT.md.
- **Server-side analytics for time-trap false positives** — interesting if the trap rejects measurable human traffic; Phase 4 can add a counter when implementing rate-limit observability. Defer here.

</deferred>

---

*Phase: 03-email-capture-form-stub-action*
*Context gathered: 2026-04-27*
