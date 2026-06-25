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
      exclude: ['src/**/*.test.{js,ts}', 'src/main.js', 'src/App.vue']
    }
  }
})
