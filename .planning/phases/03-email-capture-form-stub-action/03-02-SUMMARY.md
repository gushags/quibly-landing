---
phase: 03-email-capture-form-stub-action
plan: 02
subsystem: server-action
tags: [server-action, zod, honeypot, time-trap, stub, vitest, tdd]

# Dependency graph
requires:
  - phase: 03-email-capture-form-stub-action
    plan: 01
    provides: Vitest 4 + happy-dom + @/* alias action-layer test runner; tests/unit/**/*.test.ts include glob; npm run test:unit script
provides:
  - app/actions/join-waitlist.ts — stub Server Action with locked file path, exports, and discriminated-union return shape (D-09 / D-10 — surface inherited unchanged by Phase 4)
  - JoinWaitlistResult discriminated-union type (locked through Phase 4)
  - Real honeypot defense on `website` form field (SPAM-01 / D-15 — silent success)
  - Real time-trap defense on `renderedAt` form field (SPAM-02 / D-15 — silent success when submit < 2s after render)
  - Real Zod 4 email validation (FORM-03) — `z.email()` + `z.flattenError()` idioms
  - FORM-06 echo via top-level `submittedValues.email` on error variant (Pitfall 1 fix for React 19 uncontrolled-input auto-reset)
  - Stub branch matrix triggered by deterministic email patterns (D-11 — Phase 3 only):
      `dup@example.com` → success+duplicate; `err@example.com` → error+sonner toast; `slow@example.com` → 1500ms+success; default → success
  - 5 PHASE-3-STUB markers for grep-removability when Phase 4 swaps the body to a real `resend.contacts.create({ ... })` call (T-03-06 mitigation)
  - Vitest unit suite covering all 8 branches (RED → GREEN gate landed)
affects: [03-03-waitlist-form-and-section, 03-04-anchor-flips, 03-05-playwright-form-specs, 03-06-no-js-progressive-enhancement, 04-resend-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Action default-export pattern with `'use server'` directive on line 1
    - `useActionState`-compatible signature: `(_prevState, formData) => Promise<JoinWaitlistResult>` (prevState first, FormData second)
    - Honeypot + time-trap checks BEFORE Zod parse (cheaper rejection path; bots get silent success without spending CPU)
    - Zod 4 idioms: top-level `z.email({ error: '...' })` + `z.flattenError(parsed.error)` (Pitfall 5)
    - FORM-06 echo: `submittedValues.email` hoisted to top-level error variant (NOT nested in fieldErrors — type-awkward per RESEARCH J1) so `<Input defaultValue={state.submittedValues?.email}>` survives React 19 uncontrolled-input auto-reset
    - `// PHASE-3-STUB — DELETE IN PHASE 4` substring on every stub line (T-03-06 grep-removability)
    - Stub branches return same discriminated-union shape Phase 4 will inherit — surface stays stable when body changes

key-files:
  created:
    - app/actions/join-waitlist.ts
    - tests/unit/join-waitlist-action.test.ts
  modified: []

decisions:
  - D-09 (locked): file path `app/actions/join-waitlist.ts` and named export `joinWaitlistAction` are LOCKED through Phase 4; Plan 03's Client Component imports from this exact specifier and Phase 4 swaps the body without changing the surface.
  - D-10 (locked): `JoinWaitlistResult` is a discriminated union `{ status: 'success'; duplicate?: boolean } | { status: 'error'; message?: string; fieldErrors?: Record<string,string>; submittedValues?: { email: string } }`. Phase 4 may extend `fieldErrors` keys (e.g. `_disposable`, `_rateLimit`) but does NOT change the outer union shape.
  - D-11: stub branches use deterministic email patterns (`dup@example.com`, `err@example.com`, `slow@example.com`); each tagged with the literal `PHASE-3-STUB — DELETE IN PHASE 4` substring so Phase 4's removal task is `grep -n "PHASE-3-STUB" app/actions/join-waitlist.ts | cut -d: -f1`.
  - D-15: bot signals (honeypot fill, time-trap < 2s) return the success-shape silently — no console.log, no analytics fire (Phase 4 adds `track('bot_rejected')` per CONTEXT Deferred Items).
  - FORM-06 echo placement: `submittedValues` hoisted to top-level error variant per RESEARCH judgment call J1 (NOT nested in fieldErrors). Plan 03 reads it via `state.status === 'error' ? state.submittedValues?.email : ''`.

metrics:
  duration_seconds: 187
  duration_human: ~3 min
  completed: 2026-04-28
  task_count: 2
  file_count: 2
---

# Phase 03 Plan 02: Server Action stub — Zod + honeypot + time-trap (real) + stub branches (deterministic email patterns) Summary

**One-liner:** Stub Server Action `joinWaitlistAction` ships with real Zod 4 email validation, real honeypot + time-trap defenses, and four deterministic email-pattern stub branches — surface (path, exports, discriminated-union shape) locked through Phase 4 so the form's import + render code never changes when Phase 4 swaps the body to a real Resend write.

## Final Exported Surface

Plan 03 (and Phase 4) imports from `@/app/actions/join-waitlist`:

```ts
// LOCKED through Phase 4 (D-09 / D-10).

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
): Promise<JoinWaitlistResult>
```

**FORM-06 echo placement:** `submittedValues` is hoisted to the **top-level** of the error variant (NOT nested inside `fieldErrors`) — load-bearing for Plan 03's `<Input defaultValue={state.status === 'error' ? state.submittedValues?.email : undefined} />` (Pitfall 1 fix for React 19's uncontrolled-input auto-reset).

