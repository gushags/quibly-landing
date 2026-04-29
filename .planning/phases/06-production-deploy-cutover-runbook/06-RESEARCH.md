# Phase 6: Production Deploy + Cutover Runbook - Research

**Researched:** 2026-04-29
**Domain:** Vercel team-level domain binding, cross-project atomic transfer, Next.js 16 `headers()` security hardening, Resend DNS verification at apex, mail-tester re-verification, cutover runbook authorship
**Confidence:** HIGH

## Summary

Phase 6 is overwhelmingly a **runbook + small config additions** phase, not a code-heavy phase. The risky technical surface is narrow (one `next.config.ts` `headers()` block) but the operational surface is wide (apex bind, Resend DNS verify, mail-tester score, dry-run cross-project transfer, `docs/cutover.md`). This research confirms the decisions in 06-CONTEXT.md, resolves the four open Claude's-Discretion items (CD-01..CD-05), and supplies precise verification commands for every Phase 6 success criterion.

**Most important findings:**
1. **Vercel cross-project domain transfer on the same team is genuinely atomic** [VERIFIED: vercel.com/docs/domains/working-with-domains/transfer-your-domain]. Vercel calls this "Move Domain" — accessed from the team's Domains tab → context menu next to the domain → **Move**. DNS records on the apex (the Resend SPF/DKIM/DMARC TXT records) survive untouched because they live on the DNS provider, not on the Vercel project. **Project-level associations are preserved by default** ("all existing project domains associated with them will remain and not be moved to prevent service disruption"), so the Move flow is the wrong primitive — what Phase 6 actually needs is the **"transfer-while-in-use" same-team flow**: change the project assignment in `Project → Settings → Domains` of the destination project (Vercel will detect the in-use state and offer to move it atomically). This is the Phase 6 dry-run target.
2. **DNS records survive any project rebinding** as long as the apex DNS provider doesn't change — the records are stored on the registrar (or on Vercel DNS if Vercel-managed nameservers), independent of which project the domain is attached to [VERIFIED: vercel.com/docs/domains/working-with-domains §"Domain ownership"]. Resend SPF/DKIM/DMARC records, custom Return-Path CNAME, and any future records (e.g., MX for `privacy@useQuibly.com` mailbox) are unaffected by project transfers. **This resolves CD-04 with HIGH confidence: no Resend re-verification is needed at cutover** as long as the apex DNS itself isn't re-pointed.
3. **Next.js 16.2 `headers()` emits headers verbatim with no auto-rewriting** [VERIFIED: nextjs.org/docs/app/api-reference/config/next-config-js/headers (v16.2.4, 2026-04-10)]. The `Strict-Transport-Security: max-age=300` value is shipped as-is; Next does not auto-add `includeSubDomains` or `preload`. Headers apply before filesystem checks, so they cover all routes including `/opengraph-image`, `/sitemap.xml`, `/robots.txt`, and `/api/*`. Source pattern `/(.*)` (path-to-regexp regex match) is the canonical "all paths" form.
4. **Phase 6 launch-gate items are mostly closed.** Per 06-CONTEXT D-02: 4 of 5 Phase 4–5 carryovers are already done; only `privacy@useQuibly.com` mailbox provisioning remains. This is the single highest-leverage manual checkpoint for 06-UAT.md — easy to forget, easy to ship without, but a privacy-policy contract violation if a DSAR comes in and the mailbox doesn't resolve.
5. **The dry-run is the highest-value deliverable** (06-CONTEXT specifics). Vercel's official zero-downtime cross-project guide is documented and the same-team flow is well-supported, but UI flow specifics (what exactly the prompt says, whether a confirmation modal appears, propagation timing) only manifest in a real attempt — which is exactly what the dry-run on `staging.useQuibly.com` resolves. Confidence on the team-level UI flow goes from MEDIUM (research) to HIGH (after dry-run).

**Primary recommendation:** Wire `next.config.ts` `headers()` per CD-01 (5-header array, `source: '/(.*)'`); author `docs/cutover.md` per CD-02 (step-numbered runbook, ~200–500 lines); execute the dry-run per D-05/D-06/D-07 against `marketing-app` Vercel project on the same team; gate production exposure on a single 06-UAT.md checklist whose top item is `privacy@useQuibly.com` mailbox reachability.

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Cutover runbook scope & rollback:**
- **D-01:** Rollback posture during cutover swap window: smoke-test then commit. After atomic transfer flips apex from `quibly-landing` to `marketing-app`: (1) curl + browser test the apex loads marketing-app's content, (2) submit a real signup against marketing-app's form, verify Resend audience row + welcome email, (3) check OG/sitemap/robots, (4) wait ~10 min and re-check propagation. Rollback ONLY if hard check fails. HSTS `max-age=300` is the safety net (5-min reversibility per request). cutover.md documents theoretical rollback path but treats it as cold-storage emergency.
- **D-02:** Carry-over launch-gating items: 4 of 5 already complete; only `privacy@useQuibly.com` mailbox provisioning remains TODO. Lives in 06-UAT.md as a launch-gating checkpoint task.
- **D-03:** Document split: `docs/cutover.md` is FUTURE-oriented only; today's go-live verification lives in `.planning/phases/06-.../06-UAT.md`. No `docs/launch-checklist.md`.
- **D-04:** Legacy redirects in cutover.md = verification step only, no pre-scripted rules. cutover.md includes "Step N: walk marketing-app's route map; verify `/`, `/privacy`, `/terms`, `/unsubscribe`, `/sitemap.xml`, `/robots.txt` resolve there."

**Dry-run scope on staging subdomain:**
- **D-05:** Dry-run fidelity: full — real domain transfer back-and-forth between two real Vercel projects. Bind `staging.useQuibly.com` to `quibly-landing` (team-level) → verify it loads → atomic-transfer to existing `marketing-app` Vercel project (same team) → verify it loads from marketing-app → atomic-transfer back to quibly-landing → verify it loads again.
- **D-06:** Transfer destination: existing `marketing-app` Vercel project (same Vercel team). Highest fidelity.
- **D-07:** Dry-run scope: transfer mechanics + smoke load only. Bind → load → transfer → load → transfer back → load. Does NOT write to Resend during dry-run. Does NOT configure separate staging sender.

**Launch broadcast — timing & mechanism:**
- **D-08:** Broadcast timing: pre-cutover, from `quibly-landing`. While `useQuibly.com` still serves `quibly-landing`, send launch broadcast from `hello@useQuibly.com` via Resend Audience.
- **D-09:** Broadcast mechanism: Resend Broadcasts UI. Native Resend Broadcasts — same account, same audience, same verified sender domain. Zero new vendor.

