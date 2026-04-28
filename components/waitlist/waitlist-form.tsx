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
 * Receives renderedAt from the parent RSC (Pitfall 2 — never compute the current
 * timestamp inside this component or hydration mismatches).
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

      {/* Time-trap — value from RSC parent prop (Pitfall 2 — never inline current timestamp) */}
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
