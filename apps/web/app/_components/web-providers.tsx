'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MSWProvider } from './msw-provider'
import { CandidateAuthProvider } from './candidate-auth-context'

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
  return (
    <MSWProvider>
      <QueryClientProvider client={queryClient}>
        <CandidateAuthProvider>
          {children}
        </CandidateAuthProvider>
      </QueryClientProvider>
    </MSWProvider>
  )
}