**Security headers + HSTS surface:**
- **D-10:** Headers defined in `next.config.ts` `async headers()` block. Framework-native, type-safe via `NextConfig`. Source pattern `/(.*)` so headers apply to every route.
- **D-11:** Header set: standard hardening set, no CSP. Five headers ship in Phase 6:
  - `Strict-Transport-Security: max-age=300` (DEPLOY-06 — NOT preload)
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`

  CSP is explicitly deferred to a future spike.

### Claude's Discretion

- **CD-01:** Exact `next.config.ts` `headers()` array shape — researcher confirms current Next 16 type signature. **Resolved below in §Code Examples.**
- **CD-02:** `docs/cutover.md` writing voice / structure — step-numbered runbook (1, 2, 3...), 200–500 lines, "me 6 months from now" tone.
- **CD-03:** Service Worker absence verification mechanism — recommendation: manual checkpoint in 06-UAT.md (DevTools → Application → Service Workers → empty). **Resolved below in §Architecture Patterns + §Pitfalls.**
- **CD-04:** Resend domain re-verification at team level — researcher verifies Vercel + Resend integration semantics. **Resolved below in §Pitfalls and §Code Examples — no re-verification needed.**
- **CD-05:** Staging subdomain DNS source — does apex DNS provider auto-create CNAME on Vercel domain bind? **Resolved below in §Code Examples — yes if Vercel nameservers are in use; otherwise manual.**
- **CD-06:** `docs/cutover.md` location — `docs/cutover.md` (new directory).
- **CD-07:** `06-UAT.md` checklist format — match 04-UAT.md / 05-UAT.md format (numbered tests with PASS/FAIL/NOTES).
- **CD-08:** Production mail-tester score evidence retention — paste mail-tester URL + screenshot of 10/10 score into UAT comment.

### Deferred Ideas (OUT OF SCOPE)

- Content-Security-Policy (CSP) header — D-11 explicitly defers to future focused spike.
- Active monitoring window with hard rollback triggers — D-01 picked "smoke-test then commit"; v1.x upgrade path if cutover-night surprises happen.
- Pre-scripted legacy redirect rules in cutover.md — D-04 picked verification step only; defer until marketing-app's route map exists.
- Throwaway placeholder Vercel project for dry-run — D-06 picked existing marketing-app project; fallback only if marketing-app isn't deployable at Phase 6 plan time.
- Hybrid pre-and-post-cutover broadcast strategy — D-08 picked pre-cutover only.
- CSV export → external broadcaster (ConvertKit / Beehiiv / Substack) — D-09 picked Resend Broadcasts UI.
- Custom send-broadcast.ts script via Resend transactional API — D-09 rejects.
- Service Worker absence enforced via CI grep test (CD-03 alt a) — recommended manual checkpoint instead.
- vercel.ts config file — D-10 picked `next.config.ts`.
- Re-validating Phase 4/5 items already complete — closed per D-02.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DEPLOY-01 | Production deployed on Vercel at `useQuibly.com` apex | Vercel "Adding & Configuring a Custom Domain" — Apex domain bound via A record or Vercel nameservers; verified via UI domain status |
| DEPLOY-02 | Apex domain bound at Vercel **team** level (not project level) — enables atomic transfer to `marketing-app` later | Vercel "Working with domains" — domains are owned by a team and listed in the team's Domains tab; project assignment is a separate concept (Project → Settings → Domains). Adding a domain in Project → Settings → Domains automatically registers it in the team's Domains tab. **The "team-level binding" requirement is satisfied as long as the domain owner is the team that owns both projects** — this is the default for any team-owned project. The research confirms this is the standard configuration; no additional step beyond "add domain to project" is needed when the project is owned by the team. |
| DEPLOY-03 | Resend domain verified at Vercel team level (so `marketing-app` inherits at cutover) | Resend DNS records (SPF/DKIM/DMARC/Return-Path) live on the DNS provider for the apex `useQuibly.com`, NOT on Vercel projects. They survive any project transfer. Phase 4's existing verification carries over — no re-verification needed. |
| DEPLOY-04 | Full DNS verification: SPF + 3× DKIM + DMARC `p=none` + Return-Path | Verified via `dig` commands (see §Validation Architecture). Phase 4 verified initial setup; Phase 6 re-verifies against production apex (post any team-level adjustments). |
| DEPLOY-05 | `mail-tester.com` 10/10 score verified before first production send | Re-run from production apex (different audience than Phase 4 preview verification). Manual checkpoint in 06-UAT.md. |
| DEPLOY-06 | HSTS `max-age=300` initially (NOT preload) — keeps cutover reversible | Verified via `curl -I https://useQuibly.com` — exact header value match. Next.js 16.2 `headers()` emits verbatim, no auto-rewrite. |
| DEPLOY-07 | No Service Worker registered (would persist past cutover and break `marketing-app`) | Manual checkpoint per CD-03: DevTools → Application → Service Workers panel must be empty on production load. Optional belt-and-suspenders: grep `app/` and `lib/` for `navigator.serviceWorker` / `register(` patterns. |
| DEPLOY-08 | `docs/cutover.md` written | New file at repo root `docs/cutover.md`; structure per CD-02 (200–500 lines, step-numbered, with what-to-verify and what-could-go-wrong inline per step). |
| DEPLOY-09 | Cutover dry-run executed on a staging subdomain before launch | `staging.useQuibly.com` bound to `quibly-landing` (auto-CNAME via Vercel nameservers if in use; else manual CNAME) → transferred to `marketing-app` → transferred back. Documented in 06-UAT.md per D-05/D-07. |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| HTTP security header emission | Frontend Server (Next.js `next.config.ts`) | CDN/Vercel edge | Next.js framework emits headers per route; Vercel platform passes them through. Single source of truth in code (D-10). |
| Apex domain → project routing | CDN / Vercel platform | — | Apex `useQuibly.com` resolves via Vercel's anycast network → project assignment routes to current production deployment. No app-tier code involved. |
| Resend SPF/DKIM/DMARC verification | DNS provider (apex zone) | Resend sender domain config | DNS records live on the DNS zone of the apex (Vercel-managed nameservers or external). Independent of which Vercel project owns the apex routing. |
| `staging.useQuibly.com` subdomain DNS | DNS provider (apex zone) | Vercel project assignment | If Vercel nameservers manage the apex, subdomains auto-resolve when added to a project. If external nameservers, need manual CNAME. |
| Cutover atomic transfer | CDN / Vercel platform | — | Vercel "Move Domain" UI flow on the team's Domains tab — single-click, atomic, DNS-record-preserving. Visitor-facing operation; no app-tier code. |
| Pre-cutover launch broadcast | API / Resend platform (Broadcasts UI) | — | Resend Dashboard composes + sends; no code in this repo. Audience already exists from Phase 4. |
| `privacy@useQuibly.com` DSAR mailbox | DNS provider (MX records) + email forwarder | — | Mailbox provisioning is founder action (Resend Inbound, Google Workspace alias, ImprovMX, or other). Code references the address (Phase 5); Phase 6 verifies receipt. |
| Service Worker absence | Browser / Client | — | Verification only — no SW code exists in repo. Manual DevTools check on production load is sufficient at pre-launch volume. |

## Standard Stack

### Core (already in repo, no additions in Phase 6)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | `16.2.4` | `next.config.ts` `async headers()` block — framework-native security header emission | [VERIFIED: nextjs.org/docs/app/api-reference/config/next-config-js/headers v16.2.4 (2026-04-10)] Type-safe, co-located with config, documented `headers` API. |

### Supporting (already in repo)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `resend` | `^6.12.x` | Audience read for CSV export workflow (referenced in cutover.md, no new code) | Already wired in Phase 4 — Phase 6 only documents the export path. |
| Vercel platform | n/a | Domain hosting, atomic transfer, Speed Insights field data review | Apex `useQuibly.com` already deployed at preview level — Phase 6 promotes to production. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `next.config.ts` `headers()` (D-10) | `vercel.json` `headers` | `vercel.json` is platform-specific; `next.config.ts` is framework-native and matches CLAUDE.md "What NOT to Use" → "no extra config files for marginal benefit." Also: Phase 4 / 5 / earlier did not introduce `vercel.json`, keeping config minimal is the established pattern. |
| `next.config.ts` `headers()` | Routing Middleware (`middleware.ts`) | Middleware runs per-request and pulls runtime cost into every request even for static headers. Headers in `next.config.ts` are emitted at the edge by the platform with zero runtime cost. |
| Resend Audience CSV export (cutover.md) | Resend `audiences/contacts/list` API + custom CSV serializer | Manual export (Dashboard → Audiences → [audience] → Export Contacts) is sufficient for one-time cutover migration. API path adds code complexity for a one-time migration. **However: see §Pitfall 6 — Resend's official CSV export changelog [CITED: resend.com/changelog/exports-as-csv-in-beta] lists Emails, Broadcasts, Contacts, Domains, Logs, API keys but does NOT explicitly list Audiences — the Contacts export covers per-audience contact lists.** [ASSUMED: Audiences-scoped contact export is available via the Audience detail page's "Export" affordance — verify empirically during Phase 6.] |

**Installation:** No new dependencies. Phase 6 ships zero new npm packages.

**Version verification:** Already done in Phase 1 (Next 16.2.x) and Phase 4 (Resend ^6.12). No new packages to verify.

## Architecture Patterns

### System Architecture Diagram

```
                     ┌──────────────────────────────────┐
                     │  DNS Provider (apex zone owner)  │
                     │  useQuibly.com NS / A / TXT      │
                     │   - SPF (Resend)                 │
                     │   - 3× DKIM (Resend)             │
                     │   - DMARC p=none (Resend)        │
                     │   - Return-Path CNAME (Resend)   │
                     │   - staging.useQuibly.com CNAME  │
                     │     (auto if Vercel NS, else     │
                     │      manual CNAME to vercel-dns) │
                     └──────────────┬───────────────────┘
                                    │ resolves to
                                    ▼
                     ┌──────────────────────────────────┐
                     │  Vercel Edge Network (anycast)   │
                     │  Apex domain assignment table    │
                     │  → maps useQuibly.com to one     │
                     │    project at a time             │
                     │  → atomic switch on Move Domain  │
                     └──────────────┬───────────────────┘
                                    │ routes to
                                    ▼
        ┌───────────────────────────────────────────────┐
        │  Vercel Project Assignment (team-owned)       │
        │  ┌────────────────┐  ┌────────────────────┐   │
        │  │ quibly-landing │  │ marketing-app      │   │
        │  │ (current)      │  │ (future cutover)   │   │
        │  │  - prod env    │  │  - prod env        │   │
        │  │  - latest dep. │  │  - latest dep.     │   │
        │  └────────┬───────┘  └────────┬───────────┘   │
        └───────────┼─────────────────────┼─────────────┘
                    │ on production deploy
                    ▼
        ┌───────────────────────────────────────────────┐
        │  Production Deployment (Next.js 16.2)         │
        │  next.config.ts → async headers()             │
        │   emits 5 headers on every response:          │
        │    - HSTS max-age=300                         │
        │    - X-Content-Type-Options: nosniff          │
        │    - X-Frame-Options: DENY                    │
        │    - Referrer-Policy: strict-origin-when-x.o. │
        │    - Permissions-Policy: cam/mic/geo/cohort=()│
        │  app routes: /, /privacy, /terms, /robots.txt,│
        │    /sitemap.xml, /opengraph-image, /icon,     │
        │    /apple-icon, /unsubscribe, /api/webhooks/* │
        │  No Service Worker registered (DEPLOY-07)     │
        └───────────────────────────────────────────────┘
```

### Recommended Project Structure

