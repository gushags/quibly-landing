---
phase: 03
plan: 03
id: 03-03
title: WaitlistForm Client Component + section rename + Toaster mount + page wiring + RTL tests
type: execute
wave: 3
depends_on: ["03-01", "03-02"]
files_modified:
  - components/waitlist/waitlist-form.tsx
  - components/sections/waitlist-form-section.tsx
  - components/sections/placeholder-form-section.tsx
  - app/page.tsx
  - app/layout.tsx
  - tests/unit/waitlist-form.test.tsx
autonomous: true
requirements:
  - FORM-01
  - FORM-02
  - FORM-04
  - FORM-05
  - FORM-09
  - POST-01
  - POST-02
  - POST-04
requirements_addressed:
  - FORM-01
  - FORM-02
  - FORM-04
  - FORM-05
  - FORM-09
  - POST-01
  - POST-02
  - POST-04
nyquist_compliant: true

must_haves:
  truths:
    - "D-05: `<WaitlistForm renderedAt={number}>` is a Client Component (`'use client'`) at `components/waitlist/waitlist-form.tsx`; owns useActionState, input/submit/honeypot/time-trap inputs, success block, inline error"
    - "D-06: `<WaitlistFormSection>` stays an RSC at `components/sections/waitlist-form-section.tsx` (renamed from placeholder-form-section.tsx per CD-07); composes heading + sub-copy + `<WaitlistForm />`; outer wrapper, `id=\"waitlist\"`, `scroll-mt-16` preserved verbatim from Phase 2"
    - "D-03: stacked single-column layout (input above submit) on all viewports, `max-w-md mx-auto`; identical mobile/desktop; satisfies MOB-02 ≥48px tap targets"
    - "D-07: submit button reuses Phase 2 `size=\"hero\"` Button CVA variant — zero text-diff with hero pill; only change is wrapping in `<form action>` and adding `disabled={pending}`"
    - "D-10 (consumer): WaitlistForm imports `JoinWaitlistResult` from `@/app/actions/join-waitlist` and narrows the discriminated-union shape — locked through Phase 4"
    - "`renderedAt` is computed via Date.now() in the parent RSC and passed as a prop (Pitfall 2 — no hydration mismatch)"
    - "Form uses useActionState bound to joinWaitlistAction from @/app/actions/join-waitlist (FORM-09)"
    - "Email input has type=email, inputMode=email, autoComplete=email, name=email, id=email, required (FORM-02)"
    - "Honeypot website input is hidden via inline position:absolute;left:-9999px style (NOT Tailwind, NOT display:none — SPAM-01)"
    - "D-13: pending state — submit button label flips to `Joining...`, `<Loader2 className=\"animate-spin\">` left of label, BOTH input AND button disabled; driven by useActionState `pending` boolean (FORM-05)"
    - "Submit copy is exactly Join the waitlist (FORM-04 verbatim with Phase 2 D-12)"
    - "Submit button AND email input both have disabled={pending} — browser-level idempotency primitive (POST-04 — Plan 05 e2e asserts the second click during pending is a no-op)"
    - "D-14: success state — form unmounts, replaced by centered block with teal `<CircleCheck>` + H3 \"You're on the list.\" + body POST-02 verbatim; fades in via `tw-animate-css animate-in fade-in-50 duration-300`"
    - "Success block renders identical content for fresh and duplicate (POST-03 enumeration defense — duplicate flag never read by render code)"
    - "Success body is verbatim Check your inbox (and spam folder) for confirmation. (POST-02)"
    - "Inline error preserves typed value via defaultValue={state.submittedValues?.email} (FORM-06 / Pitfall 1)"
    - "Server-error toast fires from useEffect watching state.status === error AND state.message AND NOT state.fieldErrors (D-12)"
    - "<Toaster /> mounts in app/layout.tsx after {children} inside <body> (D-08)"
    - "app/page.tsx imports WaitlistFormSection (NOT PlaceholderFormSection)"
    - "Old placeholder-form-section.tsx file is DELETED"
  artifacts:
    - path: "components/waitlist/waitlist-form.tsx"
      provides: "Client Component — useActionState, form markup, success block, inline error, sonner toast effect"
      contains: "use client"
      min_lines: 80
    - path: "components/sections/waitlist-form-section.tsx"
      provides: "RSC composing heading + sub-copy + WaitlistForm; owns id=waitlist anchor + renderedAt"
      contains: "id=\"waitlist\""
      min_lines: 25
    - path: "tests/unit/waitlist-form.test.tsx"
      provides: "RTL coverage of idle render, input attributes, copy"
      contains: "renders the form in idle state"
      min_lines: 40
    - path: "app/layout.tsx"
      provides: "Toaster mount"
      contains: "<Toaster"
    - path: "app/page.tsx"
      provides: "Page composition with WaitlistFormSection"
      contains: "WaitlistFormSection"
  key_links:
    - from: "components/waitlist/waitlist-form.tsx"
      to: "app/actions/join-waitlist"
      via: "named import + useActionState binding"
      pattern: "useActionState\\(joinWaitlistAction"
    - from: "components/sections/waitlist-form-section.tsx"
      to: "components/waitlist/waitlist-form.tsx"
      via: "renderedAt prop passed via RSC composition"
      pattern: "<WaitlistForm renderedAt"
    - from: "app/layout.tsx"
      to: "components/ui/sonner"
      via: "Toaster import + mount inside body"
      pattern: "<Toaster"
    - from: "app/page.tsx"
      to: "components/sections/waitlist-form-section"
      via: "import + render"
      pattern: "import \\{ WaitlistFormSection \\}"
---

<objective>
Build the `<WaitlistForm>` Client Component, rename `placeholder-form-section.tsx` to `waitlist-form-section.tsx` (CD-07) and replace its inner body with the form, mount `<Toaster />` in `app/layout.tsx`, swap the import in `app/page.tsx`, and ship an RTL test covering idle-state render plus input attributes plus copy assertions.

Purpose: Wire the form's full UX surface (idle / pending / success / inline error / server-error toast) to the stub Server Action from Plan 02. The discriminated-union `useActionState` binding, the FORM-06 typed-value echo (Pitfall 1), and the Pitfall 2 hydration-safe `renderedAt` prop pattern all materialize here.

Output: A live waitlist form on `/`, end-to-end driven by the stub action, with RTL unit coverage of the static surface.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/03-email-capture-form-stub-action/03-CONTEXT.md
@.planning/phases/03-email-capture-form-stub-action/03-RESEARCH.md
@.planning/phases/03-email-capture-form-stub-action/03-PATTERNS.md
@.planning/phases/03-email-capture-form-stub-action/03-VALIDATION.md
@.planning/phases/03-email-capture-form-stub-action/03-UI-SPEC.md
@.planning/phases/03-email-capture-form-stub-action/03-02-SUMMARY.md
@CLAUDE.md
@components/ui/button.tsx
@components/ui/input.tsx
@components/ui/label.tsx
@components/ui/sonner.tsx
@components/sections/placeholder-form-section.tsx
@components/sections/why-quibly.tsx
@app/page.tsx
@app/layout.tsx

<interfaces>
The action contract (from Plan 02 — locked through Phase 4 per D-10):

