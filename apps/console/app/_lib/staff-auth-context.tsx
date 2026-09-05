'use client'

import { createContext, useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCurrentStaffUser, type StaffUser } from './staff-auth'

export const STAFF_ME_QUERY_KEY = ['staff-auth', 'me'] as const

type StaffAuthValue = {
  status: 'loading' | 'authenticated' | 'unauthenticated'
  user: StaffUser | null
}

const StaffAuthContext = createContext<StaffAuthValue | null>(null)

/**
 * Tracks the real backend session (platform/staff_auth_router.py), separate
 * from @brynzit/identity's acting-user switcher — the two are intentionally
 * not wired together yet (see docs/console-staff-auth.md in the backend
 * repo). This only answers "is anyone really signed in," not "which
 * capabilities does the switcher currently grant." Sign-out itself lives in
 * sign-out-button.tsx, which writes STAFF_ME_QUERY_KEY directly.
 */
export function StaffAuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: STAFF_ME_QUERY_KEY,
    queryFn: fetchCurrentStaffUser,
    staleTime: 60 * 1000,
    retry: false,
  })

  const status: StaffAuthValue['status'] = isLoading
    ? 'loading'
    : data
      ? 'authenticated'
      : 'unauthenticated'

  return (
    <StaffAuthContext.Provider value={{ status, user: data ?? null }}>
      {children}
    </StaffAuthContext.Provider>
  )
}

export function useStaffAuth(): StaffAuthValue {
  const ctx = useContext(StaffAuthContext)
  if (!ctx) throw new Error('useStaffAuth must be used within StaffAuthProvider')
  return ctx
}
