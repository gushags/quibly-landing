---
phase: 03
slug: email-capture-form-stub-action
status: secured
threats_open: 0
threats_total: 18
threats_closed: 18
asvs_level: 1
created: 2026-04-28
---

# SECURITY.md — Phase 03 (email-capture-form-stub-action)

**Phase:** 03 — Email Capture Form + Stub Server Action
**Audit Date:** 2026-04-28
**ASVS Level:** 1 (default, pre-launch waitlist)
**Auditor:** gsd-security-auditor (read-only verification of declared mitigations)
**Result:** SECURED — 18/18 threats closed (12 mitigate verified by code, 8 accept verified by documentation; one threat is `n/a` and noted)

This audit verifies that every threat declared in the Phase 03 plan threat
register is mitigated in the shipped code, accepted with documentation, or
formally `n/a`. It does NOT scan for new vulnerabilities. Implementation files
are read-only with respect to this audit.

---

## Threat Verification Table

| Threat ID | Category | Disposition | Status | Evidence |
|-----------|----------|-------------|--------|----------|
| T-03-01 | I (Info Disclosure / enumeration) | mitigate | CLOSED | (a) `components/waitlist/waitlist-form.tsx`: success render branch (lines 96–120) does not read `state.duplicate`; grep `state\.duplicate\|state?\.duplicate` against the file returns 0 matches outside type/import/comment context. (b) `tests/form/success-state.spec.ts:93–102` runs three independent enumeration-defense assertions: `data-duplicate` attribute count === 0 (line 98), success-block HTML must not match `/duplicate\|already/` (line 102), identical role=status content for fresh+dup paths (lines 89–91). |
| T-03-02 | D (DoS) / S (Spoofing) | mitigate | CLOSED | (a) Honeypot check in `app/actions/join-waitlist.ts:63` — `if (formData.get('hp_field')) return { status: 'success' }`. **Note:** field renamed `website` → `hp_field` per WR-02 (password-manager false-positive fix); same silent-success behavior, same SPAM-01 intent. (b) Time-trap check in `app/actions/join-waitlist.ts:71` — `if (renderedAt > 0 && Date.now() - renderedAt < 2000) return { status: 'success' }`. (c) Honeypot input in `components/waitlist/waitlist-form.tsx:165–184` uses inline `style={{ position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }}` — NOT `display:none`, NOT Tailwind `sr-only`, NOT `visibility:hidden`. Verified absent: `display: 'none'` (0 grep matches in the file). |
| T-03-03 | I (XSS via reflected email) | mitigate | CLOSED | `components/waitlist/waitlist-form.tsx:143` uses `defaultValue={echoedEmail ?? ''}` (echoedEmail derives from `state.submittedValues?.email` at line 125–126). React auto-escapes JSX attribute values. `grep dangerouslySetInnerHTML` against the file returns 0 matches; no manual string concat. |
| T-03-04 | T (Tampering) | mitigate | CLOSED | (a) Zod schema in `app/actions/join-waitlist.ts:35–43` enforces `.email(...)` format + `.max(254)` length cap. (b) Honeypot + time-trap apply BEFORE Zod (action lines 63 and 71) — same defenses fire on no-JS POSTs (verified by `tests/no-js/waitlist-form-progressive.spec.ts` running under `javaScriptEnabled: false`). (c) Action narrows `string \| File \| null` to string at line 83 (WR-04) so a multipart-File `email` field cannot leak `[object File]` back via `submittedValues`. |
| T-03-05 | T (CSRF) | accept | CLOSED | Documented accepted risk: Next.js 16.2 Server Actions include built-in CSRF protection (Origin header verification + per-action ID hash). No additional task required. The action endpoint is invoked only via the framework's Server Action machinery; no manual fetch handler exists. See accepted risks log below. |
| T-03-06 | I (Info Disclosure — stub leak to prod) | mitigate | CLOSED | `grep -c "PHASE-3-STUB" app/actions/join-waitlist.ts` returns **5** (≥4 required). Markers at action lines 100, 105, 109, 116, 121. Phase 4 removal task is `grep -n "PHASE-3-STUB" app/actions/join-waitlist.ts` → delete those line ranges and replace with the real Resend write. |
| T-03-INFRA-01 | E (EoP / supply chain) | accept | CLOSED | Accepted risk: 7 npm devDeps (vitest, @vitejs/plugin-react, @testing-library/react, @testing-library/dom, @testing-library/jest-dom, @testing-library/user-event, happy-dom) pinned with `^` for security patches. All seven are widely-used, established packages. `npm audit` flagged 7 transitive vulnerabilities (3 low, 3 moderate, 1 high) per Plan 01 SUMMARY — accepted for now; recommended re-triage before Phase 4 ships. See accepted risks log below. |
| T-03-INFRA-02 | I (Info Disclosure — CI artifacts) | accept | CLOSED | Accepted risk: `.github/workflows/test.yml:82–87` uploads `playwright-report/` only on failure with 7-day retention. Artifact contains screenshots of localhost:3000; no real PII (test data is `dup@example.com`, `err@example.com`, `slow@example.com`, `noscript@example.com`, etc.). See accepted risks log below. |
| T-03-INFRA-03 | D (DoS — CI minutes) | accept | CLOSED | Accepted risk: two parallel CI jobs (`vitest`, `playwright`) ~3 min total per PR. Within free GitHub Actions allotment for personal/small-team usage. STATE.md tracks usage. See accepted risks log below. |
| T-03-INFRA-04 | I (Info Disclosure — server wall-clock) | accept | CLOSED | Accepted risk: `renderedAt = Date.now()` is computed in `components/sections/waitlist-form-section.tsx:49` (RSC) and rendered into `<input type="hidden" name="renderedAt" value={renderedAt}>` at `components/waitlist/waitlist-form.tsx:187`. Leak is benign (visible to anyone via DevTools). HMAC-signing deferred to Phase 4 if abuse appears. See accepted risks log below. |
| T-03-ANCHOR-01 | T (Tampering) | accept | CLOSED | Accepted risk: Hero CTA `components/sections/hero.tsx:44` and Secondary CTA `components/sections/secondary-cta.tsx:25` both use `<a href="#waitlist">` (static fragment, same-document). Neither uses `target="_blank"` (verified by grep — 0 matches), so `rel="noopener noreferrer"` is not required. See accepted risks log below. |
| T-03-ANCHOR-02 | n/a | n/a | n/a | Hero/secondary CTAs collect no user input; the form (Plans 02, 03) is the only input collection point. No security surface. |
| T-03-ANCHOR-03 | I (Info Disclosure — CI selector) | accept | CLOSED | Accepted risk: `tests/visual/button-radius.spec.ts` selector `[data-slot="button"][data-size="hero"]` runs CI-side only; no production exposure. The Pitfall 9 fix prevents silent test regression. See accepted risks log below. |
| T-03-POST-01 | I (Info Disclosure / Tampering — in-place enforcement) | mitigate | CLOSED | `tests/form/success-state.spec.ts:45–79` (first test) pairs both halves of POST-01 atomic enforcement inside ONE test block: line 50 captures `startURL`; line 68 asserts `await expect(emailInput).toHaveCount(0)` (input unmounted); lines 75–78 assert `expect(endURL.replace(/#.*$/, '')).toBe(startURL.replace(/#.*$/, ''))` (same URL pathname). Defeats the false-positive where input-unmounted alone could pass on a navigation away. |
| T-03-TEST-01 | n/a | n/a | n/a | `tests/form/*.spec.ts` are test code, not production code. No security surface introduced. |
| T-03-NOJS-01 | n/a (intentional spec scope) | accept | CLOSED | Accepted risk: graceful-degradation acceptance per D-16. Plan 06 SUMMARY documents that empirical validation (Next 16.2.1 + React 19.2.4) actually delivers full success-state on the no-JS path — supersedes the planner's worst-case prediction. The user's submission is processed regardless of the rendered surface. See accepted risks log below. |
| T-03-CI-01 | T / E (branch protection) | mitigate | CLOSED | `.planning/phases/03-email-capture-form-stub-action/03-07-SUMMARY.md` documents D-18 enforced live on `main`: founder confirmed `Tests / vitest`, `Tests / playwright`, and `Lighthouse CI / lighthouse` are required status checks. CLI cannot verify GitHub repo settings; the SUMMARY's documented founder confirmation is accepted as evidence per the audit instructions. |
| T-03-COPY-01 | I (Info Disclosure — copy review) | accept | CLOSED | Accepted risk: founder copy review is brand/voice gate, not security. Plan 03-07 SUMMARY documents revision landed via `23efcf1`. See accepted risks log below. |