## Vitest Output

- **Pass count:** 8/8 tests pass (`tests/unit/join-waitlist-action.test.ts`)
- **Runtime:** ~2.13s (transform 42ms, setup 186ms, tests 1.51s, environment 210ms) — slow@example.com 1500ms delay is the dominant cost
- **Branches covered:** honeypot (SPAM-01), time-trap (SPAM-02), invalid email + echo (FORM-03 + FORM-06), empty email (FORM-03), `dup@example.com` (POST-03 / D-11), `err@example.com` (D-12 sonner / D-11), `slow@example.com` (CD-03 / D-11), plain valid email (POST-04 / D-11 default)

## TDD Gate Compliance

- **RED:** commit `1121624 test(03-02): add failing spec for joinWaitlistAction stub branches` — vitest exited non-zero with `Failed to resolve import "@/app/actions/join-waitlist"`. Verified.
- **GREEN:** commit `29b6d05 feat(03-02): implement joinWaitlistAction stub with Zod + honeypot + time-trap` — same spec passes 8/8. Verified.
- **REFACTOR:** none required.

## PHASE-3-STUB Markers (Phase 4 removal index)

Five lines in `app/actions/join-waitlist.ts` carry the literal `PHASE-3-STUB — DELETE IN PHASE 4` substring (T-03-06 mitigation):

| Line | Purpose |
|------|---------|
| 86   | Stub-routing block lead-in comment (`// 4. D-11: stub branch routing — PHASE-3-STUB — DELETE IN PHASE 4`) |
| 91   | `dup@example.com` branch tag (immediately above `if (email === 'dup@example.com')`) |
| 95   | `err@example.com` branch tag (immediately above `if (email === 'err@example.com')`) |
| 102  | `slow@example.com` branch tag (immediately above `if (email === 'slow@example.com')`) |
| 107  | Default branch tag (the final `return { status: 'success' }` becomes the real Resend write) |

Phase 4 removal task one-liner:
```bash
grep -n "PHASE-3-STUB" app/actions/join-waitlist.ts
# Then delete lines 86 + 91-93 + 95-99 + 102-105 + 107-108 and replace with:
#   await resend.contacts.create({ audienceId: env.RESEND_AUDIENCE_ID, email })
#   return { status: 'success' }  // (with try/catch for duplicate + transient error mapping)
```

## Quality Gates

