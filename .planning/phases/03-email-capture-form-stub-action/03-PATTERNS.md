# Phase 3: email-capture-form-stub-action — Pattern Map

**Mapped:** 2026-04-27
**Files analyzed:** 18 (10 NEW + 8 MODIFIED)
**Analogs found:** 14 / 18 (4 are first-of-kind in the repo and reference RESEARCH.md patterns)

> Source authority: in-repo analogs > `03-RESEARCH.md` Patterns 1–5 (verified by gsd-phase-researcher) > external docs.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest In-Repo Analog | Match Quality |
|-------------------|------|-----------|------------------------|---------------|
| `app/actions/join-waitlist.ts` (NEW) | server-action | request-response | none in repo (`lib/env.ts` for Zod idiom) | NO ANALOG → `03-RESEARCH.md` Pattern 1 |
| `components/waitlist/waitlist-form.tsx` (NEW) | client-component | event-driven (form submit) | `components/ui/sonner.tsx` (only other `'use client'` file) | partial-match → `03-RESEARCH.md` Pattern 2 |
| `components/sections/waitlist-form-section.tsx` (NEW; rename) | RSC section | render-only | `components/sections/placeholder-form-section.tsx` (this file IS the rename) | exact (rename + body swap) |
| `vitest.config.ts` (NEW) | config | build-time | none in repo (no Vitest yet) | NO ANALOG → `03-RESEARCH.md` Pattern 3 |
| `tests/setup.ts` (NEW) | test-config | build-time | none in repo | NO ANALOG → `03-RESEARCH.md` Pattern 3 |
| `tests/unit/join-waitlist-action.test.ts` (NEW) | test (unit) | request-response | none in repo | NO ANALOG → `03-RESEARCH.md` lines 875–943 |
| `tests/unit/waitlist-form.test.tsx` (NEW) | test (unit, RTL) | render-assert | none in repo | NO ANALOG → `03-RESEARCH.md` lines 944–981 |
| `tests/form/pending-state.spec.ts` (NEW) | test (e2e) | render-assert | `tests/visual/above-fold.spec.ts` | role-match (Playwright shape) |
| `tests/form/success-state.spec.ts` (NEW) | test (e2e) | render-assert | `tests/visual/above-fold.spec.ts` | role-match |
| `tests/form/validation-error.spec.ts` (NEW) | test (e2e) | render-assert | `tests/visual/above-fold.spec.ts` | role-match |
| `tests/form/server-error-toast.spec.ts` (NEW) | test (e2e) | event-driven | `tests/visual/above-fold.spec.ts` | role-match |
| `tests/form/idempotent.spec.ts` (NEW) | test (e2e) | event-driven | `tests/visual/above-fold.spec.ts` | role-match |
| `tests/form/enter-key-submit.spec.ts` (NEW) | test (e2e) | event-driven | `tests/visual/above-fold.spec.ts` | role-match |
| `tests/form/anchor-scroll.spec.ts` (NEW) | test (e2e) | event-driven | `tests/visual/above-fold.spec.ts` | role-match |
| `tests/no-js/waitlist-form-progressive.spec.ts` (NEW) | test (e2e, no-JS) | request-response | `tests/visual/above-fold.spec.ts` | role-match → `03-RESEARCH.md` Pattern 4 |
| `.github/workflows/test.yml` (NEW) | CI workflow | build-time | `.github/workflows/lighthouse.yml` | role-match → `03-RESEARCH.md` Pattern 5 |
| `app/page.tsx` (MOD) | RSC page | render-only | self (1-line import swap) | exact |
| `app/layout.tsx` (MOD) | RSC root layout | render-only | self (insert `<Toaster/>` after `{children}`) | exact |
| `components/sections/hero.tsx` (MOD) | RSC section | render-only | self + `<Button asChild>` pattern (button.tsx CVA + Slot.Root) | exact |
| `components/sections/secondary-cta.tsx` (MOD) | RSC section | render-only | self + `<Button asChild>` pattern | exact |
| `playwright.config.ts` (MOD) | config | build-time | self (add `projects: []` per `03-RESEARCH.md` Pattern 4) | exact |
| `package.json` (MOD) | manifest | build-time | self (add `test:unit`, `test:unit:watch`, devDeps) | exact |

---

## Pattern Assignments

### NEW — `app/actions/join-waitlist.ts` (server-action, request-response)

**Analog:** **NONE in repo.** No prior Server Action exists. Use `03-RESEARCH.md` Pattern 1 (lines 254–331) verbatim — it is the verified spec for the entire file.

**Closest adjacent precedent:**
- `lib/env.ts` (lines 21–37) — establishes Zod 4 + `z.object({...}).parse(...)` import + schema-at-module-scope idiom.

**Imports pattern** (from `lib/env.ts:1`, mirror Zod 4 import style):
```ts
import { z } from 'zod'
```

