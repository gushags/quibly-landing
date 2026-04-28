---
phase: 4
slug: resend-wiring-bot-protection-welcome-email
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-28
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts (created in Plan 01 Wave 1) |
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
| 4-01-04 | 01 | 1 | SPAM-04 | — | Disposable domain silently rejected | unit | `npx vitest run` | `tests/unit/disposable-domains.test.ts` (created Plan 01) | ⬜ pending |
| 4-02-03 | 02 | 1 | EMAIL-04 | — | HMAC unsubscribe token round-trip | unit | `npx vitest run` | `tests/unit/unsubscribe-token.test.ts` (created Plan 02) | ⬜ pending |
| 4-05-02-t1 | 05 | 3 | EMAIL-01 | — | Resend API key never exposed to client (server-only) | unit | `npx vitest run` | `tests/unit/join-waitlist-action.test.ts` (migrated Plan 05) | ⬜ pending |
| 4-05-02-t2 | 05 | 3 | EMAIL-02 | — | Duplicate email returns already-subscribed response | unit | `npx vitest run` | `tests/unit/join-waitlist-action.test.ts` | ⬜ pending |
| 4-05-02-t3 | 05 | 3 | STORE-01 | — | contacts.create called with correct audienceId | unit | `npx vitest run` | `tests/unit/join-waitlist-action.test.ts` | ⬜ pending |
| 4-05-02-t4 | 05 | 3 | STORE-03 | — | consent_version tag set to privacy-policy git SHA | unit | `npx vitest run` | `tests/unit/join-waitlist-action.test.ts` | ⬜ pending |
| 4-05-02-t5 | 05 | 3 | STORE-04 | — | Preview env writes to preview audience, not production | unit | `npx vitest run` | `tests/unit/join-waitlist-action.test.ts` | ⬜ pending |
| 4-05-02-t6 | 05 | 3 | SPAM-03 | — | Rate limiter blocks 6th request in 1 minute | unit | `npx vitest run` | `tests/unit/join-waitlist-action.test.ts` | ⬜ pending |
| 4-05-02-t7 | 05 | 3 | EMAIL-03 | — | List-Unsubscribe + List-Unsubscribe-Post headers in send call | unit | `npx vitest run` | `tests/unit/join-waitlist-action.test.ts` | ⬜ pending |
| 4-05-02-t8 | 05 | 3 | EMAIL-08 | — | Welcome email send failure logged + tracked (fire-and-forget) | unit | `npx vitest run` | `tests/unit/join-waitlist-action.test.ts` | ⬜ pending |
| 4-06-03a | 06 | 3 | EMAIL-09 | — | Svix signature verified on raw body before parsing | unit | `npx vitest run` | `tests/unit/webhook-handler.test.ts` (created Plan 06) | ⬜ pending |
| 4-06-03b | 06 | 3 | EMAIL-09 | — | Bounce event marks contact unsubscribed | unit | `npx vitest run` | `tests/unit/webhook-handler.test.ts` | ⬜ pending |
| 4-06-03c | 06 | 3 | EMAIL-04 | — | Unsubscribe route marks contact unsubscribed via token | unit | `npx vitest run` | `tests/unit/unsubscribe-route.test.ts` (created Plan 06) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements (Plan 01 — Wave 1)

Plan 01 (Wave 1) is the de-facto Wave 0: it installs test infrastructure and creates the first test file before any integration code exists.

- [x] `vitest.config.ts` + `happy-dom` — installed by Plan 01 Task 4 (if not already present)
- [x] `tests/unit/disposable-domains.test.ts` — created by Plan 01 Task 4 (SPAM-04)
- [x] `tests/unit/unsubscribe-token.test.ts` — created by Plan 02 Task 3 (EMAIL-04)

Remaining test files are created inline with their implementation plans:
- `tests/unit/join-waitlist-action.test.ts` — migrated/replaced by Plan 05 Task 2 (Wave 3)
- `tests/unit/webhook-handler.test.ts` — created by Plan 06 Task 3 (Wave 3)
- `tests/unit/unsubscribe-route.test.ts` — created by Plan 06 Task 3 (Wave 3)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Welcome email inbox delivery (Gmail, Outlook, iCloud) within 60s | EMAIL-03 | Requires real email accounts and live Resend send | Sign up with real address; check inbox within 60s; verify sender, headers, unsubscribe link, postal address |
| List-Unsubscribe-Post header visible in Gmail "Show Original" | EMAIL-03 | Requires live sent email | Open "Show Original" in Gmail; verify `List-Unsubscribe-Post: List-Unsubscribe=One-Click` present |
| One-click unsubscribe via Gmail unsubscribe button | EMAIL-06 | Requires Gmail native UI | Click Gmail's unsubscribe button; verify Resend marks contact unsubscribed |
| CSV export round-trip (audience → CSV → re-import) | STORE-05 | Requires Resend dashboard access | Export audience CSV; verify fields; re-import and confirm no data loss |
| Bounce webhook via Resend test address (`bounced@resend.dev`) | EMAIL-08 | Requires live Resend webhook trigger | Send to `bounced@resend.dev`; confirm webhook fires; verify contact marked unsubscribed |
| STORE-02 API key scope | STORE-02 | Requires Resend Dashboard access | Resend Dashboard → API Keys → confirm the key used for RESEND_API_KEY shows "Sending access" scope only (not Full Access) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (tests created inline by plan tasks)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (Plan 01 installs vitest + creates first test file)
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
