'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Badge } from '@brynzit/ui/components/ui/badge'
import { Separator } from '@brynzit/ui/components/ui/separator'

interface ClientRequisitionsProps {
  clientId: string
}

export function ClientRequisitions({ clientId }: ClientRequisitionsProps) {
  const { data: requisitions } = useQuery({
    queryKey: ['client-requisitions', clientId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/api/v1/ops/clients/{client_id}/requisitions',
        {
          params: { path: { client_id: clientId } },
        },
      )
      if (error) throw error
      return data
    },
  })

  const reqs = requisitions ?? []
  const shown = reqs.slice(0, 5)
  const hasMore = reqs.length > 5

  return (
    <div>
      <Separator className="mb-4" />
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-base font-semibold">Requisitions</h3>
        <Link
          href={`/ops/requisitions?client_id=${clientId}`}
          className="text-primary flex items-center gap-1 text-xs"
        >
          <Plus className="size-3" />
          Create Requisition
        </Link>
      </div>

      {reqs.length === 0 ? (
        <p className="text-muted-foreground text-sm">No requisitions yet.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {shown.map((req) => (
            <Link
              key={req.id}
              href={`/ops/requisitions/${req.id}`}
              className="hover:bg-muted/50 flex items-center gap-2 rounded-md px-3 py-2 transition-colors"
            >
              <span className="flex-1 truncate text-sm">{req.title}</span>
              <Badge variant="secondary" className="text-xs">
                {req.status}
              </Badge>
            </Link>
          ))}
          {hasMore && (
            <Link
              href={`/ops/requisitions?client_id=${clientId}`}
              className="text-primary mt-2 text-xs"
            >
              View all requisitions for this client →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
