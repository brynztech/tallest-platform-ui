import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

const APP_DIR = path.resolve(__dirname, '../../app')

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(APP_DIR, relPath), 'utf-8')
}

describe('Signup (PUB-02)', () => {
  it.todo('renders signup form with first name, last name, email, password fields')
  it.todo('shows zod error when email is invalid')
  it.todo('shows zod error when password is shorter than 8 chars')
  it.todo('calls POST /candidate/auth/signup and stores token in localStorage on success')
  it.todo('shows 409 conflict toast when email already registered')

  it('uses resume scan intent to continue into resume upload after signup', () => {
    const src = readFile('signup/page.tsx')
    expect(src).toContain('resume_scan')
    expect(src).toContain('candidate_onboarding_intent')
    expect(src).toContain('/onboarding/1')
  })

  it('shows demo credentials for local verification', () => {
    const src = readFile('signup/page.tsx')
    expect(src).toContain('demo@brynzit.local')
    expect(src).toContain('demo-password')
  })
})

describe('Login (PUB-02)', () => {
  it.todo('calls POST /candidate/auth/login and stores token on success')
  it.todo('shows 401 toast on wrong password')
  it.todo('redirects to redirect param if present after successful login')

  it('signs in through our own card when Clerk is configured and preserves the demo fallback', () => {
    const page = readFile('login/page.tsx')
    const card = readFile('login/_components/clerk-sign-in.tsx')
    expect(page).toContain('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')
    expect(page).toContain('ClerkSignIn')
    expect(page).toContain('demo@brynzit.local')
    expect(page).not.toContain('SignInButton')
    expect(card).toContain('useSignIn')
    expect(card).toContain('Continue to dashboard')
  })
})

describe('CandidateAuthContext (PUB-02)', () => {
  it.todo('isLoggedIn is false initially when localStorage is empty')
  it.todo('isLoggedIn is true after signIn called')
  it.todo('isLoggedIn is false after signOut called')
  it.todo('JSON.parse error in localStorage hydration is caught silently')

  it('is Clerk-ready while preserving local demo fallback', () => {
    const providerSrc = readFile('_components/web-providers.tsx')
    const authSrc = readFile('_components/candidate-auth-context.tsx')
    expect(providerSrc).toContain('ClerkProvider')
    expect(providerSrc).toContain('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')
    expect(authSrc).toContain('clerk_user_id')
  })
})

describe('Our own sign-in and sign-up cards', () => {
  const FILES = [
    'login/page.tsx',
    'login/_components/clerk-sign-in.tsx',
    'signup/page.tsx',
    'signup/_components/clerk-sign-up.tsx',
    'sso-callback/page.tsx',
    '_lib/use-finish-auth.ts',
    '_components/auth-parts.tsx',
  ]

  for (const file of FILES) {
    it(`${file}: no visible "Clerk" wording`, () => {
      // Comments are dropped first. Identifiers (useClerk, ClerkProvider), import paths and the
      // env var name have no spaces or sit outside JSX text, so only real copy can trip this.
      const src = readFile(file)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '')
      const messages = (src.match(/(['"`])(?:\\.|(?!\1).)*\1/g) ?? []).filter((text) => /\s/.test(text))
      expect(messages.filter((text) => /Clerk/.test(text))).toEqual([])
      expect(src).not.toMatch(/>[^<>{}]*Clerk[^<>{}]*</)
    })
  }

  it('sign-in covers password, forgot password, Google and the second-factor step', () => {
    const card = readFile('login/_components/clerk-sign-in.tsx')
    expect(card).toContain('signIn.password')
    expect(card).toContain('resetPasswordEmailCode')
    expect(card).toContain("strategy: 'oauth_google'")
    expect(card).toContain('signIn.mfa')
  })

  it('sign-up verifies the email with a code and renders the bot-protection slot', () => {
    const card = readFile('signup/_components/clerk-sign-up.tsx')
    expect(card).toContain('verifyEmailCode')
    expect(card).toContain('id="clerk-captcha"')
    expect(card).toContain('candidate_onboarding_profile')
  })

  it('the provider sends every hosted-page redirect to our own pages', () => {
    const src = readFile('_components/web-providers.tsx')
    expect(src).toContain('signInUrl="/login"')
    expect(src).toContain('signUpUrl="/signup"')
  })

  it('the Google callback only runs when sign-in is configured', () => {
    const src = readFile('sso-callback/page.tsx')
    expect(src).toContain('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')
    expect(src).toContain("router.replace('/login')")
  })

  it('hands the token to the candidate context before navigating (protected pages read it on first render)', () => {
    const src = readFile('_lib/use-finish-auth.ts')
    const remember = src.indexOf('rememberCandidate(')
    expect(remember).toBeGreaterThan(-1)
    expect(src.indexOf('router.push(next)')).toBeGreaterThan(remember)
  })
})