```
quibly-landing/
├── next.config.ts                    # MODIFIED: adds async headers() block (D-10/D-11)
├── docs/
│   └── cutover.md                    # NEW: future-oriented runbook (D-03, ~200–500 lines)
└── .planning/
    └── phases/
        └── 06-production-deploy-cutover-runbook/
            ├── 06-CONTEXT.md         # exists
            ├── 06-RESEARCH.md        # this file
            ├── 06-PLAN.md            # next agent creates
            └── 06-UAT.md             # NEW (created during phase): launch-gating checklist
```

### Pattern 1: Next.js 16.2 `next.config.ts` `headers()` block

**What:** Framework-native HTTP security header emission, applied at the Vercel edge with no runtime cost.

**When to use:** All routes in Phase 6 — apex hardening before public exposure.

**Source:** [VERIFIED: nextjs.org/docs/app/api-reference/config/next-config-js/headers v16.2.4 (2026-04-10)]

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=300',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig
```

**Critical confirmations from Next.js 16.2.4 docs:**
- The function is `async` and returns `Array<{ source: string, headers: Array<{ key: string, value: string }> }>` (typed as `NextConfig['headers']`).
- `source` uses `path-to-regexp` syntax. `/(.*)` matches every path including the apex root, all sub-routes, and file-convention routes (`/robots.txt`, `/sitemap.xml`, `/opengraph-image`, `/icon`, `/apple-icon`).
- **Headers are emitted verbatim** — no auto-injection of `includeSubDomains` or `preload` for HSTS. The exact header sent on the wire is `Strict-Transport-Security: max-age=300`.
- "Headers are checked before the filesystem which includes pages and `/public` files" — meaning the 5 headers cover even `public/` static assets like the favicon SVG.
- Header overriding: if two header rules match the same path with the same key, the last wins. Phase 6 ships only one rule (`/(.*)`), so this is moot.

### Pattern 2: Vercel "Move Domain" Cross-Project Transfer (Same Team)

**What:** Atomic transfer of an apex (or subdomain) from one Vercel project to another within the same team.

**When to use:** Phase 6 dry-run on `staging.useQuibly.com` (DEPLOY-09); future real cutover when `marketing-app` is ready.

**Source:** [VERIFIED: vercel.com/docs/domains/working-with-domains/transfer-your-domain] + [VERIFIED: vercel.com/changelog/instantly-transfer-domains-to-new-projects] + [VERIFIED: vercel.com/kb/guide/how-to-move-a-domain-between-vercel-projects-with-zero-downtime]

**Two distinct primitives, do not confuse:**

1. **"Move Domain" (team Domains tab)** — moves a domain to **another Vercel team or user**. Used when the destination project is owned by a different team. **NOT what Phase 6 needs** — quibly-landing and marketing-app are on the same team.

2. **"Transfer between projects on same team"** — what Phase 6 actually exercises. Two documented sub-flows:

   **Sub-flow A — Direct Project Settings (recommended, atomic):** In the destination project, navigate to **Settings → Domains → Add Domain → enter `useQuibly.com`**. Vercel detects the in-use state (apex is currently assigned to `quibly-landing`) and surfaces a prompt: *"This domain is currently in use by another project. Move it here?"* Confirming triggers an atomic transfer — DNS records preserved, deployment URL preserved, env vars preserved (each project keeps its own env vars), zero downtime. [CITED: vercel.com/changelog/instantly-transfer-domains-to-new-projects: "When attempting to move a live domain to a new project, a prompt will appear offering to move the in-use domain and all associated redirects to the selected project."]

   **Sub-flow B — CLI alias (zero-downtime override):** `vercel alias set <new-deployment-url> useQuibly.com` aliases the apex to the new project's deployment URL while it remains assigned to the original project. Then remove from old project, add to new. Strictly more work than sub-flow A; only useful if sub-flow A's prompt doesn't appear (e.g., older Vercel version). [CITED: vercel.com/kb/guide/how-to-move-a-domain-between-vercel-projects-with-zero-downtime]

**Pre-conditions (both sub-flows):**
- Both projects must be in the **same Vercel team**.
- Operator must have permissions on both projects (Owner / Member).
- Source project's domain status must be **healthy** (not pending DNS verification).

**What survives the transfer:**
- DNS records on the apex zone (the records live on the DNS provider, not Vercel project state) — **including all Resend SPF/DKIM/DMARC records** [DERIVED from VERIFIED docs: vercel.com/docs/domains/working-with-domains §"Domain ownership"].
- The domain itself remains in the team's Domains tab.
- Custom redirects associated with the domain are moved alongside it [CITED: vercel.com/changelog/instantly-transfer-domains-to-new-projects: "...all associated redirects to the selected project."].

**What does NOT survive (gotchas):**
- Environment variables — each project has its own; the destination project must already have `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`, etc. configured **before** the transfer. **Phase 6 implication:** marketing-app must be configured with its own production env vars before cutover.
- Custom CLI aliases (`vercel alias` outside of project domains) — those are removed when domains move teams. **NOT relevant to same-team transfers**, but called out in the docs to avoid confusion.
- Deployment-specific URLs (`<project>-<hash>.vercel.app`) remain attached to their original project.

**Atomicity:** The Vercel team-internal transfer is documented as atomic from the visitor's perspective — the apex routing flips at the edge in a single propagated change. **Real-world propagation timing** is bounded by:
- Edge cache: ~seconds.
- Downstream resolvers: most clients see the swap within seconds; some may take 60–300s.
- HSTS `max-age=300` (DEPLOY-06) ensures any inconsistency self-resolves within 5 min.

[VERIFIED: vercel.com/docs/domains/working-with-domains/transfer-your-domain] and [VERIFIED: vercel.com/changelog/instantly-transfer-domains-to-new-projects].

### Pattern 3: Vercel Subdomain Auto-DNS for Staging

**What:** Adding `staging.useQuibly.com` to the `quibly-landing` Vercel project automatically creates the DNS records IF the apex is on Vercel-managed nameservers; otherwise requires manual CNAME at the external registrar.

**When to use:** Phase 6 Plan task to bind `staging.useQuibly.com` to `quibly-landing` for the dry-run.

**Source:** [VERIFIED: vercel.com/docs/domains/working-with-domains/add-a-domain] + [VERIFIED: vercel.com/docs/domains/working-with-nameservers]

**Two scenarios:**

| Apex Nameserver Setup | Action Required | Time |
|-----------------------|-----------------|------|
| Vercel nameservers (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`) | None — auto-CNAME created when subdomain is added in **Project → Settings → Domains → Add Domain → `staging.useQuibly.com`**. Vercel auto-issues SSL on add. | < 60 sec |
| External nameservers (Cloudflare / domain registrar) | Manually add CNAME record at the external DNS provider: `staging` → `cname.vercel-dns.com`. Then add subdomain in Project → Settings → Domains. SSL issuance after CNAME propagation. | 1–10 min for DNS propagation |

**Phase 6 prerequisite for the planner:** Determine which nameserver setup `useQuibly.com` is on. Check via `dig +short ns useQuibly.com` (HIGH-confidence command). If the response is `ns1.vercel-dns.com.` and `ns2.vercel-dns.com.`, scenario 1 applies and the staging subdomain is a one-click add. Otherwise scenario 2.

**Resolves CD-05.**

### Pattern 4: cutover.md Step-Numbered Runbook

**What:** Future-oriented runbook authored as `docs/cutover.md`; each step has a short imperative + "what to verify before moving on" + "what could go wrong here" inline (per CD-02). Length target 200–500 lines.

**When to use:** Phase 6 Plan task to author the file.

**Source:** Pattern reference [VERIFIED: marketing-app/docs/PRODUCTION-CUTOVER-REMOVE-CLIPROXYAPI.md] — different content (code-removal, not domain-swap), but the structure is the right shape:

- H1 title + 1-paragraph "what this is and when to use it"
- "Prerequisites" bulleted list
- "Step N: <Action>" sections with: imperative paragraph, "What to verify" sub-section, "What could break" sub-section, GSD command callouts where applicable
- "Rollback Plan" section near the end
- "Summary Checklist" of verification items at end

**Phase 6 cutover.md skeleton (per 06-CONTEXT in-scope list):**

