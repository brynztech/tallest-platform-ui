'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { AlertTriangle } from 'lucide-react'

type PipelineResponse = components['schemas']['platform__monitoring_router__PipelineResponse']

function StatusCountCard({ label, count }: { label: string; count: number }) {
  return (
    <div className="bg-card border border-border rounded-lg px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold mt-1">{count}</p>
    </div>
  )
}

export function AdminPipelineTab() {
  const { data } = useQuery({
    queryKey: ['monitoring-pipeline'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/monitoring/pipeline', {})
      if (error) throw error
      return data as PipelineResponse
    },
    staleTime: 60000,
  })

  const failures = data?.failed_agent_events_24h ?? 0

  return (
    <div className="flex flex-col gap-6">
      {failures > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 flex items-center gap-2">
          <AlertTriangle className="size-4 text-destructive flex-shrink-0" />
          <span className="text-sm text-destructive">
            {failures} agent failure{failures !== 1 ? 's' : ''} in the last 24 hours.
          </span>
        </div>
      )}

      <div>
        <h2 className="text-base font-semibold mb-3">Lead Pipeline</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-2">
          {Object.entries(data?.lead_counts ?? {}).map(([status, count]) => (
            <StatusCountCard key={status} label={status} count={count} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold mb-3">Engagement Sequences</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-2">
          {Object.entries(data?.sequence_counts ?? {}).map(([status, count]) => (
            <StatusCountCard key={status} label={status} count={count} />
          ))}
        </div>
      </div>
    </div>
  )
}