From `@/app/actions/join-waitlist` (Plan 02 output):
```ts
// D-10: discriminated-union return shape locked through Phase 4
export type JoinWaitlistResult =
  | { status: 'success'; duplicate?: boolean }
  | {
      status: 'error'
      message?: string                          // sonner toast (D-12)
      fieldErrors?: Record<string, string>      // inline error (D-12)
      submittedValues?: { email: string }       // defaultValue echo (FORM-06)
    }

export async function joinWaitlistAction(
  _prevState: JoinWaitlistResult | null,
  formData: FormData,
): Promise<JoinWaitlistResult>
```

shadcn primitives reused unchanged:

From `components/ui/button.tsx:35` — CVA `size="hero"` variant for submit (D-07: identical to Phase 2 hero pill):
```
hero: "h-auto rounded-[28px] px-9 py-3.5 text-base"
```
Base CVA chain (line 8) auto-sizes svgs to size-4 (16px — matches CD-04 Loader2).

From `components/ui/input.tsx:11` (`aria-invalid` chain — auto red border):
```
aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20
```

From `components/ui/sonner.tsx` — existing token-styled Toaster wrapper (props spread accepted; no overrides needed for Phase 3).

Outer wrapper to preserve VERBATIM from `placeholder-form-section.tsx:26-27` (D-06 mandate — RSC stays RSC, outer wrapper is the cross-phase anchor seam):
```tsx
<section id="waitlist" className="scroll-mt-16 py-16 md:py-24">
  <div className="mx-auto max-w-prose px-6 text-center">
```

H2 typography pattern from `why-quibly.tsx:42` — apply verbatim to new section H2:
```tsx
<h2 className="mb-4 font-heading text-3xl font-bold leading-tight text-foreground md:text-4xl">
```

`app/page.tsx` import to swap (line 4):
```tsx
// before:
import { PlaceholderFormSection } from "@/components/sections/placeholder-form-section"
// after:
import { WaitlistFormSection } from "@/components/sections/waitlist-form-section"
```
And the JSX at line 24: `<PlaceholderFormSection />` becomes `<WaitlistFormSection />`.

