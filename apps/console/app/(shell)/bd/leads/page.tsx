'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'

export default function LeadsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['rejection-reasons'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/bd/rejection-reasons')
      if (error) throw error
      return data
    },
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-destructive text-sm">Error loading data</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-lg font-semibold">Brynzit Console</h1>
      <p className="text-muted-foreground mb-3 text-sm">
        Walking skeleton — rejection reasons from{' '}
        {process.env.NEXT_PUBLIC_API_MOCKING === 'enabled' ? 'MSW mock' : 'live backend'}:
      </p>
      <ul className="flex flex-col gap-1">
        {Array.isArray(data?.reasons) &&
          data.reasons.map((reason: string) => (
            <li key={reason} className="font-mono text-sm">
              {reason}
            </li>
          ))}
      </ul>
    </div>
  )
}
