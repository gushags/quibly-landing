# Phase 3: Email Capture Form (Stub Action) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-27
**Phase:** 03-email-capture-form-stub-action
**Areas discussed:** Form placement strategy, Success / error state UX, Stub Server Action triggers, Test toolchain introduction

---

## Form placement strategy

### Q1: Where should the email form actually render on the page?

| Option | Description | Selected |
|--------|-------------|----------|
| Section only; hero scrolls down | One `<WaitlistForm>` inside `<WaitlistFormSection>` at `id="waitlist"`. Hero CTA reverts to `<a href="#waitlist">` smooth-scroll. Lowest-risk default for an unknown brand with no socials/screenshots — lets `<WhyQuibly>` + `<FounderVoice>` persuade before the ask. Zero LCP risk. Smallest Phase 2 → Phase 3 diff. | ✓ |
| Hero only; section becomes anchor target | Form moves UP into the hero. Above-fold forms convert higher for KNOWN brands (~20–30% lift), but Quibly is cold pre-launch. Forces re-verifying HERO-06 against added input + pill + consent microcopy chrome above the fold on 320×568. | |
| Two forms (hero + section), shared action | Both locations render `<WaitlistForm>` calling the same Server Action. Catches scroll-back visitors at the second touchpoint (~10–15% modest lift). Costs: doubled focus order, possible state desync, double the test surface. | |

**User's choice:** Section only; hero scrolls down (Recommended)
**Notes:** Initial framing of option 2 as "highest conversion" was overconfident — research is mixed; for cold pre-launch brands, the section-only path wins on risk-adjusted basis. Question was re-presented with corrected framing before answer.

---

### Q2: How should the input and submit button arrange inside the section?

| Option | Description | Selected |
|--------|-------------|----------|
| Stacked everywhere | Input full-width, button below, both bound by `max-w-md`. Same on mobile and desktop. Trivially satisfies MOB-02 ≥48px. Smallest Lighthouse risk. | ✓ |
| Horizontal on ≥sm, stacked on mobile | Mailchimp/Substack inline shape on desktop. Costs: input border-radius + 28px pill awkward; error placement fiddly across the row. | |
| Horizontal everywhere | Cleanest visual but mobile (320×480) shrinks input to ~150px and risks tap target. Not recommended for mobile-first. | |

**User's choice:** Stacked everywhere (Recommended)

---

### Q3: How should the section's heading and body copy change vs. Phase 2's draft placeholder?

| Option | Description | Selected |
|--------|-------------|----------|
| Claude drafts; founder edits in PR | Claude drafts new heading + 1-line subhead aligned with brand tone (PROJECT.md §Tone). Founder edits in PR before merge. | ✓ |
| Keep Phase 2's draft as-is | Treat Phase 2 placeholder copy as final. Smallest diff but Phase 2 explicitly flagged "replaced wholesale by Phase 3". | |
| User writes copy directly | User provides heading + body text directly; Claude wires markup. | |

**User's choice:** Claude drafts; founder edits in PR (Recommended)

---

## Success / error state UX

### Q1: What does the success state actually look like when it replaces the form?

