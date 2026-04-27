/**
 * Custom ESLint rule: no-raw-process-env
 *
 * Enforces D-11 from Phase 1 (Scaffold + Brand Token Parity):
 *   Raw reads of `process.env` must go through `lib/env.ts`. Every other
 *   module that needs an env value imports `{ env } from "@/lib/env"` —
 *   the typed Zod-parsed object — so that the boot-time crash invariant
 *   (D-08, D-10) cannot be silently bypassed.
 *
 * Detection surface:
 *   - `MemberExpression` visitor flags any node where `object.name === 'process'`
 *     AND `property.name === 'env'`. This catches both `process.env.X` and
 *     destructuring like `const { X } = process.env`. Computed access
 *     (`process['env']`) is also caught when both children are Identifier nodes.
 *
 * Allowlist (rule returns no visitors → fires nothing):
 *   - `lib/env.ts` — the one sanctioned process.env reader
 *   - `eslint-rules/**` — this file and its tests
 *   - `*.test.ts`, `*.test.tsx`, `*.test.js` — test fixtures may stub env
 */

'use strict'

const ALLOWLIST_FRAGMENTS = [
  '/lib/env.ts',
  '/eslint-rules/',
]
const TEST_FILE_SUFFIXES = ['.test.ts', '.test.tsx', '.test.js']

function normalizeFilename(name) {
  return (name ?? '').replace(/\\/g, '/')
}

function isAllowlisted(filename) {
  if (TEST_FILE_SUFFIXES.some((s) => filename.endsWith(s))) return true
  return ALLOWLIST_FRAGMENTS.some((f) => filename.includes(f))
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Raw process.env reads must go through lib/env.ts (D-11). Import { env } from "@/lib/env" instead.',
      recommended: false,
    },
    messages: {
      raw:
        'Do not read process.env directly. Import { env } from "@/lib/env" — the Zod-validated env object — instead. (D-11)',
    },
    schema: [],
  },

  create(context) {
    const rawFilename = context.filename ?? context.getFilename()
    const filename = normalizeFilename(rawFilename)
    if (isAllowlisted(filename)) return {}

    return {
      // Match `process.env` in any context: `process.env.X`, `const { X } = process.env`,
      // `Object.keys(process.env)`, `process['env']`, etc.
      MemberExpression(node) {
        const isProcessEnv =
          node.object &&
          node.object.type === 'Identifier' &&
          node.object.name === 'process' &&
          ((node.property.type === 'Identifier' && node.property.name === 'env') ||
            (node.property.type === 'Literal' && node.property.value === 'env'))
        if (isProcessEnv) {
          context.report({ node, messageId: 'raw' })
        }
      },
    }
  },
}
