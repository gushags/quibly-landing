---
phase: 260504-srf
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/rate-limit.ts
  - .github/workflows/test.yml
autonomous: true
requirements:
  - quick-task
---

<objective>
Mock `@upstash/ratelimit` in CI so the 4 Playwright form tests (enter-key-submit + 3 success-state) stop crashing the Server Action with `TypeError: fetch failed (cert altname mismatch on test.upstash.io)`.

Apply the SAME env-gate pattern just landed for Resend in 260504-rw4 (`lib/resend.ts`). When `process.env.UPSTASH_MOCK === '1'` (set only in the CI Playwright step), both exported limiters become hand-rolled mocks that resolve `{ success: true, … }`. Production paths are byte-identical to today.

Purpose: unblock CI form-test suite without touching the action body, the env schema, or any test file.

Output: a 2-task plan that mirrors `lib/resend.ts` shape into `lib/rate-limit.ts` and adds one env line to `.github/workflows/test.yml`.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@./CLAUDE.md
@.planning/STATE.md
@lib/rate-limit.ts
@lib/resend.ts
@app/actions/join-waitlist.ts
@.github/workflows/test.yml

<interfaces>
<!-- Reference pattern from lib/resend.ts (260504-rw4) — match this shape exactly. -->
<!-- Key invariants: -->
<!--   1. `import 'server-only'` stays as line 1 -->
<!--   2. ESLint disable comment for `process.env.UPSTASH_MOCK` reads (custom/no-raw-process-env rule blocks raw process.env) -->
<!--   3. Mock objects cast `as unknown as Ratelimit` (NOT `as Ratelimit`) -->
<!--   4. Default export shape unchanged at every callsite -->

From lib/rate-limit.ts (current — keep all comments):
```typescript
import 'server-only'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export const rateLimitPerMinute = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '60 s'),
  prefix: '@quibly/ratelimit/min',
})

export const rateLimitPerDay = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, '1 d'),
  prefix: '@quibly/ratelimit/day',
})
```

From app/actions/join-waitlist.ts:146-150 (the ONLY caller — reads `.success` only):
```typescript
const [minResult, dayResult] = await Promise.all([
  rateLimitPerMinute.limit(ip),
  rateLimitPerDay.limit(ip),
]);
if (!minResult.success || !dayResult.success) { … }
```

From `@upstash/ratelimit` `RatelimitResponse` shape (what `.limit()` resolves to):
```typescript
{ success: boolean, limit: number, remaining: number, reset: number /* …pending omitted */ }
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add UPSTASH_MOCK env gate to lib/rate-limit.ts</name>
  <files>lib/rate-limit.ts</files>
  <action>
Modify `lib/rate-limit.ts` to add a CI mock gate mirroring the shape of `lib/resend.ts` (260504-rw4 reference). Final file structure:

1. KEEP line 1: `import 'server-only'`
2. KEEP existing imports (`Ratelimit`, `Redis`)
3. KEEP the entire existing JSDoc block at lines 5–26 verbatim (SPAM-03, D-08, Pitfall 5 context — load-bearing)
4. APPEND a new JSDoc paragraph after line 26 explaining the CI mock gate. Mirror the wording from `lib/resend.ts` lines 22–30 ("CI mock gate (260504-rw4)" block) but:
   - Title it `CI mock gate (260504-srf):`
   - Reference `UPSTASH_MOCK === '1'` (not RESEND_MOCK)
   - Note: Vitest tests use `vi.mock('@/lib/rate-limit')` so the env gate doesn't affect them
   - Note: Vercel never sets UPSTASH_MOCK so prod/preview are immune
   - Note: the mock satisfies the only caller (`app/actions/join-waitlist.ts`) which reads `.success` only
5. ADD the env-gate `const isMock` line with the SAME ESLint disable comment style as `lib/resend.ts:33`:
   ```typescript
   // eslint-disable-next-line custom/no-raw-process-env -- UPSTASH_MOCK is a CI-only test toggle; intentionally NOT in lib/env.ts to avoid forcing production deployments to set it
   const isMock = process.env.UPSTASH_MOCK === '1'
   ```
6. ADD a `makeMockLimiter()` helper that returns a fresh mock object each call. The mock object exposes a `.limit(ip)` method that resolves to a full `RatelimitResponse`-shaped object: `{ success: true, limit: 999, remaining: 999, reset: 0 }`. Use the SAME ESLint disable comment style as `lib/resend.ts` for the unused `_ip` arg (`@typescript-eslint/no-unused-vars -- mock; args intentionally ignored`).
7. CHANGE the export pattern. Each export becomes a ternary that selects mock-or-real. Mock branch MUST call `makeMockLimiter()` separately per export (independent objects, NOT a shared reference — see constraints). Real branch is byte-identical to today (same `Redis.fromEnv()`, same `new Ratelimit({...})` config). Cast each export `as unknown as Ratelimit`.

Final exported shape (illustrative):
```typescript
const redis = isMock ? null : Redis.fromEnv()

