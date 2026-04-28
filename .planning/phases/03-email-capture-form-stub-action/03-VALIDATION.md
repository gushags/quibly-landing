---
phase: 3
slug: email-capture-form-stub-action
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-27
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Sourced from `03-RESEARCH.md` §Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Unit framework** | Vitest `^4.1.5` + happy-dom `^20.9.0` + `@testing-library/react` `^16.3.x` (NEW — Wave 0 installs) |
| **Unit config file** | `vitest.config.ts` (NEW — Wave 0) |
| **Unit setup file** | `tests/setup.ts` (NEW — jest-dom matchers + RTL cleanup) |
| **E2E framework** | Playwright `1.59.1` (existing — Phase 2) |
| **E2E config file** | `playwright.config.ts` (MODIFY — add `no-js` project) |
| **Type-check** | `tsc --noEmit` (existing — `npm run check`) |
| **Lint** | ESLint (existing — `npm run lint`) |
| **Quick run command** | `npm run check && npm run lint && npm run test:unit` |
| **Full suite command** | `npm run check && npm run lint && npm run test:unit && npm run test:e2e` |
| **Estimated runtime** | Quick: ~10–30s · Full: ~3–4 min |

---

## Sampling Rate

- **After every task commit:** Run `npm run check && npm run lint && npm run test:unit` (~10–30s)
- **After every plan wave:** Run `npm run check && npm run lint && npm run test:unit && npm run test:e2e` (~3–4 min)
- **Before `/gsd-verify-work`:** Full suite must be green AND CI green (Vitest job + Playwright job + Lighthouse CI job all passing)
- **Max feedback latency:** 30 seconds for quick, 4 minutes for full suite

---

## Per-Task Verification Map

> Filled in by planner per plan/task. The table below maps each phase requirement to its load-bearing test signal — planner's per-task `<automated>` blocks must reference one of these commands.

| Req ID | Behavior | Test Type | Automated Command | File Exists |
|--------|----------|-----------|-------------------|-------------|
| FORM-01 | Single email input field rendered | unit (Vitest+RTL) | `vitest run tests/unit/waitlist-form.test.tsx -t "renders the form in idle state"` | ❌ W0 |
| FORM-02 | `type="email" inputMode="email" autoComplete="email"` | unit (Vitest+RTL) | `vitest run tests/unit/waitlist-form.test.tsx -t "input has correct attributes"` | ❌ W0 |
| FORM-03 | Server-side Zod email validation | unit (Vitest action) | `vitest run tests/unit/join-waitlist-action.test.ts -t "rejects invalid email"` | ❌ W0 |
| FORM-04 | "Join the waitlist" CTA copy verbatim | unit + e2e | `vitest run -t "join the waitlist"` + `playwright test -g "submit copy"` | ❌ W0 |
| FORM-05 | Pending state visible (button disabled + spinner) | e2e (Playwright) | `playwright test tests/form/pending-state.spec.ts` | ❌ W0 |
| FORM-06 | Inline error preserves typed value (FormData echo) | unit + e2e | `vitest run -t "echoes typed value"` + `playwright test -g "preserves email after validation error"` | ❌ W0 |
| FORM-07 | Enter-key submit works | e2e (Playwright) | `playwright test tests/form/enter-key-submit.spec.ts` | ❌ W0 |
| FORM-08 | No-JS form submittable (graceful degradation) | e2e (Playwright `javaScriptEnabled: false`) | `playwright test tests/no-js/waitlist-form-progressive.spec.ts` | ❌ W0 |
| FORM-09 | `useActionState` typed binding | type-check + unit | `tsc --noEmit` + `vitest run tests/unit/waitlist-form.test.tsx` | ❌ W0 |
| POST-01 | In-place success replaces form (no nav) | e2e (Playwright) | `playwright test tests/form/success-state.spec.ts -g "in-place"` | ❌ W0 |
| POST-02 | Success copy verbatim ("You're on the list. Check your inbox (and spam folder) for confirmation.") | unit + e2e | `vitest run -t "success copy verbatim"` + `playwright test -g "Check your inbox"` | ❌ W0 |
| POST-03 | Already-subscribed visually identical to fresh-signup | unit (state.duplicate flag, not in DOM) + e2e (visual identity) | `vitest run -t "duplicate flag"` + `playwright test -g "duplicate visual identity"` | ❌ W0 |
| POST-04 | Idempotent submit (browser-level, double-click safe) | e2e (Playwright) | `playwright test tests/form/idempotent.spec.ts` | ❌ W0 |
| SPAM-01 | Honeypot rejects silently (returns success-shape) | unit (Vitest action) | `vitest run tests/unit/join-waitlist-action.test.ts -t "honeypot"` | ❌ W0 |
| SPAM-02 | Time-trap rejects <2s submissions silently | unit (Vitest action) | `vitest run tests/unit/join-waitlist-action.test.ts -t "time-trap"` | ❌ W0 |

*Status legend: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · W0 = blocked on Wave 0 install*

The planner's per-task `<automated>` blocks should reference the commands above so each task has a load-bearing signal. Tasks that ship test files satisfy the "❌ W0" gap for their requirement.

---

## Wave 0 Requirements

