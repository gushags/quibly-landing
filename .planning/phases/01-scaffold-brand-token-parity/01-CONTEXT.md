# Phase 1: Scaffold + Brand Token Parity - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning

<domain>
## Phase Boundary

A running Next.js 16.2 + Tailwind v4 app whose **design tokens, fonts, mascot, and secret-handling posture match `marketing-app` exactly**, so brand-contract drift is impossible from day one. Phase 1 ships a smoke-test page that visibly proves token parity (color, two fonts, radius scale) and the env-validation guardrail. Phase 2 replaces the page; Phase 3 adds the form; Phase 4 wires Resend.

**In scope:**
- `create-next-app` style scaffold pinned to `marketing-app`'s versions exactly
- `app/globals.css` ported verbatim from `marketing-app/app/globals.css` (minus the typography plugin)
- `next/font/google` Quicksand + Figtree wired in `app/layout.tsx`
- `<QuibsIcon>` + `<QuibsAvatar>` components ported from `marketing-app/components/quibs/` + raw SVG dropped in `public/`
- shadcn CLI v4 init + button, input, label, sonner, form components styled to Quibly tokens
- `lib/env.ts` Zod schema enumerating ALL future env vars with hard-crash-at-boot
- `import 'server-only'` convention established (file lands in Phase 4 when Resend is wired)
- husky + `.gitleaks.toml` (custom Resend/Upstash patterns) pre-commit hook
- Vercel project linked to the Quibly team so PR previews exist from day one
- Smoke-test page at `app/page.tsx` that visibly demonstrates token parity

**Out of scope:**
- Hero copy, mascot-as-focal-point layout, "Why Quibly" block, footer (→ Phase 2)
- The form, Server Action, honeypot, time-trap (→ Phase 3)
- Real Resend client (`lib/resend.ts`), Upstash client, audience writes, welcome email (→ Phase 4)
- Privacy/terms pages, OG image, sitemap, analytics (→ Phase 5)
- Apex domain binding, full DNS, cutover runbook (→ Phase 6)
- Lighthouse CI gate (→ Phase 2 success criterion); test runner setup (→ Phase 3 when first tests are written)

</domain>

<decisions>
## Implementation Decisions

### Mascot Port
- **D-01:** Port `QuibsIcon` and `QuibsAvatar` verbatim from `marketing-app/components/quibs/quibs-icon.tsx` and `marketing-app/components/quibs/quibs-avatar.tsx` into `components/quibs/` of this repo. `QuibsIcon` keeps `fill="currentColor"`, viewBox `0 0 223 263`, and the three SVG groups exactly. `QuibsAvatar` keeps the `'message' | 'header' | 'fab'` size variants and the teal-gradient default container (`bg-gradient-to-br from-primary to-[#14b8a6] text-white`).
- **D-02:** Also drop the raw SVG at `public/quibs-icon.svg` (copied from `/Users/jeff/Desktop/quibs-icons.svg`) so Phase 5's `app/opengraph-image.tsx` and any future static reference can hit a stable URL without re-rendering the React component.
- **D-03:** Phase 1 success criterion #2 ("rendered as a reusable React component sourced from `public/`") is satisfied by the React component itself; the `public/` SVG is a parallel deliverable, not the component's source. Render path on the smoke-test page is `<QuibsIcon className="text-primary size-12" />` — uses `currentColor` so the teal token drives the color.

### Token Parity Strategy
- **D-04:** Copy `marketing-app/app/globals.css` **verbatim** into `app/globals.css` of this repo, with **one** edit: drop the `@plugin "@tailwindcss/typography";` line (CLAUDE.md What-NOT-to-Use bans this plugin; privacy/terms in Phase 5 are short enough to hand-style). Keep everything else byte-for-byte: `@theme inline { … }`, every `--color-*` mapping, the radius scale (`--radius-sm` … `--radius-4xl`), the `@import "tailwindcss"`, `@import "tw-animate-css"`, `@import "shadcn/tailwind.css"`, `@custom-variant dark (&:is(.dark *))`, the `:root` oklch token block, the full `.dark` block, the sidebar tokens, the chart tokens.
- **D-05:** Keep the `.dark` variant block even though no dark mode ships in v1. Rationale: parity > minimalism; the bytes are negligible; future syncs from `marketing-app` become a clean diff rather than a reconciliation. The design spec §2 ("white-dominant, no dark backgrounds") is enforced at the page-composition level, not by stripping tokens.
- **D-06:** `next-themes` is NOT installed (CLAUDE.md What-NOT-to-Use). The `.dark` selector is dormant — no `<html class="dark">` toggling exists.

