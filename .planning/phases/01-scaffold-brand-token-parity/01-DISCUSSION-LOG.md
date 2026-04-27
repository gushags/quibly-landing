# Phase 1: Scaffold + Brand Token Parity - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-27
**Phase:** 1-Scaffold + Brand Token Parity
**Areas discussed:** Mascot port, Token parity strategy, Env schema scope and boot behavior, Phase 1 surface scope (smoke-test page + toolchain extras)

---

## Mascot Port

| Option | Description | Selected |
|--------|-------------|----------|
| Port QuibsIcon + QuibsAvatar + drop SVG in public/ | Copy both components verbatim from `marketing-app/components/quibs/`. Also copy the raw SVG to `public/quibs-icon.svg` so OG image generation (Phase 5) and any future static use can hit a static URL. Phase 2 imports `<QuibsAvatar size='fab' />` directly — no rebuild needed. | ✓ |
| Port QuibsIcon only; let Phase 2 build its own container | Just QuibsIcon (the inline SVG). Phase 2 builds a hero-specific gradient container fresh, sized for the 320×568 above-the-fold layout. Avoids carrying the chat-surface size variants we may not need on a landing page. | |
| Static SVG in public/ + thin React wrapper | Drop the SVG file at `public/quibs-icon.svg`, render via `<Image src='/quibs-icon.svg' />`. Smaller component surface but loses `fill='currentColor'` inheritance — gradient/teal recoloring becomes harder. Goes against the design spec's currentColor pattern. | |

**User's choice:** Port QuibsIcon + QuibsAvatar + drop SVG in public/ (Recommended)
**Notes:** Both the React components and the raw SVG ship in Phase 1. `QuibsAvatar` brings its `'message' | 'header' | 'fab'` size variants forward unchanged so Phase 2 can use `<QuibsAvatar size='fab' />` without re-implementing the gradient container.

---

## Token Parity Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Verbatim copy minus typography plugin | Copy the entire file 1:1 — `@theme inline` block, `:root` oklch tokens, `.dark` variant, sidebar/chart tokens, radius scale — but drop the `@plugin '@tailwindcss/typography'` line (CLAUDE.md What-NOT-to-Use). Keep the `.dark` block even though no dark mode ships (parity > minimalism). Future syncs from marketing-app become a diff, not a reconciliation. | ✓ |
| Trimmed copy — drop unused tokens | Keep only what the landing page demonstrably uses: primary, foreground/background, border, radius scale, font vars. Drop sidebar-*, chart-*, `.dark` variant, typography plugin. Smaller `globals.css`, but every token addition becomes a manual port from marketing-app. | |
| Verbatim copy including typography plugin | Pure 1:1 copy with no edits. Adds `@tailwindcss/typography` as a dep even though privacy/terms pages (Phase 5) are short enough to hand-style. Matches marketing-app exactly but ships ~5KB unused CSS. | |

**User's choice:** Verbatim copy minus typography plugin (Recommended)
**Notes:** Exactly one allowed deviation: drop the `@plugin "@tailwindcss/typography"` line. Everything else copied byte-for-byte, including the dormant `.dark` block.

---

## Env Schema Scope and Boot Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Eager schema, all future vars, hard-crash at boot | Phase 1 enumerates `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`, `RESEND_AUDIENCE_PREVIEW_ID`, `RESEND_WEBHOOK_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` now — even though Phase 1 doesn't use them. Hard-crashes at module-load if missing (matches `marketing-app/lib/email/client.ts` pattern). Locks success criterion #4 from day one. Ship `.env.example` with placeholder values so dev bootstrap is one `cp` away. | ✓ |
| Grow-as-you-go: only validate what's used in Phase 1 | Phase 1 schema is empty (no env vars touched yet). Each later phase adds its vars to the schema. Lower friction in dev, but defers the success-criterion-#4 promise to Phase 4 — and risks the 'never on first signup' guarantee being skipped under deadline pressure. | |
| Eager schema, but lenient in dev (NODE_ENV-aware) | Same eager enumeration, but dev/preview lets vars be undefined (warns instead of throws) and only production hard-crashes. Easier first-run, but introduces a 'works on my machine' class of bug where preview deploys silently miss vars. | |

**User's choice:** Eager schema, all future vars, hard-crash at boot (Recommended)
**Notes:** Six vars enumerated now (Resend key, two audience IDs, webhook secret, Upstash URL + token). Hard-crash at boot in every environment — no NODE_ENV leniency. `.env.example` is the documented bootstrap path.

