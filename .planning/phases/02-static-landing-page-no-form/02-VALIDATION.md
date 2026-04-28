---
phase: 02
slug: static-landing-page-no-form
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-27
approved: 2026-04-27
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

Source of truth: `02-RESEARCH.md` § Validation Architecture. Phase 2 has zero JavaScript logic to unit-test (no Server Actions, no client utilities, no transforms) — vitest enters in Phase 3 with the first form. Validation is therefore **Lighthouse CI** for performance/CLS/render-blocking + manual viewport inspection for visual + LCP-element correctness.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Lighthouse CI (`@lhci/cli`) — performance gate. No vitest in Phase 2. |
| **Config file** | `.lighthouserc.json` (NEW — created in this phase, Wave 0) |
| **Quick run command** | `npx @lhci/cli autorun --config=.lighthouserc.json` (against local `next start`) |
| **Full suite command** | GitHub Action `.github/workflows/lighthouse.yml` against the Vercel preview URL |
| **Estimated runtime** | ~60s local · ~5min CI (incl. Vercel preview build wait) |

---

## Sampling Rate

- **After every task commit:** `pnpm typecheck && pnpm lint && pnpm build` (no vitest yet — these are the only automatable checks for static-page tasks)
- **After Wave 1 (build core):** `next build && next start`, run Chrome DevTools Lighthouse mobile preset locally — verify performance ≥90 baseline before adding more content
- **After Wave 2 (CI gate wired):** `npx @lhci/cli autorun --config=.lighthouserc.json` against `next start` locally — must pass the same assertions the CI job will enforce
- **Before `/gsd-verify-work`:** Lighthouse CI run must be green on the Phase 2 PR (mobile performance ≥0.90, CLS <0.1)
- **Max feedback latency:** typecheck+lint+build is ~30–45s; full LHCI is ~60s local

---

## Per-Task Verification Map

> Populated by gsd-planner. Each task ID maps to its requirement and the automated command that proves it. The map below shows the canonical test-type assignment per requirement; the planner expands per task.

| Plan / Wave | Requirement | Test Type | Automated Command | Status |
|-------------|-------------|-----------|-------------------|--------|
| Wave 0 — `.lighthouserc.json` | PERF-01, PERF-02, PERF-03 | LHCI config | `npx @lhci/cli autorun --collect-only --config=.lighthouserc.json` parses config | ⬜ pending |
| Wave 0 — `.github/workflows/lighthouse.yml` | PERF-01, PERF-02, PERF-03 | CI smoke | `actionlint .github/workflows/lighthouse.yml` exits 0 (or `gh workflow view lighthouse` parses) | ⬜ pending |
| Hero / Wave 1 | HERO-01, HERO-02, HERO-03 | manual viewport | `next dev` + DevTools at 320×568 — verify headline, sub-headline, mascot, CTA above fold | ⬜ pending |
| Hero / Wave 1 | HERO-04 (CTA placeholder) | manual viewport | DevTools — placeholder CTA visible above fold | ⬜ pending |
| Hero / Wave 1 | HERO-05 (launch microcopy "Launching Summer 2026") | grep | `grep -F "Launching Summer 2026" components/sections/hero.tsx` returns 1+ matches | ⬜ pending |
| Hero / Wave 1 | HERO-06 (LCP element is `<h1>`) | LHCI report | Open `largest-contentful-paint element` audit in LHCI HTML report — must reference `h1`, not the mascot | ⬜ pending |
| Hero / Wave 1 | HERO-07 (motion-safe) | manual | macOS Reduce Motion ON → click anchor link → page jumps without smooth scroll | ⬜ pending |
| Mobile / Wave 1 | MOB-01 (320→1440 scaling) | manual viewport | DevTools Device Mode at 320, 375, 768, 1440 — no horizontal scroll, no broken layout | ⬜ pending |
| Mobile / Wave 1 | MOB-02 (interactive ≥48px) | LHCI a11y audit | LHCI `tap-targets` audit passes (advisory) + DevTools computed height ≥48px on every `<button>`/`<a>` | ⬜ pending |
| Mobile / Wave 1 | MOB-03 (body ≥16px on mobile) | grep + manual | base font CSS uses `1rem`/`16px` — DevTools confirm | ⬜ pending |
| Mobile / Wave 1 | MOB-04 (no layout overflow) | LHCI + manual | LHCI `layout-shift-elements` audit + DevTools at 320px — no `overflow-x` | ⬜ pending |
| Below-fold / Wave 1 | FOLD-01 ("Why Quibly" 3-line block) | manual | DevTools — three differentiator lines render below hero | ⬜ pending |
| Below-fold / Wave 1 | FOLD-02 (founder voice paragraph) | manual | DevTools — paragraph block renders | ⬜ pending |
| Below-fold / Wave 1 | FOLD-03 (secondary CTA) | manual | DevTools — second CTA renders below founder paragraph | ⬜ pending |
| Below-fold / Wave 1 | FOLD-04 (footer copyright + privacy/terms links) | grep + manual | `grep -E "href=\"/privacy\"\|href=\"/terms\"" components/sections/footer.tsx` AND © year present | ⬜ pending |
| Perf gate / Wave 2 | PERF-01 (Lighthouse mobile ≥90) | LHCI assertion | LHCI `categories:performance >= 0.90` (error level) | ⬜ pending |
| Perf gate / Wave 2 | PERF-02 (CLS <0.1) | LHCI assertion | LHCI `cumulative-layout-shift maxNumericValue: 0.1` (error level) | ⬜ pending |
| Perf gate / Wave 2 | PERF-03 (no render-blocking 3p) | LHCI assertion | LHCI `render-blocking-resources` audit (warn-level — should be 0) AND `grep -r "use client" app/ components/` returns zero hits in Phase 2 files | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `.lighthouserc.json` — Lighthouse CI configuration (NEW — see RESEARCH § Lighthouse CI Configuration for exact JSON)
- [ ] `.github/workflows/lighthouse.yml` — GitHub Actions workflow (NEW — see RESEARCH § GitHub Actions Workflow for exact YAML)
- [ ] `VERCEL_TOKEN` GitHub secret added — **manual one-time step**, planner must include a task that documents this and pauses the wave with `autonomous: false` until the developer confirms the secret is set (LHCI cannot run against the preview URL without it; LHCI will gracefully fall back to local `next start` if missing, which the planner should document as the temporary path)
- [ ] (Optional) `LHCI_GITHUB_APP_TOKEN` — enables PR status check annotations; non-blocking

