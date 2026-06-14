'use client'
import { createContext, useContext, useEffect, useState } from 'react'

type CandidateAuth = {
  isLoggedIn: boolean
  candidate: { id: string; email: string } | null
  signIn: (token: string, candidate: { id: string; email: string }) => void
  signOut: () => void
}

const CandidateAuthContext = createContext<CandidateAuth>(null!)

export function CandidateAuthProvider({ children }: { children: React.ReactNode }) {
  const [candidate, setCandidate] = useState<{ id: string; email: string } | null>(null)

  useEffect(() => {
    // T-05-03: try/catch guards against prototype pollution via corrupt localStorage
    const token = localStorage.getItem('candidate_access_token')
    const stored = localStorage.getItem('candidate_data')
    if (token && stored) {
      try { setCandidate(JSON.parse(stored)) } catch { /* corrupt — ignore per T-05-03 */ }
    }
  }, [])

  function signIn(token: string, data: { id: string; email: string }) {
    localStorage.setItem('candidate_access_token', token)
    localStorage.setItem('candidate_data', JSON.stringify(data))
    setCandidate(data)
  }

  function signOut() {
    localStorage.removeItem('candidate_access_token')
    localStorage.removeItem('candidate_data')
    setCandidate(null)
  }

  return (
    <CandidateAuthContext.Provider value={{ isLoggedIn: !!candidate, candidate, signIn, signOut }}>
      {children}
    </CandidateAuthContext.Provider>
  )
}

export function useCandidateAuth() {
  return useContext(CandidateAuthContext)
}
