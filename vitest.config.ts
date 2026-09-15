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
    environment: 'jsdom',
    restoreMocks: true,
  },
})
