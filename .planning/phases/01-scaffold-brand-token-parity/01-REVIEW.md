---
phase: 01-scaffold-brand-token-parity
reviewed: 2026-04-27T20:47:52Z
depth: standard
files_reviewed: 25
files_reviewed_list:
  - .env.example
  - .gitignore
  - .gitleaks.toml
  - .husky/pre-commit
  - app/globals.css
  - app/layout.tsx
  - app/page.tsx
  - components.json
  - components/quibs/quibs-avatar.tsx
  - components/quibs/quibs-icon.tsx
  - components/ui/button.tsx
  - components/ui/input.tsx
  - components/ui/label.tsx
  - components/ui/sonner.tsx
  - eslint-rules/index.js
  - eslint-rules/no-raw-process-env.js
  - eslint-rules/no-raw-process-env.test.js
  - eslint.config.mjs
  - lib/env.ts
  - lib/utils.ts
  - next.config.ts
  - package.json
  - postcss.config.mjs
  - public/quibs-icon.svg
  - tsconfig.json
findings:
  blocker: 1
  warning: 6
  info: 5
  total: 12
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-04-27T20:47:52Z
**Depth:** standard
**Files Reviewed:** 25
**Status:** issues_found

## Summary

Phase 1 ships a clean Next.js 16.2 + Tailwind v4 scaffold with brand-token parity to `marketing-app`. The verbatim ports (`globals.css`, `tsconfig.json`, shadcn components, `lib/utils.ts`, Quibs SVG) are by-design per CONTEXT D-04/CD-02/CD-07/D-01 and are not flagged unless they introduce a problem in *this* repo's context.

Most findings concern **toolchain hardening gaps** that undercut the stated guardrails (D-08, D-10, D-11, D-14, INFRA-08), not the brand-parity surface. The single BLOCKER is a real defense-in-depth gap in the pre-commit hook: secret-leak protection silently no-ops if `gitleaks` is not on the developer's PATH, contradicting D-14's stated invariant. The remaining items are quality concerns: the custom ESLint rule has a test file that nothing automatically runs, the `form` shadcn component listed in CONTEXT D-01/CD-08 was never added, and the smoke-test page never hits `lib/env.ts` so the Phase 1 success criterion #4 ("hard-crash on missing env") is not actually exercised by anything that ships.

Brand-parity surface (color tokens, fonts, mascot, radii) appears correct and matches the verbatim-port mandate. Phase 1's narrow scope (D-13: throwaway smoke test, no real UI/copy/forms) keeps the blast radius small.

## Blockers

### BL-01: Pre-commit hook silently bypasses gitleaks if binary is missing

**File:** `.husky/pre-commit:1-15`
**Severity:** BLOCKER
**Issue:**

The hook has no `set -e` and no PATH-availability check for `gitleaks`. Under husky v9's hook contract, the script's exit code is the exit code of the **last** command that runs; intermediate failures in `gitleaks protect ...` do not abort the script. Specifically:

1. If `gitleaks` is not installed on the contributor's machine (it is not in `package.json` and not bootstrapped by `npm install`), `sh` prints `gitleaks: command not found` and **continues** to `npm run check` / `npm run lint`. The commit proceeds as long as the type-check and lint pass.
2. This contradicts D-14 ("`gitleaks` runs FIRST so a secret leak blocks the commit even if subsequent checks would have errored out") and INFRA-08's success criterion ("Pre-commit hook stack: ... gitleaks in `.husky/pre-commit`").
3. The same failure-mode applies if `gitleaks` exits with a non-zero code unrelated to a leak (config error, broken regex) — the type-check/lint step's success can mask the failure.

A developer who cloned the repo on a fresh machine with no `gitleaks` installed and committed `RESEND_API_KEY=re_realsecret123...` to `.env.local` (gitignored) is safe — but anyone editing a tracked file containing a secret would not be blocked. Defense-in-depth is the entire point of this hook.

**Fix:**

Add `set -e` and a binary-availability check at the top of the hook:

