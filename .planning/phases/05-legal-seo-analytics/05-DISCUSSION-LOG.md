# Phase 5: Legal + SEO + Analytics - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-29
**Phase:** 5-Legal + SEO + Analytics
**Areas discussed:** Privacy / Terms authoring, AI-crawler robots policy, OG image composition, consent_version mechanism

---

## Privacy / Terms Authoring

### Q1: Where does the privacy/terms text come from?

| Option | Description | Selected |
|--------|-------------|----------|
| Adapt marketing-app's privacy.tsx + write fresh terms | Adapt marketing-app's 282-line TSX to waitlist scope; write terms fresh (marketing-app terms covers paying users) | ✓ |
| Write both fresh from scratch | Tighter fit but ignores prior art; voice may drift at cutover | |
| Use a generator (Termly / iubenda / Termageddon) | Fastest legal coverage but adds third-party script; voice/format won't match brand; $10-30/mo | |

**User's choice:** Adapt marketing-app's privacy.tsx + write fresh terms (Recommended)

### Q2: What file format?

| Option | Description | Selected |
|--------|-------------|----------|
| Plain TSX page.tsx (matches marketing-app) | Hand-written TSX with Tailwind classes; matches existing pattern; no new dep | ✓ |
| MDX with frontmatter version | next-mdx-remote or @next/mdx; lets non-engineers edit; adds dependency | |
| MDX with @next/mdx (file-based) | /privacy/page.mdx renders directly; still adds @next/mdx | |

**User's choice:** Plain TSX page.tsx (Recommended)

### Q3: Are privacy + terms BOTH required v1?

| Option | Description | Selected |
|--------|-------------|----------|
| Both required, both pre-launch | LEGAL-01 + LEGAL-02 explicit; footer references both; cutover-blocking otherwise | ✓ |
| Privacy required; terms deferred to Phase 6 | Waitlist legally only needs privacy; footer would 404 on /terms | |

**User's choice:** Both required (Recommended)

### Q4: Postal address source?

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse RESEND_FROM_POSTAL_ADDRESS env var | Phase 4 already wired; single source of truth; same Zod-refine production guard | ✓ |
| Hard-code in privacy.tsx separately | Decouples privacy text from email infra; risk of drift | |

**User's choice:** Reuse RESEND_FROM_POSTAL_ADDRESS (Recommended)

---

## AI-Crawler Robots Policy

### Q1: Default AI-crawler posture?

| Option | Description | Selected |
|--------|-------------|----------|
| Allow all named AI crawlers | GPTBot, ClaudeBot, Google-Extended, PerplexityBot, CCBot all Allow:/. Brand reach. SUMMARY default | ✓ |
| Deny all named AI crawlers | All Disallow:/. Stance signal but doesn't actually prevent training | |
| Allow training-corpus, deny answer-engine | Allow GPTBot/ClaudeBot/Google-Extended/CCBot; Deny PerplexityBot. Most nuanced | |

**User's choice:** Allow all named AI crawlers (Recommended)

### Q2: Explicit Allow for SEO bots?

| Option | Description | Selected |
|--------|-------------|----------|
| Defaults only — no rule = allowed | robots.ts only enumerates AI-crawler decision; standard SEO bots implicitly allowed | ✓ |
| Explicit Allow for SEO bots | User-agent: Googlebot \\n Allow: / blocks; redundant noise | |

**User's choice:** Defaults only (Recommended)

### Q3: Reversible without code deploy?

| Option | Description | Selected |
|--------|-------------|----------|
| Code-only — robots.ts hard-codes the decision | Single source in repo; PR + deploy to flip; aligns with Vercel cadence | ✓ |
| Env-flag controlled | BLOCK_AI_CRAWLERS=true; ops-grade flips via Vercel env edit; adds env sprawl | |

**User's choice:** Code-only (Recommended)

---

## OG Image Composition

### Q1: Layout?

| Option | Description | Selected |
|--------|-------------|----------|
| Mascot left + tagline right, teal background | Mirrors welcome-email teal-strip aesthetic; mascot is the hook in social previews | ✓ |
| Centered mascot + tagline below, white background | Mirrors landing-page hero; lower contrast on dark social clients | |
| Wordmark + tagline only, no mascot | Type-only; cleaner but loses mascot recognition | |

**User's choice:** Mascot left + tagline right, teal background (Recommended)

### Q2: Tagline text?

