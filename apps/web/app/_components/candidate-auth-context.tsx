'use client'
import { useAuth, useUser } from '@clerk/nextjs'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

type CandidateAuth = {
  isLoggedIn: boolean
  candidate: CandidateIdentity | null
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

  useEffect(() => {
    // T-05-03: try/catch guards against prototype pollution via corrupt localStorage
    const token = localStorage.getItem('candidate_access_token')
    const stored = localStorage.getItem('candidate_data')
    if (token && stored) {
      try { setCandidate(JSON.parse(stored)) } catch { /* corrupt — ignore per T-05-03 */ }
    }
  }, [])

  const signIn = useCallback((token: string, data: CandidateIdentity) => {
    localStorage.setItem('candidate_access_token', token)
    localStorage.setItem('candidate_data', JSON.stringify(data))
    setCandidate(data)
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem('candidate_access_token')
    localStorage.removeItem('candidate_data')
    setCandidate(null)
  }, [])

  return (
    <CandidateAuthContext.Provider value={{ isLoggedIn: !!candidate, candidate, signIn, signOut }}>
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
