'use server'

import { z } from 'zod'

/**
 * Stub Server Action — Phase 3.
 *
 * REAL defenses (stay live through Phase 4):
 *   - Zod email validation (FORM-03)
 *   - Honeypot field `website` — silent success on fill (SPAM-01 / D-15)
 *   - Time-trap on `renderedAt` — silent success when submit is <2s after render (SPAM-02 / D-15)
 *
 * D-11: STUBBED branches (Phase 3 only; Phase 4 deletes the email-pattern triggers
 * and replaces the body with a real `resend.contacts.create({ ... })` call):
 *   - `dup@example.com`  → success + duplicate flag (POST-03 enumeration defense check)
 *   - `err@example.com`  → error with sonner toast message (D-12)
 *   - `slow@example.com` → 1500ms delay then success (CD-03 — exercises pending UX)
 *   - any other valid email → success
 *
 * D-10: discriminated-union return shape is LOCKED through Phase 4 — same file path,
 * same export name (D-09), same outer union shape. Phase 4 may extend fieldErrors
 * keys (e.g. `_disposable`, `_rateLimit`) but does NOT change the union's outer shape.
 * The Client Component's import + render code does not change in Phase 4.
 *
 * FORM-06 echo: on validation error, `submittedValues.email` is hoisted to the top-level
 * error variant (NOT nested in fieldErrors — that's type-awkward per RESEARCH J1) so the
 * Client Component can pass it as `defaultValue` to defeat React 19's auto-reset of
 * uncontrolled inputs (Pitfall 1).
 *
 * Zod 4 idioms (Pitfall 5):
 *   - top-level `z.email(...)` schema (the chained `.string().email(...)` form is Zod 3)
 *   - `z.flattenError(parsed.error)` (the chained `.flatten()` accessor is Zod 3)
 */

const schema = z.object({
  email: z
    .email({ error: 'Please enter a valid email address.' })
    .max(254, { error: 'Email address is too long.' }),
})

// D-10: discriminated-union return shape — locked through Phase 4.
export type JoinWaitlistResult =
  | { status: 'success'; duplicate?: boolean }
  | {
      status: 'error'
      message?: string
      fieldErrors?: Record<string, string>
      submittedValues?: { email: string }
    }

export async function joinWaitlistAction(
  _prevState: JoinWaitlistResult | null,
  formData: FormData,
): Promise<JoinWaitlistResult> {
  // 1. Honeypot — silent success (SPAM-01 / D-15). Bot fills `website`; user never sees it.
  if (formData.get('website')) {
    return { status: 'success' }
  }

  // 2. Time-trap — silent success (SPAM-02 / D-15). Submits faster than 2s after render
  //    are almost certainly bots. The `renderedAt` value is planted by the parent RSC at
  //    request time and passed to the Client Component as a stable prop (RESEARCH Pitfall 2).
  const renderedAt = Number(formData.get('renderedAt') ?? 0)
  if (renderedAt > 0 && Date.now() - renderedAt < 2000) {
    return { status: 'success' }
  }

  // 3. Zod validation — server-side source of truth (FORM-03).
  const rawEmail = String(formData.get('email') ?? '')
  const parsed = schema.safeParse({ email: rawEmail })
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error)  // Zod 4 idiom — NOT .flatten()
    const fieldErrors: Record<string, string> = {}
    for (const [key, msgs] of Object.entries(flat.fieldErrors)) {
      if (msgs?.[0]) fieldErrors[key] = msgs[0]
    }
    // Echo the raw typed value back so the Client Component can preserve it
    // via <Input defaultValue={state.submittedValues?.email} /> (Pitfall 1 / FORM-06).
    return {
      status: 'error',
      fieldErrors,
      submittedValues: { email: rawEmail },
    }
  }

  // 4. D-11: stub branch routing — PHASE-3-STUB — DELETE IN PHASE 4
  // Phase 4 replaces the entire block below with a real `resend.contacts.create({ ... })`
  // call. The four `if` branches and the default `return { status: 'success' }` all go away.
  const email = parsed.data.email

  // D-11: PHASE-3-STUB — DELETE IN PHASE 4 (dup branch)
  if (email === 'dup@example.com') {
    return { status: 'success', duplicate: true }
  }
  // D-11: PHASE-3-STUB — DELETE IN PHASE 4 (err branch)
  if (email === 'err@example.com') {
    return {
      status: 'error',
      message: 'Something went wrong. Try again in a moment.',
    }
  }
  // D-11: PHASE-3-STUB — DELETE IN PHASE 4 (slow branch — exercises pending UX per CD-03)
  if (email === 'slow@example.com') {
    await new Promise((r) => setTimeout(r, 1500))
    return { status: 'success' }
  }
  // D-11: PHASE-3-STUB — DELETE IN PHASE 4 (the default branch becomes the real Resend write)
  return { status: 'success' }
}
