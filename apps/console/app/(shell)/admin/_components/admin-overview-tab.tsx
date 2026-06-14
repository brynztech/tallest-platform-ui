'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import type { components } from '@brynzit/api-client'
import { Progress } from '@brynzit/ui/components/ui/progress'

type AgentEventOut = components['schemas']['AgentEventOut']

interface AdminOverviewTabProps {
  onNavigate: (tab: string) => void
}

export function AdminOverviewTab({ onNavigate }: AdminOverviewTabProps) {
  const { data: costData } = useQuery({
    queryKey: ['monitoring-cost', 'month'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/monitoring/cost', {
        params: { query: { period: 'month' } },
      })
      if (error) throw error
      return data
    },
    staleTime: 60000,
  })

  const { data: quotaData } = useQuery({
    queryKey: ['monitoring-quota'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/monitoring/quota', {})
      if (error) throw error
      return data
    },
    staleTime: 60000,
  })

  const { data: pipelineData } = useQuery({
    queryKey: ['monitoring-pipeline'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/monitoring/pipeline', {})
      if (error) throw error
      return data
    },
    staleTime: 60000,
  })

  const { data: recentEvents } = useQuery({
    queryKey: ['monitoring-events-recent'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/monitoring/agent-events', {
        params: { query: { limit: 5, offset: 0 } },
      })
      if (error) throw error
      return data as AgentEventOut[]
    },
    staleTime: 60000,
  })

  // Compute total from rows (CostResponse has no total_usd field)
  const totalUsd = costData?.rows.reduce((sum, row) => sum + row.total_usd, 0) ?? 0
  const topRow = costData?.rows[0]

  // Quota color logic
  const quotaPercent = quotaData?.percent ?? 0
  const quotaValueColor =
    quotaPercent >= 90
      ? 'text-destructive'
      : quotaData?.warning || quotaPercent >= 60
        ? 'text-[oklch(0.769_0.188_85.87)]'
        : 'text-foreground'

  // Quota progress bar indicator color
  const quotaProgressColor =
    quotaPercent >= 90
      ? '#ef4444' // destructive red
      : quotaData?.warning || quotaPercent >= 60
        ? 'oklch(0.769 0.188 85.87)' // amber
        : undefined // use default (primary)

  // Pipeline failure color
  const failures = pipelineData?.failed_agent_events_24h ?? 0
  const failureColor = failures === 0 ? 'text-[oklch(0.45_0.15_145)]' : 'text-destructive'

  // Active counts for pipeline card sub-text
  const activeLeads = pipelineData?.lead_counts
    ? Object.values(pipelineData.lead_counts).reduce((s, n) => s + n, 0)
    : 0
  const activeSequences = pipelineData?.sequence_counts
    ? Object.values(pipelineData.sequence_counts).reduce((s, n) => s + n, 0)
    : 0

  function getEventDotColor(status: string) {
    if (status === 'success') return 'bg-[oklch(0.45_0.15_145)]'
    if (status === 'error' || status === 'failed') return 'bg-destructive'
    if (status === 'quota_exhausted') return 'bg-[oklch(0.769_0.188_85.87)]'
    return 'bg-muted-foreground'
  }

  return (
    <div className="grid grid-cols-4 gap-4 lg:grid-cols-2">
      {/* Total Spend card */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onNavigate('costs')}
        onKeyDown={(e) => { if (e.key === 'Enter') onNavigate('costs') }}
        className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <p className="text-xs text-muted-foreground">Total Spend (30d)</p>
        <p className="text-xl font-semibold mt-1">${totalUsd.toFixed(2)}</p>
        {topRow && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            Top: {topRow.domain} / {topRow.model_used} / {topRow.task_type}
          </p>
        )}
        <p className="text-xs text-primary mt-2">View breakdown →</p>
      </div>

      {/* Quota Usage card */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onNavigate('quotas')}
        onKeyDown={(e) => { if (e.key === 'Enter') onNavigate('quotas') }}
        className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <p className="text-xs text-muted-foreground">Quota Usage</p>
        <p className={`text-xl font-semibold mt-1 ${quotaValueColor}`}>{quotaPercent}%</p>
        <p className="text-xs text-muted-foreground mt-1">
          {quotaData?.used_tokens ?? 0} / {quotaData?.cap_tokens ?? 0} tokens
        </p>
        <div className="mt-2 relative h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
          <div
            className="h-full transition-all"
            style={{
              width: `${quotaPercent}%`,
              backgroundColor: quotaProgressColor ?? 'var(--primary)',
            }}
          />
        </div>
        <p className="text-xs text-primary mt-2">View quotas →</p>
      </div>

      {/* Pipeline Health card */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onNavigate('pipeline')}
        onKeyDown={(e) => { if (e.key === 'Enter') onNavigate('pipeline') }}
        className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <p className="text-xs text-muted-foreground">Pipeline Health</p>
        <p className={`text-xl font-semibold mt-1 ${failureColor}`}>
          {failures} failures (24h)
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {activeLeads} active leads, {activeSequences} sequences
        </p>
        <p className="text-xs text-primary mt-2">View pipeline →</p>
      </div>

      {/* Recent Events card */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onNavigate('events')}
        onKeyDown={(e) => { if (e.key === 'Enter') onNavigate('events') }}
        className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <p className="text-xs text-muted-foreground">Recent Agent Events</p>
        <div className="flex flex-col gap-1 mt-2">
          {(recentEvents ?? []).slice(0, 5).map((event) => (
            <div key={event.id} className="flex items-center gap-2 py-0.5">
              <span
                className={`size-2 rounded-full flex-shrink-0 ${getEventDotColor(event.status)}`}
              />
              <span className="text-xs flex-1 truncate">
                {event.domain} / {event.task_type}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                ${event.cost_usd.toFixed(4)}
              </span>
            </div>
          ))}
          {(recentEvents ?? []).length === 0 && (
            <p className="text-xs text-muted-foreground py-2">No recent events.</p>
          )}
        </div>
        <p className="text-xs text-primary mt-2">View all events →</p>
      </div>
    </div>
  )
}
