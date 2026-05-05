import 'server-only'
import { Resend } from 'resend'
import { env } from '@/lib/env'

/**
 * Phase 4 Resend SDK singleton.
 *
 * `import 'server-only'` (line 1) crashes the build if any client component
 * transitively imports this module — preventing RESEND_API_KEY from ever
 * bundling into the client bundle (T-04-12 mitigation).
 *
 * The API key is the restricted "Sending access" scope (STORE-02 / D-08 from
 * Phase 1) — sourced from `env.RESEND_API_KEY` via the Phase 1 D-11 single
 * env-reader pattern. NEVER read `process.env.RESEND_API_KEY` directly here —
 * the custom `no-raw-process-env` ESLint rule blocks that pattern.
 *
 * Consumers:
 *   - app/actions/join-waitlist.ts (Plan 05) — contacts.get + contacts.create + emails.send
 *   - app/api/webhooks/resend/route.ts (Plan 06) — webhooks.verify + contacts.update
 *   - app/unsubscribe/route.ts (Plan 06) — contacts.update
 *
 * CI mock gate (260504-rw4):
 *   When `RESEND_MOCK === '1'` (set only in the CI playwright test step, never
 *   in Vercel), the export is a hand-rolled mock object that satisfies all four
 *   consumer call sites without touching the live Resend API. This prevents the
 *   form e2e tests from failing with "400: API key is invalid" when running
 *   against the stub key `re_test_stub`. Vitest is unaffected — its tests use
 *   `vi.mock('@/lib/resend')` which replaces this module before the gate runs.
 *   Production deployments never set RESEND_MOCK, so the gate defaults to the
 *   real `new Resend(env.RESEND_API_KEY)` path verbatim.
 */

// eslint-disable-next-line custom/no-raw-process-env -- RESEND_MOCK is a CI-only test toggle; intentionally NOT in lib/env.ts to avoid forcing production deployments to set it
const isMock = process.env.RESEND_MOCK === '1'

const mockResend = {
  contacts: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- mock; args intentionally ignored
    get: async (_args: unknown) => ({
      data: null,
      error: {
        name: 'not_found',
        statusCode: 404,
        message: 'Contact not found',
      },
    }),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- mock; args intentionally ignored
    create: async (_args: unknown) => ({
      data: { id: 'mock-contact-id', object: 'contact' },
      error: null,
    }),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- mock; args intentionally ignored
    update: async (_args: unknown) => ({
      data: { id: 'mock-contact-id', object: 'contact' },
      error: null,
    }),
  },
  emails: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- mock; args intentionally ignored
    send: async (_args: unknown) =>
      Promise.resolve({ data: { id: 'mock-email-id' }, error: null }),
  },
  webhooks: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- mock; args intentionally ignored
    verify: (_args: unknown) => ({ type: 'mock.event', data: {} }),
  },
}

export const resend = (isMock ? mockResend : new Resend(env.RESEND_API_KEY)) as unknown as Resend
