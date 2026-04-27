---
phase: 01-scaffold-brand-token-parity
plan: 02
subsystem: brand-tokens

tags: [tailwind-v4, theme-tokens, oklch, next-font-google, quicksand, figtree, mascot, svg, currentColor]

# Dependency graph
requires:
  - 01-01 (Tailwind v4 PostCSS adapter, lib/utils.ts cn(), components.json)
provides:
  - "app/globals.css: full Quibly @theme inline token block, oklch primary, dormant .dark block, radius scale sm-4xl, Schedule-X overrides, manual .prose styles (D-04 strict verbatim minus typography plugin)"
  - "app/layout.tsx: next/font/google Quicksand+Figtree wired with --font-quicksand / --font-figtree CSS vars on <html>; metadataBase locked to https://useQuibly.com"
  - "components/quibs/quibs-icon.tsx: inline-SVG mascot driven by currentColor (D-01)"
  - "components/quibs/quibs-avatar.tsx: sized container with three variants (message/header/fab) + teal-gradient default palette (D-01)"
  - "public/quibs-icon.svg: 4422-byte raw asset for Phase 5 OG image (D-02; renamed plural -> singular)"
affects:
  - "01-03 (shadcn Button/Input/Sonner consume the @theme inline token block via CSS vars)"
  - "01-05 (smoke-test page renders QuibsIcon className=\"text-primary size-12\" + font-heading + font-sans + Button to validate full chain end-to-end per D-12)"
  - "02-* (Phase 2 hero composes <QuibsAvatar size=\"fab\" /> as a 1-line drop-in)"
  - "05-* (Phase 5 app/opengraph-image.tsx references public/quibs-icon.svg via <img src=\"/quibs-icon.svg\"> inside ImageResponse)"

# Tech tracking
tech-stack:
  added:
    - "next/font/google (Quicksand + Figtree variable fonts; subsets: ['latin']; weight ['400','500','600','700']; display: 'swap'; per CLAUDE.md font-weight pin)"
    - "Tailwind v4 @theme inline token block (consumed by all shadcn components in Plan 01-03)"
    - "oklch wide-gamut color primitive --primary: oklch(0.6002 0.1038 184.704) — Quibly teal"
  patterns:
    - "Two-hop CSS-var indirection: next/font/google declares --font-quicksand on <html> -> globals.css @theme inline maps --font-heading: var(--font-quicksand) -> Tailwind utility font-heading resolves through both hops"
    - "fill='currentColor' SVG pattern: parent text-primary (teal) or text-white (inverted) drives icon color; non-negotiable for QuibsAvatar palette inversion"
    - "Strict verbatim port (D-04): byte-for-byte copy except a single allowed deviation (drop @plugin \"@tailwindcss/typography\")"
    - "Parity-over-minimalism (D-05): keep the dormant .dark block + Schedule-X overrides even though no consumer exists in this repo — future syncs from marketing-app stay clean diffs"

key-files:
  created:
    - "app/globals.css (319 lines; verbatim port of marketing-app/app/globals.css minus the single @plugin \"@tailwindcss/typography\" line)"
    - "app/layout.tsx (40 lines; near-verbatim from marketing-app/app/layout.tsx; drops Toaster import + <Toaster /> JSX per Phase 1 scope)"
    - "components/quibs/quibs-icon.tsx (45 lines; byte-identical to marketing-app analog)"
    - "components/quibs/quibs-avatar.tsx (41 lines; byte-identical to marketing-app analog)"
    - "public/quibs-icon.svg (4422 bytes; copied from /Users/jeff/Desktop/quibs-icons.svg with rename plural->singular per D-02)"
  modified: []

key-decisions:
  - "Strict D-04 reading: keep Schedule-X calendar overrides (dead bytes in this repo) for cleaner future syncs from marketing-app"
  - "Strict D-05: keep dormant .dark block (next-themes is banned, no toggling exists) for parity"
  - "CD-06 metadata: ship placeholder title (\"Quibly\") + description (\"Strategy-first AI marketing for solopreneurs and small teams. Coming soon.\") in Phase 1; Phase 5 finalizes"
  - "Phase 1 drops <Toaster /> mount: Plan 01-03 ports sonner.tsx itself, but Phase 3 is the first consumer; mounting now would import unused lucide-react icons into the bundle"