`app/layout.tsx` Toaster mount target (line 38):
```tsx
// before:
<body className="min-h-full flex flex-col">{children}</body>
// after:
<body className="min-h-full flex flex-col">
  {children}
  <Toaster />
</body>
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Build the WaitlistForm Client Component (full UX surface)</name>
  <files>components/waitlist/waitlist-form.tsx</files>
  <read_first>
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-RESEARCH.md (lines 333-478 — Pattern 2 verbatim source for the entire component; Pitfall 1 echo, Pitfall 2 prop, Pitfall 4 toast Strict Mode)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-UI-SPEC.md (lines 269-417 — illustrative DOM contract; Layout and Interaction Contract submit-state transitions; CD-08 focus management)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-PATTERNS.md (lines 76-145 — Client Component pattern, honeypot inline-style mandate, submit button reuse, input chrome reuse)
    - /Users/jeff/repos/quibly-landing/components/ui/button.tsx (size=hero variant, aria-invalid chain, [&_svg]:shrink-0 SVG auto-sizing)
    - /Users/jeff/repos/quibly-landing/components/ui/input.tsx (default class chain, aria-invalid chain wired to --destructive)
    - /Users/jeff/repos/quibly-landing/components/ui/sonner.tsx (existing wrapper — Phase 3 does NOT modify this file)
    - /Users/jeff/repos/quibly-landing/components/ui/label.tsx (existing — confirm import path)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-02-SUMMARY.md (Plan 02's exported type — confirm submittedValues is top-level on error variant)
    - /Users/jeff/repos/quibly-landing/app/actions/join-waitlist.ts (the action being bound)
    - /Users/jeff/repos/quibly-landing/CLAUDE.md ("What NOT to Use" — react-hook-form, framer-motion, next-themes are BANNED for Phase 3 — negative grep guard in <verify> enforces)
  </read_first>
  <behavior>
    Component renders one of three top-level branches:

    1. Success block (D-14 — when state.status === success, INCLUDING when duplicate true — POST-03):
       - role=status aria-live=polite wrapper with `animate-in fade-in-50 duration-300` (tw-animate-css)
       - 28px teal CircleCheck (size-7 text-primary strokeWidth=1.75)
       - h3 text-2xl Quicksand 700 You are on the list. (with focus ref + tabIndex=-1 — CD-08)
       - p text-base text-muted-foreground "Check your inbox (and spam folder) for confirmation." (POST-02 verbatim)
       - useEffect focuses successHeadingRef.current on success transition
       - Render code MUST NOT branch on state.duplicate (POST-03 enumeration defense)

    2. Form (D-03 — default when state is null OR error; stacked single-column layout, identical mobile/desktop):
       - form action={formAction} className=mx-auto max-w-md noValidate
       - Label htmlFor=email className=sr-only — Email
       - Input id=email name=email type=email inputMode=email autoComplete=email placeholder=you@example.com required aria-invalid={!!fieldError} aria-describedby={fieldError ? email-error : undefined} defaultValue={echoedEmail ?? ''} disabled={pending} className=mt-2 h-12
       - Conditional p#email-error role=alert text-destructive
       - Honeypot label sr-only Website + input id=website name=website type=text tabIndex=-1 autoComplete=off defaultValue='' aria-hidden=true with INLINE style position:absolute left:-9999px top:auto width:1px height:1px overflow:hidden — NOT Tailwind, NOT display:none (SPAM-01 / CD-01)
       - Time-trap input type=hidden name=renderedAt value={renderedAt} (value, not defaultValue — Pitfall 2 — never Date.now() inline)
       - Submit Button (D-07 — Phase 2 size="hero" CVA reuse) type=submit size=hero variant=default disabled={pending} className=mt-3 w-full sm:w-auto with conditional Loader2 size-4 animate-spin and label "Join the waitlist" or "Joining..." (D-13 pending state)
       - Microcopy p text-sm text-muted-foreground "Launching Summer 2026"

    3. Sonner toast effect: useEffect watching state with guard state.status === error AND state.message AND NOT state.fieldErrors then toast.error(state.message). D-12 routing logic.

    Props: { renderedAt: number } — required (Pitfall 2 — never compute Date.now() inside this component).
  </behavior>
  <action>
    Create `components/waitlist/waitlist-form.tsx` with the exact contents below. The body is RESEARCH Pattern 2 (lines 339-478) verbatim.

    File contents (write exactly):

    ```tsx
    "use client"

    import { useActionState, useEffect, useRef } from 'react'
    import { CircleCheck, Loader2 } from 'lucide-react'
    import { toast } from 'sonner'
    import { Button } from '@/components/ui/button'
    import { Input } from '@/components/ui/input'
    import { Label } from '@/components/ui/label'
    import {
      joinWaitlistAction,
      type JoinWaitlistResult,
    } from '@/app/actions/join-waitlist'

    /**
     * D-05: Phase 3 waitlist form — Client Component (`'use client'`), first such file in the repo.
     *
     * Owns: useActionState binding, form markup, success block (POST-01/02/03 + D-14),
     * inline validation error (FORM-06 / D-12), server-error sonner toast effect (D-12),
     * D-13 pending UX (FORM-05 — `Joining...` label, Loader2 spinner, both input + button
     * disabled while pending), focus management on success (CD-08),
     * browser-level idempotency primitive (POST-04 — disabled={pending} on input + button
     * makes the second click during pending a no-op; Plan 05 e2e asserts this).
     *
     * D-07: submit button reuses Phase 2 `size="hero"` Button CVA variant — zero text-diff
     * with the hero pill; only changes are wrapping in `<form action>` and adding
     * `disabled={pending}`.
     *
     * D-03: stacked single-column layout (input above submit) on all viewports —
     * `max-w-md mx-auto`, identical mobile + desktop, MOB-02 ≥48px tap targets satisfied
     * via `h-12` input + `size="hero"` button.
     *
     * D-10: imports `JoinWaitlistResult` from `@/app/actions/join-waitlist` and narrows
     * the discriminated union — shape locked through Phase 4.
     *
     * Receives renderedAt from the parent RSC (Pitfall 2 — never compute Date.now()
     * inside this component or hydration mismatches).
     *
     * The success render does NOT read state.duplicate — POST-03 enumeration defense
     * (already-subscribed users see the identical block as fresh signups).
     *
     * FORM-06 echo: state.submittedValues.email is hoisted to the top-level error
     * variant (per RESEARCH J1 / Pitfall 1) so this component can pass it as
     * defaultValue to defeat React 19's auto-reset of uncontrolled inputs.
     */
    export function WaitlistForm({ renderedAt }: { renderedAt: number }) {
      // D-10: useActionState bound to JoinWaitlistResult discriminated-union shape (locked Phase 4).
      const [state, formAction, pending] = useActionState<
        JoinWaitlistResult | null,
        FormData
      >(joinWaitlistAction, null)

      const successHeadingRef = useRef<HTMLHeadingElement>(null)

      // D-12: server-error toast (status=error AND has message AND no fieldErrors).
      // Strict-Mode-safe: state === null on initial mount, guard fails, no toast.
      // Each action resolution creates a new state object identity so the effect
      // re-runs once per resolution (Pitfall 4).
      useEffect(() => {
        if (state?.status === 'error' && state.message && !state.fieldErrors) {
          toast.error(state.message)
        }
      }, [state])

      // CD-08: focus the success heading when transitioning to success.
      useEffect(() => {
        if (state?.status === 'success' && successHeadingRef.current) {
          successHeadingRef.current.focus()
        }
      }, [state])

      // D-14: success state — form unmounts, replaced by centered block with teal
      // CircleCheck + H3 + POST-02 body; fades in via tw-animate-css animate-in fade-in-50.
      // POST-01/02/03: success block — IDENTICAL for fresh and duplicate.
      if (state?.status === 'success') {
        return (
          <div
            role="status"
            aria-live="polite"
            className="mx-auto max-w-md text-center animate-in fade-in-50 duration-300"
          >
            <CircleCheck
              aria-hidden="true"
              className="mx-auto size-7 text-primary"
              strokeWidth={1.75}
            />
            <h3
              ref={successHeadingRef}
              tabIndex={-1}
              className="mt-4 font-heading text-2xl font-bold leading-tight text-foreground"
            >
              You&apos;re on the list.
            </h3>
            <p className="mt-2 font-sans text-base text-muted-foreground">
              Check your inbox (and spam folder) for confirmation.
            </p>
          </div>
        )
      }

      // FORM-06 echo (Pitfall 1) — defeat React 19's uncontrolled-input auto-reset.
      const fieldError =
        state?.status === 'error' ? state.fieldErrors?.email : undefined
      const echoedEmail =
        state?.status === 'error' ? state.submittedValues?.email : undefined

      // D-03: stacked single-column form, max-w-md mx-auto, identical mobile + desktop.
      return (
        <form action={formAction} className="mx-auto max-w-md" noValidate>
          <div className="text-left">
            <Label htmlFor="email" className="sr-only">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              aria-invalid={!!fieldError}
              aria-describedby={fieldError ? 'email-error' : undefined}
              defaultValue={echoedEmail ?? ''}
              disabled={pending}
              className="mt-2 h-12"
            />
            {fieldError && (
              <p
                id="email-error"
                role="alert"
                className="mt-2 text-sm text-destructive"
              >
                {fieldError}
              </p>
            )}
          </div>

          {/* Honeypot — off-screen via inline style (NOT Tailwind, NOT display:none — SPAM-01 / CD-01) */}
          <label htmlFor="website" className="sr-only">Website</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '-9999px',
              top: 'auto',
              width: '1px',
              height: '1px',
              overflow: 'hidden',
            }}
          />

          {/* Time-trap — value from RSC parent prop (Pitfall 2 — never Date.now() inline) */}
          <input type="hidden" name="renderedAt" value={renderedAt} />

          {/* D-07: Phase 2 size="hero" Button CVA reuse; only diff is form binding + disabled={pending}. */}
          {/* D-13: pending state — label flips to "Joining...", Loader2 spinner left of label, BOTH input + button disabled. */}
          <Button
            type="submit"
            size="hero"
            variant="default"
            disabled={pending}
            className="mt-3 w-full sm:w-auto"
          >
            {pending && (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            )}
            {pending ? 'Joining...' : 'Join the waitlist'}
          </Button>

          <p className="mt-3 text-sm text-muted-foreground">
            Launching Summer 2026
          </p>
        </form>
      )
    }
    ```

    Critical adherence rules (each is a contract violation if breached):
    - Line 1 is exactly `"use client"` (D-05 — first 'use client' file in the repo; double-quoted to match `components/ui/sonner.tsx:1` and `components/sections/placeholder-form-section.tsx:1` repo convention).
    - The success render branch MUST NOT reference state.duplicate ANYWHERE (POST-03 — `grep duplicate components/waitlist/waitlist-form.tsx` should match ONLY in import or generic-type position, never in JSX or render logic).
    - Honeypot style is the inline React.CSSProperties object literal above — NOT a Tailwind class, NOT `display: 'none'`, NOT `visibility: 'hidden'` (SPAM-01 / CD-01 / UI-SPEC §Spacing exception).
    - `<input type="hidden" name="renderedAt" value={renderedAt} />` uses `value` not `defaultValue` (hidden input must update if a future re-render passes a new prop).
    - The submit button uses `<Button size="hero" variant="default">` (D-07: Phase 2 D-07/CD-04 lock — same CVA as hero CTA).
    - Submit-button label exactly `Join the waitlist` (FORM-04 — verbatim with Phase 2 D-12; UI-SPEC line 182 lock).
    - D-13 pending label exactly `Joining...` (three literal dots — UI-SPEC line 183 / D-13).
    - D-14 success H3 exactly `You're on the list.` (UI-SPEC line 189 / D-14, rendered with `&apos;`).
    - D-14 success body exactly `Check your inbox (and spam folder) for confirmation.` (POST-02 — UI-SPEC line 190 verbatim mandated).
    - D-14 success block uses `animate-in fade-in-50 duration-300` (tw-animate-css fade-in).
    - Microcopy exactly `Launching Summer 2026` (HERO-05 / D-11 — Phase 2 carry-over).
    - Component does NOT import or call `Date.now()` ANYWHERE (Pitfall 2).
    - Component imports the action and the type via the locked path `@/app/actions/join-waitlist` (D-09 + D-10).
    - Component MUST NOT import `react-hook-form`, `framer-motion`, or `next-themes` (CLAUDE.md "What NOT to Use" bans — negative grep guard in <verify> enforces; native `<form>` + useActionState is the spec, no form library needed).

    Per D-03 (stacked layout), D-05 (Client Component owns useActionState + UX surface), D-07 (size="hero" reuse), D-08 (Toaster mounted in layout — Task 3), D-10 (discriminated-union consumer), D-13 (pending state shape), D-14 (success state shape), D-15 (silent rejection — handled in action; component renders success the same way), CD-01, CD-08, FORM-01..09, POST-01..04, SPAM-01, SPAM-02 (defenses live in action; component plants the bait).
  </action>
  <verify>
    <automated>F=/Users/jeff/repos/quibly-landing/components/waitlist/waitlist-form.tsx; test -f $F && head -1 $F | grep -q '"use client"' && grep -q 'useActionState' $F && grep -q "from '@/app/actions/join-waitlist'" $F && grep -q 'Check your inbox (and spam folder) for confirmation' $F && grep -q 'Join the waitlist' $F && grep -q 'Joining\.\.\.' $F && grep -q 'Launching Summer 2026' $F && grep -q "left: '-9999px'" $F && grep -q 'renderedAt: number' $F && ! grep -q 'Date.now()' $F && ! grep -nE 'state\.duplicate|state\?\.duplicate' $F | grep -v '^[0-9]*: *[*/]' && ! grep -E "react-hook-form|framer-motion|next-themes" $F && cd /Users/jeff/repos/quibly-landing && npx tsc --noEmit</automated>
  </verify>
  <acceptance_criteria>
    - File `components/waitlist/waitlist-form.tsx` exists
    - Line 1 is exactly `"use client"`
    - File imports useActionState, useEffect, useRef from 'react'
    - File imports CircleCheck, Loader2 from 'lucide-react'
    - File imports toast from 'sonner'
    - File imports joinWaitlistAction and JoinWaitlistResult from '@/app/actions/join-waitlist'
    - File contains exact string `Check your inbox (and spam folder) for confirmation.` (POST-02 verbatim)
    - File contains exact string `Join the waitlist` (FORM-04 / UI-SPEC line 182)
    - File contains exact string `Joining...` (UI-SPEC line 183 / D-13)
    - File contains exact string `Launching Summer 2026` (HERO-05)
    - File contains exact string `You&apos;re on the list.` (UI-SPEC line 189 / D-14)
    - File contains the literal `left: '-9999px'` (honeypot inline style — SPAM-01)
    - File contains `animate-in fade-in-50 duration-300` (D-14 fade-in)
    - File defines `WaitlistForm({ renderedAt }: { renderedAt: number })` (Pitfall 2 prop)
    - File does NOT contain `Date.now()` ANYWHERE (Pitfall 2)
    - File does NOT contain `display: 'none'` or `display:'none'` for the honeypot (SPAM-01 — off-screen positioning only)
    - File does NOT import `react-hook-form`, `framer-motion`, or `next-themes` (CLAUDE.md "What NOT to Use" — `! grep -E "react-hook-form|framer-motion|next-themes"` passes)
    - The render JSX (NOT comments, NOT type-position) does NOT reference `state.duplicate` or `state?.duplicate` — POST-03
    - `npx tsc --noEmit` exits 0
  </acceptance_criteria>
  <done>File exists with all the locked strings; tsc passes; commit `feat(03-03): add WaitlistForm Client Component (useActionState + sonner + honeypot)`.</done>
