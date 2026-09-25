'use client'
import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useClerk } from '@clerk/nextjs'
import { useCandidateAuth } from '../_components/candidate-auth-context'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

/** Where to go once the account is ready, and whether this was a first-time sign-up. */
export type AuthDestination = { next: string; onboarding: boolean }

/** sessionStorage key that carries the destination across the Google round trip. */
export const SSO_DESTINATION_KEY = 'brynz_auth_destination'
/** Where Google returns to, and the second phase of that page that hands the session to the app. */
export const SSO_CALLBACK_URL = '/sso-callback'
export const SSO_DONE_URL = '/sso-callback?done=1'

/**
 * Runs after the identity provider has created a session (password, code or Google):
 * hands the token to the candidate context BEFORE navigating (the protected pages read
 * that state on their first render), makes sure the candidate profile exists, then
 * navigates. Resolves to an error message, or null on success.
 */
export function useFinishAuth() {
  const router = useRouter()
  const clerk = useClerk()
  const { signIn: rememberCandidate } = useCandidateAuth()

  return useCallback(
    async ({ next, onboarding }: AuthDestination): Promise<string | null> => {
      const user = clerk.user
      const token = await clerk.session?.getToken()
      if (!user || !token) return "We couldn't load your session. Please try again."

      const email = user.primaryEmailAddress?.emailAddress ?? ''
      rememberCandidate(token, { id: user.id, clerk_user_id: user.id, email })

      const response = await fetch(`${API_BASE}/api/v1/candidate/onboarding/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name: user.fullName || undefined }),
      })
      if (!response.ok) {
        return onboarding
          ? 'Could not start your candidate profile. Please try again.'
          : 'Could not load your candidate profile. Please try again.'
      }

      if (onboarding) localStorage.setItem('candidate_onboarding_intent', 'resume_scan')
      router.push(next)
      return null
    },
    [clerk, rememberCandidate, router],
  )
}

/** The message to show for a failed auth call. Provider messages are already plain language. */
export function readableAuthError(error: { message: string; longMessage?: string } | null | undefined): string {
  return error?.longMessage ?? error?.message ?? 'Something went wrong. Please try again.'
}
