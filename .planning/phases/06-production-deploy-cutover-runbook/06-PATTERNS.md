# Phase 6: Production Deploy + Cutover Runbook - Pattern Map

**Mapped:** 2026-04-29
**Files analyzed:** 3 (1 modify, 2 new)
**Analogs found:** 3 / 3

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `next.config.ts` (MODIFY) | config | build-time / edge header emission | `06-RESEARCH.md §Code Examples` (verified Next 16.2 shape) + current `quibly-landing/next.config.ts` posture; `marketing-app/next.config.ts` shows minimal-config sibling | exact (research-verified shape) |
| `docs/cutover.md` (NEW) | docs (runbook) | human-readable, step-numbered | `marketing-app/docs/PRODUCTION-CUTOVER-REMOVE-CLIPROXYAPI.md` | structural (different content; same skeleton) |
| `.planning/phases/06-.../06-UAT.md` (NEW) | UAT artifact | manual checkpoint table | `04-UAT.md`, `05-UAT.md` (same repo) | exact (sibling-phase format) |

## Pattern Assignments

### `next.config.ts` (config, MODIFY)

**Analog 1 (exact verified shape):** `06-RESEARCH.md` §Code Examples lines 459-484 — researcher-verified against `nextjs.org/docs/app/api-reference/config/next-config-js/headers` (v16.2.4, 2026-04-10).

**Current file** (`quibly-landing/next.config.ts`, full contents — 5 lines):
```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {}

export default nextConfig
```

**Analog 2 (sibling minimal-config posture):** `marketing-app/next.config.ts` (full contents — only adds `turbopack.root`):
```typescript
import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname, '..'),
  },
}

export default nextConfig
```
Takeaway: marketing-app does NOT use `headers()`, so quibly-landing is the canonical site for this pattern.

**Pattern to copy verbatim** (the entire `headers()` block — D-10/D-11):
```typescript
// next.config.ts
// Phase 6 D-10/D-11; HSTS max-age=300 per DEPLOY-06 (NOT preload — keeps cutover reversible)
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=300' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
        ],
      },
    ]
  },
}

export default nextConfig
```

**Forbidden token list (Pitfall 1, D-11):** No `includeSubDomains`, no `preload`, no other HSTS tokens. Cite D-11 / DEPLOY-06 in an inline comment at the HSTS line.

**Verification command** (from `06-RESEARCH.md` lines 521-548):
```bash
curl -sI https://useQuibly.com | grep -iE "strict-transport-security|x-content-type-options|x-frame-options|referrer-policy|permissions-policy"
# Expected: 5 lines, exact case may vary; HSTS line MUST be exactly "max-age=300"
```

---

### `docs/cutover.md` (docs/runbook, NEW)

**Analog:** `/Users/jeff/repos/marketing-app/docs/PRODUCTION-CUTOVER-REMOVE-CLIPROXYAPI.md` — **structure only**, NOT content. That doc is a code-removal cutover; this is a domain-swap.

**Structural skeleton to copy** (extracted from analog lines 1-198):

| Section | Source (analog) | What to copy |
|---------|-----------------|--------------|
| H1 + 1-paragraph "what this is / when to use it" | lines 1-3 | Voice: imperative, founder-context-aware ("when you're ready to deploy to production") |
| `**Prerequisites:**` bullet list | lines 5-8 | Bulleted, terse, env-var-style ("Anthropic account…", "`ANTHROPIC_API_KEY` set in Vercel…") |
| `## Step N: <Action>` headings | lines 12, 25, 61, 74, 131, 149 | Numbered. Imperative title. Sub-sections per step. |
| Per-step body shape | lines 26-58 (Step 2 is best example) | (1) imperative paragraph "What to do:", (2) numbered list of sub-actions, (3) `**After the change…**` or "**What to verify**" block, (4) optional "**What could break:**" callout, (5) optional `**GSD command to execute this:**` fenced block |
| `**What could break:**` callouts | lines 84, 94, 102, 109, 116 | One-paragraph inline note per step listing the failure mode |
| `**GSD command…**` fenced blocks | lines 54-57, 153-156, 175-177 | Fenced ` ``` ` block containing a `/gsd:quick` or `/gsd:debug` invocation the founder can run |
| `## Rollback Plan` near end | lines 166-178 | Numbered steps, GSD-debug callout |
| `## Summary Checklist` at end | lines 182-197 | `- [ ]` GitHub-task-list checkboxes covering each step's verification |

**Concrete excerpts to model from the analog:**

