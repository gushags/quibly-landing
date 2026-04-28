---
phase: 4
slug: resend-wiring-bot-protection-welcome-email
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-28
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts (or Wave 0 installs) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 0 | EMAIL-01 | — | Resend API key never exposed to client | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 4-01-02 | 01 | 1 | STORE-01 | — | contacts.create called with correct audienceId | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 4-01-03 | 01 | 1 | EMAIL-02 | — | Duplicate email returns already-subscribed response | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 4-01-04 | 01 | 1 | STORE-03 | — | consent_version tag set to privacy-policy git SHA | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 4-02-01 | 02 | 1 | EMAIL-03 | — | List-Unsubscribe + List-Unsubscribe-Post headers present | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 4-02-02 | 02 | 1 | EMAIL-04 | — | Welcome email from hello@useQuibly.com | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 4-03-01 | 03 | 1 | SPAM-03 | — | Rate limiter blocks 6th request in 1 minute | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 4-03-02 | 03 | 1 | SPAM-04 | — | Disposable domain silently rejected | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 4-04-01 | 04 | 2 | EMAIL-07 | — | Webhook verifies svix signature on raw body | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 4-04-02 | 04 | 2 | EMAIL-08 | — | Bounce event marks contact unsubscribed | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 4-05-01 | 05 | 1 | STORE-04 | — | Preview env writes to preview audience, not production | unit | `npx vitest run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/subscribe.test.ts` — stubs for EMAIL-01, EMAIL-02, STORE-01, STORE-03
- [ ] `__tests__/welcome-email.test.ts` — stubs for EMAIL-03, EMAIL-04, EMAIL-05, EMAIL-06
- [ ] `__tests__/rate-limit.test.ts` — stubs for SPAM-03, SPAM-04
- [ ] `__tests__/webhook.test.ts` — stubs for EMAIL-07, EMAIL-08, EMAIL-09
- [ ] `__tests__/env-routing.test.ts` — stubs for STORE-04, STORE-05
- [ ] `vitest.config.ts` + `happy-dom` — if not already installed

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Welcome email inbox delivery (Gmail, Outlook, iCloud) within 60s | EMAIL-03 | Requires real email accounts and live Resend send | Sign up with real address; check inbox within 60s; verify sender, headers, unsubscribe link, postal address |
| List-Unsubscribe-Post header visible in Gmail "Show Original" | EMAIL-03 | Requires live sent email | Open "Show Original" in Gmail; verify `List-Unsubscribe-Post: List-Unsubscribe=One-Click` present |
| One-click unsubscribe via Gmail unsubscribe button | EMAIL-06 | Requires Gmail native UI | Click Gmail's unsubscribe button; verify Resend marks contact unsubscribed |
| CSV export round-trip (audience → CSV → re-import) | STORE-05 | Requires Resend dashboard access | Export audience CSV; verify fields; re-import and confirm no data loss |
| Bounce webhook via Resend test address (`bounced@resend.dev`) | EMAIL-08 | Requires live Resend webhook trigger | Send to `bounced@resend.dev`; confirm webhook fires; verify contact marked unsubscribed |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