*No vitest test files are required in Phase 2. No fixtures. No conftest.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual content correctness above/below fold | HERO-01..05, FOLD-01..04 | Visual rendering of static markup is not LHCI-assertable; no Playwright in Phase 2 (deferred) | `pnpm dev` → http://localhost:3000 → DevTools Device Mode iPhone SE (320×568) → confirm headline + sub-headline + mascot + CTA above fold; scroll → confirm "Why Quibly" 3 lines + founder paragraph + secondary CTA + footer |
| Multi-viewport scaling | MOB-01 | DevTools Device Mode is faster than authoring Playwright snapshots for a single page | Device Mode at 320, 375, 768, 1440 — confirm no horizontal scroll, no broken layout, no clipped text |
| LCP element identity | HERO-06 | LHCI does not assert *which element* is LCP; it reports it. A human must read the report. | Open the LHCI artifact HTML report → Performance audit → `largest-contentful-paint-element` → confirm reference is the `<h1>`, not the mascot div |
| `prefers-reduced-motion` honored | HERO-07, SC #5 | Requires OS-level setting toggle | macOS: System Settings → Accessibility → Display → Reduce motion ON → reload page → click "Join the waitlist" anchor → confirm INSTANT jump (no smooth-scroll) |
| Tap-target geometry | MOB-02 | LHCI `tap-targets` is advisory; complement with DevTools computed style check | DevTools → Inspect every `<button>`/`<a>` → computed `height` ≥48px |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (LHCI run + manual viewport doc)
- [x] Sampling continuity: typecheck/lint/build run after every commit; LHCI runs after Wave 1 and Wave 2
- [x] Wave 0 covers `.lighthouserc.json` + `.github/workflows/lighthouse.yml` + GitHub secret task (Plan 02-05)
- [x] No watch-mode flags
- [x] Feedback latency < 60s for typecheck+lint+build; < 90s for local LHCI
- [x] `nyquist_compliant: true` set in frontmatter — finalized per the 5-plan per-task map

**Approval:** approved 2026-04-27