```sh
#!/usr/bin/env sh
set -e

# Fail loudly if gitleaks is missing — the hook's first job is leak protection.
# Suggest the install path so contributors aren't dead in the water.
if ! command -v gitleaks >/dev/null 2>&1; then
  echo "ERROR: gitleaks not found on PATH." >&2
  echo "Install: brew install gitleaks (macOS) or see https://github.com/gitleaks/gitleaks#installing" >&2
  exit 1
fi

# 1. Block secret commits.
gitleaks protect --staged --redact -c .gitleaks.toml

# 2. Type-check.
npm run check

# 3. Lint.
npm run lint
```

If macOS-only contributors are assumed, an alternative is a `package.json` `prepare` step that runs `command -v gitleaks || brew install gitleaks` — but the explicit guard above is more portable and surfaces the failure faster.

## Warnings

### WR-01: Custom ESLint rule has a test file but no automated runner

**File:** `eslint-rules/no-raw-process-env.test.js:1-48`, `package.json:5-12`, `.husky/pre-commit:9-15`
**Severity:** WARNING
**Issue:**

The `RuleTester` suite exists and exits with a `console.log("PASS: …")` line, but nothing in `package.json` `scripts`, the pre-commit hook, or any CI workflow invokes `node eslint-rules/no-raw-process-env.test.js`. The plan-summary file (`01-04-SUMMARY.md`) documents the run command (`node eslint-rules/no-raw-process-env.test.js`) as a verification step but that command never executes in any automated path.

Consequence: a regression that breaks the rule's allowlist (e.g., a refactor that drops the `eslint-rules/` fragment, or breaks the `Identifier`/`Literal` discrimination) would silently ship. The whole point of D-11 (raw `process.env` reads gated by `lib/env.ts`) is invariant enforcement, and that invariant is now itself untested.

This is more glaring because Phase 1 explicitly defers a test runner to Phase 3 (D-16) — but the rule test was already written using `eslint`'s built-in `RuleTester`, which has no Vitest dependency and runs as a plain Node script. There is no infra cost to wiring it up.

**Fix:**

Add a `test:eslint-rules` script and invoke it from the pre-commit hook (or a future CI step):

```json
"scripts": {
  "test:eslint-rules": "node eslint-rules/no-raw-process-env.test.js",
  ...
}
```

Then in `.husky/pre-commit`, after the lint step:

```sh
# 4. Verify custom ESLint rule still works.
npm run test:eslint-rules
```

Cost: ~80ms per commit; benefit: D-11 invariant is now actually defended.

### WR-02: `metadataBase` URL casing is non-canonical

**File:** `app/layout.tsx:20,26`
**Severity:** WARNING
**Issue:**

```ts
metadataBase: new URL("https://useQuibly.com"),
...
openGraph: { type: "website", url: "https://useQuibly.com" },
```

`new URL("https://useQuibly.com")` normalizes the hostname to lowercase per the WHATWG URL spec — `metadataBase.toString()` will produce `https://usequibly.com/`. But the literal `openGraph.url` is left as `https://useQuibly.com` (mixed case). Result: OG cards, sitemap entries, and any `metadataBase`-resolved relative URL will use lowercase, while explicit absolute URLs in the same metadata bag use mixed case. Crawlers / link previewers that compare canonical URLs strictly may treat these as two different pages and split signal.

Also: writing the brand domain as `useQuibly.com` in source is a readability win for humans but a correctness hazard at integration boundaries (Resend webhook URLs, Vercel env vars, DNS verification). Establish lowercase-canonical now while it is still one decision.

**Fix:**

Pick lowercase canonical and use it everywhere:

```ts
const SITE_URL = "https://usequibly.com";
...
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { template: "%s | Quibly", default: "Quibly" },
  description: "Strategy-first AI marketing for solopreneurs and small teams. Coming soon.",
  openGraph: { type: "website", url: SITE_URL },
};
```

This also pre-empts a Phase 5 finding: `metadataBase` + relative OG image paths will need consistent casing so the resolved absolute URL matches the canonical one.

### WR-03: `lib/env.ts` is never imported in Phase 1 — boot-crash invariant is unverified

**File:** `lib/env.ts:37`, `app/page.tsx`, `app/layout.tsx`
**Severity:** WARNING
**Issue:**

Per D-08/D-10, `lib/env.ts` is supposed to hard-crash at module load on missing env. Per Phase 1 Success Criterion #4, this invariant must be observable. But:

