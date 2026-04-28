import { defineConfig } from "@playwright/test"

/**
 * Phase 2 Playwright config — minimal, mobile-only, single-spec.
 *
 * Tests run against a locally-running Next.js dev server at http://localhost:3000.
 * Either `npm run dev` or `npm run build && npm run start` must be running before
 * `npx playwright test` is invoked.
 *
 * Phase 3+ may extend this config with auth flows, multi-browser projects, etc.
 */
export default defineConfig({
  testDir: "./tests/visual",
  timeout: 30000,
  expect: { timeout: 5000 },
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 320, height: 568 },
  },
})
