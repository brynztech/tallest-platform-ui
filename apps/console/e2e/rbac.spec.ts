/**
 * RBAC route enforcement, exercised against the real running app.
 *
 * Before this, a capability only hid a SIDEBAR LINK to a route — the
 * destination page itself rendered for anyone who reached it, including by
 * typing the URL directly. A recruiter could not see "Admin Panel" in the
 * nav, but `/admin` worked fine if they navigated there directly. These tests
 * prove the actual blocking behavior for each role, not just that a mapping
 * object contains the right strings (see route-capabilities.test.ts for the
 * pure-logic/wiring assertions that back this).
 *
 * There is no real auth yet (trusted-network console). "Acting user" is
 * switched via the identity dropdown in the top-right (see
 * identity-switcher.tsx) and persisted to localStorage — this test drives
 * that same switcher a real user would use, then navigates directly to a URL
 * (simulating "typed it in the address bar") to prove the ROUTE itself is
 * gated, not just the nav link.
 *
 * Run against a local prod build (matches admin-tabs.spec.ts's convention):
 *   pnpm --filter @brynzit/console build && pnpm --filter @brynzit/console start -p 3101
 *   BASE_URL=http://localhost:3101 pnpm exec playwright test apps/console/e2e/rbac.spec.ts
 */
import { expect, test, type Page } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:3101'

async function switchTo(page: Page, userName: string) {
  const trigger = page.getByRole('button', { name: /switch acting user/i })
  await trigger.click()
  await page.getByRole('menuitemradio', { name: new RegExp(userName, 'i') }).click()
  // The trigger's accessible NAME is a fixed aria-label ("Switch acting
  // user"), not the acting user's name — that only appears as visible text
  // inside it. Assert on the visible text, and wait for the dropdown to
  // actually close, so gated navigation below doesn't race the identity
  // context's re-render.
  await expect(trigger).toContainText(userName)
  await expect(page.getByRole('menu')).not.toBeVisible()
}

async function expectBlocked(page: Page, path: string) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' })
  await expect(page.getByText(/isn.t available to your role/i)).toBeVisible()
}

async function expectAllowed(page: Page, path: string, markerText: RegExp) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' })
  await expect(page.getByText(/isn.t available to your role/i)).not.toBeVisible()
  await expect(page.getByText(markerText).first()).toBeVisible()
}

test.describe('Recruiter — narrowest role', () => {
  test('cannot reach Admin or any Internal Ops route by direct URL', async ({ page }) => {
    await page.goto(`${BASE}/overview`, { waitUntil: 'domcontentloaded' })
    await switchTo(page, 'Priya Recruiter')

    await expectBlocked(page, '/admin')
    await expectBlocked(page, '/bd/leads')
    await expectBlocked(page, '/ops/clients')
    await expectBlocked(page, '/ops/requisitions')
    await expectBlocked(page, '/ops/interviews')
    await expectBlocked(page, '/ops/quality-review')
    await expectBlocked(page, '/supply/search')
    await expectBlocked(page, '/supply/ingest')
  })

  test('the sidebar does not offer links to routes it cannot reach', async ({ page }) => {
    await page.goto(`${BASE}/overview`, { waitUntil: 'domcontentloaded' })
    await switchTo(page, 'Priya Recruiter')

    const nav = page.getByRole('navigation', { name: /recruiter portal navigation/i })
    await expect(nav.getByRole('link', { name: 'Admin Panel' })).toHaveCount(0)
    await expect(nav.getByRole('link', { name: 'BD Lead Review' })).toHaveCount(0)
    await expect(nav.getByRole('link', { name: 'Quality Review' })).toHaveCount(0)
  })

  test('can still use every ordinary recruiter-portal route', async ({ page }) => {
    await page.goto(`${BASE}/overview`, { waitUntil: 'domcontentloaded' })
    await switchTo(page, 'Priya Recruiter')

    for (const path of ['/overview', '/pipeline', '/my-roles', '/calendar', '/messages']) {
      await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' })
      await expect(page.getByText(/isn.t available to your role/i)).not.toBeVisible()
    }
  })
})

test.describe('Account Manager — internal ops, not admin', () => {
  test('reaches Internal Ops routes but not Admin', async ({ page }) => {
    await page.goto(`${BASE}/overview`, { waitUntil: 'domcontentloaded' })
    await switchTo(page, 'Sam Account')

    await expectBlocked(page, '/admin')
    await expectAllowed(page, '/bd/leads', /lead/i)
    await expectAllowed(page, '/ops/clients', /client/i)
    // Deliberate policy point: quality-review's own page supports a real
    // view-only mode for anyone with internal_ops.view (see its "you can view
    // ... but only a Quality Manager or Admin can approve" banner) — an
    // account_manager should reach it read-only, not be blocked at the door.
    await expectAllowed(page, '/ops/quality-review', /quality review/i)
  })

  test('sees Quality Review in the nav (previously hidden by a stricter, drifted check)', async ({
    page,
  }) => {
    await page.goto(`${BASE}/overview`, { waitUntil: 'domcontentloaded' })
    await switchTo(page, 'Sam Account')

    const nav = page.getByRole('navigation', { name: /recruiter portal navigation/i })
    await expect(nav.getByRole('link', { name: 'Quality Review' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Admin Panel' })).toHaveCount(0)
  })
})

test.describe('Admin — full access', () => {
  test('reaches every gated route, including Admin', async ({ page }) => {
    await page.goto(`${BASE}/overview`, { waitUntil: 'domcontentloaded' })
    await switchTo(page, 'Admin')

    await expectAllowed(page, '/admin', /overview|costs|events|quotas/i)
    await expectAllowed(page, '/bd/leads', /lead/i)
    await expectAllowed(page, '/ops/quality-review', /quality review/i)
    await expectAllowed(page, '/supply/search', /search/i)
  })

  test('sees every Internal Ops link, including Admin Panel', async ({ page }) => {
    await page.goto(`${BASE}/overview`, { waitUntil: 'domcontentloaded' })
    await switchTo(page, 'Admin')

    const nav = page.getByRole('navigation', { name: /recruiter portal navigation/i })
    await expect(nav.getByRole('link', { name: 'Admin Panel' })).toBeVisible()
  })
})

test('the restricted panel explains why and offers a way back', async ({ page }) => {
  await page.goto(`${BASE}/overview`, { waitUntil: 'domcontentloaded' })
  await switchTo(page, 'Priya Recruiter')

  await page.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded' })
  await expect(page.getByText('admin.view')).toBeVisible()
  // Scoped to "Back to Overview" specifically: the shell's own sidebar also
  // has an "Overview" nav link on this page, which a bare /overview/i match
  // collides with.
  const back = page.getByRole('link', { name: 'Back to Overview' })
  await expect(back).toHaveAttribute('href', '/overview')
  await back.click()
  await expect(page).toHaveURL(new RegExp('/overview$'))
})
