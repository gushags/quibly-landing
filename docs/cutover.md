# Cutover Runbook: useQuibly.com → marketing-app

A future-oriented checklist for the day `marketing-app` is ready to inherit `useQuibly.com` from this `quibly-landing` waitlist project. You're reading this because the full marketing site is finally feature-complete and you want the apex to flip from the pre-launch waitlist to the real Quibly site. Read it end-to-end before you start; the cutover should take ~30 minutes when you've done the prep, not several hours of figuring things out under pressure.

This is **not** an emergency rollback procedure (see Rollback Plan at the end), and it is **not** the launch-day go-live for the waitlist itself (that lived in `06-UAT.md` and is long behind you). This is the apex hand-off only.

---

## When to use this runbook

Run this when **all** of the following are true: `marketing-app` is deployed to Vercel, healthy on a preview URL, and ready to take public traffic; you have ~60 minutes uninterrupted and the Vercel + Resend dashboards open in front of you; you have completed the cutover-day-minus-1 dry-run on `staging.useQuibly.com` (Plan 06-04). If any of those is false, stop and finish that prerequisite first — this runbook assumes them.

Do **not** run this for an emergency rollback, a Resend deliverability incident, or a Vercel platform outage. None of those is a cutover; the recovery paths look very different.

---

## Prerequisites (what must be true before starting)

- `marketing-app` Vercel project deployed at preview, healthy, route map locked.
- `marketing-app` Vercel project owns its **own** production env vars: `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`, `RESEND_WEBHOOK_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RESEND_FROM_POSTAL_ADDRESS`, `NEXT_PUBLIC_SITE_URL`. Vercel does **not** transfer env vars across projects on cross-project domain transfer (Pitfall 3 / A2 from Phase 6 research).
- Both `quibly-landing` and `marketing-app` projects live on the **same** Vercel team. The "in-use prompt" same-team transfer flow this runbook uses depends on this. If the projects are on different teams, this runbook does not apply — switch to the cross-team "Move Domain" flow (separate procedure, not covered here).
- Operator (you) has Owner or Member permissions on both Vercel projects. Verify in the team's People tab if unsure.
- The Resend "Quibly Waitlist" production audience is non-empty and current. Sign in to Resend → Audiences and confirm the contact count matches expectations.
- DNS provider for `useQuibly.com` has not been touched since launch. Resend SPF + 3× DKIM + DMARC + Return-Path records live on the apex zone and survive Vercel project transfers — but only if nameservers don't change. **DO NOT touch nameservers** during this procedure (Pitfall 4).
- Inbox for `hello@useQuibly.com` is reachable — you'll compose the broadcast in Resend's dashboard and the From: identity needs to be the sender that already has inbox-placement reputation with these subscribers.
- The welcome email + unsubscribe round-trip is currently passing on production from `quibly-landing`. (If broken on the source side, fix that first; transferring a broken send path solves nothing.)
- You have ~60 minutes uninterrupted. The cutover itself is fast, but the smoke tests + 10-minute propagation wait + verification round bring total elapsed time to roughly an hour.

---

## Step 1: Verify marketing-app is ready

**What to do:**

