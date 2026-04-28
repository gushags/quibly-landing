# Phase 3: Email Capture Form (Stub Action) - Research

**Researched:** 2026-04-27
**Domain:** React 19 / Next.js 16.2 Server Actions + `useActionState` form, Vitest+RTL+happy-dom unit layer, Playwright e2e (incl. no-JS), sonner toaster, Zod 4 validation, honeypot + time-trap bot defenses
**Confidence:** HIGH

---

## Summary

Phase 3 ships the first Client Component in the repo (`<WaitlistForm>`) wired to a stubbed Server Action via React 19's `useActionState`. The phase introduces three new technical surfaces — `'use client'` boundary, Vitest+RTL test layer, Playwright no-JS test mode — none of which are exotic, but each has at least one load-bearing detail that the planner must bake into tasks.

The four highest-impact research findings:

1. **React 19 auto-resets uncontrolled inputs after action Promises resolve, regardless of return shape.** [VERIFIED: react.dev/reference/react-dom/components/form] FORM-06 (preserve typed value on validation error) requires the action to **echo the submitted email back** in its return state and the input to consume `defaultValue={state?.submittedValues?.email}`. The UI-SPEC's `_emailValue` key inside `fieldErrors` works mechanically but is type-awkward — recommend hoisting the echoed value to a top-level `submittedValues` field on the result union so TS narrows cleanly.
2. **Time-trap timestamp via `defaultValue={Date.now()}` inside the Client Component will cause hydration mismatch.** [VERIFIED: nextjs.org/docs/messages/react-hydration-error + multiple 2026 sources] Server-side `Date.now()` ≠ client-side `Date.now()` — React 19 will warn and rehydrate. Recommend rendering the timestamp in the parent RSC (`<WaitlistFormSection>`) and passing it as a prop, OR using `useState(() => Date.now())` lazy init with `suppressHydrationWarning`. The RSC-prop approach is cleanest and works under progressive enhancement.
3. **Progressive enhancement (FORM-08 / D-16) works without `permalink`** as long as the page is statically reachable — Next.js routes the no-JS POST back to the same page URL, runs the action server-side, and re-renders. The action's return state is **NOT** preserved across the no-JS round-trip in `useActionState` (the hook only re-mounts on the next page render, with initial state). Plan: render the success block from the **parent RSC** based on a server-side flag (e.g. read a cookie or use the `redirect()` pattern) — OR accept that no-JS users land on the form page reset to idle (an acceptable graceful degradation, since their submission was processed). [VERIFIED: react.dev/reference/react/useActionState — `permalink` is the only hook for state-after-no-JS-submit, otherwise the next render uses initialState].
4. **Zod 4 deprecates `.flatten()` in favor of `z.flattenError()` (top-level)** and prefers `z.email()` over `z.string().email()`. [VERIFIED: zod.dev/v4/changelog] Many tutorials and the Next.js official forms guide still show the deprecated API — the planner must specify the v4 idiom in plan code shapes.

**Primary recommendation:** Implement the action with the discriminated-union return shape locked in CONTEXT D-10, but extend the success branch with `submittedValues?: { email: string }` so the no-success render still has access to the typed value. Mount `<Toaster />` in `app/layout.tsx` (D-08), trigger toast from a `useEffect` watching `state` (with object identity stable per response — `useActionState` returns a new state object on each action call, which is what we want; one toast per error). For tests: install `vitest@^4`, `@vitejs/plugin-react@^4.3`, `@testing-library/react@^16.3`, `@testing-library/dom@^10`, `@testing-library/jest-dom@^6.9`, `@testing-library/user-event@^14.6`, `happy-dom@^20`. For CI: separate Vitest job (fast, ~30s) and Playwright job (slower, ~2min) running in parallel; cache `~/.cache/ms-playwright` against the `@playwright/test` version.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Email field rendering, pending UX, success block, inline error | Browser / Client (`<WaitlistForm>` `'use client'`) | Frontend Server (initial RSC render of the form markup) | `useActionState` is a client-only hook; pending state and DOM mutations on submit live here. |
| Section heading + sub-copy + form composition | Frontend Server (`<WaitlistFormSection>` RSC) | — | RSC; only static markup; no hooks needed. Owns the `id="waitlist"` anchor seam (preserved verbatim from Phase 2). |
| Email validation (Zod) | Frontend Server (Server Action `'use server'`) | Browser (HTML5 `type="email"` + `required` for instant feedback only) | Server-side is the source of truth (FORM-03). Browser-side HTML5 validation is opportunistic; never trusted. |
| Honeypot + time-trap rejection | Frontend Server (Server Action) | Browser (renders the hidden inputs as part of the form) | Defense logic lives server-side (D-15 silent rejection); client just plants the bait. |
| Stub branch routing (success/duplicate/error/slow by email pattern) | Frontend Server (Server Action) | — | Phase 3 only; Phase 4 deletes this and swaps in real Resend `contacts.create`. |
| Toast surface (server-error UX) | Browser (`useEffect` in Client Component → sonner `toast.error()`) | Frontend Server (`<Toaster />` mounts at `app/layout.tsx`) | Toast is a client-only ephemeral surface; mount lives at app root. |
| Hero/secondary CTA `<a href="#waitlist">` smooth-scroll | Browser (CSS `scroll-behavior: smooth`) | Frontend Server (renders the `<a>` markup via `<Button asChild>`) | No JS needed; pure CSS scroll. `prefers-reduced-motion` override already wired in `globals.css`. |
| Vitest unit tests | CI / Node (happy-dom env) | — | Tests isolate the action and the Client Component; happy-dom because faster than jsdom for this scale. |
| Playwright e2e tests | CI / Browser | Frontend Server (Next dev server) | Real browser drives real form including no-JS path via `javaScriptEnabled: false`. |
| GitHub Actions enforcement | CI / GitHub | — | Two jobs: Vitest (fast lane), Playwright (slow lane). Both required as branch-protection status checks on `main`. |

---

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Form Placement**
- **D-01:** Single form, section-only. One `<WaitlistForm>` lives inside `<WaitlistFormSection>` at `id="waitlist"`. Hero CTA reverts to `<a href="#waitlist">` smooth-scroll (overrides Phase 2 D-31 for hero).
- **D-02:** Secondary CTA below `<FounderVoice>` also flips to `<a href="#waitlist">` (overrides Phase 2 D-31 for secondary).
- **D-03:** Stacked layout on all viewports. Input full-width, button on its own line below, both bound by `max-w-md mx-auto`. Identical mobile/desktop.
- **D-04:** `<WaitlistFormSection>` heading + body copy: Claude drafts, founder edits in PR.

**Component Architecture**
- **D-05:** `<WaitlistForm>` is a Client Component (`'use client'`) at `components/waitlist/waitlist-form.tsx`. Owns: `useActionState` binding, the input + submit + honeypot + time-trap hidden inputs, the success-block render, and the inline error render.
- **D-06:** `<WaitlistFormSection>` (renamed from `placeholder-form-section.tsx` per CD-07) stays an RSC. Outer wrapper, `id="waitlist"`, `scroll-mt-16` preserved verbatim from Phase 2.
- **D-07:** Submit button reuses the existing `size="hero"` Button CVA variant. Zero text-diff with Phase 2's hero pill (FORM-04 / D-12 locked "Join the waitlist").
- **D-08:** `<Toaster />` mounts in `app/layout.tsx` once.

**Server Action Contract**
- **D-09:** Action lives at `app/actions/join-waitlist.ts`. File path locked through Phase 4. Single named export `joinWaitlistAction`.
- **D-10:** Return shape = discriminated union, locked through Phase 4:
  ```ts
  type JoinWaitlistResult =
    | { status: 'success'; duplicate?: boolean }
    | { status: 'error'; message?: string; fieldErrors?: Record<string, string> };
  ```
- **D-11:** Stub branches via deterministic email-pattern triggers (Phase 3 only):
  - `dup@example.com` → `{ status: 'success', duplicate: true }`
  - `err@example.com` → `{ status: 'error', message: 'Something went wrong. Try again in a moment.' }`
  - `slow@example.com` → 1500ms delay, then success
  - any other valid email → `{ status: 'success' }`
- **D-12:** Server errors surface via sonner; validation errors inline. Sonner copy verbatim: `"Something went wrong. Try again in a moment."`

**Submit States**
- **D-13:** Pending state: button label `"Joining..."`, lucide `<Loader2 className="animate-spin">`, both input AND button disabled.
- **D-14:** Success state: form unmounts, replaced by centered block (CircleCheck icon + H3 + body). Already-subscribed renders identical block.
- **D-15:** Honeypot/time-trap silent rejection returns `{ status: 'success' }` shape, no other side effects.

**Progressive Enhancement**
- **D-16:** Native `<form action={joinWaitlistAction}>` works without JS via Next.js Server Action progressive enhancement. No mailto fallback, no `<noscript>` banner. Researcher must verify discriminated-union compatibility (see Architecture Patterns below).

**Test Toolchain**
- **D-17:** Two test layers: Vitest + RTL + happy-dom (action branches in isolation); Playwright e2e (full UX flows including no-JS).
- **D-18:** Both layers required as PR gates via GitHub Actions; manual GitHub UI step to add to branch protection (mirrors Phase 2 D-34 pattern).

