'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import { ClientFields } from './_components/client-fields'
import { ClientNotes } from './_components/client-notes'
import { ClientRequisitions } from './_components/client-requisitions'

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const { data, isLoading, error } = useQuery({
    queryKey: ['ops-client', id],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/ops/clients/{client_id}', {
        params: { path: { client_id: id } },
      })
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

  if (error || !data) {
    return (
      <div className="p-6">
        <p className="text-destructive text-sm">Client not found.</p>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Left panel — client fields + compact req list */}
      <div className="border-border flex w-[420px] shrink-0 flex-col gap-6 overflow-y-auto border-r p-6">
        <div>
          <h1 className="text-xl font-semibold">{data.name}</h1>
        </div>
        <ClientFields client={data} />
        <ClientRequisitions clientId={id} />
      </div>
      {/* Right panel — notes log */}
      <div className="flex flex-1 flex-col overflow-y-auto p-6">
        <ClientNotes clientId={id} />
      </div>
    </div>
  )
}
