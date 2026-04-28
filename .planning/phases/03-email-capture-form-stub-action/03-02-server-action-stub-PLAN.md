---
phase: 03
plan: 02
id: 03-02
title: Server Action stub — Zod + honeypot + time-trap (real) + stub branches (deterministic email patterns)
type: execute
wave: 2
depends_on: ["03-01"]
files_modified:
  - app/actions/join-waitlist.ts
  - tests/unit/join-waitlist-action.test.ts
autonomous: true
requirements:
  - FORM-03
  - FORM-06
  - POST-03
  - POST-04
  - SPAM-01
  - SPAM-02
requirements_addressed:
  - FORM-03
  - FORM-06
  - POST-03
  - POST-04
  - SPAM-01
  - SPAM-02
nyquist_compliant: true

must_haves:
  truths:
    - "Server Action exports `joinWaitlistAction` and `JoinWaitlistResult` type from `app/actions/join-waitlist.ts`"
    - "D-10: discriminated-union return shape is exported and locked through Phase 4 — `{ status: 'success'; duplicate?: boolean } | { status: 'error'; message?: string; fieldErrors?: Record<string, string>; submittedValues?: { email: string } }`"
    - "D-11: stub branches via deterministic email-pattern triggers (Phase 3 only — Phase 4 deletes): `dup@example.com`, `err@example.com`, `slow@example.com`, default"
    - "Honeypot-filled submission returns `{ status: 'success' }` shape with no other side effects (D-15)"
    - "Time-trap (`renderedAt < 2000ms ago`) returns `{ status: 'success' }` shape silently"
    - "Invalid email returns `{ status: 'error', fieldErrors: { email: <msg> }, submittedValues: { email: <typed> } }`"
    - "`dup@example.com` returns `{ status: 'success', duplicate: true }`"
    - "`err@example.com` returns `{ status: 'error', message: 'Something went wrong. Try again in a moment.' }`"
    - "`slow@example.com` delays ≥1500ms then returns `{ status: 'success' }`"
    - "Plain valid email returns `{ status: 'success' }`"
    - "Action uses Zod 4 idiom: `z.email()` (NOT `z.string().email()`) and `z.flattenError()` (NOT `.flatten()`)"
    - "Stub branches commented `// PHASE-3-STUB — DELETE IN PHASE 4` for grep-removability"
    - "Vitest unit suite covers all 8 branches and exits 0"
  artifacts:
    - path: "app/actions/join-waitlist.ts"
      provides: "Stub Server Action with real Zod + honeypot + time-trap; locked through Phase 4 (D-09)"
      contains: "'use server'"
      exports: ["joinWaitlistAction", "JoinWaitlistResult"]
      min_lines: 60
    - path: "tests/unit/join-waitlist-action.test.ts"
      provides: "Vitest coverage of all 8 branches per VALIDATION.md"
      contains: "describe('joinWaitlistAction"
      min_lines: 80
  key_links:
    - from: "app/actions/join-waitlist.ts"
      to: "zod"
      via: "Zod 4 schema (z.email() + z.flattenError)"
      pattern: "z\\.email\\(|z\\.flattenError"
    - from: "tests/unit/join-waitlist-action.test.ts"
      to: "@/app/actions/join-waitlist"
      via: "named import + FormData fixture helper"
      pattern: "import.*joinWaitlistAction.*from '@/app/actions/join-waitlist'"
---

<objective>
Ship the Phase 3 Server Action stub at `app/actions/join-waitlist.ts` — real Zod email validation, real honeypot field check, real time-trap (≥2s threshold), with stubbed success/duplicate/error/slow branches triggered by deterministic email patterns. Pair with a Vitest unit suite that covers all 8 branches per VALIDATION.md per-task verification map.

