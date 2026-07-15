'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { IdentityProvider } from '@brynzit/identity'
import { MSWProvider } from './msw-provider'

// QueryClient created outside component to avoid re-creation on renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds default
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
})

export function ConsoleProviders({ children }: { children: React.ReactNode }) {
  return (
    <MSWProvider>
      <QueryClientProvider client={queryClient}>
        <IdentityProvider>{children}</IdentityProvider>
      </QueryClientProvider>
    </MSWProvider>
  )
}