### Env Schema Scope and Boot Behavior
- **D-07:** `lib/env.ts` is **eager**: in Phase 1 it enumerates every env var any future phase will touch, even though Phase 1 doesn't use them.
  - `RESEND_API_KEY` — Resend transactional + audience client (Phase 4)
  - `RESEND_AUDIENCE_ID` — production audience (Phase 4)
  - `RESEND_AUDIENCE_PREVIEW_ID` — preview/PR audience (Phase 4)
  - `RESEND_WEBHOOK_SECRET` — bounce/complaint webhook signature (Phase 4)
  - `UPSTASH_REDIS_REST_URL` — sliding-window rate limit (Phase 4)
  - `UPSTASH_REDIS_REST_TOKEN` — Upstash REST API token (Phase 4)
- **D-08:** Schema validates with Zod (`z.object({…}).parse(process.env)`) at module load. Hard-crashes with a descriptive Zod error if any var is missing — in dev, preview, or production, identically. Mirrors `marketing-app/lib/email/client.ts`'s `if (!process.env.RESEND_API_KEY) throw …` pattern but applies it to all six vars at once.
- **D-09:** Ship `.env.example` enumerating all six vars with placeholder/example values + a one-line comment for each. First-time `npm run dev` flow: `cp .env.example .env.local`, fill in real values from Resend + Upstash + Vercel dashboards, then run. README's "Local development" section documents this.
- **D-10:** No NODE_ENV-aware leniency. The "works on my machine, breaks in preview" failure mode is exactly what success criterion #4 forbids.
- **D-11:** Every other module that needs env values imports from `lib/env.ts` (typed) — **no raw `process.env.X` reads** in any other file. Enforced by ESLint rule (or simple grep gate) where feasible.

### Smoke-Test Page Scope
- **D-12:** `app/page.tsx` renders a single throwaway smoke-test screen that visibly demonstrates all four parity surfaces in one screenshot:
  - `<QuibsIcon className="text-primary size-12" />` — proves teal oklch primary token + `currentColor` mascot wiring
  - `<h1 className="font-heading text-4xl font-bold">Quibly</h1>` — proves Quicksand variable font + `--font-heading` mapping
  - `<p className="font-sans text-base">Lorem ipsum…</p>` — proves Figtree variable font + `--font-sans` mapping
  - `<Button>Smoke test</Button>` — proves shadcn Button is wired, pill-radii base styling lands, primary token drives the fill
- **D-13:** This page is intentionally throwaway; Phase 2 replaces `app/page.tsx` entirely with `<Hero> + <WhyQuibly> + <Footer>`. No effort is spent on layout polish, copy, accessibility-beyond-defaults, or responsiveness in Phase 1's smoke test.

### Toolchain and Repo Setup
- **D-14:** Pre-commit hook stack: husky (matches `marketing-app/.husky/`) + a project-local `.gitleaks.toml` extending the default ruleset with explicit Resend (`re_[A-Za-z0-9]{20,}`) and Upstash (`AYxA[A-Za-z0-9_-]{30,}` / Upstash REST URL host pattern) rules. The `.husky/pre-commit` runs `gitleaks protect --staged --redact -c .gitleaks.toml` before any other check. Default rules alone don't reliably catch Resend keys — the custom rules are non-optional for INFRA-08 success criterion #5.
- **D-15:** Link the Vercel project to the Quibly team in Phase 1 (`vercel link`). Every PR from this point gets a preview URL. Project-level domain binding stays a Phase 6 step. Vercel team-level apex binding (Phase 6) requires the project already be linked — doing it now removes a launch-day blocker.
- **D-16:** No test runner configured in Phase 1. Vitest + happy-dom + `@testing-library/react` install lands in **Phase 3** (first phase that ships behavior worth testing — the Server Action stub). This keeps the Phase 1 PR small and avoids carrying unused test infra through Phase 2.

