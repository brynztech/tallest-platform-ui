'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { Badge } from '@brynzit/ui/components/ui/badge'

interface PlacementsSectionProps {
  reqId: string
}

type PlacementResponse = components['schemas']['PlacementResponse']

export function PlacementsSection({ reqId }: PlacementsSectionProps) {
  const { data: placements = [] } = useQuery({
    queryKey: ['ops-placements', reqId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/api/v1/ops/requisitions/{req_id}/placements',
        { params: { path: { req_id: reqId } } },
      )
      if (error) throw error
      return data
    },
  })

  if (placements.length === 0) {
    return <p className="py-4 text-[15px] text-[#908E8B]">No placements logged.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {placements.map((placement: PlacementResponse) => (
        <div
          key={placement.id}
          className="flex items-center gap-4 rounded-lg border border-border bg-background px-4 py-3"
        >
          <span className="flex-1 text-sm">{placement.candidate_id ?? '—'}</span>
          <span className="text-sm">
            {placement.fee_usd != null ? `$${placement.fee_usd.toLocaleString()}` : '—'}
          </span>
          <span className="text-xs text-muted-foreground">{placement.billing_status}</span>
          {placement.retention_flag_90d && (
            <Badge variant="secondary" className="text-xs">
              90-day retention
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {new Date(placement.created_at).toLocaleDateString()}
          </span>
        </div>
      ))}
    </div>
  )
}
