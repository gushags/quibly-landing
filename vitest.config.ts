import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    // WR-07: include both `.test.` and `.spec.` so a future contributor naming
    // a unit test `foo.spec.ts` does not silently get skipped. The path-prefix
    // on the include glob already restricts to `tests/unit/**`, so the prior
    // exclusions of tests/visual/**, tests/form/**, tests/no-js/** were dead
    // config — Playwright runs those, vitest never matched them in the first place.
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules/**'],
  },
})
