/**
 * Staff auth golden path against a real backend + real Postgres, not MSW.
 *
 * Requires:
 *   - The backend running with STAFF_JWT_SECRET set (see the backend repo's
 *     docs/console-staff-auth.md).
 *   - An existing admin account (backend's scripts/bootstrap_admin.py).
 *   - E2E_STAFF_ADMIN_USERNAME / E2E_STAFF_ADMIN_PASSWORD env vars pointing at
 *     it — never hardcoded here. The suite skips itself without them, the
 *     same way any test needing a live external credential should.
 *
 * Run against `next dev` (unlike admin-tabs.spec.ts, nothing here depends on
 * static-route router-cache behavior):
 *   pnpm --filter @brynzit/console dev
 *   E2E_STAFF_ADMIN_USERNAME=... E2E_STAFF_ADMIN_PASSWORD=... \
 *     BASE_URL=http://localhost:3000 pnpm --filter @brynzit/console exec playwright test e2e/staff-auth.spec.ts
 */
import { expect, test } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const ADMIN_USERNAME = process.env.E2E_STAFF_ADMIN_USERNAME
const ADMIN_PASSWORD = process.env.E2E_STAFF_ADMIN_PASSWORD

test.describe('Staff auth', () => {
  test.skip(!ADMIN_USERNAME || !ADMIN_PASSWORD, 'set E2E_STAFF_ADMIN_USERNAME/PASSWORD to run')

  test('the public splash offers Sign in; unauthenticated visitors elsewhere are redirected to it', async ({
    page,
  }) => {
    await page.goto(`${BASE}/`)
    await expect(page.getByRole('heading', { name: 'BrinzIT platform' })).toBeVisible()
    await page.getByRole('link', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(`${BASE}/signin`)

    await page.goto(`${BASE}/dashboard`)
    await expect(page).toHaveURL(`${BASE}/signin`)
  })

  test('admin signs in, reaches the console, creates a user; that user signs in and is locked out of admin; deactivation blocks login', async ({
    page,
  }) => {
    const username = `e2e_${Date.now()}`
    const password = `e2e-pass-${Date.now()}`

    await page.goto(`${BASE}/signin`)
    await page.getByLabel('Username').fill(ADMIN_USERNAME!)
    await page.getByLabel('Password').fill(ADMIN_PASSWORD!)
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Lands on the real console, not a placeholder.
    await expect(page).toHaveURL(`${BASE}/dashboard`)

    await page.goto(`${BASE}/admin/users`)
    await expect(page.getByRole('heading', { name: 'Staff users' })).toBeVisible()

    await page.getByRole('button', { name: 'New user' }).click()
    await page.getByLabel('Username').fill(username)
    await page.getByLabel('Initial password').fill(password)
    await page.getByRole('button', { name: 'Create user' }).click()
    await expect(page.getByRole('cell', { name: username })).toBeVisible()

    // Sign out (the control lives in the top bar of every authenticated
    // page); the new user can sign in.
    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL(`${BASE}/signin`)

    await page.getByLabel('Username').fill(username)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(`${BASE}/dashboard`)

    // Non-admin: hidden from user management (server independently enforces
    // this too — see the backend's tests/platform/test_staff_auth.py).
    await page.goto(`${BASE}/admin/users`)
    await expect(page.getByText("This page isn't available to your role.")).toBeVisible()

    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL(`${BASE}/signin`)

    // Admin deactivates the new user; they can no longer sign in.
    await page.getByLabel('Username').fill(ADMIN_USERNAME!)
    await page.getByLabel('Password').fill(ADMIN_PASSWORD!)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(`${BASE}/dashboard`)
    await page.goto(`${BASE}/admin/users`)

    const row = page.getByRole('row').filter({ hasText: username })
    await row.getByRole('button', { name: 'Deactivate' }).click()
    await expect(row.getByText('deactivated')).toBeVisible()

    await page.getByRole('button', { name: 'Sign out' }).click()
    await page.getByLabel('Username').fill(username)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByText('Invalid username or password.')).toBeVisible()
    await expect(page).toHaveURL(`${BASE}/signin`)
  })
})
