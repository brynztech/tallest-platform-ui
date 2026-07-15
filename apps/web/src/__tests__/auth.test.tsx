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

  it('uses Clerk sign-in when Clerk is configured and preserves demo fallback', () => {
    const src = readFile('login/page.tsx')
    expect(src).toContain('SignInButton')
    expect(src).toContain('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')
    expect(src).toContain('Continue to dashboard')
    expect(src).toContain('demo@brynzit.local')
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