### Claude's Discretion
- **CD-01:** Package manager — use **npm** (matches `marketing-app/package-lock.json`; no `packageManager` field set there). pnpm/bun would be marginally faster but introduce a divergence with `marketing-app`'s contributor flow.
- **CD-02:** TypeScript config — start from `marketing-app/tsconfig.json` verbatim, including `strict: true` and the `@/*` path alias.
- **CD-03:** ESLint config — `eslint-config-next@16.2.1` baseline (matches `marketing-app`); add a custom rule (or simple grep-based pre-commit) banning `process.env.` outside `lib/env.ts` to enforce D-11.
- **CD-04:** `next.config.ts` — start minimal (`{}`-equivalent). The `turbopack.root` workaround in `marketing-app/next.config.ts` exists because that repo is in a monorepo path; this repo is a single-package directory and doesn't need it.
- **CD-05:** Where `lib/resend.ts` lands — **Phase 4**, not Phase 1. INFRA-07 says "`import 'server-only'` guard on `lib/resend.ts` and any module touching `RESEND_API_KEY`". Since Phase 1 doesn't touch the key, the file doesn't exist yet. Phase 1 establishes the **convention** (documented in CONTEXT) and validates the key in `lib/env.ts`; Phase 4 creates the file with the `import 'server-only'` line as its first statement.
- **CD-06:** `app/layout.tsx` is ported from `marketing-app/app/layout.tsx` near-verbatim — same `Quicksand` + `Figtree` configs, same `<html lang="en" className={…}>` shape, same `metadataBase: new URL("https://useQuibly.com")`. Phase 1 metadata title can be a placeholder; Phase 5 finalizes title/description/OG.
- **CD-07:** `lib/utils.ts` — copy `marketing-app/lib/utils.ts` verbatim (`cn()` with `clsx` + `tailwind-merge`).
- **CD-08:** shadcn install path — run `npx shadcn@4.1.1 init` against the ported `globals.css` so the v4 token plumbing lands clean, then run `npx shadcn add button input label sonner form` for the five components. Compare each generated file against `marketing-app/components/ui/<name>.tsx`; for any divergence, prefer the `marketing-app` copy verbatim so visual signature matches (per CLAUDE.md: "port the exact button.tsx, input.tsx, sonner.tsx from marketing-app so the visual signature matches"). This is hybrid CLI-then-overwrite, not pure regen.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project planning
- `CLAUDE.md` — full Recommended Stack table, version pins, "Specific Architectural Decisions", "What NOT to Use" list. Single most authoritative ref for this phase.
- `.planning/PROJECT.md` — core value, tagline, audience, brand asset locations, key decisions table.
- `.planning/REQUIREMENTS.md` §Infrastructure & Brand Tokens — INFRA-01 through INFRA-08 verbatim.
- `.planning/ROADMAP.md` §"Phase 1: Scaffold + Brand Token Parity" — five success criteria.
- `.planning/research/SUMMARY.md` — recommended stack, Phase 1 rationale ("Avoids: API key exposure, font-swap layout shift").
- `.planning/research/STACK.md` — full version pins and "Installation" notes (referenced via CLAUDE.md inclusion).
- `.planning/STATE.md` — accumulated decisions ("No CAPTCHA in v1", "Resend Audiences as source of truth").

