'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MSWProvider } from './msw-provider'
import { CandidateAuthProvider } from './candidate-auth-context'

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
})

export function WebProviders({ children }: { children: React.ReactNode }) {
  const app = (
    <QueryClientProvider client={queryClient}>
      <CandidateAuthProvider enableClerk={!!clerkPublishableKey}>
        {children}
      </CandidateAuthProvider>
    </QueryClientProvider>
  )

  return (
    <MSWProvider>
      {clerkPublishableKey ? (
        <ClerkProvider publishableKey={clerkPublishableKey} signInUrl="/login" signUpUrl="/signup">
          {app}
        </ClerkProvider>
      ) : (
        app
      )}
    </MSWProvider>
  )
}
