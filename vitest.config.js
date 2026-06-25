/**
 * vitest.config.js — isolated from the uni-app Vite plugin.
 * Covers both src/**​/*.test.js (existing utils suites) and
 * tests/**​/*.test.js (new unit / integration / e2e suites).
 */
import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/mocks/uni.mock.js'],
    include: [
      'src/**/*.test.{js,ts}',
      'tests/**/*.test.{js,ts}'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,ts}'],
      exclude: ['src/**/*.test.{js,ts}', 'src/main.js', 'src/App.vue'],
      thresholds: {
        // Minimum coverage targets — CI fails if these drop
        'src/utils/indicators.js': { statements: 90, branches: 85, functions: 100 },
        'src/utils/helpers.js':    { statements: 85, branches: 85, functions: 100 },
        'src/utils/storage.js':    { statements: 85, branches: 75, functions: 100 },
        'src/stores/portfolio.js': { statements: 75, branches: 70, functions: 85  },
        'src/api/xueqiu.js':       { statements: 70, branches: 65, functions: 100 }
      }
    }
  }
})