export const rateLimitPerMinute = (
  isMock
    ? makeMockLimiter()
    : new Ratelimit({ redis: redis!, limiter: Ratelimit.slidingWindow(5, '60 s'), prefix: '@quibly/ratelimit/min' })
) as unknown as Ratelimit

export const rateLimitPerDay = (
  isMock
    ? makeMockLimiter()
    : new Ratelimit({ redis: redis!, limiter: Ratelimit.slidingWindow(50, '1 d'), prefix: '@quibly/ratelimit/day' })
) as unknown as Ratelimit
```

Note: when `isMock` is true, `Redis.fromEnv()` MUST NOT be called — that's the whole point (it triggers the cert-mismatch fetch even at module load). Either guard with the ternary above, or move the `redis` const inside the non-mock export branches. Pick whichever produces cleaner diff against the original.

Per existing CLAUDE.md `lib/env.ts` invariant: do NOT touch `lib/env.ts`. UPSTASH_MOCK is intentionally NOT in the env schema (same as RESEND_MOCK).
  </action>
  <verify>
    <automated>
# 1. typecheck
npx tsc --noEmit

# 2. lint (custom no-raw-process-env rule must allow the disabled line)
npm run lint

# 3. unit tests — must show zero regression (vitest uses vi.mock so gate is invisible to it)
npm run test:unit

# 4. full CI-equivalent build + e2e form tests with both mocks ON
UPSTASH_MOCK=1 RESEND_MOCK=1 \
  RESEND_API_KEY=re_test_stub \
  RESEND_AUDIENCE_ID=aud_test_stub \
  RESEND_AUDIENCE_PREVIEW_ID=aud_test_preview_stub \
  RESEND_WEBHOOK_SECRET=whsec_test_stub \
  UPSTASH_REDIS_REST_URL=https://test.upstash.io \
  UPSTASH_REDIS_REST_TOKEN=test_token_stub \
  RESEND_FROM_POSTAL_ADDRESS='123 Test St' \
  VERCEL_ENV=development \
  npm run build

UPSTASH_MOCK=1 RESEND_MOCK=1 \
  RESEND_API_KEY=re_test_stub \
  RESEND_AUDIENCE_ID=aud_test_stub \
  RESEND_AUDIENCE_PREVIEW_ID=aud_test_preview_stub \
  RESEND_WEBHOOK_SECRET=whsec_test_stub \
  UPSTASH_REDIS_REST_URL=https://test.upstash.io \
  UPSTASH_REDIS_REST_TOKEN=test_token_stub \
  RESEND_FROM_POSTAL_ADDRESS='123 Test St' \
  VERCEL_ENV=development \
  npm run test:e2e -- --project=visual-and-form tests/form/

# 5. Confirm the mock branch is syntactically reachable (no `Redis.fromEnv()` call when mocked)
grep -n "Redis.fromEnv" lib/rate-limit.ts  # should appear inside the non-mock branch only
grep -c "as unknown as Ratelimit" lib/rate-limit.ts  # exactly 2 (one per export)
    </automated>
  </verify>
  <done>
- `lib/rate-limit.ts` has a `UPSTASH_MOCK === '1'` env gate at module load
- Both `rateLimitPerMinute` and `rateLimitPerDay` are SEPARATE mock instances when gated, both cast `as unknown as Ratelimit`
- Mock `.limit(ip)` returns `Promise.resolve({ success: true, limit: 999, remaining: 999, reset: 0 })`
- Production path (`isMock === false`) is byte-identical to today: same `Redis.fromEnv()` call, same two `new Ratelimit({...})` configs
- `tsc --noEmit` passes, `npm run lint` passes, `npm run test:unit` passes
- The 4 previously-failing Playwright form tests pass with `UPSTASH_MOCK=1 RESEND_MOCK=1`
- `lib/env.ts` UNCHANGED, `lib/resend.ts` UNCHANGED, `app/actions/join-waitlist.ts` UNCHANGED, no test files touched
  </done>
</task>

<task type="auto">
  <name>Task 2: Add UPSTASH_MOCK to the CI Playwright env block</name>
  <files>.github/workflows/test.yml</files>
  <action>
Modify `.github/workflows/test.yml` to set `UPSTASH_MOCK: '1'` in the `Run Playwright tests` step ONLY (line 75–88 in the current file).

1. LOCATE the existing block:
   ```yaml
   - name: Run Playwright tests
     run: npm run test:e2e
     env:
       …existing vars…
       # RESEND_MOCK=1 swaps lib/resend.ts to a hand-rolled mock for form e2e tests (260504-rw4) —
       # without it the form Server Action calls Resend with the stub key and fails 400.
       RESEND_MOCK: '1'
   ```
2. APPEND `UPSTASH_MOCK: '1'` directly under `RESEND_MOCK: '1'`, with a sibling explanatory comment mirroring the RESEND_MOCK comment style:
   ```yaml
   # UPSTASH_MOCK=1 swaps lib/rate-limit.ts to hand-rolled mock limiters for form e2e tests (260504-srf) —
   # without it the form Server Action's Promise.all rate-limit checks fetch test.upstash.io and fail
   # with a TLS cert-altname mismatch (DNS resolves the stub URL to a non-Upstash IP).
   UPSTASH_MOCK: '1'
   ```
3. DO NOT add `UPSTASH_MOCK` to the `Build Next app` step (lines 60–70). Build must keep typechecking against the real `@upstash/ratelimit` SDK surface so future drift is caught.
4. DO NOT modify any other step, the vitest job, or any other file.
  </action>
  <verify>
    <automated>
# 1. YAML must still parse
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/test.yml'))"

# 2. UPSTASH_MOCK appears exactly once (Playwright step only, NOT Build step)
test "$(grep -c 'UPSTASH_MOCK' .github/workflows/test.yml)" -eq 1

# 3. RESEND_MOCK still appears exactly once (didn't break 260504-rw4)
test "$(grep -c 'RESEND_MOCK' .github/workflows/test.yml)" -eq 1

# 4. Both mocks are inside the Playwright step (verify by line proximity to "Run Playwright tests")
awk '/Run Playwright tests/,/upload-artifact/' .github/workflows/test.yml | grep -E "(RESEND_MOCK|UPSTASH_MOCK):" | wc -l | grep -q '^ *2$'
    </automated>
  </verify>
  <done>
- `.github/workflows/test.yml` has `UPSTASH_MOCK: '1'` in the `Run Playwright tests` env block, alongside the existing `RESEND_MOCK: '1'`
- `Build Next app` step is UNTOUCHED (no `UPSTASH_MOCK` there)
- YAML parses cleanly
- Inline comment explains the gate purpose, mirroring the RESEND_MOCK comment style
  </done>
</task>

</tasks>

<verification>
After both tasks complete:
- `tsc --noEmit` passes
- `npm run lint` passes
- `npm run test:unit` passes (zero vitest regression — `vi.mock('@/lib/rate-limit')` overrides the gate)
- `npm run build` passes with the full CI env block (`UPSTASH_MOCK=1 RESEND_MOCK=1` + stubs)
- `npm run test:e2e -- --project=visual-and-form tests/form/` passes the 4 form tests that were failing with `TypeError: fetch failed (cert altname)` after 260504-rw4
- `grep -c 'UPSTASH_MOCK' .github/workflows/test.yml` returns exactly `1`
- `grep -c 'RESEND_MOCK' .github/workflows/test.yml` still returns exactly `1`
- Production code paths are byte-identical to today when `UPSTASH_MOCK !== '1'`
</verification>

<success_criteria>
1. The 4 Playwright form tests (enter-key-submit + 3 success-state) pass in CI on the next run.
2. No other tests regress.
3. `lib/env.ts`, `lib/resend.ts`, `app/actions/join-waitlist.ts`, and all test files are byte-identical before/after this plan.
4. The CI mock gate in `lib/rate-limit.ts` matches `lib/resend.ts` shape (env-gate at top, mock object pre-defined, ternary export with `as unknown as Ratelimit` cast).
5. Production deployments (Vercel preview + production) behave identically to today — `UPSTASH_MOCK` is never set there, so the real `Redis.fromEnv()` + `new Ratelimit({...})` path runs verbatim.
</success_criteria>

<output>
After completion, create `.planning/quick/260504-srf-mock-upstash-rate-limit-in-ci-for-playwr/260504-srf-SUMMARY.md`.
</output>