Per-step body (analog lines 25-58, abbreviated):
```markdown
## Step 2: Make the Change

**File to edit:** `lib/ai-provider.ts`

The change is small. You're removing [...]

**What to do:**
1. Remove the `CLAUDE_PROXY_URL` environment variable check
2. [...]

**After the change, `ai-provider.ts` should look roughly like:**

\`\`\`typescript
[code block]
\`\`\`

**GSD command to execute this:**
\`\`\`
/gsd:quick Remove CLIProxyAPI from ai-provider.ts — make contentModel always use direct Anthropic API.
\`\`\`
```

"What could break" callout (analog line 84):
```markdown
**What could break:** Streaming format differences between CLIProxyAPI and direct Anthropic. The Vercel AI SDK abstracts this, so it should be transparent — but verify.
```

Rollback section pattern (analog lines 166-178):
```markdown
## Rollback Plan

If something goes wrong after [event]:

1. [step]
2. [step]
3. [step]

**GSD command for rollback investigation:**
\`\`\`
/gsd:debug [scenario] — check [files], verify [env], compare [behavior]
\`\`\`
```

**Phase 6 cutover.md skeleton** (from `06-RESEARCH.md` Pattern 4, lines 325-339 — copy verbatim as section headings):
```markdown
# docs/cutover.md
## When to use this runbook
## Prerequisites (what must be true before starting)
## Step 1: Verify marketing-app is ready
## Step 2: Export Resend Audience as CSV (snapshot for emergency)
## Step 3: Compose pre-cutover launch broadcast in Resend Dashboard
## Step 4: Send broadcast (timing — SAME DAY as cutover, BEFORE the transfer)
## Step 5: Atomic Vercel cross-project domain transfer
## Step 6: Post-flip smoke test (curl + browser + signup)
## Step 7: Walk marketing-app's route map (verify legacy routes resolve)
## Step 8: Wait 10 min and re-check propagation
## Step 9: Decommission steps (do NOT delete)
## Rollback Plan (cold storage emergency only)
## Summary Checklist
```

**Length target:** 200–500 lines (CD-02). Analog clocks 198 lines — same order of magnitude.

**Voice:** Tone analog uses "You're removing…", "Once you've confirmed…" — second-person founder-direct. Match this voice.

**Step-5 detail to inline:** The full Vercel atomic-transfer manual UI flow already drafted in `06-RESEARCH.md` lines 635-671 (PRE-FLIGHT / TRANSFER / TRANSFER BACK / DOCUMENT). Paste this verbatim into Step 5.

**Step-2 detail:** Resend CSV export workflow drafted in `06-RESEARCH.md` lines 591-602.

---

### `.planning/phases/06-.../06-UAT.md` (UAT artifact, NEW)

**Analogs:** `05-UAT.md` and `04-UAT.md` (same repo). Both follow identical YAML-front-matter + numbered-test format.

**Frontmatter pattern** (from `05-UAT.md` lines 1-7):
```yaml
---
status: complete
phase: 06-production-deploy-cutover-runbook
source: [06-01-SUMMARY.md, 06-02-SUMMARY.md, ...]   # filled at execution time
started: 2026-04-XXTHH:MM:SSZ
updated: 2026-04-XXTHH:MM:SSZ
---
```

**Document skeleton** (from `05-UAT.md` lines 9-131):
```markdown
## Current Test

[testing complete]   # or "Test N" while in progress

## Tests

### N. <One-line test title — imperative or assertion>
expected: |
  <2–6 line YAML-block-scalar describing the exact manual steps + expected
  observable outcome. Includes specific URLs, button labels, expected
  values, and visual artifacts (screenshots) where relevant.>
result: pass | fail | issue | pending
note: "<optional 1-2 sentence clarification or re-verification stamp>"

[repeat ###]

## Summary

total: N
passed: N
issues: N
pending: N
skipped: N
blocked: N
note: "<optional summary annotation>"

## Gaps

[only if result==issue|fail; YAML list of gap objects with truth/status/reason/severity/test/root_cause/artifacts/missing/debug_session]
```

**Per-test pattern** — the canonical excerpt (from `05-UAT.md` lines 100-106, test 11 — most representative for Phase 6 manual checks):
```markdown
### 11. Cookieless: zero cookies set after page load + form submit
expected: |
  Open `/` in a new incognito/private window. DevTools → Application →
  Cookies → list for the current origin shows ZERO cookies after initial
  page load. Submit the waitlist form with a fresh email (or test value) —
  cookie count remains zero. No `_ga`, no `_vercel_*`, no Plausible, nothing.
result: pass
```