### Brand reference (in `marketing-app`, must read)
- `/Users/jeff/repos/marketing-app/package.json` — version pins to mirror exactly (Next 16.2.1, React 19.2.4, Tailwind v4, shadcn ^4.1.1, husky ^9.1.7, lucide-react ^1.7, resend ^6.12, etc.).
- `/Users/jeff/repos/marketing-app/app/globals.css` — token block to copy verbatim (minus typography plugin, per D-04).
- `/Users/jeff/repos/marketing-app/app/layout.tsx` — `next/font/google` config + html-class wiring to mirror.
- `/Users/jeff/repos/marketing-app/components/quibs/quibs-icon.tsx` — port verbatim into `components/quibs/quibs-icon.tsx`.
- `/Users/jeff/repos/marketing-app/components/quibs/quibs-avatar.tsx` — port verbatim into `components/quibs/quibs-avatar.tsx`.
- `/Users/jeff/repos/marketing-app/components/ui/{button,input,label,sonner,form}.tsx` — visual-signature reference for shadcn components (see CD-08 for hybrid install path).
- `/Users/jeff/repos/marketing-app/lib/utils.ts` — `cn()` helper, copy verbatim.
- `/Users/jeff/repos/marketing-app/lib/email/client.ts` — `import 'server-only'` + throw-on-missing-key pattern; reference for D-08 and Phase 4's `lib/resend.ts`.
- `/Users/jeff/repos/marketing-app/components.json` — shadcn CLI config shape; mirror with `style: "radix-nova"`, `rsc: true`, `tsx: true`, `tailwind.css: "app/globals.css"`, `iconLibrary: "lucide"`, aliases unchanged.
- `/Users/jeff/repos/marketing-app/.husky/pre-commit` — hook reference.
- `/Users/jeff/repos/marketing-app/tsconfig.json` — TS config baseline.

### Brand assets (outside repo, copy in)
- `/Users/jeff/Desktop/quibs-icons.svg` — raw mascot SVG (4422 bytes, viewBox `0 0 223 263`). Copy to `public/quibs-icon.svg` and reference in `components/quibs/quibs-icon.tsx` (port from marketing-app).
- `/Users/jeff/repos/marketing-app/docs/superpowers/specs/2026-04-14-quibly-design-system.md` — full design contract (referenced from PROJECT.md). Phase 1 needs §1 (icons), §2 (radii), §3 (color tokens) for confirmation that the ported tokens match the spec.

