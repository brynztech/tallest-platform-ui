/**
 * RBAC route enforcement — pure logic and static wiring.
 *
 * Before this, a capability only hid a SIDEBAR LINK — the destination page
 * rendered for anyone who reached it, including by typing the URL directly.
 * "Admin Panel" was invisible in the nav for a recruiter, but `/admin` worked
 * fine if they navigated there. These tests guard the mapping and wiring that
 * close that gap; the actual blocking BEHAVIOR (does a recruiter really see
 * "Access restricted" at /admin) is verified live against a running server in
 * e2e/rbac.spec.ts — component-level rendering of RequireCapability isn't
 * exercised here because new .tsx files in this app currently fail to
 * transform under Vitest specifically (reproduced with a 3-line file
 * containing no project code at all — a pre-existing Vite/tsconfig
 * interaction unrelated to this change); the Playwright spec exercises the
 * real compiled app instead, which is arguably the more meaningful check for
 * "is this route actually blocked" anyway.
 */
import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { capabilityForRoute, ROUTE_CAPABILITIES } from '../../app/(shell)/_lib/route-capabilities'

const SHELL_DIR = path.resolve(__dirname, '../../app/(shell)')

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(SHELL_DIR, relPath), 'utf-8')
}

describe('capabilityForRoute', () => {
  it('resolves the exact routes in the map', () => {
    expect(capabilityForRoute('/admin')).toBe('admin.view')
    expect(capabilityForRoute('/bookmarks')).toBe('candidate.bookmark')
    expect(capabilityForRoute('/bd')).toBe('internal_ops.view')
    expect(capabilityForRoute('/ops')).toBe('internal_ops.view')
    expect(capabilityForRoute('/supply')).toBe('internal_ops.view')
  })

  it('resolves nested paths under a gated prefix', () => {
    expect(capabilityForRoute('/admin/whatever')).toBe('admin.view')
    expect(capabilityForRoute('/ops/clients')).toBe('internal_ops.view')
    expect(capabilityForRoute('/ops/clients/abc-123')).toBe('internal_ops.view')
    expect(capabilityForRoute('/ops/requisitions/abc-123')).toBe('internal_ops.view')
    expect(capabilityForRoute('/ops/interviews')).toBe('internal_ops.view')
    expect(capabilityForRoute('/bd/leads')).toBe('internal_ops.view')
    expect(capabilityForRoute('/bd/imports')).toBe('internal_ops.view')
    expect(capabilityForRoute('/supply/search')).toBe('internal_ops.view')
    expect(capabilityForRoute('/supply/ingest')).toBe('internal_ops.view')
    expect(capabilityForRoute('/supply/engagements')).toBe('internal_ops.view')
  })

  it('quality-review inherits the blanket /ops gate, not a stricter one', () => {
    // Deliberate: the page itself supports a real view-only mode for anyone
    // with internal_ops.view and gates approve/reject in-page. Requiring
    // submission.approve_gate just to enter would make that existing,
    // working code unreachable.
    expect(capabilityForRoute('/ops/quality-review')).toBe('internal_ops.view')
  })

  it('does not match unrelated routes with a shared prefix substring', () => {
    // "/opsomething" must not match the "/ops" entry.
    expect(capabilityForRoute('/opsomething')).toBeNull()
    expect(capabilityForRoute('/administrator')).toBeNull()
  })

  it('returns null for every ungated recruiter-portal route', () => {
    for (const route of [
      '/overview', '/dashboard', '/pipeline', '/submit', '/calendar',
      '/messages', '/cross-list', '/matchmaker', '/my-roles', '/rewards',
      '/jobs', '/clients',
    ]) {
      expect(capabilityForRoute(route)).toBeNull()
    }
  })
})

describe('every gated route has a layout.tsx enforcing the same capability', () => {
  // Real source assertions, not just "the map says so" — this is what would
  // have caught the original bug: the capability existed and was checked in
  // the sidebar, but no layout ever called RequireCapability at all.
  const LAYOUT_BY_PREFIX: Record<string, string> = {
    '/admin': 'admin/layout.tsx',
    '/bd': 'bd/layout.tsx',
    '/ops': 'ops/layout.tsx',
    '/supply': 'supply/layout.tsx',
    '/bookmarks': 'bookmarks/layout.tsx',
  }

  for (const [route, capability] of Object.entries(ROUTE_CAPABILITIES)) {
    const layoutPath = LAYOUT_BY_PREFIX[route]
    it(`${route} (requires ${capability}) has a matching layout.tsx`, () => {
      expect(layoutPath, `no layout mapped for ${route} in this test`).toBeTruthy()
      const src = readFile(layoutPath)
      expect(src).toContain('RequireCapability')
      expect(src).toContain(`capability="${capability}"`)
    })
  }

  it('the sidebar reads capabilityForRoute rather than its own hardcoded copy', () => {
    // This is the actual drift-prevention mechanism: if someone reverts the
    // sidebar to hand-rolled `if (item.href === ...)` checks, this fails.
    const src = readFile('_components/sidebar-nav.tsx')
    expect(src).toContain('capabilityForRoute')
    expect(src).not.toMatch(/item\.href === ['"]\/admin['"]/)
    expect(src).not.toMatch(/item\.href === ['"]\/ops\/quality-review['"]/)
  })

  it('RequireCapability itself checks useCan and renders a named fallback', () => {
    const src = readFile('_components/require-capability.tsx')
    expect(src).toContain('useCan')
    expect(src).toContain('AccessRestricted')
    // The fallback must name the missing capability, so it's diagnostic
    // rather than a bare "no".
    expect(src).toContain('{capability}')
  })
})