Purpose: Phase 3's UX seam runs against a typed, fast-feedback action with no external dependencies. Phase 4 swaps the body in place — the file path (`app/actions/join-waitlist.ts`), exported function name (`joinWaitlistAction`), and discriminated-union shape (`JoinWaitlistResult`) are LOCKED through Phase 4 per D-09 and D-10.

Output: A Server Action and a Vitest spec file, both green; the spec is the load-bearing signal for FORM-03, FORM-06 (typed-value echo), POST-03 (state.duplicate flag), POST-04 (idempotent stub semantics), SPAM-01, SPAM-02.
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
@.planning/phases/03-email-capture-form-stub-action/03-01-SUMMARY.md
@CLAUDE.md
@lib/env.ts

<interfaces>
<!-- The cross-phase API contract Phase 4 inherits — DO NOT change shape -->

Per D-10 (CONTEXT.md) + RESEARCH §Pattern 1 J1 (with `submittedValues` extension at top-level for FORM-06 echo per Pitfall 1):

```ts
// app/actions/join-waitlist.ts (locked through Phase 4)
'use server'

export type JoinWaitlistResult =
  | { status: 'success'; duplicate?: boolean }
  | {
      status: 'error'
      message?: string                          // surfaces via sonner toast (D-12)
      fieldErrors?: Record<string, string>      // surfaces inline (D-12)
      submittedValues?: { email: string }       // FORM-06 echo (Pitfall 1)
    }

export async function joinWaitlistAction(
  _prevState: JoinWaitlistResult | null,
  formData: FormData,
): Promise<JoinWaitlistResult>
```

Stub branch decision matrix (D-11 — Phase 3 only; Phase 4 deletes):
- `dup@example.com`  → `{ status: 'success', duplicate: true }`
- `err@example.com`  → `{ status: 'error', message: 'Something went wrong. Try again in a moment.' }`
- `slow@example.com` → 1500ms delay → `{ status: 'success' }`
- any other valid email → `{ status: 'success' }`