### Claude's Discretion

- **CD-01:** Honeypot field name — Claude picks (default: `website`). Hidden via `position: absolute; left: -9999px`.
- **CD-02:** Time-trap timestamp source — Claude picks (default: hidden input via `defaultValue={Date.now()}`). **Research flag: hydration mismatch — see Common Pitfalls.**
- **CD-03:** Stub artificial delay duration for `slow@example.com` — recommend 1.5s.
- **CD-04:** Lucide icon sizes — `<CircleCheck>` 24–32px, `<Loader2>` 16–18px.
- **CD-05:** Scroll-margin offset for `id="waitlist"` — verify `scroll-mt-16` (64px) still feels right with form rendered.
- **CD-06:** Microcopy ordering under submit button — Phase 5 reservation.
- **CD-07:** Toast duration / position — sonner defaults (4000ms, bottom-right).
- **CD-08:** Focus management on success — `<h3 tabIndex={-1} ref={...}>` autofocus + `role="status" aria-live="polite"`.
- **CD-09:** Vitest config — `defineConfig` shape, `setupFiles` for jest-dom matchers, happy-dom registration.

### Deferred Ideas (OUT OF SCOPE)

- Cloudflare Turnstile (V2-07) — Phase 4 if signal-gated thresholds fire
- Server-side observability for bot rejection — Phase 4
- Analytics events (`track('waitlist_signup', { duplicate })`) — Phase 5
- Consent microcopy + "no spam" reassurance — Phase 5
- Email typo auto-correction — V2
- Live signup counter — Phase 7
- A/B test variants — V2
- Email field auto-focus on page load — explicitly rejected
- Form state persistence across reloads — out of scope
- Multi-field expansion — explicitly out of scope per FORM-01
- Server-side analytics for time-trap false positives — Phase 4

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FORM-01 | Single email input field (no name/company/role) | Native `<form>` + single `<input name="email">`. UI-SPEC Component Inventory locks this. |
| FORM-02 | `<input type="email" inputMode="email" autoComplete="email">` with HTML5 client validation | Standard HTML; Phase 1 `<Input>` shadcn component composes correctly. |
| FORM-03 | Server-side Zod email validation in the Server Action | `z.email().max(254)` in `'use server'` action. [CITED: zod.dev/v4 — `z.email()` is the v4 idiom; `z.string().email()` is deprecated]. |
| FORM-04 | Action-oriented CTA copy ("Join the waitlist") | Locked verbatim with Phase 2 D-12. Submit button reuses `<Button size="hero">`. |
| FORM-05 | Visible loading state during submit (button disabled + spinner) | `useActionState`'s `pending` boolean + `<Loader2 className="animate-spin">`. [VERIFIED: react.dev/reference/react/useActionState] |
| FORM-06 | Inline error messaging preserves typed value | **LOAD-BEARING:** React 19 auto-resets uncontrolled inputs on action resolution. Must echo `submittedValues.email` in the action return + `defaultValue={state?.submittedValues?.email}` on the input. See Pitfall 1 below. |
| FORM-07 | Native `<form>` element supports Enter-key submit | Native HTML behavior; no extra code needed. Playwright e2e must assert. |
| FORM-08 | `<noscript>` fallback so the form remains submittable without JS | **LOAD-BEARING:** Native `<form action={serverAction}>` progressively enhances. Without `permalink`, no-JS POST goes to current URL; Next.js runs the action server-side and re-renders the page. **Caveat:** `useActionState` returns initial state on the no-JS re-render — see Architecture Patterns. |
| FORM-09 | `useActionState` binds the Client Component form to the Server Action | Standard `[state, formAction, pending] = useActionState(action, null)` pattern. [VERIFIED: nextjs.org/docs/app/guides/forms] |
| POST-01 | In-place success state replaces the form (no full-page navigation) | Conditional render in `<WaitlistForm>`: when `state?.status === 'success'`, render success block instead of form. |
| POST-02 | Success copy includes "Check your inbox (and spam folder) for confirmation" | UI-SPEC locks the verbatim string. **Do not paraphrase.** |
| POST-03 | Already-subscribed treated as success — never reveals enumeration | Render branch reads `state.status === 'success'` only; ignores `state.duplicate`. The flag is captured for Phase 5 analytics. |
| POST-04 | Idempotent submission (double-submit is safe) | `disabled={pending}` on both input and button prevents UI double-submit. Action stub treats every successful submit as success — Phase 4 layers Resend's natural idempotency. |
| SPAM-01 | Hidden honeypot field; filled honeypot rejects submission silently | Off-screen positioning per UI-SPEC. Action returns `{ status: 'success' }` (D-15) when `formData.get('website')` is non-empty. |
| SPAM-02 | Time-trap rejects submissions completed faster than human-plausible (~2s) | Hidden `name="renderedAt"` input. **Hydration risk — see Pitfall 2.** Recommend RSC-prop pattern. |

---

## Standard Stack

### Core (already installed in package.json)

| Library | Installed Version | Purpose | Why Standard |
|---------|-------------------|---------|--------------|
| `next` | `16.2.1` | Server Action runtime + RSC + App Router | Project baseline; Server Actions are the canonical form-submission path in Next 16. [VERIFIED: nextjs.org/blog/next-16-2 publishedAt March 2026] |
| `react` | `19.2.4` | `useActionState`, `useEffect`, `useState`, `useRef` | Pinned by Next 16. Hook-required for Phase 3. |
| `zod` | `^4.0.0` (currently `^4.0.0` per package.json — latest `4.3.6` [VERIFIED: npm view zod version]) | Email schema + custom error messages | v4 deprecates `.flatten()` and `z.string().email()`; use `z.flattenError()` and `z.email()`. |
| `sonner` | `^2.0.7` (latest `2.0.7` [VERIFIED]) | Server-error toast surface | Phase 1 mount in `components/ui/sonner.tsx` already token-styled. |
| `lucide-react` | `^1.7.0` (latest `1.11.0` [VERIFIED]) | `<CircleCheck>` (success), `<Loader2>` (spinner) | Both icons confirmed exported [VERIFIED: grep on `node_modules/lucide-react/dist/lucide-react.d.ts`]. |
| `class-variance-authority` | `^0.7.1` | Button CVA variants — submit reuses `size="hero"` | No new variant needed. |
| `tw-animate-css` | `^1.4.0` | Success block fade-in (`animate-in fade-in-50 duration-300`) | Already imported in `globals.css` line 2. |
| `clsx` + `tailwind-merge` | `^2.1.1` / `^3.5.0` | `cn()` helper | Phase 1 utility. |

**No new runtime dependencies needed for Phase 3.** All Phase 3 code composes from the Phase 1/2 baseline.

### Test Toolchain (NEW — to install in Phase 3)

| Library | Recommended Version | Purpose | Verification |
|---------|---------------------|---------|--------------|
| `vitest` | `^4.1.5` | Test runner + assertions | [VERIFIED: npm view vitest version → `4.1.5`]. Peer deps: `vite ^6.0.0 || ^7.0.0 || ^8.0.0`. |
| `@vitejs/plugin-react` | `^4.3.6` | Vite plugin to compile JSX/TSX inside Vitest | [VERIFIED: npm view @vitejs/plugin-react version → `4.3.6`]. Peer deps: `vite ^8.0.0`. |
| `@testing-library/react` | `^16.3.2` | `render`, `screen`, `fireEvent`, `act` for React 19 | [VERIFIED: npm view → `16.3.2`]. Peer deps: `react ^18 \|\| ^19`. v16 moved `@testing-library/dom` to peer dep. [CITED: github.com/testing-library/react-testing-library/releases/tag/v16.0.0]. |
| `@testing-library/dom` | `^10.4.x` | Required peer dep of `@testing-library/react@^16` | Must install explicitly per RTL v16 release notes. |
| `@testing-library/jest-dom` | `^6.9.1` | DOM matchers (`toBeInTheDocument`, `toBeDisabled`, etc.) | [VERIFIED: npm view → `6.9.1`]. |
| `@testing-library/user-event` | `^14.6.1` | Realistic user interactions (keyboard, click, type) | [VERIFIED: npm view → `14.6.1`]. |
| `happy-dom` | `^20.9.0` | DOM environment (faster than jsdom) | [VERIFIED: npm view → `20.9.0`]. Engines: `node >= 20.0.0` ✓ (env has Node 24). |
| `@types/node` | `^20` (already installed as devDep) | Node types | Vitest 4 needs `^20 \|\| ^22 \|\| >= 24`. |

**Already installed for e2e:**
- `@playwright/test` `^1.59.1` (Phase 2). [VERIFIED: `node_modules/.bin/playwright` exists.]

### Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email validation | Custom regex / `String.includes('@')` | `z.email().max(254)` (Zod 4 top-level) | Catches RFC-spec edge cases; same schema can be reused client-side later. |
| Form state hook | Custom `useState`/`useReducer` for submit + pending + error | `useActionState` from `react` | Native React 19 hook gives pending boolean for free; works progressively. |
| Toast component | Custom toast with portal | `toast.error('...')` from `sonner` (existing `<Toaster>` mount) | Phase 1 already mounts the wrapper; sonner respects `prefers-reduced-motion` automatically. |
| Async loading spinner | CSS keyframe by hand | `<Loader2 className="animate-spin">` from lucide | Tailwind built-in `animate-spin` (no extra CSS). |
| Form data extraction | Manual `event.target.elements.email.value` | `formData.get('email')` (action's `FormData` arg) | Native to Server Actions. No event handler needed. |
| Hidden honeypot | `display: none` or `type="hidden"` | Off-screen positioning (`position: absolute; left: -9999px`) | `display: none` and `type="hidden"` are bot-detected — sophisticated bots skip filling them. UI-SPEC locks the off-screen pattern. |
| Bot detection ML / fingerprinting | "Smart" bot scoring with localStorage fingerprints | Honeypot + time-trap (Phase 3) + Upstash rate-limit + disposable-domain block (Phase 4) | Layered cheap defenses outperform a single fragile signal. PITFALLS.md Pitfall 3. |

**Key insight:** Every Phase 3 surface (form, validation, state, spinner, toast, anchor scroll) has a stable in-repo or first-party React/Next 19 idiom. **Do not introduce `react-hook-form`, `formik`, `framer-motion`, `next-themes`, or `clsx`-replacement libraries.** CLAUDE.md "What NOT to Use" enforces these bans.

---

## Architecture Patterns

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│ Initial render (RSC pipeline)                                    │
│                                                                  │
│   app/page.tsx                                                   │
│     └─ <WaitlistFormSection /> (RSC; preserves Phase 2 anchor)   │
│           ├─ heading + sub-copy (server-rendered text)           │
│           └─ <WaitlistForm /> ('use client' boundary)            │
│                 ├─ <form action={formAction}>                    │
│                 │     ├─ <Input name="email" defaultValue={…}>   │
│                 │     ├─ honeypot <input name="website" off-     │
│                 │     │   screen, tabIndex=-1>                   │
│                 │     ├─ time-trap <input name="renderedAt"      │
│                 │     │   value={renderedAtFromRSCProp}>         │
│                 │     └─ <Button type="submit" disabled={pending}│
│                 │         ><Loader2 if pending/>{label}</Button> │
│                 └─ useEffect[state] → toast.error(state.message) │
│                       (only when status=error AND no fieldErrors)│
└──────────────────────────────────────────────────────────────────┘
                               │
                Submit (JS-enabled path)        Submit (no-JS path)
                               │                          │
                               ▼                          ▼
┌──────────────────────────────────────┐  ┌─────────────────────────┐
│ React Action Transition              │  │ Native HTML form POST   │
│ (fetch under the hood)               │  │ to current page URL     │
│ → POST /__action_id                  │  │ → POST /                │
└──────────────────────────────────────┘  └─────────────────────────┘
                               │                          │
                               └────────────┬─────────────┘
                                            ▼
              ┌─────────────────────────────────────────────────┐
              │ Server Action (`'use server'`)                  │
              │ app/actions/join-waitlist.ts → joinWaitlistAction│
              │                                                 │
              │   1. honeypot check  → silent success           │
              │   2. time-trap check → silent success           │
              │   3. Zod parse       → fieldErrors on fail      │
              │   4. stub branch by email pattern               │
              │      ├─ dup@…   → success {duplicate: true}     │
              │      ├─ err@…   → error {message}               │
              │      ├─ slow@…  → 1500ms delay → success        │
              │      └─ default → success                       │
              │   5. return JoinWaitlistResult                  │
              └─────────────────────────────────────────────────┘
                                            │
                              ┌─────────────┴────────────────┐
                              ▼                              ▼
              ┌──────────────────────────────┐  ┌──────────────────────┐
              │ JS-enabled response          │  │ No-JS response       │
              │ → useActionState updates     │  │ → page re-renders    │
              │   state                      │  │   with form reset to │
              │ → component re-renders       │  │   initial state      │
              │ → success block OR inline    │  │   (no useActionState │
              │   error OR toast             │  │   state preserved)   │
              └──────────────────────────────┘  └──────────────────────┘
```

### Component Responsibilities

| Component | File | Type | Owns |
|-----------|------|------|------|
| `WaitlistFormSection` | `components/sections/waitlist-form-section.tsx` (renamed from `placeholder-form-section.tsx`) | RSC | Section heading, sub-copy, the `id="waitlist"` anchor, the time-trap timestamp prop |
| `WaitlistForm` | `components/waitlist/waitlist-form.tsx` (NEW) | Client (`'use client'`) | `useActionState` binding, form markup, success/error/pending render branches, sonner toast effect |
| `joinWaitlistAction` | `app/actions/join-waitlist.ts` (NEW) | Server Action (`'use server'`) | Zod validation, honeypot/time-trap rejection, stub branch routing, discriminated-union return |
| `Toaster` | `app/layout.tsx` (mount only; component already exists at `components/ui/sonner.tsx`) | Client (existing) | Renders sonner's toast container at app root |

### Pattern 1: Server Action signature with `useActionState`

**What:** When a Server Action is wrapped by `useActionState`, React injects `prevState` as the **first** argument (FormData becomes the second).

**When to use:** Always for Phase 3's action.

```ts
// app/actions/join-waitlist.ts
'use server'

import { z } from 'zod'

const schema = z.object({
  email: z.email({ error: 'Please enter a valid email address.' })
    .max(254, { error: 'Email address is too long.' }),
})

export type JoinWaitlistResult =
  | { status: 'success'; duplicate?: boolean }
  | {
      status: 'error'
      message?: string
      fieldErrors?: Record<string, string>
      submittedValues?: { email: string }  // see FORM-06 echo pattern below
    }

export async function joinWaitlistAction(
  _prevState: JoinWaitlistResult | null,
  formData: FormData,
): Promise<JoinWaitlistResult> {
  // 1. Honeypot — silent success (D-15)
  if (formData.get('website')) {
    return { status: 'success' }
  }

  // 2. Time-trap — silent success
  const renderedAt = Number(formData.get('renderedAt') ?? 0)
  if (renderedAt > 0 && Date.now() - renderedAt < 2000) {
    return { status: 'success' }
  }

  // 3. Zod validation
  const rawEmail = String(formData.get('email') ?? '')
  const parsed = schema.safeParse({ email: rawEmail })
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error)  // Zod 4 idiom
    const fieldErrors: Record<string, string> = {}
    for (const [key, msgs] of Object.entries(flat.fieldErrors)) {
      if (msgs?.[0]) fieldErrors[key] = msgs[0]
    }
    return {
      status: 'error',
      fieldErrors,
      submittedValues: { email: rawEmail },  // echo for FORM-06
    }
  }

  // 4. Stub branch routing (D-11)
  const email = parsed.data.email
  if (email === 'dup@example.com') {
    return { status: 'success', duplicate: true }
  }
  if (email === 'err@example.com') {
    return {
      status: 'error',
      message: 'Something went wrong. Try again in a moment.',
    }
  }
  if (email === 'slow@example.com') {
    await new Promise((r) => setTimeout(r, 1500))
    return { status: 'success' }
  }
  return { status: 'success' }
}
```

[VERIFIED: nextjs.org/docs/app/guides/forms — "When using `useActionState`, the Server function signature will change to receive a new `prevState` or `initialState` parameter as its first argument."]
[VERIFIED: zod.dev/v4 — `z.email()` is the v4 top-level idiom; `z.flattenError()` replaces deprecated `.flatten()`.]

### Pattern 2: Client Component with `useActionState` + sonner toast effect

**What:** The Client Component reads `state` to drive render branches, and runs a `useEffect` to fire the sonner toast on server-error.

**When to use:** Always for the form Client Component.

```tsx
// components/waitlist/waitlist-form.tsx
'use client'

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

