import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock the Server Action + its type export so lib/env.ts never loads in this RTL
// test environment. Phase 4 wires real Resend deps at module load; this component
// test only exercises render-time DOM invariants and action-resolution state
// transitions driven by mocked Promise resolutions. The JoinWaitlistResult type
// is re-exported for the component to type-check correctly.
vi.mock('@/app/actions/join-waitlist', () => ({
  joinWaitlistAction: vi.fn(async () => ({ status: 'success' as const })),
}))

// Mock sonner so we can assert toast.error was called with D-12 verbatim copy
// without needing to mount <Toaster /> (which is mounted in app/layout.tsx in
// production). Mocking the module returns the same `toast` singleton wherever
// it's imported (component file + this test file).
vi.mock('sonner', () => {
  const toast = {
    error: vi.fn(),
    success: vi.fn(),
    message: vi.fn(),
  }
  return {
    toast,
    Toaster: () => null,
  }
})

import { WaitlistForm } from '@/components/waitlist/waitlist-form'
import { joinWaitlistAction } from '@/app/actions/join-waitlist'
import { toast } from 'sonner'

/**
 * Phase 3 + Phase 4 RTL spec — render-time invariants AND state-transition behavior
 * of <WaitlistForm>.
 *
 * Phase 3 baseline: render-time DOM invariants only (idle state, FORM-02 attrs,
 * FORM-04 copy, SPAM-01 honeypot).
 *
 * Phase 4 extension (plan 04-07 Task 1, replacing 3 deleted Playwright specs):
 *   - server-error-toast (D-12 verbatim copy via `toast.error`) — replaces deleted
 *     tests/form/server-error-toast.spec.ts
 *   - pending UX (Joining... + spinner + disabled input/button) — replaces deleted
 *     tests/form/pending-state.spec.ts
 *   - idempotent (POST-04: rapid double-click during pending dispatches once) —
 *     replaces deleted tests/form/idempotent.spec.ts
 *
 * State-transition tests use vi.mock at the action layer to drive resolution
 * deterministically — no React server runtime needed because the mocked action
 * is a plain client async function that React 19's useActionState awaits.
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

/**
 * Phase 4 plan 04-07 Task 1 — migrated state-transition tests.
 *
 * These three tests replace the Playwright specs that were deleted because they
 * depended on Phase 3 stub-action email triggers (`err@`, `slow@`) that no longer
 * exist after Plan 05's Phase 3 → 4 action body swap. Equivalent coverage is
 * driven here at the React layer with the mocked Server Action returning the
 * relevant resolution shape.
 */
describe('<WaitlistForm> state transitions (Phase 4 RTL migrations)', () => {
  beforeEach(() => {
    vi.mocked(joinWaitlistAction).mockReset()
    vi.mocked(toast.error).mockReset()
    vi.mocked(toast.success).mockReset()
    vi.mocked(toast.message).mockReset()
  })

  it('surfaces sonner toast with D-12 verbatim copy on server error (replaces deleted server-error-toast.spec.ts)', async () => {
    const user = userEvent.setup()
    // Mock the Server Action to return the server-error variant — D-12: status=error
    // AND has message AND no fieldErrors → routes to sonner toast.
    vi.mocked(joinWaitlistAction).mockResolvedValueOnce({
      status: 'error',
      message: 'Something went wrong. Try again in a moment.',
    })
    render(<WaitlistForm renderedAt={PAST_RENDERED_AT} />)
    await user.type(screen.getByPlaceholderText('you@example.com'), 'real@example.com')
    await user.click(screen.getByRole('button', { name: /join the waitlist/i }))

    // toast.error invoked with D-12 verbatim copy
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Something went wrong. Try again in a moment.'),
    )
    // Form remains mounted (no [role=status] block — server-error path keeps the form up)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows pending UX (Joining..., spinner, disabled input/button) during the action round-trip (replaces deleted pending-state.spec.ts)', async () => {
    const user = userEvent.setup()
    // Controlled-delay mock — caller resolves the promise to clear the pending state.
    let resolve!: (v: { status: 'success' }) => void
    vi.mocked(joinWaitlistAction).mockImplementationOnce(
      () =>
        new Promise<{ status: 'success' }>((r) => {
          resolve = r
        }),
    )
    render(<WaitlistForm renderedAt={PAST_RENDERED_AT} />)
    const input = screen.getByPlaceholderText('you@example.com')
    await user.type(input, 'real@example.com')
    const submit = screen.getByRole('button', { name: /join the waitlist/i })
    await user.click(submit)

    // During the pending window: button disabled + "Joining..." label + spinner SVG + input disabled (D-13).
    await waitFor(() => expect(submit).toBeDisabled())
    expect(screen.getByRole('button', { name: /joining/i })).toBeInTheDocument()
    // animate-spin class is on the Loader2 SVG (CD-04)
    const spinner = document.querySelector('svg.animate-spin')
    expect(spinner).not.toBeNull()
    // Email input is also disabled while pending (D-13 — both disabled to prevent double-submit)
    expect(input).toBeDisabled()

    // Resolve to clear the pending state — success block then mounts (POST-01 in-place replacement)
    resolve({ status: 'success' })
    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument())
  })

  it('disabled button during pending makes rapid double-click a no-op — POST-04 (replaces deleted idempotent.spec.ts)', async () => {
    const user = userEvent.setup()
    let resolve!: (v: { status: 'success' }) => void
    const mockedAction = vi.mocked(joinWaitlistAction).mockImplementationOnce(
      () =>
        new Promise<{ status: 'success' }>((r) => {
          resolve = r
        }),
    )
    render(<WaitlistForm renderedAt={PAST_RENDERED_AT} />)
    await user.type(screen.getByPlaceholderText('you@example.com'), 'real@example.com')
    const submit = screen.getByRole('button', { name: /join the waitlist/i })

    // First click — starts the pending state.
    await user.click(submit)
    await waitFor(() => expect(submit).toBeDisabled())

    // Second click during pending — disabled button absorbs it. user-event v14 throws
    // when clicking a disabled element; fireEvent.click bypasses that gating to
    // prove the form's onSubmit is NOT re-invoked even when a click event fires.
    fireEvent.click(submit)

    // Resolve to clear pending and verify final state.
    resolve({ status: 'success' })
    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument())

    // POST-04: action was dispatched exactly once despite the double-click.
    expect(mockedAction).toHaveBeenCalledTimes(1)
  })
})