**Action body** — copy from `03-RESEARCH.md` lines 261–328 verbatim (with the `submittedValues` field on the error branch per Pitfall 1, lines 737–747). Key load-bearing rules:

1. **Zod 4 idiom (NOT Zod 3):** `z.email()` is the v4 top-level form, NOT `z.string().email()`. Use `z.flattenError(parsed.error)`, NOT the deprecated `parsed.error.flatten()`. Zod 4 is pinned at `^4.0.0` per `package.json:27`.
2. **Honeypot rejection BEFORE Zod** (lines 284–287 of RESEARCH) — silent success, returns `{ status: 'success' }`. Per CONTEXT D-15.
3. **Time-trap rejection BEFORE Zod** (lines 289–293 of RESEARCH) — `Date.now() - renderedAt < 2000` → silent success.
4. **Stub branches via email pattern matching** (CONTEXT D-11):
   - `dup@example.com` → `{ status: 'success', duplicate: true }`
   - `err@example.com` → `{ status: 'error', message: 'Something went wrong. Try again in a moment.' }`
   - `slow@example.com` → 1500ms delay then success (CD-03)
   - any other valid email → `{ status: 'success' }`
5. **Discriminated-union return shape locked through Phase 4** — see CONTEXT D-10. Phase 4 swaps the body, NOT the file path or the `joinWaitlistAction` export name.

**File starts with:** `'use server'` directive (RESEARCH line 262).

**Exports:** named `joinWaitlistAction` + `type JoinWaitlistResult`.

**Anti-pattern (RESEARCH lines 722–732):**
- DO NOT throw on validation errors — React 19 `<form action>` resets uncontrolled inputs ONLY when the action resolves; throwing escalates to error boundary.
- DO NOT import `resend` SDK — Phase 4 territory.

---

### NEW — `components/waitlist/waitlist-form.tsx` (client-component, event-driven)

**Analog:** **NONE in repo for the `useActionState` shape.** This is the first `'use client'` component to wire form state.

**Closest in-repo precedents (use these for imports + style only):**
- `components/ui/sonner.tsx` lines 1–4 — only other `'use client'` file. Established pattern: `"use client"` directive on line 1, imports from React/Sonner/lucide grouped without blank lines, `cn()` not needed for this file because no className composition.
- `components/ui/label.tsx` lines 1–7 — third `'use client'` precedent (radix `LabelPrimitive`). Also one-liner `'use client'` directive convention.

