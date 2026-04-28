import { defineConfig } from "@playwright/test"

/**
 * Playwright config — multi-project, mobile-first.
 *
 * Two projects:
 *   - "visual-and-form": runs tests/visual/* (Phase 2 specs) + tests/form/* (Phase 3 e2e)
 *   - "no-js":           runs tests/no-js/* with javaScriptEnabled: false (Phase 3 progressive
 *                        enhancement spec — see RESEARCH Pattern 4 + Pitfall 3)
 *
 * Tests run against a Next.js server at http://localhost:3000. The `webServer`
 * block lets Playwright manage the lifecycle: in CI it boots `next start` and
 * propagates startup failures to the test runner; locally it reuses an existing
 * `npm run dev` server. CR-01: replaces the prior CI pattern of `npx next start &`
 * + `wait-on`, which silently masked startup crashes (env validation in lib/env.ts
 * throws at module load if any RESEND_ or UPSTASH_ var is missing).
 *
 * Mobile-first viewport (320×568) is locked from Phase 2.
 */
export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  expect: { timeout: 5000 },
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 320, height: 568 },
  },
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    timeout: 60_000,
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
  },
  projects: [
    {
      name: "visual-and-form",
      testMatch: /tests\/(visual|form)\/.*\.spec\.ts/,
    },
    {
      name: "no-js",
      testMatch: /tests\/no-js\/.*\.spec\.ts/,
      use: { javaScriptEnabled: false },
    },
  ],
})
