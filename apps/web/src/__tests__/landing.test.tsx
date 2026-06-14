import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

const APP_DIR = path.resolve(__dirname, '../../app')

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(APP_DIR, relPath), 'utf-8')
}

describe('CandidateAuthContext (T-05-03)', () => {
  const src = readFile('_components/candidate-auth-context.tsx')

  it('exports CandidateAuthProvider', () => {
    expect(src).toContain('export function CandidateAuthProvider')
  })

  it('exports useCandidateAuth', () => {
    expect(src).toContain('export function useCandidateAuth')
  })

  it('contains T-05-03 try/catch for corrupt localStorage', () => {
    // T-05-03: prototype pollution via corrupt localStorage must be caught
    expect(src).toContain('try { setCandidate(JSON.parse(stored)) } catch')
  })

  it('stores token and data in localStorage on signIn', () => {
    expect(src).toContain("localStorage.setItem('candidate_access_token'")
    expect(src).toContain("localStorage.setItem('candidate_data'")
  })

  it('removes localStorage entries on signOut', () => {
    expect(src).toContain("localStorage.removeItem('candidate_access_token')")
    expect(src).toContain("localStorage.removeItem('candidate_data')")
  })

  it('derives isLoggedIn from candidate state (!!candidate)', () => {
    expect(src).toContain('isLoggedIn: !!candidate')
  })
})

describe('HeroSection', () => {
  const src = readFile('_components/hero-section.tsx')

  it('renders h1 with text-[120px] font-light class', () => {
    expect(src).toContain('text-[120px]')
    expect(src).toContain('font-light')
  })

  it('renders a link to /signup', () => {
    expect(src).toContain('href="/signup"')
  })

  it('uses font-light only for the editorial headline (D-03)', () => {
    // font-light appears exactly once — on the h1
    const matches = src.match(/font-light/g)
    expect(matches?.length).toBe(1)
  })
})

describe('SiteNav', () => {
  const src = readFile('_components/site-nav.tsx')

  it('exports SiteNav function', () => {
    expect(src).toContain('export function SiteNav')
  })

  it('has aria-label="Account menu" on avatar button', () => {
    expect(src).toContain('aria-label="Account menu"')
  })

  it('uses useCandidateAuth', () => {
    expect(src).toContain('useCandidateAuth')
  })

  it('renders Sign in and Join free links when logged out', () => {
    expect(src).toContain('href="/login"')
    expect(src).toContain('href="/signup"')
  })

  it('renders My Profile and Sign out items when logged in', () => {
    expect(src).toContain('href="/profile/edit"')
    expect(src).toContain('Sign out')
  })
})

describe('WebProviders (CandidateAuthProvider integration)', () => {
  const src = readFile('_components/web-providers.tsx')

  it('imports CandidateAuthProvider', () => {
    expect(src).toContain("import { CandidateAuthProvider }")
  })

  it('wraps children with CandidateAuthProvider inside QueryClientProvider', () => {
    expect(src).toContain('<CandidateAuthProvider>')
  })
})

describe('layout.tsx (Pitfall 5 + Pitfall 3)', () => {
  const src = readFile('layout.tsx')

  it('imports SiteNav', () => {
    expect(src).toContain("import { SiteNav }")
  })

  it('imports Toaster with theme="light" (Pitfall 3)', () => {
    expect(src).toContain('Toaster')
    expect(src).toContain('theme="light"')
  })

  it('does NOT add dark class to html element (Pitfall 5 — light mode only)', () => {
    // html className must NOT include 'dark'
    const htmlMatch = src.match(/<html[^>]*className[^>]*>/)
    if (htmlMatch) {
      expect(htmlMatch[0]).not.toContain('dark')
    }
    // Also check: no dark-${variable} or variable-dark pattern
    expect(src).not.toMatch(/`dark \$\{/)
  })

  it('includes <SiteNav /> inside body', () => {
    expect(src).toContain('<SiteNav />')
  })
})

describe('Dashboard placeholder (D-14)', () => {
  const src = readFile('dashboard/page.tsx')

  it('exists with coming soon message', () => {
    expect(src).toContain('coming soon')
  })

  it('has a link back to /jobs', () => {
    expect(src).toContain('href="/jobs"')
  })
})