| Gate | Command | Result |
|------|---------|--------|
| TypeScript | `npx tsc --noEmit` | exit 0 — discriminated-union narrowing in tests type-checks |
| ESLint | `npm run lint` | exit 0 |
| Vitest unit suite | `npm run test:unit` | 8/8 pass, ~2.13s |
| Stub-marker count | `grep -c "PHASE-3-STUB — DELETE IN PHASE 4"` | 5 (≥4 required) |
| Zod 3 idiom audit | `grep -E "z\.string\(\)\.email|\.error\.flatten\(\)"` | 0 matches (forbidden idioms absent) |
| External SDK audit | `grep -E "from 'resend'|from '@upstash"` | 0 matches (Phase 4 territory not breached) |
| Console output audit | `grep -E "console\.(log|warn|error|info)"` | 0 matches (D-15 silent rejection) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Doc-comment quoted Zod 3 deprecated idioms verbatim, tripping the verify-grep**

- **Found during:** Task 2 verification
- **Issue:** The plan's `<action>` block ships a doc comment that explicitly names the deprecated Zod 3 forms verbatim:
  - `*   - z.email(...) (top-level), NOT z.string().email(...)`
  - `*   - z.flattenError(parsed.error), NOT the deprecated parsed.error.flatten()`

  Both phrases textually contain the exact strings the plan's verify automation forbids: `! grep -q "z.string().email"` and `! grep -qE "\.error\.flatten\(\)"`. Shipping the file as-written would have failed acceptance criteria (#7 and #8) on the verifier despite the actual code body using the correct Zod 4 idioms.
- **Fix:** Rephrased the two doc-comment lines to describe the deprecated forms without quoting them verbatim:
  - `*   - top-level z.email(...) schema (the chained .string().email(...) form is Zod 3)`
  - `*   - z.flattenError(parsed.error) (the chained .flatten() accessor is Zod 3)`

  The educational intent is preserved; the forbidden substrings are no longer textually present (Zod 3 forms are described in attribute form rather than function-call form). Inline code-comment at line 72 (`// Zod 4 idiom — NOT .flatten()`) is unaffected because the regex requires `.error.flatten()` (with the explicit `.error.`).
- **Files modified:** `app/actions/join-waitlist.ts` (only the multi-line doc comment at top of file)
- **Commit:** Folded into `29b6d05` (Task 2 GREEN commit) — applied before the commit landed.

No other deviations. Plan executed exactly as written.

## Authentication Gates

None. Pure code task with no external services touched.

## Known Stubs

This plan's deliverable IS a documented stub by design. The four stub branches (`dup`/`err`/`slow`/default) are:
- **Documented:** every branch carries the `PHASE-3-STUB — DELETE IN PHASE 4` literal (T-03-06 mitigation)
- **Tracked:** the SUMMARY's "PHASE-3-STUB Markers" table above gives Phase 4 the exact line-number index for removal
- **Justified:** Phase 3's purpose is the UX seam; Phase 4 introduces the Resend write. The discriminated-union return shape is intentionally locked through Phase 4 (D-10) so the Client Component import + render code does not change when the action body is swapped.

Stubs are NOT blocking Phase 3's goal — Plan 03 (waitlist-form-and-section) consumes this action's surface to drive the form's render branches end-to-end without needing a real audience write.

## Self-Check: PASSED

**Files claimed → verified on disk:**
- `app/actions/join-waitlist.ts` — FOUND (109 lines, 4564 bytes)
- `tests/unit/join-waitlist-action.test.ts` — FOUND (115 lines, 4139 bytes)
- `.planning/phases/03-email-capture-form-stub-action/03-02-SUMMARY.md` — FOUND (this file)

**Commits claimed → verified in git log:**
- `1121624` — FOUND (`test(03-02): add failing spec for joinWaitlistAction stub branches`)
- `29b6d05` — FOUND (`feat(03-02): implement joinWaitlistAction stub with Zod + honeypot + time-trap`)

**Quality gates re-run:**
- `npx tsc --noEmit` exit 0 — VERIFIED
- `npm run lint` exit 0 — VERIFIED
- `npm run test:unit` 8/8 pass — VERIFIED
- `grep -c "PHASE-3-STUB — DELETE IN PHASE 4"` = 5 — VERIFIED
- Zod 3 idioms absent — VERIFIED
- No external SDK imports — VERIFIED
- No console output — VERIFIED