---

## Unregistered Flags

None. All Plan SUMMARY `## Threat Flags` sections explicitly state "None":

- 03-01-SUMMARY.md `## Threat Flags`: "None — Plan 01 is pure infrastructure, ships no production code surface."
- 03-04-SUMMARY.md `## Threat Flags`: "None. No new security-relevant surface introduced."
- 03-06-SUMMARY.md `## Threat Flags`: "None. Plan 06 ships one test file with zero production code surface."
- 03-02, 03-03, 03-05, 03-07 SUMMARYs do not include a `## Threat Flags` section, but each contains a Threat Model in its source PLAN file (all entries reconciled to the consolidated register above).

---

## Notes on Implementation Deviations from Plan

The audit surfaced two intentional code deviations from the original plan
artifacts. Both are documented in PLAN summaries and code-review fix reports
(`03-REVIEW-FIX.md`); both **strengthen rather than weaken** the declared
mitigations. The threats remain CLOSED.

### Honeypot field rename: `website` → `hp_field` (WR-02)

The original plan threat register names the honeypot field `website`. The
shipped code uses `hp_field` (action line 63, form lines 164–167). Rationale
per `03-REVIEW-FIX.md` and JSDoc: major password managers (1Password,
Bitwarden, LastPass) auto-fill identity-vault `website`/`url` values regardless
of `autoComplete="off"`, silently dropping real users into the honeypot's
silent-success branch. The rename + `data-1p-ignore` / `data-bwignore` /
`data-lpignore="true"` belt-and-suspenders attributes preserve T-03-02's silent
rejection behavior while eliminating the false-positive against legitimate
users with password-manager identity vaults.

