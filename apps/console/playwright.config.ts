import { defineConfig, devices } from '@playwright/test'

/**
 * E2E config for the console.
 *
 * `testDir` is scoped to e2e/ so Playwright does not try to collect the Vitest
 * unit tests under src/__tests__.
 *
 * Point BASE_URL at a PRODUCTION build, not `next dev`. Statically prerendered
 * routes are the thing under test here, and `next dev` renders every request
 * dynamically — so the router-cache behaviour these tests cover cannot
 * reproduce there:
 *
 *   pnpm --filter @brynzit/console build
 *   pnpm --filter @brynzit/console exec next start -p 3199
 *   BASE_URL=http://localhost:3199 pnpm --filter @brynzit/console exec playwright test
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'list' : [['list']],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3199',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