</task>

<task type="auto">
  <name>Task 2: Rename placeholder-form-section.tsx to waitlist-form-section.tsx and replace inner body with WaitlistForm + heading + sub-copy</name>
  <files>components/sections/waitlist-form-section.tsx, components/sections/placeholder-form-section.tsx</files>
  <read_first>
    - /Users/jeff/repos/quibly-landing/components/sections/placeholder-form-section.tsx (entire file — the source for the rename, outer wrapper to preserve verbatim)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-RESEARCH.md (lines 480-504 — Pattern 2 RSC parent verbatim source; lines 749-767 Pitfall 2 RSC-prop pattern — explicit reason CD-02's "default to hidden input populated server-side" is implemented via the RSC-prop mechanism rather than `defaultValue={Date.now()}` inside the Client Component)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-UI-SPEC.md (lines 270-289 — section structure; lines 178-179 — locked draft heading + sub-copy)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-PATTERNS.md (lines 148-189 — section pattern, JSDoc convention, H2 typography exact class chain)
    - /Users/jeff/repos/quibly-landing/components/sections/why-quibly.tsx (line 42 — H2 class chain to mirror VERBATIM)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-CONTEXT.md (D-04 — Claude drafts heading + sub-copy, founder edits in PR; D-06 — RSC stays RSC; CD-07 — file rename; **CD-02 — time-trap timestamp source**: instruction is "hidden input populated server-side"; this plan satisfies CD-02 by computing `Date.now()` HERE in the parent RSC and passing it to the Client Component as the `renderedAt` prop, then `<input type="hidden" value={renderedAt} />` is rendered downstream — this is the discretion exercise of "Claude picks; default to hidden input" combined with Pitfall 2's hydration-safe RSC-prop pattern; both decisions are intentionally aligned, not silently substituted)
  </read_first>
  <action>
    Step 1: Create `components/sections/waitlist-form-section.tsx` (NEW file). Step 2: Delete `components/sections/placeholder-form-section.tsx`. Two-step rename via Write + filesystem delete (NOT git mv — git tracks the rename via content similarity at commit time). Phase 2's outer wrapper MUST be preserved verbatim (lines 26-27 of placeholder-form-section.tsx) — that is the cross-phase anchor seam locked in Phase 2 D-09.

    **CD-02 / Pitfall 2 audit trail (load-bearing — keep visible in JSDoc + inline comment):** CONTEXT.md CD-02 instructs the time-trap timestamp source should be a "hidden input populated server-side" (Claude's discretion, default option). This plan honors CD-02 by computing `Date.now()` in THIS RSC parent at request time and passing it as a typed `renderedAt: number` prop to the Client Component, which then renders `<input type="hidden" name="renderedAt" value={renderedAt} />`. This is the RSC-prop variant of CD-02's "server-side population" — chosen over the simpler `defaultValue={Date.now()}` inside the Client Component because the latter triggers a React 19 hydration mismatch (server renders one timestamp, client re-renders a different one ms later). RESEARCH.md Pitfall 2 documents this. The substitution is INTENTIONAL discretion under "Claude picks", NOT a scope reduction — the JSDoc + inline comment below make this visible to anyone reading the code.

    File contents for `components/sections/waitlist-form-section.tsx`:

    ```tsx
    import { WaitlistForm } from "@/components/waitlist/waitlist-form"

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
     *     (Pitfall 2 mitigation — never call Date.now() inside the Client Component
     *     or React hydration warns and rehydrates)
     *
     * CD-02 audit trail (Claude's discretion, intentional substitution — NOT scope reduction):
     *   CONTEXT.md CD-02 instructs the time-trap timestamp source should be a
     *   "hidden input populated server-side" (Claude picks; default to hidden input).
     *   This file honors CD-02 by computing `Date.now()` HERE in the parent RSC at
     *   request time and passing it down as a `renderedAt: number` prop. The
     *   downstream <WaitlistForm> renders <input type="hidden" name="renderedAt"
     *   value={renderedAt} />. This is the RSC-prop variant of CD-02's "server-side
     *   population" — chosen over the simpler `defaultValue={Date.now()}` inside
     *   the Client Component because that triggers React 19 hydration mismatch
     *   (RESEARCH.md Pitfall 2). The intent of CD-02 (hidden input, server-time
     *   value, ~2s threshold rejection in the action) is fully preserved.
     *
     * Locked copy (D-04 — DRAFT, founder reviews/edits in PR):
     *   - H2: "Be first when Quibly opens up." (5 words, conversational, addresses the reader)
     *   - Sub-copy: "Drop your email and we'll ping you the moment Quibly's ready for the world."
     *     (14 words, friendly upstart tone per PROJECT.md)
     */
    export function WaitlistFormSection() {
      // CD-02 + Pitfall 2 + D-06: Date.now() runs at request time on the SERVER (RSC, no
      // 'use client' directive) and is passed as a stable primitive prop to the Client
      // Component. This is CD-02's "hidden input populated server-side" implemented via
      // the RSC-prop mechanism (RESEARCH.md Pitfall 2) rather than `defaultValue={Date.now()}`
      // inside the Client Component, which would hydration-mismatch.
      const renderedAt = Date.now()

      return (
        <section id="waitlist" className="scroll-mt-16 py-16 md:py-24">
          <div className="mx-auto max-w-prose px-6 text-center">
            <h2 className="mb-4 font-heading text-3xl font-bold leading-tight text-foreground md:text-4xl">
              Be first when Quibly opens up.
            </h2>
            <p className="mb-8 font-sans text-base text-muted-foreground">
              Drop your email and we&apos;ll ping you the moment Quibly&apos;s ready for the world.
            </p>
            <WaitlistForm renderedAt={renderedAt} />
          </div>
        </section>
      )
    }
    ```

    After writing the new file, DELETE the old file:
    ```
    rm /Users/jeff/repos/quibly-landing/components/sections/placeholder-form-section.tsx
    ```

    Critical adherence:
    - Outer wrapper EXACT MATCH to `placeholder-form-section.tsx:26-27`: `<section id="waitlist" className="scroll-mt-16 py-16 md:py-24">` and `<div className="mx-auto max-w-prose px-6 text-center">`. NO changes — D-09 cross-phase seam.
    - H2 class chain EXACT MATCH to `why-quibly.tsx:42` and `placeholder-form-section.tsx:28`: `mb-4 font-heading text-3xl font-bold leading-tight text-foreground md:text-4xl`.
    - Sub-copy `<p>` uses `mb-8` (per UI-SPEC line 282 — slightly more bottom space than the placeholder's `mb-6` because the form is taller than the disabled button).
    - Heading + sub-copy are DRAFT per D-04 — founder reviews in PR. Plan 07 owns the founder review checkpoint.
    - File MUST NOT use `'use client'` — D-06 keeps it RSC.
    - `renderedAt = Date.now()` runs at module-scope render call (request time on the server) — Pitfall 2 + CD-02.
    - JSDoc MUST contain the explicit "CD-02 audit trail" block (verified by grep in <verify>) — makes the discretion exercise visible to any reader / reviewer / future Claude.
    - JSDoc MUST cite D-06 (RSC stays RSC) so the no-`'use client'` rule is auditable.
    - Inline comment above `const renderedAt = Date.now()` MUST cite both CD-02 AND Pitfall 2 — keeps the rationale next to the code it justifies.
    - Old `placeholder-form-section.tsx` is DELETED, NOT left orphaned.

    Per D-04 (draft copy), D-06 (RSC stays RSC — no 'use client' directive), CD-02 (intentional discretion variant), CD-07 (rename), D-09 cross-phase seam, RESEARCH Pitfall 2.
  </action>
  <verify>
    <automated>NEW=/Users/jeff/repos/quibly-landing/components/sections/waitlist-form-section.tsx; OLD=/Users/jeff/repos/quibly-landing/components/sections/placeholder-form-section.tsx; test -f $NEW && ! test -e $OLD && grep -q 'id="waitlist"' $NEW && grep -q 'scroll-mt-16 py-16 md:py-24' $NEW && grep -q 'max-w-prose px-6 text-center' $NEW && grep -q 'Be first when Quibly opens up' $NEW && grep -q 'WaitlistForm renderedAt={renderedAt}' $NEW && grep -q 'const renderedAt = Date.now()' $NEW && grep -q 'CD-02' $NEW && grep -q 'Pitfall 2' $NEW && grep -q 'D-06' $NEW && ! grep -q "'use client'" $NEW && ! grep -q '"use client"' $NEW && cd /Users/jeff/repos/quibly-landing && npx tsc --noEmit</automated>
  </verify>
  <acceptance_criteria>
    - File `components/sections/waitlist-form-section.tsx` exists
    - File `components/sections/placeholder-form-section.tsx` does NOT exist
    - New file contains the EXACT outer wrapper string `<section id="waitlist" className="scroll-mt-16 py-16 md:py-24">` (Phase 2 D-09 cross-phase seam)
    - New file contains the EXACT inner wrapper `<div className="mx-auto max-w-prose px-6 text-center">`
    - New file contains the H2 class chain `mb-4 font-heading text-3xl font-bold leading-tight text-foreground md:text-4xl` (matches why-quibly.tsx:42)
    - New file contains the literal `Be first when Quibly opens up.` (D-04 draft)
    - New file contains `<WaitlistForm renderedAt={renderedAt} />` (Pitfall 2 prop pattern)
    - New file contains `const renderedAt = Date.now()` (RSC-time computation)
    - New file contains `CD-02` AND `Pitfall 2` AND `D-06` references (audit trail visible — `grep -q 'CD-02' && grep -q 'Pitfall 2' && grep -q 'D-06'` all exit 0)
    - New file does NOT contain `'use client'` or `"use client"` (D-06 — RSC per CONTEXT D-06)
    - `npx tsc --noEmit` exits 0
  </acceptance_criteria>
  <done>New section file exists with Phase 2 wrapper preserved + CD-02/Pitfall 2/D-06 audit trail in JSDoc and inline comment; old placeholder file deleted; tsc passes; commit `refactor(03-03): rename placeholder-form-section.tsx to waitlist-form-section.tsx, swap body to WaitlistForm`.</done>
</task>

<task type="auto">
  <name>Task 3: Update app/page.tsx (import + render swap) and app/layout.tsx (Toaster mount)</name>
  <files>app/page.tsx, app/layout.tsx</files>
  <read_first>
    - /Users/jeff/repos/quibly-landing/app/page.tsx (current — verify line 4 import + line 24 render JSX)
    - /Users/jeff/repos/quibly-landing/app/layout.tsx (current — verify line 38 body chain to extend)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-PATTERNS.md (lines 408-449 — exact change patterns for page.tsx and layout.tsx; preserve-verbatim lists)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-UI-SPEC.md (lines 224-225 — Component Inventory > Modified rows for page.tsx + layout.tsx)
    - /Users/jeff/repos/quibly-landing/components/ui/sonner.tsx (verify Toaster export name)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-CONTEXT.md (D-08 — Toaster mounts in app/layout.tsx once at root)
  </read_first>
  <action>
    Two file edits, both surgical (1-line changes per file). Use the Edit tool — do not rewrite the entire file.

    **Edit 1: `app/page.tsx`**

    Change line 4 import from:
    ```tsx
    import { PlaceholderFormSection } from "@/components/sections/placeholder-form-section"
    ```
    To:
    ```tsx
    import { WaitlistFormSection } from "@/components/sections/waitlist-form-section"
    ```

    Change line 24 (inside the `<main>`) from:
    ```tsx
    <PlaceholderFormSection />
    ```
    To:
    ```tsx
    <WaitlistFormSection />
    ```

    Preserve verbatim:
    - All other imports (FounderVoice, Footer, Hero, SecondaryCTA, WhyQuibly) — alphabetical order intact
    - The `<main className="flex flex-col">` wrapper
    - The section ORDER (Hero, [WaitlistFormSection], WhyQuibly, FounderVoice, SecondaryCTA, Footer) — D-16
    - The Footer-outside-main pattern
    - The JSDoc comment block (lines 8-18)

    **Edit 2: `app/layout.tsx`**

    Add a new import (alphabetically placed — after the existing `next/font/google` import, before `./globals.css`):
    ```tsx
    import { Toaster } from "@/components/ui/sonner";
    ```

    Wait — review alphabetical ordering. Current imports are:
    1. `import type { Metadata } from "next";`
    2. `import { Quicksand, Figtree } from "next/font/google";`
    3. `import "./globals.css";`
    4. `import "@/lib/env";`

    Add the Toaster import AFTER `import "@/lib/env";` (line 4) since side-effect imports should come before named imports of the same scope, and `@/components/ui/sonner` lives later alphabetically. New order:
    1. `import type { Metadata } from "next";`
    2. `import { Quicksand, Figtree } from "next/font/google";`
    3. `import "./globals.css";`
    4. `import "@/lib/env";`
    5. `import { Toaster } from "@/components/ui/sonner";`

    Change the `<body>` block (line 38) from:
    ```tsx
    <body className="min-h-full flex flex-col">{children}</body>
    ```
    To:
    ```tsx
    <body className="min-h-full flex flex-col">
      {children}
      <Toaster />
    </body>
    ```

    Preserve verbatim:
    - The Quicksand + Figtree `next/font/google` setup (lines 6-18)
    - The `metadata` export (lines 20-28)
    - The `<html>` className with font variables + `h-full antialiased` (line 36)
    - The `<body>` className `min-h-full flex flex-col`
    - The `import "@/lib/env"` side-effect import (env validation at module load)

    Toaster receives NO props — sonner defaults (bottom-right position, 4000ms duration) per CD-07. The wrapper at `components/ui/sonner.tsx:6` accepts `ToasterProps` spread (line 41 `{...props}`); leaving it empty consumes defaults.

    Per D-08 (single Toaster mount in root layout), D-16 (section order preserved).
  </action>
  <verify>
    <automated>P=/Users/jeff/repos/quibly-landing/app/page.tsx; L=/Users/jeff/repos/quibly-landing/app/layout.tsx; grep -q 'import { WaitlistFormSection } from "@/components/sections/waitlist-form-section"' $P && grep -q '<WaitlistFormSection />' $P && ! grep -q 'PlaceholderFormSection' $P && grep -q 'import { Toaster } from "@/components/ui/sonner"' $L && grep -q '<Toaster />' $L && grep -q '{children}' $L && grep -q 'min-h-full flex flex-col' $L && grep -q 'import "@/lib/env"' $L && cd /Users/jeff/repos/quibly-landing && npx tsc --noEmit && npm run lint</automated>
  </verify>
  <acceptance_criteria>
    - `app/page.tsx` contains the line `import { WaitlistFormSection } from "@/components/sections/waitlist-form-section"`
    - `app/page.tsx` contains the JSX `<WaitlistFormSection />` (in the section composition)
    - `app/page.tsx` does NOT contain ANY reference to `PlaceholderFormSection` (import OR JSX)
    - `app/page.tsx` preserves the alphabetical import order (FounderVoice, Footer, Hero, then WaitlistFormSection alphabetically slots between SecondaryCTA's neighbors — verify the file builds)
    - `app/page.tsx` preserves `<main className="flex flex-col">` and the Footer-outside-main pattern
    - `app/layout.tsx` contains `import { Toaster } from "@/components/ui/sonner"`
    - `app/layout.tsx` contains `<Toaster />` AFTER `{children}` inside `<body>`
    - `app/layout.tsx` preserves: Metadata export, font setup (Quicksand + Figtree), `h-full antialiased`, `min-h-full flex flex-col`, `import "@/lib/env"`
    - `npx tsc --noEmit` exits 0
    - `npm run lint` exits 0
  </acceptance_criteria>
  <done>Both files edited per spec; tsc + lint green; commit `feat(03-03): wire WaitlistFormSection into page; mount Toaster in root layout`.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 4: Add tests/unit/waitlist-form.test.tsx (RTL render + attribute coverage)</name>
  <files>tests/unit/waitlist-form.test.tsx</files>
  <read_first>
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-RESEARCH.md (lines 944-981 — RTL test shape canonical source)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-PATTERNS.md (lines 277-298 — test coverage map per requirement ID)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-VALIDATION.md (lines 47-66 — per-requirement verification map)
    - /Users/jeff/repos/quibly-landing/components/waitlist/waitlist-form.tsx (the component being tested — confirm export name + props)
    - /Users/jeff/repos/quibly-landing/tests/setup.ts (jest-dom matchers registered here)
    - /Users/jeff/repos/quibly-landing/vitest.config.ts (verify happy-dom + alias)
  </read_first>
  <behavior>
    The spec covers the static surface of `<WaitlistForm>` — what RTL can assert without driving a real Server Action transition (which only Playwright can do reliably for `useActionState`-bound forms).

    Five `it()` blocks:

    1. `'renders the form in idle state'` (FORM-01) — assertion: button "Join the waitlist" + email input with `you@example.com` placeholder are both in DOM
    2. `'input has correct attributes'` (FORM-02) — assertion: input has `type="email"`, `inputMode="email"`, `autoComplete="email"`, `name="email"`, `id="email"`, `required`
    3. `'submit button reads "Join the waitlist"'` (FORM-04) — assertion: `screen.getByRole('button', { name: 'Join the waitlist' })` resolves
    4. `'binds typed useActionState'` (FORM-09) — assertion: TS compiles + the rendered button is NOT disabled in idle state (pending=false initial)
    5. `'honeypot input is present and off-screen'` (SPAM-01 — DOM check) — assertion: `<input name="website">` is in DOM AND its computed `style.position === 'absolute'` AND `style.left === '-9999px'`
  </behavior>
  <action>
    Create `tests/unit/waitlist-form.test.tsx` with the EXACT contents below.

    Note: this RTL spec covers RENDER-time invariants. State-transition behavior (success block, inline error after submit, sonner toast) is covered by Playwright in Plan 05 — RTL cannot reliably drive `<form action={serverAction}>` because Server Actions require the React server runtime that happy-dom does not provide.

    File contents:

    ```tsx
    import { describe, it, expect } from 'vitest'
    import { render, screen } from '@testing-library/react'
    import { WaitlistForm } from '@/components/waitlist/waitlist-form'

    /**
     * Phase 3 RTL spec — render-time invariants of <WaitlistForm>.
     *
     * State-transition behavior (D-14 success block render, inline error after submit,
     * sonner toast trigger) is covered by Playwright e2e in Plan 03-05 because
     * happy-dom + RTL cannot drive React 19 Server Actions reliably (no React
     * server runtime in the unit env). This file asserts what RTL CAN see:
     *   - Initial DOM (idle state — D-13 pending boolean is false)
     *   - Static input attributes (FORM-02)
     *   - Static copy strings (FORM-04)
     *   - Honeypot presence + off-screen positioning (SPAM-01)
     *
     * Per VALIDATION.md Per-Task Verification Map.
     */

    // Stable past renderedAt — passes the time-trap if the test ever drives a submit.
    const PAST_RENDERED_AT = Date.now() - 5000

    describe('<WaitlistForm>', () => {
      it('renders the form in idle state (FORM-01)', () => {
        render(<WaitlistForm renderedAt={PAST_RENDERED_AT} />)
        expect(screen.getByRole('button', { name: /join the waitlist/i })).toBeInTheDocument()
        expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
      })

      it('email input has FORM-02 attributes (type=email, inputMode=email, autoComplete=email, required)', () => {
        render(<WaitlistForm renderedAt={PAST_RENDERED_AT} />)
        const input = screen.getByPlaceholderText('you@example.com') as HTMLInputElement
        expect(input.type).toBe('email')
        expect(input.inputMode).toBe('email')
        expect(input.autocomplete).toBe('email')
        expect(input.name).toBe('email')
        expect(input.id).toBe('email')
        expect(input.required).toBe(true)
      })

      it('submit button copy is exactly "Join the waitlist" (FORM-04 / D-12 verbatim with Phase 2)', () => {
        render(<WaitlistForm renderedAt={PAST_RENDERED_AT} />)
        // Use exact-match name (case-sensitive) — anchors the verbatim copy
        const button = screen.getByRole('button', { name: 'Join the waitlist' })
        expect(button).toBeInTheDocument()
        expect(button).not.toBeDisabled()
      })

      it('binds typed useActionState — initial pending is false (FORM-09 / D-13 idle baseline)', () => {
        render(<WaitlistForm renderedAt={PAST_RENDERED_AT} />)
        const button = screen.getByRole('button', { name: 'Join the waitlist' })
        const input = screen.getByPlaceholderText('you@example.com')
        // Initial state: useActionState(action, null) sets pending=false
        // Button + input both must be enabled (NOT disabled per D-13 pending state)
        expect(button).not.toBeDisabled()
        expect(input).not.toBeDisabled()
      })

      it('honeypot input is present, named "website", and off-screen positioned (SPAM-01 / CD-01)', () => {
        const { container } = render(<WaitlistForm renderedAt={PAST_RENDERED_AT} />)
        const honeypot = container.querySelector('input[name="website"]') as HTMLInputElement
        expect(honeypot).not.toBeNull()
        expect(honeypot.tabIndex).toBe(-1)
        expect(honeypot.getAttribute('aria-hidden')).toBe('true')
        // Off-screen via inline style (NOT display:none — SPAM-01 mandate)
        expect(honeypot.style.position).toBe('absolute')
        expect(honeypot.style.left).toBe('-9999px')
        // Critical anti-assertion: must NOT be display:none (some bots skip those)
        expect(honeypot.style.display).not.toBe('none')
      })

      it('Launching Summer 2026 microcopy is present (HERO-05 / CD-06 layout reservation)', () => {
        render(<WaitlistForm renderedAt={PAST_RENDERED_AT} />)
        expect(screen.getByText('Launching Summer 2026')).toBeInTheDocument()
      })
    })
    ```

    Run `npm run test:unit`. All 6 tests should pass (the action import resolves because Plan 02 already shipped it; the form's static surface renders without driving any Server Action transition).

    Critical:
    - Do NOT mock `@/app/actions/join-waitlist` — the real export resolves at compile time; happy-dom does not run the action because the form is never submitted in this spec.
    - Do NOT add `userEvent.setup()` or `await user.click(...)` patterns — those would drive submit, and `useActionState`'s action transition does not work in happy-dom (RESEARCH lines 944-981 implicitly omits this).
    - Do NOT assert success-state render — Plan 05 owns that signal via Playwright.

    Per D-17 (Vitest covers what it's good at), FORM-01, FORM-02, FORM-04, FORM-09, SPAM-01, HERO-05.
  </action>
  <verify>
    <automated>F=/Users/jeff/repos/quibly-landing/tests/unit/waitlist-form.test.tsx; test -f $F && grep -c "^  it(" $F | grep -q 6 && grep -q "renders the form in idle state" $F && grep -q "FORM-02" $F && grep -q "FORM-04" $F && grep -q "FORM-09" $F && grep -q "SPAM-01" $F && grep -q "HERO-05" $F && cd /Users/jeff/repos/quibly-landing && npm run test:unit -- tests/unit/waitlist-form.test.tsx</automated>
  </verify>
  <acceptance_criteria>
    - File `tests/unit/waitlist-form.test.tsx` exists
    - File contains EXACTLY 6 `it(...)` blocks
    - Test names cite requirement IDs: FORM-01, FORM-02, FORM-04, FORM-09, SPAM-01, HERO-05
    - File imports from `@/components/waitlist/waitlist-form` (the path Plan-03-Task-1 created)
    - File renders WaitlistForm with `renderedAt={PAST_RENDERED_AT}` prop (Pitfall 2 — required prop)
    - Honeypot test asserts `style.position === 'absolute'` AND `style.left === '-9999px'` AND `style.display !== 'none'` (SPAM-01 / CD-01 enforcement)
    - `npm run test:unit -- tests/unit/waitlist-form.test.tsx` passes ALL 6 tests
    - `npx tsc --noEmit` exits 0
  </acceptance_criteria>
  <done>RTL spec ships with 6 passing tests; commit `test(03-03): add RTL spec for WaitlistForm static surface (FORM-01/02/04/09 + SPAM-01)`.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| RSC server render → Client hydration | `renderedAt` prop crosses serialization boundary (must be primitive — `number` is safe per Pitfall 2) |
| Client form submit → Server Action | Native `<form action={formAction}>` POST; built-in CSRF protection per Next 16.2 |
| Server Action error response → DOM render | `state.submittedValues.email` flows back into `<Input defaultValue={...}>` — React auto-escapes (T-03-03 mitigation) |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-01 | I (Information Disclosure) | `<WaitlistForm>` success render | mitigate | Render code does NOT branch on `state.duplicate` — POST-03 enumeration defense. Acceptance criterion enforces via grep: `state.duplicate` and `state?.duplicate` MUST NOT appear in render JSX. The flag is captured for Phase 5 analytics only (`track('waitlist_signup', { duplicate })` — not in Phase 3). E2E spec in Plan 05 asserts visual identity. |
| T-03-02 | D (Denial of Service) / Spoofing | Honeypot field | mitigate | Inline-style off-screen positioning (NOT `display: none`, NOT Tailwind class). Bots that auto-fill known field types target `website` per CD-01. The action enforces silent success on fill (Plan 02 — already covered). |
| T-03-03 | I (XSS via reflected email) | `<Input defaultValue={state.submittedValues?.email}>` | mitigate | React auto-escapes attribute values. No `dangerouslySetInnerHTML` anywhere in the component. No manual string concat. The `defaultValue` is JSX-bound (escaped), not template-literal-injected. |
| T-03-04 | T (Tampering) | Direct fetch with crafted body | mitigate | Defenses live in the action (Plan 02 — Zod + honeypot + time-trap). Component plants the bait (`<input name="website">`, `<input name="renderedAt">`). |
| T-03-05 | T (CSRF) | Server Action POST | accept | Next.js 16.2 Server Actions include built-in CSRF protection (Origin verification + per-action ID hash). No additional task needed. |
| T-03-INFRA-04 | I (Information Disclosure) | `renderedAt` prop in HTML | accept | `renderedAt` is `Date.now()` at render time — leaks the server's wall-clock to the client. This is benign (visible to anyone via DevTools anyway) and is the recommended pattern per RESEARCH J2. Phase 4 may consider HMAC-signing the timestamp if abuse appears. |

No `high` severity threats unmitigated. T-03-01 is the most consequential — three independent enforcement points (action-level test in Plan 02, render-code grep in this plan, e2e visual identity in Plan 05).
</threat_model>

<verification>
After all four tasks complete:

1. **Vitest full unit suite (must include both Plan 02 + Plan 03 specs):**
   ```bash
   npm run test:unit
   ```
   Expected: `tests/unit/join-waitlist-action.test.ts` (8 tests) + `tests/unit/waitlist-form.test.tsx` (6 tests) — total 14 passing.

2. **TypeScript (whole project):**
   ```bash
   npx tsc --noEmit
   ```
   Expected: exit 0.

3. **Lint:**
   ```bash
   npm run lint
   ```
   Expected: exit 0.

4. **Smoke build:**
   ```bash
   npm run build
   ```
   Expected: exit 0; build succeeds; no warnings about missing `<Toaster>` mount or missing client boundary.

5. **POST-03 enumeration grep audit:**
   ```bash
   grep -nE 'state\.duplicate|state\?\.duplicate' components/waitlist/waitlist-form.tsx | grep -v '^[0-9]*: *[*/]'
   ```
   Expected: NO matches outside comments (the `duplicate` flag is captured in the type but never read in render code).

6. **Banned library guard (CLAUDE.md "What NOT to Use"):**
   ```bash
   ! grep -E "react-hook-form|framer-motion|next-themes" components/waitlist/waitlist-form.tsx
   ```
   Expected: exit 0 (no matches — banned libraries must NOT be imported).

7. **Toaster mount verification:**
   ```bash
   grep -A 2 '<body' app/layout.tsx | grep -q '<Toaster'
   ```
   Expected: match (Toaster appears within or near body).

8. **Old placeholder-form-section deleted:**
   ```bash
   test ! -e components/sections/placeholder-form-section.tsx && echo "OK: deleted"
   ```
   Expected: prints "OK: deleted".

9. **Imports in page.tsx:**
   ```bash
   grep -E 'PlaceholderFormSection|placeholder-form-section' app/page.tsx
   ```
   Expected: NO matches.

10. **CD-02 / Pitfall 2 / D-06 audit trail visible (load-bearing — keeps the discretion exercise auditable):**
    ```bash
    grep -q 'CD-02' components/sections/waitlist-form-section.tsx && grep -q 'Pitfall 2' components/sections/waitlist-form-section.tsx && grep -q 'D-06' components/sections/waitlist-form-section.tsx
    ```
    Expected: all grep -q exit 0 (CD-02 + Pitfall 2 + D-06 audit trail is preserved in the JSDoc/comment).
</verification>

<success_criteria>
- `<WaitlistForm>` exists at `components/waitlist/waitlist-form.tsx` (D-05 — first `'use client'` file in repo)
- `<WaitlistFormSection>` exists at `components/sections/waitlist-form-section.tsx` (D-06 — RSC stays RSC; renamed per CD-07; outer wrapper preserved per D-09 cross-phase seam)
- `placeholder-form-section.tsx` is DELETED
- `app/page.tsx` imports + renders `WaitlistFormSection` (no orphaned `PlaceholderFormSection` references)
- `app/layout.tsx` mounts `<Toaster />` after `{children}` inside `<body>` (D-08)
- `renderedAt` flows: parent RSC `Date.now()` → prop → Client Component hidden input (Pitfall 2 hydration-safe; CD-02 honored via the RSC-prop variant of "hidden input populated server-side")
- D-03 stacked single-column layout enforced via `mx-auto max-w-md`
- D-07 submit button reuses Phase 2 `size="hero"` Button CVA variant
- D-10 discriminated-union shape consumed via typed import from action
- D-13 pending state: `Joining...` label + Loader2 spinner + both input/button disabled
- D-14 success state: form unmounts, replaced by CircleCheck + H3 + POST-02 body, fades in via `animate-in fade-in-50 duration-300`
- POST-03 enumeration defense: `state.duplicate` is NEVER read in render JSX (grep audit clean)
- POST-02 success body string is verbatim
- FORM-04 submit copy is verbatim with Phase 2 D-12 (`Join the waitlist`)
- POST-04 browser-level idempotency primitive: `disabled={pending}` on input + button (Plan 05 e2e asserts the second click during pending is a no-op)
- SPAM-01 honeypot uses inline off-screen positioning (NOT `display:none`)
- Banned libraries guarded: `react-hook-form`, `framer-motion`, `next-themes` are NOT imported (CLAUDE.md "What NOT to Use" — negative grep guard in Task 1 verify)
- CD-02 + Pitfall 2 + D-06 audit trail visible in `<WaitlistFormSection>` JSDoc + inline comment (auditable discretion exercise)
- 6 RTL tests pass (FORM-01, FORM-02, FORM-04, FORM-09, SPAM-01, HERO-05)
- Combined unit suite: 14 passing across both spec files
- `npm run build` succeeds (production build verifies the full RSC + Client Component graph compiles)
- All gates green: `tsc --noEmit`, `npm run lint`, `npm run test:unit`, `npm run build`
</success_criteria>

<output>
After completion, create `.planning/phases/03-email-capture-form-stub-action/03-03-SUMMARY.md` documenting:
- Final unit test count (14 expected: 8 from Plan 02 + 6 from Plan 03)
- Confirmation of Pitfall 2 mitigation (renderedAt prop pattern wired)
- Confirmation of CD-02 honored via the RSC-prop variant of "hidden input populated server-side" (audit trail in JSDoc + inline comment)
- Confirmation of POST-03 enumeration defense (grep audit for `state.duplicate` in render JSX returns zero)
- Confirmation of POST-04 browser-level idempotency primitive (`disabled={pending}` on input + button — Plan 05 e2e covers the actual no-op assertion)
- Confirmation of CLAUDE.md banned-library guard (react-hook-form, framer-motion, next-themes — none imported)
- The exact import path Plan 05's e2e specs will use to drive the form (`/` — the form lives in the page composition)
- Any unexpected build warnings noted for review
- Confirmation that `placeholder-form-section.tsx` is deleted and `git status` shows the rename cleanly
</output>
</output>