export function WaitlistForm({ renderedAt }: { renderedAt: number }) {
  const [state, formAction, pending] = useActionState<JoinWaitlistResult | null, FormData>(
    joinWaitlistAction,
    null,
  )

  const successHeadingRef = useRef<HTMLHeadingElement>(null)

  // D-12: server-error toast (status=error AND has message AND no fieldErrors)
  useEffect(() => {
    if (state?.status === 'error' && state.message && !state.fieldErrors) {
      toast.error(state.message)
    }
  }, [state])

  // CD-08: focus success heading
  useEffect(() => {
    if (state?.status === 'success' && successHeadingRef.current) {
      successHeadingRef.current.focus()
    }
  }, [state])

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

  const fieldError =
    state?.status === 'error' ? state.fieldErrors?.email : undefined
  const echoedEmail =
    state?.status === 'error' ? state.submittedValues?.email : undefined

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
          defaultValue={echoedEmail ?? ''}   // FORM-06: echo back to defeat reset
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

      {/* Honeypot — off-screen */}
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

      {/* Time-trap — value passed in from RSC parent (avoids hydration mismatch) */}
      <input type="hidden" name="renderedAt" value={renderedAt} />

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

```tsx
// components/sections/waitlist-form-section.tsx (RSC)
import { WaitlistForm } from '@/components/waitlist/waitlist-form'

export function WaitlistFormSection() {
  // Date.now() runs at request time on the server; passed as a stable
  // primitive prop to the Client Component → no hydration mismatch.
  const renderedAt = Date.now()

  return (
    <section id="waitlist" className="scroll-mt-16 py-16 md:py-24">
      <div className="mx-auto max-w-prose px-6 text-center">
        <h2 className="mb-4 font-heading text-3xl font-bold leading-tight text-foreground md:text-4xl">
          Be first when Quibly opens up.
        </h2>
        <p className="mb-8 font-sans text-base text-muted-foreground">
          Drop your email and we&apos;ll ping you the moment Quibly&apos;s
          ready for the world.
        </p>
        <WaitlistForm renderedAt={renderedAt} />
      </div>
    </section>
  )
}
```

### Pattern 3: Vitest config (CD-09)

**What:** Minimum viable Vitest config that compiles JSX, runs in happy-dom, and adds jest-dom matchers.

```ts
// vitest.config.ts
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

```ts
// tests/setup.ts
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
```

```jsonc
// package.json — add scripts (planner places exactly)
{
  "scripts": {
    "test:unit": "vitest run",
    "test:unit:watch": "vitest"
  }
}
```

[VERIFIED: vitest.dev — `environment: 'happy-dom'` + `setupFiles` + `globals: true` is the documented React+RTL pattern. `@vitejs/plugin-react` required for JSX/TSX compilation.]

### Pattern 4: Playwright `javaScriptEnabled: false` for FORM-08

**What:** Playwright supports per-test or project-level toggle. Recommend a separate **project** in `playwright.config.ts` so the no-JS spec can be tagged and run in isolation.

```ts
// playwright.config.ts (extended from Phase 2)
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: { timeout: 5000 },
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 320, height: 568 },
  },
  projects: [
    {
      name: 'visual-and-form',
      testMatch: /tests\/(visual|form)\/.*\.spec\.ts/,
    },
    {
      name: 'no-js',
      testMatch: /tests\/no-js\/.*\.spec\.ts/,
      use: { javaScriptEnabled: false },
    },
  ],
})
```

```ts
// tests/no-js/waitlist-form-progressive.spec.ts
import { test, expect } from '@playwright/test'

test('form submits and shows success state without JavaScript', async ({ page }) => {
  await page.goto('/#waitlist')
  await page.fill('input[name="email"]', 'noscript@example.com')
  // Native form POST happens on submit; the page navigates and re-renders
  await Promise.all([
    page.waitForLoadState('domcontentloaded'),
    page.click('button[type="submit"]'),
  ])
  // After no-JS POST, useActionState resets to initial state — the page
  // shows the form again. We're asserting the **server processed the
  // submission successfully**, not that the success block renders.
  // The acceptable signal is: page reloaded successfully (HTTP 200) and
  // the form is in idle state (not in some error state).
  await expect(page.locator('form')).toBeVisible()
  await expect(page.locator('input[name="email"]')).toHaveValue('')
})
```

**Important caveat:** as documented in Pattern 1 above and Pitfall 3 below, `useActionState`'s state is **NOT preserved across the no-JS round-trip**. The no-JS test asserts that the server processed the action (HTTP 200, no error), not that the success block rendered. If the success block must render server-side after a no-JS submit, the planner must implement a parallel `redirect()` or cookie-based success page (out of scope for Phase 3 stub but worth flagging).

[VERIFIED: github.com/microsoft/playwright — `javaScriptEnabled: false` works at project level (`use: { javaScriptEnabled: false }`) AND per-test (`test.use({ javaScriptEnabled: false })`).]

### Pattern 5: GitHub Actions test workflow (D-18)

**What:** Two parallel jobs on PR — Vitest (fast lane) and Playwright (slow lane). Cache the Playwright browsers against the `@playwright/test` version.

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  vitest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: lts/*
          cache: npm
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm run test:unit

  playwright:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: lts/*
          cache: npm
      - run: npm ci
      - name: Get installed Playwright version
        id: playwright-version
        run: echo "version=$(node -p "require('@playwright/test/package.json').version")" >> "$GITHUB_OUTPUT"
      - name: Cache Playwright browsers
        uses: actions/cache@v4
        id: playwright-cache
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ steps.playwright-version.outputs.version }}
      - name: Install Playwright browsers
        if: steps.playwright-cache.outputs.cache-hit != 'true'
        run: npx playwright install --with-deps chromium
      - name: Build and start Next dev server
        run: |
          npm run build
          npx next start &
          npx wait-on http://localhost:3000 --timeout 30000
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

**Branch-protection status check names:**
- `Tests / vitest`
- `Tests / playwright`
- (existing) `Lighthouse CI / lighthouse`

D-18 mandates a manual GitHub UI step to add the new two job names to `main`'s required-status-checks. This mirrors Phase 2 D-34's pattern; the manual step belongs as a checkpoint task in the plan (autonomous: false).

[CITED: playwright.dev/docs/ci — recommended cache pattern; verified `~/.cache/ms-playwright` is the default install location.]

### Recommended Project Structure

```
app/
├── actions/
│   └── join-waitlist.ts           # NEW — Server Action ('use server')
├── layout.tsx                      # MODIFY — add <Toaster /> mount
├── page.tsx                        # MODIFY — swap PlaceholderFormSection import
└── globals.css                     # unchanged

components/
├── sections/
│   ├── hero.tsx                    # MODIFY — flip CTA to <a href="#waitlist">
│   ├── secondary-cta.tsx           # MODIFY — flip CTA to <a href="#waitlist">
│   ├── waitlist-form-section.tsx   # RENAMED from placeholder-form-section.tsx (RSC)
│   └── (others unchanged)
├── ui/                             # unchanged
└── waitlist/
    └── waitlist-form.tsx           # NEW — Client Component ('use client')

tests/
├── visual/                         # existing — Phase 2 specs (above-fold, button-radius)
├── form/                           # NEW — Phase 3 e2e specs (success, validation, sonner, idempotent)
├── no-js/                          # NEW — Phase 3 progressive-enhancement spec
├── unit/                           # NEW — Vitest unit specs
│   ├── join-waitlist-action.test.ts
│   └── waitlist-form.test.tsx
└── setup.ts                        # NEW — Vitest setup (jest-dom matchers)

vitest.config.ts                     # NEW
playwright.config.ts                 # MODIFY — add no-js project
.github/workflows/test.yml           # NEW (or extend lighthouse.yml)
```

### Anti-Patterns to Avoid

- **`<form onSubmit={handler}>` instead of `<form action={formAction}>`** — loses progressive enhancement. The `action` prop is the React 19 idiom.
- **Storing email in `useState` and treating it as a controlled input** — defeats the FormData round-trip for no-JS users. Use `defaultValue` + uncontrolled.
- **Calling `formAction` manually outside a transition** — React throws. The `<form action={formAction}>` binding handles transition wrapping internally.
- **Setting `state.status === 'success'` from the client to "fake" success** — defeats the test boundary; tests must drive through the action.
- **Manual `setTimeout` for the spinner** — `pending` is already a boolean from `useActionState`. Adding extra state introduces race conditions.
- **Passing `Date.now()` directly inside Client Component JSX** — hydration mismatch (see Pitfall 2).
- **Using `state.duplicate` to render different success copy** — POST-03 enumeration defense violation.
- **Importing `resend` SDK in Phase 3** — Phase 4 territory; Phase 3's stub action makes zero external calls.

---

## Common Pitfalls

### Pitfall 1: React 19 auto-resets uncontrolled inputs after action resolution → FORM-06 broken silently

**What goes wrong:** User types `bad-email`, clicks submit, action returns `{ status: 'error', fieldErrors: { email: 'Please enter a valid email address.' } }`. The inline error renders correctly — but the input is empty. The user has to retype.

**Why it happens:** React 19's `<form action={fn}>` calls `form.reset()` on every Promise resolution from the action — regardless of whether the return value indicates success or failure. The only way to prevent the reset is for the action to **throw**, which then escalates to the nearest error boundary.

**Source:** [VERIFIED: react.dev/reference/react-dom/components/form — "After the `action` function succeeds, all uncontrolled field elements in the form are reset."] and [CITED: github.com/facebook/react/issues/31649 — closed as "not planned"; React team's position is that echoing-via-defaultValue is the canonical pattern].

**How to avoid:** The action returns the submitted email under a top-level `submittedValues` field on the error branch (NOT nested inside `fieldErrors` — that's type-awkward). The Client Component reads `state.submittedValues?.email` and passes it as `defaultValue` on the `<Input>`. After the form resets, React re-renders the input with the echoed value as its default.

**Warning signs:** Vitest test for "validation error preserves typed value" passes if the test asserts on the rendered HTML, but a user QA'ing the page will report the input clearing. The Playwright e2e spec MUST assert `expect(page.locator('input[name="email"]')).toHaveValue('bad-email')` after submit — this is the load-bearing test.

### Pitfall 2: Hydration mismatch from `Date.now()` inside Client Component

**What goes wrong:** Putting `<input type="hidden" name="renderedAt" defaultValue={Date.now()} />` directly inside the Client Component's JSX causes a hydration mismatch. The server renders one value (request time), the client expects another (a few hundred ms later), React warns and rehydrates — possibly losing the value.

**Why it happens:** The Client Component runs on **both** the server (initial RSC pass) and the client (hydration). `Date.now()` returns different values in each.

**Source:** [VERIFIED: nextjs.org/docs/messages/react-hydration-error — "Using time-dependent APIs such as the Date() constructor in your rendering logic can cause hydration mismatches."]

**How to avoid:** Compute the timestamp in the **parent RSC** (`<WaitlistFormSection>`) at request time, then pass it as a stable primitive prop to the Client Component:
```tsx
// RSC parent
const renderedAt = Date.now()
return <WaitlistForm renderedAt={renderedAt} />