**Phase 6 test inventory to wire** (from CONTEXT.md §Integration Points — `06-UAT.md` line):
1. `privacy@useQuibly.com` mailbox reachable (D-02 only-open carryover; **hard launch-gate**)
2. Production mail-tester 10/10 from prod apex (DEPLOY-05; CD-08 — paste mail-tester URL + screenshot)
3. Production real-signup writes to production audience + welcome arrives in Gmail (DEPLOY end-to-end)
4. Production OG/sitemap/robots/favicon smoke (re-verify against prod apex, not preview)
5. Five hardening headers emit on prod apex (DEPLOY-06; `curl -sI` evidence)
6. HSTS value is EXACTLY `max-age=300`, no preload/includeSubDomains
7. No Service Worker registered on prod (CD-03 manual DevTools checkpoint + screenshot)
8. Dry-run cutover transfer back-and-forth on `staging.useQuibly.com` (D-05/D-06/D-07; screenshot the in-use prompt at each transfer step)
9. Resend Audience CSV export confirms `consent_version` column present (Pitfall 6 empirical check)
10. SPF + 3× DKIM + DMARC + Return-Path verified on prod apex via `dig` (DEPLOY-04; paste `dig` output)

**Match `05-UAT.md` `## Summary` block** lines 124-131 — totals + counts.

**Match `## Gaps` YAML schema** from `05-UAT.md` lines 133-212 — only populate if any test result is `issue` or `fail`.

## Shared Patterns

### Manual-checkpoint evidence retention (applies to all of `06-UAT.md`)

**Source:** `05-UAT.md` test 5 line 53-55 (re-verify stamp), test 12 lines 116-122 (multi-line `note:` for nuanced verification), test 11 lines 100-106 (clear "Open / Click / Verify" steps).

**Apply to all Phase 6 UAT tests:** Each `expected:` block must (a) name the exact URL or surface, (b) describe the exact human action, (c) state the observable success criterion (a header value, a row in a dashboard, an inbox arrival). For Phase 6 specifically, several tests require **screenshot evidence** (CD-08 mail-tester score, CD-03 DevTools Service Workers panel, dry-run Vercel in-use prompt at each transfer step) — the `note:` field is the canonical place to reference the screenshot artifact path.

### `curl -sI` header verification (applies to next.config.ts + 06-UAT.md)

**Source:** `06-RESEARCH.md` lines 521-548.

**Apply:** `next.config.ts` plan must reference these commands as the verification step; `06-UAT.md` test for header emission must embed the exact `curl` invocation in its `expected:` block.

### "Don't hand-roll" guardrails (applies to docs/cutover.md)

**Source:** `06-RESEARCH.md` lines 350-361 (`## Don't Hand-Roll` table).

**Apply:** When authoring cutover.md, every step that wraps a platform-native operation (Vercel domain UI, Resend Dashboard, mail-tester, DevTools) must be described as the manual UI flow. Do NOT introduce a script. Plan task should embed a "what NOT to build" sub-bullet citing the table row.

### Anti-patterns to enforce in PR review (applies to all 3 files)

**Source:** `06-RESEARCH.md` lines 341-348.

| File | Anti-pattern to reject in review |
|------|----------------------------------|
| `next.config.ts` | HSTS preload/includeSubDomains; `vercel.json` or `vercel.ts` parallel config; `middleware.ts` for header emission |
| `docs/cutover.md` | Hard-coded `redirect()` rules for marketing-app paths (D-04); custom Resend broadcast script (D-09); authoring as TODAY's launch checklist (D-03 — that lives in 06-UAT.md) |
| `06-UAT.md` | Skipping `privacy@useQuibly.com` mailbox check (D-02 only-open carryover); accepting Phase 4 preview mail-tester result as Phase 6 evidence (DEPLOY-05 requires prod-apex re-verify) |

## No Analog Found

None — all three Phase 6 files have either an exact same-repo sibling (UAT files) or a structural sibling in the related repo (cutover doc) or a research-verified canonical shape (next.config.ts headers block).

## Metadata

**Analog search scope:**
- `/Users/jeff/repos/quibly-landing/next.config.ts` (current state)
- `/Users/jeff/repos/quibly-landing/.planning/phases/04-resend-wiring-bot-protection-welcome-email/04-UAT.md`
- `/Users/jeff/repos/quibly-landing/.planning/phases/05-legal-seo-analytics/05-UAT.md`
- `/Users/jeff/repos/marketing-app/next.config.ts`
- `/Users/jeff/repos/marketing-app/docs/PRODUCTION-CUTOVER-REMOVE-CLIPROXYAPI.md`
- `06-RESEARCH.md` §Code Examples + §Pattern 4 + §Don't Hand-Roll

**Files scanned:** 6
**Pattern extraction date:** 2026-04-29
