/**
 * vitest.config.js — keep the unit-test runner isolated from the uni-app
 * Vite plugin. The uni plugin tries to traverse pages.json / manifest.json
 * at startup and isn't safe to load just for unit tests.
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
    include: ['src/**/*.test.{js,ts}'],
    globals: false
  }
})
