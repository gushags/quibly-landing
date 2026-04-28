---
status: partial
phase: 02-static-landing-page-no-form
source: [02-VERIFICATION.md, 02-05-PLAN.md Task 4 deferred]
started: 2026-04-28T02:32:00Z
updated: 2026-04-28T02:32:00Z
---

## Current Test

[awaiting human action — Lighthouse CI enforcement gate]

## Tests

### 1. Add VERCEL_TOKEN as a GitHub repository secret
expected: A personal Vercel access token (scope: personal team) is generated at https://vercel.com/account/tokens (suggested name: `quibly-landing-lhci`) and saved as repository secret `VERCEL_TOKEN` at github.com/{owner}/quibly-landing/settings/secrets/actions. The Lighthouse workflow's `secrets.VERCEL_TOKEN` reference resolves on first run.
result: [pending]

### 2. Configure D-34 branch protection on `main`
expected: github.com/{owner}/quibly-landing/settings/branches enforces a required status check named `Lighthouse CI / lighthouse` for `main`. PRs cannot merge while the check is pending or failed; merging is enabled when the check is green.
result: [pending]

### 3. Push branch + open PR; confirm green workflow run + merge enforcement
expected: A PR opened against `main` triggers `.github/workflows/lighthouse.yml`, the workflow runs against the Vercel preview URL, and the median assertions pass (perf ≥0.90, CLS <0.1, render-blocking ≤1). The merge button is enabled only after the check goes green; if assertions fail, the merge button is blocked.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps

(none — these are deployment-time deferrals, not code gaps)

## Notes

- All code/config for the CI gate is shipped (`.lighthouserc.json`, `.github/workflows/lighthouse.yml`, `@lhci/cli` devDep, `lh:ci` script).
- Local LHCI run verified GREEN: performance 0.96, CLS 0, LCP element selector starts with `h1`, render-blocking count = 1 (override accepted per documented Rule-1 deviation in 02-CONTEXT.md and 02-05-SUMMARY.md).
- 6/6 Playwright tests pass (button radius lock + above-fold composition + tap targets + focus-visible).
- These 3 items duplicate the entries in STATE.md "Deferred Items" so they surface in `/gsd-progress` and `/gsd-audit-uat`.
- An optional 4th item (lighthouse-ci GitHub App + `LHCI_GITHUB_APP_TOKEN` for richer PR annotations) is tracked in STATE.md "Deferred Items" only — not in this UAT because it is non-blocking polish.
