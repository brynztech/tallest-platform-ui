'use client'
import { useAuth, useUser } from '@clerk/nextjs'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

type CandidateAuth = {
  isLoggedIn: boolean
  candidate: CandidateIdentity | null
  /** Session bearer token, exposed so callers can personalize API reads (the
   *  public job feed ranks against the caller's profile when it is sent).
   *  Held in state rather than re-read from localStorage per call, so a sign-in
   *  or sign-out re-renders consumers instead of leaving them on a stale token. */
  token: string | null
  signIn: (token: string, candidate: CandidateIdentity) => void
  signOut: () => void
}

type CandidateIdentity = {
  id: string
  email: string
  clerk_user_id?: string
}

const CandidateAuthContext = createContext<CandidateAuth>(null!)

export function CandidateAuthProvider({
  children,
  enableClerk = false,
}: {
  children: React.ReactNode
  enableClerk?: boolean
}) {
  const [candidate, setCandidate] = useState<CandidateIdentity | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // T-05-03: try/catch guards against prototype pollution via corrupt localStorage
    const stored_token = localStorage.getItem('candidate_access_token')
    const stored = localStorage.getItem('candidate_data')
    if (stored_token && stored) {
      try {
        setCandidate(JSON.parse(stored))
        setToken(stored_token)
      } catch { /* corrupt — ignore per T-05-03 */ }
    }
  }, [])

  const signIn = useCallback((next_token: string, data: CandidateIdentity) => {
    localStorage.setItem('candidate_access_token', next_token)
    localStorage.setItem('candidate_data', JSON.stringify(data))
    setCandidate(data)
    setToken(next_token)
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem('candidate_access_token')
    localStorage.removeItem('candidate_data')
    setCandidate(null)
    setToken(null)
  }, [])

  return (
    <CandidateAuthContext.Provider value={{ isLoggedIn: !!candidate, candidate, token, signIn, signOut }}>
      {enableClerk ? (
        <ClerkCandidateSessionBridge signIn={signIn} signOut={signOut}>
          {children}
        </ClerkCandidateSessionBridge>
      ) : (
        children
      )}
    </CandidateAuthContext.Provider>
  )
}

function ClerkCandidateSessionBridge({
  children,
  signIn,
  signOut,
}: {
  children: React.ReactNode
  signIn: CandidateAuth['signIn']
  signOut: CandidateAuth['signOut']
}) {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth()
  const { user } = useUser()

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn || !userId) {
      signOut()
      return
    }

    let cancelled = false
    getToken().then((token) => {
      if (cancelled || !token) return
      signIn(token, {
        id: userId,
        clerk_user_id: userId,
        email: user?.primaryEmailAddress?.emailAddress ?? '',
      })
    })
    return () => {
      cancelled = true
    }
  }, [getToken, isLoaded, isSignedIn, signIn, signOut, user, userId])

  return children
}

export function useCandidateAuth() {
  return useContext(CandidateAuthContext)
}
