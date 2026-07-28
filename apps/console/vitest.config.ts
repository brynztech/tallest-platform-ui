import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    // e2e/ holds Playwright specs, which must be run by Playwright — Vitest
    // collecting them fails with "Playwright Test did not expect test.describe()
    // to be called here". Run them with:
    //   pnpm --filter @brynzit/console exec playwright test
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**', 'e2e/**'],
  },
})
