---
title: Migrate existing Quibly waitlist contacts to Zeremi audience
trigger_condition: Resend sender domain `zeremi.app` is verified (SPF + DKIM + DMARC) AND the rebrand cutover (Phase 6.5) is on a confirmed launch date
planted_date: 2026-05-28
---

# Migrate existing Quibly waitlist contacts to Zeremi audience

## What

People who joined the waitlist under "Quibly" should be brought along to the
rebranded "Zeremi" launch list. Two parts:

1. **Audience-level decision in Resend** — either:
   - **a)** rename the existing "Quibly Waitlist" audience to "Zeremi Waitlist"
     (single audience, no migration, history preserved), OR
   - **b)** create a new "Zeremi Waitlist" audience and re-add contacts from
     the old audience (clean break, but loses per-contact `consent_version`
     metadata unless explicitly carried over).
   Default recommendation: **(a) rename** — simpler, preserves consent SHA
   metadata, no risk of double-write or drift.

2. **One-time re-introduction email** — a transactional broadcast that:
   - Sent from `hello@zeremi.app` (NOT `hello@useQuibly.com`).
   - Explains the rename in 2–3 sentences, no apology theater.
   - Includes the same `List-Unsubscribe` + one-click headers as the welcome
     email (Phase 4 EMAIL-04/05 pattern).
   - Includes physical postal address (CAN-SPAM §316.5).
   - Has a prominent one-click unsubscribe link in the body — a rename
     *materially changes the sender identity*, so giving people a frictionless
     out is both ethical and reduces spam-complaint risk against the new
     sender domain's reputation.

## Why this is a seed, not an immediate todo

The migration can't happen until:
- `zeremi.app` is verified in Resend (depends on Phase 6.5),
- the new sender domain has a warmed sending reputation (do NOT broadcast
  from a cold domain — risks landing the entire audience in spam),
- legal/copy review of the re-intro email is done (the rename is a material
  change to the privacy notice's "data controller" — verify whether a new
  consent capture is required under GDPR, or whether continuity of legitimate
  interest is defensible because the entity hasn't changed).

## When to act

Trigger this seed when **all** of the following are true:
- Phase 6.5 (rebrand) has shipped and the production landing is live on
  `zeremi.app`.
- Resend dashboard shows `zeremi.app` SPF/DKIM/DMARC all green.
- A `mail-tester.com` send from `hello@zeremi.app` returns ≥9/10.
- Privacy policy at `/privacy` has been updated to reflect the rename and
  the change has been pushed publicly for ≥7 days (DSAR grace period).

## Open questions worth resolving before sending

- Does the existing Quibly contact's `consent_version` (a privacy-policy git
  SHA) need to be re-captured because the privacy policy itself was rewritten
  for the rebrand? Likely yes — append a new `consent_version` field on the
  contact rather than overwriting.
- Is the re-intro email a "transactional" or "broadcast" send under Resend's
  categorization? Affects which API and which audience tag is appropriate.
- Should we offer existing contacts an explicit "stay on the list / leave"
  CTA (double-confirm), or rely on the unsubscribe header alone? Double-confirm
  loses ~30–60% of the list but produces a higher-engagement remainder.

## Related

- [[zeremi-brand-decisions-2026-05-28]] — naming, typography, asset source
- ROADMAP Phase 6.5 — rebrand & domain cutover
- Phase 4 plans 04-04, 04-05, 04-06 — the welcome-email / audience-write /
  unsubscribe-header pipeline this re-intro email will reuse