Net-new test infrastructure files Phase 3 must produce before later waves can verify. Per RESEARCH.md §Validation Architecture > Wave 0 Gaps:

- [ ] `vitest.config.ts` — Vitest config with `happy-dom` env, `@vitejs/plugin-react`, `@/` path alias, setupFiles
- [ ] `tests/setup.ts` — `@testing-library/jest-dom` matchers + RTL `cleanup()` after each test
- [ ] `package.json` scripts — `test:unit` (`vitest run`), `test:unit:watch` (`vitest`)
- [ ] `playwright.config.ts` — add `no-js` Playwright project (project-level `use: { javaScriptEnabled: false }`)
- [ ] `.github/workflows/test.yml` (or extend existing `lighthouse.yml`) — Vitest job + Playwright job (parallel)
- [ ] Framework install (single `npm i -D` invocation):
  ```
  npm i -D vitest@^4 @vitejs/plugin-react@^4.3 \
    @testing-library/react@^16.3 @testing-library/dom@^10 \
    @testing-library/jest-dom@^6.9 @testing-library/user-event@^14.6 \
    happy-dom@^20
  ```

Test specs introduced in later waves (after Wave 0 framework is live):

- [ ] `tests/unit/join-waitlist-action.test.ts` — covers FORM-03, FORM-06 (action shape), POST-03 (state.duplicate flag), SPAM-01, SPAM-02, all 4 stub branches
- [ ] `tests/unit/waitlist-form.test.tsx` — covers FORM-01, FORM-02, FORM-04 (copy), FORM-09 (binding), POST-02 (copy in DOM)
- [ ] `tests/form/pending-state.spec.ts` — FORM-05
- [ ] `tests/form/success-state.spec.ts` — POST-01, POST-02, POST-03 (visual identity)
- [ ] `tests/form/validation-error.spec.ts` — FORM-06 (real-DOM verification of value retention)
- [ ] `tests/form/server-error-toast.spec.ts` — D-12 sonner trigger on `err@example.com`
- [ ] `tests/form/idempotent.spec.ts` — POST-04
- [ ] `tests/form/enter-key-submit.spec.ts` — FORM-07
- [ ] `tests/form/anchor-scroll.spec.ts` — D-01/D-02 (hero/secondary CTAs scroll to `#waitlist`)
- [ ] `tests/no-js/waitlist-form-progressive.spec.ts` — FORM-08

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Add `Vitest` job name to `main` branch protection's required-status-checks | D-18 | GitHub UI gate — same friction as Phase 2 D-34 Lighthouse-CI gate; cannot be automated from a workflow file | After test workflow lands and runs once on a PR: open `Settings → Branches → Branch protection rule for main → Require status checks → Add "Vitest" + "Playwright" job names from the latest run` |
| Add `Playwright` job name to `main` branch protection | D-18 | Same as above | Same flow; both job names added in the same edit |
| Founder review of draft section H2 + sub-copy strings | D-04 / UI-SPEC Copywriting Contract | Subjective copy decision; founder edits in PR | PR comment thread or checklist titled "Copy review (founder-only)" listing every draft string with file/line pointers |
| LCP guard: confirm hero `<h1>` remains LCP element after form section renders | HERO-06 (inherited from Phase 2) | Visual perception + Lighthouse spot-check; per-PR Lighthouse CI gate covers regression but eyeball confirms locally | Run `npm run build && npm start`, open in mobile-emulated DevTools, view Performance trace → confirm LCP target is hero H1 |

---

## Validation Surface Risks (Dimension-8 — planner MUST address)

Per RESEARCH.md §Validation surface ambiguity:

| Req ID | Risk | Required Mitigation in Plan |
|--------|------|------------------------------|
| FORM-08 | No-JS path: `useActionState` state NOT preserved across the round-trip → success block won't render server-side. The "form is in idle state after no-JS submit" signal is weaker than "success block renders." | Plan must EITHER document graceful-degradation acceptance (form processes, user sees idle state on return — document this in the no-JS spec assertions) OR scope an additional `redirect('/?signup=success')`-based no-JS success surface as a separate task. See RESEARCH Open Question 1. |
| POST-03 | "Visually identical" is structural — a future commit could subtly change the success block for `duplicate: true` and slip past loose assertions. | E2E spec must use a structural snapshot: `expect(page.locator('[role=status]')).toHaveText("You're on the list. Check your inbox (and spam folder) for confirmation.")` AND assert no `data-duplicate` attribute is present in the rendered tree. |
| POST-04 | "Idempotent submit" is ambiguous for a stubbed action with no real audience to dedupe against. | E2E test asserts: clicking submit twice rapidly (with `disabled={pending}` preventing the second submit during pending) results in only one action invocation AND a final success state. Real audience-level idempotency is Phase 4 scope and out of phase here. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependency
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (every "❌ W0" row above)
- [ ] No watch-mode flags in CI commands (`vitest run`, not `vitest`)
- [ ] Feedback latency < 30s for quick, < 4min for full suite
- [ ] Three Dimension-8 risks (FORM-08, POST-03, POST-04) explicitly addressed in plan tasks
- [ ] `nyquist_compliant: true` set in frontmatter once planner cross-references this file

**Approval:** pending
