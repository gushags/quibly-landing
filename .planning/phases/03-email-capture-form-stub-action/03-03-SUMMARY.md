---
phase: 03-email-capture-form-stub-action
plan: 03
subsystem: ui-form
tags: [client-component, useActionState, sonner, honeypot, time-trap, react-19, rsc-prop-pattern, vitest, rtl]

# Dependency graph
requires:
  - phase: 03-email-capture-form-stub-action
    plan: 02
    provides: joinWaitlistAction (locked path) + JoinWaitlistResult discriminated-union (locked through Phase 4) + FORM-06 echo via top-level submittedValues
  - phase: 02-landing-page-skeleton
    plan: composition
    provides: Phase 2 cross-phase anchor seam (id="waitlist", scroll-mt-16 outer wrapper) + Button size="hero" CVA variant + Input/Label/Toaster shadcn primitives
provides:
  - components/waitlist/waitlist-form.tsx — first 'use client' file in repo (D-05); owns useActionState + form markup + success block + inline error + sonner toast effect + CD-08 focus management
  - components/sections/waitlist-form-section.tsx — RSC composing heading + sub-copy + WaitlistForm (D-06); CD-02 honored via RSC-prop variant of "hidden input populated server-side"
  - app/layout.tsx — <Toaster /> mounted once at root (D-08), inside <body> after {children}
  - app/page.tsx — WaitlistFormSection wired into the section composition (no PlaceholderFormSection orphans)
  - components/sections/placeholder-form-section.tsx — DELETED (CD-07 file rename)
  - tests/unit/waitlist-form.test.tsx — 6 RTL specs covering render-time invariants (FORM-01, FORM-02, FORM-04, FORM-09, SPAM-01, HERO-05)
  - Pitfall 2 mitigation wired: renderedAt: number prop flows from RSC parent to Client Component; no Date.now() inside the Client Component
  - POST-03 enumeration defense: render code does NOT branch on state.duplicate
  - POST-04 browser-level idempotency primitive: disabled={pending} on input + button (Plan 05 e2e asserts the actual no-op)
  - FORM-06 echo: defaultValue={state.submittedValues?.email} preserves typed value on validation error (Pitfall 1 React 19 fix)
  - SPAM-01 honeypot: inline-style off-screen positioning (NOT display:none, NOT Tailwind class)
  - D-13 pending UX: Joining... label + Loader2 spinner + both input/button disabled
  - D-14 success state: form unmounts, replaced by CircleCheck + H3 + POST-02 body, fades in via tw-animate-css animate-in fade-in-50 duration-300
  - D-12 server-error toast effect: useEffect watching state.status === error AND state.message AND NOT state.fieldErrors