// Client child
<input type="hidden" name="renderedAt" value={renderedAt} />
```

This pattern works because (a) the RSC server-renders the Client Component's HTML using the prop value, (b) the client-side hydration receives the same prop value (it's serialized through the RSC payload), (c) no `Date.now()` runs on the client.

**Alternatives considered:**
- `useState(() => Date.now())` lazy init + `suppressHydrationWarning` on the input — works but pollutes DOM with a warning suppression and risks the lazy-init firing before/after server render unpredictably.
- Cookie-based timestamp set via Server Action middleware — overkill for a non-cryptographic check.
- Trust client clock entirely (set in `useEffect` after mount) — breaks pre-hydration submits (FORM-08).

**Warning signs:** Dev console shows `Hydration failed because the initial UI does not match what was rendered on the server`. CI Vitest tests pass (DOM env doesn't trigger SSR hydration). Only Playwright + dev server catches it.

### Pitfall 3: `useActionState` state is NOT preserved across no-JS round-trip → FORM-08 success block won't render server-side

**What goes wrong:** With JS disabled, the user fills in the form, clicks submit, the browser does a native POST to `/`, Next.js runs the action server-side, the action returns `{ status: 'success' }` — and then the page re-renders with the **initial** state (`null`), not the action's return value. The success block never appears for no-JS users; they see the form reset to idle.

**Why it happens:** `useActionState` only updates state on the JS-enabled path (where the hook lives in a hydrated Client Component and receives the action's return via the React Action transition). On the no-JS path, the form does a regular HTTP POST, the server returns the page HTML with `useActionState`'s initial state, and there's no mechanism for the action's return value to be threaded back into `state`.

**Source:** [VERIFIED: react.dev/reference/react/useActionState — `permalink` is the only mechanism for redirecting to a different page after a no-JS submit; otherwise the next render uses initial state.]

**How to avoid:** For Phase 3's stub, **document this as accepted graceful degradation.** No-JS users still have their submission processed (the action runs server-side, the email validates, the would-be Resend write would happen in Phase 4). They just don't see the success block — they see the form reset to idle. This satisfies FORM-08 ("the form remains submittable without JS") but not POST-01 ("in-place success state replaces the form") for no-JS users.

If the planner wants stronger no-JS UX, the action can `redirect('/?signup=success')` and the page can read the search param to render the success block server-side. **However**, this is a meaningful architecture change that should be flagged as an Open Question — it's not strictly required by FORM-08 wording, and adding it now creates a second success-rendering path that Phase 4 must maintain.

**Recommended Playwright assertion (no-JS):** Assert that the server processed the submit successfully (HTTP 200, no error) and the form is in an idle state. **Do not assert** that the success block renders.

**Warning signs:** A test that asserts the success block in the no-JS spec will fail without the redirect-or-search-param workaround.

### Pitfall 4: `useEffect` toast double-fires across React 19 Strict Mode

**What goes wrong:** In dev mode (Next.js dev server runs Strict Mode), `useEffect` may fire twice on mount. If the toast effect doesn't guard, the user sees two toasts on the same error.

**Why it happens:** Strict Mode intentionally double-invokes effects to surface bugs in cleanup logic. Production builds do not.

**Source:** [VERIFIED: react.dev/reference/react/StrictMode — Strict Mode runs effects twice in dev to catch bugs.]

**How to avoid:** The recommended `useEffect` watching `state` is naturally guarded — `state` only changes when `useActionState` updates it (after an action resolves). Strict Mode's mount-twice happens once, when the component initially mounts, when `state === null`, so the guard `if (state?.status === 'error' && state.message && !state.fieldErrors)` evaluates falsy and no toast fires. Subsequent action resolutions create a new `state` object identity, so the effect re-runs once per resolution.

**However**, if a test environment has Strict Mode on and the action returns an error twice in quick succession with the same shape, watch for double-toast. Mitigation: use `toast.error(state.message, { id: 'waitlist-error' })` to dedupe by ID — sonner deduplicates on id [VERIFIED: sonner.emilkowal.ski docs].

**Warning signs:** QA reports two toasts in dev that don't appear in production.

### Pitfall 5: Zod 4's `.flatten()` deprecation breaks copy-pasted Next.js docs example

**What goes wrong:** The Next.js official forms guide (current as of 2026-04-10) shows `validatedFields.error.flatten().fieldErrors`. This is **Zod 3** API; Zod 4 deprecates `.flatten()`.

**Why it happens:** Zod 4 release notes: `"The .flatten() method on ZodError has also been deprecated. The recommended alternative is to use the top-level z.treeifyError() function."` But for form-style flat field errors, `z.flattenError(error)` is the closer API.

**Source:** [VERIFIED: zod.dev/v4/changelog — deprecates .flatten()]. [CITED: nextjs.org/docs/app/guides/forms — still shows the Zod 3 idiom.]

**How to avoid:** Use `z.flattenError(parsed.error).fieldErrors` (returns `Record<string, string[]>` — take `[0]` for single message per field). Document the v4 idiom in the action's source comments to short-circuit any future copy-paste regression.

**Warning signs:** TypeScript may not flag `.flatten()` as deprecated (Zod marks it via JSDoc), and the runtime still works in Zod 4 — silent rot.

### Pitfall 6: `<Toaster>` mounted but `toast()` call from RSC throws

**What goes wrong:** `toast()` is a client-side function. Calling it from a Server Action (`'use server'`) or RSC throws "toast is not defined" / module-resolution errors.

**Why it happens:** `sonner` imports browser-only APIs.

**How to avoid:** Toasts ONLY fire from the Client Component's `useEffect`. The Server Action returns the error message in state; the Client Component reads it and calls `toast.error()`. **This is the architecture in Pattern 2.** Document explicitly so a future helpful refactor doesn't pull `toast.error` into the action.

### Pitfall 7: Vitest config alias mismatch breaks `@/` imports

**What goes wrong:** Tests import from `@/components/...` and `@/app/actions/...` but Vitest doesn't know about the path alias → `Cannot find module '@/...'`.

**Why it happens:** Next.js auto-resolves the `@/*` alias from `tsconfig.json`'s `paths` block; Vitest does not.

**How to avoid:** Add `resolve.alias` to `vitest.config.ts` mirroring the `tsconfig.json` `paths`. See Pattern 3.

**Warning signs:** First Vitest run prints `Cannot find module` for every aliased import.

### Pitfall 8: Vitest needs `vite-tsconfig-paths` as alternative to manual alias

**What goes wrong:** Manual alias works but is duplicated config (tsconfig.json + vitest.config.ts).

**How to avoid (alternative):** Install `vite-tsconfig-paths` as a Vitest plugin. Reads `tsconfig.json` directly. **Optional** — Pattern 3's manual alias is fine for one alias.

### Pitfall 9: Hero/Secondary CTA flip from `<button aria-disabled>` to `<a href>` breaks Phase 2 Playwright button-radius spec

**What goes wrong:** The Phase 2 button-radius spec asserts `border-radius: 28px` on a `<button>` element. Phase 3 swaps the hero/secondary CTAs to `<Button asChild><a href>`, which may render as `<a>` instead of `<button>` and break the existing selector.

**Why it happens:** `<Button asChild>` uses Radix Slot to merge props onto the child element type. The `data-slot="button"` attribute is preserved (set by the Button component), but the tag name changes.

**How to avoid:** Verify the Phase 2 spec uses `[data-slot="button"]` selector or `[data-size="hero"]` (token-based, tag-agnostic) rather than a `button` tag selector. If it uses `button`, update the selector during Phase 3 implementation. Cross-reference: `tests/visual/button-radius.spec.ts` (Phase 2 02-06 plan).

**Warning signs:** Phase 3 PR's Lighthouse-CI run is green but the existing Playwright button-radius spec fails because the selector no longer matches.

---

## Code Examples

(See Pattern 1, 2, 3, 4, 5 above — those are the load-bearing snippets the plan tasks should cite.)

### Email-pattern stub branch matrix (D-11 → Vitest-mappable)

```ts
// Stub-branch decision matrix (Phase 3 only; Phase 4 deletes)
const STUB_TRIGGERS = {
  'dup@example.com':  () => ({ status: 'success', duplicate: true } as const),
  'err@example.com':  () => ({
    status: 'error',
    message: 'Something went wrong. Try again in a moment.',
  } as const),
  'slow@example.com': async () => {
    await new Promise((r) => setTimeout(r, 1500))
    return { status: 'success' } as const
  },
} as const
```

### Vitest unit-test shape (action branches)

```ts
// tests/unit/join-waitlist-action.test.ts
import { describe, it, expect } from 'vitest'
import { joinWaitlistAction } from '@/app/actions/join-waitlist'

function fd(entries: Record<string, string>) {
  const f = new FormData()
  for (const [k, v] of Object.entries(entries)) f.append(k, v)
  return f
}

describe('joinWaitlistAction (Phase 3 stub)', () => {
  it('returns silent success when honeypot is filled', async () => {
    const r = await joinWaitlistAction(null, fd({
      email: 'real@example.com',
      website: 'https://bot.example.com',
      renderedAt: String(Date.now() - 5000),
    }))
    expect(r).toEqual({ status: 'success' })
  })

  it('returns silent success when submitted faster than 2s', async () => {
    const r = await joinWaitlistAction(null, fd({
      email: 'real@example.com',
      website: '',
      renderedAt: String(Date.now()),
    }))
    expect(r).toEqual({ status: 'success' })
  })

  it('returns fieldErrors and echoes the typed value on invalid email', async () => {
    const r = await joinWaitlistAction(null, fd({
      email: 'not-an-email',
      website: '',
      renderedAt: String(Date.now() - 5000),
    }))
    expect(r.status).toBe('error')
    if (r.status === 'error') {
      expect(r.fieldErrors?.email).toBeTruthy()
      expect(r.submittedValues?.email).toBe('not-an-email')
    }
  })

  it('returns success+duplicate for dup@example.com', async () => {
    const r = await joinWaitlistAction(null, fd({
      email: 'dup@example.com',
      website: '',
      renderedAt: String(Date.now() - 5000),
    }))
    expect(r).toEqual({ status: 'success', duplicate: true })
  })

  it('returns error with toast message for err@example.com', async () => {
    const r = await joinWaitlistAction(null, fd({
      email: 'err@example.com',
      website: '',
      renderedAt: String(Date.now() - 5000),
    }))
    expect(r.status).toBe('error')
    if (r.status === 'error') {
      expect(r.message).toBe('Something went wrong. Try again in a moment.')
      expect(r.fieldErrors).toBeUndefined()
    }
  })
})
```

### Vitest Client Component shape (RTL)

```tsx
// tests/unit/waitlist-form.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WaitlistForm } from '@/components/waitlist/waitlist-form'

vi.mock('@/app/actions/join-waitlist', () => ({
  joinWaitlistAction: vi.fn(async (_prev, formData: FormData) => {
    const email = String(formData.get('email') ?? '')
    if (email === 'err@example.com') {
      return { status: 'error', message: 'Boom' } as const
    }
    return { status: 'success' } as const
  }),
}))

describe('<WaitlistForm>', () => {
  it('renders the form in idle state', () => {
    render(<WaitlistForm renderedAt={Date.now() - 5000} />)
    expect(screen.getByRole('button', { name: /join the waitlist/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
  })

  it('shows the success block after a successful submit', async () => {
    const user = userEvent.setup()
    render(<WaitlistForm renderedAt={Date.now() - 5000} />)
    await user.type(screen.getByPlaceholderText('you@example.com'), 'real@example.com')
    await user.click(screen.getByRole('button', { name: /join the waitlist/i }))
    expect(await screen.findByRole('status')).toHaveTextContent(/you're on the list/i)
  })
})
```

---

## State of the Art

| Old Approach | Current Approach (Phase 3) | When Changed | Impact |
|--------------|----------------------------|--------------|--------|
| `useFormState` (React 18) | `useActionState` (React 19) | React 19 RC, late 2024 | Same hook, renamed; Phase 3 must use `useActionState`. |
| `validatedFields.error.flatten().fieldErrors` (Zod 3) | `z.flattenError(parsed.error).fieldErrors` (Zod 4) | Zod 4.0, mid-2025 | The Next.js official docs still show the Zod 3 idiom — easy regression vector. |
| `z.string().email()` (Zod 3) | `z.email()` (Zod 4 top-level) | Zod 4.0 | Tree-shakeable; same runtime semantics. |
| `<form onSubmit={asyncFn}>` + `useState`-driven loading | `<form action={formAction}>` + `useActionState` `pending` | React 19 / Next 15+ | Progressive-enhances out of the box; 30% less code. |
| `react-hook-form` + `@hookform/resolvers/zod` | Native form + Zod in Server Action | This project's CLAUDE.md | Saves ~30KB; matches CLAUDE.md ban; trivially testable. |
| `jsdom` for Vitest DOM env | `happy-dom` for Vitest DOM env | Vitest 1.x onward (community shift) | Faster startup + execution; Vitest 4 supports both (peer dep `*`). |
| Manual `--ignore-scripts` for Playwright in CI | `npx playwright install --with-deps chromium` | Playwright 1.40+ | Single-browser install (chromium only) saves ~2min of CI time. |

**Deprecated/outdated (do NOT use):**
- `useFormState` — superseded by `useActionState`.
- `Zod .errorMap` — replaced by `error` parameter (function or string).
- `z.string().email()` — use `z.email()`.
- `validatedFields.error.flatten()` — use `z.flattenError()`.
- `<form action="/api/subscribe" method="POST">` (raw URL) — use Server Action reference instead.

---

## Assumptions Log

> This research session verified all material claims via Context7 and official docs. **No load-bearing claims are tagged `[ASSUMED]`.** A few advisory items below are flagged as judgment calls the planner may revisit.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| (none) | All Phase 3 specifics — Zod 4 idioms, useActionState semantics, form auto-reset, hydration mismatch, no-JS state semantics, sonner mount, Playwright `javaScriptEnabled: false`, Vitest+RTL+happy-dom toolchain — verified via Context7 (`/vercel/next.js`, `/vitest-dev/vitest`, `/microsoft/playwright`, `/emilkowalski/sonner`, `/websites/zod_dev_v4`) and official docs. | All | n/a |

**Advisory judgment calls** (not assumed; documented for transparency):

| # | Judgment | Rationale | Reversal cost |
|---|----------|-----------|---------------|
| J1 | Use `submittedValues` as a top-level error-branch field (not `fieldErrors._emailValue`) | Type-narrows cleanly via discriminated union; keeps `fieldErrors` semantically only for field-level errors. | Trivial — rename one key. |
| J2 | Render `Date.now()` in the RSC parent and pass as prop (NOT `useState(() => Date.now())` + `suppressHydrationWarning`) | Avoids hydration-warning suppression; works under SSR + hydration; no client-clock dependency. | Small — switch to `useState` lazy init if RSC prop becomes inconvenient. |
| J3 | No-JS Playwright spec asserts the form is reset to idle after POST (NOT that the success block renders) | Documents accepted graceful degradation per Pitfall 3. Stronger UX requires `redirect()` + search-param-driven RSC render — out of Phase 3 scope. | Small — flag as Open Question for the planner. |
| J4 | Two parallel CI jobs (Vitest + Playwright), not one sequential job | Vitest is fast (~30s); Playwright is slow (~2min). Parallel keeps PR feedback under 3min total. | Trivial — collapse into one job if cost matters. |
| J5 | Cache `~/.cache/ms-playwright` against `@playwright/test` package version (not `package-lock.json` hash) | Browser binaries change with Playwright version, not arbitrary lockfile changes. | Trivial — change cache-key strategy. |

---

## Open Questions

1. **No-JS success rendering — graceful degradation vs. `redirect()` workaround.**
   - What we know: `useActionState` state is NOT preserved across no-JS round-trip (verified). FORM-08 wording requires "the form remains submittable without JS" — this is satisfied if the action runs server-side and the page re-renders. POST-01 ("in-place success state replaces the form") is unambiguously satisfied for JS users.
   - What's unclear: Does the founder consider it acceptable that no-JS users see the form reset to idle (without a success block) after a successful submit? Or must the no-JS path also show success?
   - Recommendation: Document the graceful degradation in the Phase 3 plan and the Phase 3 PR. If no-JS success-rendering is required, scope a separate task that uses `redirect('/?signup=success')` from the action and reads the search param in `<WaitlistFormSection>` (RSC) to render the success block. This is a meaningful change to the action's behavior — Phase 4 would inherit it.

2. **Branch protection for the new test workflow — manual setup gating.**
   - What we know: D-18 mandates branch-protection enforcement; Phase 2 D-34 set the same precedent for Lighthouse CI.
   - What's unclear: Phase 2's branch-protection step is documented in STATE.md as a deferred follow-up ("Pending follow-up PR session"). Should Phase 3 wait until Phase 2's branch-protection is configured, or proceed independently?
   - Recommendation: Phase 3 ships the workflow file; the branch-protection configuration step is a checkpoint task in the plan (autonomous: false) — same pattern as Phase 2 02-05 Task 4. Document in plan that the actual GitHub UI configuration can be batched with Phase 2's pending step.

3. **Already-subscribed `duplicate: true` flag — is the flag safe to ship in Phase 3 if Phase 5 wires the analytics?**
   - What we know: The flag is captured in `JoinWaitlistResult.success.duplicate`. The UI never reads it (POST-03 enumeration defense). Phase 5 will wire `track('waitlist_signup', { duplicate })` in a wrapping `useEffect`.
   - What's unclear: If the Phase 3 stub action sets `duplicate: true` for `dup@example.com`, does that flag survive the Vitest+Playwright snapshot tests as documented behavior? Or should the flag only appear in Phase 4 when real Resend duplicates can be detected?
   - Recommendation: Keep the flag in Phase 3's stub. The Vitest test asserts the flag value; the Playwright test ignores it (since the UI doesn't surface it). Phase 4 swaps the stub for Resend's real duplicate detection but keeps the same flag in the same return shape.

4. **Phase 2 Playwright button-radius spec selector — does it use tag-agnostic selector?**
   - What we know: Phase 3 flips hero + secondary CTAs from `<button>` to `<Button asChild><a>`. Pitfall 9 flags this.
   - What's unclear: Without reading `tests/visual/button-radius.spec.ts`, can't confirm the existing selector works.
   - Recommendation: Phase 3 plan's first task should `cat tests/visual/button-radius.spec.ts` and either confirm tag-agnostic selectors OR add a small selector update task. Don't let this surprise the executor.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All test/runtime | ✓ | v24.7.0 | — (Vitest 4 supports `^20 \|\| ^22 \|\| >=24`; Happy-DOM requires `>=20`) |
| npm | Package install | ✓ | 11.5.1 | — |
| Next.js | Already installed | ✓ | 16.2.1 | — |
| Playwright | Phase 2 already installed | ✓ | 1.59.1 (`@playwright/test`) | — |
| TypeScript | Already installed | ✓ | `^5` | — |
| ESLint | Already installed | ✓ | `^9` | — |
| Vercel CLI | not needed in Phase 3 (Lighthouse CI handles preview) | n/a | — | — |
| Vitest | NOT installed — to add in Phase 3 | ✗ | — | Block; install with versions above |
| `@vitejs/plugin-react` | Required for Vitest+RTL JSX | ✗ | — | Block; install |
| `@testing-library/react` | Required for component tests | ✗ | — | Block; install |
| `@testing-library/dom` | Peer of RTL v16 | ✗ | — | Block; install |
| `@testing-library/jest-dom` | DOM matchers | ✗ | — | Block; install |
| `@testing-library/user-event` | Realistic interactions | ✗ | — | Block; install |
| `happy-dom` | Vitest DOM env | ✗ | — | Block; install |
| Lighthouse CI workflow | Existing (`.github/workflows/lighthouse.yml`) | ✓ | n/a | Reference for new test.yml shape |

**Missing dependencies with no fallback:** all 7 test toolchain packages above (planner adds them as a single Wave 0 install task).

**Missing dependencies with fallback:** none — all test toolchain packages are mandatory for Phase 3 D-17/D-18.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Unit framework | Vitest `^4.1.5` + happy-dom `^20.9.0` + RTL `^16.3.x` (NEW — install in Wave 0) |
| Unit config file | `vitest.config.ts` (NEW — see Pattern 3) |
| Unit setup file | `tests/setup.ts` (NEW — jest-dom matchers + cleanup) |
| Unit run command | `npm run test:unit` (script: `vitest run`) |
| Unit watch command | `npm run test:unit:watch` (script: `vitest`) |
| E2E framework | Playwright `1.59.1` (existing) |
| E2E config file | `playwright.config.ts` (MODIFY — add no-js project) |
| E2E run command | `npm run test:e2e` (existing — script: `playwright test`) |
| Type-check | `npm run check` (existing — script: `tsc --noEmit`) |
| Lint | `npm run lint` (existing — script: `eslint`) |
| Phase gate | All four (`check`, `lint`, `test:unit`, `test:e2e`) green before `/gsd-verify-work` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FORM-01 | Single email field rendered | unit (Vitest+RTL) | `vitest run tests/unit/waitlist-form.test.tsx -t "renders the form in idle state"` | ❌ Wave 0 |
| FORM-02 | `type="email" inputMode="email" autoComplete="email"` attributes | unit (Vitest+RTL) | `vitest run tests/unit/waitlist-form.test.tsx -t "input has correct attributes"` | ❌ Wave 0 |
| FORM-03 | Server-side Zod email validation | unit (Vitest action test) | `vitest run tests/unit/join-waitlist-action.test.ts -t "rejects invalid email"` | ❌ Wave 0 |
| FORM-04 | "Join the waitlist" CTA copy verbatim | unit + e2e | `vitest run -t "join the waitlist"` + `playwright test -g "submit copy"` | ❌ Wave 0 |
| FORM-05 | Pending state visible (button disabled + spinner) | e2e (Playwright) | `playwright test tests/form/pending-state.spec.ts` | ❌ Wave 0 |
| FORM-06 | Inline error preserves typed value | unit + e2e | `vitest run -t "echoes typed value"` + `playwright test -g "preserves email after validation error"` | ❌ Wave 0 |
| FORM-07 | Enter-key submit | e2e (Playwright) | `playwright test tests/form/enter-key-submit.spec.ts` | ❌ Wave 0 |
| FORM-08 | No-JS form submittable | e2e (Playwright `javaScriptEnabled: false`) | `playwright test tests/no-js/waitlist-form-progressive.spec.ts` | ❌ Wave 0 |
| FORM-09 | `useActionState` typed binding | type-check + unit | `tsc --noEmit` + `vitest run tests/unit/waitlist-form.test.tsx` | ❌ Wave 0 |
| POST-01 | In-place success replaces form | e2e (Playwright) | `playwright test tests/form/success-state.spec.ts -g "in-place"` | ❌ Wave 0 |
| POST-02 | Success copy verbatim | unit + e2e | `vitest run -t "success copy verbatim"` + `playwright test -g "Check your inbox"` | ❌ Wave 0 |
| POST-03 | Already-subscribed visually identical | unit (assert flag in state, not in DOM) + e2e (visual identity) | `vitest run -t "duplicate flag"` + `playwright test -g "duplicate visual identity"` | ❌ Wave 0 |
| POST-04 | Idempotent submit (double-submit safe) | e2e (Playwright) | `playwright test tests/form/idempotent.spec.ts` | ❌ Wave 0 |
| SPAM-01 | Honeypot rejects silently | unit (Vitest action) | `vitest run tests/unit/join-waitlist-action.test.ts -t "honeypot"` | ❌ Wave 0 |
| SPAM-02 | Time-trap rejects <2s submissions silently | unit (Vitest action) | `vitest run tests/unit/join-waitlist-action.test.ts -t "time-trap"` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run check && npm run lint && npm run test:unit` (~10–30s)
- **Per wave merge:** `npm run check && npm run lint && npm run test:unit && npm run test:e2e` (~3–4min)
- **Phase gate:** Full suite green AND CI green (Vitest job + Playwright job + Lighthouse CI job all passing) before `/gsd-verify-work`.

### Wave 0 Gaps

- [ ] `vitest.config.ts` — Vitest config with happy-dom + jest-dom + alias
- [ ] `tests/setup.ts` — jest-dom matchers + RTL cleanup
- [ ] `tests/unit/join-waitlist-action.test.ts` — covers FORM-03, FORM-06, POST-03 (state shape), SPAM-01, SPAM-02, all 4 stub branches
- [ ] `tests/unit/waitlist-form.test.tsx` — covers FORM-01, FORM-02, FORM-04 (copy), FORM-09 (binding), POST-02 (copy in DOM)
- [ ] `tests/form/pending-state.spec.ts` — covers FORM-05
- [ ] `tests/form/success-state.spec.ts` — covers POST-01, POST-02, POST-03 (visual identity)
- [ ] `tests/form/validation-error.spec.ts` — covers FORM-06 (real-DOM verification of input value retained)
- [ ] `tests/form/server-error-toast.spec.ts` — covers D-12 (sonner triggered on `err@example.com`)
- [ ] `tests/form/idempotent.spec.ts` — covers POST-04
- [ ] `tests/form/anchor-scroll.spec.ts` — covers D-01/D-02 (hero/secondary CTAs scroll to `#waitlist`)
- [ ] `tests/no-js/waitlist-form-progressive.spec.ts` — covers FORM-08
- [ ] `playwright.config.ts` — add no-js project (see Pattern 4)
- [ ] `.github/workflows/test.yml` — Vitest + Playwright jobs (see Pattern 5)
- [ ] Framework install: `npm i -D vitest@^4 @vitejs/plugin-react@^4.3 @testing-library/react@^16.3 @testing-library/dom@^10 @testing-library/jest-dom@^6.9 @testing-library/user-event@^14.6 happy-dom@^20`

### Validation surface ambiguity (planner Dimension-8 risk)

| Req ID | Risk | Mitigation |
|--------|------|------------|
| FORM-08 | No-JS path: `useActionState` state NOT preserved → success block won't render. Test signal is "form is in idle state after no-JS submit" — weak compared to "success block renders." | See Open Question 1. Plan should EITHER document the graceful-degradation acceptance OR scope a `redirect()`-based no-JS success path as a separate task. |
| POST-03 | "Visually identical" is a structural assertion (same DOM tree, same classes) — Playwright can do this but if a future commit subtly changes the success block for `duplicate: true`, the test should catch it. | Spec must use a structural snapshot (e.g., `expect(page.locator('[role=status]')).toHaveText("You're on the list. Check your inbox (and spam folder) for confirmation.")`) AND assert no `data-duplicate` attribute appears. |
| POST-04 | "Idempotent submit" — what does idempotence mean for a stubbed action? The stub doesn't have a real audience to deduplicate against. | Test asserts: clicking submit twice in quick succession (with `disabled={pending}` preventing the second click during pending) results in only one action call AND a final success state. The browser-level idempotency. Real audience-level idempotency is a Phase 4 concern. |

---

## Project Constraints (from CLAUDE.md)

Distilled directives from `./CLAUDE.md` that the planner MUST honor:

**MUST do:**
- Use Next.js 16.2 App Router + React 19.2 + TypeScript + Tailwind v4 (matches `marketing-app`).
- Use `next/font/google` for Quicksand + Figtree (already wired in Phase 1).
- Use Resend Audiences API as source of truth (Phase 4).
- Use Vercel Analytics + Speed Insights for analytics (Phase 5).
- Use Cloudflare Turnstile + honeypot for bot protection (Turnstile is V2-07, signal-gated).
- Use `<form action={serverAction}>` + `useActionState` + Zod for forms (Phase 3 baseline).
- Privacy + terms + footer links must exist before public launch (Phase 5).
- All routes return Lighthouse mobile ≥90 (preserved by Phase 2 gate).

**MUST NOT do (banned):**
- `react-hook-form` / `@hookform/resolvers` — overkill for one field
- `framer-motion` — too heavy; use Tailwind + `tw-animate-css`
- `react-icons` — use `lucide-react` only
- `next-themes` — no dark mode in v1
- `@tailwindcss/typography` — not needed
- Self-hosted reCAPTCHA / Google reCAPTCHA — privacy theater
- Google Tag Manager / GA4 / PostHog / Meta Pixel — cookie-bearing
- `<link href="fonts.googleapis.com/...">` — use `next/font/google`
- Drizzle / Prisma / Supabase — Resend Audience is the only data store
- Hero video / Lottie — LCP killer; use static SVG
- Third-party cookie banner SDKs — site has no marketing cookies
- Two-axis variable font subsets for Quicksand/Figtree — pin weights only

**Phase 3-specific bans (re-asserted from CONTEXT.md `<specifics>`):**
- Do not paraphrase POST-02 success copy.
- Do not change the discriminated-union return shape (D-10).
- Do not stub honeypot/time-trap — they're real defenses through Phase 4+.
- Do not surface `duplicate` flag in the UI (POST-03 enumeration defense).
- Do not add observability to the silent-reject branch in Phase 3 (Phase 4 owns).

---

## Sources

### Primary (HIGH confidence — Context7 / official docs / direct codebase inspection)

- `/vercel/next.js` (Context7) — `useActionState` integration, Server Action signature, progressive enhancement, forms guide ([VERIFIED via Bash + ctx7])
- `/vitest-dev/vitest` (Context7) — happy-dom env config, plugin-react integration, setupFiles
- `/microsoft/playwright` (Context7) — `javaScriptEnabled: false` per-project + per-test, CI workflow patterns, `~/.cache/ms-playwright` cache
- `/emilkowalski/sonner` (Context7) — Toaster mount, position, prefers-reduced-motion auto-handling, `toast.error()` API
- `/websites/zod_dev_v4` (Context7) — `z.email()` v4 idiom, `z.flattenError()` replacement for `.flatten()`, `error` parameter
- [react.dev/reference/react/useActionState](https://react.dev/reference/react/useActionState) — full signature, `permalink` semantics for no-JS
- [react.dev/reference/react-dom/components/form](https://react.dev/reference/react-dom/components/form) — `action` prop semantics, auto-reset on Promise resolution
- [nextjs.org/docs/app/guides/forms](https://nextjs.org/docs/app/guides/forms) — Server Action signature with `useActionState`
- [nextjs.org/blog/next-16-2](https://nextjs.org/blog/next-16-2) — Server Function logging in dev terminal (Mar 2026)
- [zod.dev/v4/changelog](https://zod.dev/v4/changelog) — `.flatten()` deprecation, top-level `z.email()`
- [playwright.dev/docs/ci](https://playwright.dev/docs/ci) — GitHub Actions integration, browser caching
- npm registry verification (Bash `npm view ...`):
  - vitest@4.1.5 (deps: `vite ^6 || ^7 || ^8`)
  - @vitejs/plugin-react@4.3.6 (peer: `vite ^8.0.0`)
  - @testing-library/react@16.3.2 (peer: `react ^18 || ^19`)
  - happy-dom@20.9.0 (engines: `node >= 20.0.0`)
  - @testing-library/jest-dom@6.9.1
  - @testing-library/user-event@14.6.1
  - sonner@2.0.7 (already installed)
  - lucide-react@1.11.0 (1.7.0 installed; CircleCheck/Loader2/OctagonX exports verified via grep)
  - zod@4.0.0 (installed; v4 idioms documented)

### Secondary (MEDIUM confidence — third-party + cross-verified)

- [aurorascharff.no/posts/handling-form-validation-errors-and-resets-with-useactionstate/](https://aurorascharff.no/posts/handling-form-validation-errors-and-resets-with-useactionstate/) — `defaultValue` echo-back pattern (cross-verified against react.dev form auto-reset docs)
- [github.com/facebook/react/issues/31649](https://github.com/facebook/react/issues/31649) — confirmation that React closed the auto-reset behavior as "not planned"; canonical workaround is `defaultValue` echo
- [nextjs.org/docs/messages/react-hydration-error](https://nextjs.org/docs/messages/react-hydration-error) — `Date.now()` mismatch documentation

### Tertiary (informational — not load-bearing)

- [github.com/vercel/next.js/discussions/90107](https://github.com/vercel/next.js/discussions/90107) — `<Activity>` interaction (NOT used in Phase 3; informational only)
- [dev.to/ayomiku222/how-to-cache-playwright-browser-on-github-actions-51o6](https://dev.to/ayomiku222/how-to-cache-playwright-browser-on-github-actions-51o6) — community confirmation of Playwright cache pattern

### Internal (HIGH confidence — direct file reads)

- `/Users/jeff/repos/quibly-landing/CLAUDE.md` — Recommended Stack + Banned libraries
- `/Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-CONTEXT.md` — D-01..D-18, CD-01..CD-09
- `/Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-UI-SPEC.md` — UI design contract
- `/Users/jeff/repos/quibly-landing/.planning/REQUIREMENTS.md` — FORM-01..09, POST-01..04, SPAM-01..02
- `/Users/jeff/repos/quibly-landing/.planning/STATE.md` — accumulated decisions
- `/Users/jeff/repos/quibly-landing/.planning/ROADMAP.md` — Phase 3 success criteria
- `/Users/jeff/repos/quibly-landing/.planning/research/STACK.md` — global stack research
- `/Users/jeff/repos/quibly-landing/.planning/research/PITFALLS.md` — Pitfall 3 (bot poisoning) defense-in-depth
- `/Users/jeff/repos/quibly-landing/package.json` — installed versions
- `/Users/jeff/repos/quibly-landing/components/ui/button.tsx` — `size="hero"` CVA variant
- `/Users/jeff/repos/quibly-landing/components/ui/input.tsx` — Phase 1 shadcn input with `aria-invalid` chain
- `/Users/jeff/repos/quibly-landing/components/ui/sonner.tsx` — Phase 1 Toaster wrapper
- `/Users/jeff/repos/quibly-landing/components/sections/placeholder-form-section.tsx` — current state to be renamed
- `/Users/jeff/repos/quibly-landing/components/sections/hero.tsx` — current disabled-button CTA
- `/Users/jeff/repos/quibly-landing/components/sections/secondary-cta.tsx` — current disabled-button CTA
- `/Users/jeff/repos/quibly-landing/app/layout.tsx` — Toaster mount target
- `/Users/jeff/repos/quibly-landing/app/page.tsx` — section order
- `/Users/jeff/repos/quibly-landing/app/globals.css` — `scroll-behavior: smooth` + `prefers-reduced-motion` override
- `/Users/jeff/repos/quibly-landing/playwright.config.ts` — current Playwright config (Phase 2)
- `/Users/jeff/repos/quibly-landing/.github/workflows/lighthouse.yml` — existing CI workflow shape

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every package version verified against npm registry; peer-dep compatibility checked (Vitest 4 ↔ Vite 8 ↔ @vitejs/plugin-react 4.3 chain valid).
- Architecture: HIGH — `useActionState` semantics, Server Action signature, no-JS progressive-enhancement behavior, and form auto-reset all verified against react.dev + nextjs.org docs.
- Pitfalls: HIGH — every pitfall has a primary source citation; the React 19 form-clearing issue (#31649) and the Zod 4 `.flatten()` deprecation are both confirmed against authoritative sources.
- Stub-branch shape (D-11): HIGH — pure in-repo logic; no external dependency.
- Test toolchain: HIGH — Vitest 4 + RTL 16 + happy-dom 20 + @vitejs/plugin-react 4.3 chain verified against package.json peer deps.
- CI workflow: HIGH — Playwright cache pattern + GitHub Actions matrix patterns cross-verified across docs + community sources.

**Research date:** 2026-04-27
**Valid until:** 2026-05-27 (30 days for stable libraries; reduce to 14 days if Vitest 4.x or Next 16.3 ships in interim)

---

*Phase: 03-email-capture-form-stub-action*
*Research completed: 2026-04-27*
