import { defineConfig } from "@playwright/test"

/**
 * Playwright config — multi-project, mobile-first.
 *
 * Two projects:
 *   - "visual-and-form": runs tests/visual/* (Phase 2 specs) + tests/form/* (Phase 3 e2e)
 *   - "no-js":           runs tests/no-js/* with javaScriptEnabled: false (Phase 3 progressive
 *                        enhancement spec — see RESEARCH Pattern 4 + Pitfall 3)
 *
 * Tests run against a locally-running Next.js dev server at http://localhost:3000.
 * Either `npm run dev` or `npm run build && npm run start` must be running before
 * `npx playwright test` is invoked.
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
