import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WaitlistForm } from '@/components/waitlist/waitlist-form'

/**
 * Phase 3 RTL spec — render-time invariants of <WaitlistForm>.
 *
 * State-transition behavior (D-14 success block render, inline error after submit,
 * sonner toast trigger) is covered by Playwright e2e in Plan 03-05 because
 * happy-dom + RTL cannot drive React 19 Server Actions reliably (no React
 * server runtime in the unit env). This file asserts what RTL CAN see:
 *   - Initial DOM (idle state — D-13 pending boolean is false)
 *   - Static input attributes (FORM-02)
 *   - Static copy strings (FORM-04)
 *   - Honeypot presence + off-screen positioning (SPAM-01)
 *
 * Per VALIDATION.md Per-Task Verification Map.
 */

// Stable past renderedAt — passes the time-trap if the test ever drives a submit.
const PAST_RENDERED_AT = Date.now() - 5000

describe('<WaitlistForm>', () => {
  it('renders the form in idle state (FORM-01)', () => {
    render(<WaitlistForm renderedAt={PAST_RENDERED_AT} />)
    expect(screen.getByRole('button', { name: /join the waitlist/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
  })

  it('email input has FORM-02 attributes (type=email, inputMode=email, autoComplete=email, required)', () => {
    render(<WaitlistForm renderedAt={PAST_RENDERED_AT} />)
    const input = screen.getByPlaceholderText('you@example.com') as HTMLInputElement
    expect(input.type).toBe('email')
    expect(input.inputMode).toBe('email')
    expect(input.autocomplete).toBe('email')
    expect(input.name).toBe('email')
    expect(input.id).toBe('email')
    expect(input.required).toBe(true)
  })

  it('submit button copy is exactly "Join the waitlist" (FORM-04 / D-12 verbatim with Phase 2)', () => {
    render(<WaitlistForm renderedAt={PAST_RENDERED_AT} />)
    // Use exact-match name (case-sensitive) — anchors the verbatim copy
    const button = screen.getByRole('button', { name: 'Join the waitlist' })
    expect(button).toBeInTheDocument()
    expect(button).not.toBeDisabled()
  })

  it('binds typed useActionState — initial pending is false (FORM-09 / D-13 idle baseline)', () => {
    render(<WaitlistForm renderedAt={PAST_RENDERED_AT} />)
    const button = screen.getByRole('button', { name: 'Join the waitlist' })
    const input = screen.getByPlaceholderText('you@example.com')
    // Initial state: useActionState(action, null) sets pending=false
    // Button + input both must be enabled (NOT disabled per D-13 pending state)
    expect(button).not.toBeDisabled()
    expect(input).not.toBeDisabled()
  })

  it('honeypot input is present, named "hp_field", off-screen positioned, and password-manager-ignored (SPAM-01 / CD-01 / WR-02)', () => {
    const { container } = render(<WaitlistForm renderedAt={PAST_RENDERED_AT} />)
    const honeypot = container.querySelector('input[name="hp_field"]') as HTMLInputElement
    expect(honeypot).not.toBeNull()
    expect(honeypot.tabIndex).toBe(-1)
    expect(honeypot.getAttribute('aria-hidden')).toBe('true')
    // WR-02: password-manager opt-outs so 1Password / Bitwarden / LastPass do
    // not auto-fill the honeypot for real users.
    expect(honeypot.hasAttribute('data-1p-ignore')).toBe(true)
    expect(honeypot.hasAttribute('data-bwignore')).toBe(true)
    expect(honeypot.getAttribute('data-lpignore')).toBe('true')
    // Off-screen via inline style (NOT display:none — SPAM-01 mandate)
    expect(honeypot.style.position).toBe('absolute')
    expect(honeypot.style.left).toBe('-9999px')
    // Critical anti-assertion: must NOT be display:none (some bots skip those)
    expect(honeypot.style.display).not.toBe('none')
  })

  it('Launching Summer 2026 microcopy is present (HERO-05 / CD-06 layout reservation)', () => {
    render(<WaitlistForm renderedAt={PAST_RENDERED_AT} />)
    expect(screen.getByText('Launching Summer 2026')).toBeInTheDocument()
  })
})
