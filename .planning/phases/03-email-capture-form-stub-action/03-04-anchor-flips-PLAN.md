---
phase: 03
plan: 04
id: 03-04
title: Hero + Secondary CTA anchor flips + Phase 2 button-radius spec selector update
type: execute
wave: 1
depends_on: []
files_modified:
  - components/sections/hero.tsx
  - components/sections/secondary-cta.tsx
  - tests/visual/button-radius.spec.ts
autonomous: true
requirements:
  - FORM-04
requirements_addressed:
  - FORM-04
nyquist_compliant: true

must_haves:
  truths:
    - "Hero CTA renders as `<Button asChild size=hero variant=default><a href=#waitlist>Join the waitlist</a></Button>` (D-01 — overrides Phase 2 D-31 for hero only)"
    - "Secondary CTA renders as `<Button asChild size=hero variant=default><a href=#waitlist>Don't miss launch — join the waitlist</a></Button>` (D-02 — overrides Phase 2 D-31 for secondary)"
    - "Hero CTA copy is exactly `Join the waitlist` (FORM-04 verbatim with Phase 2 D-12 — hero copy was placeholder `Form coming soon` in Phase 2)"
    - "Secondary CTA copy is `Don't miss launch — join the waitlist` (D-12 lock — UNCHANGED from Phase 2)"
    - "`tests/visual/button-radius.spec.ts` selector updated from `button[aria-disabled=true]` to `[data-slot=button][data-size=hero]` (Pitfall 9 — hero pills now render as `<a>` not `<button>` after asChild flip)"
    - "`tests/visual/button-radius.spec.ts` expected count update: was 3 disabled buttons (Phase 2), now ≥3 hero pills (mix of `<a>` and `<button>`); the EXACT count is verified empirically per Phase 3 page composition"
  artifacts:
    - path: "components/sections/hero.tsx"
      provides: "Hero with smooth-scroll anchor CTA (asChild pattern)"
      contains: "Button asChild"
    - path: "components/sections/secondary-cta.tsx"
      provides: "Secondary CTA with smooth-scroll anchor (asChild pattern)"
      contains: "Button asChild"
    - path: "tests/visual/button-radius.spec.ts"
      provides: "Updated selector for tag-agnostic hero pill detection"
      contains: "data-slot=\"button\""
  key_links:
    - from: "components/sections/hero.tsx"
      to: "#waitlist (in waitlist-form-section.tsx)"
      via: "<a href=#waitlist> + CSS scroll-behavior:smooth"
      pattern: "href=\"#waitlist\""
    - from: "components/sections/secondary-cta.tsx"
      to: "#waitlist"
      via: "<a href=#waitlist> + CSS scroll-behavior:smooth"
      pattern: "href=\"#waitlist\""
    - from: "tests/visual/button-radius.spec.ts"
      to: "all <Button size=hero> instances on page"
      via: "data-slot + data-size attribute selector (tag-agnostic)"
      pattern: "data-slot=\"button\".*data-size=\"hero\""
---

<objective>
Flip the Hero CTA and Secondary CTA from disabled `<button aria-disabled>` (Phase 2 D-31) to anchor-as-button (`<Button asChild><a href="#waitlist">`) per Phase 3 D-01 and D-02. Update the Phase 2 button-radius regression spec's selector to be tag-agnostic so it catches both `<button>` (the form's submit during pending) and `<a>` (the new hero/secondary anchors) — Pitfall 9 mitigation.

Purpose: With a real form below the fold (Plan 03), the hero anchor becomes meaningful UX (scrolls cold visitors to commit) instead of the no-op self-anchor Phase 2 D-31 was rejecting. Phase 2's button-radius spec used `button[aria-disabled="true"]` as its selector — Phase 3's `<Button asChild>` Slot pattern renders `<a data-slot="button" data-size="hero">` which the old selector misses entirely.

Output: Two `<Button asChild>` anchor pills + one updated regression spec. NO new files; no impact on the form itself; runs in parallel with Plan 01 in Wave 1.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/03-email-capture-form-stub-action/03-CONTEXT.md
@.planning/phases/03-email-capture-form-stub-action/03-RESEARCH.md
@.planning/phases/03-email-capture-form-stub-action/03-PATTERNS.md
@.planning/phases/03-email-capture-form-stub-action/03-UI-SPEC.md
@CLAUDE.md
@components/sections/hero.tsx
@components/sections/secondary-cta.tsx
@components/ui/button.tsx
@tests/visual/button-radius.spec.ts

