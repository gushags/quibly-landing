# Phase 6: Production Deploy + Cutover Runbook - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-29
**Phase:** 6-production-deploy-cutover-runbook
**Areas discussed:** Cutover runbook + launch checklist, Dry-run scope on staging subdomain, Launch broadcast — timing & mechanism, Security headers + HSTS surface

---

## Cutover runbook + launch checklist

### Q1 — Rollback posture during the cutover swap window

| Option | Description | Selected |
|--------|-------------|----------|
| Smoke-test then commit | After atomic transfer: curl + browser test, real signup verification, OG/sitemap/robots check, ~10 min wait + re-check. Rollback only if any hard check fails. HSTS=300 is the safety net. | ✓ |
| Active monitoring window with hard triggers | Documented rollback triggers (5xx, audience write fails, OG breaks, DNS propagation incomplete after N min). 30-min observation window with curl loop. | |
| Roll forward only | Assume marketing-app is rock-solid before cutover starts. If anything fails post-cutover, fix forward. Runbook documents rollback as cold-storage emergency only. | |

**User's choice:** Smoke-test then commit (Recommended).
**Notes:** Pragmatic for solo founder + pre-launch traffic. Captured as **D-01**.

### Q2 — Carry-over launch-gating items (multi-select)

| Option | Description | Selected |
|--------|-------------|----------|
| Real postal address (RESEND_FROM_POSTAL_ADDRESS) | Phase 4 D-10: founder sources registered agent / PO Box / CMRA. CAN-SPAM blocker. | (already complete) |
| Outlook + iCloud welcome-email spot-check | Phase 4 carryover deferred to launch gate. | (already complete) |
| privacy@useQuibly.com mailbox provisioned | Phase 5 CD-07: DSAR contact must be a real reachable mailbox. | ✓ |
| Visual verification batch (zero-cookie + OG) | Phase 5 ANLY-05 + SC #2 OG validation. | (already complete) |

**User's choice:** Only `privacy@useQuibly.com` mailbox provisioning remains TODO. Items 1, 2, and 4 are complete; can be marked completed in STATE.md / PROJECT.md.
**Notes:** Captured as **D-02** with closure list. Triggers STATE.md/PROJECT.md hygiene update during plan-phase or close.

### Q3 — Document layout split

| Option | Description | Selected |
|--------|-------------|----------|
| Split: cutover.md + UAT | docs/cutover.md = future marketing-app swap only. Today's go-live verification lives in 06-UAT.md (GSD-internal). Cleanest separation. | ✓ |
| Single docs/cutover.md | One repo doc covers both timelines: pre-launch checklist section + cutover section. | |
| Split: cutover.md + launch-checklist.md | Both as repo docs in /docs. Today's checklist committed to source. | |

**User's choice:** Split — cutover.md + UAT (Recommended).
**Notes:** Captured as **D-03**. cutover.md stays narrow; today's launch verification stays in `.planning/`.

### Q4 — Legacy redirects scope in cutover.md

| Option | Description | Selected |
|--------|-------------|----------|
| Verification step only | "Walk marketing-app's route map; verify /privacy, /terms, /unsubscribe etc. resolve there." No pre-scripted redirect rules. | ✓ |
| Pre-script known routes | List specific routes; for each: "verify marketing-app serves this OR add a redirect." | |
| Assume marketing-app fully owns the route surface | Trust marketing-app's Phase 17. Smoke-test the apex post-flip; no legacy redirects considered. | |

**User's choice:** Verification step only (Recommended).
**Notes:** Captured as **D-04**. Pre-scripting against a route surface that may shift before cutover is staleness-prone.

---

## Dry-run scope on staging subdomain

### Q1 — Dry-run fidelity

| Option | Description | Selected |
|--------|-------------|----------|
| Full fidelity — real transfer back-and-forth | Bind staging.useQuibly.com to quibly-landing → atomic-transfer to marketing-app project → transfer back. Exercises the actual Vercel UI flow (the cross-team UI flow SUMMARY.md flags as MEDIUM-confidence). | ✓ |
| Half fidelity — staging deploy only | Bind staging subdomain to quibly-landing only; verify full E2E on the subdomain. Don't actually transfer between projects. | |
| Walk-through only | No staging subdomain bound. Read cutover.md against a checklist; verify prerequisites exist. | |

**User's choice:** Full fidelity (Recommended).
**Notes:** Captured as **D-05**. Resolves the SUMMARY.md research flag.

### Q2 — Transfer destination

| Option | Description | Selected |
|--------|-------------|----------|
| Existing marketing-app Vercel project | Highest fidelity — actual destination of future real cutover. Catches team-level / project-config divergences. | ✓ |
| Throwaway placeholder Vercel project | One-page placeholder in the same Vercel team. Doesn't depend on marketing-app's readiness. | |
| Decide at planning time | Researcher checks marketing-app's Vercel-deploy state; planner picks. | |

**User's choice:** Existing marketing-app Vercel project.
**Notes:** Captured as **D-06**. Planner falls back to a throwaway only if marketing-app isn't deployable at plan time.

### Q3 — What gets exercised on staging