### External docs
- [Next.js fonts API](https://nextjs.org/docs/app/api-reference/components/font) — variable font config, preload, subsets.
- [shadcn/ui Tailwind v4 guide](https://ui.shadcn.com/docs/tailwind-v4) — CSS-first tokens, oklch, `@theme inline`.
- [Tailwind CSS v4 docs](https://tailwindcss.com/docs) — `@theme inline`, `@plugin`, `@custom-variant`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `marketing-app/components/quibs/quibs-icon.tsx`: 45-line inline-SVG component with `fill="currentColor"` and viewBox `0 0 223 263`. **Port verbatim** to this repo (D-01). The `currentColor` pattern is what lets the teal-gradient container in `QuibsAvatar` recolor the icon white via `text-white` — non-negotiable for Phase 2's hero composition.
- `marketing-app/components/quibs/quibs-avatar.tsx`: 41-line wrapper with `SIZE_CONFIG` for `'message' | 'header' | 'fab'`. Phase 2 hero uses `<QuibsAvatar size="fab" />` (h-14 w-14, 28×33 icon). Port verbatim (D-01) so Phase 2 has a 1-line composition.
- `marketing-app/app/globals.css`: 100+ lines of Quibly token definitions. Copy verbatim minus the typography plugin (D-04). The `@theme inline { … }` block must land first for all `--color-*` and `--radius-*` mappings to be available to `@apply`/utility classes.
- `marketing-app/app/layout.tsx`: `next/font/google` config for Quicksand + Figtree with `weight: ['400','500','600','700']`, `display: 'swap'`, `subsets: ['latin']`, variable axis, CSS vars `--font-quicksand` / `--font-figtree`. Mirror exactly (CD-06).
- `marketing-app/lib/utils.ts`: `cn()` helper — copy verbatim (CD-07).
- `marketing-app/lib/email/client.ts`: `import 'server-only'` + throw-on-missing-key pattern — reference for `lib/env.ts` (D-08) and Phase 4's `lib/resend.ts` (CD-05).
- `marketing-app/components/ui/{button,input,label,sonner,form}.tsx`: shadcn components already styled to Quibly tokens; visual-signature ground-truth. CD-08 hybrid install path uses these as overwrite targets.

### Established Patterns
- **`fill="currentColor"` on SVGs** — color is driven by Tailwind text utility on the parent (`text-primary`, `text-white`). Phase 2 will leverage this in the hero.
- **Variable Google fonts as CSS variables, then mapped via `@theme inline`** — `--font-quicksand` and `--font-figtree` are set on `<html>`, then mapped to `--font-heading` / `--font-sans` in globals.css. Tailwind utilities `font-heading` / `font-sans` resolve through this two-hop indirection.
- **Singleton clients with import-time validation** — `lib/email/client.ts` throws at module load if its env var is missing. Phase 1 generalizes this pattern to `lib/env.ts` for all six vars (D-07, D-08).
- **`@/`-aliased imports + components.json aliases** — `@/components`, `@/lib`, `@/components/ui`, `@/hooks`. Mirror.
- **husky `prepare` script** — `package.json` has `"prepare": "husky"` so `npm install` auto-installs the hook. Mirror.

### Integration Points
- `app/layout.tsx` → `app/globals.css` (CSS-vars cascade) → `components/ui/*` (utility classes) — each layer must use the same token names.
- `lib/env.ts` → (Phase 4) `lib/resend.ts` → Server Actions → `<WaitlistForm>` (Phase 3) — env validation at the bottom of this stack hard-crashes the dev server if config is missing.
- `public/quibs-icon.svg` → (Phase 5) `app/opengraph-image.tsx` (`<img src="/quibs-icon.svg">` inside `ImageResponse`) — static asset path is locked here so Phase 5 plans against a stable URL.

</code_context>

<specifics>
## Specific Ideas

- **"Verbatim" means byte-for-byte except the typography plugin.** D-04 calls out exactly one allowed deviation. Anything else (sidebar tokens, chart tokens, `.dark` block, `@import` order, comments) is copied 1:1.
- **The `.dark` block stays even though no dark mode ships.** This is a deliberate parity-over-minimalism call (D-05). Trade-off accepted.
- **The smoke-test page must show all four parity surfaces in a single screenshot** (D-12) so success criterion #1 ("visually indistinguishable from `marketing-app`'s tokens") is verifiable by eye before any planner gets near Phase 2.
- **`lib/resend.ts` deliberately does NOT exist in Phase 1** (CD-05). The convention is established in CONTEXT; the file is created in Phase 4 with `import 'server-only'` as its first line.
- **Vercel project is linked in Phase 1** (D-15) — but apex domain binding stays Phase 6. Don't conflate "linked" with "live."
- **Test infra is deferred to Phase 3** (D-16). If a planner is tempted to add vitest in Phase 1, push back: the first thing worth testing is the Server Action's branches in Phase 3.

</specifics>

<deferred>
## Deferred Ideas

- **Lighthouse CI gate on PR** — surfaces in Phase 2 as a success criterion ("verified in CI on every PR"). Phase 1's Vercel project link enables it; Phase 2 wires it.
- **`lib/resend.ts` and Resend client singleton** — Phase 4. Convention (`import 'server-only'`) established here; file lands there.
- **Privacy/terms pages, OG image, analytics, sitemap** — Phase 5. Not Phase 1 surface.
- **Apex domain binding at Vercel team level + DNS records** — Phase 6. Linking the project (D-15) is the prerequisite; binding is separate.
- **Rate-limit + disposable-domain blocklist** — Phase 4. `UPSTASH_REDIS_*` env vars enumerated now (D-07) so Phase 4 doesn't have to retro-fit env validation.
- **Welcome email template + `List-Unsubscribe-Post` headers** — Phase 4.
- **Dark mode** — explicitly out of v1 scope (PROJECT.md, design spec §2). The dormant `.dark` block in `globals.css` is parity, not preparation.

### Reviewed Todos (not folded)

None — pending todos list in STATE.md is empty.

</deferred>

---

*Phase: 1-Scaffold + Brand Token Parity*
*Context gathered: 2026-04-27*