**Audit verdict:** T-03-02 mitigation intent is fully preserved. Field name
divergence from the plan threat register text is a strengthening of the
mitigation, not a weakening.

### Email normalization (WR-03 / WR-04)

The action additionally:
- Trims whitespace before Zod parse (`.trim()` on rawEmail at line 83)
- Lowercases via Zod transform (line 42 `.transform((s) => s.toLowerCase())`)
- Narrows `string | File | null` → string before parse (line 83)

Side effect: stub-branch routing for `dup@example.com` is now case- and
whitespace-insensitive (`Dup@Example.COM ` → matches the dup branch). Phase 4
must apply the same transforms before the Resend audience write to keep the
contract consistent.

**Audit verdict:** Strengthens T-03-04 (tampering / FORM-03 source-of-truth
validation) — the action no longer echoes serialized non-string types via
`submittedValues`. T-03-04 remains CLOSED.

### POST-01 atomic enforcement (W-04 fix)

`tests/form/success-state.spec.ts:45–79` ships the W-04 atomic-enforcement fix:
the first success test pairs `toHaveCount(0)` on the input AND
`expect(endURL).toBe(startURL)` inside the same `test(...)` block — verified
above. T-03-POST-01 remains CLOSED.

---

## Accepted Risks Log

Each entry below records an accept-disposition threat that requires a
documented acceptance per the audit instructions. By signing this audit,
the project owner acknowledges these risks for Phase 03 ship.

