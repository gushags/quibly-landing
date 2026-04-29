// One-shot verification: does resend.contacts.list() include custom properties
// (consent_version) for the migration workaround documented in STORE-05?
// Run from repo root:  node --env-file=.env.local scripts/verify-contacts-list-properties.mjs
import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY
const audienceId = process.env.RESEND_AUDIENCE_PREVIEW_ID

if (!apiKey || !audienceId) {
  console.error('Missing RESEND_API_KEY or RESEND_AUDIENCE_PREVIEW_ID in env')
  process.exit(1)
}

const resend = new Resend(apiKey)
const { data, error } = await resend.contacts.list({ audienceId })

if (error) {
  console.error('contacts.list failed:', error)
  process.exit(1)
}

const contacts = data?.data ?? []
console.log(`Found ${contacts.length} contacts in preview audience\n`)

if (contacts.length === 0) {
  console.log('Audience is empty — submit some signups first.')
  process.exit(0)
}

// Inspect the first 3 contacts to see what fields come through
const sample = contacts.slice(0, 3).map((c) => ({
  email: c.email,
  unsubscribed: c.unsubscribed,
  // Resend's typed Contact response
  properties: c.properties,
  // catch-all: dump full object so we see anything we didn't expect
  __all_keys: Object.keys(c),
}))

console.log('Sample contacts:')
console.log(JSON.stringify(sample, null, 2))

const haveProperties = contacts.some((c) => c.properties && Object.keys(c.properties).length > 0)
const haveConsentVersion = contacts.some(
  (c) => c.properties && 'consent_version' in c.properties
)

console.log('\n=== STORE-05 workaround verification ===')
console.log(`contacts.list returns 'properties' field:        ${haveProperties}`)
console.log(`contacts.list returns 'consent_version' value:   ${haveConsentVersion}`)
process.exit(haveConsentVersion ? 0 : 2)
