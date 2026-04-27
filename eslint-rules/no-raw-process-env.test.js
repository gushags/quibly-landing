'use strict'

const { RuleTester } = require('eslint')
const rule = require('./no-raw-process-env.js')

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
})

ruleTester.run('no-raw-process-env', rule, {
  valid: [
    // Allowlisted file: lib/env.ts
    { code: 'envSchema.parse(process.env)', filename: '/repo/lib/env.ts' },
    // Test files allowlisted by suffix
    { code: 'process.env.RESEND_API_KEY', filename: '/repo/app/foo.test.ts' },
    // No process.env at all
    { code: 'const x = "hello"', filename: '/repo/app/page.tsx' },
    // Different `process` (e.g., in a comment, parsed correctly)
    { code: 'const proc = { env: {} }; proc.env.X', filename: '/repo/app/page.tsx' },
  ],
  invalid: [
    {
      code: 'const k = process.env.RESEND_API_KEY',
      filename: '/repo/app/page.tsx',
      errors: [{ messageId: 'raw' }],
    },
    {
      code: 'const { RESEND_API_KEY } = process.env',
      filename: '/repo/app/api/route.ts',
      errors: [{ messageId: 'raw' }],
    },
    {
      code: 'Object.keys(process.env)',
      filename: '/repo/lib/something.ts',
      errors: [{ messageId: 'raw' }],
    },
    {
      code: 'const x = process["env"].FOO',
      filename: '/repo/components/x.tsx',
      errors: [{ messageId: 'raw' }],
    },
  ],
})

console.log('PASS: no-raw-process-env rule tests passed')
