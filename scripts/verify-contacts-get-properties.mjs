// Last-resort check: does contacts.get() return custom properties even though
// contacts.list() doesn't? Tests against the first contact in the audience.
// Run:  node --env-file=.env.local scripts/verify-contacts-get-properties.mjs
import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY
const audienceId = process.env.RESEND_AUDIENCE_PREVIEW_ID
if (!apiKey || !audienceId) {
  console.error('Missing RESEND_API_KEY or RESEND_AUDIENCE_PREVIEW_ID in env')
  process.exit(1)
}

const resend = new Resend(apiKey)

// First, list to find a contact email
const list = await resend.contacts.list({ audienceId })
const sample = list.data?.data?.find((c) => c.email && !c.email.includes('bounced'))
if (!sample) {
  console.error('No usable contact found in audience')
  process.exit(1)
}

console.log(`Fetching contact by email: ${sample.email}\n`)

const { data, error } = await resend.contacts.get({ audienceId, email: sample.email })
if (error) {
  console.error('contacts.get failed:', error)
  process.exit(1)
}

console.log('contacts.get response:')
console.log(JSON.stringify(data, null, 2))

const props = data?.properties
console.log('\n=== Has properties? ===')
console.log(`properties field present:  ${props !== undefined}`)
console.log(`consent_version present:   ${props && 'consent_version' in props}`)