patterns-established:
  - "Two-hop CSS-var indirection (font tokens) — pattern reused by Phase 5 OG image"
  - "currentColor-driven SVG mascot — pattern reused by Phase 2 hero composition (<QuibsAvatar size=\"fab\" />)"
  - "@theme inline block as single source of truth for radius/font/color — Plan 01-03 button.tsx pill-radii will consume --radius-* directly"

requirements-completed:
  - INFRA-02
  - INFRA-03
  - INFRA-04

# Metrics
duration: 3min
completed: 2026-04-27
---

# Phase 1 Plan 2: Tailwind v4 Tokens + Fonts + Quibs Mascot Summary

**Brand-contract surface ported byte-identical from marketing-app — `@theme inline` tokens, oklch teal primary, Quicksand + Figtree via `next/font/google`, and the Quibs mascot in three forms (inline-SVG component, sized container, raw `public/` asset).**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-27T19:46:45Z
- **Completed:** 2026-04-27T19:49:34Z
- **Tasks:** 3
- **Files created:** 5

## Accomplishments

- `app/globals.css` is byte-for-byte verbatim from `marketing-app/app/globals.css` except the single `@plugin "@tailwindcss/typography";` deletion (D-04). `diff` confirms exactly **1 deletion, 0 additions** (319 vs 320 lines). The strict D-04 reading is preserved: `.dark` block, Schedule-X overrides, manual `.prose` styles, sidebar tokens, chart tokens, full `--radius-*` scale (sm through 4xl) all kept verbatim.
- `app/layout.tsx` loads Quicksand and Figtree via `next/font/google` with the exact CSS-var bindings (`--font-quicksand`, `--font-figtree`) that `app/globals.css`'s `@theme inline` block reads (`--font-heading: var(--font-quicksand)`, `--font-sans: var(--font-figtree)`). The two-hop indirection chain is end-to-end intact: `<html className={`${quicksand.variable} ${figtree.variable} ...`}>` -> globals.css `@theme inline` mapping -> Tailwind utility (`font-heading`, `font-sans`).
- `components/quibs/quibs-icon.tsx` and `components/quibs/quibs-avatar.tsx` are byte-identical to their marketing-app analogs (`diff` returns no output for both). `currentColor`-driven SVG pattern preserved; three `SIZE_CONFIG` variants (`message`/`header`/`fab`) preserved; teal-gradient default palette `bg-gradient-to-br from-primary to-[#14b8a6] text-white` preserved.
- `public/quibs-icon.svg` is exactly 4422 bytes, byte-identical to `/Users/jeff/Desktop/quibs-icons.svg` (`diff` returns no output). Renamed plural -> singular per D-02. Phase 5's `app/opengraph-image.tsx` will reference this via `<img src="/quibs-icon.svg">` inside `ImageResponse`.
- Project-wide `tsc --noEmit` passes (exit 0). All new TS/TSX imports resolve cleanly through Plan 01-01's `tsconfig.json` (`@/*` alias) and `lib/utils.ts` (`cn` helper).

## Required Diffs

**`app/globals.css` vs `marketing-app/app/globals.css`** — exactly one line removed:

```diff
4d3
< @plugin "@tailwindcss/typography";
```

**`components/quibs/quibs-icon.tsx` vs `marketing-app/components/quibs/quibs-icon.tsx`** — `diff` returns empty (byte-identical).

**`components/quibs/quibs-avatar.tsx` vs `marketing-app/components/quibs/quibs-avatar.tsx`** — `diff` returns empty (byte-identical).

**`public/quibs-icon.svg` vs `/Users/jeff/Desktop/quibs-icons.svg`** — `diff` returns empty (byte-identical, 4422 bytes).

