/**
 * Admin tab navigation after a hard page load.
 *
 * The bug: /admin is a statically prerendered route (`○` in the build output).
 * Next.js keys its client router cache by PATHNAME, so a `router.push` that
 * changes only the query string can be treated as "already have this route" and
 * skip re-rendering. `useSearchParams()` then never updates, and because <Tabs>
 * is controlled by that value, neither the URL nor the panel changes.
 *
 * It only reproduces after a hard load (refresh / direct URL entry). Soft
 * navigation into /admin leaves a live tree in memory where the update does
 * propagate — which is exactly why it looked intermittent.
 *
 * Run against a local prod build (static route behaviour does NOT reproduce in
 * `next dev`, which renders every request dynamically):
 *   pnpm --filter @brynzit/console build && pnpm --filter @brynzit/console start -p 3101
 *   BASE_URL=http://localhost:3101 pnpm exec playwright test apps/console/e2e/admin-tabs.spec.ts
 */
import { expect, test } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:3101'

test.describe('Admin tabs survive a hard reload', () => {
  test('switching tabs after a direct load updates URL and panel', async ({ page }) => {
    // Hard load straight onto a non-default tab — this is the trigger.
    await page.goto(`${BASE}/admin?tab=prompts`, { waitUntil: 'networkidle' })

    // The deep link itself works; that was never the broken part.
    await expect(page.getByRole('tab', { name: 'Prompts' })).toHaveAttribute(
      'data-state',
      'active',
    )

    // Now switch. This is what silently did nothing.
    await page.getByRole('tab', { name: 'Overview' }).click()

    await expect(page.getByRole('tab', { name: 'Overview' })).toHaveAttribute(
      'data-state',
      'active',
    )
    await expect(page).toHaveURL(/[?&]tab=overview/)
    await expect(page.getByRole('tab', { name: 'Prompts' })).toHaveAttribute(
      'data-state',
      'inactive',
    )
  })

  test('several consecutive switches all take effect', async ({ page }) => {
    await page.goto(`${BASE}/admin?tab=prompts`, { waitUntil: 'networkidle' })

    // Excludes "Job sources" and "Events". Both panels are data-heavy, and
    // against a build with no reachable backend their clicks do not settle for
    // Playwright's actionability check — an environment artifact, not the
    // behaviour under test. This test asserts tab SWITCHING; per-panel data
    // loading belongs in an integration test with a live backend.
    for (const name of ['Overview', 'Costs', 'Quotas', 'Pipeline', 'Candidates']) {
      await page.getByRole('tab', { name }).click()
      await expect(page.getByRole('tab', { name })).toHaveAttribute('data-state', 'active')
      await expect(page).toHaveURL(new RegExp(`[?&]tab=`))
    }
  })

  test('browser back returns to the previous tab', async ({ page }) => {
    await page.goto(`${BASE}/admin?tab=prompts`, { waitUntil: 'networkidle' })
    await page.getByRole('tab', { name: 'Costs' }).click()
    await expect(page).toHaveURL(/[?&]tab=costs/)

    await page.goBack()
    await expect(page).toHaveURL(/[?&]tab=prompts/)
    await expect(page.getByRole('tab', { name: 'Prompts' })).toHaveAttribute(
      'data-state',
      'active',
    )
  })

  test('an unknown tab value falls back to overview', async ({ page }) => {
    // WR-06: arbitrary URL params must not be injectable.
    await page.goto(`${BASE}/admin?tab=../../etc/passwd`, { waitUntil: 'networkidle' })
    await expect(page.getByRole('tab', { name: 'Overview' })).toHaveAttribute(
      'data-state',
      'active',
    )
  })
})