```
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

### Anti-Patterns to Avoid

- **Hard-coding a `redirect()` rule for old paths in cutover.md** — D-04 prohibits. marketing-app's route map doesn't exist yet; pre-scripting is staleness-prone.
- **Adding HSTS preload "while we're at it"** — DEPLOY-06 forbids. Persists past cutover, breaks reversibility for browsers that have cached the directive.
- **Authoring cutover.md as a launch checklist for TODAY** — D-03 prohibits. Today's go-live verification lives in 06-UAT.md (GSD-internal). cutover.md is "me 6 months from now."
- **Writing a custom Resend broadcast script** — D-09 prohibits. Resend's Broadcasts UI handles `List-Unsubscribe-Post`, suppression list, click tracking correctly; a custom script will get one of these subtly wrong.
- **Writing a `vercel.json` to wire headers** — D-10 picks `next.config.ts`. Two config files for one concern is redundancy.
- **Adding `vercel.ts`** — Same reasoning. CLAUDE.md mentions `vercel.ts` exists in Next 16 but D-10 explicitly chose `next.config.ts` as the canonical home for this app's config.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Atomic apex domain transfer | A "drain old project + add to new project + repoint DNS" script | Vercel Project → Settings → Domains "in-use prompt" or `vercel alias set` (sub-flow B) | DNS races, partial state, certificate issuance gaps. The platform-native flow is atomic and zero-downtime. |
| Security header emission | A `middleware.ts` that sets headers per request | `next.config.ts` `headers()` | Middleware runs in the edge runtime per-request and adds latency for static headers. The `headers()` API is emitted by the platform with zero runtime cost. |
| Pre-cutover launch broadcast | A Server Action / cron / `send-broadcast.ts` looping over Resend audience | Resend Dashboard → Broadcasts → New Broadcast | Suppression list handling, RFC 8058 `List-Unsubscribe-Post` headers, send-time scheduling, deliverability tracking. Resend's UI does all of this; a custom script will subtly miss one and torch sender reputation at the worst possible moment. |
| Service Worker absence detection | A scheduled scraper or production probe | Manual DevTools checkpoint in 06-UAT.md (CD-03 recommendation) | No SW code exists in this repo. Pre-launch volume + zero existing SW source means a one-time check on production load is sufficient. CI grep is optional belt-and-suspenders but adds maintenance for low-probability regression. |
| Mail-tester score retrieval | An API integration / scraper | Manual run + screenshot in 06-UAT.md (CD-08) | mail-tester.com has no API. Manual is the standard; one-time per phase. |
| Resend Audience CSV export | A `lib/audience-export.ts` script using `resend.contacts.list()` + custom CSV serializer | Resend Dashboard → Audiences → [audience] → Export | Adds code surface for a one-time migration. Resend's exports include the standard contact fields (id, email, names, created_at, unsubscribed). [ASSUMED: custom properties like `consent_version` are included in the Audience-scoped contact export — verify empirically during Phase 6 when the dry-run also exercises the export path.] If the export drops custom properties, the API path becomes a justified fallback — but build it then, not now. |

**Key insight:** Phase 6 is overwhelmingly about platform-native operations (Vercel domain UI, Resend Dashboard, manual DNS verification). Do not introduce code that wraps these — every wrapper adds maintenance cost and a divergence vector at cutover time, which is the worst possible time to discover the wrapper was wrong.

## Runtime State Inventory

> Phase 6 is a deploy / config-additions phase, not a rename / refactor. The Runtime State Inventory framework still applies because the cutover (FUTURE step in cutover.md) is a stateful operation. Documenting the state inventory now means the future cutover doesn't surface surprises.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Resend Audience "Quibly Waitlist" (production) — N contacts as of Phase 6 ship time, each carrying `consent_version` property; Resend Audience "Quibly Waitlist (Preview)" (preview) — small set of test contacts. | At cutover: CSV export from production audience (cutover.md Step 2). marketing-app re-imports if needed, OR keeps the same Resend account and reads from the same audience (no migration needed since both projects share the Resend account per Phase 4 architecture). |
| Live service config | Resend production sender domain `useQuibly.com` (verified DNS); Resend Audiences UI configuration; Vercel project env vars (`RESEND_API_KEY`, `RESEND_AUDIENCE_ID`, `RESEND_AUDIENCE_PREVIEW_ID`, `RESEND_WEBHOOK_SECRET`, `UPSTASH_*`, `RESEND_FROM_POSTAL_ADDRESS`, `NEXT_PUBLIC_SITE_URL`); Resend webhook subscription endpoint pointing at `quibly-landing.vercel.app/api/webhooks/resend` (or apex equivalent). | At cutover: marketing-app project must have its own copies of these env vars (Vercel does not transfer env vars cross-project). marketing-app's Resend webhook endpoint URL changes — re-register webhook in Resend Dashboard. **Phase 6 plan must include a checkpoint task that verifies env vars are configured in the destination project BEFORE the cutover transfer**, even though the dry-run on staging.useQuibly.com sidesteps this by not writing to Resend (D-07). |
| OS-registered state | None — Vercel platform; no on-host state. | None. |
| Secrets / env vars | Production Vercel env scope (`RESEND_API_KEY` etc. — already provisioned per Phase 4). `lib/env.ts` Zod-refines `RESEND_FROM_POSTAL_ADDRESS` to reject placeholder in production (per Phase 4 D-10 closure); no placeholder regression risk. **No new secrets in Phase 6.** | At cutover: founder confirms marketing-app's Vercel project has equivalent env scope set BEFORE the transfer (cutover.md Step 1 sub-checklist). |
| Build artifacts | None new. | None. |

**Nothing found in OS-registered state:** None — Vercel-hosted Next.js application; no on-host services, no Windows Task Scheduler / launchd / systemd / pm2 equivalents.

## Common Pitfalls

### Pitfall 1: Accidentally shipping HSTS `preload` directive

**What goes wrong:** Setting `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` in `next.config.ts` (a copy-paste from MDN's "default" example or Next docs' example, both of which use 2-year preload [CITED: nextjs.org/docs/app/api-reference/config/next-config-js/headers §Strict-Transport-Security]). Browsers honor `preload` for the full duration, persists past cutover, breaks marketing-app's reversibility window.

**Why it happens:** Both MDN and the Next.js docs' header example default to long-max-age preload. Anyone copying without thinking inherits the wrong policy for a pre-launch site that needs reversibility.

**How to avoid:** D-11 locked the value to literally `max-age=300` — no other tokens. Phase 6 Plan task must cite this constraint at the source code site (comment in `next.config.ts`). Verify post-deploy via `curl -I https://useQuibly.com | grep -i strict-transport` returns `strict-transport-security: max-age=300` (no `includeSubDomains`, no `preload`).

**Warning signs:** Anyone editing the HSTS line in PR review without explicit reference to D-11 / DEPLOY-06. Lighthouse may also flag short max-age as a warning — ignore Lighthouse's recommendation here; the cutover-reversibility constraint takes precedence.

### Pitfall 2: Service Worker dependency leaking in via a future PR

**What goes wrong:** A future code change (e.g., adding an offline-friendly PWA library, or a third-party SDK that registers a SW) introduces `navigator.serviceWorker.register(...)` somewhere in `app/` or `lib/`. The SW caches the apex content for clients; after cutover, those clients keep seeing quibly-landing's HTML even though the apex now serves marketing-app.

**Why it happens:** No CI gate, easy to add inadvertently via an SDK that registers SW for analytics/offline.

**How to avoid:** Phase 6 ships no SW code — verified by grep (`grep -rE "serviceWorker|navigator\.serviceWorker" app/ lib/ components/` should return no matches). 06-UAT.md ships a manual checkpoint per CD-03 — DevTools → Application → Service Workers → empty. Optional belt-and-suspenders: add a one-line ESLint rule banning `navigator.serviceWorker.register` calls. Defer the rule unless evidence of SW addition surfaces.

**Warning signs:** Any new dependency that auto-registers SWs (PWA libraries, some analytics SDKs). package.json deps audit before cutover catches these.

### Pitfall 3: Resend integration installed at project scope (not team scope)

**What goes wrong:** [ASSUMED based on inferential reasoning, NOT directly cited by docs] The Resend Vercel integration installs `RESEND_API_KEY` as a project env var [CITED: vercel.com/marketplace/resend "Store the Resend API Key as an Environment Variable on Vercel"]. **This is a project-scoped env var, not a team-scoped resource.** marketing-app needs its own `RESEND_API_KEY` (or the same one re-provisioned) — the integration does NOT auto-flow to marketing-app's project at cutover.

**Why it happens:** The "team-level" terminology in DEPLOY-03 conflates two distinct things: (1) the Resend domain `useQuibly.com` being verified at the team's *DNS-records* level (which is what actually matters and is true by virtue of DNS records living on the apex zone), and (2) the Resend integration being scoped at the team's project level. The first is automatic and survives any project transfer; the second is per-project and requires re-installation at marketing-app.

**How to avoid:** **CD-04 resolution: no Resend domain re-verification is needed at cutover** — the SPF/DKIM/DMARC/Return-Path records on the apex DNS zone are unaffected by Vercel project changes. **However:** marketing-app must independently install the Resend Vercel integration (or set `RESEND_API_KEY` manually) on its own project before cutover. Document this as cutover.md Step 1 prerequisite. Phase 6 itself does NOT need to do anything to Resend's domain verification — Phase 4's setup carries over.

**Warning signs:** A founder thought "the Resend domain is bound to my team" means "all my projects on this team can send mail." That's not what the integration does — it installs an API key per project. The DNS records (the actual deliverability foundation) are bound to the apex zone, which is team-scoped at the DNS level.

[ASSUMED]: The Resend integration's per-project env-var scoping behavior. Verify empirically during Phase 6 dry-run by inspecting both projects' env settings; or skip verification (the dry-run in D-07 explicitly does not write to Resend, so this Pitfall manifests only at REAL cutover, not in dry-run). Marking as a hard-blocker pre-condition in cutover.md is sufficient mitigation.

### Pitfall 4: DNS records reset on apex if the DNS provider is changed during operation

**What goes wrong:** If anyone (founder, support engineer) "fixes" something on the apex DNS by switching nameservers or moving registrars during Phase 6 / cutover, all the Resend records and Vercel-managed records reset and need re-verification. This is the largest blast-radius mistake in this domain.

**Why it happens:** Innocent mistakes during Vercel-team membership changes, or trying to "consolidate" DNS at one provider.

