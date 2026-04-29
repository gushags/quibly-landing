# Phase 6: Production Deploy + Cutover Runbook - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Apex go-live at `useQuibly.com` shipped as a **verified deliverable**, plus a written `docs/cutover.md` runbook for the FUTURE handoff to `marketing-app`. Phase 6 has two distinct timelines:

1. **Today (production go-live):** Bind apex at the Vercel **team** level (not project level), wire production security headers in `next.config.ts`, deploy production, exercise the launch checklist (privacy mailbox, prod mail-tester re-check, prod real-signup test, prod OG/sitemap/robots probe). Gates the form to public traffic.
2. **Future (cutover to marketing-app):** Author `docs/cutover.md` covering the eventual atomic Vercel domain transfer to `marketing-app`. Dry-run the cutover end-to-end on `staging.useQuibly.com` with a real domain transfer back-and-forth between the `quibly-landing` and `marketing-app` Vercel projects to exercise the cross-project transfer UI flow that SUMMARY.md flags as MEDIUM-confidence research.

The phase is mostly a **runbook + small config additions** — `next.config.ts` `headers()` block (~30 lines), `docs/cutover.md` (one new repo doc), and a Phase-6 UAT/launch-checklist run. No new Server Actions, no new app routes, no new dependencies.

**In scope:**
- Apex domain `useQuibly.com` bound at Vercel **team** level (DEPLOY-01/02)
- Resend domain verified at Vercel team level (DEPLOY-03) — already done in Phase 4 against the project, may need re-binding to team scope
- Re-verify SPF + 3× DKIM + DMARC `p=none` + Return-Path on production apex (DEPLOY-04)
- Re-verify `mail-tester.com` 10/10 score from production apex (not just preview) before public exposure (DEPLOY-05)
- `next.config.ts` async `headers()` block emitting the standard hardening set:
  - `Strict-Transport-Security: max-age=300` (DEPLOY-06 — explicitly NOT preload, keeps cutover reversible)
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`
- Verify NO Service Worker is registered (DEPLOY-07) — currently no SW code exists; verify via grep + DevTools Application/Service Workers panel on production
- `docs/cutover.md` — future-oriented runbook covering: pre-flight (verify marketing-app ready) → CSV export → broadcast send (pre-cutover, from quibly-landing's Resend) → atomic Vercel cross-project domain transfer → post-flip smoke test → legacy-route verification step → decommission steps (do NOT delete repo / Resend domain / audience) → rollback path documented for cold-storage emergency only
- Dry-run cutover end-to-end on `staging.useQuibly.com`:
  - Bind staging.useQuibly.com to quibly-landing Vercel project (team-level)
  - Verify it loads
  - Atomic-transfer staging.useQuibly.com to the existing marketing-app Vercel project (same team)
  - Verify it loads from marketing-app
  - Atomic-transfer back to quibly-landing
  - Verify it loads again
  - Document the exact UI flow / screenshots needed in cutover.md
- `06-UAT.md` (Phase 6's GSD verification artifact) — today's go-live verification: privacy@useQuibly.com mailbox provisioned and reachable, prod mail-tester 10/10, prod real-signup writes to production audience, prod welcome email arrives in Gmail, production OG/sitemap/robots smoke

**Out of scope:**
- Live signup counter (Phase 7, gated audience ≥50)
- The actual cutover execution to marketing-app — Phase 6 ships the runbook + dry-run; the real cutover happens later when marketing-app is ready
- Broadcast email **content** — composed in Resend Dashboard at launch time by the founder; cutover.md references "compose broadcast" as a step but does not pre-script copy
- CSP — explicitly deferred (D-11 below) — its own future spike
- HSTS preload — explicitly forbidden (DEPLOY-06; persists past cutover)
- Service Worker registration — explicitly forbidden (DEPLOY-07; persists past cutover)
- Re-validating items already verified in prior phases: Phase 4 mail-tester 10/10 against the preview audience (Phase 6 re-verifies against the production apex), Phase 5 zero-cookie verification (already complete), Phase 5 OG validation through opengraph.xyz/X/LinkedIn (already complete), Phase 4 real postal address (already complete), Phase 4 Outlook + iCloud welcome-email spot-check (already complete)
- Marketing-app's own readiness — out of this repo's scope; cutover.md verifies marketing-app is ready as a pre-flight step but doesn't define what "ready" means in marketing-app's repo
- Pricing / app launch / blog routes — owned by marketing-app post-launch, not a Phase 6 concern

</domain>

<decisions>
## Implementation Decisions

### Cutover runbook scope & rollback
- **D-01:** **Rollback posture during the cutover swap window: smoke-test then commit.** After the atomic Vercel transfer flips `useQuibly.com` from `quibly-landing` to `marketing-app`: (1) curl + browser test the apex loads marketing-app's content, (2) submit a real signup against marketing-app's form, verify Resend audience row + welcome email, (3) check OG/sitemap/robots, (4) wait ~10 min and re-check propagation. Rollback ONLY if any hard check fails. HSTS `max-age=300` is the safety net (clean reversibility within 5 min per request). cutover.md documents the theoretical rollback path (transfer the apex back to quibly-landing) but treats it as cold-storage emergency. **Why:** pragmatic for a solo founder + pre-launch traffic; avoids over-engineering a 30-min observation window for an event that's mostly atomic at the Vercel UI level.
- **D-02:** **Carry-over launch-gating items: 4 of 5 already complete; only `privacy@useQuibly.com` mailbox provisioning remains TODO.**
  - ✅ **Real postal address (`RESEND_FROM_POSTAL_ADDRESS`)** — Phase 4 D-10 carryover; **already complete**. STATE.md/PROJECT.md should reflect closure.
  - ✅ **Outlook + iCloud welcome-email spot-check** — Phase 4 carryover; **already complete**.
  - ✅ **Zero-cookie incognito verification (ANLY-05)** — Phase 5 carryover; **already complete**.
  - ✅ **OG validation through opengraph.xyz / X / LinkedIn (Phase 5 SC #2)** — **already complete**.
  - ⏳ **`privacy@useQuibly.com` mailbox provisioned (Phase 5 CD-07)** — DSAR contact in `app/(legal)/privacy/page.tsx` is a real mailbox (Resend Inbound forward / Google Workspace alias / ImprovMX); verify a test email reaches the founder before exposing the form publicly. **Lives in 06-UAT.md as a launch-gating checkpoint task.**
- **D-03:** **Document split: `docs/cutover.md` is FUTURE-oriented only; today's go-live verification lives in `.planning/phases/06-.../06-UAT.md`.** `docs/cutover.md` is the only repo doc Phase 6 produces — narrow, focused, written for "me 6 months from now" when marketing-app is ready. Today's launch checklist is GSD-internal verification (06-UAT.md) and stays in `.planning/`. No `docs/launch-checklist.md`. **Why:** keeps `docs/cutover.md` from getting fat and mixing two timelines; matches the GSD convention where phase verification lives in phase artifacts, not repo docs.
- **D-04:** **Legacy redirects in cutover.md = verification step only, no pre-scripted rules.** cutover.md includes "Step N: walk marketing-app's route map; verify `/`, `/privacy`, `/terms`, `/unsubscribe`, `/sitemap.xml`, `/robots.txt` resolve there." No pre-scripted redirect rules — those are decided at cutover-day-minus-1 against marketing-app's actual route shape, which doesn't exist yet. **Why:** pre-scripting today against a route surface that may shift before cutover is staleness-prone; the verification step forces alignment without freezing the redirect map prematurely.

### Dry-run scope on staging subdomain
- **D-05:** **Dry-run fidelity: full — real domain transfer back-and-forth between two real Vercel projects.** Bind `staging.useQuibly.com` to `quibly-landing` (team-level) → verify it loads → atomic-transfer to the existing `marketing-app` Vercel project (same team) → verify it loads from marketing-app → atomic-transfer back to quibly-landing → verify it loads again. Exercises the actual Vercel UI flow + DNS propagation timing — the one piece SUMMARY.md flags as MEDIUM-confidence research. **Why:** simulating the steps doesn't catch team-level / project-config / UI-flow divergences that only manifest in a real transfer; dry-run is cheap insurance against a cutover-night surprise.
- **D-06:** **Transfer destination: existing `marketing-app` Vercel project (same Vercel team).** Highest fidelity — the dry-run uses the actual destination of the future real cutover, catching any team-level or project-config divergence. Requires marketing-app to be deployable (even minimally) on Vercel and bound at the same team scope. If marketing-app isn't yet deployable at Phase 6 plan time, planner adjusts to a throwaway placeholder project in the same team — but the recommendation is to use the real target.
- **D-07:** **Dry-run scope: transfer mechanics + smoke load only.** Bind → load → transfer → load → transfer back → load. Does NOT write to Resend during the dry-run (Phase 4 already validated the email path against the preview audience; the staging subdomain shares the production sender domain so DKIM alignment is already proven). Does NOT configure a separate staging sender (e.g., `hello@staging.useQuibly.com`) — heavyweight DNS for one-time use; the apex DNS is what matters at cutover, not the staging subdomain's. **Why:** keeps the dry-run focused on the one unknown (cross-project transfer UI), not re-litigating already-validated email infrastructure.

### Launch broadcast — timing & mechanism
- **D-08:** **Broadcast timing: pre-cutover, from `quibly-landing`.** While `useQuibly.com` still serves `quibly-landing`, send the launch broadcast from `hello@useQuibly.com` via Resend Audience. Subscribers see "Quibly is live!" → click through to `useQuibly.com` → by then or shortly after, marketing-app has taken over the apex. **Why:** keeps the trusted sender continuity (same `hello@useQuibly.com` that sent welcome emails); lowest spam-folder risk (subscribers already have a Resend `hello@` from this domain in their inbox); SUMMARY.md recommendation.
- **D-09:** **Broadcast mechanism: Resend Broadcasts UI.** Native Resend Broadcasts — same account, same audience, same verified sender domain. Zero new vendor. cutover.md notes "Compose broadcast in Resend Dashboard → select Quibly Waitlist audience → preview → send." No code in this repo for the broadcast itself. **Why:** UI is acceptable for a single solo-founder broadcast; custom transactional-API loop risks getting suppression-list / List-Unsubscribe handling wrong and loses Resend's broadcast deliverability tooling.

### Security headers + HSTS surface
- **D-10:** **Headers defined in `next.config.ts` `async headers()` block.** Framework-native, type-safe via `NextConfig`, co-located with Next config. Source pattern `/(.*)` so headers apply to every route (including legal pages and OG image route). **Why:** vercel.ts adds a config file for marginal benefit; Routing Middleware pulls runtime cost into every request for static headers; next.config.ts is the idiomatic Next-only home and matches CLAUDE.md's Recommended Stack posture.
- **D-11:** **Header set: standard hardening set, no CSP.** Five headers ship in Phase 6:
  ```
  Strict-Transport-Security: max-age=300                    (DEPLOY-06 — NOT preload)
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
  ```
  **CSP is explicitly deferred** to a future spike. Vercel Analytics, Speed Insights, OG image rendering, Google Fonts, and Sonner all have specific CSP needs; getting any one wrong silently breaks the page. CSP regressions are expensive to debug. Phase 6 ships strong hardening with zero breaking risk; CSP gets its own focused spike post-launch when there's traffic to validate against. **Why:** the cutover-reversibility constraint forbids HSTS preload (anything persisting past cutover); CSP is per-request and reversible but high-blast-radius — best done with dedicated focus.

### Claude's Discretion
- **CD-01:** **Exact `next.config.ts` `headers()` array shape.** Standard Next 16 pattern: `async headers() { return [{ source: '/(.*)', headers: [{ key: 'Strict-Transport-Security', value: 'max-age=300' }, ...] }] }`. Claude wires during planning; researcher confirms current Next 16 type signature.
- **CD-02:** **`docs/cutover.md` writing voice / structure.** Step-numbered runbook (1, 2, 3...). Each step: short imperative, one-paragraph "what to verify before moving on", one-paragraph "what could go wrong here". Tone: "me 6 months from now" — assumes founder context but spells out non-obvious Vercel UI steps. Claude drafts during planning; founder edits in PR. Length target: 200–500 lines.
- **CD-03:** **Service Worker absence verification mechanism.** Claude picks during planning between (a) a CI grep test ensuring no `/(register|navigator\.serviceWorker)/` in `app/` or `lib/` source, (b) a Playwright spec asserting `navigator.serviceWorker.controller === null` on production load, or (c) a manual checkpoint task in 06-UAT.md (DevTools → Application → Service Workers → empty). Recommendation: (c) — minimal, one-time, sufficient for pre-launch.
- **CD-04:** **Resend domain re-verification at team level (DEPLOY-03).** Phase 4 verified the sender domain at the Vercel project level; Phase 6 needs to confirm whether re-binding to team scope is needed for the future cross-team transfer to inherit it cleanly, or if it's already team-bound. Researcher verifies Vercel + Resend integration semantics during planning; planner picks the migration step (or no-op).
- **CD-05:** **Staging subdomain DNS source.** `staging.useQuibly.com` — does the apex DNS provider (Vercel-managed nameservers? Cloudflare? other?) own this CNAME, or does it need adding manually before binding to Vercel? Researcher verifies during planning. If Vercel manages nameservers (likely, given team-level apex binding), the CNAME is auto-created on Vercel domain bind.
- **CD-06:** **`docs/cutover.md` location in repo.** `docs/cutover.md` (no `docs/` directory exists yet — Phase 6 creates it). Standard convention; Claude wires during planning.
- **CD-07:** **`06-UAT.md` checklist format.** Match the format used in 04-UAT.md and 05-UAT.md (numbered tests with PASS/FAIL/NOTES columns, evidence requirements). Claude wires during planning.
- **CD-08:** **Production mail-tester score evidence retention.** 06-UAT.md notes "paste mail-tester URL + screenshot of 10/10 score into UAT comment". Claude wires the checkpoint task during planning.

### Folded Todos
None — `gsd-sdk query todo.match-phase 6` returned 0 matches.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project planning
- `CLAUDE.md` — Recommended Stack §"Hosting" (Vercel apex `useQuibly.com`, one-step domain swap when marketing-app takes over); §"Specific Architectural Decisions" §"Bot/spam protection" notes Vercel's native edge cache; "Vercel Knowledge Updates (2026-02-27)" SessionStart context — `vercel.ts` is the new TypeScript config, but D-10 picks `next.config.ts` `headers()` instead.
- `.planning/PROJECT.md` — Constraints §Domain (`useQuibly.com` apex, one-step domain swap when marketing-app takes over); §Lifecycle (audience portable for cutover, CSV export sufficient for cutover migration).
- `.planning/REQUIREMENTS.md` §Production Deploy (DEPLOY-01..09) — full spec.
- `.planning/ROADMAP.md` §"Phase 6: Production Deploy + Cutover Runbook" — five success criteria, runbook step skeleton (verify marketing-app ready → CSV export → broadcast timing → atomic Vercel transfer → legacy redirects → decommission steps → rollback plan), §"Phase Ordering Rationale" ("`deploy` as a single button-click is how cutover bugs happen").
- `.planning/STATE.md` — Current Position section; §Blockers/Concerns lists Phase 4 prerequisites (postal address — now closed per D-02) and Phase 5 robots-decision (closed in 05-CONTEXT.md). After Phase 6 plan: STATE.md should be updated to reflect closure of the Phase 4 + Phase 5 launch-gating carry-overs (per D-02 verbal confirmation).
- `.planning/research/SUMMARY.md` — §"Phase 6" (delivers list); §"Research Flags" — Phase 6 cross-team Vercel domain transfer UI flow (verify dry-run on staging subdomain before real cutover); §"Confidence Assessment" — Architecture HIGH except MEDIUM on cross-team UI flow; §"Sources" — Vercel "Instantly Transfer Domains" changelog.
- `.planning/research/STACK.md` — Vercel platform pinning; Next 16 `next.config.ts` `headers()` pattern context.
- `.planning/research/PITFALLS.md` — deliverability already addressed in Phase 4; Phase 6 inherits SPF/DKIM/DMARC alignment requirements.
- `.planning/research/ARCHITECTURE.md` — environment variable / `lib/env.ts` / `import 'server-only'` boundaries; Phase 6 introduces no new env vars.

### Prior phase context (this repo)
- `.planning/phases/05-legal-seo-analytics/05-CONTEXT.md` — **must-read.**
  - Phase 5 closed: privacy + terms live, OG image, sitemap, robots, JSON-LD, Vercel Analytics + Speed Insights mounted, zero-cookie verified, OG validated. Phase 6 only re-verifies these against the production apex.
  - **CD-07** unresolved: `privacy@useQuibly.com` DSAR mailbox is a founder action item flagged as a launch-gating checkpoint — D-02 places it in 06-UAT.md.
- `.planning/phases/04-resend-wiring-bot-protection-welcome-email/04-CONTEXT.md` — **must-read.**
  - Phase 4 mail-tester 10/10 was verified against the preview audience / preview deploy; Phase 6 re-verifies against the production apex per DEPLOY-05.
  - `RESEND_FROM_POSTAL_ADDRESS` real value swapped in (per D-02 verbal confirmation); production guard via Zod refine in `lib/env.ts` already enforces no placeholder in production.
  - Welcome email + List-Unsubscribe + RFC-8058 unsubscribe round-trip already validated; Phase 6 re-verifies against production apex sender path.
- `.planning/phases/02-static-landing-page-no-form/02-CONTEXT.md` — Phase 2 D-19/D-27 footer href contract (`/privacy`, `/terms`); Phase 6 must NOT touch routes already locked by Phase 5.
- `.planning/phases/01-scaffold-brand-token-parity/01-CONTEXT.md` — env validation strategy: Phase 6 adds NO new env vars (no new secrets to provision); the `gitleaks` pre-commit hook (Phase 1 Plan 04) continues to apply.
- `next.config.ts` — currently empty (`const nextConfig: NextConfig = {}; export default nextConfig`). Phase 6 extends with the `async headers()` block per D-10/D-11.
- `lib/env.ts` — DO NOT add new vars in Phase 6.
- `app/layout.tsx` — has `metadataBase: new URL('https://useQuibly.com')`; Phase 6 confirms this is correct against the production apex.
- `package.json` — Phase 6 adds NO new dependencies.

### Marketing-app prior art (read for pattern reference)
- `/Users/jeff/repos/marketing-app/docs/PRODUCTION-CUTOVER-REMOVE-CLIPROXYAPI.md` — single-precedent runbook in marketing-app's `docs/`. Format reference for `docs/cutover.md` (step-numbered, "what could break" notes, GSD command callouts). NOT a content match — that doc is a code-removal cutover, not a domain swap.
- `/Users/jeff/repos/marketing-app/.planning/` — verify Phase 17 (Landing + Legal pages) coverage exists for legacy-redirect verification step (D-04).
- `/Users/jeff/repos/marketing-app/next.config.ts` (or `.js`) — header config pattern reference if any exists.

### External docs
- [Next.js 16 `next.config.ts` `headers()`](https://nextjs.org/docs/app/api-reference/config/next-config-js/headers) — `async headers()` return type, `source` glob patterns, header key/value shape.
- [Vercel Domains — Instantly Transfer Domains](https://vercel.com/changelog/instantly-transfer-domains) — atomic same-team transfer flow.
- [Vercel — Add Domain to Team](https://vercel.com/docs/projects/domains/add-a-domain) — team-level vs project-level binding semantics.
- [Vercel — Cross-team domain transfer flow](https://vercel.com/docs/projects/domains/transferring-shared-domains) — cross-team UI flow (SUMMARY.md MEDIUM-confidence research flag); researcher verifies during planning.
- [HSTS RFC 6797](https://datatracker.ietf.org/doc/html/rfc6797) — `Strict-Transport-Security` semantics; `max-age=300` rationale (5-min reversibility window).
- [`Permissions-Policy` MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy) — directive syntax for `camera=()`, `microphone=()`, `geolocation=()`, `interest-cohort=()`.
- [`Referrer-Policy` MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy) — `strict-origin-when-cross-origin` semantics.
- [Resend Broadcasts](https://resend.com/docs/dashboard/broadcasts/introduction) — Dashboard UI flow for D-09; audience selection, send-time scheduling.
- [`mail-tester.com`](https://www.mail-tester.com/) — re-verification surface for DEPLOY-05 against production apex.
- [opengraph.xyz](https://www.opengraph.xyz/) + [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) + [X Card Validator](https://cards-dev.twitter.com/validator) — re-verification surfaces for production apex (Phase 5 already validated against preview).
- [FTC CAN-SPAM Compliance Guide](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business) — postal-address requirement; carryover from Phase 4 (closed per D-02).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`next.config.ts`** — currently empty (`const nextConfig: NextConfig = {}`). Phase 6 extends with the `async headers()` block per D-10. Single edit point; no other config files (`vercel.json` / `vercel.ts`) exist.
- **`lib/env.ts`** — already has `RESEND_FROM_POSTAL_ADDRESS` Zod-refined env. Phase 6 adds no new env vars.
- **`app/layout.tsx`** — `metadataBase: new URL('https://useQuibly.com')`; `<Analytics />` + `<SpeedInsights />` mounted in Phase 5. Phase 6 verifies these resolve correctly from the production apex.
- **`app/page.tsx`** — composition locked Phase 2 D-16; Phase 5 may have injected JSON-LD. Phase 6 doesn't touch this file.
- **`components/sections/footer.tsx`** — DO NOT TOUCH (Phase 2 D-19/D-27).
- **`components/sections/waitlist-form-section.tsx`** — DO NOT TOUCH; Phase 5 added consent microcopy.
- **`app/actions/join-waitlist.ts`** — locked contract (Phase 3 D-09/D-10); Phase 6 doesn't change.
- **`app/(legal)/privacy/page.tsx`** — Phase 5 ships; Phase 6 verifies the `privacy@useQuibly.com` mailbox referenced in this page is real (D-02 carryover).

### Established Patterns
- **`next.config.ts` minimal-config posture** — Phase 6 keeps the file minimal; adds only the `headers()` block. Does not introduce `experimental` flags, image config, or any other change.
- **Hard-crash env validation** (Phase 1 D-08/D-10) — Phase 6 doesn't touch `lib/env.ts`.
- **GitHub Actions CI gates** (Phase 2 D-33/D-34, Phase 3 D-18) — Lighthouse mobile ≥90 + Vitest + Playwright already gate every PR. Phase 6 inherits; the new `headers()` block must not regress Lighthouse (security headers don't affect LCP/CLS/INP, but the CI gate is the safety net).
- **`gitleaks` pre-commit hook** — Phase 6 introduces no new secret patterns; existing coverage continues.
- **Phase artifacts under `.planning/phases/${padded_phase}-${slug}/`** — Phase 6 follows the same convention. UAT.md, CONTEXT.md, RESEARCH.md, PLAN.md, etc. all live in `.planning/phases/06-production-deploy-cutover-runbook/`.

### Integration Points
- **`next.config.ts`** (MODIFY) — add `async headers()` block per D-10/D-11; ~30 lines including the 5-header array.
- **`docs/cutover.md`** (NEW; new `docs/` directory) — future-oriented runbook per D-03, with sections for: pre-flight, CSV export, pre-cutover broadcast (D-08/D-09), atomic Vercel cross-project transfer, post-flip smoke test, legacy-route verification (D-04), decommission, rollback path (D-01 — cold storage).
- **`.planning/phases/06-.../06-UAT.md`** (NEW) — today's go-live verification checklist per D-03/D-02; includes prod mail-tester re-check, prod real-signup test, OG/sitemap/robots prod probe, `privacy@useQuibly.com` mailbox-reachable test, dry-run cutover transfer back-and-forth on `staging.useQuibly.com` per D-05/D-06/D-07, no-Service-Worker verification per CD-03.
- **`.planning/STATE.md`** (UPDATE during plan or close) — reflect Phase 4 + Phase 5 carry-over closures (postal address, Outlook/iCloud, zero-cookie, OG validation) per D-02.
- **`.planning/PROJECT.md`** (POSSIBLE UPDATE during close) — Active requirements list "Deploy at `useQuibly.com` on Vercel" should move to Validated after Phase 6 ships.
- **Vercel Dashboard** (manual) — apex domain bound at Vercel **team** level (DEPLOY-02); Resend domain at team level (DEPLOY-03 — researcher verifies migration step or no-op via CD-04).
- **Resend Dashboard** (manual) — verify production audience reachable via API key already provisioned; broadcast composition happens here at launch time (D-09).
- **DNS provider** (manual) — confirm `useQuibly.com` apex Resend records (SPF + 3× DKIM + DMARC + Return-Path) survive any team-level rebinding (D-04).

</code_context>

<specifics>
## Specific Ideas

- **`docs/cutover.md` is the only repo-doc artifact this phase produces.** Tone: "me 6 months from now" — assumes founder context but spells out non-obvious Vercel UI steps. Step-numbered, with "what to verify before moving on" + "what could go wrong here" inline per step. The marketing-app `docs/PRODUCTION-CUTOVER-REMOVE-CLIPROXYAPI.md` is a structural reference (step-numbered, "What could break" callouts), NOT a content match — that doc is code-removal, this is domain-swap.
- **The dry-run is the highest-value Phase 6 deliverable.** SUMMARY.md flags cross-team Vercel domain transfer UI as MEDIUM-confidence research; the dry-run resolves it. Don't shortcut to a walk-through. The full transfer-back-and-forth between quibly-landing and marketing-app projects (same team) catches team-level / project-config / UI-flow divergences that simulation misses.
- **HSTS `max-age=300` is the safety net for D-01's "smoke-test then commit" rollback posture.** 5-min reversibility per request — if cutover-night smoke test fails, transfer the apex back to `quibly-landing` within minutes and most clients haven't yet cached HSTS for longer. If `max-age` were `preload` or even multi-day, rollback would brick reversibility for those clients. DEPLOY-06 is non-negotiable; verify on production via curl `-I` after deploy.
- **Phase 6 launch-gate items are MOSTLY closed.** 4 of 5 carry-overs from Phases 4–5 are already done (postal address real, Outlook/iCloud spot-checked, zero-cookie verified, OG validated). The ONLY open item is `privacy@useQuibly.com` mailbox provisioning — easy to forget, easy to ship without, but a privacy-policy contract violation if a DSAR comes in and the mailbox doesn't exist. Make this a hard-blocker checkpoint task in 06-UAT.md.
- **Resend Broadcasts UI for the launch broadcast keeps everything in one vendor.** Same audience, same sender, same DKIM. Don't write a one-off send-broadcast.ts; you'll get suppression-list / `List-Unsubscribe-Post` / one-click handling subtly wrong, and Resend's dashboard already does this correctly. cutover.md just says "Compose broadcast in Resend Dashboard → Broadcasts → New Broadcast → select Quibly Waitlist audience → preview → send." Maybe 3 sentences.
- **Pre-cutover broadcast ordering rationale.** Subscribers know `hello@useQuibly.com` (welcome email sender). Sending the launch announcement from the SAME sender, BEFORE the apex flips, keeps inbox-placement consistent — Gmail/Outlook reputation accrues to the sender, not the apex. After cutover, marketing-app may use a different sender or send pattern; starting fresh there for the launch broadcast risks spam-folder placement at the worst possible moment. Pre-cutover send is reputation-preserving.
- **CSP is deliberately deferred.** Vercel Analytics, Speed Insights, OG image rendering (`@vercel/og`), Google Fonts, and Sonner all have specific CSP needs. Get any one wrong and you silently break the page. Phase 6 ships strong hardening (HSTS + 4 standard headers) with zero breaking risk; CSP gets its own focused spike when there's traffic to measure regression against.
- **The dry-run involves real DNS propagation timing.** Vercel's atomic-transfer is instantaneous at the platform level, but downstream resolvers may cache. Document expected propagation in cutover.md: most clients see the swap within seconds; some may take 60–300s; HSTS=300 means any inconsistency self-resolves within 5 min.
- **STATE.md and PROJECT.md hygiene.** Carry-over closures (D-02) should be reflected in STATE.md "Blockers/Concerns" cleanup and PROJECT.md "Active → Validated" moves during plan-phase or close-phase. Don't lose the cleanup just because the items are already done.

</specifics>

<deferred>
## Deferred Ideas

- **Content-Security-Policy (CSP) header** — D-11 explicitly defers. Treat as a focused future spike (post-launch) with traffic to validate against. Vercel Analytics + Speed Insights + `@vercel/og` + Google Fonts + Sonner all have specific allow-list needs; high blast radius if mis-configured.
- **Active monitoring window with hard rollback triggers** — D-01 picked "smoke-test then commit"; the alternative ("30-min observation window with documented rollback triggers") is the upgrade path if cutover-night surprises happen at low pre-launch volume. Note for v1.x runbook revision.
- **Pre-scripted legacy redirect rules in cutover.md** — D-04 picked verification step only; if marketing-app's route surface is finalized before cutover-day-minus-1, runbook can be tightened to enumerate `/privacy`, `/terms`, `/unsubscribe`, `/sitemap.xml`, `/robots.txt` redirects explicitly. Defer until marketing-app's route map exists.
- **Throwaway placeholder Vercel project for dry-run** — D-06 picked "existing marketing-app project"; if marketing-app isn't deployable when Phase 6 plans, fallback to a hello-world placeholder in the same Vercel team. Planner-time decision, not a structural deferral.
- **Hybrid pre-cutover-and-post-cutover broadcast strategy** — D-08 picked pre-cutover only. If launch-day analytics show subscribers haven't clicked through within 24h of the pre-cutover broadcast, a post-cutover follow-up from marketing-app is a v1.x option. Watch for fatigue/spam-marking risk on the second send.
- **CSV export → external broadcaster (ConvertKit / Beehiiv / Substack)** — D-09 picked Resend Broadcasts UI. If Quibly post-launch grows a newsletter operation that's better served by ConvertKit/Substack, migration is a v1.x decision. Resend Audience CSV export is the bridge.
- **Custom send-broadcast.ts script via Resend transactional API** — D-09 rejects this. If a future broadcast needs templating/personalization beyond Resend Broadcasts UI, build this as a v2 feature with proper suppression-list and List-Unsubscribe handling.
- **Service Worker absence enforced via CI grep test (CD-03 alt a)** — recommended manual checkpoint instead. Promote to a CI gate if Service Worker code accidentally lands in a future PR (low-probability for a static landing page).
- **vercel.ts config file** — D-10 picked `next.config.ts`; if Phase 6 grows beyond Next-managed config (custom build steps, complex rewrites), `vercel.ts` becomes attractive. Not needed for v1.
- **Re-validating Phase 4/5 items already complete** — postal address, Outlook/iCloud spot-check, zero-cookie verification, OG validation. Per D-02, these are closed; don't re-run them in Phase 6 unless a regression signal appears.

</deferred>

---

*Phase: 6-Production Deploy + Cutover Runbook*
*Context gathered: 2026-04-29*