| Option | Description | Selected |
|--------|-------------|----------|
| Hero tagline verbatim: "You know your business. Quibly knows how to market it." | HERO-01 locked tagline; coherent with H1 on click-through | ✓ |
| Launch-timing line: "Quibly — Launching Summer 2026. Join the waitlist." | More urgency; matches HERO-05; drift from H1 | |
| Short brand line: "Strategy-first AI marketing for solopreneurs." | Plain description; less voice; clearer cold preview | |

**User's choice:** Hero tagline verbatim (Recommended)

### Q3: Twitter card variant?

| Option | Description | Selected |
|--------|-------------|----------|
| Same image — Twitter card uses og:image | summary_large_image; one asset, one ImageResponse | ✓ |
| Separate app/twitter-image.tsx | Adds maintenance burden; no real cropping benefit | |

**User's choice:** Same image (Recommended)

### Q4: Fonts in ImageResponse?

| Option | Description | Selected |
|--------|-------------|----------|
| Fetch Quicksand+Figtree TTF/OTF at build time | Raw font binaries needed; matches landing typography exactly | ✓ |
| @vercel/og default fonts only | Falls back to system; brand drift; Quicksand voice lost | |

**User's choice:** Fetch Quicksand+Figtree TTF (Recommended)

---

## consent_version Mechanism

### Q1: How should consent_version be computed?

| Option | Description | Selected |
|--------|-------------|----------|
| Hash of privacy.tsx + terms.tsx file contents at build | sha256 first 8 chars; bumps ONLY when policy text changes; most precise | ✓ |
| Vercel deploy git SHA | VERCEL_GIT_COMMIT_SHA; bumps every deploy; noisy | |
| Explicit semver in lib/consent-version.ts (manual) | export const CONSENT_VERSION = 'v1.0'; risk of forgetting bump | |
| Frontmatter version on privacy.mdx | Requires MDX (rejected earlier) | |

**User's choice:** Hash of privacy.tsx + terms.tsx file contents (Recommended)

### Q2: Should the privacy page DISPLAY consent_version?

| Option | Description | Selected |
|--------|-------------|----------|
| Show "Last updated: <date>" — not the hash | Human-readable; matches marketing-app convention; hash is internal-only | ✓ |
| Show both date + version hash | Audit transparency; visual noise | |
| Show neither | No version footer; less transparent | |

**User's choice:** Show "Last updated: <date>" (Recommended)

### Q3: Where is consent_version exposed at runtime?

| Option | Description | Selected |
|--------|-------------|----------|
| Single export from lib/consent-version.ts | One file owns generation + read; no env var; aligns with Phase 1 D-11 | ✓ |
| Env var resolved at runtime | RESEND_CONSENT_VERSION; couples to build-system | |

**User's choice:** Single export from lib/consent-version.ts (Recommended)

### Q4: Re-consent prompts on hash bump?

| Option | Description | Selected |
|--------|-------------|----------|
| No automatic re-consent in v1; relies on welcome email + unsubscribe | Compliance traceability via property snapshot; pre-launch volume doesn't justify infra | ✓ |
| Future-flag: TODO + analytics event when hash changes | Same as above for v1 + emit track('consent_version_drift') for v2 | |

**User's choice:** No automatic re-consent in v1 (Recommended)

---

## Claude's Discretion

Captured in CONTEXT.md `<decisions>` section as CD-01 through CD-09. Summary:
- CD-01: Route layout (`app/(legal)/` group vs top-level `app/privacy`)
- CD-02: Schema.org JSON-LD specific properties + injection point
- CD-03: OG fonts — Google Fonts build fetch vs `public/fonts/*.ttf` checked-in
- CD-04: Last-updated date as static string in TSX
- CD-05: Analytics event property schema stays minimal (no UTM/referrer)
- CD-06: `<Analytics />` + `<SpeedInsights />` mount order in layout.tsx
- CD-07: DSAR mailbox provisioning (founder action item, not Phase 5 code)
- CD-08: Retention period exact wording
- CD-09: robots.ts emit format (Next 16 MetadataRoute.Robots)

## Deferred Ideas

Captured in CONTEXT.md `<deferred>` section. Summary:
- Re-consent prompting UX on consent_version drift (post-launch)
- Privacy-policy MDX + frontmatter version (v2 if non-engineer edits)
- Separate `app/twitter-image.tsx` (v2)
- Env-flag gated robots.ts (`BLOCK_AI_CRAWLERS`)
- Schema.org JSON-LD beyond Organization + WebSite (post-launch / marketing-app)
- A/B testing OG image variants (V2-05)
- Separate `/cookies` route (folded into privacy.tsx instead)
- UTM / referrer / audienceId on `track('waitlist_signup')` (v1.x if needed)
- Vercel Analytics multi-step funnel events (post-launch)
