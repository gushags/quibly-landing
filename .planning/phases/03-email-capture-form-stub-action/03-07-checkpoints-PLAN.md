---
phase: 03
plan: 07
id: 03-07
title: Checkpoints — branch protection (D-18) + founder copy review (D-04)
type: execute
wave: 4
depends_on: ["03-01", "03-03", "03-05", "03-06"]
files_modified: []
autonomous: false
requirements: []
requirements_addressed: []
nyquist_compliant: true

must_haves:
  truths:
    - "D-18: branch protection on main requires the new `Tests / vitest` job (manual GitHub UI checkpoint task — Task 1)"
    - "D-18: branch protection on main requires the new `Tests / playwright` job (manual GitHub UI checkpoint task — Task 1)"
    - "Founder reviewed and approved (or revised) the WaitlistFormSection draft H2 (`Be first when Quibly opens up.`) and sub-copy (`Drop your email and we'll ping you the moment Quibly's ready for the world.`) per D-04 / UI-SPEC Copywriting Contract"
  artifacts: []
  key_links:
    - from: "GitHub branch protection rule for main"
      to: "Tests / vitest + Tests / playwright job names"
      via: "GitHub UI: Settings > Branches > Branch protection rule for main > Require status checks"
      pattern: "manual"
    - from: "PR review thread"
      to: "Founder ack of D-04 draft strings"
      via: "GitHub PR comment thread or checklist"
      pattern: "manual"
---

<objective>
Two checkpoint tasks closing Phase 3 manual gates: (1) add the new test workflow's job names to `main` branch protection per D-18, and (2) capture founder review/ack of the D-04 draft section H2 + sub-copy per UI-SPEC Copywriting Contract.

Purpose: D-18 mandates branch-protection enforcement of the test gates (mirrors Phase 2 D-34 Lighthouse-CI gate). D-04 mandates founder review of section copy strings before the PR merges. Both are GitHub-UI-only steps that cannot be automated from a workflow file.

Output: Branch protection updated; founder review thread created and closed.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@.planning/phases/03-email-capture-form-stub-action/03-CONTEXT.md
@.planning/phases/03-email-capture-form-stub-action/03-RESEARCH.md
@.planning/phases/03-email-capture-form-stub-action/03-VALIDATION.md
@.planning/phases/03-email-capture-form-stub-action/03-UI-SPEC.md
@.planning/phases/03-email-capture-form-stub-action/03-01-SUMMARY.md
@.planning/phases/03-email-capture-form-stub-action/03-03-SUMMARY.md

<interfaces>
The two new CI status check names produced by Plan 01's `.github/workflows/test.yml` (top-level `name: Tests` plus job names):
- `Tests / vitest`
- `Tests / playwright`

Existing Phase 2 status check (already required on `main` per Phase 2 D-34, although STATE.md notes the actual UI configuration is "Pending follow-up PR session"):
- `Lighthouse CI / lighthouse`

D-04 draft strings (UI-SPEC Copywriting Contract — locked draft pending founder review):
- Section H2: `Be first when Quibly opens up.` (5 words)
- Sub-copy: `Drop your email and we'll ping you the moment Quibly's ready for the world.` (14 words)

File location of these drafts: `components/sections/waitlist-form-section.tsx` (created by Plan 03 Task 2).

PROJECT.md tone reference (for founder copy review):
"conversational, modern, friendly, confident, playful, energetic, upstart"
</interfaces>
</context>

<tasks>

