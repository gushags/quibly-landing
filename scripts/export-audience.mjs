/**
 * STORE-05 migration export: dump a Resend audience with full custom properties.
 *
 * Resend's CSV export and `contacts.list()` both strip custom properties
 * (`consent_version`, etc.). Only `contacts.get({ audienceId, email })` returns
 * the full property map. This script combines list (to enumerate) + get
 * (to fetch each contact's properties) into a single typed export.
 *
 * Usage:
 *   node --env-file=.env.local scripts/export-audience.mjs --target=preview
 *   node --env-file=.env.local scripts/export-audience.mjs --target=production
 *   node --env-file=.env.local scripts/export-audience.mjs --target=preview --format=csv
 *
 * Output: written to stdout. Pipe to a file:
 *   node --env-file=.env.local scripts/export-audience.mjs --target=preview > audience.json
 *
 * Output formats:
 *   --format=json (default) — array of contact objects with flattened properties
 *   --format=csv             — first row = headers, all properties flattened to columns
 *
 * Performance: N+1 API calls (1 list + N gets). Resend API limit is 10 req/sec
 * per default key — script paces requests to stay under 8 req/sec for safety.
 * Expect ~10s per 80 contacts.
 */
import { Resend } from 'resend'

const argv = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? true]
  })
)

const target = argv.target ?? 'preview'
const format = argv.format ?? 'json'
const RATE_DELAY_MS = 130 // ~7.7 req/sec, well under Resend's 10 req/sec limit

const audienceId =
  target === 'production'
    ? process.env.RESEND_AUDIENCE_ID
    : process.env.RESEND_AUDIENCE_PREVIEW_ID

if (!process.env.RESEND_API_KEY || !audienceId) {
  console.error(
    `Missing RESEND_API_KEY or RESEND_AUDIENCE_${target === 'production' ? '' : 'PREVIEW_'}ID`
  )
  process.exit(1)
}

const resend = new Resend(process.env.RESEND_API_KEY)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const list = await resend.contacts.list({ audienceId })
if (list.error) {
  console.error('contacts.list failed:', list.error)
  process.exit(1)
}
const contacts = list.data?.data ?? []
console.error(`Enumerated ${contacts.length} contacts in ${target} audience.`)

// Resolve full properties per contact (sequential to respect rate limits)
const enriched = []
for (let i = 0; i < contacts.length; i++) {
  const c = contacts[i]
  const { data, error } = await resend.contacts.get({ audienceId, email: c.email })
  if (error) {
    console.error(`contacts.get(${c.email}) failed:`, error)
    continue
  }
  // Flatten Resend's typed property shape ({value, type}) to plain values
  const flatProps = {}
  for (const [k, v] of Object.entries(data?.properties ?? {})) {
    flatProps[k] = v?.value ?? null
  }
  enriched.push({
    id: data.id,
    email: data.email,
    first_name: data.first_name,
    last_name: data.last_name,
    created_at: data.created_at,
    unsubscribed: data.unsubscribed,
    ...flatProps,
  })
  if (i < contacts.length - 1) await sleep(RATE_DELAY_MS)
  if ((i + 1) % 25 === 0) console.error(`  fetched ${i + 1}/${contacts.length}`)
}

if (format === 'csv') {
  // Collect all observed property keys to build column headers
  const allKeys = new Set()
  enriched.forEach((c) => Object.keys(c).forEach((k) => allKeys.add(k)))
  const headers = [...allKeys]
  const escape = (v) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  console.log(headers.join(','))
  for (const c of enriched) console.log(headers.map((h) => escape(c[h])).join(','))
} else {
  console.log(JSON.stringify(enriched, null, 2))
}

console.error(`Exported ${enriched.length} contacts as ${format}.`)