---

## Phase 1 Surface Scope (smoke-test page + toolchain extras)

Multi-select: four candidate inclusions in Phase 1's PR.

| Option | Description | Selected |
|--------|-------------|----------|
| Smoke-test page renders QuibsIcon + Quicksand wordmark + Figtree paragraph + a primary pill button | Single route at `app/page.tsx` with: an inline `<QuibsIcon>` in teal, an h1 in Quicksand Bold reading 'Quibly', a Figtree paragraph of lorem, and one shadcn `<Button>` with the pill `rounded-full` variant. Proves all four token surfaces (color, font A, font B, radius) in one screenshot. Phase 2 replaces this entirely. | ✓ |
| Install + configure vitest + happy-dom + testing-library in Phase 1 | Mirror marketing-app's test setup now (vitest config, happy-dom, render helper) even though no tests exist yet. Phase 3/4 'just write tests' instead of also bootstrapping the runner. Adds ~5 min and ~10 deps to Phase 1 PR. | |
| Link Vercel project + wire preview deploys in Phase 1 | `vercel link` to the Quibly team in Phase 1, so every PR from this point forward gets a preview URL. Lighthouse-on-PR (Phase 2) and preview-audience routing (Phase 4) need this anyway. Project-level domain binding stays a Phase 6 step. | ✓ |
| Custom `.gitleaks.toml` with `re_*` and Upstash patterns | Add a project-local `.gitleaks.toml` extending the default ruleset with explicit rules for Resend (`re_[A-Za-z0-9]{20,}`) and Upstash patterns. Default rules alone won't catch Resend keys reliably. Husky pre-commit runs gitleaks on staged files. | ✓ |

**User's choice:** Smoke-test page (recommended) + Vercel link in Phase 1 (recommended) + custom `.gitleaks.toml` (recommended). Vitest install **deferred** to Phase 3 (first phase with behavior worth testing).
**Notes:** Phase 1 PR stays small — no test runner. Lighthouse CI gate is Phase 2's deal; Vercel project link here unblocks it.

---

## Claude's Discretion

- **Package manager:** npm (matches `marketing-app/package-lock.json`).
- **TypeScript config:** start from `marketing-app/tsconfig.json` verbatim, including `strict: true` and `@/*` alias.
- **ESLint:** `eslint-config-next@16.2.1` baseline + a rule banning raw `process.env.X` reads outside `lib/env.ts`.
- **`next.config.ts`:** start minimal — no `turbopack.root` workaround (this repo isn't in a monorepo path like `marketing-app` is).
- **`lib/resend.ts` location:** Phase 4, not Phase 1. Phase 1 establishes the `import 'server-only'` convention; the file is created in Phase 4 when Resend is actually wired.
- **`app/layout.tsx`:** ported near-verbatim from `marketing-app/app/layout.tsx` (Quicksand + Figtree, `metadataBase`, `<html lang="en" className={…}>` shape). Phase 5 finalizes title/description/OG metadata.
- **`lib/utils.ts`:** copy `marketing-app/lib/utils.ts` verbatim (`cn()` with `clsx` + `tailwind-merge`).
- **shadcn install path:** `npx shadcn@4.1.1 init`, then `npx shadcn add button input label sonner form`, then overwrite each generated file with `marketing-app/components/ui/<name>.tsx` for visual-signature parity (per CLAUDE.md).

## Deferred Ideas

- **Lighthouse CI on PR** — Phase 2 success criterion. Phase 1 enables it via Vercel project link; Phase 2 wires the workflow.
- **`lib/resend.ts` singleton** — Phase 4 (`import 'server-only'` convention is established in Phase 1's CONTEXT but the file doesn't yet exist).
- **Privacy/terms pages, OG image, analytics, sitemap** — Phase 5.
- **Apex domain binding + DNS records + cutover runbook** — Phase 6.
- **Rate-limit + disposable-domain blocklist + welcome email template** — Phase 4 (env vars are enumerated in Phase 1 so Phase 4 doesn't retro-fit).
- **Dark mode** — out of v1 scope; the dormant `.dark` block in `globals.css` is parity, not preparation.
- **Vitest + happy-dom + testing-library install** — Phase 3 (first phase with behavior worth testing — the Server Action stub).