**Imports pattern** — mirror sonner.tsx grouping (external first, then `@/`):
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
```

**Body** — copy from `03-RESEARCH.md` Pattern 2 (lines 354–477) verbatim. Three load-bearing details from PITFALLS:

1. **Pitfall 1 / FORM-06 echo:** the `<Input>` reads `defaultValue={echoedEmail ?? ''}` where `echoedEmail = state?.status === 'error' ? state.submittedValues?.email : undefined`. React 19 resets uncontrolled inputs after the action resolves; the echo defeats this. Playwright must assert `.toHaveValue(...)` post-submit (load-bearing — RTL DOM check insufficient).
2. **Pitfall 2 / hydration:** `renderedAt` comes from the parent RSC as a prop, NOT from a `Date.now()` call inside this component.
3. **Pitfall 4 / Strict Mode:** `useEffect` watching `state` for `toast.error(...)` — guarded naturally because `state === null` on initial mount; consider `toast.error(state.message, { id: 'waitlist-error' })` for sonner dedupe.

**Inline error pattern** (RESEARCH lines 425–433):
```tsx
{fieldError && (
  <p
    id="email-error"
    role="alert"
    className="mt-2 text-sm text-destructive"
  >
    {fieldError}
  </p>
)}
```

**Honeypot pattern** (RESEARCH lines 437–454; UI-SPEC §Spacing exception):
```tsx
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
```
**MUST be inline `style` (not Tailwind, not `display: none`)** — CONTEXT CD-01 / SPAM-01 / UI-SPEC §Spacing exception.

**Submit button pattern** — reuse `<Button size="hero" variant="default">` from `components/ui/button.tsx:35` verbatim. Add `disabled={pending}` and `className="mt-3 w-full sm:w-auto"`. The CVA `[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4` chain (button.tsx:8) auto-sizes the `<Loader2>` to 16px (matches CD-04) — no extra sizing needed.

**Email input pattern** — `<Input className="mt-2 h-12" ...>` per UI-SPEC §Spacing exceptions. Pass `type="email" inputMode="email" autoComplete="email" name="email" id="email" required`. The `aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20` chain in `components/ui/input.tsx:11` auto-styles the destructive surface — set `aria-invalid={!!fieldError}` and the visuals come for free.

---

### NEW — `components/sections/waitlist-form-section.tsx` (RSC section, render-only)

**Analog (exact — this file IS a rename of the analog):** `components/sections/placeholder-form-section.tsx` (entire file).

**Outer wrapper preserved verbatim** (CONTEXT D-06; from placeholder-form-section.tsx:26–27):
```tsx
<section id="waitlist" className="scroll-mt-16 py-16 md:py-24">
  <div className="mx-auto max-w-prose px-6 text-center">
```

**Heading + sub-copy pattern** — mirror `components/sections/why-quibly.tsx:42` for the H2 class chain (also `mb-4 font-heading text-3xl font-bold leading-tight text-foreground md:text-4xl`):
```tsx
<h2 className="mb-4 font-heading text-3xl font-bold leading-tight text-foreground md:text-4xl">
  Be first when Quibly opens up.
</h2>
<p className="mb-8 font-sans text-base text-muted-foreground">
  Drop your email and we&apos;ll ping you the moment Quibly&apos;s ready for the world.
</p>
```
(Copy is draft per CONTEXT D-04 / UI-SPEC Copywriting Contract — founder edits in PR.)

**Inner pattern (RSC composition + `renderedAt` prop)** — copy from `03-RESEARCH.md` Pattern 2 lines 481–504 verbatim. The RSC computes `const renderedAt = Date.now()` at request time and passes as a prop to `<WaitlistForm>` (Pitfall 2 mitigation):
```tsx
import { WaitlistForm } from '@/components/waitlist/waitlist-form'

export function WaitlistFormSection() {
  const renderedAt = Date.now()
  return (
    <section id="waitlist" className="scroll-mt-16 py-16 md:py-24">
      <div className="mx-auto max-w-prose px-6 text-center">
        {/* heading + sub-copy here */}
        <WaitlistForm renderedAt={renderedAt} />
      </div>
    </section>
  )
}
```

**Comment-block pattern** — match the explanatory JSDoc style at the top of `placeholder-form-section.tsx:3–23`. Document: (a) the rename from Phase 2 (CD-07), (b) the cross-phase anchor seam (Phase 2 D-09), (c) `renderedAt` prop rationale (Pitfall 2).

**Function-component declaration style** — `export function ComponentName() { return (...) }` (no arrow function default exports). Mirrors all 7 existing section files.

---

### NEW — `vitest.config.ts` (config, build-time)

**Analog:** **NONE in repo.** Copy `03-RESEARCH.md` Pattern 3 (lines 510–531) verbatim.

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    exclude: ['tests/visual/**', 'node_modules/**'],
  },
})
```

**Critical includes/excludes (Pitfall 7 + Pitfall 9 risk):**
- `include: ['tests/unit/**/*.test.{ts,tsx}']` — segregates Vitest specs into `tests/unit/`.
- `exclude: ['tests/visual/**', 'node_modules/**']` — Playwright `.spec.ts` files in `tests/visual/`, `tests/form/`, `tests/no-js/` MUST NOT be picked up by Vitest. RESEARCH Pitfall 7 documents the alias-mismatch failure mode (`@/` imports resolving wrong); use the `path.resolve(__dirname, './')` form, not a relative `./` alias.

**Path alias parity:** the `'@': path.resolve(__dirname, './')` line MUST mirror `tsconfig.json:22` (`"paths": { "@/*": ["./*"] }`) — RESEARCH Pitfall 7.

---

### NEW — `tests/setup.ts` (test-config, build-time)

**Analog:** **NONE in repo.** Copy `03-RESEARCH.md` Pattern 3 lines 534–542 verbatim:
```ts
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
```

**Why both lines required:**
- `@testing-library/jest-dom/vitest` registers matchers (`.toBeInTheDocument()`, `.toHaveValue()`, etc.).
- `cleanup()` after each test prevents RTL's auto-cleanup mismatch when multiple tests render the same component (RTL v16 + React 19 quirk).

---

### NEW — `tests/unit/join-waitlist-action.test.ts` (test, unit)

**Analog:** **NONE in repo.** Use `03-RESEARCH.md` lines 875–943 as the canonical shape.

**Imports pattern** (from RESEARCH 875–880):
```ts
import { describe, it, expect, vi } from 'vitest'
import { joinWaitlistAction } from '@/app/actions/join-waitlist'

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.append(k, v)
  return fd
}
```

**Test coverage map** (from VALIDATION.md per-task verification):
| `it(...)` | Requirement | Stub trigger / assertion |
|-----------|-------------|--------------------------|
| `'rejects invalid email'` | FORM-03 | `'bad-email'` → `status: 'error'`, `fieldErrors.email` set |
| `'echoes typed value on validation error'` | FORM-06 | `submittedValues.email === 'bad-email'` |
| `'honeypot triggers silent success'` | SPAM-01 | `website: 'spam'` → `status: 'success'` (no other side effects) |
| `'time-trap rejects <2s submissions silently'` | SPAM-02 | `renderedAt: Date.now()` → `status: 'success'` |
| `'duplicate flag set for dup@example.com'` | POST-03 | `status: 'success', duplicate: true` |
| `'returns error message for err@example.com'` | D-11 | `status: 'error', message: '...'` |
| `'slow@example.com delays then succeeds'` | D-11 | takes ≥1500ms, returns success |
| `'plain valid email returns success'` | D-11 default | `status: 'success'` |

**Time-trap testing pattern** — use `vi.useFakeTimers()` + `vi.setSystemTime(...)` to simulate the renderedAt window. Establish "renderedAt 3 seconds ago" → action passes time-trap; "renderedAt 500ms ago" → silent success.

---

### NEW — `tests/unit/waitlist-form.test.tsx` (test, unit, RTL)

**Analog:** **NONE in repo.** Use `03-RESEARCH.md` lines 944–981 as the canonical shape.

**Imports pattern** (from RESEARCH 944–950):
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WaitlistForm } from '@/components/waitlist/waitlist-form'
```

**Test coverage map:**
| `it(...)` | Requirement | Assertion |
|-----------|-------------|-----------|
| `'renders the form in idle state'` | FORM-01 | `screen.getByRole('textbox', { name: /email/i })` present |
| `'input has correct attributes'` | FORM-02 | `type=email`, `inputMode=email`, `autoComplete=email`, `required` |
| `'submit button reads "Join the waitlist"'` | FORM-04 | `screen.getByRole('button', { name: 'Join the waitlist' })` |
| `'binds typed useActionState'` | FORM-09 | TS compile + `pending` boolean accessible |
| `'success copy verbatim "Check your inbox..."'` | POST-02 | string match in DOM after success state |

**Render harness:** `render(<WaitlistForm renderedAt={Date.now()} />)` — must pass the prop because the component requires it (Pitfall 2 mitigation).

---

### NEW — `tests/form/*.spec.ts` (Playwright e2e, 7 specs)

**Analog (exact — same framework, same conventions):** `tests/visual/above-fold.spec.ts` (entire file).

**Imports pattern** (from above-fold.spec.ts:1):
```ts
import { expect, test } from "@playwright/test"
```

**`test.describe` + `beforeEach` pattern** (above-fold.spec.ts:16–20):
```ts
test.describe("Phase 3 form — pending state", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto("/")
  })
  // tests...
})
```

**Locator + boundingBox idiom** (above-fold.spec.ts:34–41) — use for visual assertions:
```ts
const box = await locator.boundingBox()
expect(box).not.toBeNull()
if (!box) return
expect(box.height).toBeGreaterThanOrEqual(48)
```

**Per-spec verification map** (from VALIDATION.md lines 88–97):
| Spec | Requirement | Key assertion (load-bearing) |
|------|-------------|------------------------------|
| `pending-state.spec.ts` | FORM-05 | submit `slow@example.com` → button disabled + `Joining...` text + `<svg.animate-spin>` visible |
| `success-state.spec.ts` | POST-01, POST-02, POST-03 | `[role="status"]` contains POST-02 verbatim string; `data-duplicate` attribute MUST NOT be present (Dimension-8 risk per VALIDATION.md) |
| `validation-error.spec.ts` | FORM-06 | submit `'bad-email'` → `[role="alert"]` visible AND `expect(page.locator('input[name="email"]')).toHaveValue('bad-email')` (load-bearing per Pitfall 1) |
| `server-error-toast.spec.ts` | D-12 | submit `err@example.com` → sonner toast with "Something went wrong..." appears |
| `idempotent.spec.ts` | POST-04 | rapid double-click submit → only one action invocation, final state is success |
| `enter-key-submit.spec.ts` | FORM-07 | type valid email + press Enter → success block renders |
| `anchor-scroll.spec.ts` | D-01, D-02 | click hero CTA AND secondary CTA → page scrolls; `#waitlist` section is in viewport |

**`anchor-scroll.spec.ts` Phase 2 regression — IMPORTANT (RESEARCH Pitfall 9):**
- The existing `tests/visual/button-radius.spec.ts:40` asserts `expect(count).toBe(3)` for `button[aria-disabled="true"]`. After Phase 3, only ONE disabled hero button remains (the form's submit, briefly during pending) and the hero + secondary CTAs become `<a>` elements via `<Button asChild>`.
- The Slot.Root pattern means `<Button asChild><a>...</a></Button>` renders as `<a data-slot="button" data-size="hero">`, NOT `<button>`.
- **Plan must update `button-radius.spec.ts`** to either (a) target `[data-slot="button"][data-size="hero"]` to catch all three hero pills regardless of element type, or (b) split into separate "hero anchors" + "submit button" assertions. Same 28px `border-radius` invariant applies.

---

### NEW — `tests/no-js/waitlist-form-progressive.spec.ts` (Playwright e2e, no-JS)

**Analog (framework-only):** `tests/visual/above-fold.spec.ts`.

**Body — copy `03-RESEARCH.md` Pattern 4 lines 587–606 verbatim:**
```ts
import { test, expect } from '@playwright/test'

test('form submits and shows success state without JavaScript', async ({ page }) => {
  await page.goto('/#waitlist')
  await page.fill('input[name="email"]', 'noscript@example.com')
  await Promise.all([
    page.waitForLoadState('domcontentloaded'),
    page.click('button[type="submit"]'),
  ])
  await expect(page.locator('form')).toBeVisible()
  await expect(page.locator('input[name="email"]')).toHaveValue('')
})
```

**Critical caveat (RESEARCH lines 776–790, Pitfall 3 + VALIDATION.md Dimension-8 risk):**
- `useActionState` state is NOT preserved across no-JS round-trip. The success block does NOT render server-side.
- This spec asserts the **form returns to idle state** after a successful no-JS POST — it does NOT assert the success block. This is Phase 3 graceful-degradation acceptance (FORM-08 wording: "the form remains submittable without JS" — satisfied; POST-01 in-place success — explicitly NOT for no-JS).
- Plan must document this acceptance in the spec's leading comment block.

---

### NEW — `.github/workflows/test.yml` (CI workflow, build-time)

**Analog:** `.github/workflows/lighthouse.yml` (entire file — same `name:` + `on:` + `permissions:` + `jobs:` shape; same branch-protection-status-check naming pattern).

**`name:` + `on:` + `permissions:` block — mirror lighthouse.yml:3–19:**
```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read
```
(Drops `pull-requests: write` and `statuses: write` from the Lighthouse template — Vitest/Playwright don't need to post comments or update statuses; the workflow's pass/fail is the status itself. RESEARCH Pattern 5 line 627–628 confirms.)

**Body — copy `03-RESEARCH.md` Pattern 5 lines 617–677 verbatim** (two parallel jobs: `vitest` fast lane + `playwright` slow lane with cache-against-version pattern).

**Branch-protection status check names — identical convention to Phase 2 D-34** (RESEARCH lines 679–684):
- `Tests / vitest`
- `Tests / playwright`
- (existing) `Lighthouse CI / lighthouse`

**Manual GitHub UI step** — same friction as Phase 2 D-34 / Phase 3 D-18. Plan must include a checkpoint task: open `Settings → Branches → Branch protection rule for main → Require status checks` and add the two new job names. Document with the exact text from VALIDATION.md lines 106–108.

**Decision: NEW file vs EXTEND existing.** The existing `lighthouse.yml` runs against the Vercel preview URL — a fundamentally different lifecycle (waits for deploy). Vitest + Playwright run against `npm run build && npx next start &` on the runner. **Recommendation: NEW file (`test.yml`).** Two parallel workflows, separate cancellation domains, easier to read. Per RESEARCH Pattern 5.

---

### MODIFIED — `app/page.tsx` (RSC page, render-only)

**Analog (exact):** self.

**Change** — single import + JSX swap:
```tsx
// before (line 4):
import { PlaceholderFormSection } from "@/components/sections/placeholder-form-section"
// after:
import { WaitlistFormSection } from "@/components/sections/waitlist-form-section"

// before (line 24):
<PlaceholderFormSection />
// after:
<WaitlistFormSection />
```

**Preserve verbatim:** the `<main className="flex flex-col">` wrapper, the section ORDER (CONTEXT D-16: Hero → WaitlistFormSection → WhyQuibly → FounderVoice → SecondaryCTA), the Footer-outside-main pattern, and the JSDoc comment block (lines 8–18) — though the JSDoc reference to "Phase 5 owns metadata" can stay as-is.

**Imports kept alphabetical** (page.tsx:1–6 alphabetizes by component name) — `WaitlistFormSection` lands between `SecondaryCTA` and `WhyQuibly` alphabetically; the swap from `PlaceholderFormSection` to `WaitlistFormSection` keeps it in roughly the same alphabetical slot.

---

### MODIFIED — `app/layout.tsx` (RSC root layout, render-only)

**Analog (exact):** self.

**Imports add** (after line 4, alphabetically placed):
```tsx
import { Toaster } from "@/components/ui/sonner";
```

**JSX add** — insert `<Toaster />` inside `<body>`, AFTER `{children}` (CONTEXT D-08, UI-SPEC §Component Inventory line 224 — "inside `<body>`, after `{children}`"):
```tsx
<body className="min-h-full flex flex-col">
  {children}
  <Toaster />
</body>
```

**Preserve verbatim:** the `Quicksand` + `Figtree` `next/font/google` setup (lines 6–18), the `metadata` export (lines 20–28), the `<html>` className with font variables + `h-full antialiased`, the `<body>` className `min-h-full flex flex-col`, the `import "@/lib/env"` side-effect import (line 4 — env validation at module load).

**Toaster receives no props** — sonner's defaults (bottom-right, 4000ms) per CD-07. The wrapper at `components/ui/sonner.tsx:6` accepts `ToasterProps` spread (line 41 `{...props}`); leaving it empty consumes defaults.

---

### MODIFIED — `components/sections/hero.tsx` (RSC section, render-only)

**Analog:** self (lines 38–43) + the `<Button asChild>` pattern from `components/ui/button.tsx:55` (`Slot.Root`).

**Change** — flip the disabled `<Button>` to an anchor-as-button (CONTEXT D-01; UI-SPEC §Component Inventory line 226):
```tsx
// before (lines 39–41):
<Button size="hero" variant="default" type="button" aria-disabled="true">
  Form coming soon
</Button>

// after:
<Button asChild size="hero" variant="default">
  <a href="#waitlist">Join the waitlist</a>
</Button>
```

**`asChild` pattern wiring** — already supported by `components/ui/button.tsx:49,55`:
```ts
asChild = false,
// ...
const Comp = asChild ? Slot.Root : "button"
```
Slot.Root merges Button's class chain onto the `<a>` element; visual output is identical to a `<button>` but the rendered DOM is `<a data-slot="button" data-size="hero" href="#waitlist">`.

**Preserve verbatim:** the surrounding `<div className="mt-4 flex flex-col items-center">` wrapper (line 38), the `"Launching Summer 2026"` microcopy `<p>` (line 42), the entire pre-CTA hero composition (lines 22–37 — radial gradient, `<HeroMascot>`, H1, sub-headline). Only the `<Button>` element changes.

**Update the JSDoc** at `hero.tsx:21` ("Phase 3 will replace the disabled CTA control with the form's real submit") — this comment is now stale; replace with: "Phase 3 flipped the disabled placeholder CTA back to a smooth-scroll anchor (`<a href=\"#waitlist\">`) per Phase 3 D-01, overriding Phase 2 D-31 for the hero only."

---

### MODIFIED — `components/sections/secondary-cta.tsx` (RSC section, render-only)

**Analog:** self (lines 23–26) + the `<Button asChild>` pattern (same as hero).

**Change** (CONTEXT D-02; UI-SPEC §Component Inventory line 227 — copy preserved per Phase 2 D-12 lock):
```tsx
// before (lines 24–26):
<Button size="hero" variant="default" type="button" aria-disabled="true">
  Don&apos;t miss launch — join the waitlist
</Button>

// after:
<Button asChild size="hero" variant="default">
  <a href="#waitlist">Don&apos;t miss launch — join the waitlist</a>
</Button>
```

**Preserve verbatim:** the H2 (line 20–22), the `<div className="mt-8 flex justify-center">` wrapper (line 23), section padding (`py-16 md:py-24`).

**Update the JSDoc** at `secondary-cta.tsx:7–9` — stale comment "Phase 3 replaces this with a real anchor smooth-scroll back-pointer..." — replace with present-tense description matching the new state.

---

### MODIFIED — `playwright.config.ts` (config, build-time)

**Analog:** self (current minimal `defineConfig`).

**Change** — add `projects` block per `03-RESEARCH.md` Pattern 4 (lines 562–584). Update `testDir` from `./tests/visual` to `./tests` so the new `tests/form/`, `tests/no-js/`, and existing `tests/visual/` directories are all discovered:

```ts
import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  expect: { timeout: 5000 },
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 320, height: 568 },
  },
  projects: [
    {
      name: "visual-and-form",
      testMatch: /tests\/(visual|form)\/.*\.spec\.ts/,
    },
    {
      name: "no-js",
      testMatch: /tests\/no-js\/.*\.spec\.ts/,
      use: { javaScriptEnabled: false },
    },
  ],
})
```

**Preserve verbatim:** the `timeout: 30000`, `expect: { timeout: 5000 }`, `reporter: "list"`, `use.baseURL`, `use.viewport: { width: 320, height: 568 }` (mobile-first 320×568 — Phase 2 lock).

**Update the JSDoc** at `playwright.config.ts:3–11` — current comment says "Phase 3+ may extend this config with auth flows, multi-browser projects" — Phase 3 IS the extension; rewrite to describe the two-project setup.

---

### MODIFIED — `package.json` (manifest, build-time)

**Analog:** self.

**Scripts add** (place between existing `test:e2e` line 11 and `lh:ci` line 12):
```jsonc
"test:unit": "vitest run",
"test:unit:watch": "vitest"
```
Both per RESEARCH Pattern 3 line 547–550 and VALIDATION.md Wave 0 §3.

**devDependencies add** (single `npm i -D` invocation per VALIDATION.md Wave 0):
```
vitest@^4 @vitejs/plugin-react@^4.3
@testing-library/react@^16.3 @testing-library/dom@^10
@testing-library/jest-dom@^6.9 @testing-library/user-event@^14.6
happy-dom@^20
```
**Pinned versions** per RESEARCH §Test Toolchain (lines 151–166). VALIDATION.md confirms exact major versions.

**No new runtime dependencies** in Phase 3 — sonner, lucide-react, zod, react, next, etc. are already pinned in `dependencies` at compatible versions (see CLAUDE.md §Version Compatibility).

**Preserve verbatim:** all existing scripts, all existing dependencies, husky `prepare` hook, ESM `"private": true` flag.

---

## Shared Patterns

### `'use client'` Directive Convention

**Source:** `components/ui/sonner.tsx:1`, `components/ui/label.tsx:1`.

**Apply to:** `components/waitlist/waitlist-form.tsx` only.

**Pattern:**
```tsx
"use client"

import * as React from "react"
// ... rest of imports
```
Directive on line 1, blank line, then imports. Double quotes (matches existing repo style — see also `placeholder-form-section.tsx:1`).

---

### Zod 4 Idiom (NEW — first use beyond `lib/env.ts`)

**Source:** `lib/env.ts:1,21,37`.

**Apply to:** `app/actions/join-waitlist.ts` only.

**Schema-at-module-scope pattern** (env.ts:21):
```ts
import { z } from 'zod'

const schema = z.object({ /* ... */ })
```

**Zod 4-specific (RESEARCH Pitfall 5):** use `z.email({ error: 'msg' })` (NOT `z.string().email('msg')`); use `z.flattenError(parsed.error)` (NOT `parsed.error.flatten()`). Pinned `zod: "^4.0.0"` per package.json:27.

---

### Section Composition Pattern (RSC)

**Source:** all 7 files in `components/sections/` (`hero.tsx`, `placeholder-form-section.tsx`, `why-quibly.tsx`, `founder-voice.tsx`, `secondary-cta.tsx`, `footer.tsx`, `hero-mascot.tsx`).

**Apply to:** `components/sections/waitlist-form-section.tsx`.

**Universal section shell:**
```tsx
export function SectionName() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-{prose|6xl} px-6 md:px-8">
        {/* content */}
      </div>
    </section>
  )
}
```
- Vertical rhythm: `py-16 md:py-24` (Phase 2 D-17 — preserved).
- Container width: `max-w-prose` for centered-text sections (placeholder-form-section, founder-voice); `max-w-6xl` for content sections (hero, why-quibly, secondary-cta, footer).
- Padding: `px-6 md:px-8` for max-w-6xl variants; `px-6` only for max-w-prose variants.
- Centering: `mx-auto`.
- `text-center` applied at `<div>` for centered-prose sections.

**Heading typography pattern** — uniform across `placeholder-form-section.tsx:28`, `why-quibly.tsx:42`, `secondary-cta.tsx:20`:
```tsx
<h2 className="mb-4 font-heading text-3xl font-bold leading-tight text-foreground md:text-4xl">
```
**Apply verbatim** to `<WaitlistFormSection>` H2 (per UI-SPEC §Typography line 85).

---

### Lucide Icon Stroke Convention

**Source:** `components/sections/why-quibly.tsx:54` (`strokeWidth={1.75}`); `components/sections/hero-mascot.tsx` references the same convention.

**Apply to:**
- `<CircleCheck>` in success block — `strokeWidth={1.75}` (per UI-SPEC line 322 + design-system §1).
- `<Loader2>` in pending state — `strokeWidth` defaults to 2 (lucide default); UI-SPEC line 408 doesn't override; acceptable for the spinner.

---

### `aria-hidden="true"` on Decorative Icons

**Source:** `components/sections/why-quibly.tsx:55` (icon adjacent to text label); `components/sections/hero-mascot.tsx:23` (decorative wrapper); `components/ui/sonner.tsx` icons are inside the Sonner consumer chain so `aria-hidden` is implicit.

**Apply to:** `<CircleCheck>` and `<Loader2>` in `<WaitlistForm>` — both are decorative; surrounding text carries the meaning. Per UI-SPEC lines 324, 408.

---

### `<Button asChild>` Anchor-As-Button Pattern

**Source:** `components/ui/button.tsx:49,55` — the CVA already supports `asChild` via `Slot.Root`. **No prior in-repo CONSUMER of `asChild`** (Phase 2 used `<button aria-disabled>` instead per D-31), but the wiring exists and is verified by the button-radius spec.

**Apply to:** `components/sections/hero.tsx`, `components/sections/secondary-cta.tsx`.

**Pattern:**
```tsx
<Button asChild size="hero" variant="default">
  <a href="#waitlist">Join the waitlist</a>
