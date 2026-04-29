import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms',
  description: 'Quibly terms — waitlist participation agreement.',
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-heading text-4xl font-bold mb-2">Terms</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: April 29, 2026</p>

      <section className="space-y-4 mb-10">
        <h2 className="font-heading text-xl font-semibold">Acceptance</h2>
        <p className="text-foreground leading-relaxed">
          By joining the Quibly waitlist — that is, by submitting your email address through the
          sign-up form at{' '}
          <a href="https://useQuibly.com" className="text-primary hover:underline">useQuibly.com</a>{' '}
          — you agree to these terms. If you do not agree, please do not submit your email address.
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="font-heading text-xl font-semibold">Nature of the Waitlist</h2>
        <p className="text-foreground leading-relaxed">
          Quibly is currently in pre-launch development. Joining the waitlist signals your interest
          in Quibly and authorizes us to email you when we launch. The waitlist is not a purchase,
          subscription, or contract for services of any kind.
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="font-heading text-xl font-semibold">No Service Guarantees</h2>
        <p className="text-foreground leading-relaxed">
          Launch timing, feature scope, and pricing are subject to change without notice. Joining
          the waitlist creates no guarantee of access to Quibly, no entitlement to any particular
          features or pricing, and no priority position beyond receiving an email notification when
          we launch. We make no representations or warranties regarding when or whether Quibly will
          launch.
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="font-heading text-xl font-semibold">Withdrawal</h2>
        <p className="text-foreground leading-relaxed">
          You can withdraw from the waitlist at any time by unsubscribing via the link in any email
          we send you. Unsubscribing immediately removes your email address from our audience. See
          our{' '}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>{' '}
          for details on how we handle your data after withdrawal.
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="font-heading text-xl font-semibold">Governing Law</h2>
        <p className="text-foreground leading-relaxed">
          These terms are governed by the laws of the State of California, USA, without regard to
          conflict-of-laws principles. Any disputes arising from or relating to these terms shall
          be resolved in the state or federal courts located in California, and you consent to the
          personal jurisdiction of those courts.
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="font-heading text-xl font-semibold">Contact</h2>
        <p className="text-foreground leading-relaxed">
          Questions about these terms? Email{' '}
          <a href="mailto:privacy@useQuibly.com" className="text-primary hover:underline">
            privacy@useQuibly.com
          </a>
          .
        </p>
      </section>
    </div>
  )
}