| Option | Description | Selected |
|--------|-------------|----------|
| Block with checkmark + locked copy + tw-animate-css fade-in | 24–32px teal `<CircleCheck>` → H3 "You're on the list." → "Check your inbox (and spam folder) for confirmation." (POST-02 verbatim). Fades in via `tw-animate-css` (cashes in D-24's reservation). Brand-aligned visual reward. | ✓ |
| Just locked copy, no icon, no animation | H3 + body text only. Smallest scope; risks feeling flat for a key conversion moment. | |
| Form stays disabled + sonner toast | Form remains; sonner fires success message. Violates POST-01 wording; toast can be dismissed leaving disabled form. | |

**User's choice:** Block with checkmark + locked copy + tw-animate-css fade-in (Recommended)

---

### Q2: Where should validation errors vs server errors surface?

| Option | Description | Selected |
|--------|-------------|----------|
| Validation inline, server errors via sonner | Zod failures render `<p role="alert">` below input with aria-invalid; typed value preserved (FORM-06). Server errors fire sonner toast; form stays mounted, button re-enables. Two surfaces because they need different recovery actions. | ✓ |
| Both surfaces inline below input | Same `<p role="alert">` handles both. Smaller component, no sonner needed for errors. Risk: server-error copy at validation-error position confuses retry vs. fix-input UX. | |
| Both surfaces via sonner toast | Even validation errors fire sonner. Risk: dismissed before read; mobile users miss it; violates FORM-06's inline-error spirit. | |

**User's choice:** Validation inline, server errors via sonner (Recommended)

---

### Q3: What does the pending/loading state look like during submit?

| Option | Description | Selected |
|--------|-------------|----------|
| Button: Loader2 spin + "Joining..."; input: disabled | Submit label flips to "Joining..." with `<Loader2>` spinning via `animate-spin`. Both input and button disabled. Driven by `useActionState`'s `pending`. Minimal motion. | ✓ |
| Button: spinner only, no copy change; input: disabled | Spinner without label change. Cleaner visually; loses explicit work-happening signal for screen readers. | |
| Button only, input stays editable | Disable just button. Breaks idempotency: editing during submit means displayed input no longer matches what was sent. | |

**User's choice:** Button: Loader2 spin + "Joining..."; input: disabled (Recommended)

---

### Q4: What does the `<noscript>` fallback (FORM-08) actually deliver?

| Option | Description | Selected |
|--------|-------------|----------|
| Native form posts, server-rendered success | `<form action={joinWaitlistAction}>` works natively without JS in Next 16. Action runs server-side; Next.js re-renders page with action result; same success block server-rendered. Costs nothing extra. | ✓ |
| Native form posts + minimal `<noscript>` banner | Same progressive-enhanced submit, plus banner above form telling JS-off users that submit works but lacks animation. | |
| `<noscript>` redirects to `mailto:hello@useQuibly.com` | Bypass action when JS off; surface mailto. Risk: not a real waitlist signup; needs `hello@` provisioned (Phase 4); requires human triage. | |

**User's choice:** Native form posts, server-rendered success (Recommended)

---

## Stub Server Action triggers

### Q1: How should the stub action decide which branch to return for a given submission?

| Option | Description | Selected |
|--------|-------------|----------|
| Deterministic by email pattern | `dup@example.com` → already-subscribed; `err@example.com` → server error; `slow@example.com` → 1.5s delay + success; else success. Easy to demo, repeatable in Playwright, no UI dev tools. Phase 4 deletes trigger logic. | ✓ |
| Query-param override (`?stub=duplicate\|error\|slow`) | Any email + URL param forces branch. Cleanest separation, but URL params get cached/shared and production code path branches on a request URL. | |
| Always success (no triggers) | Stub always returns success. Smallest stub code; but the success/error UX (D-B1, D-B2, D-B3) can't be exercised end-to-end this phase. | |

**User's choice:** Deterministic by email pattern (Recommended)

---

### Q2: What's the action's return-shape contract that Phase 3 commits to (and Phase 4 must preserve)?

| Option | Description | Selected |
|--------|-------------|----------|
| Discriminated union | `{ status: 'success', duplicate?: boolean } \| { status: 'error', message?: string, fieldErrors?: Record<string, string> }`. Tagged union narrows cleanly in TS. Phase 4 keeps shape exactly. | ✓ |
| Flat `{ ok, error? }` | Simpler. Loses validation-vs-server distinction; Phase 4's richer failure modes (rate-limit, disposable domain) force a refactor. | |
| Throw on failure, return success-shape on success | Idiomatic in some examples; doesn't compose with `useActionState`'s typed result. Errors surface as React error boundaries instead of inline UI. Doesn't satisfy FORM-09. | |

**User's choice:** Discriminated union (Recommended)

---

### Q3: What does honeypot/time-trap rejection actually return? (SPAM-01 / SPAM-02 mandate "silent" rejection)

| Option | Description | Selected |
|--------|-------------|----------|
| Return success-shape; no contact written | Bot fills honeypot or submits in <2s → action returns `{ status: 'success' }`, takes no other action. Bot sees success block, can't distinguish from real success. Standard 2026 defense-in-depth; tiny false-positive risk for fast humans is acceptable per spec. | ✓ |
| Return error-shape with no message | Returns `{ status: 'error' }` with no inline or toast text. Form looks broken to bot; same broken state hits any human edge case (autofill submits in <2s) with zero recovery affordance. | |
| Return success-shape; log to console for dev visibility | Same as recommended plus `console.warn`. In Phase 4 becomes server-side analytics event ('bot_rejected'). | |

**User's choice:** Return success-shape; no contact written (Recommended)
**Notes:** CONTEXT.md `<deferred>` rejects the dev `console.warn` variant explicitly — Phase 3's stub stays semantically identical to Phase 4's production silent-success behavior. Phase 4 adds the analytics event when wiring observability.

---

## Test toolchain introduction

### Q1: What test toolchain ships in Phase 3?

| Option | Description | Selected |
|--------|-------------|----------|
| Both: Vitest unit tests for action + Playwright e2e for UX | Add `vitest + @testing-library/react + happy-dom` (CLAUDE.md stack). Vitest covers action branches in isolation; Playwright covers user-journey specs. Each layer tests what it's good at. | ✓ |
| Playwright e2e only (already installed) | No Vitest. Test everything through the browser. Smaller dep footprint, but every test pays browser-startup cost; isolated branches (e.g., honeypot reject) require gymnastics; no good way to exercise silent-reject (returns success-shape). | |
| Vitest unit tests only, defer Playwright form coverage | Action covered, but no e2e form journey tests this phase. Risk: success-state fade-in, inline error placement, sonner trigger are UI behaviors only e2e can verify. | |

**User's choice:** Both: Vitest unit tests for action + Playwright e2e for UX (Recommended)

---

### Q2: Should the new test layers block PR merge in CI?

| Option | Description | Selected |
|--------|-------------|----------|
| Both required (Vitest + Playwright on PR) | GitHub Actions runs both on every PR; both required for branch protection (same pattern as Phase 2 D-34 Lighthouse CI). Catches form regressions before Phase 4. ~2–3 min Playwright CI cost. | ✓ |
| Vitest required, Playwright advisory | Unit tests gate merge; e2e runs on PR but doesn't block. Lower CI minutes; flaky e2e or real UX regression slips to main. | |
| Neither blocks; tests are local-only this phase | Tests exist, run locally, no CI workflow. Tests rot; gate is the whole point. | |

**User's choice:** Both required (Recommended)
**Notes:** Manual GitHub UI step required to add the new workflow's job names to `main` branch protection — flagged for the plan as a checkpoint task.

---

## Claude's Discretion

The following items were explicitly handed to Claude during planning:

- **CD-01:** Honeypot field name (`website` / `phone` / `company` / `url`).
- **CD-02:** Time-trap timestamp source (hidden input vs `useEffect` mount-time vs signed cookie).
- **CD-03:** Stub artificial delay duration for `slow@example.com` (recommended 1.5s, may tune).
- **CD-04:** Lucide icon sizes (CircleCheck 24–32px, Loader2 16–18px).
- **CD-05:** Scroll-margin offset for `id="waitlist"` (Phase 2 set 64px / `scroll-mt-16`; verify still right with form rendered).
- **CD-06:** Microcopy stacking order under the submit (Launching Summer 2026 locked; Phase 5 adds consent + no-spam — reserve space).
- **CD-07:** Toast duration / position (sonner defaults unless mobile readability tunes).
- **CD-08:** Focus management on success (default: focus the success block heading; `role="status"` / `aria-live="polite"`).
- **CD-09:** Vitest config shape (defineConfig + setupFiles + happy-dom registration — standard CLAUDE.md stack).

---

## Deferred Ideas

- Cloudflare Turnstile (V2-07) — signal-driven trigger only.
- Server-side observability for bot rejection — Phase 4 (`track('bot_rejected')` + structured logs).
- Analytics events (`track('waitlist_signup', { duplicate })`) — Phase 5; `duplicate` flag captured in success result for forward-compat.
- Consent microcopy (LEGAL-06) and "no spam" reassurance (LEGAL-07) — Phase 5; vertical space reserved per CD-06.
- Email typo auto-correction (V2-04) — explicit v2.
- Live signup counter (V2-01 / Phase 7) — gated to ≥50 contacts post-launch.
- A/B test variants of headline / sub-headline / CTA copy (V2-05).
- Email field auto-focus on page load — rejected (LCP-area attention steal + mobile keyboard UX).
- Form state persistence across reloads — out of scope for one field.
- Multi-field expansion (name, role, company size) — explicit FORM-01 violation; v2-or-later only if conversion data demands it.
- Server-side analytics for time-trap false positives — Phase 4 may add when wiring rate-limit observability.