<task type="checkpoint:human-action" gate="blocking">
  <name>Task 1: D-18 — Add Tests / vitest + Tests / playwright job names to main branch protection</name>
  <what-built>
    D-18: both test layers required as PR gates. Plan 01 (Wave 1) shipped `.github/workflows/test.yml` with two jobs (`vitest` and `playwright`). The status checks GitHub will produce on each PR are exactly:
    - `Tests / vitest`
    - `Tests / playwright`

    For these to enforce-on-main per D-18, the GitHub UI's branch protection rule for `main` must list both names as required status checks. This is the same friction Phase 2 D-34 hit with `Lighthouse CI / lighthouse`.

    The workflow itself is shipped and committed by Plan 01. This checkpoint configures the enforcement gate — it is the manual GitHub UI half of D-18 (test layers required as PR gates) that no workflow file can self-toggle.
  </what-built>
  <how-to-verify>
    Performed by the founder (gushags) on github.com:

    1. Open the repo's branch protection settings:
       - Navigate to the repo on GitHub
       - Click Settings (top-right tab; requires admin/owner permission)
       - In the left sidebar, click `Branches` (under "Code and automation")

    2. Edit the protection rule for `main`:
       - Find the rule targeting `main` (if Phase 2 D-34's rule was created, this row exists; if not — see fallback below)
       - Click `Edit` next to the rule

    3. Under `Require status checks to pass before merging`:
       - Confirm the box is checked
       - In the search field, type `Tests` — matching CI runs from the new workflow should appear after it has run at least once on a PR
       - Add `Tests / vitest` to the required-status-checks list (D-18)
       - Add `Tests / playwright` to the required-status-checks list (D-18)
       - Confirm `Lighthouse CI / lighthouse` is also in the list (Phase 2 D-34 — STATE.md notes this is itself "Pending follow-up"; if missing, add it now per Phase 2 STATE.md Deferred Items)

    4. Click `Save changes` at the bottom of the rule edit page.

    5. Verify: open a fresh test PR (or push a branch) — the new merge controls should now block until both Tests / vitest and Tests / playwright report green (D-18 enforcement live).

    Fallback (if no protection rule exists on main yet):
    - Click `Add classic branch protection rule`
    - Branch name pattern: `main`
    - Check `Require status checks to pass before merging`
    - Check `Require branches to be up to date before merging`
    - Add the three status check names: `Tests / vitest` (D-18), `Tests / playwright` (D-18), `Lighthouse CI / lighthouse`
    - Save

    Pre-requisite: the Tests workflow MUST have run at least once on a PR so GitHub's status-check search can find the names. Trigger by pushing the Phase 3 branch (or by re-running CI on an open PR).
  </how-to-verify>
  <resume-signal>
    Founder responds with one of:
    - `approved` — branch protection updated; both Tests jobs are required (D-18 enforcement live)
    - `partial: <details>` — one job added, the other failed; describe what blocked
    - `deferred — see STATE.md` — same treatment as Phase 2 D-34 (added to STATE.md Deferred Items as a follow-up PR session); proceed with merge BUT log the deferral

    On `deferred`, executor MUST update STATE.md `Deferred Items` table with:
    | CI Gate (Phase 03) | 03-07 Task 1 (D-18): Add `Tests / vitest` + `Tests / playwright` to main branch protection | Pending follow-up PR session | Phase 03 execution |
  </resume-signal>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Founder copy review for D-04 draft section H2 and sub-copy</name>
  <what-built>
    Plan 03 Task 2 shipped `components/sections/waitlist-form-section.tsx` with two DRAFT copy strings (per CONTEXT D-04 — Claude drafts, founder edits in PR):

    1. Section H2: `Be first when Quibly opens up.` (5 words — UI-SPEC Copywriting Contract line 178)
    2. Sub-copy paragraph: `Drop your email and we'll ping you the moment Quibly's ready for the world.` (14 words — UI-SPEC line 179)

    Both strings are flagged as "DRAFT — founder reviews/edits in PR" in the file's JSDoc and the UI-SPEC. Phase 4 ladders up to the same "Check your inbox" promise in the welcome email subject; Phase 5 layers consent + "no spam" microcopy below.

    This checkpoint captures founder ack (or revision request) before the Phase 3 PR merges.
  </what-built>
  <how-to-verify>
    Performed by the founder via PR review:

    1. Open the Phase 3 PR on GitHub (the branch that contains this Plan's commits).

    2. Locate `components/sections/waitlist-form-section.tsx` in the PR's "Files changed" tab.

    3. Read the two DRAFT strings in context:
       - H2 line: `<h2 ...>Be first when Quibly opens up.</h2>` (5 words)
       - Sub-copy line: `<p ...>Drop your email and we'll ping you the moment Quibly's ready for the world.</p>` (14 words)

    4. Review each string against PROJECT.md tone of voice (conversational, modern, friendly, confident, playful, energetic, upstart):
       - Does the H2 promise the right thing? (waitlist exclusivity without hype)
       - Does the sub-copy bridge to the email expectation set in POST-02 / Phase 4 welcome email?
       - Is the contraction "we'll" / "Quibly's" on-brand? (UI-SPEC line 199 — yes, conversational tone)
       - Does either string read presumptuous, generic, or awkward?

    5. Approve as-is OR leave PR comments with proposed revisions:
       - Format: leave a single inline comment on each line that needs changing
       - Specify the exact replacement string (so executor lands the change without ambiguity)
       - Mark any deferred-to-Phase-5 ideas (e.g., "I want consent microcopy here" → that's Phase 5 LEGAL-06 territory)

    6. If revisions are requested, executor edits the file in a follow-up commit on the same PR.

    7. Founder re-reviews and approves on follow-up.

    Critical: do NOT block on copy that founder marks "ship as-is, I'll iterate post-launch" — the PR can merge with the drafts intact if founder explicitly OKs.
  </how-to-verify>
  <resume-signal>
    Founder responds with one of:
    - `approved as-is` — both strings ship verbatim per the draft
    - `revised: H2="<new>" sub="<new>"` — executor lands the new strings via `Edit` on `components/sections/waitlist-form-section.tsx` (preserve H2 class chain, preserve `&apos;` HTML entities for apostrophes), then ack
    - `defer to post-launch` — same as approved-as-is for Phase 3 purposes; document in STATE.md that the strings are "shipped draft, post-launch iteration expected"
  </resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| GitHub repo settings → admin/owner action | Branch protection enforcement requires admin permission; the founder is the only person with that role |
| PR review thread → merge gate | GitHub-native review approval flow; standard human-in-the-loop |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-CI-01 | T (Tampering) / E (Elevation of Privilege) | Branch protection on `main` | mitigate | D-18 enforcement — both Tests jobs required as status checks. If the workflow file is later modified to skip tests (Tampering), CI must still report success for the merge to land. |
| T-03-COPY-01 | I (Information Disclosure) | Founder copy review | accept | The draft strings are not security-sensitive; founder review is brand/voice gate, not security gate. |

No `high` severity threats. Plan 07 ships ZERO production code (autonomous: false) — both checkpoints are manual workflows.
</threat_model>

<verification>
This plan is `autonomous: false` — both tasks pause for the founder. Verification is procedural, not automated.

Procedural verification:

1. **Branch protection (Task 1 — D-18 enforcement):**
   - After founder responds `approved`: open the protection rule on github.com and visually confirm both `Tests / vitest` and `Tests / playwright` appear in the required-status-checks list (D-18 satisfied).
   - Open a test PR. Push a commit that intentionally breaks one Vitest test. Confirm merge is blocked until the test is fixed.
   - On `deferred`: confirm STATE.md `Deferred Items` table has the new D-18 row added.

2. **Founder copy review (Task 2):**
   - Confirm the founder's response is captured in the PR thread (resume-signal text).
   - On `revised: ...`: confirm the new strings are landed in `components/sections/waitlist-form-section.tsx` via a follow-up commit.
   - Run `npm run test:unit` after any string change — the Plan 03 Task 4 spec doesn't assert the section H2/sub-copy strings (only form-internal copy like FORM-04, POST-02), so string changes should NOT break the unit suite.
   - Run `npm run test:e2e` after any string change — same reason, no e2e assertion on the section H2/sub-copy.

3. **Phase 3 PR merge readiness:**
   - All status checks green: `Tests / vitest`, `Tests / playwright`, `Lighthouse CI / lighthouse` (this last one may be deferred per Phase 2 STATE.md — does not block Phase 3 if so noted)
   - Founder copy review captured (approved-as-is, revised-and-relanded, or deferred-to-post-launch)
   - Branch protection updated per D-18 (or formally deferred per STATE.md)
</verification>

<success_criteria>
- D-18: founder has explicitly responded to Task 1 (branch protection) — either `approved` (both Tests jobs configured as required status checks), `partial` (one job added), or `deferred` (STATE.md updated with D-18 follow-up row)
- Founder has explicitly responded to Task 2 (copy review) — either `approved as-is`, `revised: ...` (and changes landed), or `defer to post-launch`
- If revisions were landed, the H2 class chain (`mb-4 font-heading text-3xl font-bold leading-tight text-foreground md:text-4xl`) and the `&apos;` HTML entities are preserved
- STATE.md is updated to reflect any deferrals (Task 1 D-18 deferral row added if applicable)
- The Phase 3 PR is merge-ready: all green status checks (or formally deferred), founder ack captured
</success_criteria>

<output>
After completion, create `.planning/phases/03-email-capture-form-stub-action/03-07-SUMMARY.md` documenting:
- Founder's branch protection response (approved / partial / deferred — with details; D-18 enforcement status)
- Founder's copy review response (approved / revised / deferred — with the final shipped strings if revised)
- Final Phase 3 PR merge status (ready / blocked on what)
- Any STATE.md `Deferred Items` rows added (including D-18 deferral if applicable)
- The handoff state for Phase 4 planning (which decisions Phase 4 inherits, which deferrals it must address)
</output>
</output>
