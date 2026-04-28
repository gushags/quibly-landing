import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

/**
 * Content-ID used for the inline wordmark attachment. The action body in
 * `app/actions/join-waitlist.ts` attaches `public/email/wordmark.png` with
 * this CID; the `<Img src="cid:..." />` below resolves to the embedded
 * binary at render time. Exported so the action and template stay in sync.
 */
export const WORDMARK_CID = 'wordmark@quibly'

/**
 * Phase 4 — Welcome email (EMAIL-07).
 *
 * Voice & substance are locked by D-01 — DO NOT paraphrase the body copy.
 * Founder edits the final string in PR before merge; Claude polishes JSX
 * rendering only (typography, spacing, brand strip).
 *
 * Layout (top → bottom, per UI-SPEC.md §"Email Template Component Contract"):
 *   1. Teal header strip (#0D9488) — 48px tall, white "Quibly" wordmark
 *   2. Content zone — 32px/24px padding, body paragraphs
 *   3. Hr divider — #e5e5e5, 24px margin
 *   4. Footer zone — postal address (EMAIL-05 CAN-SPAM), unsubscribe link (EMAIL-04)
 *
 * Inline styles only — email clients strip external stylesheets and don't
 * support wide-gamut color functions or Tailwind classes (UI-SPEC.md §Color).
 *
 * The `unsubscribeUrl` prop is the HMAC-signed token URL produced by
 * `generateToken(email)` from `lib/unsubscribe-token.ts` (Plan 02 / CD-02).
 * The `postalAddress` prop reads from `env.RESEND_FROM_POSTAL_ADDRESS`
 * (Plan 01 / D-10) — placeholder in dev, real address before production merge.
 */

export interface WelcomeEmailProps {
  unsubscribeUrl: string
  postalAddress: string
}

export function WelcomeEmail({
  unsubscribeUrl,
  postalAddress,
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Welcome to the Quibly waitlist — I&apos;ll be in touch.
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Teal header strip — UI-SPEC #0D9488, 48px height. The wordmark
              is rendered as an inline-attached PNG (Quicksand 600, white on
              transparent) so brand typography survives Gmail/Outlook stripping
              of @font-face rules. The action body attaches the PNG with
              contentId === WORDMARK_CID. */}
          <Section style={header}>
            <Img
              src={`cid:${WORDMARK_CID}`}
              alt="Quibly"
              width="160"
              height="40"
              style={wordmark}
            />
          </Section>

          {/* D-01 locked body copy — DO NOT paraphrase */}
          <Section style={content}>
            <Text style={paragraph}>Hey —</Text>
            <Text style={paragraph}>
              Thanks for joining the Quibly waitlist. I&apos;m Jeff —
              a solopreneur building Quibly for other solopreneurs
              and small operators who are experts at what they
              make but not necessarily at marketing it.
            </Text>
            <Text style={paragraph}>
              I&apos;m deep in a strategy-first AI marketing tool that
              learns your business and runs the marketing loop
              with you (not at you). I&apos;ll send one more email when
              I open it up — no spam, no product-launch hype.
            </Text>
            <Text style={paragraph}>
              In the meantime, hit reply if there&apos;s a marketing
              problem you wish someone would just solve. I read
              everything.
            </Text>
            <Text style={paragraph}>— Jeff</Text>
          </Section>

          <Hr style={hr} />

          {/* Footer: unsubscribe (EMAIL-04) + postal address (EMAIL-05 CAN-SPAM) */}
          <Section style={content}>
            <Text style={footer}>
              <Link href={unsubscribeUrl} style={footerLink}>
                Unsubscribe
              </Link>
              {' · '}
              {postalAddress}
            </Text>
            <Text style={footer}>
              You&apos;re receiving this because you signed up for the Quibly waitlist.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

/**
 * React Email dev preview props — visible in `npm run email:dev` (not wired in
 * Phase 4; postal address placeholder kept benign for the preview UI).
 */
WelcomeEmail.PreviewProps = {
  unsubscribeUrl: 'https://useQuibly.com/unsubscribe?t=preview_token',
  postalAddress: '123 Main St, Anytown, CA 90210',
} satisfies WelcomeEmailProps

export default WelcomeEmail

// ─── Inline styles (hex colors only — UI-SPEC.md §Color) ────────────────────

const main: React.CSSProperties = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: 0,
}

const container: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
}

const header: React.CSSProperties = {
  height: '48px',
  padding: '4px 24px',
  backgroundColor: '#0D9488',
  textAlign: 'center',
}

const wordmark: React.CSSProperties = {
  display: 'inline-block',
  margin: '0 auto',
  // Image is rendered at 480x120 (3x retina), displayed at 160x40
  width: '160px',
  height: '40px',
}

const content: React.CSSProperties = {
  padding: '32px 24px',
}

const paragraph: React.CSSProperties = {
  color: '#404040',
  fontSize: '14px',
  lineHeight: 1.5,
  margin: '0 0 16px 0',
}

const hr: React.CSSProperties = {
  borderColor: '#e5e5e5',
  margin: '24px 0',
}

const footer: React.CSSProperties = {
  color: '#737373',
  fontSize: '12px',
  lineHeight: 1.5,
  margin: '0 0 4px 0',
}

const footerLink: React.CSSProperties = {
  color: '#737373',
  textDecoration: 'underline',
}
