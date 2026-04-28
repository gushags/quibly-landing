# Phase 03 — Deferred Items

Items discovered during execution that are outside the scope of the plan that surfaced them.

## Discovered by 03-05 (Playwright form specs)

### `tests/visual/above-fold.spec.ts` regression — `text=Launching Summer 2026` is no longer unique

**Test:** `Phase 2 above-fold + tap-target invariants > hero essentials fit above the 320×568 fold`

**Symptom:**

```
Error: locator.boundingBox: Error: strict mode violation: locator('text=Launching Summer 2026') resolved to 2 elements:
    1) <p class="mt-3 text-sm text-muted-foreground">Launching Summer 2026</p>  (hero microcopy)
    2) <p class="mt-3 text-sm text-muted-foreground">Launching Summer 2026</p>  (waitlist-form footer microcopy)
```

**Root cause:** Plan 03-03 (`components/waitlist/waitlist-form.tsx` — landed in Wave 3 before Plan 03-05) added a second `<p>Launching Summer 2026</p>` immediately below the submit button. The Phase 2 above-fold spec used `page.locator("text=Launching Summer 2026")` which depends on uniqueness; it now matches two elements and fails Playwright's strict-mode locator check.

**Why this is deferred:** Plan 03-05's scope is the new `tests/form/*` specs. The failing spec lives in `tests/visual/` and was introduced by Plan 03-03's component, not by anything Plan 03-05 changed. Per execute-plan.md SCOPE BOUNDARY: "Only auto-fix issues DIRECTLY caused by the current task's changes. Pre-existing warnings, linting errors, or failures in unrelated files are out of scope."

**Suggested fix (for the next plan that touches `tests/visual/`):** Disambiguate the microcopy locator to the hero scope only:

```ts
// Before:
const microcopy = page.locator("text=Launching Summer 2026")

// After:
const microcopy = page.locator("section").first().locator("text=Launching Summer 2026")
// Or: scope to the hero <section> by class/role
```

**Alternative fix:** Remove the duplicate microcopy from `components/waitlist/waitlist-form.tsx` if the founder agrees it's not needed below the form (the hero already shows it once above the fold).

**Severity:** Low — the form e2e suite (Plan 03-05) is fully green; the failing spec is a Phase 2 invariant that was silently broken by a Wave 3 component addition. The hero CTA, sub-headline, h1 still all fit above the fold — only the locator is over-broad.
