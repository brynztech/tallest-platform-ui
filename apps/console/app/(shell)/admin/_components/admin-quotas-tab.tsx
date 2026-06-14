'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import { Progress } from '@brynzit/ui/components/ui/progress'
import { AlertTriangle, AlertOctagon } from 'lucide-react'

export function AdminQuotasTab() {
  const { data: quotaData } = useQuery({
    queryKey: ['monitoring-quota'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/monitoring/quota', {})
      if (error) throw error
      return data
    },
    staleTime: 60000,
  })

  const percent = quotaData?.percent ?? 0
  const isWarning = (quotaData?.warning === true) || (percent >= 60)
  const isCritical = percent >= 90

  // Progress bar indicator color override via inline style
  const progressIndicatorColor = isCritical
    ? 'var(--destructive)'
    : isWarning
      ? 'oklch(0.769 0.188 85.87)'
      : undefined // uses default --primary

  return (
    <div className="max-w-[600px]">
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-base font-semibold mb-4">{quotaData?.model ?? '—'}</h2>

        <div className="flex items-center gap-4 mb-2">
          {/* Render a custom progress bar that supports color override */}
          <div className="flex-1 relative h-3 overflow-hidden rounded-full bg-primary/20">
            <div
              className="h-full transition-all"
              style={{
                width: `${percent}%`,
                backgroundColor: progressIndicatorColor ?? 'var(--primary)',
              }}
            />
          </div>
          <span className="text-sm font-semibold w-[48px] text-right">{percent}%</span>
        </div>

        <p className="text-sm text-muted-foreground">
          {quotaData?.used_tokens ?? 0} / {quotaData?.cap_tokens ?? 0} tokens
        </p>

        {(isWarning || isCritical) && (
          <div
            className={`mt-4 flex items-center gap-2 text-sm ${
              isCritical ? 'text-destructive' : 'text-[oklch(0.769_0.188_85.87)]'
            }`}
          >
            {isCritical ? (
              <AlertOctagon className="size-4 flex-shrink-0" />
            ) : (
              <AlertTriangle className="size-4 flex-shrink-0" />
            )}
            <span>
              {isCritical
                ? 'Critical quota level reached.'
                : 'Quota warning threshold reached. Consider rate-limiting agent tasks.'}
            </span>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        Quota resets daily. Contact your admin to adjust caps.
      </p>
    </div>
  )
}