</Button>
```

**Critical:** The rendered element is an `<a>`, NOT a `<button>`. Phase 2's `tests/visual/button-radius.spec.ts:31` uses `button[aria-disabled="true"]` as the selector — this MUST be updated to `[data-slot="button"][data-size="hero"]` (matches both `<button>` and `<a>` produced by `<Button>`). RESEARCH Pitfall 9.

---

### JSDoc Block Convention for Section Files

**Source:** every file in `components/sections/` carries a leading JSDoc block documenting:
1. What the section does (1 line).
2. Locked decisions referenced by ID (e.g., `D-15`, `CD-06`).
3. Cross-phase notes (e.g., "Phase 5 ships the privacy and terms routes").
4. Accessibility / pure-RSC notes when relevant.

**Apply to:** new `waitlist-form-section.tsx` (mirror placeholder-form-section.tsx:3–23 shape) and updated `hero.tsx`, `secondary-cta.tsx` JSDocs (rewrite the stale "Phase 3 will replace..." comments).

---

### Test Spec Convention (Playwright)

**Source:** `tests/visual/above-fold.spec.ts`, `tests/visual/button-radius.spec.ts`.

**Apply to:** all 8 new Playwright specs (`tests/form/*.spec.ts`, `tests/no-js/*.spec.ts`).

**Conventions:**
1. `import { expect, test } from "@playwright/test"` (double quotes — matches Phase 2 specs).
2. Top-of-file JSDoc explaining the spec's purpose, the locked decisions it asserts, and the pre-requisite (`npm run dev` running at :3000).
3. Wrap related tests in `test.describe("Phase 3 ... — ...", () => { ... })`.
4. `test.beforeEach` sets viewport (`{ width: 320, height: 568 }` mobile-first, matching Phase 2) and navigates to `/`.
5. Locator-driven assertions with descriptive `expect(value, message).toX(...)` second-arg messages (above-fold.spec.ts:35–37 example).

---

### `@/` Path Alias (TypeScript + Vitest)

**Source:** `tsconfig.json:22` (`"@/*": ["./*"]`); `vitest.config.ts` MUST mirror.

**Apply to:** all new `.ts`/`.tsx` files use `@/components/...`, `@/app/actions/...`, `@/lib/...` imports. Vitest config alias is mandatory or unit tests fail to resolve (RESEARCH Pitfall 7).

---

## No Analog Found

Files with no close in-repo analog — the planner MUST reference `03-RESEARCH.md` patterns instead:

| File | Role | Data Flow | Reason | Reference |
|------|------|-----------|--------|-----------|
| `app/actions/join-waitlist.ts` | server-action | request-response | First Server Action in repo | `03-RESEARCH.md` Pattern 1 (lines 254–331), Pitfall 1 (echo), Pitfall 5 (Zod 4 `.flatten()` deprecation) |
| `components/waitlist/waitlist-form.tsx` | client-component | event-driven | First `useActionState` consumer + first `'use client'` form | `03-RESEARCH.md` Pattern 2 (lines 333–504), Pitfalls 1, 2, 4 |
| `vitest.config.ts` | config | build-time | First test config of its kind | `03-RESEARCH.md` Pattern 3 (lines 510–531), Pitfalls 7, 8 |
| `tests/setup.ts` | test-config | build-time | First Vitest setup | `03-RESEARCH.md` Pattern 3 (lines 534–542) |
| `tests/unit/*.test.{ts,tsx}` | unit tests | various | First Vitest specs | `03-RESEARCH.md` lines 875–981 (worked examples) |

External docs of last resort (per CONTEXT canonical_refs):
- [react.dev `useActionState`](https://react.dev/reference/react/useActionState) — for prevState/pending/action signature.
- [Next.js Server Actions](https://nextjs.org/docs/app/api-reference/functions/server-actions) — progressive enhancement.
- [Zod 4](https://zod.dev) — `z.email()`, `z.flattenError()`.

---

## Metadata

**Analog search scope:**
- `/Users/jeff/repos/quibly-landing/app/` (3 files)
- `/Users/jeff/repos/quibly-landing/components/` (12 files across `ui/`, `sections/`, `quibs/`)
- `/Users/jeff/repos/quibly-landing/lib/` (2 files)
- `/Users/jeff/repos/quibly-landing/tests/visual/` (2 files)
- `/Users/jeff/repos/quibly-landing/.github/workflows/` (1 file)
- `/Users/jeff/repos/quibly-landing/tsconfig.json`, `playwright.config.ts`, `package.json`

**Files scanned:** 24 (entire Phase 1 + Phase 2 output surface).

**Pattern extraction date:** 2026-04-27

**Cross-phase seam preservation (informational — Phase 4 consumes):**
- `app/actions/join-waitlist.ts` file path + `joinWaitlistAction` export name + `JoinWaitlistResult` discriminated union shape locked through Phase 4 (CONTEXT D-09, D-10).
- Honeypot field name (`website`) and time-trap input name (`renderedAt`) live through Phase 4 unchanged.
- `<Toaster />` mount in `app/layout.tsx` reused by Phase 4/5 (delivery-error toasts, analytics events).
- Vitest config lives unchanged through Phase 4; Phase 4 adds Resend mocks via `vi.mock(...)`.