1. Open `marketing-app`'s preview deployment in a fresh incognito window. Confirm the home page renders, the waitlist (or whatever has replaced it) submits successfully against marketing-app's own production audience, and the welcome path returns 200.
2. Vercel Dashboard → marketing-app → Settings → Environment Variables. Confirm Production scope contains every key listed in Prerequisites. **Missing keys mean the form will 500 the moment you flip the apex.** No exceptions.
3. Run a build locally or trigger a fresh production build on Vercel and confirm green: `vercel --prod` from `marketing-app` (or use the Dashboard's "Deploy" button). Note the deployment URL — you'll want it accessible during the cutover window in case sub-flow B is needed at Step 5.
4. From the team's People tab, confirm your account is listed on both projects with Owner or Member rights.

**What to verify:**

- `curl -sI https://<marketing-app-preview-url>.vercel.app | head -1` returns `HTTP/2 200`.
- `curl -sI https://<marketing-app-preview-url>.vercel.app/privacy | head -1` returns 200.
- `curl -sI https://<marketing-app-preview-url>.vercel.app/sitemap.xml | head -1` returns 200.
- Vercel Dashboard environment-variable panel for marketing-app shows every required key in Production scope (visual scan; you don't need values, just presence).
- Last build status for marketing-app: ready, no errors.

**What could break:**

If marketing-app's production env vars are missing, the form 500s the second the apex flips — and Resend doesn't care that it was healthy 30 seconds ago. Pitfall 3 / A2: env vars do not transfer cross-project on Vercel domain moves. Treat this as a hard gate — if a single key is missing, abort the cutover, set the key in marketing-app, redeploy, and re-run Step 1 from the top.

---

## Step 2: Export Resend Audience as CSV (snapshot for emergency)

**What to do:**

1. Sign in to Resend Dashboard → **Audiences** → **Quibly Waitlist** (the production audience).
2. Click the **Export** button (or context menu → Export Contacts).
3. Confirm filters at the default of "all contacts" — you want the full snapshot, not a filtered slice.
4. If the audience is < 1000 contacts: the CSV downloads immediately. If ≥ 1000 contacts: an emailed link arrives within minutes (link expires after 7 days, admin-only access).
5. Save the CSV somewhere durable on disk: `~/quibly/cutover/<YYYY-MM-DD>-resend-audience.csv`. This is your cold-storage backup if anything goes sideways at the audience level — DO NOT skip it.

**What to verify:**

Open the CSV in a spreadsheet or `head -1 <file>.csv` in a terminal. The header row should include at minimum: `id`, `email`, `created_at`, `unsubscribed`, **and `consent_version`**. Compare the row count (minus the header) against the contact count Resend Dashboard shows for the audience — they should match.

**What could break:**

The dashboard CSV export may **drop the `consent_version` custom property** (Phase 6 research Pitfall 6 / A1 — the underlying `audiences.contacts.list` API only documents standard fields and the dashboard export likely uses the same endpoint shape). If the `consent_version` column is **missing** from the CSV: do **not** proceed with cutover until you have a `consent_version` snapshot via the API. The fallback is a one-time `lib/audience-snapshot.ts` script that paginates `resend.contacts.list({ audienceId, limit: 100, after })` and serializes properties manually — see `06-RESEARCH.md` lines 609–626 for the exact snippet. The GDPR audit trail you built in Phase 4 (consent SHA tagged at submit time) is the load-bearing piece here; losing it on cutover is not recoverable later.

---

## Step 3: Compose pre-cutover launch broadcast in Resend Dashboard

**What to do:**

1. Resend Dashboard → **Broadcasts** → **New Broadcast**.
2. Audience: select **Quibly Waitlist**.
3. From: `Quibly <hello@useQuibly.com>` — the same sender identity that sent the welcome email at signup. **Do not** change senders here; subscribers' inboxes already trust this one.
4. Subject + body: write in Resend's editor. Keep it short, clear, and click-through-oriented (one CTA: "Visit useQuibly.com"). No new product copy invented in this runbook — that's a content task, you wrote it before opening this document.
5. Preview across desktop and mobile in Resend's previewer. Spot-check links open correctly.
6. **Save as draft.** DO NOT send yet — Step 4 picks the moment.

**What to verify:**

- Preview renders correctly on both desktop and mobile in the Resend previewer.
- In the preview's headers view, confirm `List-Unsubscribe` and `List-Unsubscribe-Post` are present (Resend handles these automatically — RFC 8058 one-click unsubscribe).
- Audience selection shows the correct contact count, matching the count you saw at Step 2.
- The "From" line reads `Quibly <hello@useQuibly.com>`, not a default Resend sender.

**What could break:**

DO NOT write a custom broadcast script that loops over the audience via the Resend transactional API. That path is forbidden (Phase 6 D-09). The Resend Broadcasts UI handles `List-Unsubscribe-Post`, the suppression list, click tracking, and send-time scheduling correctly; a hand-rolled loop will subtly miss one of these and torch sender reputation at the worst possible moment. If you find yourself writing code in this step, stop — you're off the runbook.

---

## Step 4: Send broadcast (timing — SAME DAY as cutover, BEFORE the transfer)

**What to do:**

1. Confirm the timestamp: this broadcast goes out **before** Step 5 (the apex transfer). The window is "same day, hours before cutover" — the goal is that subscribers click through and arrive at marketing-app's content shortly after the apex flips, not weeks later.
2. Open the draft from Step 3 in Resend Broadcasts.
3. Click **Send Now** (or Schedule for the chosen window if you want a buffer). Resend dispatches the broadcast from `quibly-landing`'s still-active apex with `hello@useQuibly.com` as sender.
4. Spot-check 2–3 inboxes you control on Gmail / iCloud / Outlook within 60 seconds of send. Confirm arrival, sender display, and unsubscribe link works.

**What to verify:**

- Resend Broadcasts dashboard shows the broadcast status as **Sent** with delivery counts populated.
- Spot-check inboxes show the message arrived in the inbox (not spam) within 60 seconds.
- Click-tracking begins populating in the Resend dashboard within a few minutes of send.

**What could break:**

If you send the broadcast **after** the apex flip in Step 5, the broadcast goes from marketing-app's sender setup — which has no inbox-placement reputation history with this audience yet. Pre-cutover send preserves the reputation anchor (Phase 6 D-08): subscribers see the same `hello@useQuibly.com` they already trust from the welcome email. Reverse the order and you spend reputation rebuilding when you should be spending it on conversion. This ordering is non-negotiable.

---

## Step 5: Atomic Vercel cross-project domain transfer

**What to do:**

Sub-flow A — the in-use prompt, recommended:

1. Vercel Dashboard → **marketing-app** → **Settings → Domains → Add Domain** → enter `useQuibly.com`.
2. Vercel detects the in-use state (the apex is currently assigned to `quibly-landing`) and surfaces the prompt: *"This domain is currently in use by another project. Move it here?"*
3. Confirm → **atomic transfer**. The apex routing flips at the edge in a single propagated change. DNS records on the apex zone are unaffected (they live on the DNS provider, not on Vercel project state). Custom redirects associated with the domain move alongside it.
4. **Note the EXACT button label** Vercel showed you. The dry-run in Plan 06-04 should have already captured this; if reality differs from this document, update the doc before closing the cutover window.

Sub-flow B — `vercel alias set` fallback, only if A doesn't appear:

If Step 5.2's in-use prompt does **not** appear (older Vercel UI version, edge cases), drop to the CLI:

```
vercel alias set <marketing-app-deployment-url> useQuibly.com
```

This aliases the apex to marketing-app's deployment URL while it remains assigned to `quibly-landing`. Then remove the domain from `quibly-landing`'s Settings → Domains and add it cleanly to `marketing-app`. **DO NOT delete the domain from quibly-landing FIRST** — that creates a downtime gap. Always alias-then-cleanup, never cleanup-then-alias. (Phase 6 research lines 263–266 cover this.)

**What to verify:**

- `curl -sI https://useQuibly.com | head -5` returns 200 within ~5 seconds of confirming the transfer.
- Response body shows marketing-app content (not the waitlist hero).
- HSTS header still emits with exactly `Strict-Transport-Security: max-age=300` — the same value the waitlist used. marketing-app's `next.config.ts` must be configured with `max-age=300` and nothing else (no longer max-age, no extra HSTS directives) to keep reversibility intact. If you discover marketing-app strengthened the HSTS policy "while we're at it," abort and fix marketing-app — do not flip into a state where rollback is brick-walled by browser caches.
- `x-vercel-id` header in the response references marketing-app's deployment.

**What could break:**

If Step 5.2's in-use prompt does NOT appear (Vercel UI version variance), use sub-flow B above. **DO NOT delete the domain from quibly-landing FIRST** — that creates an unbounded downtime gap until you can re-add it on marketing-app. Always prefer atomic (sub-flow A) → CLI alias (sub-flow B) → as an absolute last resort, `quibly-landing` keeps the domain and you debug. The DNS records on the apex zone are independent of Vercel — they survive everything below; the only thing flipping is which Vercel project Vercel's edge routes the apex requests to.

---

## Step 6: Post-flip smoke test (curl + browser + signup)

**What to do:**

Run all six checks in order. Stop and jump immediately to the Rollback Plan if any of (1)–(4) fail:

1. `curl -sI https://useQuibly.com | head -1` returns `HTTP/2 200`.
2. Open `https://useQuibly.com` in a fresh incognito browser. Confirm marketing-app's content renders (not the waitlist).
3. Submit a real signup against marketing-app's form (use a fresh email you control).
4. Verify the Resend audience row appears in marketing-app's audience and a welcome email arrives in your inbox within 60 seconds.
5. `curl -s https://useQuibly.com/opengraph-image | head -1` (or `curl -sI` if checking headers only) — confirm 200 and a PNG/binary body.
6. `curl -s https://useQuibly.com/sitemap.xml` returns valid XML beginning with `<?xml version="1.0"`.
7. `curl -s https://useQuibly.com/robots.txt` returns the expected robots policy lines.

**What to verify:**

All seven checks PASS — return codes, response bodies, and the welcome email's actual arrival in your inbox. If any of checks (1)–(4) fails, jump immediately to the Rollback Plan (cold-storage emergency only). Checks (5)–(7) are still important but not transfer-blocking — you can fix sitemap/robots/OG inside marketing-app without un-doing the apex flip.

**What could break:**

A propagation lag on a single resolver or an HSTS-cached client may show stale content for up to ~5 minutes (HSTS=300 bounds this). DO NOT panic on a single-resolver inconsistency. Re-test from a different DNS resolver (`dig @8.8.8.8 useQuibly.com` and `dig @1.1.1.1 useQuibly.com`) and from a fresh incognito window, then wait the full 5 minutes if the transfer was within the last few minutes.

---

## Step 7: Walk marketing-app's route map (verify legacy routes resolve)

**What to do:**

Walk the route map. For each path, `curl -sI https://useQuibly.com<path> | head -1` and confirm a 200 OR a documented redirect to a marketing-app-native URL. Test:

- `/` (home)
- `/privacy`
- `/terms`
- `/unsubscribe`
- `/sitemap.xml`
- `/robots.txt`

These were all present and exposed by `quibly-landing`; subscribers and search engines have links to them. Marketing-app must answer at every one of these paths (200 directly, or a redirect to whatever marketing-app calls the equivalent — e.g., `/legal/privacy`).

**What to verify:**

Each route returns `HTTP/2 200` or a `301`/`308` to a marketing-app-native URL. If any route 404s, you have one of two situations: (a) marketing-app expects a different path → add a `redirect` rule in **marketing-app's repo** (not this runbook); (b) marketing-app removed a path that this site exposed → either add the path back at marketing-app, or accept the 404 if it's a deliberate decommission of a low-traffic page.

**What could break:**

DO NOT pre-script Next.js redirect rules in this runbook (Phase 6 D-04). marketing-app's route map may differ from what's documented above; verify against reality and add redirects in marketing-app's own repo if any 404 is found. This step is **verification only** — adding redirect rules is a marketing-app PR, not a quibly-landing edit.

---

## Step 8: Wait 10 min and re-check propagation

**What to do:**

1. Set a timer for 10 minutes.
2. Use the time productively — check the Resend Broadcasts dashboard for click-through metrics from Step 4's broadcast, watch Vercel Analytics for traffic patterns at the new apex, drink water.
3. After 10 minutes, re-run the entirety of Step 6 from a **fresh** terminal and a **fresh** incognito browser session.
4. Resolve from a second DNS resolver: `dig @8.8.8.8 useQuibly.com` and `dig @1.1.1.1 useQuibly.com`. Compare results — both should return matching IPs.
5. `curl -sI https://useQuibly.com | head -5` from a different network if available (mobile hotspot, neighbor's wifi) — eliminates local-DNS-cache as a confound.

**What to verify:**

Both DNS resolvers return matching IPs. `curl` from both networks returns 200 from marketing-app. Re-run Step 6's checks (1)–(7) all PASS.

**What could break:**

If any resolver still serves stale content after 10 minutes: do **not** change DNS records. The HSTS `max-age=300` cache means individual user agents may take up to 5 min beyond DNS propagation to refresh — that's expected behavior, not a problem. Wait an additional 5 minutes (giving the worst-case HSTS cache 15 minutes total to expire), then re-test. If still stale after 15 minutes total elapsed, escalate: check Vercel Status, check the destination project's domain status in Settings, and only then consider rollback. DO NOT start "fixing" DNS records.

---

## Step 9: Decommission steps (do NOT delete)

**What to do:**

The default posture for every deletable artifact is **don't**. The cutover is not a cleanup operation; cleanup is a separate decision made calmly weeks later, after marketing-app has demonstrated it can carry the load.

- DO NOT delete the `quibly-landing` Vercel project. Keep it on a non-apex preview-only URL (`quibly-landing-<hash>.vercel.app`) for cold-storage rollback access for at least 30 days. You can pause deployments to save resources, but the project itself should remain in the team.
- DO NOT delete the Resend "Quibly Waitlist" audience. Marketing-app may continue reading from it OR re-import via the CSV from Step 2. The audience itself costs nothing to keep.
- DO NOT delete the verified Resend domain `useQuibly.com`. DNS records survive the Vercel project transfer (Pitfall 3 reasoning); marketing-app inherits sender capability without re-verification. Deleting the Resend domain restarts a 72-hour DNS verification cycle for no benefit.
- DO NOT touch DNS nameservers (Pitfall 4). Every DNS record on the apex resets if nameservers change — Resend SPF/DKIM/DMARC, Vercel routing, MX records, the lot.
- You **may** archive the `quibly-landing` GitHub repo (read-only mode) once you're confident in marketing-app's new ownership. This preserves git history without inviting accidental edits.
- You **may** set the `quibly-landing` Vercel deployment to "paused" status to save build minutes, while leaving the project structurally intact.

**What to verify:**

- `quibly-landing` still resolves on its `*.vercel.app` URL (`curl -sI https://quibly-landing.vercel.app | head -1` → 200). This is rollback path A — if the project itself is gone, you have no rollback.
- Resend Audience export from Step 2 is still readable on disk (`head -1 ~/quibly/cutover/<YYYY-MM-DD>-resend-audience.csv` returns the header row).
- Resend Dashboard still shows `useQuibly.com` as a verified sender domain with green checkmarks on SPF / DKIM / DMARC / Return-Path.

**What could break:**

Deleting the Resend domain restarts a 72-hour DNS verification cycle. Deleting the audience loses contact history and the GDPR consent_version trail Step 2 was preserving. Touching nameservers resets every DNS record on the apex (Resend deliverability gone, Vercel routing gone, MX records gone). None of these is recoverable in less than a day, and several are not recoverable at all without re-doing weeks of setup. The asymmetric blast radius is what makes "do not delete" the policy — when in doubt, don't.

---

## Rollback Plan (cold storage emergency only)

Only invoke this if Step 6's hard checks (1)–(4) failed and the failure is not a transient propagation issue. Per Phase 6 D-01, rollback is treated as a cold-storage emergency, not a routine option. The HSTS `max-age=300` safety net means client-side reversibility within ~5 minutes once the apex flips back; most clients won't have cached anything longer.

Steps:

1. Vercel Dashboard → `quibly-landing` → **Settings → Domains → Add Domain → `useQuibly.com`**. The same in-use prompt fires in reverse: "This domain is currently in use by another project. Move it here?" Confirm.
2. Smoke test: `curl -sI https://useQuibly.com | head -1` returns 200 from `quibly-landing` (response body is the waitlist hero).
3. HSTS `max-age=300` means client-side reversibility within ~5 min. The 5-minute window is the worst-case client cache lifetime; beyond that, every visitor is back on the waitlist.
4. Investigate the marketing-app failure that triggered rollback. The cause is rarely the cutover itself — it's almost always missing env vars (Pitfall 3), a route map gap (Step 7), or a Resend integration not installed at marketing-app's project level.

**GSD command for rollback investigation:**

```
/gsd-debug Cutover rollback — apex flipped back to quibly-landing because <reason>. Investigate <hypothesis>; check <files>; verify <env>.
```

Fill in `<reason>`, `<hypothesis>`, `<files>`, and `<env>` from what Step 6's failed check actually showed you. Specifics get a faster diagnosis than vague "rollback investigation" prompts.

---

## Summary Checklist

Use this as a one-screen sanity check during the cutover. Tick each box as you complete it.

- [ ] Step 1: marketing-app preview is healthy; production env vars set; build green; team membership confirmed
- [ ] Step 2: Resend Audience CSV exported; `consent_version` column present (or API fallback executed if missing)
- [ ] Step 3: Broadcast composed in Resend Dashboard, sender = `Quibly <hello@useQuibly.com>`, saved as draft
- [ ] Step 4: Broadcast sent BEFORE Step 5; spot-checked inbox arrivals on Gmail/iCloud/Outlook
- [ ] Step 5: Atomic Vercel cross-project transfer confirmed; in-use prompt observed (or sub-flow B alias-then-cleanup executed)
- [ ] Step 6: Smoke test all seven checks PASS — apex curl 200, browser load, real signup, audience row + welcome email, OG, sitemap, robots
- [ ] Step 7: Legacy route walk — `/`, `/privacy`, `/terms`, `/unsubscribe`, `/sitemap.xml`, `/robots.txt` each 200 or documented redirect
- [ ] Step 8: 10-minute propagation wait; re-run Step 6; second DNS resolver (`@8.8.8.8` + `@1.1.1.1`) returns matching IPs
- [ ] Step 9: `quibly-landing` Vercel project preserved (not deleted); Resend audience preserved; Resend domain preserved; nameservers untouched; CSV backup verified on disk
- [ ] Rollback rehearsal: confirmed before starting that you remember the rollback flow (transfer apex back to `quibly-landing` via the same in-use prompt) — even if you don't expect to use it
