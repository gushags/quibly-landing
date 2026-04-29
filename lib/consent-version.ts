import 'server-only'

/**
 * Phase 5 D-12 / D-14 — content-hash consent_version.
 *
 * CR-01 fix (post-review): compute the hash at BUILD time via
 * `scripts/generate-consent-version.mjs` and re-export the generated constant
 * from `lib/consent-version.generated.ts`. The previous implementation read
 * `app/(legal)/privacy/page.tsx` and `app/(legal)/terms/page.tsx` with
 * `readFileSync` at module load, which crashes in Vercel serverless bundles
 * because:
 *   - Source .tsx files are not included in the deployed function bundle by
 *     default (nft trace ignores runtime-computed paths like process.cwd()).
 *   - The first production invocation would throw ENOENT and every subsequent
 *     invocation in the same container would inherit the sticky module-init
 *     error -- the waitlist would be broken in production.
 *
 * Build-time generation removes runtime fs access entirely. Behavior parity:
 *   - SHA-256 of (privacy + terms) contents
 *   - First 8 lowercase hex chars
 *   - CRLF -> LF normalization (Pitfall 1: Windows dev / Linux build parity)
 *
 * Used by app/actions/join-waitlist.ts to stamp every Resend contact's
 * `properties.consent_version` at signup time (STORE-04 contract continuation
 * from Phase 4 D-CD-03).
 */
export { CONSENT_VERSION } from './consent-version.generated'
