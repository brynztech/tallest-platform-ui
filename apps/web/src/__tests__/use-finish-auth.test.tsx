import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'

// The hand-off that runs after ANY successful sign-in or sign-up (password, email code, Google).
// The identity SDK, router and candidate context are mocked so the ordering and failure paths are real.
const h = vi.hoisted(() => ({
  calls: [] as string[],
  push: vi.fn(),
  remember: vi.fn(),
  clerk: { user: null as unknown, session: null as unknown },
}))

vi.mock('@clerk/nextjs', () => ({ useClerk: () => h.clerk }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: h.push }) }))
vi.mock('../../app/_components/candidate-auth-context', () => ({
  useCandidateAuth: () => ({ signIn: h.remember }),
}))

import { readableAuthError, useFinishAuth } from '../../app/_lib/use-finish-auth'

const USER = { id: 'user_123', fullName: 'Demo Candidate', primaryEmailAddress: { emailAddress: 'demo@example.com' } }

function signedInAs(token: string | null) {
  h.clerk.user = USER
  h.clerk.session = { getToken: async () => token }
}

function fetchReturns(ok: boolean) {
  const fetchMock = vi.fn(async () => {
    h.calls.push('fetch')
    return { ok }
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

// Newer Node ships its own bare `localStorage` global that shadows jsdom's, so use a plain in-memory one.
function memoryStorage() {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, String(value)),
    removeItem: (key: string) => void store.delete(key),
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage())
  h.calls.length = 0
  h.push.mockReset().mockImplementation(() => h.calls.push('push'))
  h.remember.mockReset().mockImplementation(() => h.calls.push('remember'))
  h.clerk.user = null
  h.clerk.session = null
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useFinishAuth', () => {
  it('remembers the candidate BEFORE the profile call and the redirect (protected pages read it on first render)', async () => {
    signedInAs('tok_abc')
    fetchReturns(true)
    const { result } = renderHook(() => useFinishAuth())

    const message = await result.current({ next: '/dashboard', onboarding: false })

    expect(message).toBeNull()
    expect(h.calls).toEqual(['remember', 'fetch', 'push'])
    expect(h.remember).toHaveBeenCalledWith('tok_abc', { id: 'user_123', clerk_user_id: 'user_123', email: 'demo@example.com' })
    expect(h.push).toHaveBeenCalledWith('/dashboard')
  })

  it('starts the candidate profile with the bearer token, email and full name', async () => {
    signedInAs('tok_abc')
    const fetchMock = fetchReturns(true)
    const { result } = renderHook(() => useFinishAuth())

    await result.current({ next: '/dashboard', onboarding: false })

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toMatch(/\/api\/v1\/candidate\/onboarding\/start$/)
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok_abc')
    expect(JSON.parse(init.body as string)).toEqual({ email: 'demo@example.com', full_name: 'Demo Candidate' })
  })

  it('a first-time sign-up flags the resume scan intent; a plain sign-in does not', async () => {
    signedInAs('tok_abc')
    fetchReturns(true)
    const { result } = renderHook(() => useFinishAuth())

    await result.current({ next: '/dashboard', onboarding: false })
    expect(localStorage.getItem('candidate_onboarding_intent')).toBeNull()

    await result.current({ next: '/onboarding/1', onboarding: true })
    expect(localStorage.getItem('candidate_onboarding_intent')).toBe('resume_scan')
    expect(h.push).toHaveBeenLastCalledWith('/onboarding/1')
  })

  it('when the profile call fails it says so, does not navigate and does not flag onboarding', async () => {
    signedInAs('tok_abc')
    fetchReturns(false)
    const { result } = renderHook(() => useFinishAuth())

    const signUpMessage = await result.current({ next: '/onboarding/1', onboarding: true })
    const signInMessage = await result.current({ next: '/dashboard', onboarding: false })

    expect(signUpMessage).toBe('Could not start your candidate profile. Please try again.')
    expect(signInMessage).toBe('Could not load your candidate profile. Please try again.')
    expect(h.push).not.toHaveBeenCalled()
    expect(localStorage.getItem('candidate_onboarding_intent')).toBeNull()
  })

  it('without a session token it stops early: no profile call, no navigation, no candidate state', async () => {
    signedInAs(null)
    const fetchMock = fetchReturns(true)
    const { result } = renderHook(() => useFinishAuth())

    const message = await result.current({ next: '/dashboard', onboarding: false })

    expect(message).toBe("We couldn't load your session. Please try again.")
    expect(fetchMock).not.toHaveBeenCalled()
    expect(h.remember).not.toHaveBeenCalled()
    expect(h.push).not.toHaveBeenCalled()
  })
})

describe('readableAuthError', () => {
  it('prefers the long plain-language message, then the short one, then a safe default', () => {
    expect(readableAuthError({ message: 'Short', longMessage: "Couldn't find your account." })).toBe("Couldn't find your account.")
    expect(readableAuthError({ message: 'Short' })).toBe('Short')
    expect(readableAuthError(null)).toBe('Something went wrong. Please try again.')
  })
})
