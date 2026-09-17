import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@typora-community-plugin/core': fileURLToPath(
        new URL('./test/support/typora-core.ts', import.meta.url),
      ),
    },
  },
  test: {
    // Bound concurrent jsdom startup on developer laptops and hosted runners.
    maxWorkers: 2,
    environment: 'jsdom',
    restoreMocks: true,
  },
})