affects:
  - 03-04-anchor-flips (hero + secondary CTA targets — id="waitlist" is the seam this plan ships)
  - 03-05-playwright-form-specs (Playwright drives the form's e2e success/error/pending transitions)
  - 03-06-no-js-progressive-enhancement (native form action fallback when JS disabled)
  - 04-resend-integration (action body swap — surface/import/render unchanged)
  - 05-analytics (track('waitlist_signup', { duplicate }) consumes state.duplicate captured in this phase)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - First 'use client' boundary in the repo (D-05) — the boundary is the form, not the section
    - RSC owns request-time impurity (Date.now()), passes stable primitive prop to Client Component (Pitfall 2)
    - useActionState bound to a discriminated-union return type — narrowing on state.status drives all UI branches
    - Honeypot inline-style off-screen positioning (NOT Tailwind sr-only, NOT display:none)
    - Hidden time-trap input pattern: <input type="hidden" name="renderedAt" value={renderedAt} /> (value, not defaultValue — must update if prop changes)
    - Sonner toast surface routed via useEffect watching state identity (Strict-Mode-safe — guard fails on initial null state)
    - CD-08 focus management on async render: ref + tabIndex={-1} + useEffect on state.status === 'success'
    - tw-animate-css via Tailwind utilities (animate-in fade-in-50 duration-300) for success block fade-in (no Framer Motion)
    - eslint-disable react-hooks/purity inline for intentional per-request RSC impurity (single line, justified comment)
  removed: []

key-files:
  created:
    - components/waitlist/waitlist-form.tsx (179 lines)
    - components/sections/waitlist-form-section.tsx (64 lines)
    - tests/unit/waitlist-form.test.tsx (76 lines)
  modified:
    - app/page.tsx (PlaceholderFormSection -> WaitlistFormSection import + JSX)
    - app/layout.tsx (added Toaster import + mount inside <body> after {children})
  deleted:
    - components/sections/placeholder-form-section.tsx (renamed per CD-07)

key-decisions:
  - "D-05 (locked): waitlist-form is the Client Component boundary; section stays an RSC. Focus, state, sonner effect all live in the form. The section owns composition and the request-time timestamp."
  - "CD-02 + Pitfall 2 substitution (intentional discretion, NOT scope reduction): the time-trap renderedAt is computed in the parent RSC and passed as a prop instead of inside the Client Component. JSDoc + inline comment audit trail in waitlist-form-section.tsx make this auditable."
  - "POST-03 enumeration defense enforced by code review + grep audit: state.duplicate appears nowhere in render JSX. The flag is type-visible for Phase 5 analytics but never read by the UI."
  - "POST-04 browser-level idempotency primitive: disabled={pending} on BOTH the email input AND the submit button. Plan 05 e2e asserts the second click during pending is a no-op."
  - "D-08: single Toaster mount in app/layout.tsx after {children}. Sonner uses defaults (bottom-right, 4000ms duration) per CD-07 — no props passed to <Toaster />."
  - "Inline eslint-disable on Date.now() in waitlist-form-section.tsx: React 19's react-hooks/purity rule flags impure functions in render; the per-request impurity is the explicit purpose of the time-trap timestamp. Justified single-line disable preserves the rule everywhere else."

patterns-established:
  - "Pattern: Client Component receives request-time values via props (RSC -> primitive prop -> Client). Avoid the React 19 hydration mismatch from in-component Date.now()."
  - "Pattern: useActionState + discriminated-union return type. Narrowing on state.status drives idle / success / inline-error / server-error renders without conditional chains."
  - "Pattern: sonner toast surface via useEffect on state identity. Guard fails on null initial state; each action resolution creates a new state object so the effect re-runs once per error."
  - "Pattern: honeypot inline-style off-screen positioning. NOT display:none (some bots skip those), NOT visibility:hidden (some screen readers expose), NOT Tailwind sr-only (also clips screen readers consistently — but spec specifies inline)."

requirements-completed:
  - FORM-01
  - FORM-02
  - FORM-04
  - FORM-05
  - FORM-09
  - POST-01
  - POST-02
  - POST-04

# Metrics
duration: ~6min
completed: 2026-04-28
task_count: 4
file_count: 6
---

# Phase 03 Plan 03: WaitlistForm Client Component + section rename + Toaster mount + page wiring + RTL tests Summary

**One-liner:** Live waitlist form on `/` driven end-to-end by the stub Server Action — Client Component owns useActionState binding + form markup + success block + inline error + sonner effect; RSC parent supplies the time-trap timestamp via a typed `renderedAt: number` prop (Pitfall 2 / CD-02 RSC-prop variant of "hidden input populated server-side"); 6 RTL specs cover the static surface; total 14/14 unit tests pass across the phase.

## Final Test Counts

- **Unit suite (combined):** 14/14 tests pass
  - Plan 02: `tests/unit/join-waitlist-action.test.ts` — 8/8 pass
  - Plan 03: `tests/unit/waitlist-form.test.tsx` — 6/6 pass (this plan)
- **Runtime:** ~2.05s for the full unit suite (slow@example.com 1500ms branch is the dominant cost in Plan 02)
- **TypeScript:** `npx tsc --noEmit` exit 0 (discriminated-union narrowing in component + tests type-checks)
- **ESLint:** `npm run lint` exit 0 (single justified `react-hooks/purity` inline disable — see Deviations)
- **Build:** `npm run build` succeeds when env secrets are present (verified locally with `.env.example` stub values; production-build-from-empty-env is the Plan 01 hard-crash design intent)

## Pitfall 2 Mitigation Confirmed

`renderedAt` is computed via `Date.now()` in `components/sections/waitlist-form-section.tsx` (RSC, no client directive at file top) at request time, then passed as a typed `renderedAt: number` prop to the Client Component, which renders `<input type="hidden" name="renderedAt" value={renderedAt} />`.

The Client Component (`components/waitlist/waitlist-form.tsx`) does NOT call `Date.now()` ANYWHERE — verified by grep:

```bash
$ grep -c 'Date.now()' components/waitlist/waitlist-form.tsx
0
```

This avoids the React 19 hydration warning that would fire if the Client Component computed the timestamp inline (server renders one value at SSR time, client re-renders a different ms-later value on hydration).

## CD-02 Honored via the RSC-Prop Variant

CONTEXT.md CD-02 instructs the time-trap timestamp source should be a "hidden input populated server-side" (Claude picks; default to hidden input). This plan honors CD-02 by:

1. Computing `Date.now()` in `WaitlistFormSection` (the RSC parent) at request time on the SERVER
2. Passing it down as a primitive `renderedAt: number` prop to `<WaitlistForm />`
3. Rendering `<input type="hidden" name="renderedAt" value={renderedAt} />` inside the Client Component

This is the RSC-prop variant of "server-side population" — chosen over the simpler in-component default because that triggers the React 19 hydration mismatch documented in RESEARCH.md Pitfall 2. The intent of CD-02 (hidden input, server-time value, ~2s threshold rejection in the action) is fully preserved.

The audit trail is visible in three places (verified by grep):

```bash
$ grep -c 'CD-02' components/sections/waitlist-form-section.tsx
3
$ grep -c 'Pitfall 2' components/sections/waitlist-form-section.tsx
3
$ grep -c 'D-06' components/sections/waitlist-form-section.tsx
2
```

JSDoc block + inline comment + inline eslint-disable justification all cite the discretion exercise so any reviewer (human or future Claude) can immediately see why `Date.now()` lives in the RSC body and not the Client Component.

## POST-03 Enumeration Defense Confirmed

The success render branch in `components/waitlist/waitlist-form.tsx` does NOT read `state.duplicate`. Verified by grep audit (excludes comment lines):

```bash
$ grep -nE 'state\.duplicate|state\?\.duplicate' components/waitlist/waitlist-form.tsx | grep -v '^[0-9]*: *[*/]'
(no output — zero matches outside comments)
```

The duplicate flag exists in the discriminated union (Plan 02 D-10 lock) and will be captured for Phase 5 analytics (`track('waitlist_signup', { duplicate })`). It is intentionally orphaned from the render code so already-subscribed users see the visually identical success block — defeating email-enumeration attacks.

Plan 05 Playwright spec asserts the visual identity from the user's POV.

## POST-04 Browser-Level Idempotency Primitive

Both the email input AND the submit button carry `disabled={pending}`:

```tsx
// Input
<Input ... disabled={pending} ... />

// Button
<Button type="submit" size="hero" variant="default" disabled={pending} ...>
```

This is the browser-level no-op primitive that Plan 05's e2e spec asserts (the second click during pending should fire no second action invocation). The double-disable defends against:

- Rapid double-click (button click handler races)
- Enter-key-during-submit (input still focused but disabled)
- Programmatic resubmit via JS (form action callback ignores disabled inputs)

## CLAUDE.md Banned-Library Guard Confirmed

The Client Component does not import any of the three banned libraries from CLAUDE.md "What NOT to Use":

```bash
$ grep -E "react-hook-form|framer-motion|next-themes" components/waitlist/waitlist-form.tsx
(no matches — guard satisfied)
```

The form uses only:
- React 19 native: `useActionState`, `useEffect`, `useRef`
- shadcn copy-paste primitives: `<Button>`, `<Input>`, `<Label>` (already in repo)
- sonner: `toast` named export
- lucide-react: `CircleCheck`, `Loader2` (single-icon imports — tree-shaken)
- The locked action from `@/app/actions/join-waitlist`

No form library. No animation library. No theme library.

## Plan 05 Driving Path

Plan 05's Playwright e2e specs drive the form via the live page route:

```
URL: /  (the waitlist landing page)
Form section: scroll target #waitlist
Form selectors:
  - input[name="email"]  (or screen.getByPlaceholderText('you@example.com'))
  - button[type="submit"] (or screen.getByRole('button', { name: 'Join the waitlist' }))
  - input[name="website"] (honeypot — usually skipped by tests; bot defense)
  - input[name="renderedAt"] (time-trap — usually skipped; should auto-populate)
```

The form lives in the page composition (`app/page.tsx` -> `<WaitlistFormSection />`); no separate route is needed. Plan 05 deterministically triggers branches via the email patterns Plan 02 wired:

- `dup@example.com` -> success + duplicate (POST-03 visual identity)
- `err@example.com` -> server-error sonner toast (D-12)
- `slow@example.com` -> 1500ms delay (CD-03 — pending UX assertion)
- any other valid email -> success
- invalid format -> inline error with value preserved (FORM-06)

## File Rename Confirmed

`git status` and disk both confirm the rename landed cleanly:

```bash
$ test -e components/sections/placeholder-form-section.tsx ; echo $?
1   # i.e., does NOT exist

$ test -f components/sections/waitlist-form-section.tsx ; echo $?
0   # i.e., exists
```

Git tracked the rename via content-similarity at commit time (commit `a2d4c1a` shows `delete mode 100644 components/sections/placeholder-form-section.tsx` + `create mode 100644 components/sections/waitlist-form-section.tsx`).

## Build Warnings

`npm run build` (with env secrets stubbed from `.env.example` placeholder values) succeeds with no warnings about missing client boundaries, missing Toaster mounts, or Next.js diagnostic flags. Static prerender generates 3 pages (`/`, `/_not-found`, plus the implicit favicon route) in 200ms. No new client bundle warnings introduced.

The Next.js workspace-root warning ("Detected additional lockfiles") is a pre-existing worktree artifact (the worktree has its own copy of `package-lock.json`) — not caused by Plan 03 changes. It does not affect the build output.

## Commits

| Task | Commit | Type | Description |
|------|--------|------|-------------|
| 1 | `9a7df1f` | feat | Add WaitlistForm Client Component (useActionState + sonner + honeypot) |
| 2 | `a2d4c1a` | refactor | Rename placeholder-form-section.tsx to waitlist-form-section.tsx, swap body to WaitlistForm |
| 3 | `5831582` | feat | Mount Toaster in root layout; suppress purity lint on RSC time-trap timestamp |
| 4 | `8461643` | test | Add RTL spec for WaitlistForm static surface (FORM-01/02/04/09 + SPAM-01) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Folded `app/page.tsx` import + JSX swap into the Task 2 rename commit**

- **Found during:** Task 2 verification
- **Issue:** Task 2's `<verify>` block runs `npx tsc --noEmit`. With `placeholder-form-section.tsx` deleted but `app/page.tsx` still importing `PlaceholderFormSection`, tsc fails. The plan specifies the page.tsx swap as part of Task 3, but the file deletion happens in Task 2.
- **Fix:** Applied the page.tsx import + JSX + JSDoc swap atomically with the file rename in Task 2's commit (`a2d4c1a`). Task 3's commit (`5831582`) is then narrowed to the layout.tsx Toaster mount + the eslint-disable on the section file.
- **Rationale:** The plan's task boundaries are intent-aligned but artifact-coupled — deleting a file requires removing its references in the same commit to keep tsc green per the plan's own verify gate. This is Rule 3 (auto-fix blocking issue) territory.
- **Files modified:** `app/page.tsx` (folded into commit `a2d4c1a` instead of separate commit per Task 3 description)
- **Commit:** `a2d4c1a` (Task 2's commit absorbed the page.tsx swap)

**2. [Rule 3 — Blocking] Rephrased "use client" comment in waitlist-form-section.tsx to satisfy the negative grep gate**

- **Found during:** Task 2 verification
- **Issue:** Task 2's verify includes `! grep -q "'use client'" $NEW && ! grep -q '"use client"' $NEW`. The original JSDoc comment cited "no 'use client' directive" verbatim, which the grep matches as a positive — failing the gate even though the literal directive is absent from the file head.
- **Fix:** Rephrased the comment from "RSC, no 'use client' directive" to "RSC, no client directive at the top of this file". Same meaning, the literal substring no longer matches the grep.
- **Files modified:** `components/sections/waitlist-form-section.tsx` (single comment line)
- **Commit:** Folded into `a2d4c1a` (applied before the commit landed).

**3. [Rule 3 — Blocking] Added inline `eslint-disable react-hooks/purity` for `Date.now()` in the RSC body**

- **Found during:** Task 3 verification (npm run lint)
- **Issue:** React 19's `eslint-config-next` ships the `react-hooks/purity` rule that flags `Date.now()` calls during render as impure. The plan explicitly mandates `const renderedAt = Date.now()` at this exact spot for CD-02 + Pitfall 2 — the per-request impurity IS the design (the time-trap compares the planted value against `Date.now()` at action-execution time).
- **Fix:** Added a single-line `eslint-disable-next-line react-hooks/purity -- intentional per-request RSC value (Pitfall 2 / CD-02)` directly above the `Date.now()` call. The justification cites the two design decisions that make the impurity intentional. The rule remains enforced for all other code.
- **Rationale:** The alternative — refactoring to suppress the rule (e.g., via `useId` or some hash key) — would either break the time-trap semantic or add Phase 4 cleanup work. Inline disable with explicit justification is the smallest-blast-radius fix.
- **Files modified:** `components/sections/waitlist-form-section.tsx`
- **Commit:** `5831582`

No other deviations. The component file body, the section composition, the layout Toaster mount, and the RTL test suite all shipped exactly as the plan specified.

## Authentication Gates

None. No external services touched in Plan 03 (Phase 4 introduces Resend + Upstash secrets).

The `npm run build` step does fail without env secrets present, but this is the Plan 01 D-08 hard-crash design (parse env at module load — fail loudly in dev, preview, prod). It is NOT an auth gate for Plan 03 — verified that `.env.example` placeholder values let the build succeed.

## Known Stubs

The Server Action body still ships its Phase 3 stub branches (`dup@example.com`, `err@example.com`, `slow@example.com`, default success). These are tracked in Plan 02's SUMMARY ("PHASE-3-STUB Markers") and are intentionally retained until Phase 4 swaps them for the real Resend audience-write call.

The Client Component imports the action's surface — when Phase 4 swaps the body, the import + render code do NOT change (D-09 + D-10 locks).

No new stubs introduced by Plan 03.

## Self-Check: PASSED

**Files claimed -> verified on disk:**
- `components/waitlist/waitlist-form.tsx` — FOUND (179 lines)
- `components/sections/waitlist-form-section.tsx` — FOUND (64 lines)
- `components/sections/placeholder-form-section.tsx` — VERIFIED ABSENT (renamed)
- `app/page.tsx` — FOUND (32 lines, modified)
- `app/layout.tsx` — FOUND (45 lines, modified)
- `tests/unit/waitlist-form.test.tsx` — FOUND (76 lines)
- `.planning/phases/03-email-capture-form-stub-action/03-03-SUMMARY.md` — FOUND (this file)

**Commits claimed -> verified in git log:**
- `9a7df1f` — FOUND (`feat(03-03): add WaitlistForm Client Component (useActionState + sonner + honeypot)`)
- `a2d4c1a` — FOUND (`refactor(03-03): rename placeholder-form-section.tsx to waitlist-form-section.tsx, swap body to WaitlistForm`)
- `5831582` — FOUND (`feat(03-03): mount Toaster in root layout; suppress purity lint on RSC time-trap timestamp`)
- `8461643` — FOUND (`test(03-03): add RTL spec for WaitlistForm static surface (FORM-01/02/04/09 + SPAM-01)`)

**Quality gates re-run:**
- `npx tsc --noEmit` exit 0 — VERIFIED
- `npm run lint` exit 0 — VERIFIED
- `npm run test:unit` 14/14 pass — VERIFIED
- POST-03 enumeration grep audit (no `state.duplicate` outside comments in render) — VERIFIED
- CLAUDE.md banned-library guard (no react-hook-form, framer-motion, next-themes) — VERIFIED
- Toaster mount inside <body> after {children} — VERIFIED
- Old `placeholder-form-section.tsx` deleted — VERIFIED
- No `PlaceholderFormSection` references in `app/page.tsx` — VERIFIED
- CD-02 + Pitfall 2 + D-06 audit trail in `waitlist-form-section.tsx` — VERIFIED
