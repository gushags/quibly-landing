# Phase 4: Resend Wiring + Bot Protection + Welcome Email - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-28
**Phase:** 04-resend-wiring-bot-protection-welcome-email
**Areas discussed:** Welcome email voice & body, Rejection UX (rate-limit + disposable domains), Already-subscribed welcome behavior, Webhook bounce/complaint side effects, Postal address blocker

---

## Welcome email voice & body

### Initial selection — voice & shape

| Option | Description | Selected |
|--------|-------------|----------|
| Short founder note | First-person founder note, light Quibly branding, plain text feel — indie maker email |  |
| Branded confirmation | Quibly-branded layout (teal header strip, Quicksand) with confirmation paragraph |  |
| Minimal transactional | 2-3 sentences max, neutral tone, lowest spam-trigger but lowest brand impression |  |
| Founder note + branded shell | Hybrid: branded teal header + first-person founder body | (initial direction) |

**User's choice:** Free-text response — leaned toward the founder-note shape, asked to revise:
- Add solopreneur self-identification (asked Claude's view on whether that's a bad signal)
- Replace "heads-down" with a casual but non-cliché alternative

**Notes:** Claude's response — solopreneur framing is the highest-leverage authenticity signal a pre-launch waitlist has; "heads-down" replaced with "deep in".

### Iteration 1 — solopreneur framing, "deep in"

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — lock this draft | Solopreneur framing in, "deep in" replacement |  |
| Keep voice, tighter | Drop "hit reply" line, 2 paragraphs total |  |
| Add product-tease line | Add a line teasing what's specifically different about Quibly |  |

**User's choice:** Free-text response — corrected: "I'm building this by myself. No team. So I'd edit that out unless you think that is a bad signal to send."

**Notes:** Claude's response — solo framing is a *feature* for this audience. Founder-voice is the only social proof at zero signups; "I'm one of you, building for you" is the purest authenticity signal. Bus-factor concern exists either way; transparency wins.

### Iteration 2 — solo framing, locked

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — lock this draft | Solo framing throughout (no "small team"); first-person; "hit reply, I read everything" line preserved | ✓ |
| Tighter version | Drop "hit reply" paragraph, two paragraphs total |  |
| Different subject line | Same body, different subject line direction |  |

**User's choice:** Lock the draft — "Yes — lock this draft" with the preview as the canonical string.

**Notes:** Claude polishes during planning (typography, spacing, brand styling) but does NOT change voice or substance. Founder edits the final string in PR review before Phase 4 ships.

---

## Rejection UX — silent or surfaced

| Option | Description | Selected |
|--------|-------------|----------|
| Silent for both (Recommended) | Both return success-shape, no welcome, no signup analytics; logs + rejection analytics for ops; consistent with Phase 3 D-15 | ✓ |
| Silent rate-limit, surfaced disposable | Rate-limit silent; disposable surfaced as inline error |  |
| Surfaced for both | Sonner toast for rate-limit; inline for disposable; best UX for legitimate edge users; reveals defenses |  |
| Silent disposable, surfaced rate-limit | Disposable silent; rate-limit surfaced for shared-NAT cases |  |

**User's choice:** Silent for both (Recommended).

**Notes:** Mirrors Phase 3 honeypot/time-trap pattern (D-15). No information surface for attackers to probe rate-limit thresholds. Disposable users either retry with a real address or were never going to be useful.

---

## Already-subscribed welcome behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Suppress on duplicate (Recommended) | Detect duplicate via Resend response (day-1 probe verifies signal); if dup, skip emails.send. Welcome = first-time only. Fallback if signal unclear: send anyway | ✓ |
| Always re-send welcome | Simplest; user gets fresh confirmation each retry; risk of repeat-spam complaints |  |
| Different "already on list" variant | Send alternate email acknowledging retry; extra template + send; overkill for edge case |  |

**User's choice:** Suppress on duplicate (Recommended).

**Notes:** Phase 4 day-1 probe (5 min) verifies the exact Resend signal for duplicate detection. If unclear, fall back to "always send" — at pre-launch volume the spam-complaint risk is bounded by Gmail's 0.3% threshold, well above any plausible re-confirmation rate.

---

## Webhook bounce/complaint side effects

| Option | Description | Selected |
|--------|-------------|----------|
| Differentiated per event (Recommended) | Hard bounce → mark unsubscribed; complaint → mark unsubscribed; soft bounce → log only; all events → server log + analytics | ✓ |
| Mark unsubscribed on every event | Treats soft as hard; simpler but loses transient-failure contacts |  |
| Log only, don't mutate | Preserves audience as captured; risk: hard bounces stay in audience and degrade launch broadcast |  |
| Differentiated + Slack/email alert | Same as recommended + complaint-rate threshold alert pathway |  |

**User's choice:** Differentiated per event (Recommended).

**Notes:** Standard Gmail/Yahoo bulk-sender hygiene. Slack/email alert pathway deferred to v2 monitoring (D-09 in CONTEXT.md).

---

## Postal address blocker (CAN-SPAM EMAIL-05)

| Option | Description | Selected |
|--------|-------------|----------|
| Already sourced | Real address in hand; plan ships with placeholder; supplied in PR or env var |  |
| Will source before Phase 4 ships | Plan ships with placeholder + checkpoint task that blocks production deploy until real address is wired | ✓ |
| Need recommendations | Surface PO Box / CMRA / registered agent / virtual office options during planning |  |

**User's choice:** Will source before Phase 4 ships.

**Notes:** Founder action item — source registered agent / USPS PO Box / commercial mail receiving agency before Phase 4 production ship. Plan includes a checkpoint task that gates merge-to-main. Likely wired as `RESEND_FROM_POSTAL_ADDRESS` env var so it stays out of source code.

---

## Claude's Discretion

Captured in CONTEXT.md `<decisions>` § "Claude's Discretion":
- CD-01: Disposable-domain blocklist source (hand-curated array vs npm package)
- CD-02: One-click unsubscribe URL token format (HMAC-signed contactId recommended)
- CD-03: `consent_version` Phase 4 placeholder (`process.env.VERCEL_GIT_COMMIT_SHA ?? 'pre-phase-5'`)
- CD-04: Audience routing logic (`VERCEL_ENV === 'production' ? prod : preview`)
- CD-05: Webhook signature verification scheme (HMAC-SHA256 likely)
- CD-06: Mail-tester.com verification timing (early-phase task)
- CD-07: Phase 3 stub-branch deletion + test migration to Resend SDK mocks
- CD-08: Welcome email JSX layout (adapt marketing-app/emails/WelcomeEmail.tsx structure to D-01 voice)
- CD-09: Fire-and-forget mechanics (`.catch()` pattern; `waitUntil()` only if needed)
- CD-10: Rate-limit identifier (`x-forwarded-for` first-IP)
- CD-11: Disposable-domain check ordering (after Zod, before rate-limit)

## Deferred Ideas

Captured in CONTEXT.md `<deferred>`:
- Cloudflare Turnstile (V2-07) — signal-driven trigger only
- Live signup counter (Phase 7) — gated audience ≥50
- Slack/email alert for complaint-rate threshold — v2 monitoring
- `waitUntil()` from `@vercel/functions` — fallback if fire-and-forget shows aborted sends
- Disposable-domain npm package — defer until hand-curated list shows abuse leaks
- One-click unsubscribe HTML confirmation page — POST route is RFC-required; GET confirmation is nice-to-have
- Surfaced rate-limit / disposable-domain UX — discriminated union supports it, kept silent in v1
