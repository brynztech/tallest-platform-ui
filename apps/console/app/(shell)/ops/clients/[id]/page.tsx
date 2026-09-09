'use client'

import { use, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@brynzit/api-client'
import Link from 'next/link'
import { ArrowLeft, ChevronRight, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchOpsInterviews } from '@/(shell)/_lib/recruiter-data'
import { isLiveRequisitionStatus } from '@/(shell)/_lib/requisition-status'
import { fetchRequisitionsPipelineStats, statsFor } from '@/(shell)/_lib/requisition-pipeline-stats'
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

  const { data: requisitions } = useQuery({
    queryKey: ['client-requisitions', id],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/ops/clients/{client_id}/requisitions', {
        params: { path: { client_id: id } },
      })
      if (error) throw error
      return data
    },
  })
  const reqs = requisitions ?? []

  const { data: statsById = new Map() } = useQuery({
    queryKey: ['ops-requisitions-pipeline-stats'],
    queryFn: fetchRequisitionsPipelineStats,
  })

  const { data: interviews = [] } = useQuery({
    queryKey: ['ops-interviews', 'all'],
    queryFn: () => fetchOpsInterviews('all'),
  })

  const reqIds = useMemo(() => new Set(reqs.map((r) => r.id)), [reqs])
  const inInterviewCount = interviews.filter(
    (i) => i.status === 'scheduled' && i.requisition_id && reqIds.has(i.requisition_id),
  ).length

  const openReqs = reqs.filter((r) => isLiveRequisitionStatus(r.status)).length
  const shortlistTotal = reqs.reduce((sum, r) => sum + statsFor(statsById, r.id).shortlist_total, 0)
  const submittedTotal = reqs.reduce((sum, r) => sum + statsFor(statsById, r.id).submitted, 0)

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">Client not found.</p>
      </div>
    )
  }

  return (
    <div className="overflow-y-auto px-6 py-6">
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/ops/clients" className="hover:text-foreground">
          Ops clients
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="font-semibold text-foreground">{data.name}</span>
      </div>

      {/* Page header */}
      <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
        <h1 className="flex flex-wrap items-center gap-2 text-xl font-semibold">
          {data.name}
          <ClientStatusPill status={data.status} />
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/ops/requisitions?client_id=${id}`}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-3.5" />
            New requisition
          </Link>
          <Link
            href="/ops/clients"
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-border bg-card px-3 text-sm font-medium hover:bg-muted"
          >
            <ArrowLeft className="size-3.5" />
            Back to clients
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-3 mb-6 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-[#ECEAE4] pt-3 text-[13px]">
        <span className="font-medium">
          {openReqs} open requisition{openReqs === 1 ? '' : 's'}
        </span>
        <span className="text-muted-foreground">{shortlistTotal} on shortlists</span>
        <Stat dotTone="#386CA0" label={`${submittedTotal} submitted to client`} />
        <Stat dotTone="#317A4F" label={`${inInterviewCount} in interview`} />
      </div>

      <ClientFields client={data} />
      <ClientRequisitions clientId={id} />
      <ClientNotes clientId={id} />
    </div>
  )
}

function Stat({ label, dotTone }: { label: string; dotTone: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="size-1.5 rounded-full" style={{ backgroundColor: dotTone }} />
      {label}
    </span>
  )
}

function ClientStatusPill({ status }: { status: string }) {
  const live = status === 'active'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-[5px] rounded-full border px-2 py-[3px] text-[11px] font-medium',
        live
          ? 'border-[#D3E2D7] bg-[#EFF4EF] text-[#317A4F]'
          : 'border-border bg-secondary text-muted-foreground',
      )}
    >
      <span className="size-[5px] rounded-full bg-current" />
      {status}
    </span>
  )
}
