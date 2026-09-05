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
 * Identity now comes from a real backend session (platform/staff_auth_router.py),
 * not the old acting-user switcher — signing in as a given role's account IS
 * "switching" now. This needs a real backend + Postgres + an existing admin
 * account (see the backend's scripts/bootstrap_admin.py), so it skips itself
 * without E2E_STAFF_ADMIN_USERNAME/PASSWORD, same as staff-auth.spec.ts.
 *
 * Run against a local prod build (matches admin-tabs.spec.ts's convention):
 *   pnpm --filter @brynzit/console build && pnpm --filter @brynzit/console start -p 3101
 *   E2E_STAFF_ADMIN_USERNAME=... E2E_STAFF_ADMIN_PASSWORD=... \
 *     BASE_URL=http://localhost:3101 pnpm exec playwright test apps/console/e2e/rbac.spec.ts
 */
import { expect, test, type APIRequestContext, type Page } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:3101'
// The console calls the backend directly (cross-origin, no proxy — see
// platform/staff_auth_router.py's module docstring), so seeding test users
// via `request` must target the backend, not the console app's own origin.
const API_BASE = process.env.BACKEND_API_URL ?? 'http://localhost:8000'
const ADMIN_USERNAME = process.env.E2E_STAFF_ADMIN_USERNAME
const ADMIN_PASSWORD = process.env.E2E_STAFF_ADMIN_PASSWORD

type Creds = { username: string; password: string }

async function createTestUser(
  request: APIRequestContext,
  role: 'recruiter' | 'account_manager',
): Promise<Creds> {
  const creds: Creds = {
    username: `e2e_rbac_${role}_${Date.now()}`,
    password: `e2e-pass-${Date.now()}`,
  }
  const created = await request.post(`${API_BASE}/api/v1/auth/users`, {
    data: { username: creds.username, password: creds.password, role },
  })
  if (!created.ok()) {
    throw new Error(`Failed to create ${role} test user: ${created.status()} ${await created.text()}`)
  }
  return creds
}

async function signIn(page: Page, creds: Creds) {
  await page.goto(`${BASE}/signin`, { waitUntil: 'domcontentloaded' })
  await page.getByLabel('Username').fill(creds.username)
  await page.getByLabel('Password').fill(creds.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(`${BASE}/dashboard`)
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

test.describe('RBAC', () => {
  test.skip(!ADMIN_USERNAME || !ADMIN_PASSWORD, 'set E2E_STAFF_ADMIN_USERNAME/PASSWORD to run')

  const adminCreds: Creds = { username: ADMIN_USERNAME ?? '', password: ADMIN_PASSWORD ?? '' }
  let recruiterCreds: Creds
  let accountManagerCreds: Creds

  test.beforeAll(async ({ request }) => {
    // request logs in as the real admin once (cookies persist within this
    // context) purely to seed two throwaway test accounts — faster than
    // driving the sign-in form twice per describe block.
    const login = await request.post(`${API_BASE}/api/v1/auth/login`, {
      data: { username: adminCreds.username, password: adminCreds.password },
    })
    if (!login.ok()) throw new Error(`Admin login failed: ${login.status()} ${await login.text()}`)
    recruiterCreds = await createTestUser(request, 'recruiter')
    accountManagerCreds = await createTestUser(request, 'account_manager')
  })

  test.describe('Recruiter — narrowest role', () => {
    test('cannot reach Admin or any Internal Ops route by direct URL', async ({ page }) => {
      await signIn(page, recruiterCreds)

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
      await signIn(page, recruiterCreds)

      const nav = page.getByRole('navigation', { name: /recruiter portal navigation/i })
      await expect(nav.getByRole('link', { name: 'Admin Panel' })).toHaveCount(0)
      await expect(nav.getByRole('link', { name: 'BD Lead Review' })).toHaveCount(0)
      await expect(nav.getByRole('link', { name: 'Quality Review' })).toHaveCount(0)
    })

    test('can still use every ordinary recruiter-portal route', async ({ page }) => {
      await signIn(page, recruiterCreds)

      for (const path of ['/overview', '/pipeline', '/my-roles', '/calendar', '/messages']) {
        await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' })
        await expect(page.getByText(/isn.t available to your role/i)).not.toBeVisible()
      }
    })
  })

  test.describe('Account Manager — internal ops, not admin', () => {
    test('reaches Internal Ops routes but not Admin', async ({ page }) => {
      await signIn(page, accountManagerCreds)

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
      await signIn(page, accountManagerCreds)

      const nav = page.getByRole('navigation', { name: /recruiter portal navigation/i })
      await expect(nav.getByRole('link', { name: 'Quality Review' })).toBeVisible()
      await expect(nav.getByRole('link', { name: 'Admin Panel' })).toHaveCount(0)
    })
  })

  test.describe('Admin — full access', () => {
    test('reaches every gated route, including Admin', async ({ page }) => {
      await signIn(page, adminCreds)

      await expectAllowed(page, '/admin', /overview|costs|events|quotas/i)
      await expectAllowed(page, '/bd/leads', /lead/i)
      await expectAllowed(page, '/ops/quality-review', /quality review/i)
      await expectAllowed(page, '/supply/search', /search/i)
    })

    test('sees every Internal Ops link, including Admin Panel', async ({ page }) => {
      await signIn(page, adminCreds)

      const nav = page.getByRole('navigation', { name: /recruiter portal navigation/i })
      await expect(nav.getByRole('link', { name: 'Admin Panel' })).toBeVisible()
    })
  })

  test('the restricted panel explains why and offers a way back', async ({ page }) => {
    await signIn(page, recruiterCreds)

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
})
