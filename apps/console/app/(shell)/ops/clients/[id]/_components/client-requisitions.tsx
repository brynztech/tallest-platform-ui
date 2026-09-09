'use client'

import { useMemo } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { requisitionStatusLabel, isLiveRequisitionStatus } from '@/(shell)/_lib/requisition-status'
import { intakeQuickFacts } from '@/(shell)/_lib/requisition-intake'
import { fetchRequisitionsPipelineStats, statsFor } from '@/(shell)/_lib/requisition-pipeline-stats'
import { fetchRequisitionAssignees } from '@/(shell)/_lib/assignments'
import { listAssignableRecruiters } from '@/_lib/staff-auth'
import { cn } from '@/lib/utils'

interface ClientRequisitionsProps {
  clientId: string
}

export function ClientRequisitions({ clientId }: ClientRequisitionsProps) {
  const { data: requisitions } = useQuery({
    queryKey: ['client-requisitions', clientId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/api/v1/ops/clients/{client_id}/requisitions',
        { params: { path: { client_id: clientId } } },
      )
      if (error) throw error
      return data
    },
  })
  const reqs = requisitions ?? []

  const { data: statsById = new Map() } = useQuery({
    queryKey: ['ops-requisitions-pipeline-stats'],
    queryFn: fetchRequisitionsPipelineStats,
  })

  const { data: recruiters = [] } = useQuery({
    queryKey: ['staff-auth', 'recruiters'],
    queryFn: listAssignableRecruiters,
  })

  // One small query per requisition for its first assignee — the same call
  // AssignedRecruitersCard already makes, just reused per row here. Fine at
  // the handful of requisitions a single client has.
  const assigneeQueries = useQueries({
    queries: reqs.map((req) => ({
      queryKey: ['requisition-assignees', req.id],
      queryFn: () => fetchRequisitionAssignees(req.id),
      staleTime: 15_000,
    })),
  })
  const ownerByReqId = useMemo(() => {
    const map = new Map<string, string>()
    reqs.forEach((req, index) => {
      const firstAssigneeId = assigneeQueries[index]?.data?.[0]
      const username = firstAssigneeId
        ? (recruiters.find((r) => r.id === firstAssigneeId)?.username ?? null)
        : null
      if (username) map.set(req.id, username)
    })
    return map
  }, [reqs, assigneeQueries, recruiters])

  return (
    <div className="mb-4 rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Requisitions</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {reqs.length} requisition{reqs.length === 1 ? '' : 's'} for this client. Open one to
            edit its hiring process.
          </p>
        </div>
        <Link
          href={`/ops/requisitions?client_id=${clientId}`}
          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="size-3.5" />
          New requisition
        </Link>
      </div>

      {reqs.length === 0 ? (
        <p className="text-[15px] text-[#908E8B]">No requisitions yet.</p>
      ) : (
        <div className="flex flex-col">
          {reqs.map((req) => {
            const stats = statsFor(statsById, req.id)
            const quickFacts = intakeQuickFacts(req.intake_details)
            const location = [quickFacts.location, quickFacts.work_type].filter(Boolean).join(' · ')
            const owner = ownerByReqId.get(req.id)
            return (
              <Link
                key={req.id}
                href={`/ops/requisitions/${req.id}`}
                className="flex flex-wrap items-center gap-3 border-t border-[#ECEAE4] py-3 first:border-t-0 hover:bg-muted"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{req.title}</span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-[5px] rounded-full border px-2 py-[3px] text-[11px] font-medium',
                        isLiveRequisitionStatus(req.status)
                          ? 'border-[#D3E2D7] bg-[#EFF4EF] text-[#317A4F]'
                          : 'border-border bg-secondary text-muted-foreground',
                      )}
                    >
                      <span className="size-[5px] rounded-full bg-current" />
                      {requisitionStatusLabel(req.status)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">
                    {[location, `posted ${daysAgo(req.created_at)}d ago`, owner ? `owner ${owner}` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <div className="flex shrink-0 items-start gap-6">
                  <MiniStat label="Shortlist" value={stats.shortlist_total} />
                  <MiniStat label="Submitted" value={stats.submitted} />
                  <MiniStat
                    label="Awaiting"
                    value={stats.not_yet_screened}
                    dotTone={stats.not_yet_screened > 0 ? '#905300' : undefined}
                  />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function daysAgo(dateIso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(dateIso).getTime()) / 86_400_000))
}

function MiniStat({ label, value, dotTone }: { label: string; value: number; dotTone?: string }) {
  return (
    <div className="text-right">
      <div className="text-[11px] font-medium tracking-[0.09em] text-[#908E8B] uppercase">{label}</div>
      <div className="mt-1.5 flex items-center justify-end gap-1.5">
        {dotTone && <span className="size-1.5 rounded-full" style={{ backgroundColor: dotTone }} />}
        <span className="text-sm font-semibold">{value}</span>
      </div>
    </div>
  )
}
