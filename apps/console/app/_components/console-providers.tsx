'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MSWProvider } from './msw-provider'

// QueryClient created outside component to avoid re-creation on renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds default
      retry: 1,
    },
  },
})

export function ConsoleProviders({ children }: { children: React.ReactNode }) {
  return (
    <MSWProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </MSWProvider>
  )
}