**How to avoid:** **DO NOT touch nameservers or DNS provider during Phase 6 or cutover.** Document explicitly in cutover.md as a "what could go wrong" callout in Step 5 (the transfer step). Reach for any DNS change ONLY if a verification step explicitly fails and the fix is documented (e.g., DKIM record needs re-adding because Resend rotates keys — extremely rare).

**Warning signs:** Resend Dashboard says any DNS record is "Pending Verification" or "Failure" after a previously-verified state. mail-tester score drops below 10/10. `dig` returns NXDOMAIN or empty for an expected record.

### Pitfall 5: `staging.useQuibly.com` CNAME assumes Vercel nameservers when external nameservers are in use

**What goes wrong:** Phase 6 Plan task says "add `staging.useQuibly.com` to quibly-landing project — Vercel auto-creates the CNAME." But if the apex is on external nameservers (Cloudflare, NameSilo, etc.), the CNAME must be added manually at the external provider. The dry-run blocks until a human adds it.

**Why it happens:** Confusing Vercel's "domain owned by team" (registrar concept) with "DNS managed by Vercel nameservers" (DNS provider concept). They're orthogonal.

**How to avoid:** First task in Phase 6 plan: verify nameserver setup with `dig +short ns useQuibly.com`. If response is `ns1.vercel-dns.com.` and `ns2.vercel-dns.com.`, Vercel auto-creates CNAMEs (CD-05 sub-flow A). Otherwise (external nameservers), Phase 6 plan adds a manual step: "Add CNAME `staging` → `cname.vercel-dns.com` at <external-provider>." [VERIFIED: vercel.com/docs/domains/working-with-domains/add-a-domain §Subdomains]

**Warning signs:** Adding the staging subdomain to the Vercel project and the status says "Pending DNS Configuration" instead of "Valid Configuration" within 60 seconds. Means external nameservers — manual CNAME needed.

### Pitfall 6: Resend Audience CSV export drops custom properties

**What goes wrong:** [ASSUMED] cutover.md Step 2 says "export the production audience as CSV from Resend Dashboard." If the export drops the `consent_version` custom property, the CSV is incomplete — the GDPR audit trail is lost on migration to marketing-app.

**Why it happens:** Resend's CSV export changelog [CITED: resend.com/changelog/exports-as-csv-in-beta] lists Contacts but doesn't enumerate which fields/properties are exported. Resend's `audiences/contacts/list` API only returns standard fields (id, email, first_name, last_name, created_at, unsubscribed) [CITED: resend.com/docs/api-reference/contacts/list-contacts] — custom properties are absent from the documented response. **If the dashboard CSV export uses the same endpoint, custom properties may be dropped.**

**How to avoid:** Phase 6 plan adds a manual checkpoint task in 06-UAT.md: "Test Resend Audience CSV export. Verify the downloaded CSV includes the `consent_version` column. If absent, document this as a known limitation; cutover.md Step 2 must add a fallback (e.g., snapshot the audience via API list call and serialize manually, OR accept that consent_version lives in `properties` JSON in Resend and is queryable but not exported)."

**Warning signs:** First time someone runs the export and counts columns. Compare to expected schema.

[ASSUMED]: This is the single highest-risk assumed claim in this research. Verify empirically as the FIRST 06-UAT.md task before declaring CSV export workflow complete.

### Pitfall 7: Mail-tester score regresses between Phase 4 (preview) and Phase 6 (production)

**What goes wrong:** Phase 4 hit 10/10 against the preview audience / preview deploy. Phase 6 re-tests against the production apex and the score drops (e.g., DKIM passes but DMARC alignment fails because the production From: address differs subtly).

**Why it happens:** Production may use a different `RESEND_AUDIENCE_ID`, but the From: address (`hello@useQuibly.com`) and the DKIM/SPF setup are the same. The DNS records are at the apex level (per Pitfall 3 reasoning), so re-verification should be idempotent. **Score regression is unlikely if nothing else changed** — but verify, don't assume.

**How to avoid:** Run mail-tester from production apex after deploy: send a test email from production, paste mail-tester URL into 06-UAT.md (CD-08). 10/10 is the gate. If <10, debug specific check (SPF? DKIM? DMARC? content?) before exposing form to public traffic.

**Warning signs:** Any non-10 score. Don't lower the gate.

## Code Examples

Verified patterns from official sources.

### Next.js 16.2 `next.config.ts` `headers()` (DEPLOY-06)

```typescript
// next.config.ts
// Source: nextjs.org/docs/app/api-reference/config/next-config-js/headers (v16.2.4, 2026-04-10)
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

### `dig` commands for Phase 6 DNS verification (DEPLOY-04)

```bash
# Verify nameserver setup (determines CD-05 sub-flow)
dig +short ns useQuibly.com
# Expected output (Vercel-managed):  ns1.vercel-dns.com.  ns2.vercel-dns.com.
# OR (external):                      ns1.<provider>.com.  ns2.<provider>.com.

# SPF (single TXT record on the apex)
dig +short txt useQuibly.com | grep spf1
# Expected:  "v=spf1 include:_spf.resend.com ~all"
# Source: Resend docs — exact include domain may vary by Resend region; verify against
#         Resend Dashboard → Domains → useQuibly.com → DNS Records pane.

# DKIM (3 TXT records — Resend uses 3 selectors)
# Selector names are issued by Resend at domain-verification time; check Resend Dashboard
# for the exact selectors. Common pattern: resend._domainkey, resend2._domainkey, etc.
dig +short txt resend._domainkey.useQuibly.com
# Expected:  "v=DKIM1; k=rsa; p=<long-base64-public-key>"
# Repeat for the other 2 selectors as listed in Resend Dashboard.

# DMARC (single TXT record on _dmarc subdomain)
dig +short txt _dmarc.useQuibly.com
# Expected:  "v=DMARC1; p=none; rua=mailto:<your-aggregate-mailbox>"
# Phase 4 set p=none (per ROADMAP DEPLOY-04). Don't tighten to p=quarantine/reject in Phase 6.

# Return-Path (custom CNAME, Resend-issued)
# The exact subdomain name (e.g., "send", "bounces", "rp") comes from Resend Dashboard.
dig +short cname send.useQuibly.com
# OR
dig +short txt send.useQuibly.com
# Expected: a CNAME pointing to <something>.resend.com or similar.
# Verify exact subdomain in Resend Dashboard → Domains → DNS Records.
```

### `curl` commands for Phase 6 header verification (DEPLOY-06)

```bash
# Verify all 5 security headers on the production apex
curl -sI https://useQuibly.com | grep -iE "strict-transport-security|x-content-type-options|x-frame-options|referrer-policy|permissions-policy"

# Expected output (5 lines, exact case may vary):
#   strict-transport-security: max-age=300
#   x-content-type-options: nosniff
#   x-frame-options: DENY
#   referrer-policy: strict-origin-when-cross-origin
#   permissions-policy: camera=(), microphone=(), geolocation=(), interest-cohort=()

# Verify HSTS does NOT include preload or includeSubDomains
curl -sI https://useQuibly.com | grep -i strict-transport
# Expected EXACTLY:
#   strict-transport-security: max-age=300
# REJECT if response contains "; includeSubDomains" or "; preload"

# Verify a sub-route also gets the headers (file-convention routes)
curl -sI https://useQuibly.com/robots.txt | grep -i strict-transport
# Expected: strict-transport-security: max-age=300

curl -sI https://useQuibly.com/sitemap.xml | grep -i strict-transport
curl -sI https://useQuibly.com/opengraph-image | grep -i strict-transport
curl -sI https://useQuibly.com/privacy | grep -i strict-transport
curl -sI https://useQuibly.com/terms | grep -i strict-transport
# All five should emit the header (source: '/(.*)' covers everything).
```

### Service Worker absence verification (DEPLOY-07, CD-03)

**Recommended (CD-03 lock):** Manual DevTools checkpoint in 06-UAT.md.

```
Manual UAT step:
1. Open production https://useQuibly.com in a fresh incognito window.
2. Open DevTools (Cmd-Opt-I / Ctrl-Shift-I).
3. Application tab → Storage section (left sidebar) → Service Workers.
4. The pane MUST show "Service workers from other origins" only (or "No service workers")
   for the useQuibly.com origin.
5. Screenshot the empty state → paste into 06-UAT.md test result.
```

**Optional belt-and-suspenders (defer unless evidence of SW addition surfaces):**

```bash
# Repo grep — must return no matches in app/, lib/, components/
grep -rEn "navigator\.serviceWorker|register\s*\(.*sw\.|register\s*\(.*service-worker" app/ lib/ components/ 2>/dev/null
# Expected: zero output lines.
```

**Optional Playwright belt-and-suspenders (NOT recommended for v1):**

```typescript
// Source: playwright.dev/docs/service-workers
// Optional Playwright spec — defer per CD-03 recommendation
test('production has no service worker', async ({ page }) => {
  await page.goto('https://useQuibly.com')
  const hasController = await page.evaluate(() => navigator.serviceWorker?.controller !== null)
  expect(hasController).toBe(false)
})
```

CD-03 picks **manual DevTools checkpoint only** for v1. Reasoning: pre-launch volume + zero existing SW source means a one-time pre-launch check is sufficient. Code-based gates add maintenance for low-probability regression. If SW code accidentally lands in a future PR, the CI grep above is the lightest possible upgrade path.

### Resend Audience CSV export workflow (cutover.md Step 2)

**Source:** [VERIFIED: resend.com/changelog/exports-as-csv-in-beta] + [CITED: resend.com/docs/api-reference/contacts/list-contacts]

```
Manual workflow (cutover.md Step 2):
1. Log into Resend Dashboard.
2. Navigate to: Audiences → Quibly Waitlist (the production audience).
3. Click "Export" button (or context menu → Export Contacts).
4. Confirm filters (default: all contacts).
5. If audience is < 1000 contacts: download starts immediately.
   If audience is ≥ 1000 contacts: an email arrives with a download link
   (link expires 7 days; admin-only access).
