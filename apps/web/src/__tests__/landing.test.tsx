import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'

// Mock next/navigation for usePathname
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

// Mock next/link as a simple anchor
vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    React.createElement('a', { href, className }, children),
}))

describe('CandidateAuthContext (T-05-03)', () => {
  it('isLoggedIn is false when localStorage is empty', async () => {
    const { CandidateAuthProvider, useCandidateAuth } = await import('../../app/_components/candidate-auth-context')

    function TestConsumer() {
      const auth = useCandidateAuth()
      return React.createElement('div', { 'data-testid': 'state' }, auth.isLoggedIn ? 'logged-in' : 'logged-out')
    }

    localStorage.clear()
    const { getByTestId } = render(
      React.createElement(CandidateAuthProvider, null, React.createElement(TestConsumer)),
    )
    expect(getByTestId('state').textContent).toBe('logged-out')
  })

  it('isLoggedIn is true after signIn is called', async () => {
    const { CandidateAuthProvider, useCandidateAuth } = await import('../../app/_components/candidate-auth-context')

    function TestConsumer() {
      const { isLoggedIn, signIn } = useCandidateAuth()
      return React.createElement(
        'div',
        null,
        React.createElement('div', { 'data-testid': 'state' }, isLoggedIn ? 'logged-in' : 'logged-out'),
        React.createElement('button', { onClick: () => signIn('tok', { id: '1', email: 'a@b.com' }) }, 'sign in'),
      )
    }

    localStorage.clear()
    const { getByTestId, getByRole } = render(
      React.createElement(CandidateAuthProvider, null, React.createElement(TestConsumer)),
    )
    expect(getByTestId('state').textContent).toBe('logged-out')
    getByRole('button').click()
    expect(getByTestId('state').textContent).toBe('logged-in')
  })

  it('isLoggedIn is false after signOut is called', async () => {
    const { CandidateAuthProvider, useCandidateAuth } = await import('../../app/_components/candidate-auth-context')

    function TestConsumer() {
      const { isLoggedIn, signIn, signOut } = useCandidateAuth()
      return React.createElement(
        'div',
        null,
        React.createElement('div', { 'data-testid': 'state' }, isLoggedIn ? 'logged-in' : 'logged-out'),
        React.createElement('button', { 'data-testid': 'in', onClick: () => signIn('tok', { id: '1', email: 'a@b.com' }) }, 'sign in'),
        React.createElement('button', { 'data-testid': 'out', onClick: signOut }, 'sign out'),
      )
    }

    localStorage.clear()
    const { getByTestId } = render(
      React.createElement(CandidateAuthProvider, null, React.createElement(TestConsumer)),
    )
    getByTestId('in').click()
    expect(getByTestId('state').textContent).toBe('logged-in')
    getByTestId('out').click()
    expect(getByTestId('state').textContent).toBe('logged-out')
  })

  it('handles corrupt localStorage without crashing (T-05-03)', async () => {
    const { CandidateAuthProvider, useCandidateAuth } = await import('../../app/_components/candidate-auth-context')

    function TestConsumer() {
      const auth = useCandidateAuth()
      return React.createElement('div', { 'data-testid': 'state' }, auth.isLoggedIn ? 'logged-in' : 'logged-out')
    }

    localStorage.setItem('candidate_access_token', 'some-token')
    localStorage.setItem('candidate_data', 'NOT_VALID_JSON{{{')
    // Should not throw — T-05-03 try/catch guards corrupt data
    expect(() =>
      render(
        React.createElement(CandidateAuthProvider, null, React.createElement(TestConsumer)),
      ),
    ).not.toThrow()
  })
})

describe('HeroSection', () => {
  it('renders h1 with text-[120px] font-light class', async () => {
    const { HeroSection } = await import('../../app/_components/hero-section')
    const { container } = render(React.createElement(HeroSection))
    const h1 = container.querySelector('h1')
    expect(h1).toBeTruthy()
    expect(h1?.className).toContain('text-[120px]')
    expect(h1?.className).toContain('font-light')
  })

  it('renders a link to /signup', async () => {
    const { HeroSection } = await import('../../app/_components/hero-section')
    const { container } = render(React.createElement(HeroSection))
    const link = container.querySelector('a[href="/signup"]')
    expect(link).toBeTruthy()
  })
})

describe('SiteNav exports', () => {
  it('SiteNav is exported from site-nav module', async () => {
    const mod = await import('../../app/_components/site-nav')
    expect(mod.SiteNav).toBeDefined()
    expect(typeof mod.SiteNav).toBe('function')
  })
})