Honeypot field name: `website` (CD-01 — Claude's pick per RESEARCH lines 84–87).
Time-trap field name: `renderedAt` (RESEARCH Pitfall 2 — value passed in via RSC parent prop in Plan 03).
Time-trap threshold: <2000ms since `renderedAt` → silent success (D-15 / SPAM-02).

<!-- Existing analog for Zod idiom -->
From lib/env.ts:1,21,37 (existing Phase 1 pattern):
```ts
import { z } from 'zod'

const schema = z.object({ /* ... */ })
const env = schema.parse(process.env)
```
Pinned `zod: "^4.0.0"` per package.json:27.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Write tests/unit/join-waitlist-action.test.ts (RED — fails because action does not exist yet)</name>
  <files>tests/unit/join-waitlist-action.test.ts</files>
  <read_first>
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-RESEARCH.md (lines 858–942 — Vitest unit-test shape verbatim; Pattern 1 lines 254–331 for action contract; Code Examples §Email-pattern stub branch matrix)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-VALIDATION.md (lines 47–66 — per-requirement verification map; lines 113–122 — Dimension-8 risks for FORM-08, POST-03, POST-04)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-PATTERNS.md (lines 244–276 — test coverage map per requirement ID)
    - /Users/jeff/repos/quibly-landing/vitest.config.ts (verify it picks up `tests/unit/**/*.test.ts`)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-CONTEXT.md (D-10, D-11, D-15 — return shape, stub branches, silent rejection)
  </read_first>
  <behavior>
    Spec MUST cover these 8 branches (each is a `it()` block) — per VALIDATION.md lines 47–66 + RESEARCH lines 875–943:

    1. `'returns silent success when honeypot is filled'` (SPAM-01) — `formData.website='spam'` AND `renderedAt = Date.now() - 5000` (passes time-trap) AND valid email → result is `{ status: 'success' }` with NO `duplicate`, NO `message`, NO `fieldErrors`
    2. `'returns silent success when submitted faster than 2s'` (SPAM-02) — `website=''` AND `renderedAt = Date.now()` (within 2s window) → result is `{ status: 'success' }`
    3. `'returns fieldErrors and echoes typed value on invalid email'` (FORM-03 + FORM-06) — `email='not-an-email'` AND `website=''` AND `renderedAt = Date.now() - 5000` → `result.status === 'error'` AND `result.fieldErrors?.email` is truthy AND `result.submittedValues?.email === 'not-an-email'`
    4. `'returns fieldErrors when email is empty'` (FORM-03) — `email=''` → `result.status === 'error'` AND `result.fieldErrors?.email` is truthy
    5. `'returns success+duplicate for dup@example.com'` (POST-03 — state.duplicate flag check, NOT a UI assertion) — exact match `{ status: 'success', duplicate: true }`
    6. `'returns error with toast message for err@example.com'` (D-12 trigger) — `result.status === 'error'` AND `result.message === 'Something went wrong. Try again in a moment.'` AND `result.fieldErrors === undefined` (so the form routes to sonner per D-12)
    7. `'slow@example.com delays ≥1500ms then succeeds'` (D-11 / CD-03) — uses `performance.now()` before/after; delta ≥ 1500ms AND result is `{ status: 'success' }`
    8. `'plain valid email returns success'` (POST-04 idempotent stub semantics) — `email='real@example.com'` → exact match `{ status: 'success' }` (no `duplicate` property)

    All tests use a `fd()` helper that creates FormData from a `Record<string, string>`.
  </behavior>
  <action>
    Create `tests/unit/join-waitlist-action.test.ts` with the EXACT contents below. This file MUST be written BEFORE the action (RED step of TDD — vitest will fail with "Cannot find module" until Task 2 lands). This is intentional: the test file pins the contract.

    ```ts
    import { describe, it, expect } from 'vitest'
    import { joinWaitlistAction } from '@/app/actions/join-waitlist'

    /**
     * Phase 3 stub action coverage — VALIDATION.md per-task verification map.
     *
     * D-10: tests the discriminated-union return shape locked through Phase 4:
     *   - { status: 'success'; duplicate?: boolean }
     *   - { status: 'error'; message?: string; fieldErrors?: Record<string,string>; submittedValues?: { email: string } }
     *
     * D-11: stub branch matrix (Phase 3 only — Phase 4 deletes the email-pattern triggers):
     *   - dup@example.com   → success + duplicate
     *   - err@example.com   → error + message (sonner trigger)
     *   - slow@example.com  → 1500ms delay → success (CD-03)
     *   - any other valid email → success
     *
     * Honeypot + time-trap (SPAM-01, SPAM-02) are REAL Phase 3 defenses and stay live in Phase 4.
     */

    function fd(entries: Record<string, string>): FormData {
      const f = new FormData()
      for (const [k, v] of Object.entries(entries)) f.append(k, v)
      return f
    }

    // Helper: a renderedAt value 5 seconds in the past — passes the 2s time-trap.
    const PAST_RENDERED_AT = () => String(Date.now() - 5000)

    describe('joinWaitlistAction (Phase 3 stub)', () => {
      it('returns silent success when honeypot is filled (SPAM-01 / D-15)', async () => {
        const r = await joinWaitlistAction(null, fd({
          email: 'real@example.com',
          website: 'https://bot.example.com',
          renderedAt: PAST_RENDERED_AT(),
        }))
        expect(r).toEqual({ status: 'success' })
      })

      it('returns silent success when submitted faster than 2s (SPAM-02 / D-15)', async () => {
        const r = await joinWaitlistAction(null, fd({
          email: 'real@example.com',
          website: '',
          renderedAt: String(Date.now()),
        }))
        expect(r).toEqual({ status: 'success' })
      })

      it('returns fieldErrors and echoes typed value on invalid email (FORM-03 + FORM-06)', async () => {
        const r = await joinWaitlistAction(null, fd({
          email: 'not-an-email',
          website: '',
          renderedAt: PAST_RENDERED_AT(),
        }))
        expect(r.status).toBe('error')
        if (r.status === 'error') {
          expect(r.fieldErrors?.email).toBeTruthy()
          expect(r.submittedValues?.email).toBe('not-an-email')
        }
      })

      it('returns fieldErrors when email is empty (FORM-03)', async () => {
        const r = await joinWaitlistAction(null, fd({
          email: '',
          website: '',
          renderedAt: PAST_RENDERED_AT(),
        }))
        expect(r.status).toBe('error')
        if (r.status === 'error') {
          expect(r.fieldErrors?.email).toBeTruthy()
        }
      })

      it('returns success+duplicate for dup@example.com (POST-03 — state.duplicate flag, never read by UI; D-11 stub trigger)', async () => {
        const r = await joinWaitlistAction(null, fd({
          email: 'dup@example.com',
          website: '',
          renderedAt: PAST_RENDERED_AT(),
        }))
        expect(r).toEqual({ status: 'success', duplicate: true })
      })

      it('returns error with toast message for err@example.com (D-12 sonner routing; D-11 stub trigger)', async () => {
        const r = await joinWaitlistAction(null, fd({
          email: 'err@example.com',
          website: '',
          renderedAt: PAST_RENDERED_AT(),
        }))
        expect(r.status).toBe('error')
        if (r.status === 'error') {
          expect(r.message).toBe('Something went wrong. Try again in a moment.')
          expect(r.fieldErrors).toBeUndefined()
        }
      })

      it('slow@example.com delays ≥1500ms then succeeds (D-11 stub trigger / CD-03)', async () => {
        const t0 = performance.now()
        const r = await joinWaitlistAction(null, fd({
          email: 'slow@example.com',
          website: '',
          renderedAt: PAST_RENDERED_AT(),
        }))
        const dt = performance.now() - t0
        expect(dt).toBeGreaterThanOrEqual(1500)
        expect(r).toEqual({ status: 'success' })
      })

      it('plain valid email returns success (POST-04 stub semantics — every accepted submit is success; D-11 default branch)', async () => {
        const r = await joinWaitlistAction(null, fd({
          email: 'real@example.com',
          website: '',
          renderedAt: PAST_RENDERED_AT(),
        }))
        expect(r).toEqual({ status: 'success' })
      })
    })
    ```

    Run `npm run test:unit` — it MUST FAIL with "Cannot find module '@/app/actions/join-waitlist'" because the action does not exist yet. This is the RED step. Commit message: `test(03-02): add failing spec for joinWaitlistAction stub branches`.

    Per D-17 / D-18 (test layer required before action ships).
  </action>
  <verify>
    <automated>test -f /Users/jeff/repos/quibly-landing/tests/unit/join-waitlist-action.test.ts && cd /Users/jeff/repos/quibly-landing && npm run test:unit 2>&1 | grep -qE "(Cannot find module|Failed to load url)" && echo "RED: test fails as expected — module missing"</automated>
  </verify>
  <acceptance_criteria>
    - File `tests/unit/join-waitlist-action.test.ts` exists
    - File contains a `describe('joinWaitlistAction (Phase 3 stub)'` block
    - File contains EXACTLY 8 `it(...)` blocks (count via `grep -c "^  it(" tests/unit/join-waitlist-action.test.ts`)
    - File imports from `@/app/actions/join-waitlist` (the path Plan-02-Task-2 will create)
    - Test names cite requirement IDs: SPAM-01, SPAM-02, FORM-03, FORM-06, POST-03, POST-04, D-11, D-12
    - `npm run test:unit` exits NON-ZERO with a "Cannot find module" or equivalent module-resolution error (RED step is mandatory — proves test will exercise real action)
  </acceptance_criteria>
  <done>File exists with 8 `it(...)` blocks; vitest run fails with module-not-found error referencing `@/app/actions/join-waitlist`; commit landed: `test(03-02): add failing spec for joinWaitlistAction stub branches`.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Implement app/actions/join-waitlist.ts — real Zod + honeypot + time-trap + stub branches (GREEN)</name>
  <files>app/actions/join-waitlist.ts</files>
  <read_first>
    - /Users/jeff/repos/quibly-landing/tests/unit/join-waitlist-action.test.ts (the spec from Task 1 — implementation must satisfy all 8 cases)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-RESEARCH.md (lines 254–331 — Pattern 1 verbatim source; lines 737–747 Pitfall 1 echo; lines 806–815 Pitfall 5 Zod 4 deprecation)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-PATTERNS.md (lines 42–73 — file requirements + import patterns + anti-patterns)
    - /Users/jeff/repos/quibly-landing/lib/env.ts (existing Zod 4 idiom analog — `import { z } from 'zod'` style + schema-at-module-scope)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-UI-SPEC.md (lines 184–188 — locked validation error copy strings)
    - /Users/jeff/repos/quibly-landing/CLAUDE.md (Recommended Stack > Supporting Libraries — `zod ^4.0.x` confirmed)
  </read_first>
  <action>
    Create `app/actions/join-waitlist.ts` with the EXACT contents below. The body is RESEARCH Pattern 1 (lines 261–328) verbatim, with Pitfall 1's `submittedValues` extension at the top-level union (J1 judgment call), and PHASE-3-STUB markers per security threat T-03-06 mitigation.

    ```ts
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
     *   - `z.email(...)` (top-level), NOT `z.string().email(...)`
     *   - `z.flattenError(parsed.error)`, NOT the deprecated `parsed.error.flatten()`
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
    ```

    Critical adherence rules:
    - File starts with `'use server'` directive on line 1 (RESEARCH line 262).
    - ONE named export `joinWaitlistAction` AND one type export `JoinWaitlistResult` (D-09 — names locked through Phase 4; D-10 — shape locked through Phase 4).
    - Zod 4 idiom: `z.email({ error: '...' })` (NOT `z.string().email('...')` — Pitfall 5). Top-level `z.flattenError()` (NOT `.flatten()`).
    - Honeypot check is BEFORE Zod (RESEARCH lines 284–287) — bots get silent success without spending Zod CPU.
    - Time-trap check is BEFORE Zod (RESEARCH lines 289–293) — same reason.
    - Each stub branch carries the EXACT comment `// PHASE-3-STUB — DELETE IN PHASE 4` on the line above it (T-03-06 mitigation — grep-removable). Four occurrences total. (D-11 prefix is decorative for traceability — the gate verifier matches the canonical `PHASE-3-STUB — DELETE IN PHASE 4` substring.)
    - The action does NOT throw on validation errors — RESEARCH lines 722–732 anti-pattern (React 19 escalates throws to error boundary, defeats `useActionState` flow).
    - The action does NOT import `resend`, `@upstash/*`, or any Phase 4 SDK.
    - The action does NOT log to console (D-15: silent rejection means no observability either; Phase 4 adds `track('bot_rejected')` per CONTEXT Deferred Items).

    After implementation, run `npm run test:unit`. All 8 cases from Task 1 MUST pass (GREEN step).

    Commit message: `feat(03-02): implement joinWaitlistAction stub with Zod + honeypot + time-trap`.

    Per D-09 (locked exports), D-10 (locked discriminated-union shape), D-11 (deterministic email-pattern stub branches — Phase 3 only), D-15 (silent rejection of bot signals).
  </action>
  <verify>
    <automated>test -f /Users/jeff/repos/quibly-landing/app/actions/join-waitlist.ts && head -1 /Users/jeff/repos/quibly-landing/app/actions/join-waitlist.ts | grep -q "'use server'" && grep -q "export.*joinWaitlistAction" /Users/jeff/repos/quibly-landing/app/actions/join-waitlist.ts && grep -q "export type JoinWaitlistResult" /Users/jeff/repos/quibly-landing/app/actions/join-waitlist.ts && grep -q "z.email" /Users/jeff/repos/quibly-landing/app/actions/join-waitlist.ts && grep -q "z.flattenError" /Users/jeff/repos/quibly-landing/app/actions/join-waitlist.ts && ! grep -q "z.string().email" /Users/jeff/repos/quibly-landing/app/actions/join-waitlist.ts && ! grep -qE "\\.error\\.flatten\\(\\)" /Users/jeff/repos/quibly-landing/app/actions/join-waitlist.ts && [ "$(grep -c 'PHASE-3-STUB — DELETE IN PHASE 4' /Users/jeff/repos/quibly-landing/app/actions/join-waitlist.ts)" -ge 4 ] && cd /Users/jeff/repos/quibly-landing && npx tsc --noEmit && npm run test:unit -- tests/unit/join-waitlist-action.test.ts</automated>
  </verify>
  <acceptance_criteria>
    - File `app/actions/join-waitlist.ts` exists
    - Line 1 is exactly `'use server'`
    - File exports `joinWaitlistAction` (named export) and `JoinWaitlistResult` (type export)
    - File contains `z.email(` (Zod 4 idiom)
    - File contains `z.flattenError(` (Zod 4 idiom)
    - File does NOT contain `z.string().email` (Zod 3 deprecated)
    - File does NOT contain `parsed.error.flatten()` (Zod 3 deprecated)
    - File does NOT contain `import { resend }` or `from 'resend'` or `@upstash` (Phase 4 territory)
    - File does NOT contain `console.log`, `console.warn`, or `console.error` calls (D-15 silent rejection)
    - File does NOT contain `throw` statements anywhere (RESEARCH anti-pattern)
    - The literal comment substring `PHASE-3-STUB — DELETE IN PHASE 4` appears AT LEAST 4 times (one per stub branch — T-03-06 mitigation)
    - `npx tsc --noEmit` exits 0 (no TS errors)
    - `npm run test:unit -- tests/unit/join-waitlist-action.test.ts` passes ALL 8 tests (GREEN)
  </acceptance_criteria>
  <done>Action file exists per spec; vitest suite has 8 passing tests; commit `feat(03-02): implement joinWaitlistAction stub with Zod + honeypot + time-trap` landed.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client → Server Action | Untrusted FormData (email, honeypot, renderedAt) crosses HTTPS boundary into `'use server'` function |
| Server Action → process | Action runs in Node.js with full app permissions (no audience write yet — Phase 4 adds restricted Resend SDK) |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-01 | I (Information Disclosure) | `dup@example.com` stub branch | mitigate | Returns `{ status: 'success', duplicate: true }` — the `duplicate` flag is set on the return but the UI never reads it (POST-03). Plan 03's WaitlistForm renders the success block without consulting `state.duplicate`. e2e spec in Plan 05 asserts visual identity. **Critical:** because action stubs the duplicate via a hard-coded email pattern, the flag's presence in the return is intentional for downstream Phase 5 analytics — but Phase 3's UI MUST NOT differentiate. |
| T-03-02 | D (Denial of Service) / Spoofing | Form endpoint | mitigate | Honeypot field `website` (SPAM-01) — silent success when filled. Time-trap on `renderedAt` (SPAM-02) — silent success when submit is <2s after render. Both REAL, both pass the Vitest suite in Task 1. Defense-in-depth from RESEARCH PITFALLS Pitfall 3. Phase 4 layers Upstash rate-limit + disposable-domain block on top. |
| T-03-03 | I (Information Disclosure via XSS) | `submittedValues.email` echoed in error response | mitigate | The action returns `submittedValues.email` as a plain JSON string. Plan 03's `<Input defaultValue={...}>` renders it via React, which auto-escapes attribute values. No `dangerouslySetInnerHTML`, no manual concat. |
| T-03-04 | T (Tampering) / Spoofing | Direct fetch with crafted body (bypassing form) | mitigate | Zod schema enforces `email` field presence + format + 254-char max length. Honeypot field check still applies (silent success). Time-trap still applies. All bypass attempts return success-shape with no audience write (Phase 3 has no audience to write to; Phase 4 inherits these defenses). |
| T-03-05 | T (Tampering / CSRF) | Server Action POST | accept | Next.js 16.2 Server Actions include built-in CSRF protection: Origin header verification + per-action ID hash. No additional task needed. |
| T-03-06 | I (Information Disclosure) | Stub branches leaking to production | mitigate | Each stub branch is preceded by the exact comment `// PHASE-3-STUB — DELETE IN PHASE 4` (4 occurrences in `app/actions/join-waitlist.ts`). Phase 4 plan handoff: `grep "PHASE-3-STUB" app/actions/join-waitlist.ts` returns exactly the lines to delete. Acceptance criterion enforces ≥4 occurrences. |

No `high` severity threats unmitigated. T-03-01 is highest because it's the enumeration-defense seam — verified at unit level here, e2e in Plan 05.
</threat_model>

<verification>
After both tasks complete:

1. **Vitest unit suite (load-bearing):**
   ```bash
   npm run test:unit
   ```
   Expected: All 8 tests in `tests/unit/join-waitlist-action.test.ts` pass; exit 0.

2. **TypeScript:**
   ```bash
   npx tsc --noEmit
   ```
   Expected: exit 0 (discriminated union narrowing in tests must type-check).

3. **Lint:**
   ```bash
   npm run lint
   ```
   Expected: exit 0.

4. **Stub-branch grep audit (T-03-06):**
   ```bash
   grep -c "PHASE-3-STUB — DELETE IN PHASE 4" app/actions/join-waitlist.ts
   ```
   Expected: 4 (one per stub branch).

5. **Zod 4 idiom audit (Pitfall 5):**
   ```bash
   grep -E "z\.string\(\)\.email|\.error\.flatten\(\)" app/actions/join-waitlist.ts
   ```
   Expected: NO matches (Zod 3 idioms forbidden).

6. **No external service imports:**
   ```bash
   grep -E "from 'resend'|from '@upstash" app/actions/join-waitlist.ts
   ```
   Expected: NO matches (Phase 4 territory).

7. **No console output (D-15 silent rejection):**
   ```bash
   grep -E "console\.(log|warn|error|info)" app/actions/join-waitlist.ts
   ```
   Expected: NO matches.
</verification>

<success_criteria>
- `app/actions/join-waitlist.ts` ships the stub Server Action — locked file path, exports, and shape per D-09/D-10 (Phase 4 swaps body, not surface)
- Zod 4 idioms verified: `z.email()` + `z.flattenError()` (Pitfall 5)
- Honeypot + time-trap return success-shape silently (D-15)
- 4 stub branches each tagged `// PHASE-3-STUB — DELETE IN PHASE 4` (T-03-06)
- 8 Vitest cases cover: honeypot, time-trap, invalid email + echo, empty email, dup, err, slow (≥1500ms), plain valid
- Type narrowing on discriminated union compiles cleanly
- All quality gates green (`npx tsc --noEmit`, `npm run lint`, `npm run test:unit`)
</success_criteria>

<output>
After completion, create `.planning/phases/03-email-capture-form-stub-action/03-02-SUMMARY.md` documenting:
- Final exported types (paste the type signature) — Plan 03 imports these
- Vitest output: pass count, runtime
- The 4 PHASE-3-STUB lines with file:line references for Phase 4's removal task
- Confirmation that `submittedValues` is hoisted to the top-level error variant (not nested in fieldErrors) — load-bearing for Plan 03's `defaultValue` echo (FORM-06 / Pitfall 1)
</output>
</output>