<interfaces>
The `<Button asChild>` Slot pattern (already wired in `components/ui/button.tsx:49,55`):
```ts
asChild = false,
// ...
const Comp = asChild ? Slot.Root : "button"
```

Slot.Root merges Button's class chain onto the child element type. With `asChild` + `<a>` child, the rendered DOM is:
```html
<a data-slot="button" data-variant="default" data-size="hero" class="..." href="#waitlist">Join the waitlist</a>
```

The `data-slot="button"` and `data-size="hero"` attributes are set by the Button component itself (lines 59-61) regardless of `asChild` value — these are the tag-agnostic selectors for the spec update.

Current hero CTA (`components/sections/hero.tsx:39-41`) — to FLIP:
```tsx
<Button size="hero" variant="default" type="button" aria-disabled="true">
  Form coming soon
</Button>
```

Current secondary CTA (`components/sections/secondary-cta.tsx:24-26`) — to FLIP:
```tsx
<Button size="hero" variant="default" type="button" aria-disabled="true">
  Don&apos;t miss launch — join the waitlist
</Button>
```

Current button-radius spec selector (`tests/visual/button-radius.spec.ts:31`) — to UPDATE:
```ts
const heroButtons = page.locator('button[aria-disabled="true"]')
```

The CSS `scroll-behavior: smooth` lives at `app/globals.css:96` (Phase 2 carry-over), and the `prefers-reduced-motion: reduce` override lives at `app/globals.css:100-106`. Phase 3 does NOT touch globals.css — both behaviors are inherited.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Flip Hero CTA to <Button asChild><a href=#waitlist>Join the waitlist</a></Button></name>
  <files>components/sections/hero.tsx</files>
  <read_first>
    - /Users/jeff/repos/quibly-landing/components/sections/hero.tsx (entire file — current state to surgically modify)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-PATTERNS.md (lines 452-481 — exact change pattern; preserve-verbatim list)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-UI-SPEC.md (line 226 — Component Inventory > Modified row for hero.tsx)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-CONTEXT.md (D-01 — single form, hero CTA becomes anchor; specifics line ~115 — override of D-31 for hero only)
    - /Users/jeff/repos/quibly-landing/components/ui/button.tsx (asChild prop wiring at line 49,55 — Slot.Root pattern verified)
  </read_first>
  <action>
    Edit ONLY the `<Button>` element (currently lines 39-41) inside `<div className="mt-4 flex flex-col items-center">` and the JSDoc reference to "Phase 3 will replace the disabled CTA control with the form's real submit". Preserve all other content verbatim.

    Change FROM (current lines 39-41):
    ```tsx
    <Button size="hero" variant="default" type="button" aria-disabled="true">
      Form coming soon
    </Button>
    ```

    Change TO:
    ```tsx
    <Button asChild size="hero" variant="default">
      <a href="#waitlist">Join the waitlist</a>
    </Button>
    ```

    Also update the JSDoc at line 19-21. Replace this stale block:
    ```
     * Phase 3 will replace the disabled CTA control with the form's real submit (copy
     * reverts to FORM-04 verbatim).
     */
    ```
    With (present-tense, accurate to the new state):
    ```
     * Phase 3 flipped the disabled placeholder CTA back to a smooth-scroll anchor
     * (<a href="#waitlist">) per Phase 3 D-01 — overrides Phase 2 D-31 for the
     * hero only because the WaitlistFormSection now hosts a real form below the fold,
     * making the anchor meaningful UX (cold visitor → form). asChild + Slot.Root
     * preserves the visual pill identity (28px radius, teal bg, ~52px tall — Phase 2
     * D-06 / D-07 lock) while the rendered DOM is <a> not <button>.
     */
    ```

    Critical preservation rules:
    - Do NOT modify the surrounding `<div className="mt-4 flex flex-col items-center">` wrapper (line 38)
    - Do NOT modify the `"Launching Summer 2026"` microcopy `<p>` (line 42) — HERO-05 / D-11 lock
    - Do NOT modify the radial gradient background (line 27)
    - Do NOT modify the `<HeroMascot>`, `<h1>`, or sub-headline (lines 30-37) — Phase 2 LCP guard
    - Do NOT modify the section-level `<section className="relative isolate overflow-hidden py-8 md:py-16 lg:py-24">` wrapper
    - Copy text MUST be exactly `Join the waitlist` (FORM-04 verbatim with Phase 2 D-12 — was placeholder `Form coming soon` only because Phase 2 wasn't ready to commit to the lock)
    - Use `asChild` (NOT `as="a"`, NOT `component={A}` — `asChild` is the verified Slot.Root prop per RESEARCH lines 469-475)

    Per D-01, FORM-04, HERO-04 (single primary CTA above fold — anchor still counts as the single primary CTA).
  </action>
  <verify>
    <automated>F=/Users/jeff/repos/quibly-landing/components/sections/hero.tsx; grep -q '<Button asChild size="hero" variant="default">' $F && grep -q '<a href="#waitlist">Join the waitlist</a>' $F && ! grep -q 'aria-disabled' $F && ! grep -q 'Form coming soon' $F && grep -q 'Launching Summer 2026' $F && grep -q 'class="mt-4 flex flex-col items-center"\|className="mt-4 flex flex-col items-center"' $F && cd /Users/jeff/repos/quibly-landing && npx tsc --noEmit && npm run lint</automated>
  </verify>
  <acceptance_criteria>
    - File `components/sections/hero.tsx` contains the literal `<Button asChild size="hero" variant="default">` (asChild prop)
    - File contains the literal `<a href="#waitlist">Join the waitlist</a>` (anchor wrapped child)
    - File does NOT contain ANY occurrence of `aria-disabled` (the Phase 2 disabled state is gone for the hero)
    - File does NOT contain `Form coming soon` (Phase 2 placeholder copy gone)
    - File preserves `Launching Summer 2026` microcopy
    - File preserves the `mt-4 flex flex-col items-center` wrapper around the Button
    - File preserves the `<h1>`, `<HeroMascot>`, and sub-headline composition
    - JSDoc no longer says "Phase 3 will replace the disabled CTA control" (replaced with present-tense description)
    - `npx tsc --noEmit` exits 0
    - `npm run lint` exits 0
  </acceptance_criteria>
  <done>Hero CTA is a real `<a href="#waitlist">` wrapped in `<Button asChild>`; `npm run build` succeeds; commit `feat(03-04): flip hero CTA from disabled button to <a href="#waitlist"> (D-01)`.</done>
</task>

<task type="auto">
  <name>Task 2: Flip Secondary CTA to <Button asChild><a href=#waitlist>Don't miss launch — join the waitlist</a></Button></name>
  <files>components/sections/secondary-cta.tsx</files>
  <read_first>
    - /Users/jeff/repos/quibly-landing/components/sections/secondary-cta.tsx (entire file — current state)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-PATTERNS.md (lines 484-502 — exact change pattern; preservation list)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-UI-SPEC.md (line 227 — Component Inventory > Modified row for secondary-cta.tsx)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-CONTEXT.md (D-02 — secondary CTA flips to anchor; rationale: scrolling UP to #waitlist is meaningful for users who scrolled past)
  </read_first>
  <action>
    Edit ONLY the `<Button>` element (currently lines 24-26) and the stale JSDoc reference at lines 7-10. Preserve everything else verbatim.

    Change FROM (current lines 24-26):
    ```tsx
    <Button size="hero" variant="default" type="button" aria-disabled="true">
      Don&apos;t miss launch — join the waitlist
    </Button>
    ```

    Change TO:
    ```tsx
    <Button asChild size="hero" variant="default">
      <a href="#waitlist">Don&apos;t miss launch — join the waitlist</a>
    </Button>
    ```

    Update the JSDoc at lines 7-10 (the stale "Phase 3 replaces this with a real anchor smooth-scroll back-pointer..." text). Replace those lines with:
    ```
     * Phase 3 (D-02): flipped to <Button asChild><a href="#waitlist">. The form lives
     * several thousand pixels above (Hero → WaitlistFormSection → WhyQuibly → FounderVoice
     * → here), so scrolling UP to #waitlist is meaningful UX for visitors who scrolled
     * through the page and want to commit. Smooth-scroll behavior is provided by
     * globals.css:96 (Phase 2 D-08); prefers-reduced-motion override at globals.css:100-106.
    ```

    Critical preservation rules:
    - Do NOT modify the H2 (lines 20-22) — `Ready to stop guessing at marketing?` is locked draft per D-12 (founder may revise in PR but Phase 3 plan does not change it)
    - Do NOT modify the `<div className="mt-8 flex justify-center">` wrapper (line 23)
    - Do NOT modify the section padding `py-16 md:py-24` (Phase 2 D-17 vertical rhythm)
    - Do NOT modify the inner `<div className="mx-auto max-w-6xl px-6 md:px-8 text-center">`
    - The CTA copy text MUST remain exactly `Don't miss launch — join the waitlist` (em-dash literal — Phase 2 D-12 lock)
    - The `&apos;` HTML entity for the apostrophe MUST be preserved (Phase 2 convention for JSX text)

    Per D-02.
  </action>
  <verify>
    <automated>F=/Users/jeff/repos/quibly-landing/components/sections/secondary-cta.tsx; grep -q '<Button asChild size="hero" variant="default">' $F && grep -q 'href="#waitlist">Don&apos;t miss launch — join the waitlist</a>' $F && ! grep -q 'aria-disabled' $F && grep -q 'Ready to stop guessing at marketing' $F && grep -q 'mt-8 flex justify-center' $F && grep -q 'py-16 md:py-24' $F && cd /Users/jeff/repos/quibly-landing && npx tsc --noEmit && npm run lint</automated>
  </verify>
  <acceptance_criteria>
    - File `components/sections/secondary-cta.tsx` contains `<Button asChild size="hero" variant="default">`
    - File contains the literal `<a href="#waitlist">Don&apos;t miss launch — join the waitlist</a>` (em-dash + `&apos;` entity preserved)
    - File does NOT contain `aria-disabled` (Phase 2 disabled state gone for secondary)
    - File preserves the H2 `Ready to stop guessing at marketing?`
    - File preserves `mt-8 flex justify-center` wrapper
    - File preserves `py-16 md:py-24` section padding
    - JSDoc no longer references "Phase 3 replaces this" — present-tense description shipped
    - `npx tsc --noEmit` exits 0
    - `npm run lint` exits 0
  </acceptance_criteria>
  <done>Secondary CTA is a real `<a href="#waitlist">` wrapped in `<Button asChild>`; commit `feat(03-04): flip secondary CTA from disabled button to <a href="#waitlist"> (D-02)`.</done>
</task>

<task type="auto">
  <name>Task 3: Update tests/visual/button-radius.spec.ts selector to be tag-agnostic (Pitfall 9)</name>
  <files>tests/visual/button-radius.spec.ts</files>
  <read_first>
    - /Users/jeff/repos/quibly-landing/tests/visual/button-radius.spec.ts (entire file — current state)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-RESEARCH.md (lines 842-850 — Pitfall 9 verbatim source)
    - /Users/jeff/repos/quibly-landing/.planning/phases/03-email-capture-form-stub-action/03-PATTERNS.md (lines 339-345 + lines 656-669 — exact selector update guidance + asChild pattern note)
    - /Users/jeff/repos/quibly-landing/components/ui/button.tsx (lines 59-61 — confirms data-slot, data-variant, data-size are set regardless of asChild value)
  </read_first>
  <action>
    Three surgical changes to `tests/visual/button-radius.spec.ts`:

    **Change 1: Update the selector at line 31.** From:
    ```ts
    const heroButtons = page.locator('button[aria-disabled="true"]')
    ```
    To:
    ```ts
    // Phase 3 update (Pitfall 9): hero + secondary CTAs are now <a> elements via
    // <Button asChild>; the form's submit is a <button>. The data-slot + data-size
    // attribute selector is tag-agnostic and matches all <Button size="hero">
    // instances regardless of rendered tag (button.tsx:59-61 sets these on all
    // variants). Was: button[aria-disabled="true"] (Phase 2 disabled-button selector).
    const heroButtons = page.locator('[data-slot="button"][data-size="hero"]')
    ```

    **Change 2: Update the count assertion at lines 32-40.** Phase 3 ships:
    - 1 hero CTA (now `<a>`)
    - 1 secondary CTA (now `<a>`)
    - 1 form submit (`<button type="submit">` — only present when form is in idle/error state, NOT in success state)

    Total: **3** hero pills on the idle page. Update the assertion from `expect(count).toBe(3)` (was: 3 disabled placeholder buttons) to:
    ```ts
    // Phase 3 ships exactly THREE hero pills on the idle page:
    //   1. Hero CTA            (<a href="#waitlist"> via asChild — D-01)
    //   2. Secondary CTA       (<a href="#waitlist"> via asChild — D-02)
    //   3. Form submit button  (<button type="submit"> in <WaitlistForm> — D-07)
    // Mix of <a> and <button> tags is exactly why we use the data-slot selector.
    expect(
      count,
      `Phase 3 should render exactly 3 <Button size="hero"> instances (hero anchor + secondary anchor + form submit); found ${count}`,
    ).toBe(3)
    ```

    **Change 3: Update the second test (lines 54-68 — bounding-box height).** The selector inside also needs updating from `button[aria-disabled="true"]` to `[data-slot="button"][data-size="hero"]`. Change line 60 from:
    ```ts
    const heroCta = page.locator('button[aria-disabled="true"]').first()
    ```
    To:
    ```ts
    const heroCta = page.locator('[data-slot="button"][data-size="hero"]').first()
    ```

    Update the JSDoc at the top of the file (lines 11-21) to reflect the new state. Specifically replace lines 12-21:
    ```
     * Phase 2 has THREE rendered <Button size="hero"> instances on `/`:
     *   1. Hero CTA        (components/sections/hero.tsx — "Form coming soon")
     *   2. Placeholder CTA (components/sections/placeholder-form-section.tsx)
     *   3. Secondary CTA   (components/sections/secondary-cta.tsx)
     *
     * Per D-31 all three are <button type="button" aria-disabled="true"> with no href.
     * The selector button[aria-disabled="true"] matches all three.
     *
     * Pre-requisite: `npm run dev` (or `npm run build && npm run start`) running at :3000.
     */
    ```
    With (present-tense, accurate):
    ```
     * Phase 3 ships THREE rendered <Button size="hero"> instances on `/`:
     *   1. Hero CTA            (<a href="#waitlist"> via <Button asChild> — D-01)
     *   2. Form submit         (<button type="submit"> in <WaitlistForm> — D-07)
     *   3. Secondary CTA       (<a href="#waitlist"> via <Button asChild> — D-02)
     *
     * Mix of <a> and <button> tags requires a tag-agnostic selector. We use
     * [data-slot="button"][data-size="hero"] (set in components/ui/button.tsx:59-61
     * regardless of asChild value).
     *
     * If a future phase adds a 4th hero pill or removes one, update the count assertion.
     *
     * Pre-requisite: `npm run dev` (or `npm run build && npm run start`) running at :3000.
     */
    ```

    Also update the JSDoc class chain reference at the top — there's also a reference at line 22 `test.describe("Phase 2 hero button radius (D-06 / 28px lock)", () => {` — leave the describe name as-is (it accurately describes the locked invariant); but the `Phase 2` prefix in the describe block can be left unchanged since the radius invariant traces back to Phase 2 D-06. The 28px lock is what's being asserted.

    Critical preservation rules:
    - Do NOT change `expect(borderRadius).toBe("28px")` — this is the load-bearing radius invariant (Phase 2 D-06)
    - Do NOT change the `viewport: { width: 1280, height: 800 }` desktop viewport in `beforeEach` (radius is viewport-independent; desktop ensures all 3 are reachable)
    - Do NOT delete the second test (height ≥ 48px MOB-02 sanity check) — it's still load-bearing
    - Both `it()`/`test()` blocks must continue to pass — the rename is the ONLY substantive change

    Per Pitfall 9 (RESEARCH lines 842-850), Open Question 4 (RESEARCH lines 1040-1043 — selector verification was flagged as MUST-DO).
  </action>
  <verify>
    <automated>F=/Users/jeff/repos/quibly-landing/tests/visual/button-radius.spec.ts; grep -q '\[data-slot="button"\]\[data-size="hero"\]' $F && ! grep -q 'button\[aria-disabled="true"\]' $F && grep -q 'expect(borderRadius' $F && grep -q '"28px"' $F && grep -c 'data-slot="button"\]\[data-size="hero"' $F | grep -qE "^[2-9]" && cd /Users/jeff/repos/quibly-landing && npx tsc --noEmit && echo "Spec selectors updated; full Playwright run executes in Plan 05's full e2e gate."</automated>
  </verify>
  <acceptance_criteria>
    - File `tests/visual/button-radius.spec.ts` contains `[data-slot="button"][data-size="hero"]` (the new tag-agnostic selector)
    - File does NOT contain `button[aria-disabled="true"]` ANYWHERE (the old Phase 2 selector is gone)
    - The new selector appears in BOTH tests (count assertion + bounding-box height assertion) — `grep -c '\[data-slot="button"\]\[data-size="hero"\]' tests/visual/button-radius.spec.ts` returns ≥ 2
    - The 28px radius invariant (`expect(borderRadius).toBe("28px")`) is preserved unchanged
    - The MOB-02 height check (`expect(box.height).toBeGreaterThanOrEqual(48)`) is preserved unchanged
    - Count assertion updated to expect 3 hero pills (mix of `<a>` + `<button>`)
    - JSDoc reflects the Phase 3 state (no more "all three are disabled buttons" claim)
    - `npx tsc --noEmit` exits 0
  </acceptance_criteria>
  <done>Selector updated; both tests still semantically valid; tsc passes; commit `test(03-04): update button-radius spec to tag-agnostic [data-slot] selector (Pitfall 9)`. Full Playwright run validates in Plan 05's combined e2e gate after the form ships.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| user click → anchor href | `<a href="#waitlist">` — same-document navigation; no cross-origin redirect risk |
| Playwright spec → DOM | Test runs against localhost:3000; no production exposure |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-ANCHOR-01 | T (Tampering) | `<a href="#waitlist">` | accept | Static fragment href; cannot redirect off-site. No `target="_blank"` (no `rel="noopener noreferrer"` needed). |
| T-03-ANCHOR-02 | n/a | Hero/secondary CTAs | n/a | No external network calls, no user input collected — Phase 3 form is the input collection point (covered by Plan 02 + 03 threat models). |
| T-03-ANCHOR-03 | I (Information Disclosure) | button-radius spec selector update | accept | Spec runs CI-side only; no production exposure. The Pitfall 9 fix prevents a silent test regression where Phase 2's spec passes despite Phase 3 breaking the visual contract. |

No `high` severity threats. Plan 04 is purely cosmetic + selector hygiene; the form's defenses live in Plans 02 and 03.
</threat_model>

<verification>
After all three tasks complete:

1. **TypeScript:**
   ```bash
   npx tsc --noEmit
   ```
   Expected: exit 0.

2. **Lint:**
   ```bash
   npm run lint
   ```
   Expected: exit 0.

3. **Build:**
   ```bash
   npm run build
   ```
   Expected: exit 0; production build succeeds.

4. **Selector audit (Pitfall 9 — no orphan old-selector occurrences):**
   ```bash
   grep -rn 'button\[aria-disabled="true"\]' tests/
   ```
   Expected: NO matches (the Phase 2 selector is fully retired).

5. **Anchor presence:**
   ```bash
   grep -c 'href="#waitlist"' components/sections/hero.tsx components/sections/secondary-cta.tsx
   ```
   Expected: 1 in each file (the anchor child of `<Button asChild>`).

6. **No leftover aria-disabled in modified sections:**
   ```bash
   grep 'aria-disabled' components/sections/hero.tsx components/sections/secondary-cta.tsx
   ```
   Expected: NO matches.

7. **Playwright spec list (sanity — no errors loading the updated spec):**
   ```bash
   npx playwright test --list tests/visual/button-radius.spec.ts
   ```
   Expected: lists 2 tests under the spec; no syntax errors.

NOTE: The full Playwright `test:e2e` run that exercises the spec against a running dev server happens in Plan 05's combined e2e gate (or in CI on the PR). Plan 04 only validates static integrity here.
</verification>

<success_criteria>
- Hero CTA is `<Button asChild size="hero" variant="default"><a href="#waitlist">Join the waitlist</a></Button>` (D-01)
- Secondary CTA is `<Button asChild size="hero" variant="default"><a href="#waitlist">Don't miss launch — join the waitlist</a></Button>` (D-02)
- `tests/visual/button-radius.spec.ts` selector is `[data-slot="button"][data-size="hero"]` (Pitfall 9)
- Old `button[aria-disabled="true"]` selector is FULLY removed from the test file
- 28px border-radius invariant (D-06) still load-bearing in the spec
- 48px tap-target invariant (MOB-02) still load-bearing
- All gates green: `tsc`, `lint`, `build`
- No orphan `aria-disabled` attributes in hero.tsx or secondary-cta.tsx
- Plan can run in PARALLEL with Plan 01 in Wave 1 (no shared file conflicts)
</success_criteria>

<output>
After completion, create `.planning/phases/03-email-capture-form-stub-action/03-04-SUMMARY.md` documenting:
- The three pills shipped on `/` after Phase 3 (hero `<a>`, secondary `<a>`, form `<button>`) — for Plan 05's anchor-scroll spec to reference
- Confirmation that `aria-disabled` no longer appears in hero or secondary CTA sections
- Confirmation that the Pitfall 9 selector update is shipped (the form's pending-state `<button>` will be the only remaining `<button type="submit">` `[data-size="hero"]` on the page during pending)
- Note: the combined Playwright run (including this updated spec) runs in Plan 05 against the full Phase 3 page composition
</output>
