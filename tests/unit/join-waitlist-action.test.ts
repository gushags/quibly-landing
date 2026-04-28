import { describe, it, expect } from 'vitest'
import { joinWaitlistAction } from '@/app/actions/join-waitlist'

/**
 * Phase 3 stub action coverage — VALIDATION.md per-task verification map.
 *
 * D-10: tests the discriminated-union return shape locked through Phase 4:
 *   - { status: 'success'; duplicate?: boolean }
 *   - { status: 'error'; message?: string; fieldErrors?: Record<string,string>; submittedValues?: { email: string } }
 *
 * D-11: stub branch matrix (Phase 3 only — Phase 4 deletes the email-pattern triggers):
 *   - dup@example.com   → success + duplicate
 *   - err@example.com   → error + message (sonner trigger)
 *   - slow@example.com  → 1500ms delay → success (CD-03)
 *   - any other valid email → success
 *
 * Honeypot + time-trap (SPAM-01, SPAM-02) are REAL Phase 3 defenses and stay live in Phase 4.
 */

function fd(entries: Record<string, string>): FormData {
  const f = new FormData()
  for (const [k, v] of Object.entries(entries)) f.append(k, v)
  return f
}

// Helper: a renderedAt value 5 seconds in the past — passes the 2s time-trap.
const PAST_RENDERED_AT = () => String(Date.now() - 5000)

describe('joinWaitlistAction (Phase 3 stub)', () => {
  it('returns silent success when honeypot is filled (SPAM-01 / D-15)', async () => {
    const r = await joinWaitlistAction(null, fd({
      email: 'real@example.com',
      website: 'https://bot.example.com',
      renderedAt: PAST_RENDERED_AT(),
    }))
    expect(r).toEqual({ status: 'success' })
  })

  it('returns silent success when submitted faster than 2s (SPAM-02 / D-15)', async () => {
    const r = await joinWaitlistAction(null, fd({
      email: 'real@example.com',
      website: '',
      renderedAt: String(Date.now()),
    }))
    expect(r).toEqual({ status: 'success' })
  })

  it('returns fieldErrors and echoes typed value on invalid email (FORM-03 + FORM-06)', async () => {
    const r = await joinWaitlistAction(null, fd({
      email: 'not-an-email',
      website: '',
      renderedAt: PAST_RENDERED_AT(),
    }))
    expect(r.status).toBe('error')
    if (r.status === 'error') {
      expect(r.fieldErrors?.email).toBeTruthy()
      expect(r.submittedValues?.email).toBe('not-an-email')
    }
  })

  it('returns fieldErrors when email is empty (FORM-03)', async () => {
    const r = await joinWaitlistAction(null, fd({
      email: '',
      website: '',
      renderedAt: PAST_RENDERED_AT(),
    }))
    expect(r.status).toBe('error')
    if (r.status === 'error') {
      expect(r.fieldErrors?.email).toBeTruthy()
    }
  })

  it('returns success+duplicate for dup@example.com (POST-03 — state.duplicate flag, never read by UI; D-11 stub trigger)', async () => {
    const r = await joinWaitlistAction(null, fd({
      email: 'dup@example.com',
      website: '',
      renderedAt: PAST_RENDERED_AT(),
    }))
    expect(r).toEqual({ status: 'success', duplicate: true })
  })

  it('returns error with toast message for err@example.com (D-12 sonner routing; D-11 stub trigger)', async () => {
    const r = await joinWaitlistAction(null, fd({
      email: 'err@example.com',
      website: '',
      renderedAt: PAST_RENDERED_AT(),
    }))
    expect(r.status).toBe('error')
    if (r.status === 'error') {
      expect(r.message).toBe('Something went wrong. Try again in a moment.')
      expect(r.fieldErrors).toBeUndefined()
    }
  })

  it('slow@example.com delays ≥1500ms then succeeds (D-11 stub trigger / CD-03)', async () => {
    const t0 = performance.now()
    const r = await joinWaitlistAction(null, fd({
      email: 'slow@example.com',
      website: '',
      renderedAt: PAST_RENDERED_AT(),
    }))
    const dt = performance.now() - t0
    expect(dt).toBeGreaterThanOrEqual(1500)
    expect(r).toEqual({ status: 'success' })
  })

  it('plain valid email returns success (POST-04 stub semantics — every accepted submit is success; D-11 default branch)', async () => {
    const r = await joinWaitlistAction(null, fd({
      email: 'real@example.com',
      website: '',
      renderedAt: PAST_RENDERED_AT(),
    }))
    expect(r).toEqual({ status: 'success' })
  })
})