6. Verify CSV columns include at minimum: id, email, created_at, unsubscribed, consent_version.
7. If consent_version column is MISSING: see Pitfall 6 fallback.
```

[ASSUMED] consent_version is included in the export. Verify EMPIRICALLY as the first
manual checkpoint in 06-UAT.md (before any cutover dry-run).

**Fallback if dashboard export drops consent_version:**

```typescript
// lib/audience-snapshot.ts (NEW — defer building unless Pitfall 6 confirms)
// Use Resend's contacts list API to manually snapshot all contact properties
// Source: resend.com/docs/api-reference/contacts/list-contacts

import { resend } from '@/lib/resend'

export async function snapshotAudience(audienceId: string) {
  const contacts: any[] = []
  let after: string | undefined
  do {
    const { data } = await resend.contacts.list({ audienceId, limit: 100, after })
    if (!data) break
    contacts.push(...data.data)
    after = data.data[data.data.length - 1]?.id
  } while (after)
  return contacts // serialize to CSV including custom properties
}
```

**Defer building this until Pitfall 6 is empirically confirmed.** Most likely the dashboard export already includes properties, in which case this code never ships.

### Vercel atomic same-team transfer (Phase 6 dry-run, DEPLOY-09)

**Source:** [VERIFIED: vercel.com/docs/domains/working-with-domains/transfer-your-domain] + [VERIFIED: vercel.com/changelog/instantly-transfer-domains-to-new-projects] + [VERIFIED: vercel.com/kb/guide/how-to-move-a-domain-between-vercel-projects-with-zero-downtime]

```
Manual UI flow (dry-run on staging.useQuibly.com):

1. PRE-FLIGHT (one-time):
   a. Verify both `quibly-landing` and `marketing-app` Vercel projects exist on the same team.
   b. Verify operator has Owner / Member permissions on both.
   c. Add staging.useQuibly.com to quibly-landing:
      - quibly-landing → Settings → Domains → Add Domain → `staging.useQuibly.com`
      - If apex is on Vercel nameservers (per `dig +short ns useQuibly.com`):
        wait < 60s for auto-CNAME; SSL auto-issued.
      - If apex is on external nameservers: add CNAME `staging` → `cname.vercel-dns.com`
        at the external provider; wait 1–10 min for propagation.
      - Verify status in dashboard: "Valid Configuration" with green checkmark.
   d. Smoke test: `curl -sI https://staging.useQuibly.com | head -5` returns 200 with
      a Vercel `x-vercel-id` header.

2. TRANSFER STAGING.USEQUIBLY.COM TO MARKETING-APP:
   a. marketing-app → Settings → Domains → Add Domain → `staging.useQuibly.com`
   b. Vercel detects in-use state (currently assigned to quibly-landing) and shows prompt:
      "This domain is currently in use by another project. Move it here?"
   c. Confirm → atomic transfer.
   d. Smoke test: `curl -sI https://staging.useQuibly.com | head -5` returns 200 served
      from marketing-app's deployment (verify via response body or Vercel x-matched-path).

3. TRANSFER BACK:
   a. quibly-landing → Settings → Domains → Add Domain → `staging.useQuibly.com`
   b. Same prompt → confirm → atomic transfer back.
   c. Smoke test: `curl -sI https://staging.useQuibly.com | head -5` returns 200 from
      quibly-landing.

4. DOCUMENT:
   - Screenshot the prompt that appears in step 2b and 3a.
   - Note actual propagation time (most clients < 5s; bounded by HSTS=300 to 5 min).
   - Record the EXACT button label (Vercel's UI may have "Move", "Transfer", or other
     label depending on version).
   - Paste into cutover.md Step 5 as the verified flow for FUTURE real cutover.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `vercel.json` `headers` array | `next.config.ts` `async headers()` block (D-10) | Stable since Next 9.5 (2020); type signature stable | Single source of truth, type-safe, framework-native |
| Domain owned per-project (delete-and-readd to move) | Domain owned at team level + atomic move-while-in-use prompt [CITED: vercel.com/changelog/instantly-transfer-domains-to-new-projects] | Vercel changelog 2024 — "Instantly Transfer Domains" | Zero-downtime same-team transfers; the foundation Phase 6's cutover plan relies on |
| HSTS preload as default | HSTS short-max-age for staged rollout, then escalate | Industry guidance since ~2019; Vercel community consensus | DEPLOY-06 takes the staged-rollout posture; preload deferred indefinitely |
| Service Worker for offline-first PWAs | Service-Worker-Free apps (Next.js App Router static rendering already cache-friendly) | Next 13+ App Router | DEPLOY-07 forbids SW; static rendering covers offline-friendly use cases adequately for a single-screen waitlist |
| reCAPTCHA / hCaptcha for spam | Honeypot + rate-limit + Zod (Phase 4 pattern) | 2024+ industry shift to less-friction primitives | Phase 6 inherits; no spam infrastructure changes |

**Deprecated/outdated:**
- `X-Frame-Options: DENY` is **superseded by CSP `frame-ancestors`** [CITED: nextjs.org/docs/app/api-reference/config/next-config-js/headers §X-Frame-Options]. **Phase 6 still ships X-Frame-Options because:**
  (a) CSP is explicitly deferred in D-11 (no CSP this phase),
  (b) X-Frame-Options is universally supported including legacy browsers (IE 11+),
  (c) Both can co-exist when CSP ships in v1.x — modern browsers prefer CSP, legacy browsers fall back to X-Frame-Options.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Resend Audiences CSV dashboard export includes the `consent_version` custom property | Don't Hand-Roll, §Pitfall 6, §Code Examples Resend export | If wrong: cutover.md Step 2 needs an API-fallback snapshot script; GDPR audit trail incomplete on migration. **MITIGATION:** verify empirically as the first 06-UAT.md task. |