| ID | Risk | Acceptance Rationale | Re-evaluation Trigger |
|----|------|----------------------|----------------------|
| T-03-05 | CSRF on Server Action POST | Next.js 16.2 ships built-in CSRF (Origin verification + per-action ID hash). No surface required. | Major Next.js upgrade or framework CVE relating to Server Actions |
| T-03-INFRA-01 | npm devDeps supply chain (7 vulns flagged transitively by `npm audit`) | Test-toolchain only; not in production runtime. Pin allows security patches via `^`. | Phase 4 review before Resend SDK lands; `npm audit fix` recommended |
| T-03-INFRA-02 | Playwright artifact upload on CI failure | Test data only (`dup@example.com`, `err@example.com`, etc.). 7-day retention. No real PII. | If artifact contents change to include real submissions |
| T-03-INFRA-03 | CI minutes consumption | ~3 min per PR; within free tier. STATE.md tracks usage. | Repo grows beyond personal use OR CI minutes exceed plan |
| T-03-INFRA-04 | `renderedAt` server wall-clock leaked to client HTML | Visible via DevTools regardless. Required for time-trap (SPAM-02). | If signed-token model needed (Phase 4 decision) |
| T-03-ANCHOR-01 | `<a href="#waitlist">` static fragment | Same-document anchor; no `target="_blank"`. | If hero/secondary CTAs gain external links |
| T-03-ANCHOR-03 | CI-side selector update | Test-only; no production surface. | n/a (test infra) |
| T-03-NOJS-01 | No-JS spec graceful-degradation scope | Empirically the framework delivers full success state on no-JS POST anyway (Plan 06 finding). | If framework regression observed in CI |
| T-03-COPY-01 | Founder copy review | Brand/voice gate, not security gate. Final strings landed via `23efcf1`. | n/a |

---

## Audit Conclusion

**SECURED** — every threat in the Phase 03 register resolves to CLOSED
(mitigation verified by file:line evidence) or to a documented accepted risk
in the log above. Two `n/a` entries (T-03-ANCHOR-02, T-03-TEST-01) are
informational only and require no acceptance signature.

The phase may ship.

### Phase 4 handoff items

1. **Resend SDK supply-chain re-audit (T-03-INFRA-01):** run `npm audit` after
   `resend@^6.12` lands; the high-severity transitive flagged in Plan 01
   SUMMARY may be in scope for `npm audit fix` once Phase 4 production deps
   change.
2. **Phase 4 must preserve T-03-01 enumeration defense:** the `state.duplicate`
   flag still must not be read by render code when the action is swapped to a
   real `resend.contacts.create({ ... })` call. Three e2e enforcement layers
   in `tests/form/success-state.spec.ts` will continue to enforce this if the
   render code regresses.
3. **Phase 4 must preserve email normalization (WR-03):** apply
   `trim()`+`toLowerCase()` before the Resend audience write so dedup is
   case-insensitive and the discriminated-union shape continues to behave as
   the unit tests expect.
4. **Phase 4 must preserve PHASE-3-STUB removal cleanly:** delete all 5
   markers in `app/actions/join-waitlist.ts` (lines 100, 105, 109, 116, 121
   per the SUMMARY index) when the body is swapped, so no stub branch leaks
   to production.
5. **Phase 4 must replace honeypot/time-trap audit-trail:** real `track('bot_rejected')`
   call is deferred per CONTEXT D-15. When added, ensure it does not log
   user PII (email) on rejection.
6. **CI secrets handover:** `.github/workflows/test.yml` currently injects
   stub values (`re_test_stub`, `aud_test_stub`, etc.) for env-validation
   parse-at-load. Phase 4 should switch to GitHub Actions secrets for
   production-like preview builds; do NOT commit real values.

---

*Audit generated: 2026-04-28*
*ASVS Level: 1 (default for pre-launch waitlist)*
*block_on: open_threats > 0 — current open: 0*