## Task Commits

Each task was committed atomically (within this worktree branch; orchestrator merges to main):

1. **Task 1: Port `app/globals.css` verbatim minus typography plugin** — `ce8daf1` (feat)
2. **Task 2: Port mascot — QuibsIcon, QuibsAvatar, raw SVG** — `44da04b` (feat)
3. **Task 3: Port `app/layout.tsx` with fonts (drop Toaster)** — `a5db989` (feat)

## Files Created/Modified

- `app/globals.css` — Verbatim Tailwind v4 token block from marketing-app minus `@plugin "@tailwindcss/typography"` (D-04). Provides `@theme inline` color/font/radius mappings, `:root` oklch primary `oklch(0.6002 0.1038 184.704)`, dormant `.dark` block (D-05), `@layer base` rules, `.bg-warning` / `.bg-scarcity` utilities, Schedule-X overrides, manual `.prose` styles.
- `app/layout.tsx` — Near-verbatim from marketing-app (CD-06). `next/font/google` Quicksand+Figtree with weight pin `["400","500","600","700"]`, `display: "swap"`, `subsets: ["latin"]`, CSS vars `--font-quicksand`/`--font-figtree`. `metadataBase: new URL("https://useQuibly.com")` locked. Placeholder title/description (Phase 5 finalizes per CD-06). Drops Phase-3-pending Toaster import + `<Toaster />` JSX.
- `components/quibs/quibs-icon.tsx` — Byte-identical port of marketing-app analog. `viewBox="0 0 223 263"`, `fill="currentColor"`, `aria-hidden="true"`, three SVG `<g>` groups with full numeric coordinates.
- `components/quibs/quibs-avatar.tsx` — Byte-identical port. `SIZE_CONFIG` with three variants (`message: h-7 w-7 rounded-lg`; `header: h-9 w-9 rounded-lg`; `fab: h-14 w-14 rounded-full`); default palette `bg-gradient-to-br from-primary to-[#14b8a6] text-white`; inverted `bg-white text-primary`.
- `public/quibs-icon.svg` — 4422-byte verbatim copy from `/Users/jeff/Desktop/quibs-icons.svg`. Renamed plural -> singular per D-02. Phase 5 OG image consumer.

## Decisions Made

All key decisions followed plan frontmatter and CONTEXT.md citations exactly (D-01..D-06, CD-06). No novel decisions emerged during execution.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

All plan-level integration checks pass:

1. **`app/globals.css` byte-identity vs marketing-app** — `diff` shows exactly 1 deletion, 0 additions; line count `wc -l` returns 319 (= 320 - 1). All critical tokens present (`@theme inline`, `--color-primary: var(--primary)`, `--font-heading: var(--font-quicksand)`, `--font-sans: var(--font-figtree)`, `oklch(0.6002 0.1038 184.704)`, `--radius-4xl`, `@custom-variant dark`, Schedule-X `.sx__` selectors). `@plugin "@tailwindcss/typography"` absent.
2. **`app/layout.tsx` font wiring** — `import { Quicksand, Figtree } from "next/font/google"` present; `variable: "--font-quicksand"` and `variable: "--font-figtree"` each declared once; `subsets: ["latin"]` present; `display: "swap"` declared exactly twice; `weight: ["400", "500", "600", "700"]` declared exactly twice; `metadataBase: new URL("https://useQuibly.com")` present; `<html className=`${quicksand.variable} ${figtree.variable} ...`>` matches.
3. **`app/layout.tsx` Phase-1 absences** — Toaster import absent, `<Toaster` JSX absent, `next-themes` absent, `ThemeProvider` absent.
4. **Mascot byte-identity** — `diff components/quibs/quibs-icon.tsx /Users/jeff/repos/marketing-app/components/quibs/quibs-icon.tsx` empty. `diff components/quibs/quibs-avatar.tsx /Users/jeff/repos/marketing-app/components/quibs/quibs-avatar.tsx` empty. Critical content preserved: `viewBox="0 0 223 263"`, `fill="currentColor"`, teal gradient palette, `@/components/quibs/quibs-icon` import, `@/lib/utils` import, three SIZE_CONFIG keys.
5. **Raw SVG byte-identity** — `wc -c < public/quibs-icon.svg` returns 4422; `diff public/quibs-icon.svg /Users/jeff/Desktop/quibs-icons.svg` empty.
6. **Two-hop indirection chain intact** — layout.tsx defines `--font-quicksand`/`--font-figtree`; globals.css maps `--font-heading: var(--font-quicksand)` and `--font-sans: var(--font-figtree)`; Tailwind utilities `font-heading`/`font-sans` resolve.
7. **Mascot wiring** — avatar imports `@/components/quibs/quibs-icon` and `@/lib/utils`.
8. **TypeScript** — `node_modules/.bin/tsc --noEmit` exits 0 across the project.