| A2 | Resend Vercel integration installs `RESEND_API_KEY` at the Vercel project level (not team level), so marketing-app needs its own integration install or env-var copy at cutover | §Pitfall 3 | If wrong (integration is somehow team-scoped): cutover.md Step 1 prerequisite simplifies. If right (most likely): cutover.md Step 1 must include "verify marketing-app has RESEND_API_KEY set" as a hard pre-condition. **MITIGATION:** documented in cutover.md as a pre-condition either way; verify against marketing-app's project settings during Phase 6 plan creation. |
| A3 | DNS records on the apex zone (SPF/DKIM/DMARC/Return-Path) survive cross-project Vercel transfers because they live on the DNS provider, not on Vercel project state | §Architecture Pattern 2 ("What survives the transfer"), Architectural Responsibility Map, §Pitfall 3 | If wrong: every cutover requires Resend re-verification (72h DNS recheck window per Resend docs). Massively complicates cutover.md. **MITIGATION:** verified by first principles (DNS records are on the zone, Vercel's domain assignment is a routing concept) and corroborated by Vercel's "Move Domain" docs noting that DNS records are preserved during moves [VERIFIED: vercel.com/kb/guide/how-to-move-a-domain-between-vercel-projects-with-zero-downtime]. **The dry-run in Phase 6 also indirectly verifies this** — if `staging.useQuibly.com` retains its CNAME after transfer-back, apex DNS is unaffected. |
| A4 | Vercel's "atomic" transfer is genuinely atomic from the visitor's perspective (no measurable downtime gap) | §Architecture Pattern 2 atomicity, §Pitfall 1 (HSTS reversibility window) | If wrong (small downtime gap exists): visitors during the gap window see 503/404. With HSTS=300, they retry within 5 min. Acceptable risk at pre-launch volume. **MITIGATION:** the dry-run on staging.useQuibly.com directly measures this — instrument with `while true; do curl -sI https://staging.useQuibly.com -o /dev/null -w "%{http_code} "; done` during the transfer to count any non-200 responses. |

**A1 is the highest-risk assumption.** Verify EMPIRICALLY as the first 06-UAT.md task before authoring cutover.md Step 2.

## Open Questions

1. **Does the Resend Audiences dashboard CSV export include custom contact properties (specifically `consent_version`)?**
   - What we know: Resend's `audiences/contacts/list` API does not return custom properties [CITED: resend.com/docs/api-reference/contacts/list-contacts]. CSV export changelog [CITED: resend.com/changelog/exports-as-csv-in-beta] lists "Contacts" as exportable but doesn't enumerate columns.
   - What's unclear: whether the dashboard CSV export uses the same API endpoint (in which case properties are dropped) or a richer internal endpoint that includes properties.
   - Recommendation: Empirical verification — first 06-UAT.md task. If properties dropped, cutover.md Step 2 includes an API-fallback snapshot script (see §Code Examples).

2. **Is Vercel's "in-use prompt" UI flow consistent across all team plans (Hobby, Pro, Enterprise)?**
   - What we know: documented for Pro/Enterprise teams [VERIFIED: vercel.com/changelog/instantly-transfer-domains-to-new-projects].
   - What's unclear: behavior on Hobby teams (rare for production projects but possible).
   - Recommendation: confirm both quibly-landing and marketing-app are on the same Pro+ team during Phase 6 pre-flight. The dry-run resolves this too.

3. **Does `marketing-app` exist as a deployable Vercel project on the same team at Phase 6 plan time?**
   - What we know: 06-CONTEXT D-06 picks marketing-app as the dry-run destination if available; falls back to a throwaway placeholder otherwise.
   - What's unclear: marketing-app's deploy state at Phase 6 plan time.
   - Recommendation: planner-time decision per 06-CONTEXT D-06 Deferred. If marketing-app isn't deployable, plan adjusts to placeholder.

4. **What is the apex `useQuibly.com` nameserver setup?**
   - What we know: choices are Vercel-managed (`ns1.vercel-dns.com`/`ns2.vercel-dns.com`) or external (registrar-managed or third-party DNS like Cloudflare).
   - What's unclear: which one is currently in use; affects CD-05 sub-flow for the `staging.useQuibly.com` add.
   - Recommendation: first plan task — `dig +short ns useQuibly.com` → branches the staging-add task into auto-CNAME or manual-CNAME flow.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `dig` (BIND utilities) | DNS verification commands (DEPLOY-04) | Likely ✓ on macOS/Linux | bundled | `nslookup` (less precise output formatting) or online DNS lookup tools (whatsmydns.net, mxtoolbox.com) |
| `curl` | Header verification (DEPLOY-06) | ✓ on macOS/Linux | bundled | Browser DevTools → Network tab → request inspector |
| Vercel Dashboard access | Domain bind, project transfer (DEPLOY-01..02, DEPLOY-09), env var verification | Manual (founder) | n/a | None — required |
| Resend Dashboard access | DNS records reference (DEPLOY-03..04), Audience CSV export (cutover.md Step 2), Broadcasts UI (D-08/D-09), webhook re-registration (cutover) | Manual (founder) | n/a | Resend API CLI / SDK as fallback for CSV export |
| `mail-tester.com` | DEPLOY-05 (10/10 score) | Web-based, manual | n/a | None — re-running test is the verification |
| Browser DevTools | DEPLOY-07 (Service Worker absence), zero-cookie verification (Phase 5 carryover) | ✓ Chrome / Firefox / Safari | latest | None — verification is browser-native |
| Test inbox (Gmail / Outlook / iCloud) | mail-tester verification + welcome-email spot-check | ✓ founder has accounts (Phase 4 verified) | n/a | None — needed for end-to-end deliverability check |
| `privacy@useQuibly.com` mailbox | Privacy-policy DSAR verification (D-02 carryover) | ⏳ NOT YET PROVISIONED | n/a | None — hard launch-gate |

**Missing dependencies with no fallback:**
- `privacy@useQuibly.com` mailbox not yet provisioned (D-02 launch-gate). Founder must provision via Resend Inbound forward / Google Workspace alias / ImprovMX / forwarding before exposing form to public traffic. **HARD BLOCKER for production exposure, NOT for Phase 6 plan creation.**

**Missing dependencies with fallback:**
- Resend dashboard CSV export of `consent_version` (Pitfall 6 / A1) — fallback is the API-snapshot script in §Code Examples. Build only if empirical verification fails.

## Validation Architecture

> nyquist_validation is enabled (workflow.nyquist_validation: true in .planning/config.json — `verifier: true` and explicit `nyquist_validation: true`).

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.x (Phase 3 install) + Playwright (Phase 3 install) — already configured |
| Config files | `vitest.config.ts`, `playwright.config.ts` (existing — no changes in Phase 6) |
| Quick run command | `npm run test` (Vitest unit) |
| Full suite command | `npm run test:e2e` (Playwright e2e) + Lighthouse CI on PR |

**Phase 6 explicit non-test scope:** Phase 6 ships zero new code that benefits from automated tests beyond the 5-line `next.config.ts` `headers()` block. Header emission is verified empirically against the deployed production apex via `curl`, not via a unit test (which would mock the Vercel platform header layer and provide low signal). Most of Phase 6 verification is **manual checkpoints in 06-UAT.md** because the deliverables are platform configurations and DNS state, not code.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DEPLOY-01 | Production apex resolves to quibly-landing | smoke | `curl -sI https://useQuibly.com \| head -1` (200 OK) | ✅ command available |
| DEPLOY-02 | Apex bound at team level (atomic-transfer-ready) | manual-only | Verify in Vercel Dashboard → Team → Domains tab — apex listed there | ✅ Wave 0 (06-UAT.md task) |
| DEPLOY-03 | Resend domain DNS verified at apex | dns-probe | `dig +short txt useQuibly.com \| grep spf1` and per-DKIM-selector + `_dmarc` checks | ✅ command available |
| DEPLOY-04 | Full DNS: SPF + 3× DKIM + DMARC p=none + Return-Path | dns-probe | All `dig` commands in §Code Examples | ✅ command available |
| DEPLOY-05 | mail-tester.com 10/10 from production apex | manual-only | None (mail-tester has no API) | ✅ Wave 0 (06-UAT.md task with mail-tester URL + 10/10 screenshot) |
| DEPLOY-06 | HSTS max-age=300 (NOT preload) on every route | curl-probe | `curl -sI https://useQuibly.com \| grep -i strict-transport` matches `max-age=300` literally (no includeSubDomains, no preload) | ✅ command available |
| DEPLOY-07 | No Service Worker registered | manual + grep | DevTools Application/SW panel empty + `grep -rE "navigator\.serviceWorker\|register\s*\(.*sw\." app/ lib/ components/` returns 0 matches | ✅ commands available; manual checkpoint in 06-UAT.md |
| DEPLOY-08 | docs/cutover.md exists, structurally complete | smoke | `test -f docs/cutover.md && wc -l docs/cutover.md` (between 200–500 lines per CD-02) | ✅ command available |
| DEPLOY-09 | Cutover dry-run executed on staging subdomain | manual-only | None (UI flow + screenshots) | ✅ Wave 0 (06-UAT.md task documenting transfer-back-and-forth + screenshots of in-use prompt) |

### Sampling Rate

- **Per task commit:** No new automated tests in Phase 6. Existing Vitest + Playwright suite continues to pass on every PR; verifies no regression in Phase 1–5 work.
- **Per wave merge:** Run header-emission curl probes against the latest production deploy URL (not the apex — which only serves after DEPLOY-01 ships). Manual.
- **Phase gate:** 06-UAT.md fully PASS (all manual checkpoints complete) before `/gsd-verify-work`.

### Wave 0 Gaps

- [ ] `06-UAT.md` — covers all 9 DEPLOY-XX requirements as numbered manual tests (matches 04-UAT.md / 05-UAT.md format per CD-07). New file in `.planning/phases/06-production-deploy-cutover-runbook/`.
- [ ] `docs/cutover.md` — covers DEPLOY-08; new file at repo root in newly-created `docs/` directory.
- [ ] Pre-flight: `dig +short ns useQuibly.com` to determine staging-subdomain CD-05 sub-flow (auto-CNAME vs manual CNAME). Output drives a plan-task branch.
- [ ] Empirical: Resend Audience CSV export inspection (Pitfall 6 / A1 verification). Drives whether cutover.md Step 2 needs an API-fallback snapshot script.
- [ ] Manual checkpoint: `privacy@useQuibly.com` mailbox provisioning + receipt test (D-02 carryover). HARD launch-gate.
- [ ] Framework install: NONE — no new packages.

*(Existing test infrastructure (Vitest + Playwright + Lighthouse CI) carries over from Phases 2–5 with no Phase 6 additions. Headers emission is verified via `curl` against deployed production, not via a Vitest unit test, because the framework's header pipeline is the asset under test — mocking it would defeat the purpose.)*

## Security Domain

> `security_enforcement` is not explicitly disabled in `.planning/config.json` — treat as enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V1 Architecture | yes | Security headers via framework-native `next.config.ts` (D-10), no custom middleware (avoids per-request overhead) |
| V2 Authentication | no | Public landing page; no authenticated routes |
| V3 Session Management | no | No sessions |
| V4 Access Control | partial | Resend webhook signature verification (Phase 4) — Phase 6 inherits, no changes |
| V5 Input Validation | partial | Form input validation (Phase 3 / 4 — Zod) — Phase 6 inherits, no changes |
| V6 Cryptography | no | No new crypto in Phase 6. HMAC-signed unsubscribe URLs (Phase 4) inherit. |
| V7 Error Handling | partial | Server Action error paths (Phase 3 / 4) — Phase 6 inherits |
| V8 Data Protection | partial | DSAR mailbox (`privacy@useQuibly.com`) provisioning (D-02 carryover) — Phase 6 verifies |
| V9 Communications | yes | **HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy** (DEPLOY-06 / D-11) — Phase 6's primary security delivery |
| V10 Malicious Code | no | Static landing page; no plugins, no eval, no dynamic code |
| V11 Business Logic | no | Already covered by Phase 4's rate-limit + honeypot |
| V12 Files & Resources | no | No file uploads |
| V13 API & Web Service | partial | Webhook handler (Phase 4) — Phase 6 inherits |
| V14 Configuration | yes | `next.config.ts` minimal-config posture (Phase 6 D-10); secrets in env (Phase 1 D-08); no new secrets in Phase 6 |

### Known Threat Patterns for Next.js + Vercel + Resend stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Clickjacking on legal pages or hero | Tampering | `X-Frame-Options: DENY` (D-11) — emitted on every response |
| MIME-sniffing attacks on uploaded content | Spoofing | `X-Content-Type-Options: nosniff` (D-11) — even though no uploads exist, defense-in-depth |
| HTTPS downgrade / SSL stripping | Tampering | `Strict-Transport-Security: max-age=300` (D-11) — short max-age preserves cutover reversibility |
| Excessive referrer leakage to outbound links (e.g., footer Privacy/Terms anchors when shared) | Information Disclosure | `Referrer-Policy: strict-origin-when-cross-origin` (D-11) |
| Browser-API abuse via injected/3p scripts (camera, mic, geolocation, FLoC tracking) | Information Disclosure / Tampering | `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()` (D-11) |
| Cutover persistence (browsers cache HSTS preload past cutover) | Denial of Service for cutover reversibility | **No HSTS preload** (DEPLOY-06 / D-11) — explicit |
| Cutover persistence (Service Worker caches old apex content) | Denial of Service for cutover atomicity | **No Service Worker** (DEPLOY-07) — verified manually |
| Stale Resend integration after team transfer | Information Disclosure (sender domain reuse) / Repudiation | DNS records on the zone survive transfers; per-project `RESEND_API_KEY` is per-project — marketing-app provisions independently |
| HSTS preload accidental ship | Denial of Service for reversibility (long-tail) | Comment in `next.config.ts` referencing D-11 / DEPLOY-06; PR review checklist |
| CSP omission (no Content-Security-Policy header) | Cross-Site Scripting | **Deferred to focused future spike** (D-11). Acceptable v1 risk because: (a) no user-supplied HTML rendered, (b) all 3p deps are vetted (Vercel Analytics, Speed Insights, Resend, Sonner), (c) the page has minimal attack surface (single email field already validated server-side via Zod). Phase 6 ships strong hardening with zero breaking risk; CSP gets dedicated focus post-launch. |

## Sources

### Primary (HIGH confidence)
- [VERIFIED: nextjs.org/docs/app/api-reference/config/next-config-js/headers] (v16.2.4, lastUpdated 2026-04-10) — `headers()` API signature, source pattern syntax, header emission behavior, Strict-Transport-Security verbatim emission.
- [VERIFIED: vercel.com/docs/domains/working-with-domains] — domain ownership at team level vs project assignment (two distinct concepts), apex vs subdomain CNAME semantics.
- [VERIFIED: vercel.com/docs/domains/working-with-domains/transfer-your-domain] — Move Domain UI flow (cross-team), transferring between projects on same team, "transfer-while-in-use" prompt mechanism.
- [VERIFIED: vercel.com/docs/domains/working-with-domains/add-a-domain] — Add Domain UI flow, apex (A record) vs subdomain (CNAME) configuration, Vercel-nameserver auto-config.
- [VERIFIED: vercel.com/changelog/instantly-transfer-domains-to-new-projects] — atomic same-team transfer feature, "When attempting to move a live domain to a new project, a prompt will appear offering to move the in-use domain and all associated redirects."
- [VERIFIED: vercel.com/kb/guide/how-to-move-a-domain-between-vercel-projects-with-zero-downtime] — `vercel alias set` zero-downtime CLI fallback (sub-flow B).
- [VERIFIED: vercel.com/docs/projects/transferring-projects] — env vars are NOT auto-transferred between projects (vercel.json env config must be migrated).
- [VERIFIED: resend.com/changelog/exports-as-csv-in-beta] — CSV export coverage (Emails, Broadcasts, Contacts, Domains, Logs, API keys), <1000 immediate / ≥1000 emailed link, 7-day expiry, admin-only.
- [VERIFIED: resend.com/docs/api-reference/contacts/list-contacts] — list contacts response shape (id, email, first_name, last_name, created_at, unsubscribed); custom properties NOT in documented response (informs A1).
- [VERIFIED: marketing-app/docs/PRODUCTION-CUTOVER-REMOVE-CLIPROXYAPI.md] — runbook structure reference (step-numbered, "What could break", GSD command callouts).
- [VERIFIED: developer.mozilla.org/Web/HTTP/Headers/Strict-Transport-Security] — HSTS semantics, `max-age=0` for deactivation, short-max-age staged-rollout pattern.
- [VERIFIED: vercel.com/docs/domains/working-with-nameservers] — Vercel nameservers auto-create subdomain DNS records.

### Secondary (MEDIUM confidence)
- [CITED: nextjs.org/docs/app/api-reference/config/next-config-js/headers §X-Frame-Options] — note that XFO is "superseded by CSP frame-ancestors" but still ships for legacy browser support.
- [CITED: vercel.com/marketplace/resend] — Resend Vercel integration installs `RESEND_API_KEY` as a Vercel project env var; informs Pitfall 3 (A2 assumption that integration is project-scoped).
- [CITED: blog.haydenbleasel.com/next-hsts-preload] — Next.js HSTS preload pattern (counter-example to DEPLOY-06 deliberate choice).
- [CITED: learn.microsoft.com/exchange/post-installation-tasks/security-best-practices/configure-http-strict-transport-security-in-exchange-server] — HSTS staged rollout best practice (start max-age=300, escalate).
- [CITED: showdns.net/learn/hsts-max-age-explained] — HSTS max-age guidance for production deployments.
- [CITED: playwright.dev/docs/service-workers] — Playwright Service Worker test patterns (informs CD-03 alt c counter-example).

### Tertiary (LOW confidence — needs runtime validation)
- [ASSUMED] Resend Audiences CSV dashboard export includes the `consent_version` custom property (A1) — verify empirically as the first 06-UAT.md task.
- [ASSUMED] Resend Vercel integration scope is per-project for env vars (A2) — verify against marketing-app's project settings during Phase 6 plan creation, OR document as a hard pre-condition in cutover.md regardless.
- [ASSUMED] Vercel atomic transfer is genuinely zero-downtime (A4) — verify directly in dry-run with a curl-loop probe.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; verified Next 16.2 `headers()` semantics against current docs.
- Architecture (header emission, atomic transfer, DNS record persistence): HIGH for transfer + DNS; HIGH for header emission; MEDIUM (verified by inference, not direct doc) for Resend integration project-scope claim.
- Pitfalls: HIGH for HSTS preload + DNS-mutation + nameserver scenarios; MEDIUM for Resend integration scoping (A2); MEDIUM for Resend CSV custom-property inclusion (A1) — both flagged for empirical verification.
- Validation Architecture: HIGH — Phase 6 is mostly manual checkpoints, and that's the correct sampling for platform-config + DNS-state deliverables.
- Security Domain: HIGH — V9 (Communications) is the primary delivery; all five header values are documented and verbatim per D-11.

**MEDIUM-confidence items flagged for empirical verification (in order of risk):**
1. Resend Audience CSV custom property inclusion (A1) — verify FIRST (gates Pitfall 6 fallback decision and cutover.md Step 2 authorship).
2. Vercel "in-use prompt" behavior on the specific Vercel team plan (Pitfall A2-adjacent) — resolved by the dry-run.
3. Cross-project env var preservation — verified by docs (env vars don't transfer); cutover.md must include a "marketing-app env var pre-condition" step.

**Confidence Assessment table (per Vercel-team-level-transfer flag from SUMMARY.md):**

| Claim | Pre-Phase-6 confidence | Post-research confidence | Empirical-verify path |
|-------|--------|--------|--------|
| Next 16.2 `headers()` emits HSTS verbatim | MEDIUM (training data) | HIGH (verified docs current 2026-04-10) | `curl -sI` after deploy |
| Vercel cross-project transfer is atomic same-team | MEDIUM (SUMMARY.md flag) | MEDIUM-HIGH (verified docs say atomic; UI flow specifics await dry-run) | Dry-run on staging.useQuibly.com |
| DNS records survive cross-project Vercel transfers | MEDIUM (inferred) | HIGH (consistent across Vercel docs; corroborated by first principles) | Dry-run validates indirectly |
| Resend integration is per-project env-var scope | MEDIUM | MEDIUM (one direct citation, others ambiguous) | Inspect both Vercel project env settings |
| Resend Audience CSV includes custom properties | MEDIUM | LOW (docs ambiguous) | First 06-UAT.md task — empirical |
| `staging.useQuibly.com` auto-CNAME works on Vercel nameservers | HIGH (docs explicit) | HIGH | First plan task: `dig +short ns useQuibly.com` |
| HSTS max-age=300 reverses cleanly within 5 min | HIGH | HIGH | Standard, cited across multiple sources |
| Service Worker absence is verifiable manually via DevTools | HIGH | HIGH | One-time UAT checkpoint |

**Research date:** 2026-04-29
**Valid until:** 2026-05-29 (30 days; Vercel and Resend are reasonably stable; re-verify if used past that window).