| Option | Description | Selected |
|--------|-------------|----------|
| Transfer mechanics + smoke load | Bind → load → transfer → load → transfer back → load. No Resend writes during dry-run. | ✓ |
| Transfer + real preview-audience signup | Above PLUS real signup against staging → preview audience → welcome email from production hello@. | |
| Full E2E with staging sender domain | Above PLUS configure separate staging sender (hello@staging.useQuibly.com) with its own SPF/DKIM/DMARC. | |

**User's choice:** Transfer mechanics + smoke load (Recommended).
**Notes:** Captured as **D-07**. Phase 4 already validated email path; dry-run focuses on the cross-project transfer UI.

---

## Launch broadcast — timing & mechanism

### Q1 — Broadcast timing

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-cutover, from quibly-landing | Send broadcast from hello@useQuibly.com via Resend BEFORE apex flips. Subscribers see "Quibly is live!" → click through. | ✓ |
| Post-cutover, from marketing-app | Cutover apex first → marketing-app sends broadcast from its sender pipeline. | |
| Hybrid — announce pre-cutover, follow-up post-cutover | Two emails to the audience. | |

**User's choice:** Pre-cutover, from quibly-landing (Recommended).
**Notes:** Captured as **D-08**. Reputation-preserving; trusted-sender continuity; SUMMARY.md recommendation.

### Q2 — Broadcast mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Resend Broadcasts UI | Native Resend Broadcasts. Same account, same audience, same sender. Zero new vendor. UI-only. | ✓ |
| CSV export → external broadcaster | Export to CSV; import to ConvertKit/Beehiiv/Substack. Adds vendor + portability question. | |
| Custom script via Resend transactional API | Loop the audience contacts and call resend.emails.send(). Bypasses Broadcasts UI. | |

**User's choice:** Resend Broadcasts UI (Recommended).
**Notes:** Captured as **D-09**. cutover.md just notes the dashboard steps; no code in this repo.

---

## Security headers + HSTS surface

### Q1 — Headers definition surface

| Option | Description | Selected |
|--------|-------------|----------|
| next.config.ts headers() | Framework-native, type-safe via NextConfig. Co-located with Next config. Source `/(.*)` for all routes. | ✓ |
| vercel.ts (or vercel.json) | Platform-level config. Survives framework swap. Adds a config file. | |
| Routing Middleware (middleware.ts) | NextResponse.next().headers in middleware. Most flexible; runtime cost on every request. | |

**User's choice:** next.config.ts headers() (Recommended).
**Notes:** Captured as **D-10**. Idiomatic Next-only home.

### Q2 — Header set

| Option | Description | Selected |
|--------|-------------|----------|
| Standard hardening set | HSTS max-age=300 + X-Content-Type-Options + X-Frame-Options DENY + Referrer-Policy + Permissions-Policy. No CSP. | ✓ |
| HSTS only — minimum for DEPLOY-06 | Just Strict-Transport-Security: max-age=300. Punts everything else to v1.x. | |
| Standard set + starter CSP | Above PLUS Content-Security-Policy with explicit allow-list. Risk: any miss breaks the page. | |

**User's choice:** Standard hardening set (Recommended).
**Notes:** Captured as **D-11**. CSP deferred to a focused future spike with traffic to validate against.

---

## Claude's Discretion

- **CD-01:** Exact `next.config.ts` `headers()` array shape (Next 16 type signature; Claude wires).
- **CD-02:** `docs/cutover.md` writing voice, structure, and length (~200–500 lines, step-numbered, "what could break" callouts; Claude drafts; founder edits in PR).
- **CD-03:** Service Worker absence verification mechanism (recommended: manual checkpoint task in 06-UAT.md; CI grep / Playwright spec are alternates).
- **CD-04:** Resend domain re-verification semantics at team level (DEPLOY-03; researcher verifies during planning).
- **CD-05:** Staging subdomain DNS source (researcher verifies whether Vercel-managed nameservers auto-create the CNAME or manual DNS edit is needed).
- **CD-06:** `docs/cutover.md` location (`docs/cutover.md` — Phase 6 creates the directory).
- **CD-07:** `06-UAT.md` checklist format (matches Phases 4–5 conventions).
- **CD-08:** Production mail-tester evidence retention format (URL + screenshot in UAT comment).

## Deferred Ideas

- Content-Security-Policy header (D-11 alt c — its own future spike).
- Active monitoring window with hard rollback triggers (D-01 alt b — runbook v1.x upgrade if surprises happen).
- Pre-scripted legacy redirect rules in cutover.md (D-04 alt b — defer until marketing-app's route map exists).
- Throwaway placeholder Vercel project for dry-run (D-06 alt b — planner-time fallback only).
- Hybrid pre+post-cutover broadcast strategy (D-08 alt c — runbook v1.x option if click-through is low).
- CSV export → external broadcaster (D-09 alt b — v1.x if newsletter operation grows beyond Resend).
- Custom send-broadcast.ts script (D-09 alt c — v2 if Resend Broadcasts UI is insufficient).
- Service Worker absence as CI grep gate (CD-03 alt a — promote if regression risk appears).
- vercel.ts config file (D-10 alt b — adopt if config grows beyond Next-managed surface).
- Re-validating already-complete Phase 4/5 items (D-02 — closed; only re-run if regression signal appears).