The smoke-test page in Plan 01-05 will visually validate the full token chain end-to-end per D-12 (renders `<QuibsIcon className="text-primary size-12" />`, `<h1 className="font-heading text-4xl font-bold">Quibly</h1>`, `<p className="font-sans">`, `<Button>` in one screenshot — proves teal oklch primary, Quicksand variable font, Figtree variable font, and shadcn pill button all resolve through the chain ported here).

## Issues Encountered

None.

## User Setup Required

None for Plan 01-02. The placeholder metadata title/description ship as-is; Phase 5 finalizes them along with OG image, sitemap, and robots.txt per CD-06.

## Threat Surface

No new threat surface introduced. All three deliverables are pure styling/component ports with no network I/O, no auth path, no file system access at trust boundaries. The threat model for Plan 02 only carried `mitigate` dispositions for Plan 01-01 (env validation) and Plan 04 (Resend, Upstash); Plan 02 has no threat-flag-relevant surface area.

## Next Phase Readiness

Plan 01-03 (shadcn components: button, input, label, sonner) is unblocked:

- `app/globals.css` provides the full `@theme inline` token block; Plan 03's `button.tsx` reads `bg-primary` (the oklch teal), `--radius-md` (pill button base), and the focus-ring tokens.
- `components.json` from Plan 01-01 declares `style: "radix-nova"` so `npx shadcn add button` will produce `import { Slot } from "radix-ui"` barrel imports matching marketing-app's analog.
- `lib/utils.ts` `cn()` is already in place for class-variance-authority composition.

Plan 01-04 (husky + gitleaks) is unblocked:

- `package.json` already includes `"prepare": "husky"`; Plan 04 lays down `.husky/pre-commit` and `.gitleaks.toml`.

Plan 01-05 (smoke-test page) is unblocked at the brand-contract layer:

- All four parity surfaces of the smoke test (teal oklch token, Quicksand heading, Figtree body, mascot via currentColor) now exist.
- One blocker remains: `<Button>` from `components/ui/button.tsx` lands in Plan 01-03.

Phase 2 (hero composition) is unblocked:

- `<QuibsAvatar size="fab" />` is a 1-line drop-in; teal-gradient default palette already wired.
- `font-heading` Tailwind utility resolves via the @theme inline mapping ported here.

Phase 5 (OG image) has its prerequisite asset:

- `public/quibs-icon.svg` exists at the stable path expected by `app/opengraph-image.tsx`.

## Self-Check: PASSED

All claimed files exist and all task commits are present in `git log`:

- `app/globals.css` — present (319 lines)
- `app/layout.tsx` — present (40 lines)
- `components/quibs/quibs-icon.tsx` — present (byte-identical, 45 lines, 4698 bytes)
- `components/quibs/quibs-avatar.tsx` — present (byte-identical, 41 lines, 1335 bytes)
- `public/quibs-icon.svg` — present (4422 bytes)
- Commits `ce8daf1`, `44da04b`, `a5db989` — present in `git log`

---
*Phase: 01-scaffold-brand-token-parity*
*Completed: 2026-04-27*