- No file in `app/`, `components/`, `lib/utils.ts`, or `next.config.ts` imports `env` from `@/lib/env`. Confirmed via grep.
- Top-level code in a TypeScript module is only evaluated when the module is imported (or, for a tree-shakeable build, when an export is actually referenced).
- `next build` and `next dev` will therefore **not** evaluate `envSchema.parse(process.env)` in Phase 1. A developer with an empty `.env.local` can boot, render the smoke-test page, and pass all four parity checks (color, fonts, mascot, button) without ever touching the env validator.

The Zod schema is correct in isolation, but the "fails fast at boot" claim is not actually defended by any production code path that ships in this phase.

This is a real gap: the next phase that imports env (Phase 4) will be the first time anyone discovers whether the schema messages are actually useful or whether the names match Vercel env-var conventions.

**Fix:**

Two options, in order of preference:

1. (Preferred) Add a side-effect import in `app/layout.tsx` so every page render path goes through env validation:

   ```ts
   import "@/lib/env"; // D-08: hard-crash at module load if env is missing
   ```

   Cost: zero runtime impact in production (one parse on the server boot), exercises the invariant on every `next build` and every `next dev`.

2. Add an `import "@/lib/env"` to `next.config.ts` so the validator runs at config-load time, before the dev server even starts. This is the strongest variant — but Next 16's config evaluation is more complex than a plain Node import, so option 1 is safer.

If neither is added, document explicitly in `01-SUMMARY.md` that "boot-crash invariant is dormant until Phase 4" — but at that point success criterion #4 is technically not met by Phase 1.

### WR-04: `form` shadcn component listed in CONTEXT scope is missing

**File:** `components/ui/` (directory listing), `components.json`
**Severity:** WARNING
**Issue:**

CONTEXT D-01 in-scope item: `"shadcn CLI v4 init + button, input, label, sonner, form components styled to Quibly tokens"`. CD-08 install command: `"npx shadcn add button input label sonner form"`. Five components specified; only four exist:

```
components/ui/
├── button.tsx
├── input.tsx
├── label.tsx
└── sonner.tsx
```

`form.tsx` is absent. Phase 3 ("the form, Server Action, honeypot") will need it; not having it now means the Phase 3 PR has to either (a) add it then, drifting from D-01's scope, or (b) be blocked by a Phase 1-style "port from marketing-app" subtask that should have happened here.

If this was an intentional descope (Phase 3 doesn't need shadcn `<Form>` because it uses a native `<form action={serverAction}>` per CLAUDE.md's "What NOT to Use" rejection of `react-hook-form`), that decision is not recorded in `01-SUMMARY.md`. Either add the component or document the reversal.

**Fix:**

If the descope is real:

- Update `01-SUMMARY.md` (or add a CD entry in CONTEXT post-hoc) with the rationale: "shadcn `<Form>` is not added because Phase 3 uses native `<form action={…}>` per CLAUDE.md What-NOT-to-Use; `Form` shadcn primitive depends on `react-hook-form` which is explicitly rejected."
- Note: this is also consistent with CLAUDE.md's stated stack (no `react-hook-form`).

If the descope is unintentional:

- Run `npx shadcn@4.1.1 add form` and overwrite with `marketing-app/components/ui/form.tsx` per the CD-08 hybrid-install pattern.

The descope path is the better choice given CLAUDE.md, but it must be **explicitly recorded** to avoid a Phase 3 reviewer flagging it as missing.

### WR-05: `<Toaster>` is exported but never mounted; layout omits the portal

**File:** `components/ui/sonner.tsx:6-46`, `app/layout.tsx:36-39`
**Severity:** WARNING
**Issue:**

`Toaster` is the only export from `sonner.tsx` but it is never rendered in `app/layout.tsx`. Phase 3 will need it for "you're on the list" toasts; right now `toast.success(...)` calls would silently no-op because there is no portal mounted.

Phase 1's smoke-test scope (D-12) doesn't use toasts, so this isn't a runtime defect today. But:

- It means the Phase 1 success criterion "shadcn ... sonner ... wired to Quibly tokens" is technically unverified. The component compiles and renders nothing.
- Adding the Toaster mount is a one-line layout change that costs zero bundle bytes (Sonner is lazy-loaded) and lets a dev type `toast("test")` in the smoke-test page to verify the portal works.

**Fix:**

In `app/layout.tsx`:

```tsx
import { Toaster } from "@/components/ui/sonner";
...
return (
  <html lang="en" className={`${quicksand.variable} ${figtree.variable} h-full antialiased`}>
    <body className="min-h-full flex flex-col">
      {children}
      <Toaster />
    </body>
  </html>
);
```

This also surfaces any Sonner-vs-React-19 hydration issues now rather than in Phase 3 when there's a real form.

### WR-06: `globals.css` ships ~150 lines of dead CSS for unused subsystems

**File:** `app/globals.css:158-320`
**Severity:** WARNING
**Issue:**

The verbatim port (D-04) is intentional, but the imported file references three subsystems that do not exist in this repo:

- **Sidebar tokens + sidebar selectors** (lines 14-21, 77-84, 111-118, 136-151): `[data-sidebar="menu-button"]`, sidebar group-label typography. There is no sidebar in a single-page waitlist landing.
- **Schedule-X overrides** (lines 178-211): `.sx__week-grid__time-axis`, `.sx__date-grid`, `.sx__calendar-header`, etc. with `!important` flags and references to `--sx-color-on-surface-variant` (an undefined variable) and `hsl(var(--border))` (other tokens use `oklch`, not `hsl`).
- **Warning/scarcity utilities** (lines 167-172): `.bg-warning`, `.bg-scarcity` — utilities Phase 26 of `marketing-app` defines, with no Quibly-landing use case.
- **`.prose` typography** (lines 218-320): re-implementing `@tailwindcss/typography` — but Phase 1 explicitly drops the typography plugin (D-04) and CLAUDE.md "What NOT to Use" forbids it. Privacy/terms (Phase 5) was the only use case, and CONTEXT says they will be hand-styled.

D-04 says verbatim, but CLAUDE.md "What NOT to Use" says: `@tailwindcss/typography` plugin → "Only valuable for long-form prose; adds CSS bloat." Dragging in 100 lines of `.prose` rules contradicts that decision even though the *plugin* itself isn't installed.

