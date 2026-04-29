import type { Metadata } from 'next'
import { env } from '@/lib/env'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Quibly privacy policy — how we handle and protect your data.',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-heading text-4xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: April 29, 2026</p>

      <section className="space-y-4 mb-10">
        <h2 className="font-heading text-xl font-semibold">Introduction</h2>
        <p className="text-foreground leading-relaxed">
          Quibly (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) operates the pre-launch waitlist at{' '}
          <a href="https://useQuibly.com" className="text-primary hover:underline">useQuibly.com</a>.
          This privacy policy applies exclusively to the email data we collect through the waitlist sign-up
          form on this page.
        </p>
        <p className="text-foreground leading-relaxed">
          We collect and process your email address on the lawful basis of <strong>consent</strong> under
          Article 6(1)(a) of the General Data Protection Regulation (GDPR). By submitting your email
          address, you give us permission to contact you when Quibly launches. You can withdraw your consent
          at any time by unsubscribing via the link in any email we send you.
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="font-heading text-xl font-semibold">Information We Collect</h2>
        <p className="text-foreground leading-relaxed">
          We collect only the email address you submit when joining the waitlist. We do not collect your
          name, payment information, or any other personal details.
        </p>
        <p className="text-foreground leading-relaxed">
          We also receive standard server logs — including IP address and browser user-agent — through
          Vercel&rsquo;s hosting infrastructure for security and abuse-prevention purposes. These server
          logs are retained for a maximum of 30 days on a rolling basis and are not linked to your email
          address.
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="font-heading text-xl font-semibold">How We Use It</h2>
        <p className="text-foreground leading-relaxed">
          We use your email address solely to notify you when Quibly launches. That is the only purpose.
          We will not use your email for advertising, third-party marketing, or any purpose other than
          the launch notification you signed up for.
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="font-heading text-xl font-semibold">Cookies / Tracking</h2>
        <p className="text-foreground leading-relaxed">
          We do not set any non-essential cookies. We do not use Google Analytics, Meta Pixel, LinkedIn
          Insight Tag, Hotjar, Microsoft Clarity, or Google Tag Manager.
        </p>
        <p className="text-foreground leading-relaxed">
          We use <strong>Vercel Web Analytics</strong> and <strong>Vercel Speed Insights</strong>, both
          of which are cookieless. Visitor identification uses a daily-rotating hash derived from
          the incoming request; this hash is discarded after 24 hours and is never stored in your
          browser. No <code>_vercel*</code> cookies or third-party tracking cookies are set.
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="font-heading text-xl font-semibold">Sharing &amp; Processors</h2>
        <p className="text-foreground leading-relaxed">
          We share your data with the following sub-processors only to the extent necessary to operate
          the waitlist:
        </p>
        <ul className="space-y-2 list-disc list-inside text-foreground leading-relaxed">
          <li>
            <strong>Vercel</strong> — provides hosting, Web Analytics, and Speed Insights. Your email
            address is not stored by Vercel; only server logs (IP, user-agent) pass through their
            infrastructure. See{' '}
            <a href="https://vercel.com/legal/privacy-policy" className="text-primary hover:underline">
              Vercel&rsquo;s Privacy Policy
            </a>
            .
          </li>
          <li>
            <strong>Resend</strong> — provides email delivery and audience storage. Your email address
            is stored in a Resend audience and used to send a welcome email and, when Quibly launches,
            a launch notification. See{' '}
            <a href="https://resend.com/legal/privacy-policy" className="text-primary hover:underline">
              Resend&rsquo;s Privacy Policy
            </a>
            .
          </li>
        </ul>
        <p className="text-foreground leading-relaxed">
          No other third parties receive your data.
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="font-heading text-xl font-semibold">Retention</h2>
        <p className="text-foreground leading-relaxed">
          We retain your email until Quibly launches plus 12 months thereafter, or until you
          unsubscribe — whichever comes first. After that period, your email address will be deleted
          from our Resend audience.
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="font-heading text-xl font-semibold">Your Rights</h2>
        <p className="text-foreground leading-relaxed">
          Under the GDPR (and applicable data protection laws), you have the right to:
        </p>
        <ul className="space-y-2 list-disc list-inside text-foreground leading-relaxed">
          <li><strong>Access</strong> — request a copy of the data we hold about you.</li>
          <li><strong>Deletion</strong> — request that we delete your email address from our audience.</li>
          <li><strong>Correction</strong> — request that we correct inaccurate data.</li>
          <li><strong>Portability</strong> — receive your data in a structured, machine-readable format.</li>
          <li>
            <strong>Withdraw consent</strong> — unsubscribe at any time via the link in any email we
            send you. Withdrawal is immediate.
          </li>
        </ul>
        <p className="text-foreground leading-relaxed">
          You may also lodge a complaint with the data protection authority in your country of residence
          if you believe we have not handled your data lawfully.
        </p>
        <p className="text-foreground leading-relaxed">
          To exercise any of these rights, email{' '}
          <a href="mailto:privacy@useQuibly.com" className="text-primary hover:underline">
            privacy@useQuibly.com
          </a>
          .
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="font-heading text-xl font-semibold">Updates</h2>
        <p className="text-foreground leading-relaxed">
          We will revise this policy if our data practices change. The &ldquo;Last updated&rdquo; date
          at the top of this page reflects the most recent version. Continued participation in the
          waitlist after an update constitutes acceptance of the revised policy.
        </p>
      </section>

      <section className="space-y-4 mb-10">
        <h2 className="font-heading text-xl font-semibold">Contact</h2>
        <p className="text-foreground leading-relaxed">
          For data-subject requests (access, deletion, correction, portability) or any privacy
          questions, email{' '}
          <a href="mailto:privacy@useQuibly.com" className="text-primary hover:underline">
            privacy@useQuibly.com
          </a>
          .
        </p>
        <p className="text-foreground leading-relaxed">Postal address:</p>
        <p className="text-foreground leading-relaxed">{env.RESEND_FROM_POSTAL_ADDRESS}</p>
      </section>
    </div>
  )
}