Beyond the bloat (Tailwind v4's JIT prunes unused utilities, but plain CSS rules in `globals.css` always ship), the `hsl(var(--border))` reference on line 199 is genuinely broken — `--border` is set with `oklch(...)`, so `hsl(oklch(0.922 0 0))` is invalid CSS and the fallback `var(--sx-color-on-surface-variant)` will be used (also undefined → `transparent`). Day-1 rendering won't notice because no `.sx__date-grid-day` element exists, but the brand-token "single source of truth" claim is undermined.

**Fix:**

Strip the unused blocks now (this is the cheapest possible time to do it — before any code references them). Recommended deletions:

- Lines 136-151: sidebar `@layer base` block.
- Lines 158-211: brand-accent comment, warning/scarcity utilities, Schedule-X overrides.
- Lines 213-320: `.prose` re-implementation. Replace with a 5-line stub if Phase 5 actually needs `<article>` styling for privacy/terms.

Alternative: if D-04's "verbatim" is a hard contract for sync-with-marketing-app, leave the file alone and note in `01-SUMMARY.md` that the sidebar/Schedule-X/`.prose` blocks are knowingly dead code. The CSS is small in absolute bytes (~6 KB raw, ~2 KB gzipped) — the cost is mostly conceptual, not perf-critical.

The `hsl(var(--border))` on line 199 is a confirmed defect regardless of the strip-vs-keep decision; if kept, fix to `var(--border)` for consistency.

## Info

### IN-01: `Button` `default` variant has no plain-button hover state

**File:** `components/ui/button.tsx:12`
**Severity:** INFO
**Issue:**

```ts
default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
```

The `[a]:` Tailwind selector restricts the hover-bg-darken to anchor children only (i.e., when `asChild` renders the button as an `<a>`). A plain `<button>` rendered with the `default` variant has no hover state at all. This is verbatim from `marketing-app` and may be intentional in that codebase (sidebar buttons are usually `<a>`), but on a waitlist page the primary submit button will be `<button type="submit">` and will appear non-interactive on hover.

Phase 1 doesn't ship the form (Phase 3 does), so this is not a defect *today*, but it is worth noting before Phase 3 reviewers flag it as a UX bug. If the marketing-app port is meant to be byte-for-byte, do not change here — but track it for Phase 3.

**Fix:**

In Phase 3 (or now, as a deliberate divergence with rationale logged):

```ts
default: "bg-primary text-primary-foreground hover:bg-primary/80",
```

### IN-02: `tsconfig.json` `target: "ES2017"` is mismatched with React 19 / Next 16

**File:** `tsconfig.json:3`
**Severity:** INFO
**Issue:**

`target: "ES2017"` is the create-next-app default from circa 2022. Next 16 + React 19 + modern browsers (Vercel's default browserslist) will easily support ES2022. Setting `ES2017` means TypeScript downlevel-emits async/await as state machines, etc. — only matters at type-check time (`tsc --noEmit`), since Next compiles with its own target via SWC.

Verbatim port (CD-02) is the rationale, so this is not flagged as a defect; just note it for a future toolchain bump alongside `marketing-app`.

**Fix:**

When `marketing-app` bumps its target, propagate the bump here. No action needed in Phase 1.

### IN-03: `gitleaks protect` subcommand is deprecated upstream

**File:** `.husky/pre-commit:8`, `.gitleaks.toml:6`
**Severity:** INFO
**Issue:**

`gitleaks protect --staged` was renamed to `gitleaks git --staged --pre-commit` in gitleaks v8.19+ (the `protect` subcommand still works as an alias as of v8.21 but emits a deprecation warning). If contributors install a recent gitleaks (>= v8.19), they will see warnings on every commit.

**Fix:**

Track upstream and migrate to the new invocation when it becomes the only supported form:

```sh
gitleaks git --staged --pre-commit --redact -c .gitleaks.toml
```

Verify the flag set against the installed gitleaks version before changing.

### IN-04: `.gitleaks.toml` allowlist regex for placeholder is fragile

**File:** `.gitleaks.toml:48-52`
**Severity:** INFO
**Issue:**

```toml
regexes = [
  '''re_xxxxxxxxxxxxxxxxxxxxx''',
  '''AYxAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx''',
  '''your-instance\.upstash\.io''',
]
```

The allowlist matches the exact placeholder strings in `.env.example`. If a contributor edits `.env.example` to use a different placeholder convention (e.g., `re_xxx_REPLACE_ME` or `re_PLACEHOLDER`), the placeholder will match the live `resend-api-key` rule pattern and the commit will be blocked — but the reason will be obscure ("placeholder looks like a real key"). The path-based allowlist on line 38 (`(.+/)?\.env\.example$`) catches this case, so the regex allowlist is defense-in-depth, not load-bearing. Worth simplifying.

**Fix:**

Either remove the placeholder regex allowlist entirely (the path allowlist already covers `.env.example`), or document its purpose inline ("backup in case the file is renamed or copied to a non-allowlisted path").

### IN-05: `eslint.config.mjs` has redundant ignore for `eslint-rules/**`

**File:** `eslint.config.mjs:14-32`
**Severity:** INFO
**Issue:**

The custom-rule block at lines 13-31 has a `files` array restricting to `app/`, `lib/`, `components/`. `eslint-rules/` is not in `files`, so it would never be matched anyway. The `ignores: [..., "eslint-rules/**", ...]` in the same block is redundant. Then line 32's `globalIgnores([..., "eslint-rules/**"])` ignores `eslint-rules/` for *all* rules globally — including the standard Next.js rules.

The triple redundancy (custom block `files`, custom block `ignores`, `globalIgnores`) is correct but obscure. A future contributor may incorrectly conclude that one of these is the "real" allowlist and modify only one.

**Fix:**

Simplify to the single source of truth — the `globalIgnores` line is sufficient:

```js
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  { plugins: { custom: localRules } },
  {
    files: ["app/**/*.ts", "app/**/*.tsx", "lib/**/*.ts", "lib/**/*.tsx", "components/**/*.ts", "components/**/*.tsx"],
    ignores: ["**/*.test.ts", "**/*.test.tsx", "lib/env.ts"],
    rules: { "custom/no-raw-process-env": "error" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "eslint-rules/**"]),
]);
```

`eslint-rules/**` is removed from the inner `ignores` because the `files` glob already excludes it (not under `app/`, `lib/`, or `components/`), and `globalIgnores` ensures lint doesn't recurse into it.

---

_Reviewed: 2026-04-27T20:47:52Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
